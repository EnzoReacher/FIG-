import type { FastifyInstance } from 'fastify';
import type { AuthAdapter } from '../auth/auth-adapter.js';
import type { ProfileRepository } from '../profile/profile-repository.js';
import type { NutritionRepository } from './nutrition-repository.js';
import {
  foodInputSchema,
  mealInputSchema,
  mealPatchSchema,
} from './nutrition-validation.js';
import { z } from 'zod';

const daySchema = z.string().date();
function zonedMidnight(day: string, timezone: string) {
  const utcGuess = new Date(`${day}T00:00:00.000Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const values = Object.fromEntries(
    formatter
      .formatToParts(utcGuess)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  const represented = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second,
  );
  return new Date(utcGuess.getTime() - (represented - utcGuess.getTime()));
}
function nextDay(day: string) {
  const date = new Date(`${day}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
export function dayBounds(day: string, timezone: string) {
  return {
    start: zonedMidnight(day, timezone),
    end: zonedMidnight(nextDay(day), timezone),
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
    const parsedDate = daySchema.safeParse(date);
    if (!parsedDate.success) return invalid(reply, parsedDate.error);
    const bounds = dayBounds(parsedDate.data, profile.profile.timezone);
    const meals = await dependencies.nutrition.listMeals(
      userId,
      bounds.start,
      bounds.end,
    );
    return {
      date: parsedDate.data,
      meals,
      totals: dependencies.nutrition.totals(meals),
    };
  });
  app.patch('/v1/meals/:id', async (request, reply) => {
    const parsed = mealPatchSchema.safeParse(request.body);
    if (!parsed.success) return invalid(reply, parsed.error);
    let meal;
    try {
      meal = await dependencies.nutrition.updateMeal(
        (await dependencies.auth.getCurrentUser()).id,
        (request.params as { id: string }).id,
        parsed.data,
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'food_not_found')
        return reply.code(404).send({ error: 'food_not_found' });
      throw error;
    }
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
