const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim().replace(/"/g, '').replace(/'/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHistory() {
    console.log('Fetching history...');
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

    const { data: scfg, error: scfgErr } = await supabase.from('scfg').select('*');
    console.log('\n--- LIVE SECTOR CONFIGS (scfg) ---');
    scfg?.forEach(s => {
        console.log(`Sector: ${s.setor_id} | xm: ${s.xm}`);
    });
}

checkHistory();
