import type { FastifyInstance } from 'fastify';
import type { AuthAdapter } from '../auth/auth-adapter.js';
import type { NutritionRepository } from '../nutrition/nutrition-repository.js';
import type { FoodAnalysisProvider } from './analysis-provider.js';
import { analysisResultSchema } from './analysis-provider.js';
import { z } from 'zod';

const uploadSchema = z.object({
  imageUri: z.string().url().or(z.string().startsWith('file://')),
});
const temporaryImages = new Map<string, string>();
export function registerAnalysisRoutes(
  app: FastifyInstance,
  dependencies: {
    auth: AuthAdapter;
    provider: FoodAnalysisProvider;
    nutrition: NutritionRepository;
  },
) {
  app.post('/v1/food-analysis/upload', async (request, reply) => {
    const parsed = uploadSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.code(400).send({ error: 'image_required' });
    const temporaryImageId = crypto.randomUUID();
    temporaryImages.set(temporaryImageId, parsed.data.imageUri);
    return {
      temporaryImageId,
      expiresAfter: 'analysis_or_confirmation',
    };
  });
  app.post('/v1/food-analysis', async (request, reply) => {
    const body = request.body as {
      imageUrl?: string;
      temporaryImageId?: string;
    };
    const imageUrl = body?.temporaryImageId
      ? temporaryImages.get(body.temporaryImageId)
      : body?.imageUrl;
    if (!imageUrl) return reply.code(400).send({ error: 'image_required' });
    const result = await dependencies.provider.analyze(imageUrl);
    if (body.temporaryImageId) temporaryImages.delete(body.temporaryImageId);
    return {
      result: analysisResultSchema.parse(result),
      confirmed: false,
      temporaryImageDeleted: Boolean(body.temporaryImageId),
    };
  });
  app.post('/v1/food-analysis/confirm', async (request, reply) => {
    const body = request.body as {
      imageUrl?: string;
      temporaryImageId?: string;
      result?: unknown;
      eatenAt?: string;
    };
    const parsed = analysisResultSchema.safeParse(body?.result);
    if (!parsed.success)
      return reply
        .code(400)
        .send({ error: 'invalid_analysis', issues: parsed.error.issues });
    if (!body.eatenAt)
      return reply.code(400).send({ error: 'confirmation_data_required' });
    const userId = (await dependencies.auth.getCurrentUser()).id;
    const food = await dependencies.nutrition.createFood(userId, parsed.data);
    const meal = await dependencies.nutrition.createMeal(userId, {
      name: parsed.data.name,
      eatenAt: body.eatenAt,
      items: [{ foodId: food.id, quantity: 1 }],
    });
    if (body.temporaryImageId) temporaryImages.delete(body.temporaryImageId);
    return { meal, temporaryImageDeleted: true };
  });
}
