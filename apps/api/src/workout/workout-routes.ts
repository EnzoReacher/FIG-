import type { FastifyInstance } from 'fastify';
import {
  completeSetInputSchema,
  sessionIdSchema,
  completeWorkoutInputSchema,
  workoutIdSchema,
} from '@forge/contracts';
import { requireCurrentUser, type AuthAdapter } from '../auth/auth-adapter.js';
import {
  WorkoutConflictError,
  WorkoutInvalidTransitionError,
  WorkoutNotFoundError,
  type WorkoutRepository,
} from './workout-repository.js';

function errorResponse(
  reply: { code: (status: number) => { send: (body: unknown) => unknown } },
  error: unknown,
) {
  if (error instanceof WorkoutNotFoundError)
    return reply.code(404).send({ error: error.code });
  if (error instanceof WorkoutConflictError)
    return reply.code(409).send({ error: error.code });
  if (error instanceof WorkoutInvalidTransitionError)
    return reply.code(422).send({ error: error.code });
  throw error;
}

export function registerWorkoutRoutes(
  app: FastifyInstance,
  dependencies: { auth: AuthAdapter; workouts: WorkoutRepository },
) {
  app.get('/v1/workouts', async () => ({
    workouts: await dependencies.workouts.listTemplates(),
  }));
  app.get('/v1/workouts/:id', async (request, reply) => {
    const parsed = workoutIdSchema.safeParse(
      (request.params as { id?: string }).id,
    );
    if (!parsed.success)
      return reply.code(400).send({ error: 'validation_error' });
    const workout = await dependencies.workouts.getTemplate(parsed.data);
    return workout
      ? { workout }
      : reply.code(404).send({ error: 'workout_not_found' });
  });
  app.post('/v1/workout-sessions', async (request, reply) => {
    const body = request.body as { workoutId?: unknown };
    if (typeof body?.workoutId !== 'string')
      return reply.code(400).send({ error: 'validation_error' });
    try {
      return {
        session: await dependencies.workouts.startSession(
          (await requireCurrentUser(dependencies.auth)).id,
          body.workoutId,
        ),
      };
    } catch (error) {
      return errorResponse(reply, error);
    }
  });
  app.get('/v1/workout-sessions/:id', async (request, reply) => {
    const id = (request.params as { id?: string }).id;
    if (!sessionIdSchema.safeParse(id).success)
      return reply.code(400).send({ error: 'validation_error' });
    const session = await dependencies.workouts.getSession(
      (await requireCurrentUser(dependencies.auth)).id,
      id!,
    );
    return session
      ? { session }
      : reply.code(404).send({ error: 'workout_not_found' });
  });
  app.post('/v1/workout-sessions/:id/sets/complete', async (request, reply) => {
    const sessionId = (request.params as { id?: string }).id;
    const parsedId = sessionIdSchema.safeParse(sessionId);
    const parsed = completeSetInputSchema.safeParse(request.body);
    if (!parsedId.success || !parsed.success)
      return reply.code(400).send({ error: 'validation_error' });
    try {
      return {
        session: await dependencies.workouts.completeSet(
          (await requireCurrentUser(dependencies.auth)).id,
          parsedId.data,
          parsed.data,
        ),
      };
    } catch (error) {
      return errorResponse(reply, error);
    }
  });
  app.post('/v1/workout-sessions/:id/complete', async (request, reply) => {
    const sessionId = (request.params as { id?: string }).id;
    const parsedId = sessionIdSchema.safeParse(sessionId);
    const parsed = completeWorkoutInputSchema.safeParse(request.body);
    if (!parsedId.success || !parsed.success)
      return reply.code(400).send({ error: 'validation_error' });
    try {
      return {
        session: await dependencies.workouts.completeWorkout(
          (await requireCurrentUser(dependencies.auth)).id,
          parsedId.data,
          parsed.data.revision,
        ),
      };
    } catch (error) {
      return errorResponse(reply, error);
    }
  });
}
