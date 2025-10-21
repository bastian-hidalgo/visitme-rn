import { createClient } from '@supabase/supabase-js'
import 'expo-sqlite/localStorage/install'; // storage polyfill oficial Expo

// Variables públicas (expo): defínelas en app.json o .env
const url = process.env.EXPO_PUBLIC_SUPABASE_URL!
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anon, {
  auth: {
    storage: localStorage,           // ← expo-sqlite/localStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,       // ← crítico en mobile
  },
})
