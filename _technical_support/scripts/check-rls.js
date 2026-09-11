const postgres = require('../../packages/db/node_modules/postgres');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const sql = postgres(
  databaseUrl,
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
