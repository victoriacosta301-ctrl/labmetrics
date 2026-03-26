'use client';

import { useState, useEffect } from 'react';
import { useGlobalData } from '@/context/DataContext';
import { supabase } from '@/lib/supabase';
import { td, fd, calcPts, fn } from '@/lib/utils';

export default function Modals() {
    const { modal, closeModal, users, sectors, config, records, sectorConfigs, bonus, refresh } = useGlobalData();

    if (!modal) return null;

    return (
        <div className="mo" style={{ display: 'flex' }} onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
        }}>
            {modal.type === 'mReg' && <ModalReg closeModal={closeModal} users={users} refresh={refresh} payload={modal.payload} />}
            {modal.type === 'mCb' && <ModalCollab closeModal={closeModal} users={users} refresh={refresh} payload={modal.payload} />}
            {modal.type === 'mSt' && <ModalSector closeModal={closeModal} sectors={sectors} users={users} refresh={refresh} payload={modal.payload} />}
            {modal.type === 'mFt' && <ModalFaturamento closeModal={closeModal} sectors={sectors} refresh={refresh} payload={modal.payload} />}
            {modal.type === 'mEC' && <ModalEditCollab closeModal={closeModal} users={users} config={config} records={records} sectors={sectors} sectorConfigs={sectorConfigs} bonus={bonus} refresh={refresh} payload={modal.payload} openModal={modal.payload?.openModal} />}
            {modal.type === 'mSCfg' && <ModalSectorConfig closeModal={closeModal} sectors={sectors} sectorConfigs={sectorConfigs} config={config} refresh={refresh} payload={modal.payload} />}
            {modal.type === 'mGCfg' && <ModalGlobalConfig closeModal={closeModal} config={config} refresh={refresh} />}
            {modal.type === 'mPdf' && <ModalPdf closeModal={closeModal} />}
            {modal.type === 'mSenha' && <ModalSenha closeModal={closeModal} refresh={refresh} payload={modal.payload} />}
        </div>
    );
}

function ModalReg({ closeModal, users, refresh, payload }: any) {
    const [uid, setUid] = useState(payload?.uid || '');
    const [dt, setDt] = useState(td());
    const [at, setAt] = useState('');
    const [co, setCo] = useState('');
    const [obs, setObs] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!uid || !dt) return alert('Preencha Colaborador e Data!');
        setLoading(true);
        const novoId = Math.random().toString(36).substring(2, 9);
        await supabase.from('registros').insert([{
            id: novoId,
            uid,
            data: dt,
            atendimentos: Number(at) || 0,
            coletas: Number(co) || 0,
            obs
        }]);
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
            <div className="fr c2">
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

function ModalCollab({ closeModal, refresh, payload }: any) {
    const [nm, setNm] = useState('');
    const [cg, setCg] = useState('Atendente');
    const [us, setUs] = useState('');
    const [pw, setPw] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!nm || !us || !pw) return alert('Preencha Nome, Usuário e Senha!');
        setLoading(true);
        const novoId = Math.random().toString(36).substring(2, 9);
        await supabase.from('usuarios').insert([{
            id: novoId,
            name: nm,
            username: us,
            password: pw,
            role: 'col',
            cargo: cg
        }]);
        refresh();
        closeModal();
    };

    return (
        <div className="modal">
            <h3>👤 Novo Colaborador</h3>
            <div className="fr c2">
                <div><label className="fl">Nome Completo</label><input type="text" placeholder="Nome" value={nm} onChange={e => setNm(e.target.value)} /></div>
                <div>
                    <label className="fl">Cargo</label>
                    <select value={cg} onChange={e => setCg(e.target.value)}>
                        <option value="Atendente">Atendente</option>
                        <option value="Coletador">Coletador</option>
                    </select>
                </div>
            </div>
            <div className="fr c2">
                <div><label className="fl">Usuário (login)</label><input type="text" placeholder="ex: joao.silva" value={us} onChange={e => setUs(e.target.value)} /></div>
                <div><label className="fl">Senha</label><input type="password" placeholder="Senha de acesso" value={pw} onChange={e => setPw(e.target.value)} /></div>
            </div>
            <div className="ma">
                <button className="btn btn-gh" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-a" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
        </div>
    );
}

function ModalSector({ closeModal, users, refresh, payload }: any) {
    const [nm, setNm] = useState('');
    const [mt, setMt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!nm) return alert('Dê um nome ao setor!');
        setLoading(true);
        const novoId = Math.random().toString(36).substring(2, 9);
        await supabase.from('setores').insert([{
            id: novoId,
            nome: nm,
            meta: Number(mt) || 0,
            colaboradores: [] // For now, we allow assigning collaborators in another modal or edit mode
        }]);
        refresh();
        closeModal();
    };

    return (
        <div className="modal">
            <h3>🏢 Setor de Faturamento</h3>
            <div><label className="fl">Nome do Setor</label><input type="text" placeholder="Ex: Recepção, Coleta Domiciliar..." value={nm} onChange={e => setNm(e.target.value)} /></div>
            <div className="mt12"><label className="fl">Meta de Faturamento Mensal (R$)</label><input type="number" placeholder="Ex: 50000" min="0" value={mt} onChange={e => setMt(e.target.value)} /></div>
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

function ModalEditCollab({ closeModal, users, config, records, sectors, sectorConfigs, bonus, refresh, payload, openModal }: any) {
    const uid = payload?.uid;
    const u = users.find((x: any) => x.id === uid);
    const [ptsInput, setPtsInput] = useState(bonus[uid] || 0);
    const [obsInput, setObsInput] = useState('');
    const [loading, setLoading] = useState(false);

    if (!u) return null;

    const ur = records.filter((r: any) => r.uid === uid).sort((a: any, b: any) => b.d.localeCompare(a.d));
    const totalPts = calcPts(uid, records, config, sectors, sectorConfigs, bonus);

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
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.cargo || ''} · ⭐ {fn(calcPts(uid, records, config, sectors, sectorConfigs, {}))} pontos calculados</div>
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
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {ur.length ? (
                    <div className="tw">
                        <table>
                            <thead><tr><th>Data</th><th>Atend.</th><th>Coletas</th><th>Total</th><th>Obs</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
                            <tbody>
                                {ur.map((r: any) => (
                                    <tr key={r.id}>
                                        <td>{fd(r.d)}</td><td>{r.a || 0}</td><td>{r.c || 0}</td><td><strong>{(r.a || 0) + (r.c || 0)}</strong></td>
                                        <td style={{ color: 'var(--muted)', fontSize: 11 }}>{r.obs || '—'}</td>
                                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <button className="btn btn-bl btn-sm" onClick={() => { closeModal(); openModal?.('mReg', { ...r, isEdit: true }); }}>✏️</button>
                                            <button className="btn btn-d btn-sm" style={{ marginLeft: 4 }} onClick={() => handleDeleteR(r.id)}>🗑</button>
                                        </td>
                                    </tr>
                                ))}
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

    const handleGenerate = () => {
        if (!mes) return alert('Selecione o mês!');
        // Note: The logic for PDF generation requires the main original `gerarPDF` function
        // which involves jspdf, autotable etc. For now, it will alert.
        alert(`Relatório do mês ${mes} pronto para baixar! (Necessário integrar jsPDF)`);
        closeModal();
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
