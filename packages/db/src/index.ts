import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is required to initialize the Stocky database client. ' +
      'Set it in the server environment; never embed database credentials in source code.'
  );
}

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
