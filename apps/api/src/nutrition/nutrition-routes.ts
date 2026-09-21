import type { FastifyInstance } from 'fastify';
import type { AuthAdapter } from '../auth/auth-adapter.js';
import type { ProfileRepository } from '../profile/profile-repository.js';
import type { NutritionRepository } from './nutrition-repository.js';
import {
  foodInputSchema,
  mealInputSchema,
  mealPatchSchema,
} from './nutrition-validation.js';

function dayBounds(day: string, timezone: string) {
  const start = new Date(`${day}T00:00:00`);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(start);
  const localDay = `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}-${parts.find((p) => p.type === 'day')!.value}`;
  const offset = start.getTime() - new Date(`${localDay}T00:00:00Z`).getTime();
  return {
    start: new Date(new Date(`${day}T00:00:00Z`).getTime() + offset),
    end: new Date(new Date(`${day}T00:00:00Z`).getTime() + offset + 86400000),
  };
}
const invalid = (reply: any, error: any) =>
  reply.code(400).send({ error: 'validation_error', issues: error.issues });
export function registerNutritionRoutes(
  app: FastifyInstance,
  dependencies: {
    auth: AuthAdapter;
    profiles: ProfileRepository;
    nutrition: NutritionRepository;
  },
) {
  app.post('/v1/foods', async (request, reply) => {
    const parsed = foodInputSchema.safeParse(request.body);
    if (!parsed.success) return invalid(reply, parsed.error);
    return {
      food: await dependencies.nutrition.createFood(
        (await dependencies.auth.getCurrentUser()).id,
        parsed.data,
      ),
    };
  });
  app.get('/v1/foods', async () => {
    const userId = (await dependencies.auth.getCurrentUser()).id;
    return { foods: await dependencies.nutrition.listFoods(userId) };
  });
  app.post('/v1/meals', async (request, reply) => {
    const parsed = mealInputSchema.safeParse(request.body);
    if (!parsed.success) return invalid(reply, parsed.error);
    try {
      return {
        meal: await dependencies.nutrition.createMeal(
          (await dependencies.auth.getCurrentUser()).id,
          parsed.data,
        ),
      };
    } catch (e) {
      if (e instanceof Error && e.message === 'food_not_found')
        return reply.code(404).send({ error: 'food_not_found' });
      throw e;
    }
  });
  app.get('/v1/meals', async (request, reply) => {
    const query = request.query as { date?: string };
    const userId = (await dependencies.auth.getCurrentUser()).id;
    const profile = await dependencies.profiles.get(userId);
    if (!profile) return reply.code(404).send({ error: 'profile_not_found' });
    const date =
      query.date ??
      new Intl.DateTimeFormat('en-CA', {
        timeZone: profile.profile.timezone,
      }).format(new Date());
    const bounds = dayBounds(date, profile.profile.timezone);
    const meals = await dependencies.nutrition.listMeals(
      userId,
      bounds.start,
      bounds.end,
    );
    return { date, meals, totals: dependencies.nutrition.totals(meals) };
  });
  app.patch('/v1/meals/:id', async (request, reply) => {
    const parsed = mealPatchSchema.safeParse(request.body);
    if (!parsed.success) return invalid(reply, parsed.error);
    const meal = await dependencies.nutrition.updateMeal(
      (await dependencies.auth.getCurrentUser()).id,
      (request.params as { id: string }).id,
      parsed.data,
    );
    return meal ? { meal } : reply.code(404).send({ error: 'meal_not_found' });
  });
  app.delete('/v1/meals/:id', async (request, reply) => {
    const ok = await dependencies.nutrition.deleteMeal(
      (await dependencies.auth.getCurrentUser()).id,
      (request.params as { id: string }).id,
    );
    return ok
      ? reply.code(204).send()
      : reply.code(404).send({ error: 'meal_not_found' });
  });
}
