import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:3001/api'

function Login({ onLogin }) {
  const [mode, setMode] = useState('choice')
  const [accountCode, setAccountCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newAccount, setNewAccount] = useState(null)

  const handleCreateAccount = async () => {
    setError('')
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API}/auth/register`, { password })
      setNewAccount(res.data)
      localStorage.clear()
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('accountCode', res.data.accountCode)
      localStorage.setItem('friendCode', res.data.friendCode)
      setMode('created')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    setError('')
    if (!accountCode || !password) {
      setError('Please enter your account code and password')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API}/auth/login`, { accountCode, password })
      localStorage.clear()
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('accountCode', res.data.accountCode)
      localStorage.setItem('friendCode', res.data.friendCode)
      if (res.data.displayName) {
        localStorage.setItem('displayName', res.data.displayName)
      }
      onLogin(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.9rem',
    marginBottom: '1rem',
    background: '#1a1a1a',
    border: '1px solid #444',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '1rem'
  }

  const btnPrimary = {
    width: '100%',
    background: '#ffffff',
    color: '#000',
    border: 'none',
    padding: '1rem',
    fontSize: '1rem',
    borderRadius: '8px',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
    opacity: loading ? 0.6 : 1
  }

  const btnSecondary = {
    width: '100%',
    background: 'transparent',
    color: '#ffffff',
    border: '1px solid #444',
    padding: '1rem',
    fontSize: '1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '0.5rem'
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👻</div>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>GHOST CHAT</h2>

      {error && (
        <div style={{
          background: '#2a0000',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          color: '#ff4444',
          width: '100%',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {mode === 'choice' && (
        <div style={{ width: '100%' }}>
          <button onClick={() => setMode('create')} style={btnPrimary}>
            CREATE NEW ACCOUNT
          </button>
          <button onClick={() => setMode('login')} style={btnSecondary}>
            I ALREADY HAVE AN ACCOUNT
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            A unique account code will be generated for you.
          </p>
          <input
            type="password"
            placeholder="Create a password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: '1.5rem' }}
          />
          <button onClick={handleCreateAccount} style={btnPrimary} disabled={loading}>
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
          <p onClick={() => setMode('choice')} style={{ color: '#888', marginTop: '1rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            Back
          </p>
        </div>
      )}

      {mode === 'created' && newAccount && (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#00ff88', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Account created successfully!
          </p>
          <p style={{ color: '#888', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Your account code - save this now:
          </p>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #00ff88',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '1.4rem',
            letterSpacing: '0.15em',
            marginBottom: '0.5rem',
            fontFamily: 'monospace',
            color: '#00ff88'
          }}>
            {newAccount.accountCode}
          </div>
          <p style={{ color: '#ff4444', fontSize: '0.8rem', marginBottom: '1rem' }}>
            WARNING: There is no recovery. If you lose this code, your account is gone forever.
          </p>
          <p style={{ color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Your friend code (share this to add friends):
          </p>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '0.75rem',
            fontSize: '1.1rem',
            letterSpacing: '0.1em',
            marginBottom: '2rem',
            fontFamily: 'monospace',
            color: '#fff'
          }}>
            {newAccount.friendCode}
          </div>
          <button onClick={() => onLogin(newAccount)} style={btnPrimary}>
            I SAVED MY CODE - ENTER APP
          </button>
        </div>
      )}

      {mode === 'login' && (
        <div style={{ width: '100%' }}>
          <input
            type="text"
            placeholder="Enter your account code (XXXX-XXXX-XXXX-XXXX)"
            value={accountCode}
            onChange={(e) => setAccountCode(e.target.value.toUpperCase())}
            style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.1em' }}
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: '1.5rem' }}
          />
          <button onClick={handleLogin} style={btnPrimary} disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
          <p onClick={() => setMode('choice')} style={{ color: '#888', marginTop: '1rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            Back
          </p>
        </div>
      )}
    </div>
  )
}

export default Login
