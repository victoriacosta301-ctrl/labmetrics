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

async function debugJessica() {
    const { data: users, error: uErr } = await supabase.from('usuarios').select('*');
    if (uErr) { console.error('Error fetching users:', uErr); return; }
    
    const jessica = users.find(u => u.name && u.name.includes('Jessica'));
    if (!jessica) { 
        console.error('Jessica not found in:', users.map(u => u.name)); 
        return; 
    }
    console.log(`Found Jessica: ${jessica.id} (${jessica.name})`);

    const { data: records, error: rErr } = await supabase.from('registros')
        .select('*')
        .eq('uid', jessica.id)
        .gte('data', '2026-03-01')
        .lte('data', '2026-03-31');
    
    if (rErr) { console.error('Error fetching records:', rErr); return; }

    console.log(`\n--- PRODUCTION RECORDS (MARCH) ---`);
    let totalProd = 0;
    records.sort((a,b) => a.data.localeCompare(b.data)).forEach(r => {
        const qty = (r.atendimentos || 0) + (r.coletas || 0);
        console.log(`Date: ${r.data} | Atend: ${r.atendimentos} | Coletas: ${r.coletas} | Total: ${qty}`);
        totalProd += qty;
    });
    console.log(`Total March Production: ${totalProd}`);

    const { data: history } = await supabase.from('historico_metas').select('*').eq('mes', '2026-03');
    console.log(`\n--- HISTORY (MARCH) ---`);
    history.forEach(h => {
        console.log(`Sector: ${h.setor_id || 'GLOBAL'} | xm: ${h.xm} | mm: ${h.mm} | Collabs: ${h.colaboradores?.length}`);
    });

    const { data: bonusData } = await supabase.from('bonus').select('*');
    console.log(`\n--- BONUSES ---`);
    bonusData.forEach(b => console.log(`UID: ${b.uid} | Points: ${b.pontos}`));
}

debugJessica();
