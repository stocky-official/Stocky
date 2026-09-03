const { createClient } = require('../../apps/web/node_modules/@supabase/supabase-js');

const supabaseUrl = 'https://qwgpykxjzgqbdzakhchm.supabase.co';
const supabaseAnonKey = 'sb_publishable_Hus6j0YD1Ewe-EaJAfwGYg_rEGWATET';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
  console.log('--- Testing Anon Client Fetch from Supabase ---');
  
  const { data: branches, error: bErr } = await supabase.from('branches').select('*');
  console.log('Branches count:', branches ? branches.length : 'null', 'Error:', bErr);

  const { data: categories, error: cErr } = await supabase.from('categories').select('*');
  console.log('Categories count:', categories ? categories.length : 'null', 'Error:', cErr);

  const { data: items, error: iErr, count } = await supabase.from('items').select('*', { count: 'exact' }).range(0, 10);
  console.log('Items sample count:', items ? items.length : 'null', 'Exact total:', count, 'Error:', iErr);
}

testFetch();
