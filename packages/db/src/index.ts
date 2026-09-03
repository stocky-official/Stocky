import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.qwgpykxjzgqbdzakhchm:50yfVTT4uUxVsY1z@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

/**
 * PostgreSQL connection client.
 * NOTE: For Supabase transaction mode pooler (port 6543),
 * `prepare: false` is required because PgBouncer does not support prepared statements.
 */
const client = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
});

export const db = drizzle(client, { schema });

export * from './schema';
export * from 'drizzle-orm';
