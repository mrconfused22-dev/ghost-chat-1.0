import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = 'http://localhost:3001/api'
const SOCKET_URL = 'http://localhost:3001'

let socket

function PrivateChat({ user, friend, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    socket = io(SOCKET_URL)
    socket.emit('register', user.accountCode)

    socket.on('private_message', (msg) => {
      if (msg.from === friend.friend_account_code || msg.to === friend.friend_account_code) {
        setMessages(prev => [...prev, msg])
      }
    })

    // Load messages
    axios.get(`${API}/messages/${friend.friend_account_code}`, { headers })
      .then(res => {
        setMessages(res.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    return () => socket.disconnect()
  }, [friend])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await axios.post(
        `${API}/messages/${friend.friend_account_code}`,
        { message: input.trim() },
        { headers }
      )
      setMessages(prev => [...prev, res.data])
      socket.emit('private_message', res.data)
      setInput('')
    } catch (err) {
      console.error('Send error:', err)
    }
    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid #222',
        display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#111'
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', color: '#888',
          cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem'
        }}>←</button>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: '#333', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1rem'
        }}>👻</div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{friend.display_name || 'Ghost'}</div>
          <div style={{ color: '#555', fontSize: '0.75rem' }}>Messages delete after 24hrs once seen by both</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1rem',
        display: 'flex', flexDirection: 'column', gap: '0.75rem'
      }}>
        {loading && (
          <div style={{ color: '#555', textAlign: 'center', marginTop: '2rem' }}>Loading...</div>
        )}
        {!loading && messages.length === 0 && (
          <div style={{ color: '#555', textAlign: 'center', marginTop: '2rem' }}>
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.from === user.accountCode
          return (
            <div key={msg.id} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: isMe ? 'flex-end' : 'flex-start'
            }}>
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
                {formatTime(msg.sentAt)}
                {isMe && msg.seenAt && ' · Seen'}
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
          placeholder="Send a message..."
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
            border: 'none', borderRadius: '50%',
            width: '44px', height: '44px',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            fontSize: '1.2rem', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}
        >
          ➤
        </button>
      </div>
    </div>
  )
}

export default PrivateChat
