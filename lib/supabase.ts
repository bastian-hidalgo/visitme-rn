import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';
import { ensureEnv, env } from '../constants/env';

export type Supa = SupabaseClient<Database>;

const supabaseUrl = ensureEnv(env.supabaseUrl, 'EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = ensureEnv(env.supabaseAnonKey, 'EXPO_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
