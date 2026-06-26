// src/components/VideoItem.jsx
import { useState } from 'react'

export default function VideoItem({
                                      video, index, onToggle, colors, isMobile,
                                      onOpenNotes, onOpenChat, isDrawerOpen,
                                  }) {
    const c = colors
    const [hovered, setHovered]     = useState(false)
    const [hoveredBtn, setHoveredBtn] = useState(null)   // 'watch' | 'notes' | 'chat'

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center',
                gap: isMobile ? '10px' : '14px',
                padding: isMobile ? '10px 12px' : '11px 14px',
                background: isDrawerOpen ? c.progressCard : hovered ? c.videoCard : c.bg,
                borderRadius: '12px',
                border: `1px solid ${isDrawerOpen ? '#3d5a80' : hovered ? c.borderStrong : c.videoBorder}`,
                boxShadow: hovered ? c.videoHoverShadow : c.videoShadow,
                transition: 'all 0.18s ease',
                transform: hovered && !isMobile ? 'translateX(3px)' : 'none',
                animation: `fadeUp 0.3s ease ${index * 0.03}s both`,
                opacity: video.completed ? 0.7 : 1,
                cursor: 'default',
            }}
        >
            {/* Checkbox */}
            <input
                type="checkbox"
                checked={video.completed}
                onChange={e => onToggle(video.id, e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#3d5a80', cursor: 'pointer', flexShrink: 0 }}
            />

            {/* Thumbnail (desktop only) */}
            {!isMobile && (
                <div style={{ width: '104px', height: '58px', borderRadius: '8px', overflow: 'hidden', position: 'relative', flexShrink: 0, background: c.progressTrack }}>
                    {video.thumbnailUrl
                        ? <img src={video.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: video.completed ? 0.45 : 1 }} />
                        : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', opacity: 0.4 }}>▶</div>
                        )
                    }
                    <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.78)', color: '#fff', fontSize: '9px', padding: '2px 5px', borderRadius: '4px', fontWeight: 600 }}>
                        {formatTime(video.durationSeconds)}
                    </span>
                </div>
            )}

            {/* Video info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.66rem', fontWeight: 600, color: c.mutedText, margin: '0 0 2px' }}>
                    #{video.position + 1}{isMobile ? ` · ${formatTime(video.durationSeconds)}` : ''}
                </p>
                <p style={{
                    fontSize: isMobile ? '0.82rem' : '0.875rem',
                    fontWeight: 600,
                    color: video.completed ? c.mutedText : c.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textDecoration: video.completed ? 'line-through' : 'none',
                    margin: 0,
                }}>
                    {video.title}
                </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                {/* Watch */}
                <a
                    href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setHoveredBtn('watch')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                        padding: isMobile ? '5px 10px' : '7px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${hoveredBtn === 'watch' ? '#3d5a80' : c.border}`,
                        background: hoveredBtn === 'watch' ? '#3d5a80' : c.card,
                        color: hoveredBtn === 'watch' ? '#fff' : c.text,
                        fontWeight: 600,
                        fontSize: isMobile ? '0.72rem' : '0.78rem',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                        display: 'inline-block',
                        whiteSpace: 'nowrap',
                        fontFamily: 'inherit',
                    }}
                >
                    Watch
                </a>

                {/* AI Notes */}
                <button
                    onClick={() => onOpenNotes(video.id, video.title)}
                    onMouseEnter={() => setHoveredBtn('notes')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                        padding: isMobile ? '5px 10px' : '7px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${hoveredBtn === 'notes' || (isDrawerOpen) ? '#ee6c4d' : c.border}`,
                        background: hoveredBtn === 'notes' ? '#ee6c4d' : 'transparent',
                        color: hoveredBtn === 'notes' ? '#fff' : '#ee6c4d',
                        fontWeight: 600,
                        fontSize: isMobile ? '0.72rem' : '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                        fontFamily: 'inherit',
                    }}
                >
                    {isMobile ? '📝' : '📝 Notes'}
                </button>

                {/* Chat */}
                <button
                    onClick={() => onOpenChat(video.id, video.title)}
                    onMouseEnter={() => setHoveredBtn('chat')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                        padding: isMobile ? '5px 10px' : '7px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${hoveredBtn === 'chat' ? '#3d5a80' : c.border}`,
                        background: hoveredBtn === 'chat' ? '#3d5a80' : 'transparent',
                        color: hoveredBtn === 'chat' ? '#fff' : c.secondary,
                        fontWeight: 600,
                        fontSize: isMobile ? '0.72rem' : '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                        fontFamily: 'inherit',
                    }}
                >
                    {isMobile ? '💬' : '💬 Chat'}
                </button>
            </div>
        </div>
    )
}

function formatTime(seconds) {
    if (!seconds) return '0:00'
    const h   = Math.floor(seconds / 3600)
    const m   = Math.floor((seconds % 3600) / 60)
    const sec = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${m}:${String(sec).padStart(2,'0')}`
}