// src/App.jsx
import { useState, useEffect } from 'react'
import axios from './api/client'
import Sidebar from './components/Sidebar'
import PlaylistDetail from './components/PlaylistDetail'
import LandingPage from './components/LandingPage'
import { useWindowSize } from './hooks/useWindowSize'
import { themes } from './themes'
import './App.css'

export { themes }   // re-export so other components can import from App.jsx if needed

export default function App() {
    const [user, setUser]                     = useState(null)
    const [loading, setLoading]               = useState(true)
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)
    const [authMode, setAuthMode]             = useState('login')
    const [sidebarOpen, setSidebarOpen]       = useState(false)
    const [showLanding, setShowLanding]       = useState(true)
    const { isMobile }                        = useWindowSize()

    const [theme, setTheme] = useState(
        () => localStorage.getItem('theme') || 'light'
    )

    useEffect(() => { localStorage.setItem('theme', theme) }, [theme])

    const colors = themes[theme]

    function toggleTheme() {
        setTheme(t => t === 'light' ? 'dark' : 'light')
    }

    useEffect(() => {
        axios.get('/api/auth/me')
            .then(res => {
                setUser(res.data)
                setShowLanding(false)   // already logged in → skip landing
            })
            .catch(() => setUser(null))
            .finally(() => setLoading(false))
    }, [])

    function handleSelectPlaylist(id) {
        setSelectedPlaylistId(id)
        if (isMobile) setSidebarOpen(false)
    }

    function handleLogout() {
        axios.post('/api/auth/logout').finally(() => {
            setUser(null)
            setShowLanding(true)
            setSelectedPlaylistId(null)
        })
    }

    // ── Loading spinner ──────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ ...s.center, background: colors.bg }}>
            <div style={s.spinner} />
        </div>
    )

    // ── Landing page (unauthenticated visitors) ──────────────────────────────
    if (showLanding && !user) return (
        <LandingPage
            colors={colors}
            theme={theme}
            onToggleTheme={toggleTheme}
            onGetStarted={() => setShowLanding(false)}
        />
    )

    // ── Auth forms (after "Get Started" clicked or if not logged in) ─────────
    if (!user) return (
        <div style={{ ...s.center, background: colors.bg }}>
            {authMode === 'login'
                ? <LoginForm
                    colors={colors}
                    onSuccess={u => setUser(u)}
                    onSwitch={() => setAuthMode('register')}
                />
                : <RegisterForm
                    colors={colors}
                    onSwitch={() => setAuthMode('login')}
                />
            }
            <button
                onClick={toggleTheme}
                style={{ ...s.themeBtn, position: 'fixed', top: 16, right: 16 }}
            >
                {theme === 'light' ? '🌙' : '☀️'}
            </button>
        </div>
    )

    // ── Main app (authenticated) ─────────────────────────────────────────────
    return (
        <div style={{ ...s.layout, background: colors.bg }}>

            {/* Mobile backdrop */}
            {isMobile && sidebarOpen && (
                <div style={s.backdrop} onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <div style={{
                ...s.sidebarWrapper,
                ...(isMobile ? {
                    position: 'fixed', top: 0, left: 0,
                    height: '100vh', zIndex: 200,
                    transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.25s ease',
                    boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
                } : {})
            }}>
                <Sidebar
                    user={user}
                    colors={colors}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    selectedPlaylistId={selectedPlaylistId}
                    onSelectPlaylist={handleSelectPlaylist}
                    onLogout={handleLogout}
                    isMobile={isMobile}
                    onClose={() => setSidebarOpen(false)}
                />
            </div>

            {/* Main content area */}
            <main style={{
                ...s.main,
                background: colors.bg,
                
            }}>
                {/* Mobile top bar */}
                {isMobile && (
                    <div style={{
                        ...s.topBar,
                        background: colors.card,
                        borderBottom: `1px solid ${colors.border}`,
                    }}>
                        <button style={s.hamburger} onClick={() => setSidebarOpen(true)}>☰</button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#3d5a80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>▶</div>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: colors.text, letterSpacing: '-0.02em' }}>TrackTube</span>
                        </div>
                        <button onClick={toggleTheme} style={s.themeBtn}>
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                    </div>
                )}

                {/* Dashboard header (desktop) */}
                {!isMobile && (
                    <DashboardHeader
                        user={user}
                        colors={colors}
                        theme={theme}
                        onToggleTheme={toggleTheme}
                    />
                )}

                {/* Page content */}
                <div style={{ padding: isMobile ? '16px' : '24px 32px' }}>
                    {selectedPlaylistId
                        ? <PlaylistDetail
                            playlistId={selectedPlaylistId}
                            colors={colors}
                            isMobile={isMobile}
                        />
                        : <EmptyState colors={colors} isMobile={isMobile} />
                    }
                </div>
            </main>
        </div>
    )
}

// ── Dashboard header (desktop only) ─────────────────────────────────────────

function DashboardHeader({ user, colors, theme, onToggleTheme }) {
    const firstName = (user.name || user.email || '').split(' ')[0]
    const h = new Date().getHours()
    const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

    return (
        <div style={{
            padding: '20px 32px 16px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: colors.bg,
            position: 'sticky', top: 0, zIndex: 50,
        }}>
            <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: colors.text, letterSpacing: '-0.02em', margin: 0 }}>
                    {greeting}, {firstName} 👋
                </h1>
                <p style={{ fontSize: '0.82rem', color: colors.secondary, margin: '3px 0 0' }}>
                    Continue your learning journey.
                </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    padding: '6px 14px', borderRadius: '999px',
                    background: colors.card, border: `1px solid ${colors.border}`,
                    fontSize: '0.78rem', fontWeight: 600, color: '#ee6c4d',
                }}>
                    🔥 Keep your streak alive
                </div>
                <button onClick={onToggleTheme} style={s.themeBtn}>
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
                <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: '#3d5a80', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 700,
                }}>
                    {firstName[0].toUpperCase()}
                </div>
            </div>
        </div>
    )
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ colors, isMobile }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: isMobile ? '60vh' : '65vh', gap: '14px',
        }}>
            <div style={{ fontSize: '3rem' }}>🎬</div>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                No playlist selected
            </p>
            <p style={{ fontSize: '0.85rem', color: colors.metaText, margin: 0, textAlign: 'center' }}>
                {isMobile ? 'Tap ☰ and pick a playlist to get started.' : 'Select a playlist from the sidebar to start tracking.'}
            </p>
        </div>
    )
}

// ── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ onSuccess, onSwitch, colors }) {
    const [email, setEmail]       = useState('')
    const [password, setPassword] = useState('')
    const [error, setError]       = useState(null)
    const [loading, setLoading]   = useState(false)

    function handleLogin() {
        if (!email || !password) return
        setLoading(true); setError(null)
        axios.post('/api/auth/login', { email, password })
            .then(res => onSuccess(res.data))
            .catch(err => setError(err.response?.data?.message || 'Login failed'))
            .finally(() => setLoading(false))
    }

    return (
        <div style={{ ...s.authCard, background: colors.card }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#3d5a80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>▶</div>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: colors.text, letterSpacing: '-0.02em' }}>TrackTube</span>
            </div>
            <p style={{ color: colors.secondary, fontSize: '0.85rem', marginBottom: '8px' }}>Sign in to continue learning</p>
            <div style={s.form}>
                <input
                    style={{ ...s.input, background: colors.inputBg, color: colors.text, border: `1px solid ${colors.border}` }}
                    type="email" placeholder="Email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                <input
                    style={{ ...s.input, background: colors.inputBg, color: colors.text, border: `1px solid ${colors.border}` }}
                    type="password" placeholder="Password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                {error && <p style={{ color: '#ee6c4d', fontSize: '0.8rem' }}>{error}</p>}
                <button
                    style={{ ...s.btn, background: colors.button, opacity: loading ? 0.7 : 1 }}
                    onClick={handleLogin} disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: colors.secondary }}>
                No account?{' '}
                <span style={{ color: '#ee6c4d', fontWeight: 600, cursor: 'pointer' }} onClick={onSwitch}>
                    Register
                </span>
            </p>
        </div>
    )
}

// ── Register form ────────────────────────────────────────────────────────────

function RegisterForm({ onSwitch, colors }) {
    const [name, setName]         = useState('')
    const [email, setEmail]       = useState('')
    const [password, setPassword] = useState('')
    const [error, setError]       = useState(null)
    const [success, setSuccess]   = useState(false)
    const [loading, setLoading]   = useState(false)

    function handleRegister() {
        if (!name || !email || !password) return
        setLoading(true); setError(null)
        axios.post('/api/auth/register', { name, email, password })
            .then(() => setSuccess(true))
            .catch(err => setError(err.response?.data?.message || 'Registration failed'))
            .finally(() => setLoading(false))
    }

    if (success) return (
        <div style={{ ...s.authCard, background: colors.card }}>
            <div style={{ fontSize: '2rem' }}>✅</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: colors.text }}>Account created!</h2>
            <p style={{ color: colors.secondary, fontSize: '0.85rem' }}>You can now sign in.</p>
            <button style={{ ...s.btn, background: colors.button }} onClick={onSwitch}>Go to sign in</button>
        </div>
    )

    return (
        <div style={{ ...s.authCard, background: colors.card }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#3d5a80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>▶</div>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: colors.text, letterSpacing: '-0.02em' }}>TrackTube</span>
            </div>
            <p style={{ color: colors.secondary, fontSize: '0.85rem', marginBottom: '8px' }}>Create your free account</p>
            <div style={s.form}>
                <input style={{ ...s.input, background: colors.inputBg, color: colors.text, border: `1px solid ${colors.border}` }} type="text"     placeholder="Your name"  value={name}     onChange={e => setName(e.target.value)} />
                <input style={{ ...s.input, background: colors.inputBg, color: colors.text, border: `1px solid ${colors.border}` }} type="email"    placeholder="Email"      value={email}    onChange={e => setEmail(e.target.value)} />
                <input style={{ ...s.input, background: colors.inputBg, color: colors.text, border: `1px solid ${colors.border}` }} type="password" placeholder="Password"   value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} />
                {error && <p style={{ color: '#ee6c4d', fontSize: '0.8rem' }}>{error}</p>}
                <button style={{ ...s.btn, background: colors.button, opacity: loading ? 0.7 : 1 }} onClick={handleRegister} disabled={loading}>
                    {loading ? 'Creating...' : 'Create account'}
                </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: colors.secondary }}>
                Already have an account?{' '}
                <span style={{ color: '#ee6c4d', fontWeight: 600, cursor: 'pointer' }} onClick={onSwitch}>Sign in</span>
            </p>
        </div>
    )
}

// ── Shared styles ────────────────────────────────────────────────────────────

const s = {
    layout:       { display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' },
    sidebarWrapper: { width: '280px', flexShrink: 0, height: '100vh' },
    backdrop:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 },
    main:         { flex: 1, overflowY: 'auto', height: '100vh', position: 'relative' },
    topBar:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 100 },
    hamburger:    { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '4px 8px' },
    themeBtn:     { padding: '7px 11px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', background: 'rgba(128,128,128,0.1)' },
    center:       { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' },
    spinner:      { width: '36px', height: '36px', border: '3px solid #98c1d9', borderTop: '3px solid #3d5a80', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    authCard:     { borderRadius: '18px', padding: '36px 44px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: '0 4px 32px rgba(61,90,128,0.1)', width: '90%', maxWidth: '400px' },
    form:         { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '4px' },
    input:        { width: '100%', padding: '11px 14px', borderRadius: '9px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' },
    btn:          { padding: '12px', borderRadius: '999px', border: 'none', color: '#fff', fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'inherit' },
}