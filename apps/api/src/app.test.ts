import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import {
  DEVELOPMENT_USER_ID,
  DevelopmentAuthAdapter,
} from './auth/development-auth-adapter.js';
import { createInMemoryProfileRepository } from './profile/profile-repository.js';
import { createInMemoryNutritionRepository } from './nutrition/nutrition-repository.js';
import { createInMemoryStepRepository } from './steps/step-repository.js';
import { MockFoodAnalysisProvider } from './analysis/analysis-provider.js';
import { createInMemoryWorkoutRepository } from './workout/workout-repository.js';

describe('health endpoint', () => {
  it('reports API availability without domain dependencies', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    await app.close();
  });

  it('rejects malformed JSON without exposing internals', async () => {
    const app = buildApp({
      profiles: createInMemoryProfileRepository({
        profile: testProfile(DEVELOPMENT_USER_ID),
        goal: null,
      }),
    });
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/profile',
      headers: { 'content-type': 'application/json' },
      payload: '{broken',
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty('error');
    await app.close();
  });
});

describe('workout routes', () => {
  it('lists, starts, persists set progress, and rejects stale completion', async () => {
    const workouts = createInMemoryWorkoutRepository();
    const app = buildApp({ workouts });
    const listed = await app.inject({ method: 'GET', url: '/v1/workouts' });
    expect(listed.statusCode).toBe(200);
    const template = listed.json().workouts[0];
    const started = await app.inject({
      method: 'POST',
      url: '/v1/workout-sessions',
      payload: { workoutId: template.id },
    });
    expect(started.statusCode).toBe(200);
    const session = started.json().session;
    const exercise = session.exercises[0];
    const completed = await app.inject({
      method: 'POST',
      url: `/v1/workout-sessions/${session.id}/sets/complete`,
      payload: {
        sessionExerciseId: exercise.id,
        setNumber: 1,
        revision: 0,
        requestKey: 'route-set-1',
      },
    });
    expect(completed.statusCode).toBe(200);
    expect(completed.json().session.revision).toBe(1);
    const resumed = await app.inject({
      method: 'GET',
      url: `/v1/workout-sessions/${session.id}`,
    });
    expect(resumed.json().session.exercises[0].sets[0].status).toBe(
      'completed',
    );
    const stale = await app.inject({
      method: 'POST',
      url: `/v1/workout-sessions/${session.id}/sets/complete`,
      payload: {
        sessionExerciseId: exercise.id,
        setNumber: 2,
        revision: 0,
        requestKey: 'route-set-2',
      },
    });
    expect(stale.statusCode).toBe(409);
    await app.close();
  });

  it('does not expose a session to another authenticated owner', async () => {
    const workouts = createInMemoryWorkoutRepository();
    const first = buildApp({ workouts });
    const template = (
      await first.inject({ method: 'GET', url: '/v1/workouts' })
    ).json().workouts[0];
    const session = (
      await first.inject({
        method: 'POST',
        url: '/v1/workout-sessions',
        payload: { workoutId: template.id },
      })
    ).json().session;
    await first.close();
    const second = buildApp({
      auth: { getCurrentUser: async () => ({ id: crypto.randomUUID() }) },
      workouts,
    });
    const response = await second.inject({
      method: 'GET',
      url: `/v1/workout-sessions/${session.id}`,
    });
    expect(response.statusCode).toBe(404);
    await second.close();
  });
});

describe('authentication boundary', () => {
  it('returns unauthorized when the adapter has no user', async () => {
    const app = buildApp({
      auth: { getCurrentUser: async () => null },
      profiles: createInMemoryProfileRepository({
        profile: testProfile(DEVELOPMENT_USER_ID),
        goal: null,
      }),
      nutrition: createInMemoryNutritionRepository(),
      steps: createInMemoryStepRepository(),
      analysis: new MockFoodAnalysisProvider(),
    });
    for (const request of [
      { method: 'GET', url: '/v1/profile' },
      { method: 'GET', url: '/v1/foods' },
      { method: 'GET', url: '/v1/steps' },
      {
        method: 'POST',
        url: '/v1/food-analysis/upload',
        payload: {
          mediaType: 'image/jpeg',
          bytesBase64: 'aW1hZ2U=',
          sizeBytes: 5,
        },
      },
    ] as const) {
      expect((await app.inject(request)).statusCode).toBe(401);
    }
    await app.close();
  });

  it('ignores client-provided user identifiers', async () => {
    const nutrition = createInMemoryNutritionRepository();
    const app = buildApp({
      nutrition,
      profiles: createInMemoryProfileRepository({
        profile: testProfile(DEVELOPMENT_USER_ID),
        goal: null,
      }),
    });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/foods',
      payload: {
        userId: crypto.randomUUID(),
        name: 'Injected identity',
        calories: 10,
        proteinGrams: 0,
        carbohydrateGrams: 0,
        fatGrams: 0,
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().food.userId).toBe(DEVELOPMENT_USER_ID);
    await app.close();
  });
});

describe('development profile endpoint', () => {
  it('uses the seeded development identity', async () => {
    const profile = {
      userId: DEVELOPMENT_USER_ID,
      timezone: 'UTC',
      locale: 'en',
      units: 'metric',
      age: null,
      sex: null,
      heightCm: null,
      weightKgHundredths: null,
      activityLevel: 'moderate',
      goal: 'maintain',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const app = buildApp({
      auth: new DevelopmentAuthAdapter(),
      profiles: createInMemoryProfileRepository({ profile, goal: null }),
    });

    const response = await app.inject({ method: 'GET', url: '/v1/profile' });

    expect(response.statusCode).toBe(200);
    expect(response.json().profile.userId).toBe(DEVELOPMENT_USER_ID);
    await app.close();
  });

  it('updates a valid profile', async () => {
    const app = buildApp({
      auth: new DevelopmentAuthAdapter(),
      profiles: createInMemoryProfileRepository({
        profile: {
          userId: DEVELOPMENT_USER_ID,
          timezone: 'UTC',
          locale: 'en',
          units: 'metric',
          age: 30,
          sex: 'male',
          heightCm: 180,
          weightKgHundredths: 8000,
          activityLevel: 'moderate',
          goal: 'maintain',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        goal: null,
      }),
    });
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/profile',
      payload: { age: 31, goal: 'lose' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().profile.age).toBe(31);
    await app.close();
  });

  it('rejects invalid timezone and effective dates', async () => {
    const app = buildApp({
      profiles: createInMemoryProfileRepository({
        profile: testProfile(DEVELOPMENT_USER_ID),
        goal: null,
      }),
    });
    expect(
      (
        await app.inject({
          method: 'PATCH',
          url: '/v1/profile',
          payload: { timezone: '../not-a-timezone' },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: 'PATCH',
          url: '/v1/nutrition-goal',
          payload: { effectiveDate: '2026-99-99', calorieTarget: 2000 },
        })
      ).statusCode,
    ).toBe(400);
    await app.close();
  });

  it('rejects invalid profile input', async () => {
    const app = buildApp({
      profiles: createInMemoryProfileRepository({
        profile: {
          userId: DEVELOPMENT_USER_ID,
          timezone: 'UTC',
          locale: 'en',
          units: 'metric',
          age: null,
          sex: null,
          heightCm: null,
          weightKgHundredths: null,
          activityLevel: 'moderate',
          goal: 'maintain',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        goal: null,
      }),
    });
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/profile',
      payload: { age: 999 },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('validation_error');
    await app.close();
  });

  it('returns a calculated goal explanation and accepts a manual override', async () => {
    const app = buildApp({
      profiles: createInMemoryProfileRepository({
        profile: {
          userId: DEVELOPMENT_USER_ID,
          timezone: 'UTC',
          locale: 'en',
          units: 'metric',
          age: 30,
          sex: 'male',
          heightCm: 180,
          weightKgHundredths: 8000,
          activityLevel: 'moderate',
          goal: 'maintain',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        goal: null,
      }),
    });
    const calculated = await app.inject({
      method: 'PATCH',
      url: '/v1/nutrition-goal',
      payload: {},
    });
    expect(calculated.statusCode).toBe(200);
    expect(calculated.json().explanation.method).toBe('mifflin_st_jeor');
    const manual = await app.inject({
      method: 'PATCH',
      url: '/v1/nutrition-goal',
      payload: { calorieTarget: 2100 },
    });
    expect(manual.statusCode).toBe(200);
    expect(manual.json().goal.source).toBe('manual');
    expect(manual.json().explanation.method).toBe('manual_override');
    await app.close();
  });

  it('returns not found for a user without a profile', async () => {
    const app = buildApp({
      auth: new DevelopmentAuthAdapter('00000000-0000-4000-8000-000000000099'),
      profiles: createInMemoryProfileRepository({
        profile: {
          userId: DEVELOPMENT_USER_ID,
          timezone: 'UTC',
          locale: 'en',
          units: 'metric',
          age: null,
          sex: null,
          heightCm: null,
          weightKgHundredths: null,
          activityLevel: 'moderate',
          goal: 'maintain',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        goal: null,
      }),
    });
    const response = await app.inject({
      method: 'GET',
      url: '/v1/nutrition-goal',
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'profile_not_found' });
    await app.close();
  });
});

const testProfile = (userId: string) => ({
  userId,
  timezone: 'UTC',
  locale: 'en',
  units: 'metric',
  age: null,
  sex: null,
  heightCm: null,
  weightKgHundredths: null,
  activityLevel: 'moderate',
  goal: 'maintain',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('nutrition and step routes', () => {
  it('creates and lists foods, with not-found meal ownership protection', async () => {
    const nutrition = createInMemoryNutritionRepository();
    const profiles = createInMemoryProfileRepository({
      profile: testProfile(DEVELOPMENT_USER_ID),
      goal: null,
    });
    const app = buildApp({ profiles, nutrition });
    const created = await app.inject({
      method: 'POST',
      url: '/v1/foods',
      payload: {
        name: 'Banana',
        calories: 89.12,
        proteinGrams: 1.1,
        carbohydrateGrams: 22.8,
        fatGrams: 0.3,
      },
    });
    expect(created.statusCode).toBe(200);
    expect(created.json().food.caloriesHundredths).toBe(8912);
    expect(
      (await app.inject({ method: 'GET', url: '/v1/foods' })).json().foods,
    ).toHaveLength(1);
    const missing = await app.inject({
      method: 'PATCH',
      url: `/v1/meals/${crypto.randomUUID()}`,
      payload: { name: 'Nope' },
    });
    expect(missing.statusCode).toBe(404);
    const invalidFood = await app.inject({
      method: 'POST',
      url: '/v1/foods',
      payload: {
        name: '',
        calories: -1,
        proteinGrams: 0,
        carbohydrateGrams: 0,
        fatGrams: 0,
      },
    });
    expect(invalidFood.statusCode).toBe(400);
    const invalidDate = await app.inject({
      method: 'GET',
      url: '/v1/meals?date=not-a-date',
    });
    expect(invalidDate.statusCode).toBe(400);
    const invalidMeal = await app.inject({
      method: 'POST',
      url: '/v1/meals',
      payload: {
        name: 'Invalid',
        eatenAt: 'not-a-date',
        items: [],
      },
    });
    expect(invalidMeal.statusCode).toBe(400);
    await app.close();
  });

  it('creates, replaces, totals, and deletes a meal through the API', async () => {
    const nutrition = createInMemoryNutritionRepository();
    const app = buildApp({
      profiles: createInMemoryProfileRepository({
        profile: testProfile(DEVELOPMENT_USER_ID),
        goal: null,
      }),
      nutrition,
    });
    const first = await nutrition.createFood(DEVELOPMENT_USER_ID, {
      name: 'Rice',
      calories: 100,
      proteinGrams: 2,
      carbohydrateGrams: 20,
      fatGrams: 1,
    });
    const second = await nutrition.createFood(DEVELOPMENT_USER_ID, {
      name: 'Beans',
      calories: 80,
      proteinGrams: 5,
      carbohydrateGrams: 12,
      fatGrams: 1,
    });
    const created = await app.inject({
      method: 'POST',
      url: '/v1/meals',
      payload: {
        name: 'Lunch',
        eatenAt: '2026-01-01T12:00:00.000Z',
        items: [{ foodId: first.id, quantity: 1.5 }],
      },
    });
    expect(created.statusCode).toBe(200);
    const id = created.json().meal.meal.id;
    const updated = await app.inject({
      method: 'PATCH',
      url: `/v1/meals/${id}`,
      payload: {
        name: 'Updated lunch',
        items: [{ foodId: second.id, quantity: 2 }],
      },
    });
    expect(updated.json().meal.items).toHaveLength(1);
    expect(updated.json().meal.items[0].food.name).toBe('Beans');
    const day = await app.inject({
      method: 'GET',
      url: '/v1/meals?date=2026-01-01',
    });
    expect(day.json().totals.calories).toBe(160);
    expect(
      (await app.inject({ method: 'DELETE', url: `/v1/meals/${id}` }))
        .statusCode,
    ).toBe(204);
    expect(
      (
        await app.inject({ method: 'GET', url: '/v1/meals?date=2026-01-01' })
      ).json().meals,
    ).toHaveLength(0);
    expect(
      (
        await app.inject({
          method: 'PATCH',
          url: '/v1/meals/not-a-uuid',
          payload: { name: 'Invalid' },
        })
      ).statusCode,
    ).toBe(400);
    await app.close();
  });

  it('prevents cross-user food and meal access', async () => {
    const nutrition = createInMemoryNutritionRepository();
    const userA = crypto.randomUUID();
    const userB = crypto.randomUUID();
    const food = await nutrition.createFood(userA, {
      name: 'Private food',
      calories: 100,
      proteinGrams: 1,
      carbohydrateGrams: 2,
      fatGrams: 3,
    });
    const meal = await nutrition.createMeal(userA, {
      name: 'Private meal',
      eatenAt: '2026-01-01T12:00:00.000Z',
      items: [{ foodId: food.id, quantity: 1 }],
    });
    const app = buildApp({
      auth: { getCurrentUser: async () => ({ id: userB }) },
      profiles: createInMemoryProfileRepository({
        profile: testProfile(userB),
        goal: null,
      }),
      nutrition,
    });
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/v1/meals',
          payload: {
            name: 'Stolen',
            eatenAt: '2026-01-01T13:00:00.000Z',
            items: [{ foodId: food.id, quantity: 1 }],
          },
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject({
          method: 'PATCH',
          url: `/v1/meals/${meal.meal.id}`,
          payload: { name: 'Changed' },
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject({ method: 'GET', url: '/v1/meals?date=2026-01-01' })
      ).json().meals,
    ).toHaveLength(0);
    await app.close();
  });

  it('accepts validated client step totals without reading a server sensor', async () => {
    const steps = createInMemoryStepRepository();
    const app = buildApp({
      steps,
    });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/steps/sync',
      payload: {
        day: '2026-01-01',
        steps: 1234,
        source: 'expo-pedometer',
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().steps.steps).toBe(1234);
    const status = await app.inject({ method: 'GET', url: '/v1/steps' });
    expect(status.json().permission).toBe('unknown');
    const lower = await app.inject({
      method: 'POST',
      url: '/v1/steps/sync',
      payload: { day: '2026-01-01', steps: 100, source: 'manual' },
    });
    expect(lower.json().steps.steps).toBe(1234);
    for (const payload of [
      { day: 'bad', steps: 1, source: 'manual' },
      { day: '2026-01-01', steps: -1, source: 'manual' },
      { day: '2026-01-01', steps: 1, source: 'server' },
    ]) {
      expect(
        (await app.inject({ method: 'POST', url: '/v1/steps/sync', payload }))
          .statusCode,
      ).toBe(400);
    }
    await app.close();
  });

  it('keeps photo analysis out of meal totals until confirmation', async () => {
    const nutrition = createInMemoryNutritionRepository();
    const app = buildApp({
      profiles: createInMemoryProfileRepository({
        profile: testProfile(DEVELOPMENT_USER_ID),
        goal: null,
      }),
      nutrition,
      analysis: new MockFoodAnalysisProvider(),
    });
    const upload = await app.inject({
      method: 'POST',
      url: '/v1/food-analysis/upload',
      payload: {
        mediaType: 'image/jpeg',
        bytesBase64: 'c2FsYWQ=',
        sizeBytes: 5,
      },
    });
    expect(upload.statusCode).toBe(200);
    const invalidUpload = await app.inject({
      method: 'POST',
      url: '/v1/food-analysis/upload',
      payload: {
        mediaType: 'text/plain',
        bytesBase64: 'not base64!',
        sizeBytes: 4,
      },
    });
    expect(invalidUpload.statusCode).toBe(400);
    const analyzed = await app.inject({
      method: 'POST',
      url: '/v1/food-analysis',
      payload: { temporaryImageId: upload.json().temporaryImageId },
    });
    expect(analyzed.json().confirmed).toBe(false);
    expect(
      (await app.inject({ method: 'GET', url: '/v1/meals' })).json().meals,
    ).toHaveLength(0);
    const confirmed = await app.inject({
      method: 'POST',
      url: '/v1/food-analysis/confirm',
      payload: {
        analysisId: analyzed.json().analysisId,
        result: analyzed.json().result,
        eatenAt: '2026-01-01T12:00:00.000Z',
      },
    });
    expect(confirmed.statusCode).toBe(200);
    expect(confirmed.json().idempotent).toBe(false);
    const repeated = await app.inject({
      method: 'POST',
      url: '/v1/food-analysis/confirm',
      payload: {
        analysisId: analyzed.json().analysisId,
        result: analyzed.json().result,
        eatenAt: '2026-01-01T12:00:00.000Z',
      },
    });
    expect(repeated.statusCode).toBe(200);
    expect(repeated.json().idempotent).toBe(true);
    expect(
      (
        await app.inject({ method: 'GET', url: '/v1/meals?date=2026-01-01' })
      ).json().meals,
    ).toHaveLength(1);
    const discarded = await app.inject({
      method: 'POST',
      url: '/v1/food-analysis/upload',
      payload: {
        mediaType: 'image/jpeg',
        bytesBase64: 'ZGlzY2FyZA==',
        sizeBytes: 7,
      },
    });
    const discardedId = discarded.json().temporaryImageId;
    expect(
      (
        await app.inject({
          method: 'DELETE',
          url: `/v1/food-analysis/image/${discardedId}`,
        })
      ).statusCode,
    ).toBe(204);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/v1/food-analysis',
          payload: { temporaryImageId: discardedId },
        })
      ).statusCode,
    ).toBe(404);
    await app.close();
  });

  it('cleans a temporary image when analysis fails', async () => {
    const app = buildApp({
      nutrition: createInMemoryNutritionRepository(),
      analysis: {
        name: 'failing-test-provider',
        model: 'fixture',
        analyze: async () => {
          throw new Error('provider_failed');
        },
      },
    });
    const upload = await app.inject({
      method: 'POST',
      url: '/v1/food-analysis/upload',
      payload: {
        mediaType: 'image/jpeg',
        bytesBase64: 'ZmFpbHVyZQ==',
        sizeBytes: 7,
      },
    });
    const id = upload.json().temporaryImageId;
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/v1/food-analysis',
          payload: { temporaryImageId: id },
        })
      ).statusCode,
    ).toBe(502);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/v1/food-analysis',
          payload: { temporaryImageId: id },
        })
      ).statusCode,
    ).toBe(404);
    await app.close();
  });
});
