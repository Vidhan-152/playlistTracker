import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from './components/Sidebar'
import PlaylistDetail from './components/PlaylistDetail'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)

  useEffect(() => {
    axios.get('/api/auth/me', { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false))
  }, [])

  if (loading) return (
      <div style={s.center}>
        <div style={s.spinner} />
      </div>
  )

  if (!user) return (
      <div style={s.center}>
        <div style={s.loginCard}>
          <div style={s.loginLogo}>📚</div>
          <h1 style={s.loginTitle}>Playlist Tracker</h1>
          <p style={s.loginSub}>Your personal YouTube learning dashboard</p>
          <a href="/oauth2/authorization/google" style={s.loginBtn}>
            Sign in with Google
          </a>
        </div>
      </div>
  )

  return (
      <div style={s.layout}>
        <Sidebar
            user={user}
            selectedPlaylistId={selectedPlaylistId}
            onSelectPlaylist={setSelectedPlaylistId}
        />
        <main style={s.main}>
          {selectedPlaylistId
              ? <PlaylistDetail playlistId={selectedPlaylistId} onDeleted={() => setSelectedPlaylistId(null)} />
              : <Empty />
          }
        </main>
      </div>
  )
}

function Empty() {
  return (
      <div style={s.empty}>
        <div style={s.emptyIcon}>🎬</div>
        <p style={s.emptyText}>Select a playlist from the sidebar to get started</p>
      </div>
  )
}

const s = {
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#e0fbfc' },
  spinner: { width: '36px', height: '36px', border: '3px solid #98c1d9', borderTop: '3px solid #3d5a80', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loginCard: { background: '#fff', borderRadius: '16px', padding: '56px 64px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', boxShadow: '0 4px 24px rgba(61,90,128,0.1)' },
  loginLogo: { fontSize: '3rem' },
  loginTitle: { fontSize: '1.8rem', fontWeight: 700, color: '#293241' },
  loginSub: { color: '#3d5a80', fontSize: '0.95rem' },
  loginBtn: { marginTop: '12px', padding: '12px 32px', borderRadius: '999px', background: '#3d5a80', color: '#fff', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none', transition: 'background 0.2s' },
  layout: { display: 'flex', height: '100vh', overflow: 'hidden' },
  main: { flex: 1, overflowY: 'auto', padding: '32px', background: '#e0fbfc' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px', animation: 'fadeIn 0.4s ease' },
  emptyIcon: { fontSize: '3rem' },
  emptyText: { color: '#3d5a80', fontSize: '1rem', fontWeight: 500 },
}