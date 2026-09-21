import { and, eq, gte, lt } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { foods, mealItems, meals } from '../db/schema.js';
import type { z } from 'zod';
import {
  foodInputSchema,
  mealInputSchema,
  mealPatchSchema,
  toHundredths,
} from './nutrition-validation.js';

export type FoodInput = z.infer<typeof foodInputSchema>;
export type MealInput = z.infer<typeof mealInputSchema>;
export type MealPatch = z.infer<typeof mealPatchSchema>;
export type NutritionTotals = {
  calories: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
};
export type MealView = {
  meal: typeof meals.$inferSelect;
  items: Array<
    typeof mealItems.$inferSelect & { food: typeof foods.$inferSelect }
  >;
};
export interface NutritionRepository {
  createFood(
    userId: string,
    input: FoodInput,
  ): Promise<typeof foods.$inferSelect>;
  listFoods(userId: string): Promise<Array<typeof foods.$inferSelect>>;
  createMeal(userId: string, input: MealInput): Promise<MealView>;
  listMeals(userId: string, start: Date, end: Date): Promise<MealView[]>;
  updateMeal(
    userId: string,
    id: string,
    input: MealPatch,
  ): Promise<MealView | null>;
  deleteMeal(userId: string, id: string): Promise<boolean>;
  totals(meals: MealView[]): NutritionTotals;
}
const fixedFood = (userId: string, input: FoodInput) => ({
  userId,
  name: input.name,
  caloriesHundredths: toHundredths(input.calories),
  proteinHundredths: toHundredths(input.proteinGrams),
  carbohydrateHundredths: toHundredths(input.carbohydrateGrams),
  fatHundredths: toHundredths(input.fatGrams),
});

export function createNutritionRepository(db: Database): NutritionRepository {
  const requireFoods = async (userId: string, inputs: MealInput['items']) => {
    const result = [];
    for (const input of inputs) {
      const [food] = await db
        .select()
        .from(foods)
        .where(and(eq(foods.id, input.foodId), eq(foods.userId, userId)))
        .limit(1);
      if (!food) throw new Error('food_not_found');
      result.push({ input, food });
    }
    return result;
  };
  const getMeal = async (
    userId: string,
    id: string,
  ): Promise<MealView | null> => {
    const [meal] = await db
      .select()
      .from(meals)
      .where(and(eq(meals.userId, userId), eq(meals.id, id)))
      .limit(1);
    if (!meal) return null;
    const rows = await db
      .select({ item: mealItems, food: foods })
      .from(mealItems)
      .innerJoin(foods, eq(mealItems.foodId, foods.id))
      .where(eq(mealItems.mealId, id));
    return {
      meal,
      items: rows.map((row) => ({ ...row.item, food: row.food })),
    };
  };
  const createMealItems = async (
    userId: string,
    mealId: string,
    inputs: MealInput['items'],
  ) => {
    for (const item of inputs) {
      const [food] = await db
        .select()
        .from(foods)
        .where(and(eq(foods.id, item.foodId), eq(foods.userId, userId)))
        .limit(1);
      if (!food) throw new Error('food_not_found');
      await db.insert(mealItems).values({
        mealId,
        foodId: food.id,
        quantityHundredths: toHundredths(item.quantity),
        caloriesHundredths: Math.round(food.caloriesHundredths * item.quantity),
        proteinHundredths: Math.round(food.proteinHundredths * item.quantity),
        carbohydrateHundredths: Math.round(
          food.carbohydrateHundredths * item.quantity,
        ),
        fatHundredths: Math.round(food.fatHundredths * item.quantity),
      });
    }
  };
  return {
    async createFood(userId, input) {
      const [food] = await db
        .insert(foods)
        .values(fixedFood(userId, input))
        .returning();
      return food;
    },
    async listFoods(userId) {
      return db.select().from(foods).where(eq(foods.userId, userId));
    },
    async createMeal(userId, input) {
      const resolvedItems = await requireFoods(userId, input.items);
      const [meal] = await db
        .insert(meals)
        .values({ userId, name: input.name, eatenAt: new Date(input.eatenAt) })
        .returning();
      for (const { input: item, food } of resolvedItems) {
        await db.insert(mealItems).values({
          mealId: meal.id,
          foodId: food.id,
          quantityHundredths: toHundredths(item.quantity),
          caloriesHundredths: Math.round(
            food.caloriesHundredths * item.quantity,
          ),
          proteinHundredths: Math.round(food.proteinHundredths * item.quantity),
          carbohydrateHundredths: Math.round(
            food.carbohydrateHundredths * item.quantity,
          ),
          fatHundredths: Math.round(food.fatHundredths * item.quantity),
        });
      }
      return (await getMeal(userId, meal.id))!;
    },
    async listMeals(userId, start, end) {
      const found = await db
        .select()
        .from(meals)
        .where(
          and(
            eq(meals.userId, userId),
            gte(meals.eatenAt, start),
            lt(meals.eatenAt, end),
          ),
        );
      const result: MealView[] = [];
      for (const meal of found) {
        const view = await getMeal(userId, meal.id);
        if (view) result.push(view);
      }
      return result;
    },
    async updateMeal(userId, id, input) {
      const current = await getMeal(userId, id);
      if (!current) return null;
      if (input.items) await requireFoods(userId, input.items);
      await db
        .update(meals)
        .set({
          ...(input.name ? { name: input.name } : {}),
          ...(input.eatenAt ? { eatenAt: new Date(input.eatenAt) } : {}),
        })
        .where(eq(meals.id, id));
      if (input.items) {
        await db.delete(mealItems).where(eq(mealItems.mealId, id));
        await createMealItems(userId, id, input.items);
      }
      return getMeal(userId, id);
    },
    async deleteMeal(userId, id) {
      const result = await db
        .delete(meals)
        .where(and(eq(meals.userId, userId), eq(meals.id, id)))
        .returning({ id: meals.id });
      return result.length > 0;
    },
    totals(views) {
      const t = views
        .flatMap((v) => v.items)
        .reduce(
          (a, i) => ({
            calories: a.calories + i.caloriesHundredths,
            proteinGrams: a.proteinGrams + i.proteinHundredths,
            carbohydrateGrams: a.carbohydrateGrams + i.carbohydrateHundredths,
            fatGrams: a.fatGrams + i.fatHundredths,
          }),
          { calories: 0, proteinGrams: 0, carbohydrateGrams: 0, fatGrams: 0 },
        );
      return {
        calories: t.calories / 100,
        proteinGrams: t.proteinGrams / 100,
        carbohydrateGrams: t.carbohydrateGrams / 100,
        fatGrams: t.fatGrams / 100,
      };
    },
  };
}

export function createInMemoryNutritionRepository(
  initialFoods: Array<typeof foods.$inferSelect> = [],
): NutritionRepository {
  const foodList = [...initialFoods];
  const mealList: MealView[] = [];
  return {
    async createFood(userId, input) {
      const food = {
        ...fixedFood(userId, input),
        id: crypto.randomUUID(),
        createdAt: new Date(),
      } as typeof foods.$inferSelect;
      foodList.push(food);
      return food;
    },
    async listFoods(userId) {
      return foodList.filter((f) => f.userId === userId);
    },
    async createMeal(userId, input) {
      const items = input.items.map((x) => {
        const food = foodList.find(
          (f) => f.id === x.foodId && f.userId === userId,
        );
        if (!food) throw new Error('food_not_found');
        return {
          id: crypto.randomUUID(),
          mealId: '',
          foodId: food.id,
          quantityHundredths: toHundredths(x.quantity),
          caloriesHundredths: Math.round(food.caloriesHundredths * x.quantity),
          proteinHundredths: Math.round(food.proteinHundredths * x.quantity),
          carbohydrateHundredths: Math.round(
            food.carbohydrateHundredths * x.quantity,
          ),
          fatHundredths: Math.round(food.fatHundredths * x.quantity),
          food,
        };
      });
      const meal = {
        id: crypto.randomUUID(),
        userId,
        name: input.name,
        eatenAt: new Date(input.eatenAt),
        createdAt: new Date(),
      } as typeof meals.$inferSelect;
      const view = {
        meal,
        items: items.map((i) => ({ ...i, mealId: meal.id })),
      };
      mealList.push(view);
      return view;
    },
    async listMeals(userId, start, end) {
      return mealList.filter(
        (m) =>
          m.meal.userId === userId &&
          m.meal.eatenAt >= start &&
          m.meal.eatenAt < end,
      );
    },
    async updateMeal(userId, id, input) {
      const meal = mealList.find(
        (m) => m.meal.id === id && m.meal.userId === userId,
      );
      if (!meal) return null;
      if (input.name) meal.meal.name = input.name;
      if (input.eatenAt) meal.meal.eatenAt = new Date(input.eatenAt);
      if (input.items) {
        const items = input.items.map((item) => {
          const food = foodList.find(
            (candidate) =>
              candidate.id === item.foodId && candidate.userId === userId,
          );
          if (!food) throw new Error('food_not_found');
          return {
            id: crypto.randomUUID(),
            mealId: meal.meal.id,
            foodId: food.id,
            quantityHundredths: toHundredths(item.quantity),
            caloriesHundredths: Math.round(
              food.caloriesHundredths * item.quantity,
            ),
            proteinHundredths: Math.round(
              food.proteinHundredths * item.quantity,
            ),
            carbohydrateHundredths: Math.round(
              food.carbohydrateHundredths * item.quantity,
            ),
            fatHundredths: Math.round(food.fatHundredths * item.quantity),
            food,
          };
        });
        meal.items = items;
      }
      return meal;
    },
    async deleteMeal(userId, id) {
      const i = mealList.findIndex(
        (m) => m.meal.id === id && m.meal.userId === userId,
      );
      if (i < 0) return false;
      mealList.splice(i, 1);
      return true;
    },
    totals(views) {
      return views
        .flatMap((v) => v.items)
        .reduce(
          (a, i) => ({
            calories: a.calories + i.caloriesHundredths / 100,
            proteinGrams: a.proteinGrams + i.proteinHundredths / 100,
            carbohydrateGrams:
              a.carbohydrateGrams + i.carbohydrateHundredths / 100,
            fatGrams: a.fatGrams + i.fatHundredths / 100,
          }),
          { calories: 0, proteinGrams: 0, carbohydrateGrams: 0, fatGrams: 0 },
        );
    },
  };
}
