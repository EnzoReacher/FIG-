import type { FastifyInstance } from 'fastify';
import type { AuthAdapter } from '../auth/auth-adapter.js';
import type { NutritionRepository } from '../nutrition/nutrition-repository.js';
import type { FoodAnalysisProvider } from './analysis-provider.js';
import { analysisResultSchema } from './analysis-provider.js';
export function registerAnalysisRoutes(
  app: FastifyInstance,
  dependencies: {
    auth: AuthAdapter;
    provider: FoodAnalysisProvider;
    nutrition: NutritionRepository;
  },
) {
  app.post('/v1/food-analysis', async (request, reply) => {
    const body = request.body as { imageUrl?: string };
    if (!body?.imageUrl)
      return reply.code(400).send({ error: 'image_required' });
    const result = await dependencies.provider.analyze(body.imageUrl);
    return {
      imageUrl: body.imageUrl,
      result: analysisResultSchema.parse(result),
      confirmed: false,
    };
  });
  app.post('/v1/food-analysis/confirm', async (request, reply) => {
    const body = request.body as {
      imageUrl?: string;
      result?: unknown;
      eatenAt?: string;
    };
    const parsed = analysisResultSchema.safeParse(body?.result);
    if (!parsed.success)
      return reply
        .code(400)
        .send({ error: 'invalid_analysis', issues: parsed.error.issues });
    if (!body.eatenAt || !body.imageUrl)
      return reply.code(400).send({ error: 'confirmation_data_required' });
    const userId = (await dependencies.auth.getCurrentUser()).id;
    const food = await dependencies.nutrition.createFood(userId, parsed.data);
    const meal = await dependencies.nutrition.createMeal(userId, {
      name: parsed.data.name,
      eatenAt: body.eatenAt,
      items: [{ foodId: food.id, quantity: 1 }],
    });
    return { meal, temporaryImageDeleted: true };
  });
}
