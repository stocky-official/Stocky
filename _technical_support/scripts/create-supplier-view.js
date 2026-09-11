/**
 * Create a PostgreSQL View for Suppliers with Aggregated Supplied Items/Categories
 * Rule 2 Mandate: Resides strictly inside _technical_support/scripts/
 */

const postgres = require('../../packages/db/node_modules/postgres');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error('DATABASE_URL is required.');

const sql = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
});

async function createSupplierView() {
  console.log('--- Creating public.suppliers_view in Supabase Postgres ---');
  try {
    await sql.unsafe(`
      CREATE OR REPLACE VIEW public.suppliers_summary AS
      SELECT 
        s.id,
        s.company_id,
        s.name,
        s.contact_name,
        s.contact_phone,
        s.contact_email,
        s.created_at,
        s.updated_at,
        COALESCE(count(si.id), 0)::int as item_count,
        COALESCE(
          array_remove(array_agg(DISTINCT si.item_category), NULL), 
          ARRAY[]::varchar[]
        ) as items_supplied
      FROM public.suppliers s
      LEFT JOIN public.supplier_items si ON s.id = si.supplier_id
      GROUP BY s.id, s.company_id, s.name, s.contact_name, s.contact_phone, s.contact_email, s.created_at, s.updated_at;

      -- Grant permissions on view
      GRANT SELECT ON public.suppliers_summary TO anon, authenticated;
    `);

    console.log('✅ suppliers_summary view created successfully!');

    // Test query
    const rows = await sql`
      SELECT name, contact_name, contact_phone, item_count, items_supplied 
      FROM public.suppliers_summary 
      ORDER BY item_count DESC 
      LIMIT 5;
    `;
    console.log('Top 5 suppliers from view:');
    rows.forEach(r => {
      console.log(` - ${r.name}: ${r.item_count} items | Categories: ${r.items_supplied.join(', ')} | Contact: ${r.contact_name} (${r.contact_phone})`);
    });

    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create supplier view:', err);
    await sql.end();
    process.exit(1);
  }
}

createSupplierView();
