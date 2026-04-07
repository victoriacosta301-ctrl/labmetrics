import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHistory() {
    const { data, error } = await supabase.from('historico_metas').select('*').order('mes', { ascending: false });
    if (error) {
        console.error('Error fetching history:', error);
        return;
    }

    console.log('--- META HISTORY SNAPSHOTS ---');
    if (!data || data.length === 0) {
        console.log('No snapshots found in historico_metas.');
    } else {
        data.forEach(h => {
            console.log(`Month: ${h.mes} | Sector: ${h.setor_id || 'GLOBAL'} | xm: ${h.xm} | Collabs: ${h.colaboradores ? h.colaboradores.length : 'none'}`);
        });
    }

    const { data: sectors } = await supabase.from('setores').select('*');
    console.log('\n--- CURRENT SECTORS ---');
    sectors?.forEach(s => {
        console.log(`ID: ${s.id} | Name: ${s.nome} | Collabs: ${s.colaboradores?.length}`);
    });
}

checkHistory();
