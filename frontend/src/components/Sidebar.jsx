import { useState, useEffect } from 'react'
import axios from '../api/client'

function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}

export default function Sidebar({
                                    user, colors, theme, onToggleTheme,
                                    selectedPlaylistId, onSelectPlaylist,
                                    onLogout, isMobile, onClose,
                                }) {
    const c = colors
    const [playlists, setPlaylists]   = useState([])
    const [loading, setLoading]       = useState(true)
    const [url, setUrl]               = useState('')
    const [adding, setAdding]         = useState(false)
    const [error, setError]           = useState(null)
    const [hoveredId, setHoveredId]   = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    useEffect(() => { fetchPlaylists() }, [])

    function fetchPlaylists() {
        setLoading(true)
        axios.get('/api/playlists')
            .then(res => setPlaylists(res.data))
            .catch(() => setError('Failed to load playlists'))
            .finally(() => setLoading(false))
    }

    function handleAdd() {
        if (!url.trim()) return
        setAdding(true); setError(null)
        axios.post('/api/playlists', { playlistUrl: url })
            .then(res => {
                setPlaylists(prev => [...prev, res.data])
                onSelectPlaylist(res.data.id)
                setUrl('')
            })
            .catch(err => setError(err.response?.data?.message || 'Failed to add'))
            .finally(() => setAdding(false))
    }

    function handleDelete(e, id) {
        e.stopPropagation()
        setDeletingId(id)
        axios.delete(`/api/playlists/${id}`)
            .then(() => {
                setPlaylists(prev => prev.filter(p => p.id !== id))
                if (selectedPlaylistId === id) onSelectPlaylist(null)
            })
            .catch(() => setError('Failed to delete'))
            .finally(() => setDeletingId(null))
    }

    function handleLogout() {
        axios.post('/api/auth/logout').finally(() => onLogout())
    }

    const firstName = (user.name || user.email || '').split(' ')[0]
    const totalCompleted = playlists.reduce((s, p) => s + (p.completedVideos || 0), 0)

    return (
        <aside style={{
            width: '280px', height: '100vh',
            display: 'flex', flexDirection: 'column',
            background: c.sidebar,
            borderRight: `1px solid ${c.border}`,
            overflow: 'hidden',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>

            {/* ── Brand + theme toggle ── */}
            <div style={{ padding: '16px 16px 14px', borderBottom: `1px solid ${c.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={logo}>▶</div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: c.text, letterSpacing: '-0.02em' }}>TrackTube</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={onToggleTheme} style={iconBtn(c)} title="Toggle theme">
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                        {isMobile && (
                            <button onClick={onClose} style={iconBtn(c)} title="Close">✕</button>
                        )}
                    </div>
                </div>

                {/* User row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            background: '#3d5a80', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', fontWeight: 700,
                        }}>
                            {firstName[0].toUpperCase()}
                        </div>
                        <div style={{
                            position: 'absolute', bottom: '1px', right: '1px',
                            width: '9px', height: '9px', borderRadius: '50%',
                            background: '#22c55e', border: `2px solid ${c.sidebar}`,
                        }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.7rem', color: c.secondary, margin: 0 }}>
                            {getGreeting()}, {firstName} 👋
                        </p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: c.text, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.name || user.email}
                        </p>
                    </div>
                    <button onClick={handleLogout} style={iconBtn(c)} title="Sign out">⏻</button>
                </div>
            </div>

            {/* ── Mini stats ── */}
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${c.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                    { icon: '🔥', label: 'Streak',    value: '12d' },
                    { icon: '📚', label: 'Playlists', value: playlists.length },
                    { icon: '✓',  label: 'Done',      value: totalCompleted },
                ].map(s => (
                    <div key={s.label} style={{ padding: '8px 10px', borderRadius: '9px', background: c.inputBg, border: `1px solid ${c.border}` }}>
                        <div style={{ fontSize: '9px', color: c.mutedText, marginBottom: '2px' }}>{s.icon} {s.label}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: c.text }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Playlist list ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 10px 8px', overflow: 'hidden' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, color: c.mutedText, letterSpacing: '0.09em', textTransform: 'uppercase', padding: '0 6px', marginBottom: '8px' }}>
                    My Playlists
                </p>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {/* Loading skeletons */}
                    {loading && [1,2,3].map(i => (
                        <div key={i} style={{ height: '60px', borderRadius: '10px', background: c.inputBg, marginBottom: '3px', opacity: 0.6 }} />
                    ))}

                    {/* Empty */}
                    {!loading && playlists.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '28px 12px', color: c.mutedText, fontSize: '0.8rem', lineHeight: 1.6 }}>
                            No playlists yet.<br />Add one below to start tracking.
                        </div>
                    )}

                    {/* Playlist items */}
                    {playlists.map((pl, i) => {
                        const isActive  = selectedPlaylistId === pl.id
                        const isHovered = hoveredId === pl.id
                        const pct = pl.totalVideos === 0
                            ? 0
                            : Math.round((pl.completedVideos / pl.totalVideos) * 100)

                        return (
                            <div
                                key={pl.id}
                                onClick={() => onSelectPlaylist(pl.id)}
                                onMouseEnter={() => setHoveredId(pl.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px 10px 10px 14px',
                                    borderRadius: '10px', cursor: 'pointer',
                                    position: 'relative', overflow: 'hidden',
                                    transition: 'all 0.18s ease',
                                    background: isActive ? '#3d5a80' : isHovered ? c.inputBg : 'transparent',
                                    border: `1px solid ${isActive ? 'transparent' : isHovered ? c.borderStrong : 'transparent'}`,
                                    transform: isHovered && !isActive ? 'translateY(-1px)' : 'none',
                                    animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
                                }}
                            >
                                {/* Active indicator bar */}
                                {isActive && (
                                    <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px', borderRadius: '0 2px 2px 0', background: '#ee6c4d' }} />
                                )}

                                {/* Thumbnail or placeholder */}
                                {pl.thumbnailUrl
                                    ? <img src={pl.thumbnailUrl} alt="" style={{ width: '42px', height: '30px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, opacity: isActive ? 0.85 : 1 }} />
                                    : (
                                        <div style={{ width: '42px', height: '30px', borderRadius: '6px', background: isActive ? 'rgba(255,255,255,0.15)' : c.progressTrack, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>▶</div>
                                    )
                                }

                                {/* Title + meta */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: isActive ? '#fff' : c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                                        {pl.title}
                                    </p>
                                    <p style={{ fontSize: '0.68rem', color: isActive ? 'rgba(255,255,255,0.6)' : c.metaText, margin: '2px 0 0' }}>
                                        {pl.totalVideos} videos · {pct}%
                                    </p>
                                    <div style={{ height: '2px', background: isActive ? 'rgba(255,255,255,0.2)' : c.progressTrack, borderRadius: '1px', marginTop: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: isActive ? '#fff' : '#3d5a80', borderRadius: '1px', transition: 'width 0.5s ease' }} />
                                    </div>
                                </div>

                                {/* Delete button (hover only) */}
                                {(isHovered || deletingId === pl.id) && (
                                    <button
                                        onClick={e => handleDelete(e, pl.id)}
                                        disabled={deletingId === pl.id}
                                        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '3px 5px', color: '#ee6c4d', borderRadius: '5px' }}
                                    >
                                        {deletingId === pl.id ? '…' : '🗑'}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Add playlist ── */}
            <div style={{ padding: '12px 14px', borderTop: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {error && (
                    <p style={{ fontSize: '0.72rem', color: '#ee6c4d', margin: 0 }}>{error}</p>
                )}
                <input
                    type="text"
                    placeholder="Paste YouTube playlist URL..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    disabled={adding}
                    style={{
                        width: '100%', padding: '9px 14px',
                        borderRadius: '999px',
                        border: `1px solid ${c.border}`,
                        background: c.inputBg, color: c.text,
                        fontSize: '0.8rem', outline: 'none',
                        fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                />
                <button
                    onClick={handleAdd}
                    disabled={adding}
                    style={{
                        padding: '9px', borderRadius: '999px',
                        border: 'none', background: '#3d5a80', color: '#fff',
                        fontWeight: 600, fontSize: '0.82rem',
                        cursor: 'pointer', opacity: adding ? 0.7 : 1,
                        fontFamily: 'inherit',
                    }}
                >
                    + {adding ? 'Adding...' : 'Add Playlist'}
                </button>
            </div>
        </aside>
    )
}

const logo = {
    width: '26px', height: '26px', borderRadius: '7px',
    background: '#3d5a80', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px',
}

const iconBtn = (c) => ({
    flexShrink: 0, background: 'none',
    border: `1px solid ${c.border}`,
    borderRadius: '7px', padding: '5px 8px',
    cursor: 'pointer', fontSize: '13px', lineHeight: 1,
    color: c.secondary, fontFamily: 'inherit',
})