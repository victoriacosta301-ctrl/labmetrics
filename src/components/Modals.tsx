'use client';

import { useState, useEffect, Fragment } from 'react';
import { useGlobalData } from '@/context/DataContext';
import { supabase } from '@/lib/supabase';
import { td, fd, calcPts, fn, cfgOf, wk } from '@/lib/utils';
import { gerarPDF } from '@/lib/pdf';

export default function Modals() {
    const { modal, closeModal, users, sectors, config, records, sectorConfigs, bonus, metaHistory, refresh } = useGlobalData();

    if (!modal) return null;

    return (
        <div className="mo" style={{ display: 'flex' }} onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
        }}>
            {modal.type === 'mReg' && <ModalReg closeModal={closeModal} users={users} sectors={sectors} config={config} records={records} sectorConfigs={sectorConfigs} metaHistory={metaHistory} refresh={refresh} payload={modal.payload} />}
            {modal.type === 'mUser' && <ModalUser closeModal={closeModal} refresh={refresh} payload={modal.payload} />}
            {modal.type === 'mSt' && <ModalSector closeModal={closeModal} sectors={sectors} users={users} refresh={refresh} payload={modal.payload} />}
            {modal.type === 'mFt' && <ModalFaturamento closeModal={closeModal} sectors={sectors} refresh={refresh} payload={modal.payload} />}
            {modal.type === 'mEC' && <ModalEditCollab closeModal={closeModal} users={users} config={config} records={records} sectors={sectors} sectorConfigs={sectorConfigs} bonus={bonus} metaHistory={metaHistory} refresh={refresh} payload={modal.payload} openModal={modal.payload?.openModal} />}
            {modal.type === 'mSCfg' && <ModalSectorConfig closeModal={closeModal} sectors={sectors} sectorConfigs={sectorConfigs} config={config} refresh={refresh} payload={modal.payload} />}
            {modal.type === 'mGCfg' && <ModalGlobalConfig closeModal={closeModal} config={config} refresh={refresh} />}
            {modal.type === 'mPdf' && <ModalPdf closeModal={closeModal} />}
            {modal.type === 'mSenha' && <ModalSenha closeModal={closeModal} refresh={refresh} payload={modal.payload} />}
            {modal.type === 'mCloseMonth' && <ModalCloseMonth closeModal={closeModal} config={config} sectors={sectors} sectorConfigs={sectorConfigs} refresh={refresh} />}
            {modal.type === 'mRestore' && <ModalRestore closeModal={closeModal} refresh={refresh} />}
        </div>
    );
}

function ModalReg({ closeModal, users, sectors, config, records, sectorConfigs, metaHistory, refresh, payload }: any) {
    const [uid, setUid] = useState(payload?.uid || '');
    const [dt, setDt] = useState(payload?.d || td());
    const [at, setAt] = useState(payload?.a ?? '');
    const [co, setCo] = useState(payload?.c ?? '');
    const [obs, setObs] = useState(payload?.obs || '');
    const [loading, setLoading] = useState(false);

    let progressUi = null;
    if (uid && dt) {
        const u = users.find((x: any) => x.id === uid);
        if (u) {
            const mes = dt.slice(0, 7);
            const c = cfgOf(uid, config, sectors, sectorConfigs, mes, metaHistory);
            const dayRecords = records.filter((r: any) => r.uid === uid && r.d === dt && r.id !== payload?.id);
            const currentTotal = dayRecords.reduce((s: number, r: any) => s + (r.a || 0) + (r.c || 0), 0);
            const inputTotal = (Number(at) || 0) + (Number(co) || 0);
            const projectedTotal = currentTotal + inputTotal;
            const isMax = projectedTotal >= c.xd;
            const isMed = projectedTotal >= c.md;

            progressUi = (
                <div style={{ marginTop: 8, padding: '8px 12px', background: isMax ? '#ecfccb' : 'var(--gray50)', border: `1.5px solid ${isMax ? '#a3e635' : 'var(--border)'}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, color: 'var(--g800)' }}>
                        Progresso em <strong>{fd(dt)}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: isMax ? '#65a30d' : 'var(--g900)' }}>
                            {projectedTotal} / {c.xd}
                        </span>
                        {isMax && <span className="badge bgold" style={{ fontSize: 10 }}>🥇 Máxima</span>}
                        {!isMax && isMed && <span className="badge bg" style={{ fontSize: 10 }}>🟢 Média</span>}
                    </div>
                </div>
            );
        }
    }

    const handleSave = async () => {
        if (!uid || !dt) return alert('Preencha Colaborador e Data!');
        setLoading(true);

        if (payload?.isEdit && payload?.id) {
            await supabase.from('registros').update({
                uid,
                data: dt,
                atendimentos: Number(at) || 0,
                coletas: Number(co) || 0,
                obs
            }).eq('id', payload.id);
        } else {
            const novoId = Math.random().toString(36).substring(2, 9);
            await supabase.from('registros').insert([{
                id: novoId,
                uid,
                data: dt,
                atendimentos: Number(at) || 0,
                coletas: Number(co) || 0,
                obs
            }]);
        }
        refresh();
        closeModal();
    };

    return (
        <div className="modal">
            <h3>📋 Registrar Produtividade</h3>
            <div className="fr c2">
                <div>
                    <label className="fl">Colaborador</label>
                    <select value={uid} onChange={e => setUid(e.target.value)}>
                        <option value="">Selecione...</option>
                        {users.filter((u: any) => u.role !== 'sup').map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>
                <div><label className="fl">Data</label><input type="date" value={dt} onChange={e => setDt(e.target.value)} /></div>
            </div>
            {progressUi}
            <div className="fr c2" style={{ marginTop: 14 }}>
                <div><label className="fl">Atendimentos</label><input type="number" placeholder="0" min="0" value={at} onChange={e => setAt(e.target.value)} /></div>
                <div><label className="fl">Coletas</label><input type="number" placeholder="0" min="0" value={co} onChange={e => setCo(e.target.value)} /></div>
            </div>
            <div><label className="fl">Observação</label><input type="text" placeholder="Opcional..." value={obs} onChange={e => setObs(e.target.value)} /></div>
            <div className="ma">
                <button className="btn btn-gh" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-a" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
        </div>
    );
}

function ModalUser({ closeModal, refresh, payload }: any) {
    const isEdit = !!payload?.id;
    const [nm, setNm] = useState(payload?.name || '');
    const [us, setUs] = useState(payload?.username || '');
    const [pw, setPw] = useState('');
    const [role, setRole] = useState(payload?.role || 'col');
    const [cg, setCg] = useState(payload?.cargo || 'Atendente');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!nm || !us || (!isEdit && !pw)) return alert('Preencha Nome, Usuário e Senha!');
        setLoading(true);
        
        const userData: any = {
            name: nm,
            username: us,
            role: role,
            cargo: role === 'sup' ? 'Supervisor' : cg
        };
        if (pw) userData.password = pw;

        try {
            if (isEdit) {
                const { error } = await supabase.from('usuarios').update(userData).eq('id', payload.id);
                if (error) throw error;
            } else {
                userData.id = Math.random().toString(36).substring(2, 9);
                const { error } = await supabase.from('usuarios').insert([userData]);
                if (error) throw error;
            }
            refresh();
            closeModal();
        } catch (e: any) {
            alert('Erro ao salvar usuário: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal" style={{ width: 480 }}>
            <h3>{isEdit ? '👤 Editar Usuário' : '👤 Novo Usuário'}</h3>
            
            <div style={{ marginBottom: 20 }}>
                <label className="fl">Função / Nível de Acesso</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <button type="button" 
                        className={`btn ${role === 'col' ? 'btn-a' : 'btn-gh'}`} 
                        style={{ flex: 1 }} 
                        onClick={() => setRole('col')}>
                        👤 Colaboradora
                    </button>
                    <button type="button" 
                        className={`btn ${role === 'sup' ? 'btn-a' : 'btn-gh'}`} 
                        style={{ flex: 1, borderColor: role === 'sup' ? 'var(--amber)' : '', background: role === 'sup' ? 'var(--amber)' : '' }} 
                        onClick={() => setRole('sup')}>
                        🌟 Supervisora
                    </button>
                </div>
            </div>

            <div className="fr c2">
                <div><label className="fl">Nome Completo</label><input type="text" placeholder="Nome" value={nm} onChange={e => setNm(e.target.value)} /></div>
                {role === 'col' && (
                    <div>
                        <label className="fl">Cargo</label>
                        <select value={cg} onChange={e => setCg(e.target.value)}>
                            <option value="Atendente">Atendente</option>
                            <option value="Coletador">Coletador</option>
                            <option value="Administrativo">Administrativo</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="fr c2" style={{ marginTop: 12 }}>
                <div><label className="fl">Usuário (login)</label><input type="text" placeholder="ex: login.acesso" value={us} onChange={e => setUs(e.target.value)} /></div>
                <div>
                    <label className="fl">{isEdit ? 'Nova Senha (opcional)' : 'Senha'}</label>
                    <input type="password" placeholder="Senha de acesso" value={pw} onChange={e => setPw(e.target.value)} />
                </div>
            </div>

            <div className="ma" style={{ marginTop: 24 }}>
                <button className="btn btn-gh" onClick={closeModal} disabled={loading}>Cancelar</button>
                <button className="btn btn-a" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Usuário'}</button>
            </div>
        </div>
    );
}

function ModalSector({ closeModal, sectors, users, refresh, payload }: any) {
    const editId = payload?.id;
    const existing = editId ? sectors.find((s: any) => s.id === editId) : null;

    const [nm, setNm] = useState(existing?.nome || '');
    const [mt, setMt] = useState(existing?.meta?.toString() || '');
    const [selectedCollabs, setSelectedCollabs] = useState<string[]>(existing?.colaboradores || []);
    const [loading, setLoading] = useState(false);

    const collabs = users.filter((u: any) => u.role !== 'sup');

    const toggleCollab = (id: string) => {
        setSelectedCollabs(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!nm) return alert('Dê um nome ao setor!');
        setLoading(true);
        const id = editId || Math.random().toString(36).substring(2, 9);
        await supabase.from('setores').upsert([{
            id,
            nome: nm,
            meta: Number(mt) || 0,
            colaboradores: selectedCollabs
        }]);
        refresh();
        closeModal();
    };

    return (
        <div className="modal">
            <h3>{editId ? '✏️ Editar Setor' : '🏢 Novo Setor de Faturamento'}</h3>
            <div><label className="fl">Nome do Setor</label><input type="text" placeholder="Ex: Recepção, Coleta Domiciliar..." value={nm} onChange={e => setNm(e.target.value)} /></div>
            <div className="mt12"><label className="fl">Meta de Faturamento Mensal (R$)</label><input type="number" placeholder="Ex: 50000" min="0" value={mt} onChange={e => setMt(e.target.value)} /></div>
            <div className="mt12">
                <label className="fl">Colaboradores do Setor</label>
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                    {collabs.length ? collabs.map((u: any) => (
                        <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--gray50)', border: '1.5px solid var(--border)', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                            <input type="checkbox" checked={selectedCollabs.includes(u.id)} onChange={() => toggleCollab(u.id)} />
                            {u.name}
                            <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>{u.cargo || ''}</span>
                        </label>
                    )) : <span style={{ fontSize: 12, color: 'var(--muted)' }}>Nenhum colaborador cadastrado</span>}
                </div>
            </div>
            <div className="ma">
                <button className="btn btn-gh" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-a" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
        </div>
    );
}

function ModalFaturamento({ closeModal, sectors, refresh, payload }: any) {
    const [sid, setSid] = useState('');
    const [dt, setDt] = useState(td());
    const [vl, setVl] = useState('');
    const [obs, setObs] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!sid || !dt || !vl) return alert('Preencha Setor, Data e Valor!');
        setLoading(true);
        const novoId = Math.random().toString(36).substring(2, 9);
        await supabase.from('faturamentos').insert([{
            id: novoId,
            setor_id: sid,
            data: dt,
            valor: Number(vl) || 0,
            obs
        }]);
        refresh();
        closeModal();
    };

    return (
        <div className="modal">
            <h3>💰 Registrar Faturamento</h3>
            <div className="fr c2">
                <div>
                    <label className="fl">Setor</label>
                    <select value={sid} onChange={e => setSid(e.target.value)}>
                        <option value="">Selecione...</option>
                        {sectors.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                </div>
                <div><label className="fl">Data</label><input type="date" value={dt} onChange={e => setDt(e.target.value)} /></div>
            </div>
            <div><label className="fl">Valor Faturado (R$)</label><input type="number" placeholder="0,00" min="0" step="0.01" value={vl} onChange={e => setVl(e.target.value)} /></div>
            <div className="mt12"><label className="fl">Observação</label><input type="text" placeholder="Opcional..." value={obs} onChange={e => setObs(e.target.value)} /></div>
            <div className="ma">
                <button className="btn btn-gh" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-a" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
        </div>
    );
}

function ModalEditCollab({ closeModal, users, config, records, sectors, sectorConfigs, bonus, metaHistory, refresh, payload, openModal }: any) {
    const uid = payload?.uid;
    const u = users.find((x: any) => x.id === uid);
    const [ptsInput, setPtsInput] = useState(bonus[uid] || 0);
    const [obsInput, setObsInput] = useState('');
    const [loading, setLoading] = useState(false);

    if (!u) return null;

    const ur = records.filter((r: any) => r.uid === uid).sort((a: any, b: any) => b.d.localeCompare(a.d));
    const totalPts = calcPts(uid, records, config, sectors, sectorConfigs, bonus, metaHistory);

    const handleSaveBonus = async () => {
        setLoading(true);
        const pts = Number(ptsInput) || 0;
        await supabase.from('bonus').upsert({ uid, pontos: pts });
        refresh();
        closeModal();
    };

    const handleDeleteR = async (rid: string) => {
        if (!confirm('Excluir este registro?')) return;
        await supabase.from('registros').delete().eq('id', rid);
        refresh();
    };

    return (
        <div className="modal" style={{ width: 640 }}>
            <h3>✏️ {u.name} — Editar</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--g50)', border: '1.5px solid var(--g100)', borderRadius: 12, marginBottom: 20 }}>
                <div className="cav">{u.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.cargo || ''} · ⭐ {fn(calcPts(uid, records, config, sectors, sectorConfigs, bonus, metaHistory))} pontos calculados</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pontos totais</div>
                    <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, fontSize: 24, color: 'var(--amber)' }}>{totalPts}</div>
                </div>
            </div>

            <div className="ct" style={{ fontSize: 13, marginBottom: 10 }}>🎯 Ajuste Manual de Pontos</div>
            <div className="ibox">Somado aos pontos calculados automaticamente pelas metas. Use valor negativo para subtrair.</div>
            <div className="fr c2">
                <div><label className="fl">Pontos de Bônus / Ajuste</label><input type="number" placeholder="Ex: 10 ou -5" value={ptsInput} onChange={e => setPtsInput(e.target.value)} /></div>
                <div><label className="fl">Motivo (opcional)</label><input type="text" placeholder="Ex: bônus especial..." value={obsInput} onChange={e => setObsInput(e.target.value)} /></div>
            </div>

            <div className="divider"></div>
            <div className="ct" style={{ fontSize: 13, marginBottom: 10 }}>📋 Registros — Editar ou Excluir</div>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {ur.length ? (
                    <div className="tw">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ textAlign: 'left', padding: '8px' }}>Data</th>
                                    <th style={{ textAlign: 'center', padding: '8px' }}>Prod.</th>
                                    <th style={{ textAlign: 'center', padding: '8px' }}>Meta</th>
                                    <th style={{ textAlign: 'left', padding: '8px' }}>Obs</th>
                                    <th style={{ textAlign: 'right', padding: '8px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const weeks: any[] = [];
                                    ur.forEach((r: any) => {
                                        const w = wk(r.d);
                                        let week = weeks.find(x => x.s === w.s);
                                        if (!week) {
                                            week = { s: w.s, e: w.e, rs: [] };
                                            weeks.push(week);
                                        }
                                        week.rs.push(r);
                                    });

                                    return weeks.map(week => {
                                        // Calculate weekly total
                                        const wTot = week.rs.reduce((s: number, r: any) => s + (r.a || 0) + (r.c || 0), 0);
                                        const mes = week.s.slice(0, 7);
                                        const c = cfgOf(uid, config, sectors, sectorConfigs, mes, metaHistory);
                                        const wTier = wTot >= c.xs ? <span className="badge bgold" style={{ fontSize: 10 }}>🥇 Máxima Semanal</span> : wTot >= c.ms ? <span className="badge bg" style={{ fontSize: 10 }}>🟢 Média Semanal</span> : null;

                                        return (
                                            <Fragment key={week.s}>
                                                {week.rs.map((r: any) => {
                                                    const dTot = (r.a || 0) + (r.c || 0);
                                                    const dMes = r.d.slice(0, 7);
                                                    const dCfg = cfgOf(uid, config, sectors, sectorConfigs, dMes, metaHistory);
                                                    const dTier = dTot >= dCfg.xd ? <span className="badge bgold" style={{ fontSize: 10 }}>🥇 Máxima</span> : dTot >= dCfg.md ? <span className="badge bg" style={{ fontSize: 10 }}>🟢 Média</span> : <span style={{ color: 'var(--muted)', fontSize: 10 }}>—</span>;

                                                    return (
                                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--gray100)' }}>
                                                            <td style={{ padding: '8px', fontSize: 13 }}>{fd(r.d)}</td>
                                                            <td style={{ textAlign: 'center', padding: '8px' }}>
                                                                <div style={{ fontSize: 13, fontWeight: 700 }}>{dTot}</div>
                                                                <div style={{ fontSize: 10, color: 'var(--muted)' }}>🩺{r.a || 0} 🔬{r.c || 0}</div>
                                                            </td>
                                                            <td style={{ textAlign: 'center', padding: '8px' }}>{dTier}</td>
                                                            <td style={{ padding: '8px', color: 'var(--muted)', fontSize: 11, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.obs || '—'}</td>
                                                            <td style={{ textAlign: 'right', padding: '8px', whiteSpace: 'nowrap' }}>
                                                                <button className="btn btn-bl btn-sm" onClick={() => { closeModal(); openModal?.('mReg', { ...r, isEdit: true }); }}>✏️</button>
                                                                <button className="btn btn-d btn-sm" style={{ marginLeft: 4 }} onClick={() => handleDeleteR(r.id)}>🗑</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr style={{ background: 'var(--gray50)', borderBottom: '2px solid var(--border)' }}>
                                                    <td colSpan={2} style={{ padding: '10px 8px', fontSize: 12, fontWeight: 700, color: 'var(--g700)' }}>
                                                        TOTAL SEMANAL ({fd(week.s)} - {fd(week.e)})
                                                    </td>
                                                    <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                                                        <div style={{ fontSize: 14, fontWeight: 900 }}>{wTot}</div>
                                                        {wTier}
                                                    </td>
                                                    <td colSpan={2}></td>
                                                </tr>
                                            </Fragment>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="muted" style={{ fontSize: 13, padding: '8px 0' }}>Nenhum registro encontrado</p>}
            </div>

            <div className="ma">
                <button className="btn btn-gh" onClick={closeModal}>Fechar</button>
                <button className="btn btn-a" onClick={handleSaveBonus} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Ajuste de Pontos'}</button>
            </div>
        </div>
    );
}

function ModalSectorConfig({ closeModal, sectors, sectorConfigs, config, refresh, payload }: any) {
    const sid = payload?.sid;
    const s = sectors.find((x: any) => x.id === sid);
    const cb = sectorConfigs[sid] || {};
    const gb = config || {};

    const [xd, setXd] = useState(cb.xd || gb.xd || 40);
    const [xs, setXs] = useState(cb.xs || gb.xs || 200);
    const [xm, setXm] = useState(cb.xm || gb.xm || 880);
    const [xpd, setXpd] = useState(cb.xpd || gb.xpd || 15);
    const [xps, setXps] = useState(cb.xps || gb.xps || 50);
    const [xpm, setXpm] = useState(cb.xpm || gb.xpm || 150);

    const [md, setMd] = useState(cb.md || gb.md || 25);
    const [ms, setMs] = useState(cb.ms || gb.ms || 125);
    const [mm, setMm] = useState(cb.mm || gb.mm || 550);
    const [mpd, setMpd] = useState(cb.mpd || gb.mpd || 8);
    const [mps, setMps] = useState(cb.mps || gb.mps || 25);
    const [mpm, setMpm] = useState(cb.mpm || gb.mpm || 80);

    const [loading, setLoading] = useState(false);

    if (!s) return null;

    const fillX = (v: string) => {
        const val = Number(v);
        setXd(val);
        if (val) { setXs(val * 5); setXm(val * 22); }
    };
    const fillM = (v: string) => {
        const val = Number(v);
        setMd(val);
        if (val) { setMs(val * 5); setMm(val * 22); }
    };

    const handleSave = async () => {
        setLoading(true);
        await supabase.from('scfg').upsert({
            setor_id: sid, xd, xs, xm, xpd, xps, xpm, md, ms, mm, mpd, mps, mpm
        });
        refresh();
        closeModal();
    };

    return (
        <div className="modal" style={{ width: 700 }}>
            <h3>🎯 Configurar Metas do Setor</h3>
            <div style={{ background: 'var(--g50)', border: '1.5px solid var(--g100)', borderRadius: 10, padding: '11px 14px', marginBottom: 14, fontSize: 13, color: 'var(--g900)' }}>
                Setor: <strong>{s.nome}</strong>
            </div>
            <div className="acum-box" style={{ marginBottom: 14 }}>💡 Insira a meta diária → semanal (×5) e mensal (×22) preenchidas automaticamente.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: 9, marginBottom: 12 }}>
                        <span>🥇</span><span style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 800, color: 'var(--amber)', fontSize: 13 }}>Meta Máxima</span>
                    </div>
                    <div className="fr c3">
                        <div><label className="fl">Dia</label><input type="number" value={xd} onChange={e => fillX(e.target.value)} min="1" /></div>
                        <div><label className="fl">Semana</label><input type="number" value={xs} onChange={e => setXs(Number(e.target.value))} /></div>
                        <div><label className="fl">Mês</label><input type="number" value={xm} onChange={e => setXm(Number(e.target.value))} /></div>
                    </div>
                    <div className="fr c3">
                        <div><label className="fl">⭐ Pts/Dia</label><input type="number" value={xpd} onChange={e => setXpd(Number(e.target.value))} /></div>
                        <div><label className="fl">⭐ Pts/Sem</label><input type="number" value={xps} onChange={e => setXps(Number(e.target.value))} /></div>
                        <div><label className="fl">⭐ Pts/Mês</label><input type="number" value={xpm} onChange={e => setXpm(Number(e.target.value))} /></div>
                    </div>
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--g50)', border: '1.5px solid var(--g200)', borderRadius: 9, marginBottom: 12 }}>
                        <span>🟢</span><span style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 800, color: 'var(--g700)', fontSize: 13 }}>Meta Média</span>
                    </div>
                    <div className="fr c3">
                        <div><label className="fl">Dia</label><input type="number" value={md} onChange={e => fillM(e.target.value)} min="1" /></div>
                        <div><label className="fl">Semana</label><input type="number" value={ms} onChange={e => setMs(Number(e.target.value))} /></div>
                        <div><label className="fl">Mês</label><input type="number" value={mm} onChange={e => setMm(Number(e.target.value))} /></div>
                    </div>
                    <div className="fr c3">
                        <div><label className="fl">⭐ Pts/Dia</label><input type="number" value={mpd} onChange={e => setMpd(Number(e.target.value))} /></div>
                        <div><label className="fl">⭐ Pts/Sem</label><input type="number" value={mps} onChange={e => setMps(Number(e.target.value))} /></div>
                        <div><label className="fl">⭐ Pts/Mês</label><input type="number" value={mpm} onChange={e => setMpm(Number(e.target.value))} /></div>
                    </div>
                </div>
            </div>

            <div className="ma">
                <button className="btn btn-gh" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-a" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
        </div>
    );
}

function ModalPdf({ closeModal }: any) {
    const [mes, setMes] = useState('');
    const { users, records, billings, sectors, config, sectorConfigs, bonus, metaHistory } = useGlobalData();

    const handleGenerate = () => {
        if (!mes) return alert('Selecione o mês!');
        try {
            const ok = gerarPDF(mes, users, records, billings, sectors, config, sectorConfigs, bonus, metaHistory);
            if (ok) {
                closeModal();
            } else {
                alert('Mês inválido');
            }
        } catch (e: any) {
            console.error(e);
            alert('Erro ao gerar PDF: ' + e.message);
        }
    };

    return (
        <div className="modal" style={{ width: 420 }}>
            <h3>📄 Relatório Mensal PDF</h3>
            <div className="ibox" style={{ marginBottom: 18 }}>Selecione o mês de referência. O relatório incluirá ranking de produtividade, metas, pontuações e ranking de faturamento por setor.</div>
            <div><label className="fl">Mês de Referência</label><input type="month" style={{ width: '100%' }} value={mes} onChange={e => setMes(e.target.value)} /></div>
            <div className="ma">
                <button className="btn btn-gh" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-a" onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Gerar e Baixar PDF
                </button>
            </div>
        </div>
    );
}

function ModalSenha({ closeModal, refresh, payload }: any) {
    const [pw, setPw] = useState('');
    const [loading, setLoading] = useState(false);

    const uid = payload?.uid;

    const handleSave = async () => {
        if (!pw) return alert('Digite a nova senha!');
        setLoading(true);
        await supabase.from('usuarios').update({ password: pw }).eq('id', uid);
        refresh();
        alert('Senha alterada com sucesso!');
        closeModal();
    };

    return (
        <div className="modal">
            <h3>🔑 Alterar Senha</h3>
            <div className="ibox" style={{ marginBottom: 18 }}>Digite a nova senha para o seu usuário.</div>
            <div><label className="fl">Nova Senha</label><input type="password" value={pw} onChange={e => setPw(e.target.value)} /></div>
            <div className="ma">
                <button className="btn btn-gh" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-a" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Senha'}</button>
            </div>
        </div>
    );
}

function ModalGlobalConfig({ closeModal, config, refresh }: any) {
    const gb = config || {};

    const [xd, setXd] = useState(gb.xd || 40);
    const [xs, setXs] = useState(gb.xs || 200);
    const [xm, setXm] = useState(gb.xm || 880);
    const [xpd, setXpd] = useState(gb.xpd || 15);
    const [xps, setXps] = useState(gb.xps || 50);
    const [xpm, setXpm] = useState(gb.xpm || 150);

    const [md, setMd] = useState(gb.md || 25);
    const [ms, setMs] = useState(gb.ms || 125);
    const [mm, setMm] = useState(gb.mm || 550);
    const [mpd, setMpd] = useState(gb.mpd || 8);
    const [mps, setMps] = useState(gb.mps || 25);
    const [mpm, setMpm] = useState(gb.mpm || 80);

    const [loading, setLoading] = useState(false);

    const fillX = (v: string) => {
        const val = Number(v);
        setXd(val);
        if (val) { setXs(val * 5); setXm(val * 22); }
    };
    const fillM = (v: string) => {
        const val = Number(v);
        setMd(val);
        if (val) { setMs(val * 5); setMm(val * 22); }
    };

    const handleSave = async () => {
        setLoading(true);
        await supabase.from('config').update({
            xd, xs, xm, xpd, xps, xpm, md, ms, mm, mpd, mps, mpm
        }).eq('id', 1);
        refresh();
        closeModal();
    };

    return (
        <div className="modal" style={{ width: 700 }}>
            <h3>🎯 Configurar Metas Globais</h3>
            <div className="acum-box" style={{ marginBottom: 14 }}>💡 Insira a meta diária → semanal (×5) e mensal (×22) preenchidas automaticamente.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: 9, marginBottom: 12 }}>
                        <span>🥇</span><span style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 800, color: 'var(--amber)', fontSize: 13 }}>Meta Máxima Global</span>
                    </div>
                    <div className="fr c3">
                        <div><label className="fl">Dia</label><input type="number" value={xd} onChange={e => fillX(e.target.value)} min="1" /></div>
                        <div><label className="fl">Semana</label><input type="number" value={xs} onChange={e => setXs(Number(e.target.value))} /></div>
                        <div><label className="fl">Mês</label><input type="number" value={xm} onChange={e => setXm(Number(e.target.value))} /></div>
                    </div>
                    <div className="fr c3">
                        <div><label className="fl">⭐ Pts/Dia</label><input type="number" value={xpd} onChange={e => setXpd(Number(e.target.value))} /></div>
                        <div><label className="fl">⭐ Pts/Sem</label><input type="number" value={xps} onChange={e => setXps(Number(e.target.value))} /></div>
                        <div><label className="fl">⭐ Pts/Mês</label><input type="number" value={xpm} onChange={e => setXpm(Number(e.target.value))} /></div>
                    </div>
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--g50)', border: '1.5px solid var(--g200)', borderRadius: 9, marginBottom: 12 }}>
                        <span>🟢</span><span style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 800, color: 'var(--g700)', fontSize: 13 }}>Meta Média Global</span>
                    </div>
                    <div className="fr c3">
                        <div><label className="fl">Dia</label><input type="number" value={md} onChange={e => fillM(e.target.value)} min="1" /></div>
                        <div><label className="fl">Semana</label><input type="number" value={ms} onChange={e => setMs(Number(e.target.value))} /></div>
                        <div><label className="fl">Mês</label><input type="number" value={mm} onChange={e => setMm(Number(e.target.value))} /></div>
                    </div>
                    <div className="fr c3">
                        <div><label className="fl">⭐ Pts/Dia</label><input type="number" value={mpd} onChange={e => setMpd(Number(e.target.value))} /></div>
                        <div><label className="fl">⭐ Pts/Sem</label><input type="number" value={mps} onChange={e => setMps(Number(e.target.value))} /></div>
                        <div><label className="fl">⭐ Pts/Mês</label><input type="number" value={mpm} onChange={e => setMpm(Number(e.target.value))} /></div>
                    </div>
                </div>
            </div>

            <div className="ma">
                <button className="btn btn-gh" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-a" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
        </div>
    );
}

function ModalCloseMonth({ closeModal, config, sectors, sectorConfigs, refresh }: any) {
    const now = new Date();
    const defaultMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [mes, setMes] = useState(defaultMes);
    const [loading, setLoading] = useState(false);

    const gc = config || {};
    const keys = ['xd', 'xs', 'xm', 'xpd', 'xps', 'xpm', 'md', 'ms', 'mm', 'mpd', 'mps', 'mpm'] as const;

    const handleClose = async () => {
        if (!mes) return alert('Selecione o mês!');
        setLoading(true);

        try {
            // 1. Archive current global config as snapshot
            const globalSnap: any = { mes, setor_id: null };
            keys.forEach(k => { globalSnap[k] = gc[k] || 0; });
            await supabase.from('historico_metas').upsert(globalSnap, { onConflict: 'mes,setor_id' });

            // 2. Archive sector configs as snapshots
            for (const s of (sectors || [])) {
                const sc = sectorConfigs[s.id];
                if (sc && keys.some(k => sc[k])) {
                    const sectorSnap: any = { mes, setor_id: s.id };
                    keys.forEach(k => { sectorSnap[k] = sc[k] || gc[k] || 0; });
                    sectorSnap.colaboradores = s.colaboradores || [];
                    await supabase.from('historico_metas').upsert(sectorSnap, { onConflict: 'mes,setor_id' });
                }
            }

            // NOTE: We no longer update the 'live' config/scfg tables.
            // Metas are now preserved for the next month as requested.

            refresh();
            closeModal();
            alert(`✅ Sucesso! As metas de ${mesLabel} foram congeladas no histórico.\nNenhuma alteração foi feita nas metas atuais.`);
        } catch (e: any) {
            console.error('Erro ao fechar mês:', e);
            alert('Erro ao fechar mês: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const mesLabel = (() => {
        if (!mes) return '';
        const [y, m] = mes.split('-');
        const nomes = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${nomes[Number(m)]} ${y}`;
    })();

    return (
        <div className="modal" style={{ width: 620 }}>
            <h3>📅 Fechar Mês e Congelar Metas</h3>

            <div className="ibox" style={{ marginBottom: 20 }}>
                <strong>O que acontece:</strong><br />
                As metas configuradas hoje serão <strong>salvas no histórico</strong> como referência para o mês selecionado. Isso garante que os pontos calculados para este mês continuem corretos mesmo se você mudar as metas amanhã.
            </div>

            <div style={{ marginBottom: 24 }}>
                <label className="fl">Mês de Referência para o Histórico</label>
                <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={{ width: '100%' }} />
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📍</span> Salvando metas atuais para: <strong>{mesLabel}</strong>
                </div>
            </div>

            <div className="divider"></div>

            <div className="ct" style={{ fontSize: 14, marginBottom: 12 }}>📋 Metas atuais que serão arquivadas:</div>
            <div style={{ background: 'var(--gray50)', border: '1.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', marginBottom: 8, textTransform: 'uppercase' }}>🥇 Meta Máxima Global</div>
                        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                            <div>Dia: <strong>{gc.xd || 40}</strong> · ⭐{gc.xpd}</div>
                            <div>Semana: <strong>{gc.xs || 200}</strong> · ⭐{gc.xps}</div>
                            <div>Mês: <strong>{gc.xm || 880}</strong> · ⭐{gc.xpm}</div>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--g700)', marginBottom: 8, textTransform: 'uppercase' }}>🟢 Meta Média Global</div>
                        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                            <div>Dia: <strong>{gc.md || 25}</strong> · ⭐{gc.mpd}</div>
                            <div>Semana: <strong>{gc.ms || 125}</strong> · ⭐{gc.mps}</div>
                            <div>Mês: <strong>{gc.mm || 550}</strong> · ⭐{gc.mpm}</div>
                        </div>
                    </div>
                </div>
                {(sectors || []).some((s: any) => sectorConfigs[s.id]) && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border)', fontSize: 12, color: 'var(--muted)' }}>
                        ℹ️ Também arquivando metas específicas de {(sectors || []).filter((s:any) => sectorConfigs[s.id]).length} setores.
                    </div>
                )}
            </div>

            <div className="ma" style={{ marginTop: 24 }}>
                <button className="btn btn-gh" onClick={closeModal} disabled={loading}>Cancelar</button>
                <button className="btn btn-a" onClick={handleClose} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {loading ? 'Processando...' : `💾 Congelar Metas de ${mesLabel}`}
                </button>
            </div>
        </div>
    );
}

function ModalRestore({ closeModal, refresh }: any) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: any) => {
        const selected = e.target.files[0];
        if (selected) setFile(selected);
    };

    const handleRestore = async () => {
        if (!file) return;
        if (!confirm('⚠️ AVISO CRÍTICO ⚠️\n\nEsta ação irá APAGAR PERMANENTEMENTE todos os dados atuais do sistema e substituí-los pelo backup selecionado.\n\nDeseja continuar?')) return;

        setLoading(true);
        setError('');

        try {
            const text = await file.text();
            const json = JSON.parse(text);
            const { data } = json;

            if (!data) throw new Error('Arquivo de backup inválido ou vazio.');

            // 1. Transform data back to DB format
            const dbUsers = data.users || [];
            const dbConfig = data.config ? (Array.isArray(data.config) ? data.config : [data.config]) : [];
            const dbSectors = data.sectors || [];
            const dbMetaHistory = data.metaHistory || [];
            
            const dbRecords = (data.records || []).map((r: any) => ({
                id: r.id, uid: r.uid, data: r.d, atendimentos: r.a, coletas: r.c, obs: r.obs || ''
            }));
            
            const dbBillings = (data.billings || []).map((b: any) => ({
                id: b.id, setor_id: b.sid, data: b.d, valor: b.v, obs: b.obs || ''
            }));
            
            const dbScfg = Object.values(data.sectorConfigs || {});
            
            const dbBonus = Object.entries(data.bonus || {}).map(([uid, pontos]) => ({
                uid, pontos: Number(pontos) || 0
            }));

            // 2. Clear tables in correct sequence (children first)
            const tablesToRemove = ['bonus', 'registros', 'scfg', 'faturamentos', 'historico_metas', 'setores', 'usuarios', 'config'];
            for (const table of tablesToRemove) {
                const pk = table === 'scfg' ? 'setor_id' : (table === 'bonus' ? 'uid' : (table === 'historico_metas' ? 'mes' : 'id'));
                const { error: delErr } = await supabase.from(table).delete().not(pk, 'is', null);
                if (delErr) throw new Error(`Falha ao limpar tabela ${table}: ${delErr.message}`);
            }

            // 3. Insert data in correct sequence (parents first)
            if (dbConfig.length) {
                const { error: err } = await supabase.from('config').insert(dbConfig);
                if (err) throw new Error('Erro ao restaurar Configurações: ' + err.message);
            }
            if (dbUsers.length) {
                const { error: err } = await supabase.from('usuarios').insert(dbUsers);
                if (err) throw new Error('Erro ao restaurar Usuários: ' + err.message);
            }
            if (dbSectors.length) {
                const { error: err } = await supabase.from('setores').insert(dbSectors);
                if (err) throw new Error('Erro ao restaurar Setores: ' + err.message);
            }
            if (dbMetaHistory.length) {
                const { error: err } = await supabase.from('historico_metas').insert(dbMetaHistory);
                if (err) throw new Error('Erro ao restaurar Histórico: ' + err.message);
            }
            if (dbBillings.length) {
                const { error: err } = await supabase.from('faturamentos').insert(dbBillings);
                if (err) throw new Error('Erro ao restaurar Faturamentos: ' + err.message);
            }
            if (dbScfg.length) {
                const { error: err } = await supabase.from('scfg').insert(dbScfg);
                if (err) throw new Error('Erro ao restaurar Metas de Setor: ' + err.message);
            }
            if (dbRecords.length) {
                // Bulk insert records might hit limits if too many, but usually okay for small/medium apps
                const { error: err } = await supabase.from('registros').insert(dbRecords);
                if (err) throw new Error('Erro ao restaurar Registros: ' + err.message);
            }
            if (dbBonus.length) {
                const { error: err } = await supabase.from('bonus').insert(dbBonus);
                if (err) throw new Error('Erro ao restaurar Bônus: ' + err.message);
            }

            refresh();
            closeModal();
            alert('✅ Backup restaurado com sucesso! O sistema foi atualizado.');
        } catch (e: any) {
            console.error('Restore error:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal" style={{ width: 450 }}>
            <h3>📤 Restaurar Backup</h3>
            <div className="ibox bgr" style={{ marginBottom: 20, borderColor: '#fee2e2', background: '#fef2f2', color: '#991b1b' }}>
                <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>⚠️</span> ATENÇÃO: OPERAÇÃO DESTRUTIVA
                </div>
                Esta ação irá apagar <strong>todas</strong> as informações atuais e substituir pelo conteúdo do arquivo de backup.
            </div>

            <div style={{ marginBottom: 24 }}>
                <label className="fl">Selecione o arquivo JSON de backup</label>
                <div style={{ marginTop: 8, padding: '16px 20px', border: '2px dashed var(--border)', borderRadius: 12, textAlign: 'center', background: 'var(--gray50)' }}>
                    <input type="file" accept=".json" onChange={handleFileChange} id="file-restore" style={{ display: 'none' }} />
                    <label htmlFor="file-restore" style={{ cursor: 'pointer', display: 'block' }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
                        {file ? <strong style={{ color: 'var(--g900)' }}>{file.name}</strong> : <span style={{ color: 'var(--muted)' }}>Clique para selecionar o arquivo</span>}
                    </label>
                </div>
            </div>

            {error && <div className="ibox bgr" style={{ marginBottom: 20, fontSize: 13 }}>❌ {error}</div>}

            <div className="ma">
                <button className="btn btn-gh" onClick={closeModal} disabled={loading}>Cancelar</button>
                <button className="btn btn-a" onClick={handleRestore} disabled={!file || loading} style={{ background: '#dc2626', borderColor: '#b91c1c' }}>
                    {loading ? 'Restaurando...' : 'Confirmar Restauração Total'}
                </button>
            </div>
        </div>
    );
}
