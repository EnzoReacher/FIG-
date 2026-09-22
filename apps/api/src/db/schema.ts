import { sql } from 'drizzle-orm';
import {
  date,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const profiles = pgTable('profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  timezone: varchar('timezone', { length: 64 }).notNull(),
  locale: varchar('locale', { length: 16 }).notNull().default('en'),
  units: varchar('units', { length: 16 }).notNull().default('metric'),
  age: integer('age'),
  sex: varchar('sex', { length: 32 }),
  heightCm: integer('height_cm'),
  weightKgHundredths: integer('weight_kg_hundredths'),
  activityLevel: varchar('activity_level', { length: 32 }).notNull(),
  goal: varchar('goal', { length: 32 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const nutritionGoals = pgTable('nutrition_goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  effectiveDate: date('effective_date').notNull(),
  calorieTarget: integer('calorie_target').notNull(),
  proteinTargetHundredths: integer('protein_target_hundredths').notNull(),
  carbohydrateTargetHundredths: integer(
    'carbohydrate_target_hundredths',
  ).notNull(),
  fatTargetHundredths: integer('fat_target_hundredths').notNull(),
  source: varchar('source', { length: 16 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const foods = pgTable('foods', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 160 }).notNull(),
  caloriesHundredths: integer('calories_hundredths').notNull(),
  proteinHundredths: integer('protein_hundredths').notNull(),
  carbohydrateHundredths: integer('carbohydrate_hundredths').notNull(),
  fatHundredths: integer('fat_hundredths').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const meals = pgTable('meals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 80 }).notNull(),
  eatenAt: timestamp('eaten_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const mealItems = pgTable('meal_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  mealId: uuid('meal_id')
    .notNull()
    .references(() => meals.id, { onDelete: 'cascade' }),
  foodId: uuid('food_id')
    .notNull()
    .references(() => foods.id),
  quantityHundredths: integer('quantity_hundredths').notNull(),
  caloriesHundredths: integer('calories_hundredths').notNull(),
  proteinHundredths: integer('protein_hundredths').notNull(),
  carbohydrateHundredths: integer('carbohydrate_hundredths').notNull(),
  fatHundredths: integer('fat_hundredths').notNull(),
});

export const dailySteps = pgTable(
  'daily_steps',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    steps: integer('steps').notNull(),
    source: varchar('source', { length: 16 }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userDayUnique: unique('daily_steps_user_id_day_unique').on(
      table.userId,
      table.day,
    ),
  }),
);

export const workoutSessions = pgTable(
  'workout_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    routineId: varchar('routine_id', { length: 160 }).notNull(),
    title: varchar('title', { length: 160 }).notNull(),
    summary: text('summary').notNull(),
    goal: varchar('goal', { length: 32 }).notNull(),
    experience: varchar('experience', { length: 32 }).notNull(),
    trainingDays: integer('training_days').notNull(),
    equipment: text('equipment').array().notNull(),
    status: varchar('status', { length: 16 }).notNull(),
    revision: integer('revision').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    ownerStatus: index('workout_sessions_user_id_status_idx').on(
      table.userId,
      table.status,
    ),
    activeOwner: uniqueIndex('workout_sessions_one_active_user_idx')
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
  }),
);

export const workoutSessionExercises = pgTable(
  'workout_session_exercises',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    exerciseId: varchar('exercise_id', { length: 100 }).notNull(),
    order: integer('exercise_order').notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    targetMuscles: text('target_muscles').array().notNull(),
    equipment: varchar('equipment', { length: 32 }).notNull(),
    instructions: text('instructions').array().notNull(),
    safetyNotes: text('safety_notes').array().notNull(),
    defaultSets: integer('default_sets').notNull(),
    defaultReps: varchar('default_reps', { length: 64 }).notNull(),
    restSeconds: integer('rest_seconds').notNull(),
  },
  (table) => ({
    sessionOrder: uniqueIndex('workout_session_exercises_session_order_idx').on(
      table.sessionId,
      table.order,
    ),
    ownerSession: index('workout_session_exercises_user_session_idx').on(
      table.userId,
      table.sessionId,
    ),
  }),
);

export const workoutSessionSets = pgTable(
  'workout_session_sets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    sessionExerciseId: uuid('session_exercise_id')
      .notNull()
      .references(() => workoutSessionExercises.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    completed: boolean('completed').notNull().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    requestKey: varchar('request_key', { length: 128 }),
  },
  (table) => ({
    exerciseSet: uniqueIndex('workout_session_sets_exercise_set_idx').on(
      table.sessionExerciseId,
      table.setNumber,
    ),
    requestKey: uniqueIndex('workout_session_sets_session_request_idx').on(
      table.sessionId,
      table.requestKey,
    ),
    ownerSession: index('workout_session_sets_user_session_idx').on(
      table.userId,
      table.sessionId,
    ),
  }),
);

export const schema = {
  users,
  profiles,
  nutritionGoals,
  foods,
  meals,
  mealItems,
  dailySteps,
  workoutSessions,
  workoutSessionExercises,
  workoutSessionSets,
};

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type Food = typeof foods.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type MealItem = typeof mealItems.$inferSelect;
export type DailySteps = typeof dailySteps.$inferSelect;
export type WorkoutSessionRow = typeof workoutSessions.$inferSelect;
export type WorkoutSessionExerciseRow =
  typeof workoutSessionExercises.$inferSelect;
export type WorkoutSessionSetRow = typeof workoutSessionSets.$inferSelect;
