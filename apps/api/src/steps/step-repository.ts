import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { dailySteps } from '../db/schema.js';
export interface StepRepository {
  get(
    userId: string,
    day: string,
  ): Promise<typeof dailySteps.$inferSelect | null>;
  sync(
    userId: string,
    day: string,
    steps: number,
    source?: string,
  ): Promise<typeof dailySteps.$inferSelect>;
}
export function createStepRepository(db: Database): StepRepository {
  return {
    async get(userId, day) {
      const [row] = await db
        .select()
        .from(dailySteps)
        .where(and(eq(dailySteps.userId, userId), eq(dailySteps.day, day)));
      return row ?? null;
    },
    async sync(userId, day, steps, source = 'pedometer') {
      const [row] = await db
        .insert(dailySteps)
        .values({ userId, day, steps, source })
        .onConflictDoUpdate({
          target: [dailySteps.userId, dailySteps.day],
          set: {
            steps: sql`GREATEST(${dailySteps.steps}, EXCLUDED.steps)`,
            source: sql`CASE WHEN EXCLUDED.steps > ${dailySteps.steps} THEN EXCLUDED.source ELSE ${dailySteps.source} END`,
            updatedAt: sql`CASE WHEN EXCLUDED.steps > ${dailySteps.steps} THEN NOW() ELSE ${dailySteps.updatedAt} END`,
          },
        })
        .returning();
      return row;
    },
  };
}
export function createInMemoryStepRepository(): StepRepository {
  const rows = new Map<string, typeof dailySteps.$inferSelect>();
  return {
    async get(userId, day) {
      return rows.get(`${userId}:${day}`) ?? null;
    },
    async sync(userId, day, steps, source = 'pedometer') {
      const key = `${userId}:${day}`;
      const current = rows.get(key);
      if (current && current.steps >= steps) return current;
      const row = {
        userId,
        day,
        steps,
        source,
        updatedAt: new Date(),
      } as typeof dailySteps.$inferSelect;
      rows.set(key, row);
      return row;
    },
  };
}
