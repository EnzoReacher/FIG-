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
});
