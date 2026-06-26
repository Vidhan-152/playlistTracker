// src/components/AIDrawer.jsx
// Right-side drawer for AI Notes and AI Chat.
// Props:
//   videoId     — currently open video id
//   videoTitle  — display title for the drawer header
//   tab         — 'notes' | 'chat'
//   onTabChange — (tab) => void
//   onClose     — () => void
//   colors      — theme color object

import { useState, useEffect, useRef } from 'react'
import { aiClient as axios } from '../api/client'

const LOADING_STEPS = [
    'Fetching transcript...',
    'Understanding lecture...',
    'Generating notes...',
    'Formatting output...',
    'Almost done...',
]

export default function AIDrawer({ videoId, videoTitle, tab, onTabChange, onClose, colors }) {
    const c = colors

    // ── Notes state ──────────────────────────────────────────────────────────
    const [notesCache, setNotesCache]   = useState({})   // videoId → html string
    const [notesLoading, setNotesLoading] = useState(false)
    const [notesError, setNotesError]   = useState(null)
    const [loadingStep, setLoadingStep] = useState(0)

    // ── Chat state ───────────────────────────────────────────────────────────
    const [messages, setMessages]       = useState([
        { role: 'assistant', text: 'Hi! Ask me anything about this lecture. I have the full transcript loaded.' },
    ])
    const [chatInput, setChatInput]     = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [chatError, setChatError]     = useState(null)
    const chatEndRef                    = useRef(null)

    // ── Fetch notes when video changes or tab switches to notes ──────────────
    useEffect(() => {
        if (tab !== 'notes' || !videoId) return
        if (notesCache[videoId]) return   // already fetched
        fetchNotes()
    }, [videoId, tab])

    // Animate loading step text
    useEffect(() => {
        if (!notesLoading) { setLoadingStep(0); return }
        const interval = setInterval(() => {
            setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1))
        }, 700)
        return () => clearInterval(interval)
    }, [notesLoading])

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, chatLoading])

    function fetchNotes() {
        setNotesLoading(true)
        setNotesError(null)
        axios.post(`/api/videos/${videoId}/notes/generate`)
            .then(res => {
                // Backend returns { notes: '<markdown or html string>' }
                setNotesCache(prev => ({ ...prev, [videoId]: res.data.notes }))
            })
            .catch(err => setNotesError(err.response?.data?.message || 'Failed to generate notes'))
            .finally(() => setNotesLoading(false))
    }

    function sendChat() {
        const text = chatInput.trim()
        if (!text || chatLoading) return
        setChatInput('')
        setChatError(null)
        setMessages(prev => [...prev, { role: 'user', text }])
        setChatLoading(true)
        axios.post(`/api/videos/${videoId}/chat`, { message: text })
            .then(res => setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]))
            .catch(err => {
                setChatError(err.response?.data?.message || 'Failed to get a reply')
                setChatLoading(false)
            })
            .finally(() => setChatLoading(false))
    }

    return (
        <div style={{
            width: '380px', flexShrink: 0, height: '100vh',
            borderLeft: `1px solid ${c.border}`,
            display: 'flex', flexDirection: 'column',
            background: c.card,
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>

            {/* ── Header ── */}
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {['notes', 'chat'].map(t => (
                            <button
                                key={t}
                                onClick={() => onTabChange(t)}
                                style={{
                                    padding: '6px 14px', borderRadius: '7px', border: 'none',
                                    background: tab === t ? '#3d5a80' : 'transparent',
                                    color: tab === t ? '#fff' : c.secondary,
                                    fontWeight: 600, fontSize: '0.78rem',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {t === 'notes' ? '📝 AI Notes' : '💬 Chat'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: '7px', padding: '5px 9px', cursor: 'pointer', fontSize: '13px', color: c.secondary, fontFamily: 'inherit' }}
                    >
                        ✕
                    </button>
                </div>
                {videoTitle && (
                    <p style={{ fontSize: '0.75rem', color: c.metaText, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {videoTitle}
                    </p>
                )}
            </div>

            {/* ── Notes tab ── */}
            {tab === 'notes' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
                    {notesLoading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', height: '200px' }}>
                            <div style={{ width: '28px', height: '28px', border: `3px solid ${c.progressTrack}`, borderTop: `3px solid #3d5a80`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            {LOADING_STEPS.map((step, i) => (
                                <div key={i} style={{ fontSize: '0.8rem', color: i === loadingStep ? c.text : c.mutedText, fontWeight: i === loadingStep ? 600 : 400, transition: 'color 0.3s' }}>
                                    {i === loadingStep ? '⏳ ' : ''}{step}
                                </div>
                            ))}
                        </div>
                    )}

                    {notesError && !notesLoading && (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>⚠️</div>
                            <p style={{ fontSize: '0.85rem', color: '#ee6c4d', marginBottom: '14px' }}>{notesError}</p>
                            <button onClick={fetchNotes} style={{ padding: '8px 20px', borderRadius: '999px', background: '#3d5a80', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Retry
                            </button>
                        </div>
                    )}

                    {!notesLoading && !notesError && notesCache[videoId] && (
                        <div
                            className="ai-notes-content"
                            style={{ fontSize: '0.85rem', color: c.text, lineHeight: 1.75 }}
                            dangerouslySetInnerHTML={{ __html: notesCache[videoId] }}
                        />
                    )}
                </div>
            )}

            {/* ── Chat tab ── */}
            {tab === 'chat' && (
                <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    maxWidth: '86%', padding: '10px 14px',
                                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                    background: msg.role === 'user' ? '#3d5a80' : c.inputBg,
                                    color: msg.role === 'user' ? '#fff' : c.text,
                                    fontSize: '0.85rem', lineHeight: 1.65,
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {chatLoading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: c.inputBg, display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    {[0,1,2].map(i => (
                                        <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.mutedText, animation: `bounce 1s ease ${i * 0.2}s infinite` }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {chatError && (
                            <p style={{ fontSize: '0.78rem', color: '#ee6c4d', textAlign: 'center' }}>{chatError}</p>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat input */}
                    <div style={{ padding: '12px 14px', borderTop: `1px solid ${c.border}`, display: 'flex', gap: '8px' }}>
                        <input
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                            placeholder="Ask about this lecture..."
                            style={{
                                flex: 1, padding: '9px 14px',
                                borderRadius: '999px', border: `1px solid ${c.border}`,
                                background: c.inputBg, color: c.text,
                                fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
                            }}
                        />
                        <button
                            onClick={sendChat}
                            disabled={chatLoading || !chatInput.trim()}
                            style={{
                                padding: '9px 16px', borderRadius: '999px',
                                background: '#3d5a80', color: '#fff',
                                border: 'none', fontWeight: 600, fontSize: '0.85rem',
                                cursor: 'pointer', opacity: chatLoading ? 0.6 : 1,
                                fontFamily: 'inherit', flexShrink: 0,
                            }}
                        >
                            →
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}