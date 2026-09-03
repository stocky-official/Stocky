const { createClient } = require('../../apps/web/node_modules/@supabase/supabase-js');
const supabase = createClient('https://qwgpykxjzgqbdzakhchm.supabase.co', 'sb_publishable_Hus6j0YD1Ewe-EaJAfwGYg_rEGWATET');

async function testSearch(term) {
  const { data, count, error } = await supabase.from('items')
    .select('name, barcode', { count: 'exact' })
    .or(`name.ilike.%${term}%,barcode.ilike.%${term}%`)
    .limit(5);
  console.log('Search term:', JSON.stringify(term), '-> Count:', count, 'Error:', error?.message);
}

async function run() {
  await testSearch('spray');
  await testSearch('pump spray');
  await testSearch('2 Oz');
  await testSearch('A.Tech');
  await testSearch('Wiper, Blade');
  await testSearch('Carall (Wiper)');
}
run();
