import { useState, useEffect } from 'react'
import axios from '../api/client'

function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
}

export default function Sidebar({ user, colors, selectedPlaylistId, onSelectPlaylist, onLogout, isMobile, onClose }) {
    const [playlists, setPlaylists] = useState([])
    const [loading, setLoading] = useState(true)
    const [url, setUrl] = useState('')
    const [adding, setAdding] = useState(false)
    const [error, setError] = useState(null)
    const [hoveredId, setHoveredId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    useEffect(() => { fetchPlaylists() }, [])

    function fetchPlaylists() {
        setLoading(true)
        axios.get('/api/playlists')
            .then(res => setPlaylists(res.data))
            .catch(() => setError('Failed to load'))
            .finally(() => setLoading(false))
    }

    function handleAdd() {
        if (!url.trim()) return
        setAdding(true)
        setError(null)
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

    return (
        <aside style={{ ...s.sidebar, background: colors.card, borderRight: `1px solid ${colors.border}` }}>

            {/* User section */}
            <div style={{ ...s.userSection, borderBottom: `1px solid ${colors.border}` }}>
                <div style={s.avatarWrap}>
                    <div style={s.avatarFallback}>{firstName[0].toUpperCase()}</div>
                    <div style={s.onlineDot} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 500, color: colors.secondary }}>{getGreeting()}, {firstName} 👋</p>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || user.email}</p>
                    <p style={{ fontSize: '0.7rem', color: colors.mutedText, marginTop: '2px' }}>Ready to learn today?</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {isMobile && (
                        <button style={s.iconBtn} onClick={onClose} title="Close">✕</button>
                    )}
                    <button style={s.iconBtn} onClick={handleLogout} title="Logout">⏻</button>
                </div>
            </div>

            {/* Playlist list */}
            <div style={s.listSection}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.mutedText, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px', marginBottom: '10px' }}>
                    My Playlists
                </p>
                <div style={s.listScroll}>
                    {loading && [1,2,3].map(i => <div key={i} style={{ height: '58px', borderRadius: '10px', background: colors.inputBg, marginBottom: '4px' }} />)}
                    {!loading && playlists.length === 0 && (
                        <p style={{ fontSize: '0.82rem', color: colors.mutedText, textAlign: 'center', marginTop: '24px' }}>No playlists yet. Add one below.</p>
                    )}
                    {playlists.map((pl, i) => {
                        const isActive = selectedPlaylistId === pl.id
                        const isHovered = hoveredId === pl.id
                        const pct = pl.totalVideos === 0 ? 0 : Math.round((pl.completedVideos / pl.totalVideos) * 100)
                        return (
                            <div
                                key={pl.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px 10px 10px 14px',
                                    borderRadius: '10px', cursor: 'pointer',
                                    position: 'relative', overflow: 'hidden',
                                    transition: 'all 0.2s ease',
                                    border: `1px solid ${isActive ? 'transparent' : isHovered ? colors.border : 'transparent'}`,
                                    background: isActive ? '#3d5a80' : isHovered ? colors.inputBg : 'transparent',
                                    transform: isHovered && !isActive ? 'translateY(-2px)' : 'none',
                                    animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                                }}
                                onClick={() => onSelectPlaylist(pl.id)}
                                onMouseEnter={() => setHoveredId(pl.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px', borderRadius: '0 2px 2px 0', background: '#ee6c4d' }} />}
                                {pl.thumbnailUrl && <img src={pl.thumbnailUrl} alt="" style={{ width: '44px', height: '32px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: isActive ? '#fff' : colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.title}</p>
                                    <p style={{ fontSize: '0.7rem', color: isActive ? 'rgba(255,255,255,0.65)' : colors.metaText }}>{pl.totalVideos} videos • {pct}% done</p>
                                    <div style={{ height: '3px', background: isActive ? 'rgba(255,255,255,0.2)' : colors.progressTrack, borderRadius: '2px', marginTop: '2px' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: isActive ? '#fff' : '#3d5a80', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                                    </div>
                                </div>
                                {(isHovered || deletingId === pl.id) && (
                                    <button
                                        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px', color: '#ee6c4d', borderRadius: '6px' }}
                                        onClick={e => handleDelete(e, pl.id)}
                                        disabled={deletingId === pl.id}
                                    >
                                        {deletingId === pl.id ? '…' : '🗑'}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Add playlist */}
            <div style={{ ...s.addSection, borderTop: `1px solid ${colors.border}` }}>
                {error && <p style={{ fontSize: '0.75rem', color: '#ee6c4d' }}>{error}</p>}
                <input
                    style={{ width: '100%', padding: '10px 16px', borderRadius: '999px', border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text, fontSize: '0.85rem', outline: 'none' }}
                    type="text"
                    placeholder="Paste YouTube playlist URL..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    disabled={adding}
                />
                <button
                    style={{ padding: '10px', borderRadius: '999px', border: 'none', background: '#3d5a80', color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', opacity: adding ? 0.7 : 1 }}
                    onClick={handleAdd}
                    disabled={adding}
                >
                    + {adding ? 'Adding...' : 'Add Playlist'}
                </button>
            </div>
        </aside>
    )
}

const s = {
    sidebar: {
        width: '300px', height: '100vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
    },
    userSection: {
        padding: '20px 16px',
        display: 'flex', alignItems: 'center', gap: '12px',
    },
    avatarWrap: { position: 'relative', flexShrink: 0 },
    avatarFallback: {
        width: '44px', height: '44px', borderRadius: '50%',
        background: '#3d5a80', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', fontWeight: 700,
    },
    onlineDot: {
        position: 'absolute', bottom: '2px', right: '2px',
        width: '9px', height: '9px', borderRadius: '50%',
        background: '#4ade80', border: '2px solid white',
    },
    iconBtn: {
        flexShrink: 0, background: 'none',
        border: '1px solid rgba(152,193,217,0.4)',
        borderRadius: '8px', padding: '5px 8px',
        cursor: 'pointer', fontSize: '14px', lineHeight: 1,
        color: '#3d5a80',
    },
    listSection: {
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '16px 12px 8px', overflow: 'hidden',
    },
    listScroll: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' },
    addSection: {
        padding: '14px',
        display: 'flex', flexDirection: 'column', gap: '8px',
    },
}