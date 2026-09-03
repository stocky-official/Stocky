const postgres = require('../../packages/db/node_modules/postgres');
const sql = postgres(
  'postgresql://postgres.qwgpykxjzgqbdzakhchm:50yfVTT4uUxVsY1z@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
  { prepare: false, ssl: 'require' }
);

async function run() {
  try {
    const res = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth'`;
    console.log('Auth tables:', res.map(r => r.table_name));
    await sql.end();
  } catch (err) {
    console.error(err);
    await sql.end();
  }
}

run();
