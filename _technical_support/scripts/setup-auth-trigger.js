const postgres = require('../../packages/db/node_modules/postgres');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const sql = postgres(
  databaseUrl,
  { prepare: false, ssl: 'require' }
);

async function setupTrigger() {
  console.log('--- Setting up Auth User Sync Trigger in Supabase Postgres ---');
  try {
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
          COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
          CASE 
            WHEN new.email = 'stocky.admin@gmail.com' THEN 'admin'::public.user_role
            ELSE 'staff'::public.user_role
          END
        )
        ON CONFLICT (id) DO UPDATE
        SET
          email = EXCLUDED.email,
          full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
          avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
          updated_at = now();
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT OR UPDATE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);

    console.log('✅ Trigger on_auth_user_created successfully installed!');
    await sql.end();
  } catch (err) {
    console.error('❌ Failed to set up trigger:', err);
    await sql.end();
  }
}

setupTrigger();
