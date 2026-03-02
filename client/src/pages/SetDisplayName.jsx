import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:3001/api'

function SetDisplayName({ onDone }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API}/auth/set-display-name`,
        { displayName: name.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      localStorage.setItem('displayName', name.trim())
      onDone(name.trim())
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '2rem',
      textAlign: 'center', maxWidth: '500px', margin: '0 auto'
    }}>
      <div style={{
        width: '70px', height: '70px', borderRadius: '50%',
        background: '#1a1a1a', border: '1px solid #333',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem', marginBottom: '1.5rem'
      }}>
        👤
      </div>

      <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Choose a Display Name</h2>
      <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.95rem' }}>
        This is how others will see you in chats.
      </p>

      {/* Warning box */}
      <div style={{
        background: '#1a0000', border: '1px solid #ff444433',
        borderRadius: '10px', padding: '1rem 1.25rem',
        marginBottom: '2rem', textAlign: 'left', width: '100%'
      }}>
        <p style={{ color: '#ff4444', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
          ⚠️ WARNING - Stay Anonymous
        </p>
        <p style={{ color: '#cc6666', fontSize: '0.85rem', lineHeight: '1.5' }}>
          Do NOT use your real name, nickname people know you by, or any personally identifiable information.
          The whole point of Ghost Chat is anonymity — protect it!
        </p>
      </div>

      {error && (
        <div style={{
          background: '#2a0000', border: '1px solid #ff4444',
          borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem',
          color: '#ff4444', fontSize: '0.9rem', width: '100%'
        }}>
          {error}
        </div>
      )}

      <div style={{ width: '100%', position: 'relative', marginBottom: '0.5rem' }}>
        <input
          type="text"
          placeholder="e.g. ShadowFox, NightOwl, Ghost42..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={30}
          style={{
            width: '100%', padding: '0.9rem 1rem',
            background: '#1a1a1a', border: '1px solid #333',
            borderRadius: '10px', color: '#fff', fontSize: '1rem',
            outline: 'none', boxSizing: 'border-box'
          }}
        />
        <span style={{
          position: 'absolute', right: '1rem', top: '50%',
          transform: 'translateY(-50%)', color: '#444', fontSize: '0.8rem'
        }}>
          {name.length}/30
        </span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || name.trim().length < 2}
        style={{
          width: '100%', marginTop: '1rem',
          background: name.trim().length >= 2 ? '#ffffff' : '#222',
          color: name.trim().length >= 2 ? '#000000' : '#555',
          border: 'none', padding: '1rem',
          fontSize: '1rem', borderRadius: '10px',
          cursor: name.trim().length >= 2 ? 'pointer' : 'not-allowed',
          fontWeight: 'bold', transition: 'all 0.2s'
        }}
      >
        {loading ? 'SAVING...' : 'SET DISPLAY NAME'}
      </button>
    </div>
  )
}

export default SetDisplayName
