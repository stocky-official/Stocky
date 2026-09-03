/**
 * Teardown Script: Drop old prototype tables in Supabase Postgres
 * Rule 2 Mandate: Resides strictly inside _technical_support/scripts/
 */

const postgres = require('../../packages/db/node_modules/postgres');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.qwgpykxjzgqbdzakhchm:50yfVTT4uUxVsY1z@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

const sql = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
});

async function resetSchema() {
  console.log('--- Dropping obsolete prototype tables from Supabase ---');
  try {
    // Drop old tables with cascade
    await sql.unsafe(`
      DROP TABLE IF EXISTS public.supplier_items CASCADE;
      DROP TABLE IF EXISTS public.suppliers CASCADE;
      DROP TABLE IF EXISTS public.stock_alerts CASCADE;
      DROP TABLE IF EXISTS public.alerts CASCADE;
      DROP TABLE IF EXISTS public.stock_movements CASCADE;
      DROP TABLE IF EXISTS public.items CASCADE;
      DROP TABLE IF EXISTS public.categories CASCADE;
      DROP TABLE IF EXISTS public.warehouses CASCADE;
      DROP TABLE IF EXISTS public.branches CASCADE;
      DROP TABLE IF EXISTS public.company_users CASCADE;
      DROP TABLE IF EXISTS public.profiles CASCADE;
      DROP TABLE IF EXISTS public.companies CASCADE;

      DROP TYPE IF EXISTS public.stock_status CASCADE;
      DROP TYPE IF EXISTS public.movement_type CASCADE;
      DROP TYPE IF EXISTS public.alert_severity CASCADE;
      DROP TYPE IF EXISTS public.user_role CASCADE;
      DROP TYPE IF EXISTS public.company_user_role CASCADE;
    `);

    console.log('✅ Old prototype tables and enums successfully dropped!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting schema:', error);
    await sql.end();
    process.exit(1);
  }
}

resetSchema();
