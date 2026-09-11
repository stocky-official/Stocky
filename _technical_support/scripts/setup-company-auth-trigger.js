/**
 * Setup Multi-Tenant Auth Trigger in Supabase Postgres
 * Automatically links new Google OAuth signups to a Company and company_users table.
 */

const postgres = require('../../packages/db/node_modules/postgres');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error('DATABASE_URL is required.');

const sql = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
});

async function setupTrigger() {
  console.log('--- Setting up Multi-Tenant Company Auth Trigger in Supabase ---');
  try {
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      DECLARE
        default_company_id uuid;
      BEGIN
        -- Ensure a default company exists or create one for this user
        SELECT id INTO default_company_id FROM public.companies LIMIT 1;
        
        IF default_company_id IS NULL THEN
          INSERT INTO public.companies (name, code)
          VALUES ('Stocky HQ', 'STK-HQ')
          RETURNING id INTO default_company_id;

          -- Add initial branches for the default company
          INSERT INTO public.branches (company_id, name, code, address, phone)
          VALUES 
            (default_company_id, 'Downtown Central Branch', 'BR-01', '10 Tahrir Square, Cairo', '+20 2 2578 9001'),
            (default_company_id, 'Nasr City Hub', 'BR-02', '45 Abbas El Akkad St, Cairo', '+20 2 2270 4500'),
            (default_company_id, 'Alexandria Smouha Store', 'BR-03', '12 Victor Emmanuel Sq, Alex', '+20 3 4200 1122');
        END IF;

        -- Insert or update user in company_users
        INSERT INTO public.company_users (id, company_id, email, full_name, avatar_url, role, can_edit, can_delete)
        VALUES (
          new.id,
          default_company_id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
          COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
          CASE 
            WHEN new.email IN ('overted.technologies@gmail.com', 'stocky.admin@gmail.com') THEN 'owner'::public.company_user_role
            ELSE 'staff'::public.company_user_role
          END,
          true,
          CASE WHEN new.email IN ('overted.technologies@gmail.com', 'stocky.admin@gmail.com') THEN true ELSE false END
        )
        ON CONFLICT (id) DO UPDATE
        SET
          email = EXCLUDED.email,
          full_name = COALESCE(EXCLUDED.full_name, public.company_users.full_name),
          avatar_url = COALESCE(EXCLUDED.avatar_url, public.company_users.avatar_url),
          updated_at = now();
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT OR UPDATE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);

    console.log('✅ Multi-tenant user provisioning trigger successfully installed!');
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to set up trigger:', err);
    await sql.end();
    process.exit(1);
  }
}

setupTrigger();
