import { useState } from 'react'

export default function VideoItem({ video, index, onToggle, colors }) {
    const [hovered, setHovered] = useState(false)
    const [btnHovered, setBtnHovered] = useState(false)

    return (
        <div
            style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '12px 16px',
                background: hovered ? (colors.videoCard === '#1a1a1a' ? '#222222' : '#f8feff') : colors.videoCard,
                borderRadius: '12px',
                border: `1px solid ${hovered ? '#3d5a80' : colors.videoBorder}`,
                boxShadow: colors.videoShadow,
                transition: 'all 0.2s ease',
                minHeight: '76px',
                transform: hovered ? 'translateX(4px)' : 'translateX(0)',
                animation: `fadeUp 0.3s ease ${index * 0.03}s both`,
                ...(video.completed ? { opacity: 0.75 } : {}),
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Checkbox */}
            <input
                type="checkbox"
                checked={video.completed}
                onChange={e => onToggle(video.id, e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#3d5a80', cursor: 'pointer', flexShrink: 0 }}
            />

            {/* Thumbnail */}
            <div style={{ width: '112px', height: '63px', borderRadius: '8px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                {video.thumbnailUrl
                    ? <img src={video.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: video.completed ? 0.5 : 1, transition: 'opacity 0.3s' }} />
                    : <div style={{ width: '100%', height: '100%', background: colors.inputBg }} />
                }
                <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '11px', fontWeight: 500, padding: '2px 6px', borderRadius: '4px' }}>
                    {formatDuration(video.durationSeconds)}
                </span>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.mutedText, marginBottom: '3px' }}>#{video.position + 1}</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: video.completed ? colors.mutedText : colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: video.completed ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                    {video.title}
                </p>
            </div>

            {/* Watch button */}
            <a
            href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
            padding: '8px 18px', borderRadius: '8px',
            border: `1px solid ${btnHovered ? '#3d5a80' : colors.border}`,
            background: btnHovered ? '#3d5a80' : colors.videoCard,
            color: btnHovered ? '#fff' : colors.text,
            fontWeight: 600, fontSize: '0.85rem',
            textDecoration: 'none', flexShrink: 0,
            transition: 'all 0.2s',
            transform: btnHovered ? 'scale(1.03)' : 'scale(1)',
            display: 'inline-block',
        }}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            >
            Watch
        </a>
</div>
)
}

function formatDuration(seconds) {
    if (!seconds) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const sec = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${m}:${String(sec).padStart(2, '0')}`
}