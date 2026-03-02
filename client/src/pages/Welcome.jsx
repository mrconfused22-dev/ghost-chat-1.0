function Welcome({ onNext }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '2rem',
      textAlign: 'center', background: '#0a0a0a'
    }}>
      {/* Logo */}
      <div style={{ fontSize: '5rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.1))' }}>
        👻
      </div>

      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
        Ghost Chat
      </h1>

      <p style={{ color: '#555', fontSize: '1rem', marginBottom: '3rem', maxWidth: '300px', lineHeight: '1.6' }}>
        Truly anonymous messaging. No phone number. No email. No trace.
      </p>

      {/* Feature pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '3rem', maxWidth: '380px' }}>
        {[
          { icon: '🔒', text: 'End-to-end encrypted' },
          { icon: '👻', text: 'Zero identity required' },
          { icon: '💨', text: 'Messages auto-delete' },
          { icon: '🌍', text: 'World chat' },
          { icon: '👥', text: 'Group chats' },
          { icon: '🚫', text: 'No ads ever' },
        ].map((f, i) => (
          <div key={i} style={{
            background: '#1a1a1a', border: '1px solid #222',
            borderRadius: '20px', padding: '0.4rem 0.9rem',
            fontSize: '0.8rem', color: '#888',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            <span>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        style={{
          background: '#ffffff', color: '#000000',
          border: 'none', padding: '1rem 3rem',
          fontSize: '1rem', borderRadius: '50px',
          cursor: 'pointer', fontWeight: 'bold',
          letterSpacing: '0.05em',
          boxShadow: '0 0 30px rgba(255,255,255,0.15)',
          transition: 'transform 0.1s, box-shadow 0.1s'
        }}
        onMouseEnter={e => {
          e.target.style.transform = 'scale(1.03)'
          e.target.style.boxShadow = '0 0 40px rgba(255,255,255,0.25)'
        }}
        onMouseLeave={e => {
          e.target.style.transform = 'scale(1)'
          e.target.style.boxShadow = '0 0 30px rgba(255,255,255,0.15)'
        }}
      >
        GET STARTED
      </button>

      <p style={{ color: '#333', fontSize: '0.75rem', marginTop: '2rem' }}>
        Free forever · Open source · No data collection
      </p>
    </div>
  )
}

export default Welcome
