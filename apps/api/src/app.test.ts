import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import {
  DEVELOPMENT_USER_ID,
  DevelopmentAuthAdapter,
} from './auth/development-auth-adapter.js';
import { createInMemoryProfileRepository } from './profile/profile-repository.js';

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
