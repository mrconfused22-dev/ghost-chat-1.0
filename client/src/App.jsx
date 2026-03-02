import { useState } from 'react'
import axios from 'axios'
import Welcome from './pages/Welcome'
import Warning from './pages/Warning'
import Login from './pages/Login'
import SetDisplayName from './pages/SetDisplayName'
import Dashboard from './pages/Dashboard'
import { generateKeypair, saveKeypair, getKeypair } from './crypto'

const API = 'http://localhost:3001/api'

function App() {
  const [screen, setScreen] = useState(() => {
    const token = localStorage.getItem('token')
    if (!token) return 'welcome'
    const displayName = localStorage.getItem('displayName')
    if (!displayName) return 'setDisplayName'
    return 'dashboard'
  })

  const [user, setUser] = useState(() => {
    const accountCode = localStorage.getItem('accountCode')
    const friendCode = localStorage.getItem('friendCode')
    const displayName = localStorage.getItem('displayName')
    const isAdmin = localStorage.getItem('isAdmin') === 'true'
    return accountCode ? { accountCode, friendCode, displayName, isAdmin } : null
  })

  const setupKeypair = async (token) => {
    const existing = getKeypair()
    if (existing) return
    const { publicKey, secretKey } = generateKeypair()
    saveKeypair(publicKey, secretKey)
    try {
      await axios.post(`${API}/auth/set-public-key`,
        { publicKey },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (err) {
      console.error('Failed to upload public key:', err)
    }
  }

  const handleLogin = async (userData) => {
    if (userData.isAdmin) localStorage.setItem('isAdmin', 'true')
    setUser({ ...userData, isAdmin: userData.isAdmin || false })
    await setupKeypair(userData.token || localStorage.getItem('token'))
    const displayName = localStorage.getItem('displayName') || userData.displayName
    if (!displayName) {
      setScreen('setDisplayName')
    } else {
      localStorage.setItem('displayName', displayName)
      setScreen('dashboard')
    }
  }

  const handleDisplayNameSet = (displayName) => {
    setUser(prev => ({ ...prev, displayName }))
    setScreen('dashboard')
  }

  const handleLogout = () => {
    localStorage.clear()
    setUser(null)
    setScreen('welcome')
  }

  return (
    <div>
      {screen === 'welcome' && <Welcome onNext={() => setScreen('warning')} />}
      {screen === 'warning' && <Warning onNext={() => setScreen('login')} />}
      {screen === 'login' && <Login onLogin={handleLogin} />}
      {screen === 'setDisplayName' && <SetDisplayName onDone={handleDisplayNameSet} />}
      {screen === 'dashboard' && <Dashboard user={user} onLogout={handleLogout} />}
    </div>
  )
}

export default App
