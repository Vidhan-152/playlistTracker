import { useState, useEffect } from 'react'
import axios from '../api/client'

function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
}

export default function Sidebar({ user, colors, selectedPlaylistId, onSelectPlaylist, onLogout }) {
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
        axios.post('/api/auth/logout')
            .finally(() => onLogout())
    }

    const firstName = (user.name || user.email || '').split(' ')[0]

    return (
        <aside style={{ ...s.sidebar, background: colors.card, borderRight: `1px solid ${colors.border}` }}>
            {/* User section */}
            <div style={s.userSection}>
                <div style={s.avatarWrap}>
                    <div style={s.avatarFallback}>{firstName[0].toUpperCase()}</div>
                    <div style={s.onlineDot} />
                </div>
                <div style={{ animation: 'fadeUp 0.4s ease', flex: 1, minWidth: 0 }}>
                    <p style={{...s.greeting, color: colors.text}}>{getGreeting()}, {firstName} 👋</p>
                    <p style={{...s.userName, color: colors.text}}>{user.name || user.email}</p>
                    <p style={{...s.userSub, color: colors.secondary}}>Ready to learn today?</p>
                </div>
                <button style={{...s.logoutBtn, background: colors.logoutBtn}} onClick={handleLogout} title="Logout">
                    ⏻
                </button>
            </div>

            {/* Playlist list */}
            <div style={s.listSection}>
                <p style={{...s.sectionLabel, color: colors.text}}>My Playlists</p>
                <div style={s.listScroll}>
                    {loading && <SkeletonList />}
                    {!loading && playlists.length === 0 && (
                        <p style={{...s.emptyMsg, color: colors.text}}>No playlists yet. Add one below.</p>
                    )}
                    {playlists.map((pl, i) => {
                        const isActive = selectedPlaylistId === pl.id
                        const isHovered = hoveredId === pl.id
                        const pct = pl.totalVideos === 0 ? 0 : Math.round((pl.completedVideos / pl.totalVideos) * 100)
                        return (
                            <div
                                key={pl.id}
                                style={{
                                    ...s.plCard,
                                    ...(isActive ? s.plCardActive : {}),
                                    ...(isHovered && !isActive ? s.plCardHover : {}),
                                    animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                                }}
                                onClick={() => onSelectPlaylist(pl.id)}
                                onMouseEnter={() => setHoveredId(pl.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                {isActive && <div style={s.activeBar} />}
                                {pl.thumbnailUrl && (
                                    <img src={pl.thumbnailUrl} alt="" style={s.plThumb} />
                                )}
                                <div style={s.plInfo}>
                                    <p style={{ ...s.plTitle, ...(isActive ? { color: '#fff' } : {}) }}>
                                        {pl.title}
                                    </p>
                                    <p style={{ ...s.plMeta, ...(isActive ? { color: 'rgba(255,255,255,0.65)' } : {}) }}>
                                        {pl.totalVideos} videos • {pct}% done
                                    </p>
                                    <div style={{ ...s.plTrack, ...(isActive ? { background: 'rgba(255,255,255,0.2)' } : {}) }}>
                                        <div style={{
                                            ...s.plFill,
                                            width: `${pct}%`,
                                            background: isActive ? '#fff' : '#3d5a80',
                                        }} />
                                    </div>
                                </div>
                                {(isHovered || deletingId === pl.id) && (
                                    <button
                                        style={s.deleteBtn}
                                        onClick={e => handleDelete(e, pl.id)}
                                        disabled={deletingId === pl.id}
                                        title="Delete playlist"
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
            <div style={s.addSection}>
                {error && <p style={s.error}>{error}</p>}
                <input
                    style={s.input}
                    type="text"
                    placeholder="Paste YouTube playlist URL..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    disabled={adding}
                />
                <button
                    style={{ ...s.addBtn, opacity: adding ? 0.7 : 1 }}
                    onClick={handleAdd}
                    disabled={adding}
                >
                    + {adding ? 'Adding...' : 'Add Playlist'}
                </button>
            </div>
        </aside>
    )
}

function SkeletonList() {
    return [1, 2, 3].map(i => (
        <div key={i} style={s.skeleton} />
    ))
}

const s = {
    sidebar: {
        width: '300px', minWidth: '300px', height: '100vh',
        background: '#fff',
        borderRight: '1px solid rgba(152,193,217,0.3)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '2px 0 16px rgba(61,90,128,0.06)',
    },
    userSection: {
        padding: '28px 20px 20px',
        borderBottom: '1px solid rgba(152,193,217,0.3)',
        display: 'flex', alignItems: 'center', gap: '14px',
    },
    avatarWrap: { position: 'relative', flexShrink: 0 },
    avatarFallback: {
        width: '48px', height: '48px', borderRadius: '50%',
        background: '#3d5a80', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', fontWeight: 700,
    },
    onlineDot: {
        position: 'absolute', bottom: '2px', right: '2px',
        width: '10px', height: '10px', borderRadius: '50%',
        background: '#4ade80', border: '2px solid #fff',
    },
    greeting: { fontSize: '0.82rem', fontWeight: 500, color: '#3d5a80' },
    userName: { fontSize: '1rem', fontWeight: 700, color: '#293241', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    userSub: { fontSize: '0.72rem', color: '#98c1d9', marginTop: '2px' },
    logoutBtn: {
        flexShrink: 0, background: 'none', border: '1px solid rgba(152,193,217,0.4)',
        borderRadius: '8px', padding: '6px 8px', cursor: 'pointer',
        color: '#3d5a80', fontSize: '16px', lineHeight: 1,
        transition: 'all 0.2s',
    },
    listSection: {
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '20px 12px 8px', overflow: 'hidden',
    },
    sectionLabel: {
        fontSize: '0.7rem', fontWeight: 600,
        color: '#98c1d9', letterSpacing: '0.08em',
        textTransform: 'uppercase', padding: '0 8px', marginBottom: '10px',
    },
    listScroll: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' },
    emptyMsg: { fontSize: '0.82rem', color: '#98c1d9', textAlign: 'center', marginTop: '24px', padding: '0 8px' },
    plCard: {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 10px 10px 14px',
        borderRadius: '10px', cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s ease',
        border: '1px solid transparent',
    },
    plCardHover: {
        background: 'rgba(61,90,128,0.06)',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(61,90,128,0.1)',
        border: '1px solid rgba(152,193,217,0.3)',
    },
    plCardActive: {
        background: '#3d5a80',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 16px rgba(61,90,128,0.25)',
    },
    activeBar: {
        position: 'absolute', left: 0, top: '20%', bottom: '20%',
        width: '3px', borderRadius: '0 2px 2px 0',
        background: '#ee6c4d',
    },
    plThumb: { width: '44px', height: '32px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 },
    plInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' },
    plTitle: { fontSize: '0.82rem', fontWeight: 600, color: '#293241', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    plMeta: { fontSize: '0.7rem', color: '#3d5a80' },
    plTrack: { height: '3px', background: 'rgba(152,193,217,0.3)', borderRadius: '2px', marginTop: '2px' },
    plFill: { height: '100%', borderRadius: '2px', transition: 'width 0.4s ease' },
    deleteBtn: {
        flexShrink: 0, background: 'none', border: 'none',
        cursor: 'pointer', fontSize: '14px', padding: '4px',
        color: '#ee6c4d', borderRadius: '6px',
        animation: 'fadeIn 0.15s ease',
        transition: 'background 0.15s',
    },
    addSection: {
        padding: '16px',
        borderTop: '1px solid rgba(152,193,217,0.3)',
        display: 'flex', flexDirection: 'column', gap: '8px',
    },
    input: {
        width: '100%', padding: '10px 16px',
        borderRadius: '999px',
        border: '1px solid rgba(152,193,217,0.5)',
        background: '#f8feff',
        color: '#293241', fontSize: '0.85rem',
        transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    addBtn: {
        padding: '10px', borderRadius: '999px', border: 'none',
        background: '#3d5a80', color: '#fff',
        fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
        transition: 'transform 0.15s, background 0.2s',
    },
    error: { fontSize: '0.75rem', color: '#ee6c4d' },
    skeleton: {
        height: '58px', borderRadius: '10px',
        background: 'linear-gradient(90deg, #f0f9fa, #e0f7f8, #f0f9fa)',
        backgroundSize: '200% 100%',
        animation: 'fadeIn 0.5s ease',
        marginBottom: '4px',
    },
}