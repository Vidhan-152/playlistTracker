import { useState, useEffect } from 'react'
import axios from '../api/client'
import VideoItem from './VideoItem'

export default function PlaylistDetail({ playlistId, colors, isMobile }) {
    const [playlist, setPlaylist] = useState(null)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => { fetchDetail() }, [playlistId])

    function fetchDetail() {
        setLoading(true)
        setError(null)
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
        setPlaylist(prev => {
            const videos = prev.videos.map(v => v.id === videoId ? { ...v, completed } : v)
            const completedVideos = videos.filter(v => v.completed).length
            const completedDuration = videos.filter(v => v.completed).reduce((s, v) => s + v.durationSeconds, 0)
            const totalDuration = prev.stats.totalDurationSeconds
            const total = prev.stats.totalVideos
            return {
                ...prev, videos,
                stats: {
                    ...prev.stats, completedVideos,
                    completedDurationSeconds: completedDuration,
                    remainingDurationSeconds: totalDuration - completedDuration,
                    percentComplete: total === 0 ? 0 : Math.round((completedVideos / total) * 1000) / 10,
                }
            }
        })
        axios.patch(`/api/videos/${videoId}/progress`, { completed })
            .catch(() => fetchDetail())
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
            <div style={{ width: '32px', height: '32px', border: `3px solid ${colors.mutedText}`, borderTop: `3px solid #3d5a80`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    )
    if (error) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}><p style={{ color: '#ee6c4d' }}>{error}</p></div>
    if (!playlist) return null

    const { stats } = playlist
    const pct = stats.percentComplete

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '28px', animation: 'fadeUp 0.3s ease' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: '12px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    {playlist.thumbnailUrl && !isMobile && (
                        <img src={playlist.thumbnailUrl} alt="" style={{ width: '72px', height: '50px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                        <h1 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 700, color: colors.text, wordBreak: 'break-word' }}>{playlist.title}</h1>
                        <p style={{ fontSize: '0.78rem', color: colors.metaText, marginTop: '3px' }}>
                            {stats.totalVideos} videos • {stats.completedVideos} completed
                        </p>
                    </div>
                </div>
                <button
                    style={{ padding: '8px 16px', borderRadius: '999px', border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', opacity: syncing ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0 }}
                    onClick={handleSync} disabled={syncing}
                >
                    {syncing ? '⟳ Syncing...' : '⟳ Sync'}
                </button>
            </div>

            {/* Progress card */}
            <div style={{ background: colors.progressCard, borderRadius: '12px', padding: isMobile ? '16px' : '24px 28px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, height: '8px', background: colors.progressTrack, borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#3d5a80', borderRadius: '999px', width: `${pct}%`, transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: colors.metaText, minWidth: '40px', textAlign: 'right' }}>{pct}%</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '8px' }}>
                    <StatBox icon="✓" label="Completed" value={`${stats.completedVideos}/${stats.totalVideos}`} color={colors.metaText} bg={colors.inputBg} />
                    <StatBox icon="⏱" label="Watched" value={formatDuration(stats.completedDurationSeconds)} color={colors.metaText} bg={colors.inputBg} />
                    <StatBox icon="📚" label="Progress" value={`${pct}%`} color={colors.metaText} bg={colors.inputBg} />
                    <StatBox icon="⏳" label="Remaining" value={formatDuration(stats.remainingDurationSeconds)} color={colors.metaText} bg={colors.inputBg} />
                </div>
            </div>

            {/* Video list */}
            <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: colors.text, marginBottom: '10px' }}>Videos</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {playlist.videos.map((video, i) => (
                        <VideoItem key={video.id} video={video} index={i} colors={colors} isMobile={isMobile} onToggle={handleProgressChange} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function StatBox({ icon, label, value, color, bg }) {
    return (
        <div style={{ background: bg, borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color, opacity: 0.7 }}>{icon} {label}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color }}>{value}</span>
        </div>
    )
}

function formatDuration(seconds) {
    if (!seconds) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}