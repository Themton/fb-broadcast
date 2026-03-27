const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getClient() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.log('⚠️  SUPABASE_URL or SUPABASE_SERVICE_KEY not set');
    return null;
  }

  supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('✅ Supabase client initialized');
  return supabase;
}

async function testConnection() {
  const client = getClient();
  if (!client) return false;
  try {
    const { data, error } = await client.from('page_config').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected & tables ready');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection test failed:', err.message);
    console.log('💡 กรุณารัน migration.sql ใน Supabase SQL Editor ก่อน');
    return false;
  }
}

module.exports = { getClient, testConnection };
