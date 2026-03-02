import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import GroupChat from './GroupChat'

const API = 'http://localhost:3001/api'
const SOCKET_URL = 'http://localhost:3001'

function Groups({ user, onUnreadChange }) {
  const [groups, setGroups] = useState([])
  const [friends, setFriends] = useState([])
  const [activeGroup, setActiveGroup] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unreadCounts, setUnreadCounts] = useState({})
  const socketRef = useRef(null)
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    socketRef.current = io(SOCKET_URL)
    socketRef.current.emit('register', user.accountCode)

    socketRef.current.on('group_message', (msg) => {
      if (msg.account_code !== user.accountCode) {
        setUnreadCounts(prev => {
          const updated = { ...prev, [msg.group_id]: (prev[msg.group_id] || 0) + 1 }
          const total = Object.values(updated).reduce((a, b) => a + b, 0)
          if (onUnreadChange) onUnreadChange(total)
          return updated
        })
      }
    })

    loadGroups()
    loadFriends()

    return () => socketRef.current?.disconnect()
  }, [])

  const loadGroups = async () => {
    try {
      const res = await axios.get(`${API}/groups/mine`, { headers })
      setGroups(res.data)
      countUnread(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const countUnread = async (groupsList) => {
    const counts = {}
    let total = 0
    for (const g of groupsList) {
      const lastSeen = localStorage.getItem(`group_seen_${g.id}`)
      try {
        const res = await axios.get(`${API}/groups/${g.id}/messages`, { headers })
        const unread = lastSeen
          ? res.data.filter(m => m.account_code !== user.accountCode && new Date(m.created_at) > new Date(lastSeen)).length
          : res.data.filter(m => m.account_code !== user.accountCode).length
        counts[g.id] = unread
        total += unread
      } catch {
        counts[g.id] = 0
      }
    }
    setUnreadCounts(counts)
    if (onUnreadChange) onUnreadChange(total)
  }

  const loadFriends = async () => {
    try {
      const res = await axios.get(`${API}/friends/list`, { headers })
      setFriends(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const openGroup = (g) => {
    // Mark as seen
    localStorage.setItem(`group_seen_${g.id}`, new Date().toISOString())
    setActiveGroup(g)
    setUnreadCounts(prev => {
      const updated = { ...prev, [g.id]: 0 }
      const total = Object.values(updated).reduce((a, b) => a + b, 0)
      if (onUnreadChange) onUnreadChange(total)
      return updated
    })
  }

  const createGroup = async () => {
    setError('')
    if (!groupName.trim()) { setError('Please enter a group name'); return }
    setLoading(true)
    try {
      await axios.post(`${API}/groups/create`, {
        name: groupName.trim(),
        memberCodes: selectedMembers
      }, { headers })
      setGroupName('')
      setSelectedMembers([])
      setShowCreate(false)
      loadGroups()
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
    setLoading(false)
  }

  const toggleMember = (code) => {
    setSelectedMembers(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  if (activeGroup) {
    return (
      <GroupChat
        user={user}
        group={activeGroup}
        onBack={() => {
          localStorage.setItem(`group_seen_${activeGroup.id}`, new Date().toISOString())
          setActiveGroup(null)
          loadGroups()
        }}
        onLeave={() => {
          setActiveGroup(null)
          loadGroups()
        }}
      />
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid #222',
        background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Group Chats</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            background: '#ffffff', color: '#000', border: 'none',
            padding: '0.4rem 0.75rem', borderRadius: '6px',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem'
          }}
        >
          + New Group
        </button>
      </div>

      {showCreate && (
        <div style={{ padding: '1rem', borderBottom: '1px solid #222', background: '#0f0f0f' }}>
          {error && (
            <div style={{
              background: '#2a0000', border: '1px solid #ff4444',
              borderRadius: '8px', padding: '0.6rem', marginBottom: '0.75rem',
              color: '#ff4444', fontSize: '0.85rem'
            }}>{error}</div>
          )}
          <input
            type="text"
            placeholder="Group name..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={50}
            style={{
              width: '100%', padding: '0.75rem', marginBottom: '0.75rem',
              background: '#1a1a1a', border: '1px solid #333',
              borderRadius: '8px', color: '#fff', fontSize: '0.95rem'
            }}
          />
          {friends.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Add friends:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {friends.map(f => (
                  <button
                    key={f.friend_account_code}
                    onClick={() => toggleMember(f.friend_account_code)}
                    style={{
                      background: selectedMembers.includes(f.friend_account_code) ? '#ffffff' : '#1a1a1a',
                      color: selectedMembers.includes(f.friend_account_code) ? '#000' : '#ccc',
                      border: '1px solid #333', padding: '0.4rem 0.75rem',
                      borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem'
                    }}
                  >
                    {selectedMembers.includes(f.friend_account_code) ? '✓ ' : ''}{f.display_name || 'Ghost'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={createGroup} disabled={loading} style={{
              flex: 1, background: '#ffffff', color: '#000', border: 'none',
              padding: '0.75rem', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
            }}>
              {loading ? 'Creating...' : 'Create Group'}
            </button>
            <button onClick={() => { setShowCreate(false); setError('') }} style={{
              background: 'transparent', color: '#888',
              border: '1px solid #333', padding: '0.75rem 1rem',
              borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'
            }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {groups.length === 0 && (
          <div style={{ color: '#555', textAlign: 'center', marginTop: '3rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
            <p>No groups yet.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Create a group to get started!</p>
          </div>
        )}
        {groups.map((g) => {
          const unread = unreadCounts[g.id] || 0
          return (
            <div
              key={g.id}
              onClick={() => openGroup(g)}
              style={{
                background: '#1a1a1a',
                border: `1px solid ${unread > 0 ? '#ffffff33' : '#222'}`,
                borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#444'}
              onMouseLeave={e => e.currentTarget.style.borderColor = unread > 0 ? '#ffffff33' : '#222'}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: '#333', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.2rem'
                }}>👥</div>
                {unread > 0 && (
                  <div style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: '#ff4444', color: '#fff', borderRadius: '50%',
                    minWidth: '18px', height: '18px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 'bold', padding: '0 3px'
                  }}>
                    {unread > 99 ? '99+' : unread}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: unread > 0 ? 'bold' : 'normal',
                  color: unread > 0 ? '#fff' : '#ccc', marginBottom: '0.2rem'
                }}>
                  {g.name}
                </div>
                <div style={{ color: '#555', fontSize: '0.8rem' }}>
                  {g.member_count} members {g.is_admin && '· Admin'}
                </div>
              </div>
              {unread > 0 && (
                <div style={{
                  background: '#ff4444', color: '#fff',
                  borderRadius: '12px', padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0
                }}>
                  {unread} new
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Groups
