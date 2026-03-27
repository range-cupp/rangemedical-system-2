// /components/StaffChatPanel.js
// Floating staff chat panel — available on every admin page
// Opens as a slide-up panel from a chat button in the bottom-right corner
// Range Medical

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthProvider';

const SUGGESTIONS = [
  "What's on the schedule today?",
  "Is there availability tomorrow for a Range IV?",
  "Look up [patient name]",
  "What did we charge [patient name]?",
];

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#9ca3af',
          animation: 'rmchat-bounce 1s infinite',
          animationDelay: `${delay}s`,
        }} />
      ))}
    </div>
  );
}

function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 8,
    }}>
      <div style={{
        maxWidth: '85%',
        background: isUser ? '#000' : '#f3f4f6',
        color: isUser ? '#fff' : '#111',
        borderRadius: '0',
        padding: '9px 13px',
        fontSize: 14,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function StaffChatPanel() {
  const { employee, session } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);

  // Greet on first open
  useEffect(() => {
    if (open && employee && !hasGreeted.current) {
      hasGreeted.current = true;
      setMessages([{
        role: 'bot',
        content: `👋 Hi ${employee.name.split(' ')[0]}! Ask me anything about the CRM.\n\nType "help" to see all commands.`,
        id: 'greeting',
      }]);
    }
    if (open) setUnread(0);
  }, [open, employee]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    setMessages((prev) => [...prev, { role: 'user', content: msg, id: Date.now() }]);

    try {
      const res = await fetch('/api/staff-bot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      const response = res.ok ? data.response : (data.error || 'Something went wrong.');
      setMessages((prev) => [...prev, { role: 'bot', content: response, id: Date.now() + 1 }]);
      if (!open) setUnread((n) => n + 1);
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', content: '❌ Request failed. Try again.', id: Date.now() + 1 }]);
    } finally {
      setSending(false);
      if (open) setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [input, sending, session, open]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Don't render for non-employees
  if (!employee) return null;

  const firstUserMsg = messages.filter((m) => m.role === 'user').length === 0;

  return (
    <div data-staff-chat-panel>
      <style>{`
        @keyframes rmchat-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes rmchat-slidein {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 768px) {
          [data-staff-chat-panel] { display: none !important; }
        }
      `}</style>

      {/* Floating chat button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Range Assistant"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#000',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          zIndex: 9998,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'; }}
      >
        {open ? (
          // X icon when open
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          // Chat icon when closed
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {/* Unread badge */}
        {unread > 0 && !open && (
          <div style={{
            position: 'absolute', top: 2, right: 2,
            background: '#ef4444', color: '#fff',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>{unread}</div>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 88,
          right: 24,
          width: 360,
          maxWidth: 'calc(100vw - 32px)',
          height: 520,
          maxHeight: 'calc(100vh - 120px)',
          background: '#fff',
          borderRadius: 0,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9997,
          animation: 'rmchat-slidein 0.2s ease-out',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 16px 12px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Range Assistant</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{employee.name}</div>
            </div>
            <button
              onClick={() => {
                hasGreeted.current = false;
                setMessages([]);
                setTimeout(() => {
                  hasGreeted.current = true;
                  setMessages([{ role: 'bot', content: 'Chat cleared. What can I help you with?', id: Date.now() }]);
                }, 30);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 12, padding: 0 }}
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px', WebkitOverflowScrolling: 'touch' }}>
            {messages.map((m) => <Bubble key={m.id} msg={m} />)}
            {sending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
                <div style={{ background: '#f3f4f6', borderRadius: '0' }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {firstUserMsg && (
            <div style={{
              padding: '4px 12px 6px',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              flexShrink: 0,
            }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => {
                  if (s.includes('[')) { setInput(s); inputRef.current?.focus(); }
                  else send(s);
                }} style={{
                  whiteSpace: 'nowrap',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 0,
                  padding: '5px 11px',
                  fontSize: 12,
                  color: '#374151',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            borderTop: '1px solid #e5e7eb',
            padding: '10px 12px',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything…"
              rows={1}
              style={{
                flex: 1,
                border: '1.5px solid #e5e7eb',
                borderRadius: 0,
                padding: '8px 13px',
                fontSize: 14,
                lineHeight: 1.4,
                background: '#f9fafb',
                color: '#111',
                resize: 'none',
                fontFamily: 'inherit',
                maxHeight: 96,
                overflowY: 'auto',
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || sending}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: input.trim() && !sending ? '#000' : '#e5e7eb',
                border: 'none',
                cursor: input.trim() && !sending ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke={input.trim() && !sending ? '#fff' : '#9ca3af'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
