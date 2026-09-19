import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgres://forge:forge@localhost:5432/forge_gym_health',
  },
});
