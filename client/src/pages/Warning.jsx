import { useState } from 'react'

function Warning({ onNext }) {
  const [confirmed, setConfirmed] = useState(false)

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
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>!</div>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#ff4444' }}>
        IMPORTANT WARNING
      </h2>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #ff4444',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        textAlign: 'left'
      }}>
        <p style={{ marginBottom: '1rem', lineHeight: '1.6', color: '#ccc' }}>
          You will be given a <strong style={{ color: '#fff' }}>unique account code</strong> and <strong style={{ color: '#fff' }}>password</strong>.
        </p>
        <p style={{ marginBottom: '1rem', lineHeight: '1.6', color: '#ccc' }}>
          <strong style={{ color: '#ff4444' }}>There is NO recovery option.</strong> If you lose your code or password, your account is gone forever.
        </p>
        <p style={{ marginBottom: '1rem', lineHeight: '1.6', color: '#ccc' }}>
          Save your code somewhere safe - like a password manager or written down securely.
        </p>
        <p style={{ lineHeight: '1.6', color: '#ccc' }}>
          We store zero personal information. Your privacy is absolute.
        </p>
      </div>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '2rem',
        cursor: 'pointer',
        color: '#ccc'
      }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
        I understand. I will save my account code safely.
      </label>
      <button
        onClick={onNext}
        disabled={!confirmed}
        style={{
          background: confirmed ? '#ffffff' : '#333',
          color: confirmed ? '#000000' : '#666',
          border: 'none',
          padding: '0.9rem 3rem',
          fontSize: '1rem',
          borderRadius: '8px',
          cursor: confirmed ? 'pointer' : 'not-allowed',
          fontWeight: 'bold',
          transition: 'all 0.2s'
        }}
      >
        I UNDERSTAND
      </button>
    </div>
  )
}

export default Warning
