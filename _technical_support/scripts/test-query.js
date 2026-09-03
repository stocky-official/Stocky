const { createClient } = require('../../apps/web/node_modules/@supabase/supabase-js');

const supabaseUrl = 'https://qwgpykxjzgqbdzakhchm.supabase.co';
const supabaseAnonKey = 'sb_publishable_Hus6j0YD1Ewe-EaJAfwGYg_rEGWATET';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
  console.log('--- Testing Query for Maadi Mobil & AutoMotive ---');
  
  // 1. Get Maadi Mobil branch ID
  const { data: branches } = await supabase.from('branches').select('id, name, code').eq('code', 'MD-01');
  console.log('Branch:', branches);
  if (!branches || branches.length === 0) return;

  const branchId = branches[0].id;

  // 2. Query AutoMotive items for Maadi Mobil
  const { data: items, count, error } = await supabase
    .from('items')
    .select('*', { count: 'exact' })
    .eq('branch_id', branchId)
    .eq('category_name', 'AutoMotive')
    .order('name')
    .range(0, 4);

  console.log('Total matching AutoMotive items:', count);
  console.log('First 5 items:');
  items.forEach(i => {
    console.log(` - ${i.name} (Barcode: ${i.barcode}, Qty: ${i.quantity}, Bal: ${i.balance})`);
  });
}

testQuery();
