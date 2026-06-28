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
import { marked } from 'marked'
import axios from '../api/client'

// Chat is built but not ready to ship yet — flip to true to bring it back.
const CHAT_FEATURE_ENABLED = false

const LOADING_STEPS = [
    'Fetching transcript...',
    'Understanding lecture...',
    'Generating notes...',
    'Formatting output...',
    'Almost done...',
]

export default function AIDrawer({ videoId, videoTitle, tab, onTabChange, onClose, colors }) {
    const c = colors

    // While chat is flagged off, the drawer is always effectively on 'notes'
    // regardless of what tab the parent passed in (e.g. a stale 'chat' value
    // from before the flag was added, or the Chat button in VideoItem).
    const activeTab = CHAT_FEATURE_ENABLED ? tab : 'notes'

    // ── Notes state ──────────────────────────────────────────────────────────
    // notesCache[videoId] = { html, markdown }
    const [notesCache, setNotesCache]   = useState({})
    const [notesLoading, setNotesLoading] = useState(false)
    const [notesError, setNotesError]   = useState(null)
    const [loadingStep, setLoadingStep] = useState(0)
    const [isEditing, setIsEditing]     = useState(false)
    const [editValue, setEditValue]     = useState('')
    const [saving, setSaving]           = useState(false)

    // ── Chat state ───────────────────────────────────────────────────────────
    const [messages, setMessages]       = useState([
        { role: 'assistant', text: 'Hi! Ask me anything about this lecture. I have the full transcript loaded.' },
    ])
    const [chatInput, setChatInput]     = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [chatError, setChatError]     = useState(null)
    const chatEndRef                    = useRef(null)

    // ── Load notes when video changes or tab switches to notes ───────────────
    // Always check for an existing saved note first; only generate a fresh
    // one via Groq if nothing exists yet. This avoids re-generating (and
    // getting different wording) on every page refresh.
    useEffect(() => {
        if (activeTab !== 'notes' || !videoId) return
        if (notesCache[videoId]) return   // already loaded this session
        loadNotes()
    }, [videoId, activeTab])

    // Reset edit mode whenever the active video changes
    useEffect(() => {
        setIsEditing(false)
    }, [videoId])

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

    function setNote(markdown) {
        const html = marked.parse(markdown || '')
        setNotesCache(prev => ({ ...prev, [videoId]: { html, markdown } }))
    }

    function loadNotes() {
        setNotesLoading(true)
        setNotesError(null)
        axios.get(`/api/videos/${videoId}/notes`)
            .then(res => {
                if (res.status === 200 && res.data?.content) {
                    setNote(res.data.content)
                    setNotesLoading(false)
                } else {
                    generateNotes()
                }
            })
            .catch(() => {
                // 204 No Content or any error here -> nothing saved yet, generate fresh
                generateNotes()
            })
    }

    function generateNotes() {
        setNotesLoading(true)
        setNotesError(null)
        axios.post(`/api/videos/${videoId}/notes/generate`)
            .then(res => setNote(res.data.content))
            .catch(err => setNotesError(err.response?.data?.message || 'Failed to generate notes'))
            .finally(() => setNotesLoading(false))
    }

    function startEditing() {
        setEditValue(notesCache[videoId]?.markdown || '')
        setIsEditing(true)
    }

    function cancelEditing() {
        setIsEditing(false)
    }

    function saveEdit() {
        setSaving(true)
        axios.put(`/api/videos/${videoId}/notes`, { content: editValue })
            .then(res => {
                setNote(res.data.content)
                setIsEditing(false)
            })
            .catch(err => setNotesError(err.response?.data?.message || 'Failed to save notes'))
            .finally(() => setSaving(false))
    }

    function printNotes() {
        const html = notesCache[videoId]?.html
        if (!html) return
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${(videoTitle || 'Notes').replace(/</g, '&lt;')}</title>
                <style>
                    body { font-family: 'Inter', system-ui, sans-serif; padding: 32px; max-width: 760px; margin: 0 auto; color: #111; line-height: 1.6; }
                    h1, h2, h3 { font-weight: 700; margin: 24px 0 10px; }
                    h1 { font-size: 1.4rem; }
                    h2 { font-size: 1.15rem; }
                    h3 { font-size: 1rem; }
                    p { margin-bottom: 12px; }
                    ul, ol { padding-left: 20px; margin-bottom: 14px; }
                    li { margin-bottom: 4px; }
                    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
                    pre { background: #f0f0f0; padding: 14px; border-radius: 8px; overflow-x: auto; }
                    blockquote { border-left: 3px solid #3d5a80; padding: 10px 14px; background: #f7f7f7; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <h1 style="border-bottom: 2px solid #3d5a80; padding-bottom: 10px;">${(videoTitle || '').replace(/</g, '&lt;')}</h1>
                ${html}
            </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => printWindow.print(), 250)
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

    const currentNote = notesCache[videoId]

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
                    {CHAT_FEATURE_ENABLED ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {['notes', 'chat'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => onTabChange(t)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '7px', border: 'none',
                                        background: activeTab === t ? '#3d5a80' : 'transparent',
                                        color: activeTab === t ? '#fff' : c.secondary,
                                        fontWeight: 600, fontSize: '0.78rem',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {t === 'notes' ? '📝 AI Notes' : '💬 Chat'}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            padding: '6px 14px', borderRadius: '7px',
                            background: '#3d5a80', color: '#fff',
                            fontWeight: 600, fontSize: '0.78rem',
                        }}>
                            📝 AI Notes
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '6px' }}>
                        {activeTab === 'notes' && currentNote && !notesLoading && !isEditing && (
                            <>
                                <button
                                    onClick={startEditing}
                                    title="Edit notes"
                                    style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: '7px', padding: '5px 9px', cursor: 'pointer', fontSize: '13px', color: c.secondary, fontFamily: 'inherit' }}
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={printNotes}
                                    title="Print / Save as PDF"
                                    style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: '7px', padding: '5px 9px', cursor: 'pointer', fontSize: '13px', color: c.secondary, fontFamily: 'inherit' }}
                                >
                                    🖨️
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: '7px', padding: '5px 9px', cursor: 'pointer', fontSize: '13px', color: c.secondary, fontFamily: 'inherit' }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
                {videoTitle && (
                    <p style={{ fontSize: '0.75rem', color: c.metaText, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {videoTitle}
                    </p>
                )}
            </div>

            {/* ── Notes tab ── */}
            {activeTab === 'notes' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
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
                            <button onClick={generateNotes} style={{ padding: '8px 20px', borderRadius: '999px', background: '#3d5a80', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Retry
                            </button>
                        </div>
                    )}

                    {!notesLoading && !notesError && isEditing && (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                            <textarea
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                style={{
                                    flex: 1, minHeight: '400px', resize: 'vertical',
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    fontSize: '0.8rem', lineHeight: 1.6,
                                    padding: '12px', borderRadius: '8px',
                                    border: `1px solid ${c.border}`,
                                    background: c.inputBg, color: c.text,
                                    outline: 'none',
                                }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={cancelEditing}
                                    disabled={saving}
                                    style={{ padding: '8px 16px', borderRadius: '999px', border: `1px solid ${c.border}`, background: 'transparent', color: c.text, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveEdit}
                                    disabled={saving}
                                    style={{ padding: '8px 16px', borderRadius: '999px', border: 'none', background: '#3d5a80', color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    )}

                    {!notesLoading && !notesError && !isEditing && currentNote && (
                        <div
                            className="ai-notes-content"
                            style={{ fontSize: '0.85rem', color: c.text, lineHeight: 1.75 }}
                            dangerouslySetInnerHTML={{ __html: currentNote.html }}
                        />
                    )}
                </div>
            )}

            {/* ── Chat tab (flagged off — see CHAT_FEATURE_ENABLED) ── */}
            {CHAT_FEATURE_ENABLED && activeTab === 'chat' && (
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