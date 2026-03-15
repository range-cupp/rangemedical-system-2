// /pages/staff-chat.js
// Range Medical Staff Chat — natural language interface to the CRM
// Embedded inside AdminLayout so the sidebar stays visible at all times.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../components/AuthProvider';
import AdminLayout from '../components/AdminLayout';

// ── Suggested quick-action prompts ──────────────────────────────
const SUGGESTIONS = [
  "What's on the schedule today?",
  "Is there availability tomorrow for a Range IV?",
  "Send new patient onboarding to [patient name]",
  "Send blood draw forms to [patient name]",
  "Look up [patient name]",
  "What did we charge [patient name]?",
  "Add note to [patient name]: ",
  "Create task for [staff]: ",
];

// ── Voice dictation hook (Web Speech API) ───────────────────────
function useVoiceDictation({ onResult, onEnd }) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback(() => {
    if (!supported || listening) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.continuous = false;

    recog.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      if (transcript) onResult(transcript);
    };
    recog.onend = () => {
      setListening(false);
      recogRef.current = null;
      onEnd?.();
    };
    recog.onerror = () => {
      setListening(false);
      recogRef.current = null;
    };

    recogRef.current = recog;
    recog.start();
    setListening(true);
  }, [supported, listening, onResult, onEnd]);

  const stop = useCallback(() => {
    recogRef.current?.stop();
  }, []);

  return { listening, supported, start, stop };
}

// ── Single message bubble ────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 10,
      padding: '0 4px',
    }}>
      <div style={{
        maxWidth: '82%',
        background: isUser ? '#000' : '#f3f4f6',
        color: isUser ? '#fff' : '#111',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '10px 14px',
        fontSize: 15,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10, padding: '0 4px' }}>
      <div style={{
        background: '#f3f4f6',
        borderRadius: '18px 18px 18px 4px',
        padding: '12px 16px',
        display: 'flex',
        gap: 5,
        alignItems: 'center',
      }}>
        {[0, 0.15, 0.3].map((delay, i) => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#9ca3af',
            animation: 'bounce 1s infinite',
            animationDelay: `${delay}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function StaffChat() {
  const { employee, session } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);

  // Voice dictation
  const { listening, supported: voiceSupported, start: startListening, stop: stopListening } = useVoiceDictation({
    onResult: (transcript) => {
      // Auto-send if the transcript sounds like a command; otherwise just fill the input
      setInput(transcript);
      // Small delay so user can see what was transcribed, then auto-send
      setTimeout(() => {
        setInput('');
        setSending(true);
        setMessages((prev) => [...prev, { role: 'user', content: transcript, id: Date.now() }]);
        fetch('/api/staff-bot/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ message: transcript }),
        })
          .then((r) => r.json())
          .then((data) => {
            setMessages((prev) => [...prev, { role: 'bot', content: data.response || data.error, id: Date.now() + 1 }]);
          })
          .catch((err) => {
            setMessages((prev) => [...prev, { role: 'bot', content: `❌ ${err.message}`, id: Date.now() + 1 }]);
          })
          .finally(() => {
            setSending(false);
            setTimeout(() => inputRef.current?.focus(), 100);
          });
      }, 600);
    },
    onEnd: () => {},
  });

  // Greet on first load
  useEffect(() => {
    if (employee && !hasGreeted.current) {
      hasGreeted.current = true;
      setMessages([{
        role: 'bot',
        content:
          `👋 Hi ${employee.name.split(' ')[0]}! I'm your Range Medical assistant.\n\n` +
          `Ask me anything — check availability, look up patients, add notes, query billing, create tasks, or get today's schedule.\n\n` +
          `Type "help" to see all commands.`,
        id: 'greeting',
      }]);
    }
  }, [employee]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Focus input on load
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const messageText = (text || input).trim();
    if (!messageText || sending) return;

    setInput('');
    setSending(true);

    setMessages((prev) => [...prev, {
      role: 'user',
      content: messageText,
      id: Date.now(),
    }]);

    try {
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      const res = await fetch('/api/staff-bot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Request failed');

      setMessages((prev) => [...prev, {
        role: 'bot',
        content: data.response,
        id: Date.now() + 1,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'bot',
        content: `❌ ${err.message || 'Something went wrong. Please try again.'}`,
        id: Date.now() + 1,
      }]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, sending, session]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    hasGreeted.current = false;
    setMessages([]);
    setTimeout(() => {
      hasGreeted.current = true;
      setMessages([{
        role: 'bot',
        content: `Chat cleared. What can I help you with?`,
        id: Date.now(),
      }]);
    }, 50);
  };

  const firstUserMsg = messages.filter((m) => m.role === 'user').length === 0;

  return (
    <AdminLayout title="Assistant" hideHeader={true}>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        textarea:focus { outline: none; }
      `}</style>

      {/* Chat container — fills the AdminLayout main area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 48px)',
        maxWidth: 680,
        margin: '0 auto',
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: '#fff',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>
              Range Assistant
            </div>
            {employee && (
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {employee.name}{employee.title ? ` · ${employee.title}` : ''}
              </div>
            )}
          </div>
          <button
            onClick={clearChat}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9ca3af', fontSize: 13, padding: '4px 0',
            }}
          >
            Clear
          </button>
        </div>

        {/* ── Messages ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 8px 8px',
          WebkitOverflowScrolling: 'touch',
        }}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {sending && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* ── Quick suggestions (only before first user message) ── */}
        {firstUserMsg && (
          <div style={{
            padding: '0 8px 8px',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            flexShrink: 0,
          }}>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  if (s.includes('[')) {
                    setInput(s);
                    inputRef.current?.focus();
                  } else {
                    sendMessage(s);
                  }
                }}
                style={{
                  whiteSpace: 'nowrap',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 20,
                  padding: '7px 13px',
                  fontSize: 13,
                  color: '#374151',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Input bar ── */}
        <div style={{
          borderTop: '1px solid #e5e7eb',
          padding: '10px 12px',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          background: '#fff',
          flexShrink: 0,
        }}>
          {/* Mic button — only shown when browser supports Web Speech API */}
          {voiceSupported && (
            <button
              onClick={listening ? stopListening : startListening}
              disabled={sending}
              title={listening ? 'Stop listening' : 'Tap to speak'}
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: listening ? '#ef4444' : '#f3f4f6',
                border: listening ? '2px solid #ef4444' : '1.5px solid #e5e7eb',
                cursor: sending ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s',
                boxShadow: listening ? '0 0 0 4px rgba(239,68,68,0.15)' : 'none',
              }}
            >
              {listening ? (
                /* Animated waveform when recording */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="9" width="2" height="6" rx="1" fill="#fff">
                    <animate attributeName="height" values="6;12;6" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="y" values="9;6;9" dur="0.8s" repeatCount="indefinite" />
                  </rect>
                  <rect x="6" y="7" width="2" height="10" rx="1" fill="#fff">
                    <animate attributeName="height" values="10;4;10" dur="0.6s" repeatCount="indefinite" begin="0.1s" />
                    <animate attributeName="y" values="7;10;7" dur="0.6s" repeatCount="indefinite" begin="0.1s" />
                  </rect>
                  <rect x="10" y="5" width="2" height="14" rx="1" fill="#fff">
                    <animate attributeName="height" values="14;6;14" dur="0.7s" repeatCount="indefinite" begin="0.2s" />
                    <animate attributeName="y" values="5;9;5" dur="0.7s" repeatCount="indefinite" begin="0.2s" />
                  </rect>
                  <rect x="14" y="7" width="2" height="10" rx="1" fill="#fff">
                    <animate attributeName="height" values="10;4;10" dur="0.6s" repeatCount="indefinite" begin="0.15s" />
                    <animate attributeName="y" values="7;10;7" dur="0.6s" repeatCount="indefinite" begin="0.15s" />
                  </rect>
                  <rect x="18" y="9" width="2" height="6" rx="1" fill="#fff">
                    <animate attributeName="height" values="6;12;6" dur="0.8s" repeatCount="indefinite" begin="0.05s" />
                    <animate attributeName="y" values="9;6;9" dur="0.8s" repeatCount="indefinite" begin="0.05s" />
                  </rect>
                </svg>
              ) : (
                /* Mic icon */
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="12" rx="3" fill="#6b7280" />
                  <path d="M5 11a7 7 0 0014 0" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="18" x2="12" y2="22" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                  <line x1="8" y1="22" x2="16" y2="22" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={listening ? '🎙 Listening…' : 'Ask anything…'}
            rows={1}
            style={{
              flex: 1,
              border: `1.5px solid ${listening ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: 22,
              padding: '10px 14px',
              fontSize: 15,
              lineHeight: 1.4,
              background: '#f9fafb',
              color: '#111',
              maxHeight: 120,
              overflowY: 'auto',
              resize: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: input.trim() && !sending ? '#000' : '#e5e7eb',
              border: 'none',
              cursor: input.trim() && !sending ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke={input.trim() && !sending ? '#fff' : '#9ca3af'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

      </div>
    </AdminLayout>
  );
}
