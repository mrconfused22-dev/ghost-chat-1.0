import { useState } from 'react'
import WorldChat from './WorldChat'
import Friends from './Friends'
import Chats from './Chats'
import Groups from './Groups'
import AdminPanel from './AdminPanel'

function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('world')
  const [unreadChats, setUnreadChats] = useState(0)
  const [unreadGroups, setUnreadGroups] = useState(0)
  const [showAdmin, setShowAdmin] = useState(false)

  if (showAdmin) {
    return <AdminPanel user={user} onClose={() => setShowAdmin(false)} />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a' }}>
      <div style={{
        width: '60px', background: '#111', borderRight: '1px solid #222',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: '1rem', gap: '0.5rem'
      }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>👻</div>

        <SidebarBtn icon="🌍" label="World" active={tab === 'world'} onClick={() => setTab('world')} />

        <div style={{ position: 'relative' }}>
          <SidebarBtn icon="💬" label="Chats" active={tab === 'chats'} onClick={() => setTab('chats')} />
          {unreadChats > 0 && <Badge count={unreadChats} />}
        </div>

        <div style={{ position: 'relative' }}>
          <SidebarBtn icon="👥" label="Groups" active={tab === 'groups'} onClick={() => setTab('groups')} />
          {unreadGroups > 0 && <Badge count={unreadGroups} />}
        </div>

        <SidebarBtn icon="🤝" label="Friends" active={tab === 'friends'} onClick={() => setTab('friends')} />
        <SidebarBtn icon="⚙️" label="Settings" active={tab === 'settings'} onClick={() => setTab('settings')} />

        {user?.isAdmin && (
          <SidebarBtn icon="🛡️" label="Admin" active={false} onClick={() => setShowAdmin(true)} />
        )}

        <div style={{ flex: 1 }} />
        <button onClick={onLogout} title="Logout" style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: '1.3rem', padding: '0.5rem', marginBottom: '1rem',
          borderRadius: '8px', opacity: 0.5
        }}>🚪</button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'world' && <WorldChat user={user} />}
        {tab === 'chats' && <Chats user={user} onUnreadChange={setUnreadChats} />}
        {tab === 'groups' && <Groups user={user} onUnreadChange={setUnreadGroups} />}
        {tab === 'friends' && <Friends user={user} />}
        {tab === 'settings' && <Settings user={user} onLogout={onLogout} />}
      </div>
    </div>
  )
}

function Badge({ count }) {
  return (
    <div style={{
      position: 'absolute', top: '-4px', right: '-4px',
      background: '#ff4444', color: '#fff', borderRadius: '50%',
      minWidth: '18px', height: '18px', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: '0.65rem', fontWeight: 'bold', padding: '0 3px',
      pointerEvents: 'none'
    }}>
      {count > 99 ? '99+' : count}
    </div>
  )
}

function Settings({ user, onLogout }) {
  const [copied, setCopied] = useState(false)

  const copyFriendCode = () => {
    navigator.clipboard.writeText(user?.friendCode || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
      <h2 style={{ marginBottom: '2rem' }}>Settings</h2>
      <div style={{
        background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px',
        padding: '1.5rem', width: '100%', maxWidth: '400px', textAlign: 'left'
      }}>
        <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Display Name</p>
        <p style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>{user?.displayName || 'Not set'}</p>
        <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Friend Code</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#00ff88', flex: 1 }}>
            {user?.friendCode}
          </p>
          <button onClick={copyFriendCode} style={{
            background: copied ? '#00ff8822' : '#222',
            border: `1px solid ${copied ? '#00ff88' : '#444'}`,
            color: copied ? '#00ff88' : '#888',
            padding: '0.3rem 0.6rem', borderRadius: '6px',
            cursor: 'pointer', fontSize: '0.75rem'
          }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div style={{
          background: '#0a0a0a', border: '1px solid #ff444433',
          borderRadius: '8px', padding: '0.75rem', marginBottom: '1.5rem'
        }}>
          <p style={{ color: '#ff4444', fontSize: '0.8rem', lineHeight: '1.5' }}>
            Your account code is sensitive — never share it with anyone. It is your login credential.
          </p>
        </div>
        <button onClick={onLogout} style={{
          width: '100%', background: 'transparent', color: '#ff4444',
          border: '1px solid #ff4444', padding: '0.75rem',
          borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'
        }}>
          LOGOUT
        </button>
      </div>
    </div>
  )
}

function SidebarBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} title={label} style={{
      background: active ? '#ffffff22' : 'transparent',
      border: active ? '1px solid #ffffff33' : '1px solid transparent',
      borderRadius: '10px', cursor: 'pointer', fontSize: '1.3rem',
      padding: '0.6rem', width: '46px', height: '46px',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {icon}
    </button>
  )
}

export default Dashboard
