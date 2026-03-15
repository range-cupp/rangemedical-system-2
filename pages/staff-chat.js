// /pages/staff-chat.js
// Range Medical Staff Chat
// Desktop: inside AdminLayout with sidebar
// Mobile: full-screen, dark theme, no nav — keyboard-aware with 100dvh + safe areas

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useAuth } from '../components/AuthProvider';
import AdminLayout from '../components/AdminLayout';

// ── Suggested quick-action prompts ──────────────────────────────
const SUGGESTIONS = [
  "What's on the schedule today?",
  "Availability tomorrow for Range IV?",
  "Send forms to [patient name]",
  "Look up [patient name]",
  "Send HBOT info to [patient]",
  "What did we charge [patient]?",
  "Add note to [patient]: ",
];

// ── Voice dictation hook ─────────────────────────────────────────
function useVoiceDictation({ onResult, onEnd }) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);
  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback(() => {
    if (!supported || listening) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.continuous = false;
    recog.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript || '';
      if (t) onResult(t);
    };
    recog.onend = () => { setListening(false); recogRef.current = null; onEnd?.(); };
    recog.onerror = () => { setListening(false); recogRef.current = null; };
    recogRef.current = recog;
    recog.start();
    setListening(true);
  }, [supported, listening, onResult, onEnd]);

  const stop = useCallback(() => { recogRef.current?.stop(); }, []);
  return { listening, supported, start, stop };
}

// ── Inline markdown renderer ─────────────────────────────────────
function renderMarkdown(text, dark) {
  if (!text) return null;
  return text.split('\n').map((line, li, arr) => {
    const parts = [];
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let last = 0, m;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      if (m[0].startsWith('**'))     parts.push(<strong key={m.index}>{m[2]}</strong>);
      else if (m[0].startsWith('*')) parts.push(<em key={m.index}>{m[3]}</em>);
      else parts.push(
        <code key={m.index} style={{
          background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
          borderRadius: 3, padding: '1px 5px', fontSize: 13,
        }}>{m[4]}</code>
      );
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return <span key={li}>{parts.length ? parts : line}{li < arr.length - 1 && '\n'}</span>;
  });
}

// ── Message bubble ───────────────────────────────────────────────
function MessageBubble({ msg, dark }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 8,
      padding: '0 4px',
    }}>
      <div style={{
        maxWidth: '82%',
        background: isUser
          ? (dark ? '#fff' : '#000')
          : (dark ? '#2a2a2a' : '#f3f4f6'),
        color: isUser
          ? (dark ? '#111' : '#fff')
          : (dark ? '#e8e8e8' : '#111'),
        borderRadius: isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
        padding: '11px 15px',
        fontSize: 15,
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxShadow: dark
          ? (isUser ? '0 1px 4px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.3)')
          : '0 1px 2px rgba(0,0,0,0.07)',
      }}>
        {isUser ? msg.content : renderMarkdown(msg.content, dark)}
      </div>
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────
function TypingIndicator({ dark }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8, padding: '0 4px' }}>
      <div style={{
        background: dark ? '#2a2a2a' : '#f3f4f6',
        borderRadius: '20px 20px 20px 5px',
        padding: '13px 18px',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 0.15, 0.3].map((delay, i) => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: dark ? '#666' : '#9ca3af',
            animation: 'bounce 1s infinite',
            animationDelay: `${delay}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Send icon ────────────────────────────────────────────────────
function SendIcon({ active, dark }) {
  const color = active ? (dark ? '#111' : '#fff') : (dark ? '#444' : '#9ca3af');
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Mic icon ─────────────────────────────────────────────────────
function MicIcon({ listening, dark }) {
  if (listening) {
    return (
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
    );
  }
  const c = dark ? '#888' : '#6b7280';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" fill={c} />
      <path d="M5 11a7 7 0 0014 0" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="22" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="22" x2="16" y2="22" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function StaffChat() {
  const { employee, session } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);
  const messagesRef = useRef([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Dark on mobile, light on desktop
  const dark = isMobile;

  const { listening, supported: voiceSupported, start: startListening, stop: stopListening } = useVoiceDictation({
    onResult: (transcript) => {
      setInput(transcript);
      setTimeout(() => sendMessage(transcript), 400);
    },
    onEnd: () => {},
  });

  useEffect(() => {
    if (employee && !hasGreeted.current) {
      hasGreeted.current = true;
      setMessages([{
        role: 'bot',
        content: `Hi ${employee.name.split(' ')[0]} 👋 What do you need?`,
        id: 'greeting',
      }]);
    }
  }, [employee]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (!isMobile) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isMobile]);

  const sendMessage = useCallback(async (text) => {
    const messageText = (text || input).trim();
    if (!messageText || sending) return;
    setInput('');
    setSending(true);

    const history = messagesRef.current
      .filter((m) => m.id !== 'greeting')
      .map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }))
      .slice(-10);

    setMessages((prev) => [...prev, { role: 'user', content: messageText, id: Date.now() }]);

    try {
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');
      const res = await fetch('/api/staff-bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ message: messageText, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMessages((prev) => [...prev, { role: 'bot', content: data.response, id: Date.now() + 1 }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'bot',
        content: `❌ ${err.message || 'Something went wrong. Please try again.'}`,
        id: Date.now() + 1,
      }]);
    } finally {
      setSending(false);
      if (!isMobile) setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, sending, session, isMobile]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    hasGreeted.current = false;
    setMessages([]);
    setTimeout(() => {
      hasGreeted.current = true;
      setMessages([{ role: 'bot', content: 'Chat cleared. What can I help you with?', id: Date.now() }]);
    }, 50);
  };

  const firstUserMsg = messages.filter((m) => m.role === 'user').length === 0;

  // ── Shared chat UI ───────────────────────────────────────────────
  const chatUI = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isMobile ? '100dvh' : 'calc(100vh - 48px)',
      width: '100%',
      maxWidth: isMobile ? '100%' : 680,
      margin: isMobile ? 0 : '0 auto',
      background: dark ? '#141414' : '#fff',
      borderRadius: isMobile ? 0 : 16,
      border: isMobile ? 'none' : '1px solid #e5e7eb',
      overflow: 'hidden',
      boxShadow: isMobile ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: isMobile ? '14px 16px 12px' : '14px 16px 12px',
        paddingTop: isMobile ? 'calc(14px + env(safe-area-inset-top))' : 14,
        borderBottom: `1px solid ${dark ? '#2a2a2a' : '#e5e7eb'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: dark ? '#1a1a1a' : '#fff',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: dark ? '#f0f0f0' : '#111', lineHeight: 1.2 }}>
            Range Assistant
          </div>
          {employee && (
            <div style={{ fontSize: 12, color: dark ? '#666' : '#6b7280', marginTop: 1 }}>
              {employee.name}{employee.title ? ` · ${employee.title}` : ''}
            </div>
          )}
        </div>
        <button
          onClick={clearChat}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: dark ? '#555' : '#9ca3af',
            fontSize: 13, padding: '4px 0',
          }}
        >
          Clear
        </button>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 10px 8px',
        WebkitOverflowScrolling: 'touch',
        background: dark ? '#141414' : '#fff',
      }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} dark={dark} />
        ))}
        {sending && <TypingIndicator dark={dark} />}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions (before first message) ── */}
      {firstUserMsg && (
        <div style={{
          padding: '0 10px 10px',
          display: 'flex',
          gap: 7,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          flexShrink: 0,
          background: dark ? '#141414' : '#fff',
          // Hide scrollbar
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                if (s.includes('[')) { setInput(s); inputRef.current?.focus(); }
                else sendMessage(s);
              }}
              style={{
                whiteSpace: 'nowrap',
                background: dark ? '#222' : '#f9fafb',
                border: `1px solid ${dark ? '#333' : '#e5e7eb'}`,
                borderRadius: 20,
                padding: '8px 14px',
                fontSize: 13,
                color: dark ? '#ccc' : '#374151',
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
        borderTop: `1px solid ${dark ? '#2a2a2a' : '#e5e7eb'}`,
        padding: '10px 12px',
        paddingBottom: isMobile ? 'calc(10px + env(safe-area-inset-bottom))' : 10,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        background: dark ? '#1a1a1a' : '#fff',
        flexShrink: 0,
      }}>
        {/* Mic button */}
        {voiceSupported && (
          <button
            onClick={listening ? stopListening : startListening}
            disabled={sending}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: listening ? '#ef4444' : (dark ? '#2a2a2a' : '#f3f4f6'),
              border: listening ? '2px solid #ef4444' : `1.5px solid ${dark ? '#333' : '#e5e7eb'}`,
              cursor: sending ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s',
              boxShadow: listening ? '0 0 0 4px rgba(239,68,68,0.2)' : 'none',
            }}
          >
            <MicIcon listening={listening} dark={dark} />
          </button>
        )}

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={listening ? '🎙 Listening…' : 'Ask anything…'}
          rows={1}
          style={{
            flex: 1,
            border: `1.5px solid ${listening ? '#ef4444' : (dark ? '#2e2e2e' : '#e5e7eb')}`,
            borderRadius: 22,
            padding: '11px 15px',
            // 16px minimum prevents iOS from zooming in on focus
            fontSize: 16,
            lineHeight: 1.4,
            background: dark ? '#222' : '#f9fafb',
            color: dark ? '#f0f0f0' : '#111',
            maxHeight: 120,
            overflowY: 'auto',
            resize: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
            WebkitAppearance: 'none',
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />

        {/* Send button */}
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: input.trim() && !sending
              ? (dark ? '#fff' : '#000')
              : (dark ? '#2a2a2a' : '#e5e7eb'),
            border: 'none',
            cursor: input.trim() && !sending ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          <SendIcon active={input.trim() && !sending} dark={dark} />
        </button>
      </div>
    </div>
  );

  // Mobile: full-screen, no AdminLayout
  if (isMobile) {
    return (
      <>
        <Head>
          <meta name="theme-color" content="#1a1a1a" />
        </Head>
        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-6px); }
          }
          textarea:focus { outline: none; box-shadow: none; }
          body { background: #141414; }
          ::-webkit-scrollbar { display: none; }
        `}</style>
        {chatUI}
      </>
    );
  }

  // Desktop: inside AdminLayout
  return (
    <AdminLayout title="Assistant" hideHeader={true}>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        textarea:focus { outline: none; }
      `}</style>
      {chatUI}
    </AdminLayout>
  );
}
