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

describe('health endpoint', () => {
  it('reports API availability without domain dependencies', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
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
      payload: { imageUri: 'file:///tmp/salad.jpg' },
    });
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
        imageUrl: 'file:///tmp/salad.jpg',
        result: analyzed.json().result,
        eatenAt: '2026-01-01T12:00:00.000Z',
      },
    });
    expect(confirmed.statusCode).toBe(200);
    await app.close();
  });
});
