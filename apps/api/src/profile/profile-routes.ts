import type { FastifyInstance } from 'fastify';
import { requireCurrentUser, type AuthAdapter } from '../auth/auth-adapter.js';
import type { ProfileRepository } from './profile-repository.js';
import {
  nutritionGoalPatchSchema,
  profilePatchSchema,
} from './profile-validation.js';

const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} as const;

function explanation(profile: any, override?: number) {
  if (override !== undefined)
    return {
      method: 'manual_override',
      calculatedTarget: null,
      adjustment: null,
      activityMultiplier: null,
    };
  if (
    !profile.age ||
    !profile.heightCm ||
    !profile.weightKgHundredths ||
    !profile.sex
  )
    return null;
  const weight = profile.weightKgHundredths / 100;
  const bmr =
    10 * weight +
    6.25 * profile.heightCm -
    5 * profile.age +
    (profile.sex === 'male' ? 5 : -161);
  const multiplier =
    activityFactors[profile.activityLevel as keyof typeof activityFactors];
  const adjustment =
    profile.goal === 'lose' ? -500 : profile.goal === 'gain' ? 300 : 0;
  return {
    method: 'mifflin_st_jeor',
    bmr: Math.round(bmr),
    activityMultiplier: multiplier,
    adjustment,
    calculatedTarget: Math.max(
      1200,
      Math.round((bmr * multiplier + adjustment) / 50) * 50,
    ),
  };
}

function goalResponse(profile: any, goal: any) {
  return goal
    ? {
        goal,
        explanation: explanation(
          profile,
          goal.source === 'manual' ? goal.calorieTarget : undefined,
        ),
      }
    : { goal: null, explanation: explanation(profile) };
}

function validationError(reply: any, error: { issues: unknown[] }) {
  return reply
    .code(400)
    .send({ error: 'validation_error', issues: error.issues });
}

export function registerProfileRoutes(
  app: FastifyInstance,
  dependencies: { auth: AuthAdapter; profiles: ProfileRepository },
) {
  app.get('/v1/profile', async (_request, reply) => {
    const view = await dependencies.profiles.get(
      (await requireCurrentUser(dependencies.auth)).id,
    );
    return view
      ? { profile: view.profile, goal: view.goal }
      : reply.code(404).send({ error: 'profile_not_found' });
  });

  app.patch('/v1/profile', async (request, reply) => {
    const parsed = profilePatchSchema.safeParse(request.body);
    if (!parsed.success) return validationError(reply, parsed.error);
    const view = await dependencies.profiles.updateProfile(
      (await requireCurrentUser(dependencies.auth)).id,
      parsed.data,
    );
    return view
      ? { profile: view.profile, goal: view.goal }
      : reply.code(404).send({ error: 'profile_not_found' });
  });

  app.get('/v1/nutrition-goal', async (_request, reply) => {
    const view = await dependencies.profiles.get(
      (await requireCurrentUser(dependencies.auth)).id,
    );
    return view
      ? goalResponse(view.profile, view.goal)
      : reply.code(404).send({ error: 'profile_not_found' });
  });

  app.patch('/v1/nutrition-goal', async (request, reply) => {
    const parsed = nutritionGoalPatchSchema.safeParse(request.body);
    if (!parsed.success) return validationError(reply, parsed.error);
    const userId = (await requireCurrentUser(dependencies.auth)).id;
    const current = await dependencies.profiles.get(userId);
    if (!current) return reply.code(404).send({ error: 'profile_not_found' });
    const calculated = explanation(current.profile);
    if (!parsed.data.calorieTarget && !current.goal && !calculated)
      return reply.code(422).send({ error: 'profile_data_required' });
    const calorieTarget =
      parsed.data.calorieTarget ??
      calculated?.calculatedTarget ??
      current.goal?.calorieTarget;
    if (!calorieTarget)
      return reply.code(422).send({ error: 'calorie_target_required' });
    const protein =
      parsed.data.proteinTargetGrams ??
      (current.goal
        ? current.goal.proteinTargetHundredths / 100
        : current.profile.weightKgHundredths
          ? (current.profile.weightKgHundredths / 100) * 1.6
          : (calorieTarget * 0.3) / 4);
    const fat =
      parsed.data.fatTargetGrams ??
      (current.goal
        ? current.goal.fatTargetHundredths / 100
        : (calorieTarget * 0.3) / 9);
    const carbs =
      parsed.data.carbohydrateTargetGrams ??
      (current.goal
        ? current.goal.carbohydrateTargetHundredths / 100
        : Math.max(0, (calorieTarget - protein * 4 - fat * 9) / 4));
    const view = await dependencies.profiles.updateGoal(userId, {
      userId,
      effectiveDate:
        parsed.data.effectiveDate ?? new Date().toISOString().slice(0, 10),
      calorieTarget: Math.round(calorieTarget),
      proteinTargetHundredths: Math.round(protein * 100),
      carbohydrateTargetHundredths: Math.round(carbs * 100),
      fatTargetHundredths: Math.round(fat * 100),
      source: parsed.data.calorieTarget ? 'manual' : 'calculated',
    });
    return view
      ? goalResponse(view.profile, view.goal)
      : reply.code(404).send({ error: 'profile_not_found' });
  });
}
