import type { FastifyInstance } from 'fastify';
import { requireCurrentUser, type AuthAdapter } from '../auth/auth-adapter.js';
import type { StepRepository } from './step-repository.js';
import { z } from 'zod';

const syncSchema = z.object({
  day: z.string().date().optional(),
  steps: z.number().int().min(0).max(2_000_000),
  source: z.enum(['expo-pedometer', 'manual']),
});
const querySchema = z.object({ day: z.string().date().optional() });
export function registerStepRoutes(
  app: FastifyInstance,
  dependencies: {
    auth: AuthAdapter;
    steps: StepRepository;
  },
) {
  app.get('/v1/steps', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success)
      return reply.code(400).send({ error: 'validation_error' });
    const day = parsed.data.day ?? new Date().toISOString().slice(0, 10);
    const userId = (await requireCurrentUser(dependencies.auth)).id;
    const stored = await dependencies.steps.get(userId, day);
    return {
      day,
      steps: stored?.steps ?? 0,
      // Sensor permission is device-local; the API cannot inspect a phone sensor.
      permission: 'unknown',
      source: stored?.source ?? 'none',
    };
  });
  app.post('/v1/steps/sync', async (request, reply) => {
    const parsed = syncSchema.safeParse(request.body);
    if (!parsed.success)
      return reply
        .code(400)
        .send({ error: 'validation_error', issues: parsed.error.issues });
    const day = parsed.data.day ?? new Date().toISOString().slice(0, 10);
    const userId = (await requireCurrentUser(dependencies.auth)).id;
    return {
      steps: await dependencies.steps.sync(
        userId,
        day,
        parsed.data.steps,
        parsed.data.source,
      ),
    };
  });
}
