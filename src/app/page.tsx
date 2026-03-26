'use client';

import { useAuth } from '@/hooks/useAuth';
import LoginScreen from '@/components/LoginScreen';
import DashboardPage from '@/components/Dashboard';
import ProductivityPage from '@/components/Productivity';
import BillingPage from '@/components/Billing';
import SettingsPage from '@/components/Settings';
import Modals from '@/components/Modals';
import Topbar from '@/components/Topbar';
import { useState } from 'react';
import { DataProvider } from '@/context/DataContext';

export default function Home() {
    const { user, loading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');

    if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    if (!user) return <LoginScreen />;

    const isSup = user.role === 'sup';

    return (
        <div id="app" style={{ display: 'block' }}>
            <DataProvider>
                <Topbar />
                <div className="nav-tabs">
                    <button className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
                    <button className={`nav-tab ${activeTab === 'produtividade' ? 'active' : ''}`} onClick={() => setActiveTab('produtividade')}>🎯 Produtividade</button>
                    <button className={`nav-tab ${activeTab === 'faturamento' ? 'active' : ''}`} onClick={() => setActiveTab('faturamento')}>💰 Faturamento</button>
                    {isSup && (
                        <button className={`nav-tab ${activeTab === 'configuracoes' ? 'active' : ''}`} onClick={() => setActiveTab('configuracoes')}>⚙️ Configurações</button>
                    )}
                </div>

                <div className="main">
                    {activeTab === 'dashboard' && <DashboardPage />}
                    {activeTab === 'produtividade' && <ProductivityPage />}
                    {activeTab === 'faturamento' && <BillingPage />}
                    {activeTab === 'configuracoes' && <SettingsPage />}
                </div>
                <Modals />
            </DataProvider>
        </div>
    );
}
