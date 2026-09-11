const postgres = require('../../packages/db/node_modules/postgres');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const sql = postgres(
  databaseUrl,
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
