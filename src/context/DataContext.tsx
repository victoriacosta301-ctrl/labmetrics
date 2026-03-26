'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';

interface DataContextType {
    loading: boolean;
    users: any[];
    config: any;
    records: any[];
    sectors: any[];
    sectorConfigs: any;
    billings: any[];
    bonus: any;
    refresh: () => void;
    // Modal Management
    modal: { type: string; payload?: any } | null;
    openModal: (type: string, payload?: any) => void;
    closeModal: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { loading, users, config, records, sectors, sectorConfigs, billings, bonus, refresh } = useData(user);

    const [modal, setModal] = useState<{ type: string; payload?: any } | null>(null);
    const openModal = (type: string, payload?: any) => setModal({ type, payload });
    const closeModal = () => setModal(null);

    const contextValue = {
        loading,
        users,
        config,
        records,
        sectors,
        sectorConfigs,
        billings,
        bonus,
        refresh,
        modal,
        openModal,
        closeModal,
    };

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
}

export function useGlobalData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useGlobalData must be used within a DataProvider');
    }
    return context;
}
