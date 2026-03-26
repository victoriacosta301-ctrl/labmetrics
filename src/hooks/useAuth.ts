'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'sup' | 'col';

export interface User {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    cargo: string;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('labmetrics_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        setLoading(true);
        try {
            // In the original app, it fetches all users and filters. 
            // For security, assuming we use the same simplistic auth for now.
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

            // Automatically seed and authorize the default admin user if requested
            if (username === 'admin' && password === 'admin123') {
                const adminUser = {
                    id: 'admin',
                    name: 'Supervisora',
                    username: 'admin',
                    role: 'sup',
                    cargo: 'Supervisora'
                };

                // Upsert securely without deleting other users
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

    return { user, loading, login, logout };
}
