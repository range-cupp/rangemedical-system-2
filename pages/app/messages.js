// /pages/app/messages.js
// SMS conversations — Range Medical Employee App

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../../components/AppLayout';

export default function AppMessages() {
  const router = useRouter();
  const { patient_id: queryPatientId } = router.query;

  const [conversations, setConversations] = useState([]);
  const [activeThread, setActiveThread] = useState(null); // { patient_id, name, phone }
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [staff, setStaff] = useState(null);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const session = localStorage.getItem('staff_session');
    if (session) try { setStaff(JSON.parse(session)); } catch {}
    fetchConversations();
  }, []);

  // If patient_id in URL, open that thread
  useEffect(() => {
    if (queryPatientId && conversations.length > 0) {
      const conv = conversations.find(c => c.patient_id === queryPatientId);
      if (conv) openThread(conv);
    }
  }, [queryPatientId, conversations]);

  // Poll for new messages when thread is open
  useEffect(() => {
    if (activeThread) {
      pollRef.current = setInterval(() => fetchThread(activeThread.patient_id, false), 8000);
    } else {
      pollRef.current = setInterval(fetchConversations, 15000);
    }
    return () => clearInterval(pollRef.current);
  }, [activeThread]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/app/messages');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } finally {
      setLoadingList(false);
    }
  };

  const openThread = async (conv) => {
    const patient = conv.patients || {};
    const name = patient.first_name ? `${patient.first_name} ${patient.last_name}` : 'Patient';
    setActiveThread({ patient_id: conv.patient_id, name, phone: patient.phone });
    await fetchThread(conv.patient_id, true);
    // Remove unread badge from this conv
    setConversations(prev => prev.map(c =>
      c.patient_id === conv.patient_id ? { ...c, unread_count: 0 } : c
    ));
  };

  const fetchThread = async (patientId, showLoader = true) => {
    if (showLoader) setLoadingThread(true);
    try {
      const res = await fetch(`/api/app/messages?patient_id=${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } finally {
      setLoadingThread(false);
    }
  };

  const sendMessage = async () => {
    if (!draft.trim() || !activeThread || sending) return;
    const body = draft.trim();
    setSending(true);
    setDraft('');
    // Optimistic add
    const tempMsg = { id: 'temp-' + Date.now(), body, direction: 'outbound', sent_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    try {
      await fetch('/api/app/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: activeThread.patient_id,
          phone: activeThread.phone,
          message: body,
          staff_name: staff?.name,
        }),
      });
      await fetchThread(activeThread.patient_id, false);
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setDraft(body);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  // ── Thread view ──────────────────────────────────────────────────────────────
  if (activeThread) {
    return (
      <>
        <Head>
          <title>{activeThread.name} — Messages</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <link rel="manifest" href="/site.webmanifest" />
        </Head>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { height: 100%; background: #0f172a; }
          #__next { height: 100%; }
          .thread-shell {
            display: flex;
            flex-direction: column;
            height: 100dvh;
            background: #f8fafc;
            max-width: 480px;
            margin: 0 auto;
          }
          .thread-header {
            background: #0f172a;
            color: #fff;
            padding: 52px 16px 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
          }
          .thread-messages {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 16px 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .msg-bubble {
            max-width: 78%;
            padding: 10px 14px;
            border-radius: 0;
            font-size: 14px;
            line-height: 1.4;
            word-break: break-word;
          }
          .msg-out { align-self: flex-end; background: #0f172a; color: #fff; border-bottom-right-radius: 4px; }
          .msg-in  { align-self: flex-start; background: #fff; color: #0f172a; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
          .msg-time { font-size: 10px; color: #94a3b8; margin-top: 2px; }
          .msg-time-out { text-align: right; align-self: flex-end; }
          .msg-time-in  { text-align: left;  align-self: flex-start; }
          .thread-compose {
            background: #fff;
            border-top: 1px solid #e2e8f0;
            padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
            display: flex;
            gap: 10px;
            align-items: flex-end;
            flex-shrink: 0;
          }
          .compose-input {
            flex: 1;
            border: 1.5px solid #e2e8f0;
            border-radius: 0;
            padding: 10px 14px;
            font-size: 15px;
            outline: none;
            max-height: 120px;
            resize: none;
            -webkit-appearance: none;
            line-height: 1.4;
          }
          .compose-input:focus { border-color: #0f172a; }
          .send-btn {
            width: 40px; height: 40px;
            border-radius: 50%;
            background: #0f172a;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            -webkit-tap-highlight-color: transparent;
          }
          .send-btn:disabled { background: #e2e8f0; }
        `}</style>
        <div className="thread-shell">
          <div className="thread-header">
            <button
              onClick={() => { setActiveThread(null); setMessages([]); fetchConversations(); }}
              style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 15, fontWeight: 600, padding: 0, flexShrink: 0 }}
            >
              ‹ Back
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{activeThread.name}</div>
              {activeThread.phone && (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{activeThread.phone}</div>
              )}
            </div>
            {activeThread.phone && (
              <a href={`tel:${activeThread.phone}`} style={{ color: '#6366f1', fontSize: 22, textDecoration: 'none' }}>📞</a>
            )}
          </div>

          <div className="thread-messages">
            {loadingThread && messages.length === 0 ? (
              <div className="app-spinner" />
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '40px 0' }}>No messages yet</div>
            ) : (
              messages.map(msg => {
                const isOut = msg.direction === 'outbound';
                const timeStr = msg.sent_at
                  ? new Date(msg.sent_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'short', day: 'numeric' })
                  : '';
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className={`msg-bubble ${isOut ? 'msg-out' : 'msg-in'}`}>{msg.body}</div>
                    <div className={`msg-time ${isOut ? 'msg-time-out' : 'msg-time-in'}`}>{timeStr}</div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="thread-compose">
            <textarea
              className="compose-input"
              placeholder="Message…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              rows={1}
            />
            <button className="send-btn" onClick={sendMessage} disabled={!draft.trim() || sending}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Conversation list ────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Messages — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <style>{`
        .convo-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .convo-avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: #475569;
          flex-shrink: 0;
        }
        .convo-avatar.unread { background: #0f172a; color: #fff; }
        .convo-preview {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 13px;
          color: #94a3b8;
          margin-top: 2px;
        }
        .convo-preview.unread { color: #374151; font-weight: 500; }
        .convo-time { font-size: 11px; color: #94a3b8; flex-shrink: 0; }
      `}</style>

      <AppLayout title="Messages" unreadMessages={totalUnread}>
        {loadingList ? (
          <div className="app-spinner" />
        ) : conversations.length === 0 ? (
          <div className="app-empty">
            <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
            No conversations yet
          </div>
        ) : (
          <div style={{ background: '#fff' }}>
            {conversations.map(conv => {
              const patient = conv.patients || {};
              const name = patient.first_name ? `${patient.first_name} ${patient.last_name}` : 'Unknown';
              const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const isUnread = (conv.unread_count || 0) > 0;
              const preview = conv.direction === 'inbound' ? conv.body : `You: ${conv.body}`;
              const timeStr = conv.sent_at
                ? (() => {
                    const d = new Date(conv.sent_at);
                    const now = new Date();
                    const isToday = d.toDateString() === now.toDateString();
                    return isToday
                      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  })()
                : '';
              return (
                <div key={conv.patient_id} className="convo-item" onClick={() => openThread(conv)}>
                  <div className={`convo-avatar${isUnread ? ' unread' : ''}`}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontSize: 15, fontWeight: isUnread ? 700 : 500, color: '#0f172a' }}>{name}</div>
                      <div className="convo-time">{timeStr}</div>
                    </div>
                    <div className={`convo-preview${isUnread ? ' unread' : ''}`}>{preview}</div>
                  </div>
                  {isUnread && (
                    <span style={{ background: '#0f172a', color: '#fff', borderRadius: 0, minWidth: 20, height: 20, lineHeight: '20px', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '0 6px', flexShrink: 0 }}>
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AppLayout>
    </>
  );
}
