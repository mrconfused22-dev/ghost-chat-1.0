import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:3001/api'

function AdminPanel({ user, onClose }) {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    loadStats()
    loadReports()
    loadUsers()
  }, [])

  const loadStats = async () => {
    try {
      const res = await axios.get(`${API}/admin/stats`, { headers })
      setStats(res.data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const loadReports = async () => {
    try {
      const res = await axios.get(`${API}/admin/reports`, { headers })
      setReports(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await axios.get(`${API}/admin/users`, { headers })
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const banUser = async (accountCode) => {
    if (!confirm('Ban this account? They will not be able to log in.')) return
    try {
      await axios.post(`${API}/admin/ban`, { accountCode }, { headers })
      loadUsers()
      loadReports()
      loadStats()
    } catch (err) {
      alert(err.response?.data?.error || 'Error')
    }
  }

  const unbanUser = async (accountCode) => {
    try {
      await axios.post(`${API}/admin/unban`, { accountCode }, { headers })
      loadUsers()
      loadStats()
    } catch (err) {
      alert(err.response?.data?.error || 'Error')
    }
  }

  const resolveReport = async (reportId) => {
    try {
      await axios.post(`${API}/admin/resolve-report`, { reportId }, { headers })
      loadReports()
      loadStats()
    } catch (err) {
      console.error(err)
    }
  }

  const pendingReports = reports.filter(r => !r.resolved)
  const resolvedReports = reports.filter(r => r.resolved)

  const tabStyle = (t) => ({
    padding: '0.6rem 1rem',
    background: tab === t ? '#ffffff22' : 'transparent',
    border: 'none',
    borderBottom: tab === t ? '2px solid #fff' : '2px solid transparent',
    color: tab === t ? '#fff' : '#666',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: tab === t ? 'bold' : 'normal'
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0a0a',
      zIndex: 1000, display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid #222',
        background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.3rem' }}>🛡️</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Admin Panel</h2>
          {pendingReports.length > 0 && (
            <div style={{
              background: '#ff4444', color: '#fff', borderRadius: '12px',
              padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold'
            }}>
              {pendingReports.length} pending
            </div>
          )}
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: '1px solid #333',
          color: '#888', padding: '0.4rem 0.75rem',
          borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem'
        }}>
          ← Back
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #222', background: '#111' }}>
        <button style={tabStyle('overview')} onClick={() => setTab('overview')}>Overview</button>
        <button style={tabStyle('reports')} onClick={() => setTab('reports')}>
          Reports {pendingReports.length > 0 && `(${pendingReports.length})`}
        </button>
        <button style={tabStyle('users')} onClick={() => setTab('users')}>Users</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

        {/* Overview */}
        {tab === 'overview' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem', color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Dashboard Stats
            </h3>
            {loading ? (
              <p style={{ color: '#555' }}>Loading...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <StatCard label="Total Users" value={stats?.totalUsers || 0} icon="👤" />
                <StatCard label="Pending Reports" value={stats?.pendingReports || 0} icon="🚩" danger={stats?.pendingReports > 0} />
                <StatCard label="Banned Accounts" value={stats?.bannedAccounts || 0} icon="🚫" />
                <StatCard label="Active World Messages" value={stats?.activeWorldMessages || 0} icon="🌍" />
                <StatCard label="Total Groups" value={stats?.totalGroups || 0} icon="👥" />
              </div>
            )}
          </div>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <div>
            {pendingReports.length === 0 && (
              <div style={{ color: '#555', textAlign: 'center', marginTop: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <p>No pending reports</p>
              </div>
            )}
            {pendingReports.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#ff4444', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  Pending Reports ({pendingReports.length})
                </h3>
                {pendingReports.map(r => (
                  <ReportCard
                    key={r.id}
                    report={r}
                    onBan={banUser}
                    onResolve={resolveReport}
                  />
                ))}
              </div>
            )}
            {resolvedReports.length > 0 && (
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#555', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  Resolved ({resolvedReports.length})
                </h3>
                {resolvedReports.map(r => (
                  <ReportCard key={r.id} report={r} resolved />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              All Users ({users.length})
            </h3>
            {users.map(u => (
              <div key={u.account_code} style={{
                background: u.is_banned ? '#1a0000' : '#1a1a1a',
                border: `1px solid ${u.is_banned ? '#ff444433' : '#222'}`,
                borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 'bold' }}>{u.display_name || 'No name'}</span>
                    {u.is_admin && <span style={{ background: '#333', color: '#888', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>Admin</span>}
                    {u.is_banned && <span style={{ background: '#ff444422', color: '#ff4444', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>Banned</span>}
                  </div>
                  <div style={{ color: '#555', fontSize: '0.8rem', fontFamily: 'monospace' }}>{u.friend_code}</div>
                  <div style={{ color: '#444', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
                {!u.is_admin && (
                  <button
                    onClick={() => u.is_banned ? unbanUser(u.account_code) : banUser(u.account_code)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${u.is_banned ? '#00ff8833' : '#ff444433'}`,
                      color: u.is_banned ? '#00ff88' : '#ff4444',
                      padding: '0.4rem 0.75rem', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '0.8rem'
                    }}
                  >
                    {u.is_banned ? 'Unban' : 'Ban'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, danger }) {
  return (
    <div style={{
      background: danger ? '#1a0000' : '#1a1a1a',
      border: `1px solid ${danger ? '#ff444433' : '#222'}`,
      borderRadius: '12px', padding: '1.25rem', textAlign: 'center'
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: danger ? '#ff4444' : '#fff', marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ color: '#555', fontSize: '0.8rem' }}>{label}</div>
    </div>
  )
}

function ReportCard({ report, onBan, onResolve, resolved }) {
  return (
    <div style={{
      background: resolved ? '#111' : '#1a1a1a',
      border: `1px solid ${resolved ? '#222' : '#ff444422'}`,
      borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem',
      opacity: resolved ? 0.6 : 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div>
          <span style={{ color: '#888', fontSize: '0.8rem' }}>Reported: </span>
          <span style={{ fontWeight: 'bold' }}>{report.reported_name || 'Unknown'}</span>
          {report.is_banned && <span style={{ color: '#ff4444', fontSize: '0.75rem', marginLeft: '0.5rem' }}>(Banned)</span>}
        </div>
        <span style={{ color: '#444', fontSize: '0.75rem' }}>
          {new Date(report.created_at).toLocaleDateString()}
        </span>
      </div>
      <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        <span style={{ color: '#555' }}>Reporter: </span>{report.reporter_name || 'Unknown'}
      </div>
      <div style={{
        background: '#0a0a0a', borderRadius: '6px', padding: '0.5rem 0.75rem',
        color: '#ccc', fontSize: '0.85rem', marginBottom: '0.75rem'
      }}>
        {report.reason || 'No reason provided'}
      </div>
      {!resolved && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!report.is_banned && (
            <button
              onClick={() => onBan(report.reported_code)}
              style={{
                background: '#ff444422', border: '1px solid #ff444433',
                color: '#ff4444', padding: '0.4rem 0.75rem',
                borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem'
              }}
            >
              Ban User
            </button>
          )}
          <button
            onClick={() => onResolve(report.id)}
            style={{
              background: 'transparent', border: '1px solid #333',
              color: '#888', padding: '0.4rem 0.75rem',
              borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem'
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
