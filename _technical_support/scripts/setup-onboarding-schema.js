/**
 * Setup Onboarding Schema & Storage Policies for stocky-private Bucket
 * Conforms to Rule 2: Resides strictly inside _technical_support/scripts/
 */

const postgres = require('../../packages/db/node_modules/postgres');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.qwgpykxjzgqbdzakhchm:50yfVTT4uUxVsY1z@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

const sql = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
  connect_timeout: 30,
  max: 1,
});

async function setupOnboarding() {
  console.log('--- Setting up Onboarding Schema & Storage Policies ---');
  try {
    // 1. Add logo_url column to public.companies
    console.log('1. Adding logo_url column to public.companies...');
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='companies' AND column_name='logo_url'
        ) THEN
          ALTER TABLE public.companies ADD COLUMN logo_url text;
        END IF;
      END $$;
    `);

    // 2. Ensure stocky-private bucket exists in storage.buckets
    console.log('2. Ensuring stocky-private bucket exists in storage.buckets...');
    await sql.unsafe(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('stocky-private', 'stocky-private', false)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Configure storage.objects RLS policies
    console.log('3. Configuring storage.objects RLS policies...');
    await sql.unsafe(`
      DROP POLICY IF EXISTS "stocky_private_allow_insert" ON storage.objects;
      CREATE POLICY "stocky_private_allow_insert" ON storage.objects
        FOR INSERT
        TO public
        WITH CHECK (bucket_id = 'stocky-private');

      DROP POLICY IF EXISTS "stocky_private_allow_select" ON storage.objects;
      CREATE POLICY "stocky_private_allow_select" ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'stocky-private');

      DROP POLICY IF EXISTS "stocky_private_allow_update" ON storage.objects;
      CREATE POLICY "stocky_private_allow_update" ON storage.objects
        FOR UPDATE
        TO public
        USING (bucket_id = 'stocky-private')
        WITH CHECK (bucket_id = 'stocky-private');

      DROP POLICY IF EXISTS "stocky_private_allow_delete" ON storage.objects;
      CREATE POLICY "stocky_private_allow_delete" ON storage.objects
        FOR DELETE
        TO public
        USING (bucket_id = 'stocky-private');
    `);

    console.log('✅ Onboarding schema & storage policies successfully configured!');
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to setup onboarding schema:', err);
    await sql.end();
    process.exit(1);
  }
}

setupOnboarding();
