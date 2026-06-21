import { useState, useEffect } from 'react'
import axios from './api/client'
import Sidebar from './components/Sidebar'
import PlaylistDetail from './components/PlaylistDetail'
import './App.css'
import { Analytics } from '@vercel/analytics/react';

export default function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)
    const [authMode, setAuthMode] = useState('login')

    const [theme, setTheme] = useState(
        () => localStorage.getItem('theme') || 'light'
    )

    useEffect(() => {
        localStorage.setItem('theme', theme)
    }, [theme])

    const colors = themes[theme]

    useEffect(() => {
        axios.get('/api/auth/me')
            .then(res => setUser(res.data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div
                style={{
                    ...s.center,
                    background: colors.bg
                }}
            >
                <div style={s.spinner} />
            </div>
        )
    }

    if (!user) {
        return (
            <div
                style={{
                    ...s.center,
                    background: colors.bg
                }}
            >
                {authMode === 'login' ? (
                    <LoginForm
                        colors={colors}
                        onSuccess={setUser}
                        onSwitch={() => setAuthMode('register')}
                    />
                ) : (
                    <RegisterForm
                        colors={colors}
                        onSwitch={() => setAuthMode('login')}
                    />
                )}

                <button
                    onClick={() =>
                        setTheme(
                            theme === 'light'
                                ? 'dark'
                                : 'light'
                        )
                    }
                    style={{
                        position: 'fixed',
                        top: 20,
                        right: 20,
                        padding: '10px 14px',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '18px'
                    }}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
            </div>
        )
    }

    return (
        <div style={s.layout}>
            <Sidebar
                user={user}
                colors={colors}
                selectedPlaylistId={selectedPlaylistId}
                onSelectPlaylist={setSelectedPlaylistId}
                onLogout={() => setUser(null)}
            />

            <main
                style={{
                    ...s.main,
                    background: colors.bg,
                    position: 'relative'
                }}
            >
                <button
                    onClick={() =>
                        setTheme(
                            theme === 'light'
                                ? 'dark'
                                : 'light'
                        )
                    }
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        padding: '10px 14px',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        zIndex: 1000
                    }}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                {selectedPlaylistId ? (
                    <PlaylistDetail playlistId={selectedPlaylistId} colors = {colors} />
                ) : (
                    <Empty />
                )}
            </main>
            <Analytics />
        </div>
    )
}

function LoginForm({ onSuccess, onSwitch, colors }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    function handleLogin() {
        if (!email || !password) return
        setLoading(true)
        setError(null)
        axios.post('/api/auth/login', { email, password })
            .then(res => onSuccess(res.data))
            .catch(err => setError(err.response?.data?.message || 'Login failed'))
            .finally(() => setLoading(false))
    }

    return (
        <div style={{...s.card, background: colors.card, color: colors.text}}>
            <div style={s.loginLogo}>📚</div>
            <h1 style={{...s.loginTitle, color: colors.text}}>Playlist Tracker</h1>
            <p style={{...s.loginSub, color: colors.secondary}}>Your personal YouTube learning dashboard</p>

            <div style={s.form}>
                <input
                    style={s.input}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                <input
                    style={s.input}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                {error && <p style={s.error}>{error}</p>}
                <button
                    style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </div>

            <p style={s.switchText}>
                Don't have an account?{' '}
                <span style={s.switchLink} onClick={onSwitch}>Register</span>
            </p>
        </div>
    )
}

function RegisterForm({ onSwitch, colors }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    function handleRegister() {
        if (!name || !email || !password) return
        setLoading(true)
        setError(null)
        axios.post('/api/auth/register', { name, email, password })
            .then(() => setSuccess(true))
            .catch(err => setError(err.response?.data?.message || 'Registration failed'))
            .finally(() => setLoading(false))
    }

    if (success) return (
        <div style={{...s.card, background: colors.card, color: colors.text}}>
            <div style={s.loginLogo}>✅</div>
            <h2 style={s.loginTitle}>Account created!</h2>
            <p style={s.loginSub}>You can now sign in.</p>
            <button style={s.btn} onClick={onSwitch}>Go to Login</button>
        </div>
    )

    return (
        <div style={{...s.card, background: colors.card, color: colors.text}}>
            <div style={s.loginLogo}>📚</div>
            <h1 style={{...s.loginTitle, color: colors.text}}>Create Account</h1>
            <p style={{...s.loginSub, color: colors.secondary}}>Start tracking your playlists</p>

            <div style={s.form}>
                <input
                    style={{...s.input, background: colors.inputBg, color: colors.text}}
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <input
                    style={{...s.input, background: colors.inputBg, color: colors.text}}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    style={{...s.input, background: colors.inputBg, color: colors.text}}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                />
                {error && <p style={{...s.error, color: colors.error}}>{error}</p>}
                <button
                    style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
                    onClick={handleRegister}
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create Account'}
                </button>
            </div>

            <p style={{...s.switchText, color: colors.text}}>
                Already have an account?{' '}
                <span style={{...s.switchLink, color: colors.secondary}} onClick={onSwitch}>Sign In</span>
            </p>
        </div>
    )
}

function Empty() {
    return (
        <div style={s.empty}>
            <div style={s.emptyIcon}>🎬</div>
            <p style={s.emptyText}>Select a playlist from the sidebar to get started</p>
        </div>
    )
}

const themes = {
    light: {
        bg: '#e0fbfc',
        card: '#ffffff',
        sidebar: '#ffffff',
        text: '#293241',
        secondary: '#3d5a80',
        inputBg: '#f8feff',
        border: 'rgba(152,193,217,0.3)',
        button: '#3d5a80',
        videoCard: '#ffffff',
        videoBorder: 'rgba(152,193,217,0.2)',
        videoShadow: '0 1px 4px rgba(61,90,128,0.05)',
        progressCard: '#ffffff',
        metaText: '#3d5a80',
        mutedText: '#98c1d9',
        progressTrack: '#98c1d9',
    },
    dark: {
        bg: '#0a0a0a',
        card: '#111111',
        sidebar: '#111111',
        text: '#f1f1f1',
        secondary: '#a0aec0',
        inputBg: '#1a1a1a',
        border: 'rgba(255,255,255,0.08)',
        button: '#3d5a80',
        videoCard: '#1a1a1a',
        videoBorder: 'rgba(255,255,255,0.06)',
        videoShadow: '0 1px 4px rgba(0,0,0,0.4)',
        progressCard: '#1a1a1a',
        metaText: '#a0aec0',
        mutedText: '#4a5568',
        progressTrack: '#2d3748',
    }
}

const s = {
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#e0fbfc' },
    spinner: { width: '36px', height: '36px', border: '3px solid #98c1d9', borderTop: '3px solid #3d5a80', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    card: { background: '#fff', borderRadius: '16px', padding: '48px 56px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', boxShadow: '0 4px 24px rgba(61,90,128,0.1)', minWidth: '360px' },
    loginLogo: { fontSize: '2.5rem' },
    loginTitle: { fontSize: '1.6rem', fontWeight: 700, color: '#293241' },
    loginSub: { color: '#3d5a80', fontSize: '0.9rem', marginBottom: '4px' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '8px' },
    input: { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid rgba(152,193,217,0.6)', background: '#f8feff', color: '#293241', fontSize: '0.9rem', outline: 'none' },
    error: { color: '#ee6c4d', fontSize: '0.82rem', textAlign: 'left' },
    btn: { padding: '12px', borderRadius: '999px', border: 'none', background: '#3d5a80', color: '#fff', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'background 0.2s' },
    switchText: { fontSize: '0.82rem', color: '#3d5a80', marginTop: '4px' },
    switchLink: { color: '#ee6c4d', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' },
    layout: { display: 'flex', height: '100vh', overflow: 'hidden' },
    main: { flex: 1, overflowY: 'auto', padding: '32px', background: '#e0fbfc' },
    empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' },
    emptyIcon: { fontSize: '3rem' },
    emptyText: { color: '#3d5a80', fontSize: '1rem', fontWeight: 500 },
}