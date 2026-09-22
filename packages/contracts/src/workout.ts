import { z } from 'zod';

export const workoutGoalSchema = z.enum([
  'strength',
  'general-fitness',
  'confidence',
]);
export const experienceLevelSchema = z.enum(['new', 'returning']);
export const equipmentSchema = z.enum(['bodyweight', 'dumbbells', 'machines']);

export const onboardingInputSchema = z.object({
  goal: workoutGoalSchema,
  experience: experienceLevelSchema,
  trainingDays: z.number().int().min(2).max(5),
  equipment: z.array(equipmentSchema).min(1),
});

export type WorkoutGoal = z.infer<typeof workoutGoalSchema>;
export type ExperienceLevel = z.infer<typeof experienceLevelSchema>;
export type Equipment = z.infer<typeof equipmentSchema>;
export type OnboardingInput = z.infer<typeof onboardingInputSchema>;

export const sessionStatusSchema = z.enum(['active', 'completed']);
export const workoutIdSchema = z.string().min(1).max(160);
export const sessionIdSchema = z.string().uuid();
export const revisionSchema = z.number().int().nonnegative();
export const completeSetInputSchema = z.object({
  sessionExerciseId: z.string().uuid(),
  setNumber: z.number().int().min(1).max(50),
  revision: revisionSchema,
  requestKey: z.string().min(1).max(128),
});
export const completeWorkoutInputSchema = z.object({
  revision: revisionSchema,
});

export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type CompleteSetInput = z.infer<typeof completeSetInputSchema>;
