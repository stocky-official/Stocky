/**
 * Create performance indexes on public.items in Supabase Postgres
 * Rule 2 Mandate: Resides in _technical_support/scripts/
 */

const postgres = require('../../packages/db/node_modules/postgres');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error('DATABASE_URL is required.');

const sql = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
});

async function createIndexes() {
  console.log('--- Creating PostgreSQL Indexes for 31,488 items ---');
  try {
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS idx_items_branch_id ON public.items(branch_id);
      CREATE INDEX IF NOT EXISTS idx_items_category_name ON public.items(category_name);
      CREATE INDEX IF NOT EXISTS idx_items_name ON public.items(name);
      CREATE INDEX IF NOT EXISTS idx_items_barcode ON public.items(barcode);
      CREATE INDEX IF NOT EXISTS idx_items_company_id ON public.items(company_id);
    `);
    console.log('✅ Indexes successfully created!');
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create indexes:', err);
    await sql.end();
    process.exit(1);
  }
}

createIndexes();
