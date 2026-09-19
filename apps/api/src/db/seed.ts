import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type postgres from 'postgres';
import { DEVELOPMENT_USER_ID } from '../auth/development-auth-adapter.js';
import { nutritionGoals, profiles, users } from './schema.js';

type SeedDatabase = PostgresJsDatabase<Record<string, never>>;

export async function seedDevelopmentUser(db: SeedDatabase) {
  await db
    .insert(users)
    .values({ id: DEVELOPMENT_USER_ID })
    .onConflictDoNothing();
  await db
    .insert(profiles)
    .values({
      userId: DEVELOPMENT_USER_ID,
      timezone: 'UTC',
      locale: 'en',
      units: 'metric',
      activityLevel: 'moderate',
      goal: 'maintain',
    })
    .onConflictDoNothing();

  const [existingGoal] = await db
    .select({ id: nutritionGoals.id })
    .from(nutritionGoals)
    .where(eq(nutritionGoals.userId, DEVELOPMENT_USER_ID))
    .limit(1);

  if (!existingGoal) {
    await db.insert(nutritionGoals).values({
      userId: DEVELOPMENT_USER_ID,
      effectiveDate: '2026-01-01',
      calorieTarget: 2000,
      proteinTargetHundredths: 15000,
      carbohydrateTargetHundredths: 20000,
      fatTargetHundredths: 6500,
      source: 'calculated',
    });
  }
}
