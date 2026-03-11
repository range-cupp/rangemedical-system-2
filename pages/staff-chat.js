// /pages/staff-chat.js
// Range Medical Staff Chat — natural language interface to the CRM
// Mobile-optimized. Accessible at app.range-medical.com/staff-chat
// Add to iPhone home screen for app-like experience.

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';

// ── Suggested quick-action prompts ──────────────────────────────
const SUGGESTIONS = [
  "What's on the schedule today?",
  "Is there availability tomorrow for a Range IV?",
  "Look up [patient name]",
  "What did we charge [patient name]?",
  "Add note to [patient name]: ",
  "Create task for [staff]: ",
];

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
  const { employee, session, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !employee) {
      router.push('/admin');
    }
  }, [loading, employee, router]);

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

  const sendMessage = useCallback(async (text) => {
    const messageText = (text || input).trim();
    if (!messageText || sending) return;

    setInput('');
    setError('');
    setSending(true);

    // Add user message immediately
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

      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

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

  // Send on Enter (not Shift+Enter)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: '#9ca3af', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <>
      <Head>
        <title>Staff Chat — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RM Chat" />
        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-5px); }
          }
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; background: #fff; }
          textarea { resize: none; font-family: inherit; }
          textarea:focus { outline: none; }
        `}</style>
      </Head>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        maxWidth: 640,
        margin: '0 auto',
        background: '#fff',
        position: 'relative',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.push('/admin/command-center')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 8px 4px 0', color: '#6b7280', fontSize: 14,
              }}
            >
              ← Back
            </button>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>
                Range Assistant
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {employee.name} · {employee.title || 'Staff'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
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
            }}
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
        {messages.filter((m) => m.role === 'user').length === 0 && (
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
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything…"
            rows={1}
            style={{
              flex: 1,
              border: '1.5px solid #e5e7eb',
              borderRadius: 22,
              padding: '10px 14px',
              fontSize: 15,
              lineHeight: 1.4,
              background: '#f9fafb',
              color: '#111',
              maxHeight: 120,
              overflowY: 'auto',
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
    </>
  );
}
