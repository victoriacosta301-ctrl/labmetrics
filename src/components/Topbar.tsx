'use client';

import { useAuth } from '@/hooks/useAuth';
import { useGlobalData } from '@/context/DataContext';
import { td } from '@/lib/utils';

export default function Topbar() {
    const { user, logout } = useAuth();
    const { openModal, metaHistory, records, billings, selectedMonth, setSelectedMonth } = useGlobalData();

    if (!user) return null;

    const isSup = user.role === 'sup';

    const currM = td().slice(0, 7);
    const mNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const seen = new Set<string>();
    
    // Computar todos os meses que possuem dados (seja de metas históricas, registros, ou faturamentos)
    seen.add(currM);

    metaHistory?.forEach(h => h.mes && seen.add(h.mes));
    records?.forEach(r => r.d && seen.add(r.d.slice(0, 7)));
    billings?.forEach(f => f.d && seen.add(f.d.slice(0, 7)));

    // Ordenar do mais recente pro mais antigo (YYYY-MM decrescente)
    const sortedMonths = Array.from(seen)
        .filter(m => m !== currM)
        .sort((a, b) => b.localeCompare(a));

    const histOpts: { val: string, lbl: string }[] = [];
    // Opcão padrão para o mês atual
    histOpts.push({ val: '', lbl: 'Mês Atual' });

    sortedMonths.forEach(mStr => {
        const [y, m] = mStr.split('-');
        if (y && m) {
            histOpts.push({ val: mStr, lbl: `${mNames[parseInt(m)-1]}/${y.slice(2)}` });
        }
    });

    return (
        <div className="topbar">
            <div className="tb-left">
                <img src="/logo.png" style={{ height: 32, objectFit: 'contain' }} alt="HemoLab" />
            </div>
            <div className="tb-right">
                <div style={{ marginRight: 15, display: 'flex', alignItems: 'center' }}>
                    <select 
                        className="inp" 
                        style={{ padding: '6px 12px', fontSize: 13, minWidth: 120 }}
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                    >
                        {histOpts.map(o => <option key={o.val || 'curr'} value={o.val}>{o.lbl}</option>)}
                    </select>
                </div>
                <div className="uchip" onClick={() => openModal('mSenha', { uid: user.id })} style={{ cursor: 'pointer' }}>
                    <div className="uav">{user.name.charAt(0).toUpperCase()}</div>
                    <span className="uname">{user.name}</span>
                    <span className={`rb ${isSup ? 'sup' : 'col'}`}>
                        {isSup ? 'SUPERVISORA' : (user.cargo || 'COLABORADOR').toUpperCase()}
                    </span>
                    {isSup && <span style={{ fontSize: 15, marginLeft: 4 }}>🔑</span>}
                </div>
                <button className="btn-out" onClick={logout}>Sair</button>
            </div>
        </div>
    );
}
