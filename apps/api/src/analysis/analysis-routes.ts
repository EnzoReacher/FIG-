import type { FastifyInstance } from 'fastify';
import { requireCurrentUser, type AuthAdapter } from '../auth/auth-adapter.js';
import type { NutritionRepository } from '../nutrition/nutrition-repository.js';
import type { FoodAnalysisProvider } from './analysis-provider.js';
import {
  analysisResultSchema,
  FoodAnalysisProviderError,
  providerInputSchema,
} from './analysis-provider.js';
import { createAnalysisReviewStore } from './analysis-review-store.js';
import { createTemporaryImageStore } from './temporary-image-store.js';
import { z } from 'zod';

const uploadSchema = providerInputSchema;
const analyzeSchema = z.object({ temporaryImageId: z.string().uuid() });
const confirmSchema = z.object({
  analysisId: z.string().uuid(),
  result: analysisResultSchema,
  eatenAt: z.string().datetime({ offset: true }),
});

export function registerAnalysisRoutes(
  app: FastifyInstance,
  dependencies: {
    auth: AuthAdapter;
    provider: FoodAnalysisProvider;
    nutrition: NutritionRepository;
  },
) {
  const temporaryImages = createTemporaryImageStore();
  const reviews = createAnalysisReviewStore();
  app.post('/v1/food-analysis/upload', async (request, reply) => {
    const parsed = uploadSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.code(400).send({ error: 'invalid_image_upload' });
    const ownerId = (await requireCurrentUser(dependencies.auth)).id;
    const image = temporaryImages.put({ ownerId, ...parsed.data });
    return {
      temporaryImageId: image.id,
      expiresAt: new Date(image.expiresAt).toISOString(),
    };
  });
  app.post('/v1/food-analysis', async (request, reply) => {
    const parsed = analyzeSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.code(400).send({ error: 'invalid_analysis_request' });
    const ownerId = (await requireCurrentUser(dependencies.auth)).id;
    const image = temporaryImages.take(parsed.data.temporaryImageId, ownerId);
    if (!image)
      return reply.code(404).send({ error: 'temporary_image_not_found' });
    try {
      const result = analysisResultSchema.parse(
        await dependencies.provider.analyze({
          mediaType: image.mediaType,
          bytesBase64: image.bytesBase64,
          sizeBytes: image.sizeBytes,
        }),
      );
      const review = reviews.put(ownerId, result);
      return {
        analysisId: review.id,
        expiresAt: new Date(review.expiresAt).toISOString(),
        result,
        reviewStatus: review.status,
        confirmed: false,
        temporaryImageDeleted: true,
      };
    } catch (error) {
      const normalized =
        error instanceof FoodAnalysisProviderError
          ? error.code
          : error instanceof z.ZodError
            ? 'invalid_output'
            : 'provider_failed';
      return reply.code(502).send({ error: normalized });
    }
  });
  app.delete(
    '/v1/food-analysis/image/:temporaryImageId',
    async (request, reply) => {
      const ownerId = (await requireCurrentUser(dependencies.auth)).id;
      temporaryImages.delete(
        (request.params as { temporaryImageId: string }).temporaryImageId,
        ownerId,
      );
      return reply.code(204).send();
    },
  );
  app.delete('/v1/food-analysis/:analysisId', async (request, reply) => {
    const ownerId = (await requireCurrentUser(dependencies.auth)).id;
    const discarded = reviews.discard(
      (request.params as { analysisId: string }).analysisId,
      ownerId,
    );
    return discarded
      ? reply.code(204).send()
      : reply.code(404).send({ error: 'analysis_not_found' });
  });
  app.post('/v1/food-analysis/confirm', async (request, reply) => {
    const parsed = confirmSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.code(400).send({ error: 'invalid_confirmation' });
    const ownerId = (await requireCurrentUser(dependencies.auth)).id;
    const review = reviews.get(parsed.data.analysisId, ownerId);
    if (!review || review.status === 'discarded')
      return reply.code(404).send({ error: 'analysis_not_found' });
    if (review.status === 'confirmed')
      return { meal: review.meal, confirmed: true, idempotent: true };
    if (review.status === 'confirming')
      return reply.code(409).send({ error: 'confirmation_in_progress' });
    reviews.claim(parsed.data.analysisId, ownerId);
    try {
      const food = await dependencies.nutrition.createFood(
        ownerId,
        parsed.data.result,
      );
      const meal = await dependencies.nutrition.createMeal(ownerId, {
        name: parsed.data.result.name,
        eatenAt: parsed.data.eatenAt,
        items: [{ foodId: food.id, quantity: 1 }],
      });
      reviews.confirm(parsed.data.analysisId, ownerId, meal);
      return { meal, confirmed: true, idempotent: false };
    } catch (error) {
      reviews.release(parsed.data.analysisId, ownerId);
      throw error;
    }
  });
}
