import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:3001/api'

function Friends({ user }) {
  const [tab, setTab] = useState('friends')
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [friendCode, setFriendCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    loadFriends()
    loadRequests()
  }, [])

  const loadFriends = async () => {
    try {
      const res = await axios.get(`${API}/friends/list`, { headers })
      setFriends(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadRequests = async () => {
    try {
      const res = await axios.get(`${API}/friends/requests`, { headers })
      setRequests(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const sendRequest = async () => {
    setError('')
    setMessage('')
    if (!friendCode.trim()) return
    setLoading(true)
    try {
      const res = await axios.post(`${API}/friends/request`, { friendCode }, { headers })
      setMessage(res.data.message)
      setFriendCode('')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
    setLoading(false)
  }

  const respond = async (requestId, action) => {
    try {
      await axios.post(`${API}/friends/respond`, { requestId, action }, { headers })
      loadRequests()
      loadFriends()
    } catch (err) {
      console.error(err)
    }
  }

  const block = async (accountCode) => {
    if (!confirm('Are you sure you want to block this user?')) return
    try {
      await axios.post(`${API}/friends/block`, { accountCode }, { headers })
      loadFriends()
    } catch (err) {
      console.error(err)
    }
  }

  const report = async (accountCode) => {
    const reason = prompt('Reason for reporting (optional):')
    if (reason === null) return
    try {
      await axios.post(`${API}/friends/report`, { accountCode, reason }, { headers })
      alert('Report submitted successfully')
    } catch (err) {
      console.error(err)
    }
  }

  const tabStyle = (t) => ({
    flex: 1,
    padding: '0.75rem',
    background: tab === t ? '#ffffff22' : 'transparent',
    border: 'none',
    borderBottom: tab === t ? '2px solid #fff' : '2px solid transparent',
    color: tab === t ? '#fff' : '#666',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: tab === t ? 'bold' : 'normal'
  })

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #222', background: '#111' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Friends</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #222', background: '#111' }}>
        <button style={tabStyle('friends')} onClick={() => setTab('friends')}>
          Friends {friends.length > 0 && `(${friends.length})`}
        </button>
        <button style={tabStyle('requests')} onClick={() => setTab('requests')}>
          Requests {requests.length > 0 && `(${requests.length})`}
        </button>
        <button style={tabStyle('add')} onClick={() => setTab('add')}>
          + Add
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>

        {/* Friends List */}
        {tab === 'friends' && (
          <div>
            {friends.length === 0 && (
              <div style={{ color: '#555', textAlign: 'center', marginTop: '3rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                <p>No friends yet.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Go to "Add" tab to add friends!</p>
              </div>
            )}
            {friends.map((f) => (
              <div key={f.friend_account_code} style={{
                background: '#1a1a1a',
                border: '1px solid #222',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{f.display_name || 'Ghost'}</div>
                  <div style={{ color: '#555', fontSize: '0.8rem', fontFamily: 'monospace' }}>{f.friend_code}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => block(f.friend_account_code)}
                    style={{
                      background: 'transparent', border: '1px solid #333',
                      color: '#888', padding: '0.4rem 0.75rem',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem'
                    }}
                  >
                    Block
                  </button>
                  <button
                    onClick={() => report(f.friend_account_code)}
                    style={{
                      background: 'transparent', border: '1px solid #ff444433',
                      color: '#ff4444', padding: '0.4rem 0.75rem',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem'
                    }}
                  >
                    Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friend Requests */}
        {tab === 'requests' && (
          <div>
            {requests.length === 0 && (
              <div style={{ color: '#555', textAlign: 'center', marginTop: '3rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <p>No pending friend requests</p>
              </div>
            )}
            {requests.map((r) => (
              <div key={r.id} style={{
                background: '#1a1a1a',
                border: '1px solid #222',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{r.display_name || 'Ghost'}</div>
                  <div style={{ color: '#555', fontSize: '0.8rem', fontFamily: 'monospace' }}>{r.friend_code}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => respond(r.id, 'accept')}
                    style={{
                      flex: 1, background: '#ffffff', color: '#000',
                      border: 'none', padding: '0.6rem',
                      borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respond(r.id, 'reject')}
                    style={{
                      flex: 1, background: 'transparent', color: '#888',
                      border: '1px solid #333', padding: '0.6rem',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Friend */}
        {tab === 'add' && (
          <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '1rem' }}>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Enter your friend's GC- code to send them a friend request.
            </p>

            {message && (
              <div style={{
                background: '#002a00', border: '1px solid #00ff88',
                borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem',
                color: '#00ff88', fontSize: '0.9rem'
              }}>
                {message}
              </div>
            )}

            {error && (
              <div style={{
                background: '#2a0000', border: '1px solid #ff4444',
                borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem',
                color: '#ff4444', fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Your friend code (share this):</p>
              <div style={{
                background: '#1a1a1a', border: '1px solid #333',
                borderRadius: '8px', padding: '0.75rem',
                fontFamily: 'monospace', color: '#00ff88', fontSize: '1rem',
                letterSpacing: '0.1em'
              }}>
                {user?.friendCode}
              </div>
            </div>

            <input
              type="text"
              placeholder="Enter friend code (GC-XXXXXXXX)"
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '0.9rem',
                marginBottom: '1rem',
                background: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                fontFamily: 'monospace',
                letterSpacing: '0.05em'
              }}
            />
            <button
              onClick={sendRequest}
              disabled={loading || !friendCode.trim()}
              style={{
                width: '100%',
                background: friendCode.trim() ? '#ffffff' : '#222',
                color: friendCode.trim() ? '#000' : '#555',
                border: 'none',
                padding: '1rem',
                fontSize: '1rem',
                borderRadius: '8px',
                cursor: friendCode.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'SENDING...' : 'SEND FRIEND REQUEST'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Friends
