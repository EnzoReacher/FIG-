import { z } from 'zod';

const nonNegative = z.number().finite().min(0).max(100000);
export const foodInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  calories: nonNegative,
  proteinGrams: nonNegative,
  carbohydrateGrams: nonNegative,
  fatGrams: nonNegative,
});
export const mealItemInputSchema = z.object({
  foodId: z.string().uuid(),
  quantity: z.number().finite().positive().max(100000),
});
export const mealInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  eatenAt: z.string().datetime({ offset: true }),
  items: z.array(mealItemInputSchema).min(1).max(100),
});
export const mealPatchSchema = mealInputSchema
  .partial()
  .extend({ items: z.array(mealItemInputSchema).min(1).max(100).optional() });

export const toHundredths = (value: number) => Math.round(value * 100);
export const fromHundredths = (value: number) => value / 100;
