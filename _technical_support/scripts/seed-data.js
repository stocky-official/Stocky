/**
 * Seed Script: Populate initial companies, branches, items, and suppliers
 * Rule 2 Mandate: Resides strictly inside _technical_support/scripts/
 */

const postgres = require('../../packages/db/node_modules/postgres');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.qrxrvfchqxwvfwmszssm:RvDVMIOBshEdzXTE@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

const sql = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
});

async function seedData() {
  console.log('--- Seeding Stocky Initial Data ---');
  try {
    // 1. Create or get Company
    let [company] = await sql`SELECT id FROM public.companies LIMIT 1`;
    if (!company) {
      [company] = await sql`
        INSERT INTO public.companies (name, code)
        VALUES ('Stocky HQ', 'STK-HQ')
        RETURNING id;
      `;
    }
    const companyId = company.id;
    console.log('Company ID:', companyId);

    // 2. Create Branches
    let branchesList = await sql`SELECT id, name FROM public.branches WHERE company_id = ${companyId}`;
    if (branchesList.length === 0) {
      branchesList = await sql`
        INSERT INTO public.branches (company_id, name, code, address, phone)
        VALUES 
          (${companyId}, 'Downtown Central Branch', 'BR-01', '10 Tahrir Square, Cairo', '+20 2 2578 9001'),
          (${companyId}, 'Nasr City Hub', 'BR-02', '45 Abbas El Akkad St, Cairo', '+20 2 2270 4500'),
          (${companyId}, 'Alexandria Smouha Store', 'BR-03', '12 Victor Emmanuel Sq, Alex', '+20 3 4200 1122')
        RETURNING id, name;
      `;
    }
    console.log(`Branches created: ${branchesList.length}`);

    // 3. Clear existing items and re-seed for clean demo data
    await sql`DELETE FROM public.items WHERE company_id = ${companyId}`;

    const branch1 = branchesList[0].id;
    const branch2 = branchesList[1]?.id || branch1;
    const branch3 = branchesList[2]?.id || branch1;

    // Items for Branch 1
    await sql`
      INSERT INTO public.items (company_id, branch_id, category_name, name, barcode, balance, quantity)
      VALUES 
        (${companyId}, ${branch1}, 'Crispy Chicken', 'Crispy Chicken Strips 1kg', '62210001001', 12500.00, 250),
        (${companyId}, ${branch1}, 'Cookies', 'Belgian Waffle Cookies 200g', '62210001002', 4800.00, 160),
        (${companyId}, ${branch1}, 'Edible Grocery', 'Basmati Rice Premium 5kg', '62210001003', 18900.00, 90),
        (${companyId}, ${branch1}, 'Kahwetek', 'Kahwetek Espresso Beans 1kg', '62210001004', 8500.00, 85);
    `;

    // Items for Branch 2
    await sql`
      INSERT INTO public.items (company_id, branch_id, category_name, name, barcode, balance, quantity)
      VALUES 
        (${companyId}, ${branch2}, 'French Fries', 'Golden French Fries 2.5kg', '62210001005', 9600.00, 120),
        (${companyId}, ${branch2}, 'Juices', 'Fresh Orange Juice 1L', '62210001006', 3200.00, 320),
        (${companyId}, ${branch2}, 'Hot Meal', 'Ready-to-Heat Pasta Box', '62210001007', 7200.00, 180);
    `;

    // Items for Branch 3
    await sql`
      INSERT INTO public.items (company_id, branch_id, category_name, name, barcode, balance, quantity)
      VALUES 
        (${companyId}, ${branch3}, 'Cake Cup', 'Chocolate Fudge Cake Cup', '62210001008', 5400.00, 270),
        (${companyId}, ${branch3}, 'Crispy Chicken', 'Spicy Chicken Wings 750g', '62210001009', 11400.00, 190);
    `;
    console.log('✅ Branch items successfully seeded!');

    // 4. Create Suppliers
    await sql`DELETE FROM public.suppliers WHERE company_id = ${companyId}`;
    const [supplier1] = await sql`
      INSERT INTO public.suppliers (company_id, name, contact_name, contact_phone, contact_email)
      VALUES 
        (${companyId}, 'Al-Ahram Food Logistics', 'Kareem Nabil', '+20 100 123 4567', 'kareem@alahramfood.com'),
        (${companyId}, 'Delta Packaging & Goods', 'Sara Mansour', '+20 111 987 6543', 'sara@deltapack.com'),
        (${companyId}, 'Nile Beverage Distributing', 'Tarek Zaki', '+20 122 555 8899', 'tarek@nilebeverage.com')
      RETURNING id, name;
    `;
    console.log('✅ Suppliers successfully seeded!');

    await sql.end();
    console.log('🎉 Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    await sql.end();
    process.exit(1);
  }
}

seedData();
