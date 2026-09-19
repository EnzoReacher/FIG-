import 'dotenv/config';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';

const connectionString =
  process.env.DATABASE_URL ??
  'postgres://forge:forge@localhost:5432/forge_gym_health';
const client = postgres(connectionString, { max: 1 });

try {
  await migrate(drizzle(client), { migrationsFolder: './src/db/migrations' });
  console.log('Database migrations applied.');
} finally {
  await client.end();
}
