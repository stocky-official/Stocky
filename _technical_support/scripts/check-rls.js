const postgres = require('../../packages/db/node_modules/postgres');

const sql = postgres(
  'postgresql://postgres.qwgpykxjzgqbdzakhchm:50yfVTT4uUxVsY1z@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
  { prepare: false, ssl: 'require' }
);

async function checkRLS() {
  console.log('--- Checking RLS status on tables ---');
  const tables = await sql`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public';
  `;
  console.log('Tables and rowsecurity:', tables);

  const policies = await sql`
    SELECT * FROM pg_policies WHERE schemaname = 'public';
  `;
  console.log('Policies:', policies);

  await sql.end();
}

checkRLS();
