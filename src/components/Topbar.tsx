'use client';

import { useAuth } from '@/hooks/useAuth';
import { useGlobalData } from '@/context/DataContext';

export default function Topbar() {
    const { user, logout } = useAuth();
    const { openModal } = useGlobalData();

    if (!user) return null;

    const isSup = user.role === 'sup';

    return (
        <div className="topbar">
            <div className="tb-left">
                <img src="/logo.png" style={{ height: 32, objectFit: 'contain' }} alt="HemoLab" />
            </div>
            <div className="tb-right">
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
