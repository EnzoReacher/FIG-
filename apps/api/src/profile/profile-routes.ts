import type { FastifyInstance } from 'fastify';
import type { AuthAdapter } from '../auth/auth-adapter.js';
import type { ProfileRepository } from './profile-repository.js';

export function registerProfileRoutes(
  app: FastifyInstance,
  dependencies: { auth: AuthAdapter; profiles: ProfileRepository },
) {
  app.get('/v1/profile', async (_request, reply) => {
    const user = await dependencies.auth.getCurrentUser();
    const view = await dependencies.profiles.get(user.id);

    if (!view) {
      return reply.code(404).send({ error: 'profile_not_found' });
    }

    return { profile: view.profile, goal: view.goal };
  });
}
