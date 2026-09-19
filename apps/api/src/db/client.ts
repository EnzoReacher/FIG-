import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { schema } from './schema.js';

export function createDatabase(
  connectionString = process.env.DATABASE_URL ??
    'postgres://forge:forge@localhost:5432/forge_gym_health',
) {
  const client = postgres(connectionString);
  return { client, db: drizzle(client, { schema }) };
}

export type Database = ReturnType<typeof createDatabase>['db'];
