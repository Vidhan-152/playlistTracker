import { useState } from 'react'

export default function VideoItem({ video, index, onToggle }) {
    const [hovered, setHovered] = useState(false)
    const [btnHovered, setBtnHovered] = useState(false)

    return (
        <div
            style={{
                ...s.card,
                ...(hovered ? s.cardHover : {}),
                ...(video.completed ? s.cardDone : {}),
                animation: `fadeUp 0.3s ease ${index * 0.03}s both`,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Checkbox */}
            <div style={s.checkWrap}>
                <input
                    type="checkbox"
                    checked={video.completed}
                    onChange={e => onToggle(video.id, e.target.checked)}
                    style={s.checkbox}
                />
            </div>

            {/* Thumbnail */}
            <div style={s.thumbWrap}>
                {video.thumbnailUrl
                    ? <img
                        src={video.thumbnailUrl}
                        alt=""
                        style={{ ...s.thumb, opacity: video.completed ? 0.5 : 1 }}
                    />
                    : <div style={s.thumbPlaceholder} />
                }
                <span style={s.duration}>{formatDuration(video.durationSeconds)}</span>
            </div>

            {/* Info */}
            <div style={s.info}>
                <p style={s.num}>#{video.position + 1}</p>
                <p style={{ ...s.title, ...(video.completed ? s.titleDone : {}) }}>
                    {video.title}
                </p>
            </div>

            {/* Watch button */}
        <a
            href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: '1px solid #3d5a80',
            background: btnHovered ? '#3d5a80' : '#fff',
            color: btnHovered ? '#fff' : '#3d5a80',
            fontWeight: 600,
            fontSize: '0.85rem',
            textDecoration: 'none',
            flexShrink: 0,
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

const s = {
    card: {
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '12px 16px',
        background: '#fff', borderRadius: '12px',
        border: '1px solid rgba(152,193,217,0.2)',
        boxShadow: '0 1px 4px rgba(61,90,128,0.05)',
        transition: 'all 0.2s ease',
        minHeight: '76px',
    },
    cardHover: {
        transform: 'translateX(4px)',
        boxShadow: '0 4px 16px rgba(61,90,128,0.1)',
        border: '1px solid rgba(152,193,217,0.5)',
    },
    cardDone: { background: 'rgba(224,251,252,0.6)' },
    checkWrap: { flexShrink: 0 },
    checkbox: { width: '18px', height: '18px', accentColor: '#3d5a80', cursor: 'pointer' },
    thumbWrap: { width: '112px', height: '63px', borderRadius: '8px', overflow: 'hidden', position: 'relative', flexShrink: 0 },
    thumb: { width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' },
    thumbPlaceholder: { width: '100%', height: '100%', background: '#e0fbfc' },
    duration: {
        position: 'absolute', bottom: '4px', right: '4px',
        background: 'rgba(41,50,65,0.85)', color: '#fff',
        fontSize: '11px', fontWeight: 500,
        padding: '2px 6px', borderRadius: '4px',
    },
    info: { flex: 1, minWidth: 0 },
    num: { fontSize: '0.7rem', fontWeight: 600, color: '#98c1d9', marginBottom: '3px' },
    title: {
        fontSize: '0.9rem', fontWeight: 600, color: '#293241',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        transition: 'all 0.2s',
    },
    titleDone: { color: '#98c1d9', textDecoration: 'line-through' },
}