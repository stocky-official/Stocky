import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qwgpykxjzgqbdzakhchm.supabase.co';
const supabaseAnonKey = 'sb_publishable_Hus6j0YD1Ewe-EaJAfwGYg_rEGWATET';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
