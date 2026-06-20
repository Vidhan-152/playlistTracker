import { useState, useEffect } from 'react'
import axios from 'axios'
import VideoItem from './VideoItem'

export default function PlaylistDetail({ playlistId, onDeleted }) {
    const [playlist, setPlaylist] = useState(null)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => { fetchDetail() }, [playlistId])

    function fetchDetail() {
        setLoading(true)
        setError(null)
        axios.get(`/api/playlists/${playlistId}`, { withCredentials: true })
            .then(res => setPlaylist(res.data))
            .catch(() => setError('Failed to load playlist'))
            .finally(() => setLoading(false))
    }

    function handleSync() {
        setSyncing(true)
        axios.post(`/api/playlists/${playlistId}/sync`, {}, { withCredentials: true })
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
        axios.patch(`/api/videos/${videoId}/progress`, { completed }, { withCredentials: true })
            .catch(() => fetchDetail())
    }

    if (loading) return (
        <div style={s.center}>
            <div style={s.spinner} />
        </div>
    )
    if (error) return <div style={s.center}><p style={{ color: '#ee6c4d' }}>{error}</p></div>
    if (!playlist) return null

    const { stats } = playlist
    const pct = stats.percentComplete

    return (
        <div style={s.container}>

            {/* Header */}
            <div style={s.header}>
                <div style={s.headerLeft}>
                    {playlist.thumbnailUrl && (
                        <img src={playlist.thumbnailUrl} alt="" style={s.headerThumb} />
                    )}
                    <div>
                        <h1 style={s.title}>{playlist.title}</h1>
                        <p style={s.meta}>
                            {stats.totalVideos} videos &nbsp;•&nbsp;
                            {stats.completedVideos} completed &nbsp;•&nbsp;
                            {playlist.lastSyncedAt
                                ? `Synced ${new Date(playlist.lastSyncedAt).toLocaleDateString()}`
                                : 'Never synced'}
                        </p>
                    </div>
                </div>
                <button
                    style={{ ...s.syncBtn, opacity: syncing ? 0.6 : 1 }}
                    onClick={handleSync} disabled={syncing}
                >
                    {syncing ? '⟳ Syncing...' : '⟳ Sync'}
                </button>
            </div>

            {/* Progress */}
            <div style={s.progressCard}>
                <div style={s.progressBarWrap}>
                    <div style={s.progressTrack}>
                        <div style={{ ...s.progressFill, width: `${pct}%` }} />
                    </div>
                    <span style={s.progressPct}>{pct}%</span>
                </div>
                <div style={s.statsRow}>
                    <Stat icon="✓" value={`${stats.completedVideos} videos completed`} />
                    <Stat icon="⏱" value={`${formatDuration(stats.completedDurationSeconds)} watched`} />
                    <Stat icon="📚" value={`${pct}% completed`} />
                    <Stat icon="⏳" value={`${formatDuration(stats.remainingDurationSeconds)} remaining`} />
                </div>
            </div>

            {/* Video list */}
            <div>
                <h2 style={s.sectionTitle}>Videos</h2>
                <div style={s.videoList}>
                    {playlist.videos.map((video, i) => (
                        <VideoItem
                            key={video.id}
                            video={video}
                            index={i}
                            onToggle={handleProgressChange}
                        />
                    ))}
                </div>
            </div>

        </div>
    )
}

function Stat({ icon, value }) {
    return (
        <div style={s.stat}>
            <span style={s.statIcon}>{icon}</span>
            <span style={s.statText}>{value}</span>
        </div>
    )
}

function formatDuration(seconds) {
    if (!seconds) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const s = {
    container: { maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeUp 0.3s ease' },
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' },
    spinner: { width: '32px', height: '32px', border: '3px solid #98c1d9', borderTop: '3px solid #3d5a80', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
    headerThumb: { width: '80px', height: '56px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 2px 8px rgba(61,90,128,0.15)' },
    title: { fontSize: '1.6rem', fontWeight: 700, color: '#293241' },
    meta: { fontSize: '0.82rem', color: '#3d5a80', marginTop: '4px', fontWeight: 500 },
    syncBtn: {
        padding: '9px 20px', borderRadius: '999px', border: '1px solid #98c1d9',
        background: '#fff', color: '#3d5a80', fontWeight: 600,
        fontSize: '0.85rem', cursor: 'pointer',
        transition: 'all 0.2s', whiteSpace: 'nowrap',
    },
    progressCard: {
        background: '#fff', borderRadius: '14px',
        padding: '24px 28px',
        boxShadow: '0 2px 12px rgba(61,90,128,0.07)',
        border: '1px solid rgba(152,193,217,0.2)',
        display: 'flex', flexDirection: 'column', gap: '20px',
    },
    progressBarWrap: { display: 'flex', alignItems: 'center', gap: '14px' },
    progressTrack: { flex: 1, height: '8px', background: '#98c1d9', borderRadius: '999px', overflow: 'hidden' },
    progressFill: { height: '100%', background: '#3d5a80', borderRadius: '999px', transition: 'width 0.6s ease', animation: 'fillBar 0.8s ease' },
    progressPct: { fontSize: '0.9rem', fontWeight: 700, color: '#3d5a80', minWidth: '40px', textAlign: 'right' },
    statsRow: { display: 'flex', gap: '32px', flexWrap: 'wrap' },
    stat: { display: 'flex', alignItems: 'center', gap: '6px' },
    statIcon: { fontSize: '13px' },
    statText: { fontSize: '13px', fontWeight: 500, color: '#3d5a80' },
    sectionTitle: { fontSize: '1rem', fontWeight: 700, color: '#293241', marginBottom: '12px', letterSpacing: '-0.01em' },
    videoList: { display: 'flex', flexDirection: 'column', gap: '8px' },
}