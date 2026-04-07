const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim().replace(/"/g, '').replace(/'/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debugMetas() {
    const matrizID = 's1774378131116';
    
    // 1. Live Config
    const { data: scfg } = await supabase.from('scfg').select('*').eq('setor_id', matrizID);
    console.log(`\n--- MATRIZ LIVE CONFIG ---`);
    if (scfg && scfg[0]) {
        console.log(scfg[0]);
    } else {
        console.log('No live config for Matriz (uses global)');
    }

    // 2. Global Config
    const { data: gc } = await supabase.from('config').select('*').eq('id', 1).single();
    console.log(`\n--- GLOBAL LIVE CONFIG ---`);
    console.log(gc);

    // 3. Historical Snapshot
    const { data: hist } = await supabase.from('historico_metas').select('*').eq('mes', '2026-03').eq('setor_id', matrizID);
    console.log(`\n--- MATRIZ MARCH SNAPSHOT ---`);
    if (hist && hist[0]) {
        console.log(hist[0]);
    } else {
        console.log('No March snapshot for Matriz');
    }
}

debugMetas();
