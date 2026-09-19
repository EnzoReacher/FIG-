import 'dotenv/config';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { seedDevelopmentUser } from './seed.js';

const connectionString =
  process.env.DATABASE_URL ??
  'postgres://forge:forge@localhost:5432/forge_gym_health';
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  await seedDevelopmentUser(db);
  console.log('Database migrations applied.');
} finally {
  await client.end();
}
