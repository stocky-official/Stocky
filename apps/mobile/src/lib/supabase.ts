import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrxrvfchqxwvfwmszssm.supabase.co';
const supabaseAnonKey = 'sb_publishable_w86shy7D3G1YE55-O0Nz9Q_FRiVuYcZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
