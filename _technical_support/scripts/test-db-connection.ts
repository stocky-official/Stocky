/**
 * Technical Support Script: Test Database Connection & Probe Supabase
 *
 * Usage:
 *   npx tsx _technical_support/scripts/test-db-connection.ts
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment from packages/db/.env
dotenv.config({ path: path.resolve(__dirname, '../../packages/db/.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error('DATABASE_URL is required.');

console.log('--- Testing Supabase Database Connection ---');
console.log('Host: aws-1-eu-west-1.pooler.supabase.com (Port 6543, Shared Pooler)');
console.log('Database: postgres');

const sql = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
  connect_timeout: 10,
});

async function main() {
  try {
    const result = await sql`SELECT version(), current_database(), current_user;`;
    console.log('✅ Connection Successful!');
    console.log('Database Info:', result[0]);

    // Check existing tables in public schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log('Public Schema Tables:', tables.map((t: any) => t.table_name));

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection Failed:', error);
    await sql.end();
    process.exit(1);
  }
}

main();
