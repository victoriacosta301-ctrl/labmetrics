'use client';

import { useGlobalData } from '@/context/DataContext';
import { useAuth } from '@/hooks/useAuth';
import { td, mo, fd, fn, inR, wk, cfgOf, calcPts } from '@/lib/utils';

export default function DashboardPage() {
    const { user } = useAuth();
    const { loading, users, config, records, sectors, sectorConfigs, billings, bonus, openModal } = useGlobalData();

    if (loading || !user) return <div className="page active"><p className="muted">Carregando...</p></div>;

    const today = td();
    const mr = mo(today);
    const isSup = user.role === 'sup';
    const collabs = users.filter(u => u.role !== 'sup');

    // Supervisor dashboard
    if (isSup) {
        const tH = records.filter(r => r.d === today).reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
        const tM = records.filter(r => inR(r.d, mr.s, mr.e)).reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
        const tP = collabs.reduce((s, u) => s + calcPts(u.id, records, config, sectors, sectorConfigs, bonus), 0);

        // Ranking
        const rnk = collabs.map(u => ({ ...u, p: calcPts(u.id, records, config, sectors, sectorConfigs, bonus) })).sort((a, b) => b.p - a.p);
        const rc = ['r1', 'r2', 'r3'];

        return (
            <div className="page active">
                <div className="sh">
                    <div><h2>Dashboard</h2><p>Hoje: {fd(today)}</p></div>
                    <button className="btn btn-gh btn-sm" onClick={() => openModal('mPdf')} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        📄 Relatório Mensal PDF
                    </button>
                </div>

                {/* Stats cards */}
                <div className="g4 mb16">
                    <div className="sc"><div className="slbl">Colaboradores</div><div className="sval">{collabs.length}</div><div className="ssub">No sistema</div></div>
                    <div className="sc"><div className="slbl">Produção Hoje</div><div className="sval" style={{ color: 'var(--g700)' }}>{fn(tH)}</div><div className="ssub">Atend. + Coletas</div></div>
                    <div className="sc"><div className="slbl">Produção no Mês</div><div className="sval">{fn(tM)}</div><div className="ssub">{fd(mr.s)} – {fd(mr.e)}</div></div>
                    <div className="sc gold"><div className="slbl">⭐ Pontos do Time</div><div className="sval" style={{ color: 'var(--amber)' }}>{fn(tP)}</div><div className="ssub">Acumulados</div></div>
                </div>

                {/* Bottom section: Ranking + Progress */}
                <div className="g2">
                    <div className="card">
                        <div className="ct">🏆 Ranking de Pontos</div>
                        {rnk.length ? rnk.map((u, i) => (
                            <div className="ri" key={u.id}>
                                <div className={`rn ${i < 3 ? rc[i] : 'ro'}`}>{i + 1}</div>
                                <div className="cav" style={{ width: 32, height: 32, borderRadius: 8, fontSize: 13 }}>{u.name.charAt(0)}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.cargo || ''}</div>
                                </div>
                                <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, color: 'var(--amber)' }}>⭐ {fn(u.p)}</div>
                            </div>
                        )) : <p className="muted" style={{ fontSize: 13 }}>Nenhum colaborador</p>}
                    </div>

                    <div className="card">
                        <div className="ct">📈 Progresso do Time — Mês</div>
                        {collabs.map(u => {
                            const c = cfgOf(u.id, config, sectors, sectorConfigs);
                            const p = records.filter(r => r.uid === u.id && inR(r.d, mr.s, mr.e)).reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
                            const pX = c.xm ? Math.min(100, Math.round(p / c.xm * 100)) : 0;
                            const pM = c.mm ? Math.min(100, Math.round(p / c.mm * 100)) : 0;
                            const cl = pX >= 100 ? 'var(--gold)' : pM >= 100 ? 'var(--g600)' : pX >= 60 ? 'var(--warn)' : 'var(--gray400)';
                            return (
                                <div key={u.id} style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</span>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            {pM >= 100 && <span className="badge bg" style={{ fontSize: 10 }}>🟢</span>}
                                            {pX >= 100 && <span className="badge bgold" style={{ fontSize: 10 }}>🥇</span>}
                                            <span style={{ fontSize: 13, color: cl, fontWeight: 600 }}>{p}/{c.xm}</span>
                                        </div>
                                    </div>
                                    <div className="pw" style={{ height: 5, position: 'relative' }}>
                                        <div className="pb" style={{ width: `${pM}%`, background: 'var(--g400)', opacity: 0.45, position: 'absolute', top: 0, left: 0, height: '100%' }} />
                                        <div className="pb" style={{ width: `${pX}%`, background: cl }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Collaborator dashboard
    const c = cfgOf(user.id, config, sectors, sectorConfigs);
    const p = calcPts(user.id, records, config, sectors, sectorConfigs, bonus);
    const wr = wk(today);
    const yd = new Date(today + 'T12:00:00'); yd.setDate(yd.getDate() - 1);
    const yesterday = yd.toISOString().slice(0, 10);
    const pY = records.filter(r => r.uid === user.id && r.d === yesterday).reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
    const pYa = records.filter(r => r.uid === user.id && r.d === yesterday).reduce((s, r) => s + (r.a || 0), 0);
    const pYc = records.filter(r => r.uid === user.id && r.d === yesterday).reduce((s, r) => s + (r.c || 0), 0);
    const pD = records.filter(r => r.uid === user.id && r.d === today).reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
    const pS = records.filter(r => r.uid === user.id && inR(r.d, wr.s, wr.e)).reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
    const pMo = records.filter(r => r.uid === user.id && inR(r.d, mr.s, mr.e)).reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
    const co = (v: number) => v >= 100 ? 'var(--g700)' : v >= 60 ? 'var(--warn)' : 'var(--gray400)';
    const pcD = c.xd ? Math.min(100, Math.round(pD / c.xd * 100)) : 0;
    const pcY = c.xd ? Math.min(100, Math.round(pY / c.xd * 100)) : 0;
    const pcS = c.xs ? Math.min(100, Math.round(pS / c.xs * 100)) : 0;
    const pcM = c.xm ? Math.min(100, Math.round(pMo / c.xm * 100)) : 0;

    const allU = users.filter(u => u.role !== 'sup');
    const rnk = allU.map(u => ({ ...u, p: calcPts(u.id, records, config, sectors, sectorConfigs) })).sort((a, b) => b.p - a.p);
    const rc = ['r1', 'r2', 'r3'];

    return (
        <div className="page active">
            <div className="sh"><div><h2>Dashboard</h2><p>Hoje: {fd(today)}</p></div></div>

            <div className="g4 mb16" style={{ gridTemplateColumns: 'auto repeat(4, 1fr)' }}>
                <div className="sc gold">
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div className="pring"><div className="pv">{p}</div><div className="pl">Pontos</div></div>
                        <div><div className="slbl">Seus Pontos</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Acumulados</div></div>
                    </div>
                </div>
                <div className="sc" style={{ borderLeft: '3px solid var(--warn)' }}>
                    <div className="slbl" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Ontem <span style={{ fontSize: 10, background: 'var(--warn)', color: '#fff', padding: '1px 5px', borderRadius: 10 }}>{fd(yesterday)}</span></div>
                    <div className="sval" style={{ color: co(pcY) }}>{pY}<span style={{ fontSize: 15, color: 'var(--muted)' }}>/{c.xd}</span></div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>🩺 {pYa} atend. &nbsp; 🔬 {pYc} coletas</div>
                    <div className="pw mt8"><div className="pb" style={{ width: `${pcY}%`, background: co(pcY) }} /></div>
                    <div className="ssub mt8">{pcY}% meta máx. {pcY >= 100 ? '✅' : ''}</div>
                </div>
                <div className="sc"><div className="slbl">Hoje</div><div className="sval" style={{ color: co(pcD) }}>{pD}<span style={{ fontSize: 15, color: 'var(--muted)' }}>/{c.xd}</span></div><div className="pw mt8"><div className="pb" style={{ width: `${pcD}%`, background: co(pcD) }} /></div><div className="ssub mt8">{pcD}% meta máx. {pcD >= 100 ? '✅' : ''}</div></div>
                <div className="sc"><div className="slbl">Semana</div><div className="sval" style={{ color: co(pcS) }}>{pS}<span style={{ fontSize: 15, color: 'var(--muted)' }}>/{c.xs}</span></div><div className="pw mt8"><div className="pb" style={{ width: `${pcS}%`, background: co(pcS) }} /></div><div className="ssub mt8">{pcS}% meta máx. {pcS >= 100 ? '✅' : ''}</div></div>
                <div className="sc"><div className="slbl">Mês</div><div className="sval" style={{ color: co(pcM) }}>{pMo}<span style={{ fontSize: 15, color: 'var(--muted)' }}>/{c.xm}</span></div><div className="pw mt8"><div className="pb" style={{ width: `${pcM}%`, background: co(pcM) }} /></div><div className="ssub mt8">{pcM}% meta máx. {pcM >= 100 ? '✅' : ''}</div></div>
            </div>

            <div className="g2">
                <div className="card">
                    <div className="ct">🏆 Ranking de Pontos <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>— visualização</span></div>
                    {rnk.map((u, i) => (
                        <div className="ri" key={u.id} style={u.id === user.id ? { background: 'var(--g50)', borderRadius: 10, padding: '11px 10px', margin: '0 -10px' } : {}}>
                            <div className={`rn ${i < 3 ? rc[i] : 'ro'}`}>{i + 1}</div>
                            <div className="cav" style={{ width: 32, height: 32, borderRadius: 8, fontSize: 13 }}>{u.name.charAt(0)}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}{u.id === user.id && <span style={{ fontSize: 11, color: 'var(--g600)' }}> (você)</span>}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.cargo || ''}</div>
                            </div>
                            <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, color: 'var(--amber)' }}>⭐ {fn(u.p)}</div>
                        </div>
                    ))}
                </div>
                <div className="card">
                    <div className="ct">📈 Progresso do Time — Mês <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>— visualização</span></div>
                    {allU.map(u => {
                        const cfg = cfgOf(u.id, config, sectors, sectorConfigs);
                        const prod = records.filter(r => r.uid === u.id && inR(r.d, mr.s, mr.e)).reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
                        const pctX = cfg.xm ? Math.min(100, Math.round(prod / cfg.xm * 100)) : 0;
                        const pctM = cfg.mm ? Math.min(100, Math.round(prod / cfg.mm * 100)) : 0;
                        const clr = pctX >= 100 ? 'var(--gold)' : pctM >= 100 ? 'var(--g600)' : pctX >= 60 ? 'var(--warn)' : 'var(--gray400)';
                        return (
                            <div key={u.id} style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</span>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {pctM >= 100 && <span className="badge bg" style={{ fontSize: 10 }}>🟢</span>}
                                        {pctX >= 100 && <span className="badge bgold" style={{ fontSize: 10 }}>🥇</span>}
                                        <span style={{ fontSize: 13, color: clr, fontWeight: 600 }}>{prod}/{cfg.xm}</span>
                                    </div>
                                </div>
                                <div className="pw" style={{ height: 5, position: 'relative' }}>
                                    <div className="pb" style={{ width: `${pctM}%`, background: 'var(--g400)', opacity: 0.45, position: 'absolute', top: 0, left: 0, height: '100%' }} />
                                    <div className="pb" style={{ width: `${pctX}%`, background: clr }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
