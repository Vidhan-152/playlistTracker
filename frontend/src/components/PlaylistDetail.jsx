// src/components/PlaylistDetail.jsx
import { useState, useEffect } from 'react'
import axios from '../api/client'
import VideoItem from './VideoItem'
import AIDrawer from './AIDrawer'

export default function PlaylistDetail({ playlistId, colors, isMobile }) {
    const c = colors
    const [playlist, setPlaylist]   = useState(null)
    const [loading, setLoading]     = useState(true)
    const [syncing, setSyncing]     = useState(false)
    const [error, setError]         = useState(null)

    // AI Drawer state: null | { videoId, videoTitle, tab }
    const [drawer, setDrawer]       = useState(null)

    useEffect(() => { fetchDetail() }, [playlistId])

    // Close drawer when switching playlists
    useEffect(() => { setDrawer(null) }, [playlistId])

    function fetchDetail() {
        setLoading(true); setError(null)
        axios.get(`/api/playlists/${playlistId}`)
            .then(res => setPlaylist(res.data))
            .catch(() => setError('Failed to load playlist'))
            .finally(() => setLoading(false))
    }

    function handleSync() {
        setSyncing(true)
        axios.post(`/api/playlists/${playlistId}/sync`, {})
            .then(res => setPlaylist(res.data))
            .catch(err => setError(err.response?.data?.message || 'Sync failed'))
            .finally(() => setSyncing(false))
    }

    function handleProgressChange(videoId, completed) {
        // Optimistic update
        setPlaylist(prev => {
            const videos           = prev.videos.map(v => v.id === videoId ? { ...v, completed } : v)
            const completedVideos  = videos.filter(v => v.completed).length
            const completedDuration = videos.filter(v => v.completed).reduce((s, v) => s + v.durationSeconds, 0)
            const total            = prev.stats.totalVideos
            const totalDuration    = prev.stats.totalDurationSeconds
            return {
                ...prev, videos,
                stats: {
                    ...prev.stats,
                    completedVideos,
                    completedDurationSeconds: completedDuration,
                    remainingDurationSeconds: totalDuration - completedDuration,
                    percentComplete: total === 0 ? 0 : Math.round((completedVideos / total) * 1000) / 10,
                },
            }
        })
        axios.patch(`/api/videos/${videoId}/progress`, { completed }).catch(() => fetchDetail())
    }

    function openDrawer(videoId, videoTitle, tab) {
        // Toggle: clicking same video+tab closes the drawer
        if (drawer?.videoId === videoId && drawer?.tab === tab) {
            setDrawer(null)
        } else {
            setDrawer({ videoId, videoTitle, tab })
        }
    }

    // ── States ───────────────────────────────────────────────────────────────

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
            <div style={{ width: '32px', height: '32px', border: `3px solid ${c.mutedText}`, borderTop: `3px solid #3d5a80`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    )

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '12px' }}>
            <p style={{ color: '#ee6c4d', fontSize: '0.9rem' }}>{error}</p>
            <button onClick={fetchDetail} style={{ padding: '8px 20px', borderRadius: '999px', background: '#3d5a80', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
        </div>
    )

    if (!playlist) return null

    const { stats } = playlist
    const pct       = stats.percentComplete

    return (
        <div style={{ display: 'flex', height: '100%' }}>

            {/* ── Main content ── */}
            <div style={{
                flex: 1, minWidth: 0,
                display: 'flex', flexDirection: 'column',
                gap: isMobile ? '14px' : '20px',
                animation: 'fadeUp 0.3s ease',
                maxWidth: drawer && !isMobile ? 'calc(100% - 380px)' : '860px',
                marginLeft: 'auto',
                marginRight: drawer && !isMobile ? '380px' : 'auto',
            }}>

                {/* Playlist header */}
                <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        {playlist.thumbnailUrl && !isMobile && (
                            <img src={playlist.thumbnailUrl} alt="" style={{ width: '72px', height: '50px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                        )}
                        <div style={{ minWidth: 0 }}>
                            <h1 style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 800, color: c.text, letterSpacing: '-0.02em', wordBreak: 'break-word', margin: 0 }}>
                                {playlist.title}
                            </h1>
                            <p style={{ fontSize: '0.75rem', color: c.metaText, margin: '3px 0 0' }}>
                                {stats.totalVideos} videos · {stats.completedVideos} completed
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        style={{ padding: '8px 18px', borderRadius: '999px', border: `1px solid ${c.border}`, background: c.card, color: c.text, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', opacity: syncing ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}
                    >
                        {syncing ? '⟳ Syncing...' : '⟳ Sync'}
                    </button>
                </div>

                {/* Progress card */}
                <div style={{ background: c.progressCard, borderRadius: '14px', padding: isMobile ? '16px' : '20px 24px', border: `1px solid ${c.border}`, boxShadow: c.cardShadow, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, height: '8px', background: c.progressTrack, borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#3d5a80', borderRadius: '999px', width: `${pct}%`, transition: 'width 0.7s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: c.metaText, minWidth: '44px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '8px' }}>
                        <StatBox icon="✓"  label="Completed" value={`${stats.completedVideos}/${stats.totalVideos}`}          colors={c} />
                        <StatBox icon="⏱" label="Watched"   value={formatDuration(stats.completedDurationSeconds)}            colors={c} />
                        <StatBox icon="📊" label="Progress"  value={`${pct}%`}                                                 colors={c} />
                        <StatBox icon="⏳" label="Remaining" value={formatDuration(stats.remainingDurationSeconds)}            colors={c} />
                    </div>
                </div>

                {/* Video list */}
                <div>
                    <h2 style={{ fontSize: '0.82rem', fontWeight: 700, color: c.text, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '10px' }}>
                        Videos
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        {playlist.videos.map((video, i) => (
                            <VideoItem
                                key={video.id}
                                video={video}
                                index={i}
                                colors={c}
                                isMobile={isMobile}
                                onToggle={handleProgressChange}
                                onOpenNotes={(id, title) => openDrawer(id, title, 'notes')}
                                onOpenChat={(id, title)  => openDrawer(id, title, 'chat')}
                                isDrawerOpen={drawer?.videoId === video.id}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── AI Drawer ── */}
            {drawer && !isMobile && (
                <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 150 }}>
                    <AIDrawer
                        videoId={drawer.videoId}
                        videoTitle={drawer.videoTitle}
                        tab={drawer.tab}
                        onTabChange={tab => setDrawer(d => ({ ...d, tab }))}
                        onClose={() => setDrawer(null)}
                        colors={c}
                    />
                </div>
            )}

            {/* Mobile: drawer as overlay */}
            {drawer && isMobile && (
                <>
                    <div onClick={() => setDrawer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
                    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201, height: '75vh', borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
                        <AIDrawer
                            videoId={drawer.videoId}
                            videoTitle={drawer.videoTitle}
                            tab={drawer.tab}
                            onTabChange={tab => setDrawer(d => ({ ...d, tab }))}
                            onClose={() => setDrawer(null)}
                            colors={c}
                        />
                    </div>
                </>
            )}
        </div>
    )
}

function StatBox({ icon, label, value, colors }) {
    const c = colors
    return (
        <div style={{ background: c.inputBg, borderRadius: '9px', padding: '10px 12px', border: `1px solid ${c.border}` }}>
            <span style={{ fontSize: '10px', color: c.mutedText, display: 'block', marginBottom: '3px' }}>{icon} {label}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: c.metaText }}>{value}</span>
        </div>
    )
}

function formatDuration(seconds) {
    if (!seconds) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}