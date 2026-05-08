// /components/AdminVoiceWidget.js
// Internal voice assistant widget for admin pages.
// Uses Retell Web SDK to connect to the staff voice agent.

import { useState, useEffect, useRef } from 'react';

export default function AdminVoiceWidget() {
  const [active, setActive] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [liveAgent, setLiveAgent] = useState('');
  const [liveUser, setLiveUser] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    return () => {
      if (client) {
        try { client.stopCall(); } catch (e) { /* ignore */ }
      }
    };
  }, [client]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, liveAgent, liveUser]);

  async function startCall() {
    const { RetellWebClient } = await import('retell-client-js-sdk');
    const rc = new RetellWebClient();

    rc.on('call_started', () => setActive(true));
    rc.on('call_ended', () => {
      setActive(false);
      setLiveAgent('');
      setLiveUser('');
    });
    rc.on('error', () => {
      setActive(false);
      setLiveAgent('');
      setLiveUser('');
    });

    rc.on('update', (update) => {
      if (!update.transcript) return;
      const turns = update.transcript;
      const finalized = [];
      let pendingAgent = '';
      let pendingUser = '';

      for (const turn of turns) {
        if (turn.role === 'agent') {
          if (turn.status === 'complete' || turn.status === 'final') {
            finalized.push({ role: 'agent', text: turn.content });
          } else {
            pendingAgent = turn.content || '';
          }
        } else {
          if (turn.status === 'complete' || turn.status === 'final') {
            finalized.push({ role: 'user', text: turn.content });
          } else {
            pendingUser = turn.content || '';
          }
        }
      }

      setMessages(finalized);
      setLiveAgent(pendingAgent);
      setLiveUser(pendingUser);
    });

    try {
      const res = await fetch('/api/voice-agent/internal-token');
      const data = await res.json();
      if (!data.access_token) {
        console.error('No access token returned');
        return;
      }
      await rc.startCall({ accessToken: data.access_token });
      setClient(rc);
    } catch (err) {
      console.error('Internal voice call error:', err);
      setActive(false);
    }
  }

  function endCall() {
    if (client) {
      client.stopCall();
      setActive(false);
      setLiveAgent('');
      setLiveUser('');
    }
  }

  function handleMicClick() {
    if (!panelOpen) {
      setPanelOpen(true);
      if (!active) {
        setMessages([]);
        startCall();
      }
    } else if (active) {
      endCall();
    } else {
      setPanelOpen(false);
    }
  }

  return (
    <>
      {panelOpen && (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: active ? '#22c55e' : '#6b7280',
                boxShadow: active ? '0 0 6px #22c55e' : 'none',
              }} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Staff Voice Assistant</span>
            </div>
            <button
              onClick={() => { endCall(); setPanelOpen(false); }}
              style={closeBtnStyle}
            >
              &times;
            </button>
          </div>

          <div style={messagesContainerStyle}>
            {messages.length === 0 && !liveAgent && !liveUser && (
              <div style={emptyStateStyle}>
                {active ? 'Listening...' : 'Click the mic to start talking'}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  ...bubbleBase,
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? '#1a1a2e' : '#f3f4f6',
                  color: msg.role === 'user' ? '#fff' : '#1f2937',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {liveUser && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ ...bubbleBase, borderRadius: '14px 14px 4px 14px', background: '#1a1a2e', color: '#fff', opacity: 0.7 }}>
                  {liveUser}
                </div>
              </div>
            )}
            {liveAgent && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ ...bubbleBase, borderRadius: '14px 14px 14px 4px', background: '#f3f4f6', color: '#1f2937', opacity: 0.7 }}>
                  {liveAgent}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={footerStyle}>
            {active ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '13px', fontWeight: 500 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  Listening
                </div>
                <button onClick={endCall} style={endCallBtnStyle}>End call</button>
              </>
            ) : (
              <button onClick={() => { setMessages([]); startCall(); }} style={startCallBtnStyle}>
                <MicIcon />
                Start new call
              </button>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleMicClick}
        title="Staff Voice Assistant"
        style={{
          ...fabStyle,
          background: active ? '#ef4444' : '#1a1a2e',
        }}
      >
        {active ? <PhoneOffIcon /> : <MicIcon />}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </button>
    </>
  );
}

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function PhoneOffIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.5 16.5C14.5 18.5 11.5 19.5 8.5 19.5L5 16l3-3 2.5 2.5" />
      <path d="M7.5 7.5C9.5 5.5 12.5 4.5 15.5 4.5L19 8l-3 3-2.5-2.5" />
    </svg>
  );
}

const panelStyle = {
  position: 'fixed',
  bottom: '96px',
  right: '24px',
  width: '380px',
  maxWidth: 'calc(100vw - 48px)',
  height: '500px',
  maxHeight: 'calc(100vh - 140px)',
  background: '#fff',
  borderRadius: '16px',
  boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
  zIndex: 9996,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: 'Inter, -apple-system, sans-serif',
};

const headerStyle = {
  padding: '16px 20px',
  background: '#1a1a2e',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '18px',
  padding: '0 4px',
  lineHeight: 1,
};

const messagesContainerStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const emptyStateStyle = {
  textAlign: 'center',
  color: '#9ca3af',
  fontSize: '13px',
  marginTop: '40px',
};

const bubbleBase = {
  maxWidth: '80%',
  padding: '10px 14px',
  fontSize: '14px',
  lineHeight: '1.5',
};

const footerStyle = {
  padding: '12px 20px',
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
};

const endCallBtnStyle = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  borderRadius: '20px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
};

const startCallBtnStyle = {
  background: '#1a1a2e',
  color: '#fff',
  border: 'none',
  borderRadius: '20px',
  padding: '8px 20px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const fabStyle = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
  zIndex: 9995,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
