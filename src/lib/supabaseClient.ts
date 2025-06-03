
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // Ajuste o caminho se seus tipos gerados pelo Supabase estiverem em outro lugar

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient<Database> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
} else {
  // Este console.warn será visível no console do navegador (para client-side code)
  // e no terminal do servidor Next.js durante a renderização do lado do servidor ou build.
  console.warn(
    "AVISO: Credenciais do Supabase (URL ou Chave Anônima) estão ausentes.\n" +
    "Por favor, verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidos em seu arquivo .env.local.\n" +
    "Após adicionar/modificar o .env.local, REINICIE o servidor de desenvolvimento.\n" +
    "As funcionalidades que dependem do Supabase estarão indisponíveis até que a configuração seja concluída."
  );
}

export const supabase = supabaseInstance;
