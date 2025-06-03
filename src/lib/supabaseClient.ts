
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // Ajuste o caminho se seus tipos gerados pelo Supabase estiverem em outro lugar

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
