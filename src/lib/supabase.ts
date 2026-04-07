import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    if (typeof window !== 'undefined') {
        console.error('ERRO: Variáveis de ambiente do Supabase não encontradas. Verifique suas configurações no Netlify/Vercel ou seu arquivo .env local.');
    }
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
