/**
 * Fix RLS Policies in Supabase Postgres
 * Adds permissive read policies so that web app users can view the seeded catalog and branches.
 * Rule 2 Mandate: Resides strictly inside _technical_support/scripts/
 */

const postgres = require('../../packages/db/node_modules/postgres');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error('DATABASE_URL is required.');

const sql = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
});

const tables = [
  'companies',
  'branches',
  'categories',
  'items',
  'suppliers',
  'supplier_items',
  'company_users',
  'alerts',
];

async function fixPolicies() {
  console.log('--- Configuring RLS Policies for Stocky Public Tables ---');
  try {
    for (const table of tables) {
      console.log(`Configuring policies for public.${table}...`);
      await sql.unsafe(`
        ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow read access for all users" ON public.${table};
        CREATE POLICY "Allow read access for all users" ON public.${table}
          FOR SELECT
          USING (true);

        DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.${table};
        CREATE POLICY "Allow full access for authenticated users" ON public.${table}
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
      `);
    }

    console.log('✅ RLS policies successfully applied to all tables!');
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to configure policies:', err);
    await sql.end();
    process.exit(1);
  }
}

fixPolicies();
