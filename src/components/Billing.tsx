'use client';

import { useGlobalData } from '@/context/DataContext';
import { useAuth } from '@/hooks/useAuth';
import { td, mo, inR, fc, fd } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function BillingPage() {
    const { user } = useAuth();
    const { loading, users, sectors, billings, refresh, openModal, selectedMonth } = useGlobalData();

    if (loading || !user) return <div className="page active"><p className="muted">Carregando...</p></div>;

    const today = td();
    const effectiveDate = selectedMonth ? `${selectedMonth}-01` : today;
    const mr = mo(effectiveDate);
    const isSup = user.role === 'sup';

    const visSectors = isSup ? sectors : sectors.filter(s => (s.colaboradores || []).includes(user.id));

    const handleDeleteFt = async (fid: string) => {
        if (!confirm('Excluir este faturamento permanentemente?')) return;
        await supabase.from('faturamentos').delete().eq('id', fid);
        refresh();
    };

    if (!visSectors.length) {
        return (
            <div className="page active">
                <div className="empty">
                    <div className="ei">🏢</div>
                    <h3>{isSup ? 'Nenhum setor cadastrado' : 'Você não está em nenhum setor'}</h3>
                    <p>{isSup ? 'Cadastre na aba Configurações' : 'Fale com a supervisora'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page active">
            <div className="sh" style={{ marginBottom: 24 }}>
                <div><h2>Faturamento</h2><p>Receitas por setor</p></div>
                {isSup && <button className="btn btn-a so" onClick={() => openModal('mFt')}>+ Registrar Faturamento</button>}
            </div>

            <div className="g1">
                {visSectors.map(s => {
                    const sf = billings.filter(f => f.sid === s.id && inR(f.d, mr.s, mr.e));
                    const tot = sf.reduce((a, f) => a + (f.v || 0), 0);
                    const pct = s.meta ? Math.min(100, Math.round(tot / s.meta * 100)) : 0;
                    const cl = pct >= 100 ? 'var(--g600)' : pct >= 70 ? 'var(--warn)' : 'var(--gray400)';
                    const cbs = (s.colaboradores || []).map((id: string) => users.find(u => u.id === id)).filter(Boolean);
                    const rs = sf.slice().sort((a, b) => b.d.localeCompare(a.d));

                    return (
                        <div className="card mb16" key={s.id}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
                                <div>
                                    <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 19, fontWeight: 900, color: 'var(--g900)' }}>{s.nome}</div>
                                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {cbs.length ? cbs.map((cb: any) => (
                                            <span key={cb.id} style={{ background: 'var(--g50)', border: '1px solid var(--g100)', borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 600, color: 'var(--g800)' }}>{cb.name}</span>
                                        )) : <span style={{ fontSize: 12, color: 'var(--muted)' }}>Sem colaboradores</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="g3 mb16">
                                <div className="sc"><div className="slbl">Faturado no Mês</div><div className="sval" style={{ color: cl, fontSize: 22 }}>{fc(tot)}</div></div>
                                <div className="sc"><div className="slbl">Meta Mensal</div><div className="sval" style={{ fontSize: 22 }}>{fc(s.meta || 0)}</div></div>
                                <div className="sc">
                                    <div className="slbl">Progresso</div>
                                    <div className="sval" style={{ color: cl, fontSize: 22 }}>{pct}%</div>
                                    <div className="pw mt8"><div className="pb" style={{ width: `${pct}%`, background: cl }} /></div>
                                </div>
                            </div>

                            <div className="ct">Registros do Mês</div>
                            {rs.length ? (
                                <div className="tw">
                                    <table>
                                        <thead>
                                            <tr><th>Data</th><th>Valor</th><th>Obs</th>{isSup && <th>Ações</th>}</tr>
                                        </thead>
                                        <tbody>
                                            {rs.map(r => (
                                                <tr key={r.id}>
                                                    <td>{fd(r.d)}</td>
                                                    <td><strong style={{ color: 'var(--g700)' }}>{fc(r.v)}</strong></td>
                                                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{r.obs || '—'}</td>
                                                    {isSup && (
                                                        <td><button className="btn btn-d btn-sm" onClick={() => handleDeleteFt(r.id)}>🗑</button></td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <p className="muted" style={{ fontSize: 13 }}>Nenhum registro este mês</p>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
