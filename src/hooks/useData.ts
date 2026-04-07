'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useData(user: any) {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);
    const [config, setConfig] = useState<any>(null);
    const [sectors, setSectors] = useState<any[]>([]);
    const [billings, setBillings] = useState<any[]>([]);
    const [sectorConfigs, setSectorConfigs] = useState<any>({});
    const [bonus, setBonus] = useState<any>({});
    const [users, setUsers] = useState<any[]>([]);
    const [metaHistory, setMetaHistory] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const [
                { data: usersData },
                { data: cfgData },
                { data: regsData },
                { data: setData },
                { data: fatsData },
                { data: scfgData },
                { data: bData },
                { data: histData }
            ] = await Promise.all([
                supabase.from('usuarios').select('*').order('name'),
                supabase.from('config').select('*').eq('id', 1).single(),
                supabase.from('registros').select('*').order('data', { ascending: false }),
                supabase.from('setores').select('*').order('nome'),
                supabase.from('faturamentos').select('*').order('data', { ascending: false }),
                supabase.from('scfg').select('*'),
                supabase.from('bonus').select('*'),
                supabase.from('historico_metas').select('*').order('mes', { ascending: false }).order('id', { ascending: false })
            ]);

            setUsers(usersData || []);

            const configFallback = { xd: 40, xs: 200, xm: 880, xpd: 15, xps: 50, xpm: 150, md: 25, ms: 125, mm: 550, mpd: 8, mps: 25, mpm: 80 };
            setConfig(cfgData || configFallback);

            setRecords(regsData?.map(r => ({ id: r.id, uid: r.uid, d: r.data, a: r.atendimentos, c: r.coletas, obs: r.obs || '' })) || []);
            setSectors(setData?.map(s => ({ id: s.id, nome: s.nome, meta: s.meta, colaboradores: s.colaboradores || [] })) || []);
            setBillings(fatsData?.map(f => ({ id: f.id, sid: f.setor_id, d: f.data, v: f.valor, obs: f.obs || '' })) || []);

            const sc: any = {};
            if (scfgData) {
                scfgData.forEach(s => { sc[s.setor_id] = s; });
            }
            setSectorConfigs(sc);

            const b: any = {};
            if (bData) {
                bData.forEach(x => { b[x.uid] = x.pontos; });
            }
            setBonus(b);

            setMetaHistory(histData || []);

        } catch (e) {
            console.error('Error fetching data:', e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { loading, users, config, records, sectors, billings, sectorConfigs, bonus, metaHistory, refresh: fetchData };
}
