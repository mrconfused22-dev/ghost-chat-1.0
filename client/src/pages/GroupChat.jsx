import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = 'http://localhost:3001/api'
const SOCKET_URL = 'http://localhost:3001'

let socket

function GroupChat({ user, group, onBack, onLeave }) {
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const bottomRef = useRef(null)
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    socket = io(SOCKET_URL)
    socket.emit('register', user.accountCode)
    socket.emit('join_group', group.id)

    socket.on('group_message', (msg) => {
      if (msg.groupId === group.id && msg.account_code !== user.accountCode) {
        setMessages(prev => [...prev, msg])
      }
    })

    loadMessages()
    loadMembers()

    return () => socket.disconnect()
  }, [group])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    try {
      const res = await axios.get(`${API}/groups/${group.id}/messages`, { headers })
      setMessages(res.data)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      const res = await axios.get(`${API}/groups/${group.id}/members`, { headers })
      setMembers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await axios.post(
        `${API}/groups/${group.id}/messages`,
        { message: input.trim() },
        { headers }
      )
      setMessages(prev => [...prev, res.data])
      socket.emit('group_message', { ...res.data, groupId: group.id })
      setInput('')
    } catch (err) {
      console.error(err)
    }
    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const removeMember = async (accountCode) => {
    if (!confirm('Remove this member?')) return
    try {
      await axios.post(`${API}/groups/${group.id}/remove`, { accountCode }, { headers })
      loadMembers()
    } catch (err) {
      alert(err.response?.data?.error || 'Error')
    }
  }

  const leaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return
    try {
      await axios.post(`${API}/groups/${group.id}/leave`, {}, { headers })
      onLeave()
    } catch (err) {
      alert(err.response?.data?.error || 'Error')
    }
  }

  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a' }}>
      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem', borderBottom: '1px solid #222',
          display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#111'
        }}>
          <button onClick={onBack} style={{
            background: 'transparent', border: 'none', color: '#888',
            cursor: 'pointer', fontSize: '1.2rem'
          }}>←</button>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#333', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1rem'
          }}>👥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold' }}>{group.name}</div>
            <div style={{ color: '#555', fontSize: '0.75rem' }}>{group.member_count} members · Messages delete after 24hrs</div>
          </div>
          <button
            onClick={() => setShowMembers(!showMembers)}
            style={{
              background: showMembers ? '#ffffff22' : 'transparent',
              border: '1px solid #333', color: '#888',
              padding: '0.4rem 0.75rem', borderRadius: '6px',
              cursor: 'pointer', fontSize: '0.8rem'
            }}
          >
            Members
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem'
        }}>
          {loading && <div style={{ color: '#555', textAlign: 'center', marginTop: '2rem' }}>Loading...</div>}
          {!loading && messages.length === 0 && (
            <div style={{ color: '#555', textAlign: 'center', marginTop: '2rem' }}>
              No messages yet. Start the conversation!
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.account_code === user.accountCode
            return (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}>
                {!isMe && (
                  <span style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    {msg.display_name}
                  </span>
                )}
                <div style={{
                  background: isMe ? '#ffffff' : '#1a1a1a',
                  color: isMe ? '#000' : '#fff',
                  padding: '0.6rem 1rem',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  maxWidth: '75%', fontSize: '0.95rem',
                  lineHeight: '1.4', wordBreak: 'break-word'
                }}>
                  {msg.message}
                </div>
                <span style={{ color: '#444', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '1rem', borderTop: '1px solid #222',
          display: 'flex', gap: '0.75rem', background: '#111'
        }}>
          <input
            type="text"
            placeholder="Message group..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={1000}
            style={{
              flex: 1, padding: '0.75rem 1rem', background: '#1a1a1a',
              border: '1px solid #333', borderRadius: '24px',
              color: '#fff', fontSize: '0.95rem', outline: 'none'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            style={{
              background: input.trim() ? '#ffffff' : '#222',
              color: input.trim() ? '#000' : '#555',
              border: 'none', borderRadius: '50%', width: '44px', height: '44px',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              fontSize: '1.2rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}
          >
            ➤
          </button>
        </div>
      </div>

      {/* Members panel */}
      {showMembers && (
        <div style={{
          width: '220px', borderLeft: '1px solid #222',
          background: '#111', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #222', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Members ({members.length})
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {members.map((m) => (
              <div key={m.account_code} style={{
                padding: '0.6rem 0.75rem', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '0.25rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: m.is_admin ? 'bold' : 'normal' }}>
                    {m.display_name || 'Ghost'}
                    {m.account_code === user.accountCode && ' (you)'}
                  </div>
                  {m.is_admin && <div style={{ color: '#888', fontSize: '0.7rem' }}>Admin</div>}
                </div>
                {group.is_admin && m.account_code !== user.accountCode && (
                  <button
                    onClick={() => removeMember(m.account_code)}
                    style={{
                      background: 'transparent', border: 'none',
                      color: '#ff4444', cursor: 'pointer', fontSize: '0.75rem'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: '0.75rem', borderTop: '1px solid #222' }}>
            <button
              onClick={leaveGroup}
              style={{
                width: '100%', background: 'transparent',
                border: '1px solid #ff444433', color: '#ff4444',
                padding: '0.6rem', borderRadius: '8px',
                cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              Leave Group
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupChat
