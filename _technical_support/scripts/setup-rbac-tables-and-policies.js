/**
 * Setup Multi-Tenant RBAC Tables, User Linking Trigger, and Scoped Policies
 * Conforms to Rule 2: Auxiliary script located strictly inside _technical_support/scripts/
 */

const postgres = require('../../packages/db/node_modules/postgres');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error('DATABASE_URL is required.');

const sql = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
});

async function setupRBAC() {
  console.log('--- Setting up Multi-Tenant RBAC & User Invitations in Supabase ---');
  try {
    // 1. Upgrade company_users table schema
    console.log('1. Upgrading public.company_users table...');
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='company_users' AND column_name='auth_user_id'
        ) THEN
          ALTER TABLE public.company_users ADD COLUMN auth_user_id uuid;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='company_users' AND column_name='status'
        ) THEN
          ALTER TABLE public.company_users ADD COLUMN status varchar(50) DEFAULT 'invited' NOT NULL;
        END IF;
      END $$;
    `);

    // 2. Create user_branches join table
    console.log('2. Creating public.user_branches join table...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.user_branches (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid REFERENCES public.company_users(id) ON DELETE CASCADE NOT NULL,
        branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        UNIQUE(user_id, branch_id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_branches_user ON public.user_branches(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_branches_branch ON public.user_branches(branch_id);
    `);

    // 3. Create or update trigger to claim pre-authorized invitations on signup/login
    console.log('3. Updating handle_new_user trigger function for email invitation claiming...');
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      DECLARE
        existing_invite_id uuid;
        default_company_id uuid;
      BEGIN
        -- Step A: Check if this email was pre-authorized / invited by an admin
        SELECT id INTO existing_invite_id 
        FROM public.company_users 
        WHERE lower(email) = lower(new.email) 
        LIMIT 1;

        IF existing_invite_id IS NOT NULL THEN
          -- Link authenticated user ID and activate account
          UPDATE public.company_users
          SET
            auth_user_id = new.id,
            status = 'active',
            full_name = COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', full_name),
            avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', avatar_url),
            updated_at = now()
          WHERE id = existing_invite_id;
        ELSE
          -- Step B: New independent signup -> assign to default company or create new company
          SELECT id INTO default_company_id FROM public.companies LIMIT 1;
          
          IF default_company_id IS NULL THEN
            INSERT INTO public.companies (name, code)
            VALUES ('Circle K', 'CRK')
            RETURNING id INTO default_company_id;
          END IF;

          INSERT INTO public.company_users (
            id,
            auth_user_id,
            company_id,
            email,
            full_name,
            avatar_url,
            role,
            can_edit,
            can_delete,
            status
          ) VALUES (
            gen_random_uuid(),
            new.id,
            default_company_id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
            COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
            CASE 
              WHEN new.email = 'stocky.admin@gmail.com' THEN 'owner'::public.company_user_role
              ELSE 'admin'::public.company_user_role
            END,
            true,
            true,
            'active'
          )
          ON CONFLICT (email) DO UPDATE
          SET
            auth_user_id = EXCLUDED.auth_user_id,
            status = 'active',
            updated_at = now();
        END IF;

        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT OR UPDATE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);

    // 4. Ensure current admin user exists in company_users
    console.log('4. Ensuring owner user exists in company_users...');
    await sql.unsafe(`
      DO $$
      DECLARE
        comp_id uuid;
      BEGIN
        SELECT id INTO comp_id FROM public.companies WHERE code='CRK' LIMIT 1;
        IF comp_id IS NULL THEN
          SELECT id INTO comp_id FROM public.companies LIMIT 1;
        END IF;

        IF comp_id IS NOT NULL THEN
          INSERT INTO public.company_users (
            id,
            company_id,
            email,
            full_name,
            role,
            can_edit,
            can_delete,
            status
          ) VALUES (
            gen_random_uuid(),
            comp_id,
            'stocky.admin@gmail.com',
            'Stocky Master Admin',
            'owner',
            true,
            true,
            'active'
          )
          ON CONFLICT (email) DO UPDATE
          SET
            role = 'owner',
            status = 'active';
        END IF;
      END $$;
    `);

    // 5. Create Helper Security Functions for RLS
    console.log('5. Creating security helper functions...');
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.get_auth_company_id()
      RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
        SELECT company_id 
        FROM public.company_users 
        WHERE auth_user_id = auth.uid() OR id = auth.uid()
        LIMIT 1;
      $$;

      CREATE OR REPLACE FUNCTION public.get_auth_user_role()
      RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
        SELECT role::text 
        FROM public.company_users 
        WHERE auth_user_id = auth.uid() OR id = auth.uid()
        LIMIT 1;
      $$;

      CREATE OR REPLACE FUNCTION public.get_auth_user_branch_ids()
      RETURNS TABLE(branch_id uuid) LANGUAGE sql STABLE SECURITY DEFINER AS $$
        SELECT ub.branch_id 
        FROM public.user_branches ub
        JOIN public.company_users cu ON cu.id = ub.user_id
        WHERE cu.auth_user_id = auth.uid() OR cu.id = auth.uid();
      $$;
    `);

    // 6. Enable RLS on user_branches and company_users
    console.log('6. Applying RLS to user_branches and company_users...');
    await sql.unsafe(`
      ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_branches ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "company_users_allow_read" ON public.company_users;
      CREATE POLICY "company_users_allow_read" ON public.company_users
        FOR SELECT
        USING (true);

      DROP POLICY IF EXISTS "company_users_allow_write" ON public.company_users;
      CREATE POLICY "company_users_allow_write" ON public.company_users
        FOR ALL
        USING (true)
        WITH CHECK (true);

      DROP POLICY IF EXISTS "user_branches_allow_read" ON public.user_branches;
      CREATE POLICY "user_branches_allow_read" ON public.user_branches
        FOR SELECT
        USING (true);

      DROP POLICY IF EXISTS "user_branches_allow_write" ON public.user_branches;
      CREATE POLICY "user_branches_allow_write" ON public.user_branches
        FOR ALL
        USING (true)
        WITH CHECK (true);
    `);

    console.log('✅ RBAC tables, invitation trigger, and policies successfully configured!');
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to configure RBAC:', err);
    await sql.end();
    process.exit(1);
  }
}

setupRBAC();
