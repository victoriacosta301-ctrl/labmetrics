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

// Config resolution
export function setorOf(uid: string, sectors: any[]) {
    return sectors.find(s => (s.colaboradores || []).includes(uid)) || null;
}

export function cfgOf(uid: string, config: any, sectors: any[], sectorConfigs: any) {
    const gc = config || {};
    const gb = {
        xd: gc.xd || 40, xs: gc.xs || 200, xm: gc.xm || 880, xpd: gc.xpd || 15, xps: gc.xps || 50, xpm: gc.xpm || 150,
        md: gc.md || 25, ms: gc.ms || 125, mm: gc.mm || 550, mpd: gc.mpd || 8, mps: gc.mps || 25, mpm: gc.mpm || 80
    };
    const s = setorOf(uid, sectors);
    if (s) {
        const sc = sectorConfigs[s.id] || {};
        return {
            xd: sc.xd || gb.xd, xs: sc.xs || gb.xs, xm: sc.xm || gb.xm, xpd: sc.xpd || gb.xpd, xps: sc.xps || gb.xps, xpm: sc.xpm || gb.xpm,
            md: sc.md || gb.md, ms: sc.ms || gb.ms, mm: sc.mm || gb.mm, mpd: sc.mpd || gb.mpd, mps: sc.mps || gb.mps, mpm: sc.mpm || gb.mpm
        };
    }
    return gb;
}

// Points calculation
export function calcPts(uid: string, records: any[], config: any, sectors: any[], sectorConfigs: any, bonus: any = {}): number {
    let t = 0;
    const ur = records.filter(r => r.uid === uid);
    const bd: Record<string, number> = {};
    ur.forEach(r => { if (!bd[r.d]) bd[r.d] = 0; bd[r.d] += (r.a || 0) + (r.c || 0); });

    const c = cfgOf(uid, config, sectors, sectorConfigs);

    // Daily
    Object.entries(bd).forEach(([, v]) => {
        if (v >= c.xd) t += c.xpd; else if (v >= c.md) t += c.mpd;
    });

    // Weekly
    const cw = new Set<string>();
    Object.keys(bd).forEach(d => {
        const w = wk(d); if (cw.has(w.s)) return; cw.add(w.s);
        const wt = ur.filter(r => inR(r.d, w.s, w.e)).reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
        if (wt >= c.xs) t += c.xps; else if (wt >= c.ms) t += c.mps;
    });

    // Monthly
    const cm2 = new Set<string>();
    Object.keys(bd).forEach(d => {
        const mv = mo(d); if (cm2.has(mv.s)) return; cm2.add(mv.s);
        const mt = ur.filter(r => inR(r.d, mv.s, mv.e)).reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
        if (mt >= c.xm) t += c.xpm; else if (mt >= c.mm) t += c.mpm;
    });

    t += (bonus[uid] || 0);
    return t;
}
