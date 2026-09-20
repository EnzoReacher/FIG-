import {
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
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

export const schema = {
  users,
  profiles,
  nutritionGoals,
  foods,
  meals,
  mealItems,
};

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type Food = typeof foods.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type MealItem = typeof mealItems.$inferSelect;
