import 'dotenv/config';
import { DevelopmentAuthAdapter } from './auth/development-auth-adapter.js';
import { buildApp } from './app.js';
import { createDatabase } from './db/client.js';
import { createProfileRepository } from './profile/profile-repository.js';
import { createNutritionRepository } from './nutrition/nutrition-repository.js';
import { createStepRepository } from './steps/step-repository.js';
import { MockStepSource } from './steps/step-source.js';
import { MockFoodAnalysisProvider } from './analysis/analysis-provider.js';

const database = createDatabase();
const app = buildApp({
  auth: new DevelopmentAuthAdapter(),
  profiles: createProfileRepository(database.db),
  nutrition: createNutritionRepository(database.db),
  steps: createStepRepository(database.db),
  stepSource: new MockStepSource(),
  analysis: new MockFoodAnalysisProvider(),
});
const port = Number(process.env.API_PORT ?? 3000);

try {
  await app.listen({ host: '0.0.0.0', port });
} catch (error) {
  app.log.error(error);
  await database.client.end();
  process.exit(1);
}
