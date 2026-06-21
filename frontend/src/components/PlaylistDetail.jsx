import { useState, useEffect } from 'react'
import axios from '../api/client'
import VideoItem from './VideoItem'

export default function PlaylistDetail({ playlistId, colors }) {
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
            <div style={{ width: '32px', height: '32px', border: `3px solid ${colors.mutedText}`, borderTop: `3px solid ${colors.button}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    )
    if (error) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}><p style={{ color: '#ee6c4d' }}>{error}</p></div>
    if (!playlist) return null

    const { stats } = playlist
    const pct = stats.percentComplete

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeUp 0.3s ease' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {playlist.thumbnailUrl && (
                        <img src={playlist.thumbnailUrl} alt="" style={{ width: '80px', height: '56px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
                    )}
                    <div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: colors.text }}>{playlist.title}</h1>
                        <p style={{ fontSize: '0.82rem', color: colors.metaText, marginTop: '4px', fontWeight: 500 }}>
                            {stats.totalVideos} videos &nbsp;•&nbsp;
                            {stats.completedVideos} completed &nbsp;•&nbsp;
                            {playlist.lastSyncedAt
                                ? `Synced ${new Date(playlist.lastSyncedAt).toLocaleDateString()}`
                                : 'Never synced'}
                        </p>
                    </div>
                </div>
                <button
                    style={{ padding: '9px 20px', borderRadius: '999px', border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', opacity: syncing ? 0.6 : 1 }}
                    onClick={handleSync} disabled={syncing}
                >
                    {syncing ? '⟳ Syncing...' : '⟳ Sync'}
                </button>
            </div>

            {/* Progress card */}
            <div style={{ background: colors.progressCard, borderRadius: '14px', padding: '24px 28px', boxShadow: colors.videoShadow, border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ flex: 1, height: '8px', background: colors.progressTrack, borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#3d5a80', borderRadius: '999px', width: `${pct}%`, transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: colors.metaText, minWidth: '40px', textAlign: 'right' }}>{pct}%</span>
                </div>
                <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                    <Stat icon="✓" value={`${stats.completedVideos} videos completed`} color={colors.metaText} />
                    <Stat icon="⏱" value={`${formatDuration(stats.completedDurationSeconds)} watched`} color={colors.metaText} />
                    <Stat icon="📚" value={`${pct}% completed`} color={colors.metaText} />
                    <Stat icon="⏳" value={`${formatDuration(stats.remainingDurationSeconds)} remaining`} color={colors.metaText} />
                </div>
            </div>

            {/* Video list */}
            <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: colors.text, marginBottom: '12px', letterSpacing: '-0.01em' }}>Videos</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {playlist.videos.map((video, i) => (
                        <VideoItem
                            key={video.id}
                            video={video}
                            index={i}
                            colors={colors}
                            onToggle={handleProgressChange}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

function Stat({ icon, value, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px' }}>{icon}</span>
            <span style={{ fontSize: '13px', fontWeight: 500, color }}>{value}</span>
        </div>
    )
}

function formatDuration(seconds) {
    if (!seconds) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}