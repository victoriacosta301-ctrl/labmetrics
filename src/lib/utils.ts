// Date utilities
export function td() { return new Date().toISOString().split('T')[0]; }

export function wk(d: string) {
    const dt = new Date(d + 'T12:00:00'), day = dt.getDay(), diff = dt.getDate() - day + (day === 0 ? -6 : 1);
    const m = new Date(dt); m.setDate(diff);
    const e = new Date(m); e.setDate(e.getDate() + 6);
    return { s: m.toISOString().split('T')[0], e: e.toISOString().split('T')[0] };
}

export function mo(d: string) {
    const dt = new Date(d + 'T12:00:00');
    return {
        s: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-01`,
        e: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate()}`
    };
}

export function inR(d: string, s: string, e: string) { return d >= s && d <= e; }

export function fd(s: string) {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
}

export function fc(v: number) { return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }
export function fn(v: number) { return Number(v).toLocaleString('pt-BR'); }

// ── Semester logic ──
// Fixed semesters: Feb–Jul (S1) / Aug–Jan (S2)
export function getSemester(d: string) {
    const dt = new Date(d + 'T12:00:00');
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1; // 1-based

    if (m >= 2 && m <= 7) {
        // S1: Feb 1 – Jul 31 of same year
        return {
            s: `${y}-02-01`,
            e: `${y}-07-31`
        };
    } else {
        // S2: Aug 1 – Jan 31
        // If month is Aug–Dec, semester is Aug(thisYear)–Jan(nextYear)
        // If month is Jan, semester is Aug(prevYear)–Jan(thisYear)
        if (m >= 8) {
            return {
                s: `${y}-08-01`,
                e: `${y + 1}-01-31`
            };
        } else {
            // January
            return {
                s: `${y - 1}-08-01`,
                e: `${y}-01-31`
            };
        }
    }
}

// Config resolution
export function setorOf(uid: string, sectors: any[], mes?: string, metaHistory?: any[]) {
    if (mes && metaHistory && metaHistory.length > 0) {
        // Try to find in sector snapshots for this month, prioritizing the latest snap if duplicates exist
        const snaps = metaHistory.filter(h => h.mes === mes && h.setor_id && h.colaboradores && Array.isArray(h.colaboradores) && h.colaboradores.includes(uid));
        if (snaps.length > 0) {
            const snap = snaps[0]; // metaHistory is already sorted by mes desc, and presumably latest-first
            return sectors.find(s => s.id === snap.setor_id) || { id: snap.setor_id, nome: 'Setor Antigo' };
        }
    }
    return sectors.find(s => (s.colaboradores || []).includes(uid)) || null;
}

/**
 * Resolve config for a user, optionally using temporal snapshot.
 * @param uid - user id
 * @param config - current global config
 * @param sectors - all sectors
 * @param sectorConfigs - current sector-specific configs
 * @param mes - optional "yyyy-MM" string to look up historical snapshot
 * @param metaHistory - optional array of historico_metas rows
 */
export function cfgOf(uid: string, config: any, sectors: any[], sectorConfigs: any, mes?: string, metaHistory?: any[]) {
    const gc = config || {};
    const keys = ['xd', 'xs', 'xm', 'xpd', 'xps', 'xpm', 'md', 'ms', 'mm', 'mpd', 'mps', 'mpm'] as const;
    const defaults = {
        xd: gc.xd || 40, xs: gc.xs || 200, xm: gc.xm || 880, xpd: gc.xpd || 15, xps: gc.xps || 50, xpm: gc.xpm || 150,
        md: gc.md || 25, ms: gc.ms || 125, mm: gc.mm || 550, mpd: gc.mpd || 8, mps: gc.mps || 25, mpm: gc.mpm || 80
    };

    if (mes && metaHistory && metaHistory.length > 0) {
        const s = setorOf(uid, sectors, mes, metaHistory);

        // 1. Try sector-specific snapshot for this exact month
        // 1. Try sector-specific snapshot for this exact month
        if (s) {
            const sectorSnaps = metaHistory.filter(h => h.mes === mes && h.setor_id === s.id);
            if (sectorSnaps.length > 0) {
                // Prioritize the latest snapshot (highest ID)
                const sectorSnap = sectorSnaps.sort((a, b) => String(b.id).localeCompare(String(a.id), undefined, { numeric: true }))[0];
                const result: any = {};
                keys.forEach(k => { result[k] = sectorSnap[k] ?? defaults[k]; });
                return result;
            }
        }

        // 2. Try global snapshot for this exact month
        const globalSnaps = metaHistory.filter(h => h.mes === mes && !h.setor_id);
        if (globalSnaps.length > 0) {
            const globalSnap = globalSnaps.sort((a, b) => String(b.id).localeCompare(String(a.id), undefined, { numeric: true }))[0];
            const base: any = {};
            keys.forEach(k => { base[k] = globalSnap[k] ?? defaults[k]; });
            // Note: We don't overlay current sector configs here anymore to keep history "frozen"
            return base;
        }

        // 3. Fallback for un-archived past months
        // If we are viewing Feb but only March is closed, March snapshot is safer than today's live config.
        const currentMes = new Date().toISOString().slice(0, 7);
        if (mes < currentMes) {
            const nextSnap = metaHistory
                .filter(h => h.mes >= mes)
                .sort((a, b) => a.mes.localeCompare(b.mes))[0];

            if (nextSnap) {
                const mesRef = nextSnap.mes;
                const bestSnap = (s && metaHistory.find(h => h.mes === mesRef && h.setor_id === s.id)) || 
                                metaHistory.find(h => h.mes === mesRef && !h.setor_id);
                
                if (bestSnap) {
                    const result: any = {};
                    keys.forEach(k => { result[k] = bestSnap[k] || defaults[k]; });
                    return result;
                }
            }
        }
    }

    // 4. Current config resolution (default fallback)
    // IMPORTANT: If a month is in the past, and we haven't found a snapshot, 
    // it's better to use the earliest available snapshot or default global than fall back to live sector config
    // which might have changed today.
    const gb = { ...defaults };
    const currentMes = new Date().toISOString().slice(0, 7);
    const s = setorOf(uid, sectors, mes, metaHistory);

    if (s && (!mes || mes >= currentMes)) {
        const sc = sectorConfigs[s.id] || {};
        return {
            xd: sc.xd || gb.xd, xs: sc.xs || gb.xs, xm: sc.xm || gb.xm, xpd: sc.xpd || gb.xpd, xps: sc.xps || gb.xps, xpm: sc.xpm || gb.xpm,
            md: sc.md || gb.md, ms: sc.ms || gb.ms, mm: sc.mm || gb.mm, mpd: sc.mpd || gb.mpd, mps: sc.mps || gb.mps, mpm: sc.mpm || gb.mpm
        };
    }
    return gb;
}

// Points calculation — scoped to current semester
export function calcPts(uid: string, records: any[], config: any, sectors: any[], sectorConfigs: any, bonus: any = {}, metaHistory?: any[]): number {
    let t = 0;

    // Get current semester boundaries
    const today = td();
    const sem = getSemester(today);

    // Filter records to current semester only
    const ur = records.filter(r => r.uid === uid && inR(r.d, sem.s, sem.e));

    // Aggregate production by day
    const bd: Record<string, number> = {};
    ur.forEach(r => { if (!bd[r.d]) bd[r.d] = 0; bd[r.d] += (r.a || 0) + (r.c || 0); });

    // Daily points — use temporal config per day's month
    Object.entries(bd).forEach(([d, v]) => {
        const mes = d.slice(0, 7);
        const c = cfgOf(uid, config, sectors, sectorConfigs, mes, metaHistory);
        if (v >= c.xd) t += c.xpd; else if (v >= c.md) t += c.mpd;
    });

    // Weekly points
    const cw = new Set<string>();
    Object.keys(bd).forEach(d => {
        const w = wk(d); if (cw.has(w.s)) return; cw.add(w.s);
        const mes = w.s.slice(0, 7);
        const c = cfgOf(uid, config, sectors, sectorConfigs, mes, metaHistory);
        const wt = ur.filter(r => inR(r.d, w.s, w.e)).reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
        if (wt >= c.xs) t += c.xps; else if (wt >= c.ms) t += c.mps;
    });

    // Monthly points
    const cm2 = new Set<string>();
    Object.keys(bd).forEach(d => {
        const mv = mo(d); if (cm2.has(mv.s)) return; cm2.add(mv.s);
        const mes = mv.s.slice(0, 7);
        const c = cfgOf(uid, config, sectors, sectorConfigs, mes, metaHistory);
        const mt = ur.filter(r => inR(r.d, mv.s, mv.e)).reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
        if (mt >= c.xm) t += c.xpm; else if (mt >= c.mm) t += c.mpm;
    });

    // Bonus — only counts within current semester
    t += (bonus[uid] || 0);
    return t;
}
