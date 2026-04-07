'use client';

import { useState } from 'react';
import { useGlobalData } from '@/context/DataContext';
import { useAuth } from '@/hooks/useAuth';
import { td, mo, fd, fn, inR, wk, cfgOf, calcPts, setorOf, fc } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function ProductivityPage() {
    const { user } = useAuth();
    const { loading, users, config, records, sectors, sectorConfigs, refresh, openModal, bonus, metaHistory, selectedMonth } = useGlobalData();

    const isPast = !!selectedMonth && selectedMonth !== td().slice(0, 7);
    const [periodState, setPeriod] = useState<'day' | 'week' | 'month'>('day');
    const period = isPast ? 'month' : periodState;

    const [weekOffset, setWeekOffset] = useState(0);
    // Optional: Modal states for edit/delete here or separate components

    if (loading || !user) return <div className="page active"><p className="muted">Carregando...</p></div>;

    const today = td();
    const effectiveDate = selectedMonth ? `${selectedMonth}-01` : today;
    const isSup = user.role === 'sup';
    const collabs = users.filter(u => u.role !== 'sup');

    let rS = today, rE = today, rL = `Hoje — ${fd(today)}`;

    if (period === 'week') {
        const baseDate = new Date(today + 'T12:00:00');
        baseDate.setDate(baseDate.getDate() + weekOffset * 7);
        const baseStr = baseDate.toISOString().slice(0, 10);
        const w = wk(baseStr);
        rS = w.s; rE = w.e;
        const lbl = weekOffset === 0 ? 'Semana atual' : weekOffset === -1 ? 'Semana passada' : `${Math.abs(weekOffset)} sem. atrás`;
        rL = `${lbl} — ${fd(w.s)} a ${fd(w.e)}`;
    } else if (period === 'month') {
        const m = mo(effectiveDate);
        rS = m.s; rE = m.e;
        rL = `Mês — ${fd(m.s)} a ${fd(m.e)}`;
    }

    const handleDeleteRecord = async (rid: string) => {
        if (!confirm('Excluir este registro permanentemente?')) return;
        await supabase.from('registros').delete().eq('id', rid);
        refresh();
    };

    const renderCards = (targetUsers: typeof users) => {
        return targetUsers.map(u => {
            const currentMes = selectedMonth || today.slice(0, 7);
            const c = cfgOf(u.id, config, sectors, sectorConfigs, currentMes, metaHistory);
            const mX = period === 'day' ? c.xd : period === 'week' ? c.xs : c.xm;
            const mM = period === 'day' ? c.md : period === 'week' ? c.ms : c.mm;
            const rs = records.filter(r => r.uid === u.id && inR(r.d, rS, rE));
            const tot = rs.reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
            const at = rs.reduce((s, r) => s + (r.a || 0), 0);
            const co = rs.reduce((s, r) => s + (r.c || 0), 0);
            const pX = mX ? Math.min(100, Math.round(tot / mX * 100)) : 0;
            const pMv = mM ? Math.min(100, Math.round(tot / mM * 100)) : 0;
            const mN = period === 'month' ? c.nm : null;
            const pN = mN ? Math.min(100, Math.round(tot / mN * 100)) : 0;
            const cl = pX >= 100 ? 'var(--gold)' : pMv >= 100 ? 'var(--g600)' : pN >= 100 ? '#ef4444' : 'var(--gray400)';
            const p = calcPts(u.id, records, config, sectors, sectorConfigs, bonus, metaHistory);
            const s2 = setorOf(u.id, sectors, currentMes, metaHistory);

            return (
                <div className="cc" key={u.id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="cav">{u.name.charAt(0)}</div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700 }}>{u.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.cargo || ''}{s2 ? ' · ' + s2.nome : ''}</div>
                            </div>
                        </div>
                        {isSup && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, color: 'var(--amber)', fontSize: 14 }}>⭐ {fn(p)}</div>
                                <button className="btn btn-bl btn-sm" onClick={() => openModal('mEC', { uid: u.id })}>✏️ Editar</button>
                            </div>
                        )}
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{rL}</span>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {pN >= 100 && pMv < 100 && <span className="badge" style={{ fontSize: 10, background: '#fee2e2', color: '#b91c1c' }}>🔴 Min</span>}
                                {pMv >= 100 && <span className="badge bg" style={{ fontSize: 10 }}>🟢 Média</span>}
                                {pX >= 100 && <span className="badge bgold" style={{ fontSize: 10 }}>🥇 Máxima</span>}
                                <span style={{ fontSize: 14, fontWeight: 700, color: cl }}>{tot}/{mX}</span>
                            </div>
                        </div>
                        <div className="pw" style={{ position: 'relative' }}>
                            {pN > 0 && <div className="pb" style={{ width: `${pN}%`, background: '#fca5a5', opacity: 0.4, position: 'absolute', top: 0, left: 0, height: '100%' }} />}
                            <div className="pb" style={{ width: `${pMv}%`, background: 'var(--g400)', opacity: 0.4, position: 'absolute', top: 0, left: 0, height: '100%' }} />
                            <div className="pb" style={{ width: `${pX}%`, background: cl }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                            <span>🟢 Média: {mM}</span><span>🥇 Máx.: {mX}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 13 }}>
                        <span>🩺 <strong>{at}</strong> atend.</span><span>🔬 <strong>{co}</strong> coletas</span>
                    </div>
                    {rs.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--gray100)', paddingTop: 10 }}>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Últimos registros</div>
                            {rs.slice(-4).reverse().map(r => (
                                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--gray100)' }}>
                                    <span style={{ color: 'var(--muted)', minWidth: 72 }}>{fd(r.d)}</span>
                                    <span>🩺{r.a || 0} 🔬{r.c || 0} <strong>({(r.a || 0) + (r.c || 0)})</strong></span>
                                    {r.obs && <span style={{ color: 'var(--muted)', fontSize: 11, marginLeft: 'auto' }}>{r.obs}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        });
    };

    const renderCollabView = () => {
        const currentMes = selectedMonth || today.slice(0, 7);
        const c = cfgOf(user.id, config, sectors, sectorConfigs, currentMes, metaHistory);
        const p = calcPts(user.id, records, config, sectors, sectorConfigs, bonus, metaHistory);
        const rs = records.filter(r => r.uid === user.id && inR(r.d, rS, rE));
        const tot = rs.reduce((s, r) => s + (r.a || 0) + (r.c || 0), 0);
        const at = rs.reduce((s, r) => s + (r.a || 0), 0);
        const co = rs.reduce((s, r) => s + (r.c || 0), 0);
        const mX = period === 'day' ? c.xd : period === 'week' ? c.xs : c.xm;
        const mMv = period === 'day' ? c.md : period === 'week' ? c.ms : c.mm;
        const pX = mX ? Math.min(100, Math.round(tot / mX * 100)) : 0;
        const pMv = mMv ? Math.min(100, Math.round(tot / mMv * 100)) : 0;
        const mN = period === 'month' ? c.nm : null;
        const pN = mN ? Math.min(100, Math.round(tot / mN * 100)) : 0;
        const cl = pX >= 100 ? 'var(--gold)' : pMv >= 100 ? 'var(--g600)' : pN >= 100 ? '#ef4444' : 'var(--gray400)';

        return (
            <div className="g2">
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                        <div className="pring"><div className="pv">{p}</div><div className="pl">Pontos</div></div>
                        <div><div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 22, fontWeight: 900 }}>{user.name}</div><div style={{ fontSize: 13, color: 'var(--muted)' }}>{user.cargo || ''}</div></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{rL}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {pN >= 100 && pMv < 100 && <span className="badge" style={{ fontSize: 10, background: '#fee2e2', color: '#b91c1c' }}>🔴 Mínima!</span>}
                            {pMv >= 100 && <span className="badge bg">🟢 Média!</span>}
                            {pX >= 100 && <span className="badge bgold">🥇 Máxima!</span>}
                        </div>
                    </div>
                    <div className="pw" style={{ height: 10, position: 'relative', marginBottom: 6 }}>
                        {pN > 0 && <div className="pb" style={{ width: `${pN}%`, background: '#fca5a5', opacity: 0.4, position: 'absolute', top: 0, left: 0, height: '100%' }} />}
                        <div className="pb" style={{ width: `${pMv}%`, background: 'var(--g400)', opacity: 0.4, position: 'absolute', top: 0, left: 0, height: '100%' }} />
                        <div className="pb" style={{ width: `${pX}%`, background: cl }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
                        <span>🟢 Média: {mMv} ({pMv}%)</span><span>🥇 Máx.: {mX} ({pX}%)</span>
                    </div>
                    <hr className="divider" />
                    <div style={{ display: 'flex', gap: 24 }}>
                        <div><div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Atendimentos</div><div style={{ fontSize: 26, fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900 }}>🩺 {at}</div></div>
                        <div><div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Coletas</div><div style={{ fontSize: 26, fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900 }}>🔬 {co}</div></div>
                    </div>
                    <hr className="divider" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>🥇 Meta Máx./Dia</div>
                            <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 20, fontWeight: 900, color: 'var(--amber)' }}>{c.xd}</div>
                            <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>⭐ {c.xpd} pts</div>
                        </div>
                        <div style={{ background: 'var(--g50)', border: '1.5px solid var(--g200)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--g700)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>🟢 Meta Méd./Dia</div>
                            <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 20, fontWeight: 900, color: 'var(--g700)' }}>{c.md}</div>
                            <div style={{ fontSize: 11, color: 'var(--g600)', fontWeight: 700 }}>⭐ {c.mpd} pts</div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="ct">Histórico</div>
                    {rs.length ? (
                        <div className="tw">
                            <table>
                                <thead><tr><th>Data</th><th>Atend.</th><th>Coletas</th><th>Total</th><th>Nível</th><th>Obs</th></tr></thead>
                                <tbody>
                                    {rs.slice().reverse().map(r => {
                                        const v = (r.a || 0) + (r.c || 0);
                                        const tier = v >= c.xd ? <span className="badge bgold" style={{ fontSize: 10 }}>🥇 Máx.</span> : v >= c.md ? <span className="badge bg" style={{ fontSize: 10 }}>🟢 Med.</span> : <span className="badge bgr" style={{ fontSize: 10 }}>—</span>;
                                        return (
                                            <tr key={r.id}>
                                                <td>{fd(r.d)}</td><td>{r.a || 0}</td><td>{r.c || 0}</td><td><strong>{v}</strong></td><td>{tier}</td><td style={{ color: 'var(--muted)', fontSize: 11 }}>{r.obs || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="muted" style={{ fontSize: 13 }}>Nenhum registro neste período</p>}
                </div>
            </div>
        );
    };

    const sortedWeekCollabs = isSup && period === 'week' ? [...collabs].map(u => {
        const rs2 = records.filter(r => r.uid === u.id && inR(r.d, rS, rE));
        const at2 = rs2.reduce((s, r) => s + (r.a || 0), 0);
        const co2 = rs2.reduce((s, r) => s + (r.c || 0), 0);
        return { u, at: at2, co: co2, tot: at2 + co2 };
    }).sort((a, b) => b.tot - a.tot) : [];

    return (
        <div className="page active">
            <div className="sh" style={{ marginBottom: 24 }}>
                <div><h2>Produtividade</h2><p>Registros e acompanhamento de metas</p></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="f-tabs">
                        {!isPast && <button className={`pbtn ${period === 'day' ? 'active' : ''}`} onClick={() => setPeriod('day')}>Hoje</button>}
                        {!isPast && <button className={`pbtn ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>Semana</button>}
                        <button className={`pbtn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Mês</button>
                    </div>

                    {period === 'week' && (
                        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
                            <button className="btn btn-gh btn-sm" onClick={() => setWeekOffset(w => w - 1)} style={{ padding: '4px 8px' }}>←</button>
                            <div style={{ fontSize: 12, fontWeight: 600, padding: '0 12px', color: 'var(--g900)' }}>
                                {rL.split('—')[1]?.trim() || rL}
                            </div>
                            <button className="btn btn-gh btn-sm" onClick={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0} style={{ padding: '4px 8px' }}>→</button>
                        </div>
                    )}

                    {isSup && <button className="btn btn-a so" onClick={() => openModal('mReg')}>+ Registrar</button>}
                </div>
            </div>

            <div style={{ marginTop: 20 }}>
                {isSup ? (
                    <>
                        {period === 'week' && sortedWeekCollabs.length > 0 && (
                            <div className="card" style={{ marginBottom: 20, overflowX: 'auto' }}>
                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    📊 Resumo Semanal — <span style={{ color: 'var(--g600)', fontSize: 13 }}>{rL}</span>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontWeight: 600 }}>#</th>
                                            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontWeight: 600 }}>Colaborador</th>
                                            <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--muted)', fontWeight: 600 }}>🩺 Atend.</th>
                                            <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--muted)', fontWeight: 600 }}>🔬 Coletas</th>
                                            <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--muted)', fontWeight: 600 }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedWeekCollabs.map((x, i) => (
                                            <tr key={x.u.id} style={{ borderBottom: '1px solid var(--gray100)', background: i % 2 === 0 ? 'var(--gray50)' : '' }}>
                                                <td style={{ padding: '7px 8px', color: 'var(--muted)', fontWeight: 700 }}>{i + 1}</td>
                                                <td style={{ padding: '7px 8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div className="cav" style={{ width: 28, height: 28, fontSize: 12 }}>{x.u.name.charAt(0)}</div>
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{x.u.name}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{x.u.cargo || ''}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '7px 8px', fontWeight: 700, color: 'var(--g700)' }}>{x.at}</td>
                                                <td style={{ textAlign: 'center', padding: '7px 8px', fontWeight: 700, color: '#2563eb' }}>{x.co}</td>
                                                <td style={{ textAlign: 'center', padding: '7px 8px', fontWeight: 900, fontSize: 15 }}>{x.tot}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--g50)' }}>
                                            <td colSpan={2} style={{ padding: 8, fontWeight: 700, color: 'var(--g700)' }}>TOTAL GERAL</td>
                                            <td style={{ textAlign: 'center', padding: 8, fontWeight: 900, color: 'var(--g700)' }}>{sortedWeekCollabs.reduce((s, x) => s + x.at, 0)}</td>
                                            <td style={{ textAlign: 'center', padding: 8, fontWeight: 900, color: 'var(--g700)' }}>{sortedWeekCollabs.reduce((s, x) => s + x.co, 0)}</td>
                                            <td style={{ textAlign: 'center', padding: 8, fontWeight: 900, fontSize: 16, color: 'var(--g700)' }}>{sortedWeekCollabs.reduce((s, x) => s + x.tot, 0)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                        <div className="g3">
                            {collabs.length ? renderCards(collabs) : (
                                <div className="empty">
                                    <div className="ei">👥</div>
                                    <h3>Nenhum colaborador</h3><p>Cadastre na aba Colaboradores</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    renderCollabView()
                )}
            </div>
        </div>
    );
}
