
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: space } = await supabase.from('common_spaces').select('*').limit(1);
  console.log('Common Space columns:', Object.keys(space[0] || {}));
  
  const { data: community } = await supabase.from('communities').select('*').limit(1);
  console.log('Community columns:', Object.keys(community[0] || {}));
}

check();
