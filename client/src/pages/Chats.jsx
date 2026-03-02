import { useState, useEffect } from 'react'
import axios from 'axios'
import PrivateChat from './PrivateChat'

const API = 'http://localhost:3001/api'

function Chats({ user, newMessageFrom = {}, onOpenChat }) {
  const [friends, setFriends] = useState([])
  const [activeFriend, setActiveFriend] = useState(null)
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    axios.get(`${API}/friends/list`, { headers })
      .then(res => setFriends(res.data))
      .catch(console.error)
  }, [])

  const openChat = (friend) => {
    setActiveFriend(friend)
    if (onOpenChat) onOpenChat(friend.friend_account_code)
  }

  if (activeFriend) {
    return (
      <PrivateChat
        user={user}
        friend={activeFriend}
        onBack={() => setActiveFriend(null)}
      />
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #222', background: '#111' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Private Chats</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {friends.length === 0 && (
          <div style={{ color: '#555', textAlign: 'center', marginTop: '3rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
            <p>No friends yet.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Add friends to start chatting!</p>
          </div>
        )}
        {friends.map((f) => {
          const unread = newMessageFrom[f.friend_account_code] || 0
          return (
            <div
              key={f.friend_account_code}
              onClick={() => openChat(f)}
              style={{
                background: '#1a1a1a',
                border: `1px solid ${unread > 0 ? '#ffffff33' : '#222'}`,
                borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                cursor: 'pointer', transition: 'border-color 0.2s'
              }}
            >
              {/* Avatar with badge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: '#333', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.2rem'
                }}>👻</div>
                {unread > 0 && (
                  <div style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: '#ff4444', color: '#fff',
                    borderRadius: '50%', minWidth: '18px', height: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 'bold', padding: '0 3px'
                  }}>
                    {unread > 99 ? '99+' : unread}
                  </div>
                )}
              </div>

              {/* Name and code */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: unread > 0 ? 'bold' : 'normal',
                  color: unread > 0 ? '#fff' : '#ccc',
                  marginBottom: '0.2rem'
                }}>
                  {f.display_name || 'Ghost'}
                </div>
                <div style={{ color: '#555', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {f.friend_code}
                </div>
              </div>

              {/* New badge */}
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

export default Chats
