'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

const BACKEND_URL = 'https://telegrambot-backend-37gb.onrender.com'

interface User {
  id: string
  telegramId: string
  username: string | null
  firstName: string | null
  walletBalance: number
  isActive: boolean
  status: string
  referralsGiven: any[]
  createdAt: string
}

interface Announcement {
  id: string
  title: string
  body: string
  type: 'info' | 'success' | 'warning'
  createdAt: string
}

const MOCK_ANNOUNCEMENTS: Announcement[] = []

type Tab = 'overview' | 'users' | 'leaderboard' | 'content' | 'fraud'

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [search, setSearch] = useState('')
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS)
  const [newAnn, setNewAnn] = useState({ title: '', body: '', type: 'info' as Announcement['type'] })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/users/all`)
      setUsers(res.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPoints = users.reduce((s, u) => s + (u.walletBalance || 0), 0)
  const activeUsers = users.filter(u => u.isActive).length
  const totalReferrals = users.reduce((s, u) => s + (u.referralsGiven?.length || 0), 0)

  const filtered = users.filter(u =>
    (u.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.telegramId || '').includes(search)
  )

  const handleCreateAnn = () => {
    if (!newAnn.title.trim() || !newAnn.body.trim()) return
    setSaving(true)
    setTimeout(() => {
      setAnnouncements(prev => [{
        id: Date.now().toString(),
        ...newAnn,
        createdAt: new Date().toISOString()
      }, ...prev])
      setNewAnn({ title: '', body: '', type: 'info' })
      setSaving(false)
    }, 600)
  }

  const handleDeleteAnn = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview',   label: 'Overview',    icon: '📊' },
    { key: 'users',      label: 'Users',        icon: '👥' },
    { key: 'leaderboard',label: 'Leaderboard',  icon: '🏆' },
    { key: 'content',    label: 'Content',      icon: '📝' },
    { key: 'fraud',      label: 'Fraud',        icon: '🛡️' },
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: '#a0a0c0' }}>Loading Dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#e0e0f0', fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ background: 'rgba(20,20,40,0.95)', borderBottom: '1px solid rgba(99,102,241,0.3)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏆</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px' }}>DejenRewards</div>
              <div style={{ fontSize: 11, color: '#7070a0' }}>Admin Dashboard</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 13, color: '#a5b4fc' }}>
              🟢 Live
            </div>
            <button onClick={fetchData} style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', cursor: 'pointer', fontSize: 13 }}>
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ background: 'rgba(15,15,26,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 4 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                color: activeTab === t.key ? '#a5b4fc' : '#60607a',
                borderBottom: activeTab === t.key ? '2px solid #6366f1' : '2px solid transparent',
                transition: 'all 0.2s',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 32 }}>
              {[
                { icon: '👥', label: 'Total Users',    value: users.length,    color: '#6366f1' },
                { icon: '✅', label: 'Active Users',   value: activeUsers,     color: '#22c55e' },
                { icon: '💰', label: 'Points Issued',  value: totalPoints,     color: '#f59e0b' },
                { icon: '🔗', label: 'Total Referrals',value: totalReferrals,  color: '#8b5cf6' },
              ].map(card => (
                <div key={card.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#7070a0', marginBottom: 8 }}>{card.label}</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{card.value.toLocaleString()}</div>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: card.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{card.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Users Table */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Recent Users</span>
                <span style={{ fontSize: 13, color: '#7070a0' }}>Last 10 registered</span>
              </div>
              <UserTable users={users.slice(0, 10)} />
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {activeTab === 'users' && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>All Users ({users.length})</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name, username or ID..."
                style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e0e0f0', width: 280, outline: 'none', fontSize: 14 }} />
            </div>
            <UserTable users={filtered} showId />
          </div>
        )}

        {/* ── Leaderboard ── */}
        {activeTab === 'leaderboard' && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>🏆 Global Leaderboard</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
                    {['Rank','User','Points','Active Refs','Status'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, color: '#7070a0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...users].sort((a, b) => b.walletBalance - a.walletBalance).map((user, i) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontWeight: 700, fontSize: 18, color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#fb923c' : '#6060a0' }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 600 }}>{user.firstName || user.username || 'Unknown'}</div>
                        <div style={{ fontSize: 12, color: '#60607a' }}>@{user.username || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#fbbf24', fontSize: 16 }}>{user.walletBalance}</td>
                      <td style={{ padding: '14px 20px', color: '#a0a0c0' }}>{user.referralsGiven?.filter((r: any) => r.activeStatus).length || 0}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: user.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)', color: user.isActive ? '#4ade80' : '#f87171' }}>
                          {user.isActive ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Content Management ── */}
        {activeTab === 'content' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
            {/* Create Form */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 24 }}>📝 Create Announcement</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: '#7070a0', display: 'block', marginBottom: 6 }}>Title</label>
                <input value={newAnn.title} onChange={e => setNewAnn(p => ({ ...p, title: e.target.value }))}
                  placeholder="Announcement title..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e0e0f0', outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: '#7070a0', display: 'block', marginBottom: 6 }}>Message</label>
                <textarea value={newAnn.body} onChange={e => setNewAnn(p => ({ ...p, body: e.target.value }))}
                  placeholder="Write your announcement here..." rows={5}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e0e0f0', outline: 'none', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, color: '#7070a0', display: 'block', marginBottom: 6 }}>Type</label>
                <select value={newAnn.type} onChange={e => setNewAnn(p => ({ ...p, type: e.target.value as any }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(30,30,60,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#e0e0f0', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}>
                  <option value="info">ℹ️ Info</option>
                  <option value="success">✅ Success</option>
                  <option value="warning">⚠️ Warning</option>
                </select>
              </div>
              <button onClick={handleCreateAnn} disabled={saving || !newAnn.title || !newAnn.body}
                style={{ width: '100%', padding: '12px', borderRadius: 10, background: saving ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? '⏳ Saving...' : '🚀 Publish Announcement'}
              </button>
            </div>

            {/* Announcements List */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 700, fontSize: 16 }}>
                📋 Published Announcements ({announcements.length})
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 500, overflowY: 'auto' }}>
                {announcements.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#60607a', padding: '40px 0' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
                    <div>No announcements yet. Create one!</div>
                  </div>
                )}
                {announcements.map(ann => {
                  const colors: Record<string, string> = { info: '#6366f1', success: '#22c55e', warning: '#f59e0b' }
                  const icons: Record<string, string>  = { info: 'ℹ️', success: '✅', warning: '⚠️' }
                  return (
                    <div key={ann.id} style={{ padding: 18, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors[ann.type]}44`, position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{icons[ann.type]}</span>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{ann.title}</span>
                        </div>
                        <button onClick={() => handleDeleteAnn(ann.id)}
                          style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#f87171', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                          Delete
                        </button>
                      </div>
                      <p style={{ fontSize: 14, color: '#a0a0c0', margin: 0, lineHeight: 1.6 }}>{ann.body}</p>
                      <div style={{ marginTop: 10, fontSize: 11, color: '#50507a' }}>{new Date(ann.createdAt).toLocaleString()}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Fraud ── */}
        {activeTab === 'fraud' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>🛡️ Fraud Detection</h2>
              <p style={{ color: '#a0a0c0', lineHeight: 1.7 }}>The system actively monitors for suspicious activity patterns:</p>
              <ul style={{ color: '#a0a0c0', lineHeight: 2, paddingLeft: 20, marginTop: 12 }}>
                <li>Rapid join/leave cycling (5+ in 24h)</li>
                <li>Duplicate referral attempts</li>
                <li>Suspicious referral spikes</li>
                <li>Bot-like activity patterns</li>
                <li>Self-referral attempts</li>
              </ul>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 28 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>⚠️ Suspicious Users</h2>
              <div style={{ color: '#60607a', textAlign: 'center', paddingTop: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <div>No suspicious activity detected</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Reusable Table Component ─────────────────────────────────────────────────
function UserTable({ users, showId = false }: { users: User[], showId?: boolean }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
            {['User', showId && 'Telegram ID', 'Status', 'Balance', 'Referrals', 'Joined'].filter(Boolean).map(h => (
              <th key={h as string} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, color: '#7070a0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <td style={{ padding: '14px 20px' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{user.firstName || user.username || 'Unknown'}</div>
                <div style={{ fontSize: 12, color: '#60607a' }}>@{user.username || 'N/A'}</div>
              </td>
              {showId && <td style={{ padding: '14px 20px', fontSize: 13, color: '#7070a0', fontFamily: 'monospace' }}>{user.telegramId}</td>}
              <td style={{ padding: '14px 20px' }}>
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: user.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)', color: user.isActive ? '#4ade80' : '#f87171' }}>
                  {user.isActive ? '● Active' : '○ Inactive'}
                </span>
              </td>
              <td style={{ padding: '14px 20px', fontWeight: 700, color: '#fbbf24' }}>{user.walletBalance} pts</td>
              <td style={{ padding: '14px 20px', color: '#a0a0c0' }}>{user.referralsGiven?.length || 0}</td>
              <td style={{ padding: '14px 20px', fontSize: 12, color: '#60607a' }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#60607a' }}>No users found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
