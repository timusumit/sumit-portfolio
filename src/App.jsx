import { useState } from 'react';

// When deployed on Vercel, this points to your GraphQL serverless function.
// Right now, we'll set it to '/api/graphql' (we will configure the full URL in Step 3).
const API_URL = import.meta.env.VITE_API_URL || '/api/graphql';

export default function App() {
  // Contact Form State
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  // Admin View State
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [messages, setMessages] = useState([]);
  const [adminError, setAdminError] = useState('');

  // 1. Send Message (GraphQL Mutation)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');

    const query = `
      mutation SendMessage($name: String!, $email: String!, $message: String!) {
        sendMessage(name: $name, email: $email, message: $message) {
          id
          name
        }
      }
    `;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: formData }),
      });
      const result = await res.json();

      if (result.errors) throw new Error(result.errors[0].message);

      setStatus('✅ Message sent successfully! I will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('❌ Could not send message (API not connected yet).');
    }
  };

  // 2. Fetch Messages for Admin (GraphQL Query)
  const fetchMessages = async (e) => {
    e.preventDefault();
    setAdminError('Loading...');

    const query = `
      query GetMessages($adminSecret: String!) {
        getMessages(adminSecret: $adminSecret) {
          id
          name
          email
          message
          createdAt
        }
      }
    `;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { adminSecret } }),
      });
      const result = await res.json();

      if (result.errors) throw new Error(result.errors[0].message);
      setMessages(result.data.getMessages);
      setAdminError('');
    } catch (err) {
      setAdminError('❌ ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 24px' }}>

      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '64px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Sumit Maharjan
          </h1>
          <p style={{ color: '#666', fontSize: '15px', marginTop: '4px' }}>
            Web Developer (TSUnaMI) • Nepal
          </p>
        </div>

        <button
          onClick={() => setIsAdminView(!isAdminView)}
          style={{
            background: 'transparent',
            border: '1px solid #e5e5e5',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#555'
          }}
        >
          {isAdminView ? '← Back to Site' : 'Admin 🔒'}
        </button>
      </header>

      {/* PUBLIC PORTFOLIO VIEW */}
      {!isAdminView ? (
        <main>
          {/* ABOUT SECTION */}
          <section style={{ marginBottom: '56px' }}>
            <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '16px' }}>
              About
            </h2>
            <p style={{ fontSize: '17px', color: '#333' }}>
              Hi, I’m Sumit. I design and build fast, minimalist, and accessible web applications.
              Currently focused on React, modern frontend architecture, and full-stack development.
            </p>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid #eaeaea', marginBottom: '56px' }} />

          {/* CONTACT FORM SECTION */}
          <section>
            <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '16px' }}>
              Get in Touch
            </h2>
            <p style={{ fontSize: '15px', color: '#555', marginBottom: '24px' }}>
              Have a project in mind or want to connect? Drop a message below.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="Your Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="Your Email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
              />
              <textarea
                rows="4"
                placeholder="Your Message..."
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={inputStyle}
              />
              <button type="submit" style={buttonStyle}>
                Send Message →
              </button>

              {status && (
                <p style={{ fontSize: '14px', color: '#444', marginTop: '8px' }}>
                  {status}
                </p>
              )}
            </form>
          </section>
        </main>
      ) : (

        /* ADMIN INBOX VIEW */
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Admin Message Inbox
          </h2>

          <form onSubmit={fetchMessages} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <input
              type="password"
              placeholder="Enter Admin Secret Password"
              required
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="submit" style={buttonStyle}>
              Unlock Inbox
            </button>
          </form>

          {adminError && <p style={{ fontSize: '14px', color: '#d93025', marginBottom: '16px' }}>{adminError}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 && !adminError && (
              <p style={{ fontSize: '14px', color: '#888' }}>Enter your secret password to view messages.</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  padding: '16px',
                  background: '#fff',
                  border: '1px solid #eaeaea',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '15px' }}>
                    {msg.name} <span style={{ color: '#777', fontWeight: 'normal' }}>({msg.email})</span>
                  </strong>
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    {new Date(Number(msg.createdAt) || msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: '15px', color: '#333', whiteSpace: 'pre-wrap' }}>{msg.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: '80px', paddingTop: '24px', borderTop: '1px solid #eaeaea', fontSize: '13px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
        <span>© {new Date().getFullYear()} Sumit Maharjan</span>
        <span>Designed by TSUnaMI</span>
      </footer>
    </div>
  );
}

const inputStyle = {
  padding: '12px 14px',
  border: '1px solid #e0e0e0',
  borderRadius: '6px',
  fontSize: '15px',
  background: '#fff',
  outline: 'none'
};

const buttonStyle = {
  padding: '12px 20px',
  background: '#171717',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: '500',
  cursor: 'pointer'
};