import Fastify from 'fastify';
import { DevelopmentAuthAdapter } from './auth/development-auth-adapter.js';
import { registerProfileRoutes } from './profile/profile-routes.js';
import type { ProfileRepository } from './profile/profile-repository.js';

export function buildApp(dependencies?: {
  auth?: DevelopmentAuthAdapter;
  profiles?: ProfileRepository;
}) {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ status: 'ok' as const }));

  if (dependencies?.profiles) {
    registerProfileRoutes(app, {
      auth: dependencies.auth ?? new DevelopmentAuthAdapter(),
      profiles: dependencies.profiles,
    });
  }

  return app;
}
