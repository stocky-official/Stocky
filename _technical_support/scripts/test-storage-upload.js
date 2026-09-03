/**
 * Test storage structure in stocky-private bucket
 * Conforms to Rule 2: Auxiliary test script strictly in _technical_support/scripts/
 */

const { createClient } = require('../../node_modules/.pnpm/@supabase+supabase-js@2.113.0/node_modules/@supabase/supabase-js');

const supabaseUrl = 'https://qwgpykxjzgqbdzakhchm.supabase.co';
const supabaseKey = 'sb_secret_REDACTED_MOCK_KEY_FOR_LOCAL_TESTS'; // Service role key for admin verification

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  console.log('--- Testing stocky-private Storage Architecture ---');
  const testCompanyId = '00000000-0000-0000-0000-000000000001';

  try {
    // 1. Upload .keep to profile-imgs
    console.log('1. Initializing {companyId}/profile-imgs/.keep...');
    const { data: keep1, error: err1 } = await supabase.storage
      .from('stocky-private')
      .upload(`${testCompanyId}/profile-imgs/.keep`, Buffer.from(''), {
        contentType: 'text/plain',
        upsert: true,
      });
    if (err1) throw err1;
    console.log(' -- profile-imgs folder initialized:', keep1);

    // 2. Upload .keep to documents
    console.log('2. Initializing {companyId}/documents/.keep...');
    const { data: keep2, error: err2 } = await supabase.storage
      .from('stocky-private')
      .upload(`${testCompanyId}/documents/.keep`, Buffer.from(''), {
        contentType: 'text/plain',
        upsert: true,
      });
    if (err2) throw err2;
    console.log(' -- documents folder initialized:', keep2);

    // 3. Upload a sample logo
    console.log('3. Uploading sample logo...');
    const dummySvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#000"/></svg>';
    const logoPath = `${testCompanyId}/profile-imgs/logo-test.svg`;
    const { data: logoUpload, error: logoErr } = await supabase.storage
      .from('stocky-private')
      .upload(logoPath, Buffer.from(dummySvg), {
        contentType: 'image/svg+xml',
        upsert: true,
      });
    if (logoErr) throw logoErr;
    console.log(' -- sample logo uploaded:', logoUpload);

    // 4. Generate signed URL
    console.log('4. Generating signed URL...');
    const { data: signedData, error: signErr } = await supabase.storage
      .from('stocky-private')
      .createSignedUrl(logoPath, 3600);
    if (signErr) throw signErr;
    console.log(' -- signed URL generated successfully:', signedData.signedUrl.slice(0, 80) + '...');

    // 5. Clean up test files
    console.log('5. Cleaning up test files...');
    await supabase.storage
      .from('stocky-private')
      .remove([`${testCompanyId}/profile-imgs/.keep`, `${testCompanyId}/documents/.keep`, logoPath]);
    console.log(' -- Cleanup complete.');

    console.log('✅ Supabase stocky-private storage architecture fully operational!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Storage test failed:', err);
    process.exit(1);
  }
}

testStorage();
