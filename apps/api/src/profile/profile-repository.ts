import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { nutritionGoals, profiles } from '../db/schema.js';

export interface ProfileView {
  profile: typeof profiles.$inferSelect;
  goal: typeof nutritionGoals.$inferSelect | null;
}

export interface ProfileRepository {
  get(userId: string): Promise<ProfileView | null>;
}

export function createProfileRepository(db: Database): ProfileRepository {
  return {
    async get(userId) {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);
      if (!profile) return null;

      const [goal] = await db
        .select()
        .from(nutritionGoals)
        .where(eq(nutritionGoals.userId, userId))
        .orderBy(
          desc(nutritionGoals.effectiveDate),
          desc(nutritionGoals.createdAt),
        )
        .limit(1);

      return { profile, goal: goal ?? null };
    },
  };
}

export function createInMemoryProfileRepository(
  view: ProfileView,
): ProfileRepository {
  return {
    async get(userId) {
      return view.profile.userId === userId ? view : null;
    },
  };
}
