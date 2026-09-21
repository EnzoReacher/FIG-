import { z } from 'zod';

const optionalPositiveInt = z.number().int().positive();

export const profilePatchSchema = z
  .object({
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .refine((timezone) => {
        try {
          new Intl.DateTimeFormat('en', { timeZone: timezone });
          return true;
        } catch {
          return false;
        }
      }, 'Use a valid IANA timezone')
      .optional(),
    locale: z.string().trim().min(2).max(16).optional(),
    units: z.enum(['metric', 'imperial']).optional(),
    age: optionalPositiveInt.max(120).nullable().optional(),
    sex: z.enum(['male', 'female', 'other']).nullable().optional(),
    heightCm: optionalPositiveInt.max(260).nullable().optional(),
    weightKgHundredths: optionalPositiveInt.max(50000).nullable().optional(),
    activityLevel: z
      .enum(['sedentary', 'light', 'moderate', 'active', 'very_active'])
      .optional(),
    goal: z.enum(['lose', 'maintain', 'gain']).optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one profile field is required',
  );

export const nutritionGoalPatchSchema = z
  .object({
    effectiveDate: z.string().date('Use a valid YYYY-MM-DD date').optional(),
    calorieTarget: z.number().int().min(800).max(10000).optional(),
    proteinTargetGrams: z.number().positive().max(1000).optional(),
    carbohydrateTargetGrams: z.number().positive().max(1500).optional(),
    fatTargetGrams: z.number().positive().max(500).optional(),
  })
  .strict();

export type ProfilePatch = z.infer<typeof profilePatchSchema>;
export type NutritionGoalPatch = z.infer<typeof nutritionGoalPatchSchema>;
