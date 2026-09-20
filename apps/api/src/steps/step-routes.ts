import type { FastifyInstance } from 'fastify';
import type { AuthAdapter } from '../auth/auth-adapter.js';
import type { StepRepository } from './step-repository.js';
import type { StepSource } from './step-source.js';
export function registerStepRoutes(
  app: FastifyInstance,
  dependencies: {
    auth: AuthAdapter;
    steps: StepRepository;
    source: StepSource;
  },
) {
  app.get('/v1/steps', async (request) => {
    const day =
      (request.query as { day?: string }).day ??
      new Date().toISOString().slice(0, 10);
    const userId = (await dependencies.auth.getCurrentUser()).id;
    const stored = await dependencies.steps.get(userId, day);
    return {
      day,
      steps: stored?.steps ?? 0,
      permission: await dependencies.source.permission(),
      source: stored?.source ?? 'none',
    };
  });
  app.post('/v1/steps/sync', async (request, reply) => {
    const day =
      (request.body as { day?: string }).day ??
      new Date().toISOString().slice(0, 10);
    const permission = await dependencies.source.permission();
    if (permission !== 'granted')
      return reply.code(403).send({
        error:
          permission === 'unavailable'
            ? 'steps_unavailable'
            : 'steps_permission_denied',
        permission,
      });
    const userId = (await dependencies.auth.getCurrentUser()).id;
    return {
      steps: await dependencies.steps.sync(
        userId,
        day,
        await dependencies.source.stepsForDay(day),
      ),
    };
  });
}
