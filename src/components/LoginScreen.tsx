'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        const success = await login(username, password);
        if (success) {
            window.location.reload();
        } else {
            setError(true);
            setLoading(false);
        }
    };

    return (
        <div id="loginScreen">
            <div className="lcard">
                <div className="llogo">
                    <img src="/logo.png" alt="HemoLab Logo" style={{ height: 90, width: 'auto', display: 'inline-block', marginBottom: 15 }} />
                    <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.02em', marginTop: 4 }}>Sistema de Gestão de Produtividade</p>
                </div>

                <div className="fg">
                    <label>Usuário</label>
                    <input
                        type="text"
                        placeholder="seu usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                </div>

                <div className="fg">
                    <label>Senha</label>
                    <input
                        type="password"
                        placeholder="sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                </div>

                <button className="btn-login" onClick={handleLogin} disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar no LabMetrics'}
                </button>

                {error && <div className="lerr" style={{ display: 'block' }}>Usuário ou senha inválidos</div>}
            </div>
        </div>
    );
}
