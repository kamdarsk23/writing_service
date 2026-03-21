import { createClient } from '@supabase/supabase-js';

/** Same strings the auth client uses — audit fetch must target this host with this anon key. */
export const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL as string;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
