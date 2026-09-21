import Fastify from 'fastify';
import { DevelopmentAuthAdapter } from './auth/development-auth-adapter.js';
import type { AuthAdapter } from './auth/auth-adapter.js';
import { registerProfileRoutes } from './profile/profile-routes.js';
import type { ProfileRepository } from './profile/profile-repository.js';
import { registerNutritionRoutes } from './nutrition/nutrition-routes.js';
import type { NutritionRepository } from './nutrition/nutrition-repository.js';
import type { StepRepository } from './steps/step-repository.js';
import { registerStepRoutes } from './steps/step-routes.js';
import type { FoodAnalysisProvider } from './analysis/analysis-provider.js';
import { registerAnalysisRoutes } from './analysis/analysis-routes.js';

export function buildApp(dependencies?: {
  auth?: AuthAdapter;
  profiles?: ProfileRepository;
  nutrition?: NutritionRepository;
  steps?: StepRepository;
  analysis?: FoodAnalysisProvider;
}) {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ status: 'ok' as const }));

  if (dependencies?.profiles) {
    registerProfileRoutes(app, {
      auth: dependencies.auth ?? new DevelopmentAuthAdapter(),
      profiles: dependencies.profiles,
    });
  }
  if (dependencies?.profiles && dependencies?.nutrition)
    registerNutritionRoutes(app, {
      auth: dependencies.auth ?? new DevelopmentAuthAdapter(),
      profiles: dependencies.profiles,
      nutrition: dependencies.nutrition,
    });
  if (dependencies?.steps)
    registerStepRoutes(app, {
      auth: dependencies.auth ?? new DevelopmentAuthAdapter(),
      steps: dependencies.steps,
    });
  if (dependencies?.nutrition && dependencies?.analysis)
    registerAnalysisRoutes(app, {
      auth: dependencies.auth ?? new DevelopmentAuthAdapter(),
      nutrition: dependencies.nutrition,
      provider: dependencies.analysis,
    });

  return app;
}
