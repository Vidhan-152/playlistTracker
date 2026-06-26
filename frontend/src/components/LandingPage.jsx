// src/components/LandingPage.jsx
import { useState, useEffect } from 'react'

const CORAL  = '#ee6c4d'
const BLUE   = '#3d5a80'
const NAVY   = '#293241'

export default function LandingPage({ colors, theme, onToggleTheme, onGetStarted }) {
    const c = colors
    const [scrolled, setScrolled]           = useState(false)
    const [hoveredFeature, setHoveredFeature] = useState(null)
    const [openFaq, setOpenFaq]             = useState(null)

    useEffect(() => {
        const el = document.getElementById('lp-scroll')
        if (!el) return
        const fn = () => setScrolled(el.scrollTop > 40)
        el.addEventListener('scroll', fn)
        return () => el.removeEventListener('scroll', fn)
    }, [])

    const features = [
        { icon: '📚', title: 'Playlist Tracking',   desc: 'Track progress across every lecture series. Know exactly where you left off.' },
        { icon: '📝', title: 'AI Notes',            desc: 'Generate structured study notes from any YouTube lecture in seconds.' },
        { icon: '🤖', title: 'AI Chat',             desc: 'Ask questions about the lecture. Get answers grounded in the actual transcript.' },
        { icon: '🔥', title: 'Learning Streak',     desc: 'Build daily consistency with streak tracking and milestone badges.' },
        { icon: '📊', title: 'Progress Analytics',  desc: 'Visualize completed videos, watch time, and learning velocity over time.' },
        { icon: '🎯', title: 'Smart Revision',      desc: 'Auto-generated revision cards before exams, powered by your own notes.' },
    ]

    const faqs = [
        { q: 'How does AI Notes work?',        a: 'TrackTube extracts the transcript from any YouTube video, sends it to a Groq Llama model, and generates structured notes covering key concepts, formulae, and revision points — typically in under 3 seconds.' },
        { q: 'Which playlists are supported?', a: 'Any public YouTube playlist. Paste the URL and TrackTube syncs the full video list automatically.' },
        { q: 'Can I use it on mobile?',        a: 'Yes. The interface is fully responsive and feels like a native app on phones and tablets.' },
        { q: 'Is my data private?',            a: 'Your progress and notes are stored securely and are never shared. Only the video transcript is sent to the AI model during note generation.' },
        { q: 'What AI model is used?',         a: 'TrackTube uses Groq\'s Llama 3.3 70B served via a FastAPI microservice for ultra-low-latency note generation.' },
    ]

    const aiSteps = [
        { icon: '🎬', label: 'YouTube Playlist' },
        { icon: '📄', label: 'Transcript' },
        { icon: '🧠', label: 'AI Processing' },
        { icon: '📝', label: 'Study Notes' },
        { icon: '💬', label: 'AI Chat' },
        { icon: '🎯', label: 'Revision' },
    ]

    return (
        <div
            id="lp-scroll"
            style={{
                height: '100vh', overflowY: 'auto',
                background: c.bg, color: c.text,
                fontFamily: "'Inter', system-ui, sans-serif",
                scrollBehavior: 'smooth',
            }}
        >
            {/* ── Nav ── */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100,
                padding: '0 48px', height: '60px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: scrolled
                    ? (theme === 'light' ? 'rgba(240,250,251,0.92)' : 'rgba(13,17,23,0.92)')
                    : 'transparent',
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                borderBottom: scrolled ? `1px solid ${c.border}` : 'none',
                transition: 'all 0.3s ease',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={logo}>▶</div>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: c.text, letterSpacing: '-0.02em' }}>TrackTube</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={onToggleTheme} style={themeBtn(c)}>
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button onClick={onGetStarted} style={primaryBtn}>
                        Get started →
                    </button>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section style={{ padding: '88px 48px 72px', maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: c.chip, color: c.chipText, borderRadius: '999px', padding: '5px 14px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '24px', border: `1px solid ${c.borderStrong}` }}>
                        ✨ AI-powered learning — now in beta
                    </div>
                    <h1 style={{ fontSize: '3.2rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em', margin: '0 0 20px', color: c.text }}>
                        Your AI learning companion for YouTube.
                    </h1>
                    <p style={{ fontSize: '1.05rem', color: c.secondary, lineHeight: 1.75, margin: '0 0 36px', maxWidth: '460px' }}>
                        Track playlists, generate study notes, and chat with your lectures. Built for students who take learning seriously.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={onGetStarted} style={{ ...primaryBtn, padding: '13px 32px', fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(61,90,128,0.32)' }}>
                            Get started free
                        </button>
                        <button style={{ padding: '13px 26px', borderRadius: '999px', background: 'none', color: c.text, border: `1px solid ${c.borderStrong}`, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Watch demo
                        </button>
                    </div>
                    <p style={{ marginTop: '14px', fontSize: '0.75rem', color: c.mutedText }}>No credit card required · Free forever for students</p>
                </div>

                {/* Hero dashboard mockup */}
                <div style={{ position: 'relative' }}>
                    <div style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${c.borderStrong}`, boxShadow: c.cardHoverShadow, background: c.card }}>
                        {/* Window chrome */}
                        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {['#ff5f57','#ffc12c','#28cd41'].map(clr => (
                                <div key={clr} style={{ width: '10px', height: '10px', borderRadius: '50%', background: clr }} />
                            ))}
                            <span style={{ marginLeft: '8px', fontSize: '10px', color: c.mutedText, fontWeight: 500 }}>tracktube.app</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr' }}>
                            {/* Mini sidebar */}
                            <div style={{ borderRight: `1px solid ${c.border}`, padding: '10px', background: c.sidebar }}>
                                <div style={{ padding: '8px 10px', background: BLUE, borderRadius: '8px', marginBottom: '4px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>CS Algorithms</div>
                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>45% done</div>
                                    <div style={{ height: '2px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px', marginTop: '4px' }}>
                                        <div style={{ height: '100%', width: '45%', background: '#fff', borderRadius: '1px' }} />
                                    </div>
                                </div>
                                {['System Design', 'DBMS Playlist', 'OS Concepts'].map(t => (
                                    <div key={t} style={{ padding: '6px 10px', borderRadius: '6px', marginBottom: '2px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 500, color: c.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</div>
                                    </div>
                                ))}
                            </div>
                            {/* Mini content */}
                            <div style={{ padding: '12px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: c.text, marginBottom: '8px' }}>CS Algorithms — Striver A2Z</div>
                                <div style={{ height: '4px', background: c.progressTrack, borderRadius: '999px', marginBottom: '8px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: '45%', background: BLUE, borderRadius: '999px' }} />
                                </div>
                                {[
                                    { t: 'Arrays & Hashing',  done: true  },
                                    { t: 'Two Pointers',      done: true  },
                                    { t: 'Binary Search',     done: false },
                                ].map((v, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 7px', borderRadius: '6px', marginBottom: '3px', background: v.done ? (theme === 'light' ? '#edfaed' : '#1a2e1a') : c.inputBg, border: `1px solid ${c.border}` }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: `1.5px solid ${v.done ? '#22c55e' : c.borderStrong}`, background: v.done ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {v.done && <span style={{ color: '#fff', fontSize: '8px' }}>✓</span>}
                                        </div>
                                        <span style={{ fontSize: '10px', color: v.done ? c.mutedText : c.text, textDecoration: v.done ? 'line-through' : 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.t}</span>
                                        <span style={{ fontSize: '9px', color: BLUE, fontWeight: 600, padding: '1px 5px', background: c.chip, borderRadius: '4px' }}>AI</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '-14px', right: '14px', background: CORAL, color: '#fff', borderRadius: '10px', padding: '8px 14px', fontSize: '11px', fontWeight: 700, boxShadow: '0 4px 16px rgba(238,108,77,0.4)', whiteSpace: 'nowrap' }}>
                        🤖 AI Notes ready in 2.3s
                    </div>
                </div>
            </section>

            {/* ── Powered by ── */}
            <section style={{ padding: '32px 48px 0', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: c.mutedText, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Powered by
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                    {['Spring Boot', 'React', 'PostgreSQL', 'Groq', 'FastAPI', 'Railway'].map(t => (
                        <div key={t} style={{ padding: '5px 16px', borderRadius: '999px', border: `1px solid ${c.borderStrong}`, fontSize: '0.78rem', fontWeight: 600, color: c.secondary, background: c.card }}>
                            {t}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features ── */}
            <section style={{ padding: '88px 48px', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '52px' }}>
                    <h2 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, margin: '0 0 12px' }}>
                        Everything you need to learn faster
                    </h2>
                    <p style={{ fontSize: '0.95rem', color: c.secondary, maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
                        Built for students who want to squeeze maximum value out of every YouTube lecture.
                    </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    {features.map((f, i) => (
                        <div
                            key={i}
                            onMouseEnter={() => setHoveredFeature(i)}
                            onMouseLeave={() => setHoveredFeature(null)}
                            style={{
                                padding: '26px 22px', borderRadius: '14px',
                                border: `1px solid ${hoveredFeature === i ? c.borderStrong : c.border}`,
                                background: hoveredFeature === i ? c.card : 'transparent',
                                boxShadow: hoveredFeature === i ? c.cardHoverShadow : 'none',
                                transition: 'all 0.2s ease',
                                transform: hoveredFeature === i ? 'translateY(-3px)' : 'none',
                                cursor: 'default',
                            }}
                        >
                            <div style={{ fontSize: '1.7rem', marginBottom: '12px' }}>{f.icon}</div>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: c.text, margin: '0 0 8px' }}>{f.title}</h3>
                            <p style={{ fontSize: '0.85rem', color: c.secondary, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── AI Flow ── */}
            <section style={{ padding: '0 48px 88px', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '44px' }}>
                    <h2 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, margin: '0 0 12px' }}>How the AI works</h2>
                    <p style={{ fontSize: '0.95rem', color: c.secondary }}>From raw YouTube video to structured study notes in seconds.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 0 }}>
                    {aiSteps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < aiSteps.length - 1 ? 1 : 'none' }}>
                            <div style={{ padding: '14px 18px', borderRadius: '12px', background: c.card, border: `1px solid ${c.borderStrong}`, textAlign: 'center', minWidth: '110px', boxShadow: c.cardShadow }}>
                                <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{step.icon}</div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: c.secondary, whiteSpace: 'nowrap' }}>{step.label}</div>
                            </div>
                            {i < aiSteps.length - 1 && (
                                <div style={{ flex: 1, height: '1px', background: c.borderStrong, margin: '0 4px', minWidth: '12px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: CORAL, margin: '-2.5px auto' }} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section style={{ padding: '0 48px 88px', maxWidth: '1100px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, textAlign: 'center', margin: '0 0 48px' }}>Students love it</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    {[
                        { name: 'Aryan M.',  role: 'CS, IIT Bombay',    text: 'TrackTube replaced my entire manual note-taking workflow. AI Notes from Striver videos are surprisingly accurate.' },
                        { name: 'Priya K.',  role: 'Final Year, NIT',   text: 'The streak system kept me consistent during placements prep. 67 days and counting.' },
                        { name: 'Rohan S.',  role: 'B.Tech, BITS',      text: 'Being able to chat with a lecture transcript is wild. I asked it to explain quicksort simply and it just worked.' },
                    ].map((t, i) => (
                        <div key={i} style={{ padding: '22px', borderRadius: '14px', background: c.card, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}>
                            <p style={{ fontSize: '0.875rem', color: c.secondary, lineHeight: 1.7, margin: '0 0 18px' }}>"{t.text}"</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.name[0]}</div>
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: c.text }}>{t.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: c.mutedText }}>{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FAQ ── */}
            <section style={{ padding: '0 48px 88px', maxWidth: '720px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, textAlign: 'center', margin: '0 0 44px' }}>Frequently asked</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {faqs.map((f, i) => (
                        <div
                            key={i}
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            style={{ borderRadius: '12px', border: `1px solid ${openFaq === i ? c.borderStrong : c.border}`, background: c.card, cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.2s' }}
                        >
                            <div style={{ padding: '15px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: c.text }}>{f.q}</span>
                                <span style={{ fontSize: '1.1rem', color: c.mutedText, flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                            </div>
                            {openFaq === i && (
                                <div style={{ padding: '0 18px 16px', fontSize: '0.85rem', color: c.secondary, lineHeight: 1.7 }}>{f.a}</div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section style={{ padding: '0 48px 88px', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ borderRadius: '24px', padding: '64px 48px', textAlign: 'center', background: BLUE, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(238,108,77,0.14)' }} />
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.03em', position: 'relative' }}>
                        Start learning smarter today
                    </h2>
                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.72)', margin: '0 auto 28px', maxWidth: '400px', lineHeight: 1.65, position: 'relative' }}>
                        Paste a YouTube playlist. TrackTube does the rest.
                    </p>
                    <button onClick={onGetStarted} style={{ padding: '13px 36px', borderRadius: '999px', background: '#fff', color: BLUE, border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
                        Get started free →
                    </button>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{ padding: '32px 48px', borderTop: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={logo}>▶</div>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: c.text }}>TrackTube</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: c.mutedText, margin: 0 }}>Built by Vidhan · 2026</p>
            </footer>
        </div>
    )
}

// ── Micro-styles ─────────────────────────────────────────────────────────────

const logo = {
    width: '26px', height: '26px', borderRadius: '7px',
    background: '#3d5a80', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: 700,
}

const primaryBtn = {
    padding: '9px 22px', borderRadius: '999px',
    background: '#3d5a80', color: '#fff',
    border: 'none', fontWeight: 600, fontSize: '0.875rem',
    cursor: 'pointer', fontFamily: 'inherit',
}

const themeBtn = (c) => ({
    background: 'none', border: `1px solid ${c.border}`,
    borderRadius: '8px', padding: '6px 10px',
    cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
})