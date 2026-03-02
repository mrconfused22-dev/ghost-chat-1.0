import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = 'http://localhost:3001/api'
const SOCKET_URL = 'http://localhost:3001'

let socket

function WorldChat({ user }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [reportingId, setReportingId] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    socket = io(SOCKET_URL)
    socket.emit('join_world')
    socket.on('world_message', (msg) => {
      setMessages(prev => [...prev, msg])
    })
    const token = localStorage.getItem('token')
    axios.get(API + '/world/messages', {
      headers: { Authorization: 'Bearer ' + token }
    }).then(res => {
      setMessages(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { socket.disconnect() }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post(API + '/world/messages',
        { message: input.trim() },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      socket.emit('world_message', res.data)
      setInput('')
    } catch (err) {
      console.error('Send error:', err)
    }
    setSending(false)
  }

  const handleReport = async (msg) => {
    if (reportingId === msg.id) return
    if (!window.confirm('Report message from ' + msg.display_name + '?')) return
    const reason = window.prompt('Reason for report (optional):') || 'Reported from World Chat'
    setReportingId(msg.id)
    try {
      const token = localStorage.getItem('token')
      await axios.post(API + '/world/report',
        { reportedCode: msg.account_code, reason },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      alert('Report submitted.')
    } catch {
      alert('Failed to submit report.')
    }
    setReportingId(null)
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
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#111' }}>
        <span style={{ fontSize: '1.5rem' }}>🌍</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>World Chat</div>
          <div style={{ color: '#555', fontSize: '0.75rem' }}>Messages disappear after 7 days</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading && <div style={{ color: '#555', textAlign: 'center', marginTop: '2rem' }}>Loading messages...</div>}
        {!loading && messages.length === 0 && <div style={{ color: '#555', textAlign: 'center', marginTop: '2rem' }}>No messages yet. Be the first to say something!</div>}
        {messages.map((msg) => {
          const isMe = msg.account_code === user.accountCode
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && <span style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{msg.display_name}</span>}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                <div style={{ background: isMe ? '#ffffff' : '#1a1a1a', color: isMe ? '#000' : '#fff', padding: '0.6rem 1rem', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', maxWidth: '75%', fontSize: '0.95rem', lineHeight: '1.4', wordBreak: 'break-word' }}>
                  {msg.message}
                </div>
                {!isMe && (
                  <button
                    onClick={() => handleReport(msg)}
                    disabled={reportingId === msg.id}
                    title="Report this user"
                    style={{ background: 'transparent', border: 'none', color: '#444', fontSize: '0.85rem', cursor: 'pointer', padding: '4px', lineHeight: 1, flexShrink: 0 }}
                  >
                    &#9873;
                  </button>
                )}
              </div>
              <span style={{ color: '#444', fontSize: '0.7rem', marginTop: '0.2rem' }}>{formatTime(msg.created_at)}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '1rem', borderTop: '1px solid #222', display: 'flex', gap: '0.75rem', background: '#111' }}>
        <input type="text" placeholder="Message the world..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} maxLength={500} style={{ flex: 1, padding: '0.75rem 1rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '24px', color: '#fff', fontSize: '0.95rem', outline: 'none' }} />
        <button onClick={sendMessage} disabled={sending || !input.trim()} style={{ background: input.trim() ? '#ffffff' : '#222', color: input.trim() ? '#000' : '#555', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: input.trim() ? 'pointer' : 'not-allowed', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          &#10148;
        </button>
      </div>
    </div>
  )
}

export default WorldChat