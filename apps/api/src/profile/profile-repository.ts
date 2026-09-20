import { desc, eq } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { nutritionGoals, profiles } from '../db/schema.js';

export interface ProfileView {
  profile: typeof profiles.$inferSelect;
  goal: typeof nutritionGoals.$inferSelect | null;
}

export interface ProfileRepository {
  get(userId: string): Promise<ProfileView | null>;
  updateProfile(
    userId: string,
    values: Partial<typeof profiles.$inferInsert>,
  ): Promise<ProfileView | null>;
  updateGoal(
    userId: string,
    values: typeof nutritionGoals.$inferInsert,
  ): Promise<ProfileView | null>;
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
    async updateProfile(userId, values) {
      const [profile] = await db
        .update(profiles)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(profiles.userId, userId))
        .returning();
      return profile ? this.get(userId) : null;
    },
    async updateGoal(userId, values) {
      const existing = await this.get(userId);
      if (!existing) return null;
      const [goal] = await db.insert(nutritionGoals).values(values).returning();
      return goal ? { profile: existing.profile, goal } : null;
    },
  };
}

export function createInMemoryProfileRepository(
  view: ProfileView,
): ProfileRepository {
  let current = view;
  return {
    async get(userId) {
      return current.profile.userId === userId ? current : null;
    },
    async updateProfile(userId, values) {
      if (current.profile.userId !== userId) return null;
      current = {
        ...current,
        profile: { ...current.profile, ...values, updatedAt: new Date() },
      };
      return current;
    },
    async updateGoal(userId, values) {
      if (current.profile.userId !== userId) return null;
      current = {
        ...current,
        goal: {
          ...values,
          id: values.id ?? 'in-memory-goal',
          createdAt: new Date(),
        } as typeof current.goal,
      };
      return current;
    },
  };
}
