import { useState, useEffect } from 'react'
import axios from './api/client'
import Sidebar from './components/Sidebar'
import PlaylistDetail from './components/PlaylistDetail'
import { useWindowSize } from './hooks/useWindowSize'
import './App.css'

export default function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)
    const [authMode, setAuthMode] = useState('login')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { isMobile } = useWindowSize()

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

    // close sidebar when selecting playlist on mobile
    function handleSelectPlaylist(id) {
        setSelectedPlaylistId(id)
        if (isMobile) setSidebarOpen(false)
    }

    if (loading) return (
        <div style={{ ...s.center, background: colors.bg }}>
            <div style={s.spinner} />
        </div>
    )

    if (!user) return (
        <div style={{ ...s.center, background: colors.bg }}>
            {authMode === 'login'
                ? <LoginForm colors={colors} onSuccess={setUser} onSwitch={() => setAuthMode('register')} />
                : <RegisterForm colors={colors} onSwitch={() => setAuthMode('login')} />
            }
            <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                style={s.themeBtn}
            >
                {theme === 'light' ? '🌙' : '☀️'}
            </button>
        </div>
    )

    return (
        <div style={{ ...s.layout, background: colors.bg }}>

            {/* Backdrop for mobile sidebar */}
            {isMobile && sidebarOpen && (
                <div
                    style={s.backdrop}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div style={{
                ...s.sidebarWrapper,
                ...(isMobile ? {
                    position: 'fixed',
                    top: 0, left: 0,
                    height: '100vh',
                    zIndex: 200,
                    transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.25s ease',
                    boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
                } : {})
            }}>
                <Sidebar
                    user={user}
                    colors={colors}
                    selectedPlaylistId={selectedPlaylistId}
                    onSelectPlaylist={handleSelectPlaylist}
                    onLogout={() => setUser(null)}
                    isMobile={isMobile}
                    onClose={() => setSidebarOpen(false)}
                />
            </div>

            {/* Main content */}
            <main style={{
                ...s.main,
                background: colors.bg,
                marginLeft: isMobile ? 0 : '300px',
            }}>
                {/* Top bar on mobile */}
                {isMobile && (
                    <div style={{ ...s.topBar, background: colors.card, borderBottom: `1px solid ${colors.border}` }}>
                        <button style={s.hamburger} onClick={() => setSidebarOpen(true)}>☰</button>
                        <span style={{ fontWeight: 700, color: colors.text, fontSize: '1rem' }}>
              {selectedPlaylistId ? '' : 'Playlist Tracker'}
            </span>
                        <button
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            style={s.themeBtn}
                        >
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                    </div>
                )}

                {/* Desktop theme toggle */}
                {!isMobile && (
                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        style={{ ...s.themeBtn, position: 'absolute', top: 20, right: 20, zIndex: 100 }}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                )}

                <div style={{ padding: isMobile ? '16px' : '32px', paddingTop: isMobile ? '8px' : '32px' }}>
                    {selectedPlaylistId
                        ? <PlaylistDetail playlistId={selectedPlaylistId} colors={colors} isMobile={isMobile} />
                        : <Empty colors={colors} isMobile={isMobile} />
                    }
                </div>
            </main>
        </div>
    )
}

function Empty({ colors, isMobile }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: isMobile ? '60vh' : '70vh', gap: '16px' }}>
            <div style={{ fontSize: '3rem' }}>🎬</div>
            <p style={{ color: colors.metaText, fontSize: '1rem', fontWeight: 500, textAlign: 'center' }}>
                {isMobile ? 'Tap ☰ to select a playlist' : 'Select a playlist from the sidebar to get started'}
            </p>
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
        <div style={{ ...s.card, background: colors.card }}>
            <div style={{ fontSize: '2.5rem' }}>📚</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: colors.text }}>Playlist Tracker</h1>
            <p style={{ color: colors.secondary, fontSize: '0.9rem' }}>Your personal YouTube learning dashboard</p>
            <div style={s.form}>
                <input style={{ ...s.input, background: colors.inputBg, color: colors.text, border: `1px solid ${colors.border}` }} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                <input style={{ ...s.input, background: colors.inputBg, color: colors.text, border: `1px solid ${colors.border}` }} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                {error && <p style={{ color: '#ee6c4d', fontSize: '0.82rem', textAlign: 'left' }}>{error}</p>}
                <button style={{ ...s.btn, background: colors.button, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: colors.secondary }}>
                Don't have an account?{' '}
                <span style={{ color: '#ee6c4d', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }} onClick={onSwitch}>Register</span>
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
        <div style={{ ...s.card, background: colors.card }}>
            <div style={{ fontSize: '2.5rem' }}>✅</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: colors.text }}>Account created!</h2>
            <p style={{ color: colors.secondary }}>You can now sign in.</p>
            <button style={{ ...s.btn, background: colors.button }} onClick={onSwitch}>Go to Login</button>
        </div>
    )

    return (
        <div style={{ ...s.card, background: colors.card }}>
            <div style={{ fontSize: '2.5rem' }}>📚</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: colors.text }}>Create Account</h1>
            <p style={{ color: colors.secondary, fontSize: '0.9rem' }}>Start tracking your playlists</p>
            <div style={s.form}>
                <input style={{ ...s.input, background: colors.inputBg, color: colors.text, border: `1px solid ${colors.border}` }} type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                <input style={{ ...s.input, background: colors.inputBg, color: colors.text, border: `1px solid ${colors.border}` }} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input style={{ ...s.input, background: colors.inputBg, color: colors.text, border: `1px solid ${colors.border}` }} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} />
                {error && <p style={{ color: '#ee6c4d', fontSize: '0.82rem', textAlign: 'left' }}>{error}</p>}
                <button style={{ ...s.btn, background: colors.button, opacity: loading ? 0.7 : 1 }} onClick={handleRegister} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Account'}
                </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: colors.secondary }}>
                Already have an account?{' '}
                <span style={{ color: '#ee6c4d', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }} onClick={onSwitch}>Sign In</span>
            </p>
        </div>
    )
}

export const themes = {
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
    layout: { display: 'flex', minHeight: '100vh', position: 'relative' },
    sidebarWrapper: { width: '300px', flexShrink: 0 },
    backdrop: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 199,
    },
    main: { flex: 1, overflowY: 'auto', minHeight: '100vh', position: 'relative' },
    topBar: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        position: 'sticky', top: 0, zIndex: 100,
    },
    hamburger: {
        background: 'none', border: 'none',
        fontSize: '1.4rem', cursor: 'pointer', padding: '4px 8px',
    },
    themeBtn: {
        padding: '8px 12px', border: 'none',
        borderRadius: '10px', cursor: 'pointer', fontSize: '18px',
        background: 'rgba(128,128,128,0.1)',
    },
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' },
    spinner: { width: '36px', height: '36px', border: '3px solid #98c1d9', borderTop: '3px solid #3d5a80', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    card: { borderRadius: '16px', padding: '40px 48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', boxShadow: '0 4px 24px rgba(61,90,128,0.1)', width: '90%', maxWidth: '400px' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '8px' },
    input: { width: '100%', padding: '11px 14px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' },
    btn: { padding: '12px', borderRadius: '999px', border: 'none', color: '#fff', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' },
}