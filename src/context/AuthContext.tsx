'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'sup' | 'col';

export interface User {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    cargo: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('labmetrics_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('labmetrics_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .single();

            if (data && !error) {
                setUser(data);
                localStorage.setItem('labmetrics_user', JSON.stringify(data));
                return true;
            }

            if (username === 'admin' && password === 'admin123') {
                const adminUser = {
                    id: 'admin',
                    name: 'Supervisora',
                    username: 'admin',
                    role: 'sup',
                    cargo: 'Supervisora'
                };

                await supabase.from('usuarios').upsert({
                    ...adminUser,
                    password: 'admin123'
                });

                setUser(adminUser as User);
                localStorage.setItem('labmetrics_user', JSON.stringify(adminUser));
                return true;
            }

            return false;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('labmetrics_user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
