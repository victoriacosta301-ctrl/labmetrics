'use client';

import { useState } from 'react';
import { useGlobalData } from '@/context/DataContext';
import { useAuth } from '@/hooks/useAuth';
import { td, calcPts, cfgOf, setorOf, fn, fc } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
    const { user } = useAuth();
    const { loading, users, config, records, sectors, sectorConfigs, billings, bonus, metaHistory, refresh, openModal, selectedMonth } = useGlobalData();

    const [activeTab, setActiveTab] = useState(0); // 0: Perfil, 1: Colabs, 2: Setores, 3: Sistema, 4: Acesso
    const [q, setQ] = useState('');

    const handleBackup = () => {
        const payload = {
            export_date: new Date().toISOString(),
            data: { users, config, records, sectors, sectorConfigs, billings, bonus, metaHistory }
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `labmetrics_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading || !user) return <div className="page active"><p className="muted">Carregando...</p></div>;
    if (user.role !== 'sup') return <div className="page active"><div className="empty"><h3>Acesso Negado</h3></div></div>;

    const collabs = users.filter((u: any) => u.role === 'col');
    const filteredCollabs = collabs.filter((u: any) => u.name.toLowerCase().includes(q.toLowerCase()) || u.username.toLowerCase().includes(q.toLowerCase()));
    const allUsers = users.filter((u: any) => u.name.toLowerCase().includes(q.toLowerCase()) || u.username.toLowerCase().includes(q.toLowerCase()));

    // Collaborators View
    const renderCollabs = () => {
        if (!collabs.length) {
            return <div className="empty"><div className="ei">👥</div><h3>Nenhum colaborador</h3><p>Clique em "+ Novo Colaborador" para começar</p></div>;
        }
        return (
            <div className="g3">
                {collabs.map((u: any) => {
                    const p = calcPts(u.id, records, config, sectors, sectorConfigs, bonus, metaHistory);
                    const c = cfgOf(u.id, config, sectors, sectorConfigs, selectedMonth || td().slice(0, 7), metaHistory);
                    const s = setorOf(u.id, sectors, selectedMonth || td().slice(0, 7), metaHistory);
                    return (
                        <div className="cc" key={u.id}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="cav">{u.name.charAt(0)}</div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700 }}>{u.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>@{u.username} · {u.cargo || ''}</div>
                                    </div>
                                </div>
                                <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, color: 'var(--amber)' }}>⭐{fn(p)}</div>
                            </div>
                            {s ? (
                                <div style={{ fontSize: 12, background: 'var(--g50)', border: '1px solid var(--g100)', borderRadius: 8, padding: '6px 10px', color: 'var(--g800)' }}>🏢 {s.nome}</div>
                            ) : (
                                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Sem setor definido</div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div style={{ background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>🥇 Máx./Dia</div>
                                    <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 18, fontWeight: 900, color: 'var(--amber)' }}>{c.xd}</div>
                                    <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>⭐ {c.xpd} pts</div>
                                </div>
                                <div style={{ background: 'var(--g50)', border: '1.5px solid var(--g200)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, color: 'var(--g700)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>🟢 Méd./Dia</div>
                                    <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 18, fontWeight: 900, color: 'var(--g700)' }}>{c.md}</div>
                                    <div style={{ fontSize: 10, color: 'var(--g600)', fontWeight: 700 }}>⭐ {c.mpd} pts</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-gh btn-sm" style={{ flex: 1 }} onClick={() => openModal('mCb', { uid: u.id })}>✏️ Editar</button>
                                <button className="btn btn-d btn-sm" onClick={async () => {
                                    if (confirm('Remover colaborador?')) {
                                        await supabase.from('usuarios').delete().eq('id', u.id);
                                        refresh();
                                    }
                                }}>🗑</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Sectors View
    const renderSectors = () => {
        if (!sectors.length) {
            return <div className="empty"><div className="ei">🏢</div><h3>Nenhum setor</h3><p>Clique em "+ Novo Setor" para criar o primeiro</p></div>;
        }
        return (
            <div className="g2">
                {sectors.map((s: any) => {
                    const cbs = (s.colaboradores || []).map((id: string) => users.find((u: any) => u.id === id)).filter(Boolean);
                    return (
                        <div className="card" key={s.id}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div>
                                    <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 18, fontWeight: 900, color: 'var(--g900)' }}>{s.nome}</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>Meta mensal: {fc(s.meta || 0)}</div>
                                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {cbs.length ? cbs.map((cb: any) => (
                                            <span key={cb.id} style={{ background: 'var(--g50)', border: '1px solid var(--g100)', borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 600, color: 'var(--g800)' }}>{cb.name}</span>
                                        )) : <span style={{ fontSize: 12, color: 'var(--muted)' }}>Sem colaboradores</span>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <button className="btn btn-gh btn-sm" onClick={() => openModal('mSt', { id: s.id })}>✏️ Editar</button>
                                    <button className="btn btn-d btn-sm" onClick={async () => {
                                        if (confirm('Remover este setor?')) {
                                            await supabase.from('setores').delete().eq('id', s.id);
                                            refresh();
                                        }
                                    }}>🗑</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Goals View
    const renderSystem = () => {
        if (!sectors.length) {
            return <div className="empty"><div className="ei">🏢</div><h3>Nenhum setor</h3><p>Crie setores na aba Setores para configurar metas por setor</p></div>;
        }
        return (
            <div className="g2">
                {sectors.map((s: any) => {
                    const c = sectorConfigs[s.id] || {};
                    const cbs = (s.colaboradores || []).map((id: string) => users.find((u: any) => u.id === id)).filter(Boolean);
                    const has = !!(c.xd || c.md);
                    const xD = c.xd || config?.xd || 40, xS = c.xs || config?.xs || 200, xM = c.xm || config?.xm || 880;
                    const mD = c.md || config?.md || 25, mS = c.ms || config?.ms || 125, mM = c.mm || config?.mm || 550;
                    const xpd = c.xpd || config?.xpd || 15, xps = c.xps || config?.xps || 50, xpm = c.xpm || config?.xpm || 150;
                    const mpd = c.mpd || config?.mpd || 8, mps = c.mps || config?.mps || 25, mpm = c.mpm || config?.mpm || 80;

                    return (
                        <div className="card" key={s.id}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div>
                                    <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 18, fontWeight: 900, color: 'var(--g900)' }}>{s.nome}</div>
                                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {cbs.length ? cbs.map((cb: any) => (
                                            <span key={cb.id} style={{ background: 'var(--g50)', border: '1px solid var(--g100)', borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 600, color: 'var(--g800)' }}>{cb.name}</span>
                                        )) : <span style={{ fontSize: 12, color: 'var(--muted)' }}>Sem colaboradores</span>}
                                    </div>
                                </div>
                                <span className={`badge ${has ? 'bg' : 'bgr'}`}>{has ? 'Configurado' : 'Usando Global'}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                <div style={{ background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: 10, padding: 14 }}>
                                    <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700, marginBottom: 8 }}>🥇 META MÁXIMA</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: 'var(--muted)' }}>Dia</span><strong>{xD} <span style={{ color: 'var(--gold)' }}>⭐{xpd}</span></strong></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: 'var(--muted)' }}>Semana</span><strong>{xS} <span style={{ color: 'var(--gold)' }}>⭐{xps}</span></strong></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: 'var(--muted)' }}>Mês</span><strong>{xM} <span style={{ color: 'var(--gold)' }}>⭐{xpm}</span></strong></div>
                                </div>
                                <div style={{ background: 'var(--g50)', border: '1.5px solid var(--g200)', borderRadius: 10, padding: 14 }}>
                                    <div style={{ fontSize: 11, color: 'var(--g700)', fontWeight: 700, marginBottom: 8 }}>🟢 META MÉDIA</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: 'var(--muted)' }}>Dia</span><strong>{mD} <span style={{ color: 'var(--g600)' }}>⭐{mpd}</span></strong></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: 'var(--muted)' }}>Semana</span><strong>{mS} <span style={{ color: 'var(--g600)' }}>⭐{mps}</span></strong></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: 'var(--muted)' }}>Mês</span><strong>{mM} <span style={{ color: 'var(--g600)' }}>⭐{mpm}</span></strong></div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-a btn-sm" style={{ flex: 1 }} onClick={() => openModal('mSCfg', { sid: s.id })}>✏️ Configurar Metas</button>
                                {has && <button className="btn btn-gh btn-sm" onClick={async () => {
                                    await supabase.from('scfg').delete().eq('setor_id', s.id);
                                    refresh();
                                }}>↩ Global</button>}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    function renderAccess() {
        return (
            <div className="fade-in">
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <input type="text" placeholder="🔍 Buscar usuário por nome ou Login..." value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1 }} />
                </div>
                <div className="box" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Login</th>
                                <th>Função</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.map((u: any) => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div className="av s32" style={{ background: u.role === 'sup' ? 'var(--amber)' : 'var(--blue)' }}>{u.name[0]}</div>
                                            <strong>{u.name}</strong>
                                        </div>
                                    </td>
                                    <td><code>{u.username}</code></td>
                                    <td>
                                        <span className={`badge ${u.role === 'sup' ? 'b-amber' : 'b-blue'}`}>
                                            {u.role === 'sup' ? '🌟 Supervisora' : '👤 Colaboradora'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-gh btn-icon" title="Editar" onClick={() => openModal('mUser', u)}>✏️</button>
                                        <button className="btn btn-gh btn-icon" title="Remover" onClick={() => handleDelUser(u.id, u.name)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    async function handleDelUser(id: string, name: string) {
        if (!confirm(`Deseja realmente remover o acesso de ${name}?`)) return;
        const { error } = await supabase.from('usuarios').delete().eq('id', id);
        if (error) alert('Erro ao remover usuário: ' + error.message);
        else refresh();
    }

    return (
        <div className="page active" style={{ maxWidth: 1000 }}>
            <div className="sh" style={{ marginBottom: 20 }}>
                <div>
                    <h2>Configurações</h2>
                    <p>Gerencie equipe, setores e pontuações</p>
                </div>
                <div>
                    {activeTab === 1 && <button className="btn btn-a" onClick={() => openModal('mCollab')}>+ Novo Colaborador</button>}
                    {activeTab === 4 && <button className="btn btn-a" onClick={() => openModal('mUser')}>+ Novo Usuário</button>}
                    {activeTab === 2 && <button className="btn btn-a" onClick={() => openModal('mSt')}>+ Novo Setor</button>}
                    {activeTab === 3 && <button className="btn btn-gh" onClick={() => openModal('mGCfg')}>⚙️ Editar Metas Globais</button>}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 20, borderBottom: '1.5px solid var(--border)', marginBottom: 24 }}>
                <span className={`tab ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>👤 Perfil</span>
                <span className={`tab ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>👥 Colaboradores</span>
                <span className={`tab ${activeTab === 4 ? 'active' : ''}`} onClick={() => setActiveTab(4)}>🔑 Acesso e Sistema</span>
                <span className={`tab ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>🏢 Setores</span>
                <span className={`tab ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>⚙️ Configurações</span>
            </div>

            <div style={{ marginTop: 24 }}>
                {activeTab === 1 && renderCollabs()}
                {activeTab === 2 && renderSectors()}
                {activeTab === 3 && renderSystem()}
                {activeTab === 4 && renderAccess()}
            </div>

            <div className="sh" style={{ marginTop: 40, borderTop: '1px solid var(--g200)', paddingTop: 24, paddingBottom: 10 }}>
                <div>
                    <h3>Manutenção e Backup</h3>
                    <p className="muted" style={{ fontSize: 13 }}>Exporte todas as tabelas de dados brutos para um arquivo fechado e seguro JSON.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-gh" onClick={handleBackup}>💾 Baixar Backup Total (.json)</button>
                    <button className="btn btn-gh" onClick={() => openModal('mRestore')}>📤 Restaurar Backup</button>
                </div>
                <button className="btn btn-a" onClick={() => openModal('mCloseMonth')}>📅 Fechar Mês</button>
            </div>
        </div>
    );
}
