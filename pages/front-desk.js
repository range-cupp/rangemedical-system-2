// /pages/front-desk.js
// Range Medical Front Desk — unified workspace
// Three panels: contact list | SMS conversation | staff assistant
// Quick-action top bar: Charge (POS) | Log Service
// Full screen — no AdminLayout, no sidebar nav

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useAuth } from '../components/AuthProvider';
import { loadStripe } from '@stripe/stripe-js';

const ConversationView = dynamic(() => import('../components/ConversationView'), { ssr: false });
const ServiceLogContent = dynamic(() => import('../components/ServiceLogContent'), { ssr: false });
const POSChargeModal = dynamic(() => import('../components/POSChargeModal'), { ssr: false });

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ── Bot quick-action suggestions ─────────────────────────────────
const SUGGESTIONS = [
  "What's on the schedule today?",
  "Look up [patient name]",
  "Send forms to [patient name]",
  "Book [patient] for Range IV",
  "What's [patient] currently on?",
  "Send HBOT info to [patient]",
];

// ── Inline markdown renderer ──────────────────────────────────────
function renderMd(text) {
  if (!text) return null;
  return text.split('\n').map((line, li, arr) => {
    const parts = [];
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let last = 0, m;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      if (m[0].startsWith('**'))     parts.push(<strong key={m.index}>{m[2]}</strong>);
      else if (m[0].startsWith('*')) parts.push(<em key={m.index}>{m[3]}</em>);
      else parts.push(<code key={m.index} style={{ background:'rgba(0,0,0,.07)', borderRadius:3, padding:'1px 5px', fontSize:12 }}>{m[4]}</code>);
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return <span key={li}>{parts.length ? parts : line}{li < arr.length - 1 && '\n'}</span>;
  });
}

// ── Live clock ────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
    }));
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ── Bot panel ─────────────────────────────────────────────────────
function BotPanel({ session, employee }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesRef = useRef([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (employee && !hasGreeted.current) {
      hasGreeted.current = true;
      setMessages([{ role: 'bot', content: `Hi ${employee.name.split(' ')[0]} 👋 What do you need?`, id: 'greeting' }]);
    }
  }, [employee]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    const history = messagesRef.current
      .filter(m => m.id !== 'greeting')
      .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }))
      .slice(-10);

    setMessages(prev => [...prev, { role: 'user', content: msg, id: Date.now() }]);

    try {
      const res = await fetch('/api/staff-bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMessages(prev => [...prev, { role: 'bot', content: data.response, id: Date.now() + 1 }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: `❌ ${err.message}`, id: Date.now() + 1 }]);
    } finally {
      setSending(false);
    }
  }, [input, sending, session]);

  const s = {
    panel: {
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#fff', borderLeft: '1px solid #e8e8e8',
    },
    header: {
      padding: '12px 16px', borderBottom: '1px solid #e8e8e8',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#fafafa',
    },
    title: { fontSize: 13, fontWeight: 600, color: '#111', letterSpacing: 0.2 },
    msgs: { flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
    userBubble: {
      alignSelf: 'flex-end', background: '#111', color: '#fff',
      borderRadius: '16px 16px 4px 16px', padding: '8px 12px',
      maxWidth: '80%', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
    },
    botBubble: {
      alignSelf: 'flex-start', background: '#f2f2f2', color: '#111',
      borderRadius: '16px 16px 16px 4px', padding: '8px 12px',
      maxWidth: '88%', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
    },
    suggs: {
      padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: 6,
      borderTop: '1px solid #f0f0f0',
    },
    suggBtn: {
      fontSize: 11, padding: '4px 10px', borderRadius: 12,
      border: '1px solid #e0e0e0', background: '#fafafa',
      color: '#555', cursor: 'pointer', whiteSpace: 'nowrap',
    },
    inputRow: {
      display: 'flex', gap: 8, padding: '10px 12px',
      borderTop: '1px solid #e8e8e8', background: '#fff',
    },
    textarea: {
      flex: 1, border: '1px solid #ddd', borderRadius: 8,
      padding: '8px 10px', fontSize: 14, resize: 'none',
      outline: 'none', fontFamily: 'inherit', lineHeight: 1.4,
    },
    sendBtn: (active) => ({
      width: 36, height: 36, borderRadius: '50%', border: 'none',
      background: active ? '#111' : '#e0e0e0', color: active ? '#fff' : '#999',
      cursor: active ? 'pointer' : 'default', fontSize: 16,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, alignSelf: 'flex-end',
      transition: 'background 0.15s',
    }),
  };

  const firstUser = messages.filter(m => m.role === 'user').length === 0;

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <span style={s.title}>✦ Range Assistant</span>
        <span style={{ fontSize: 11, color: '#999' }}>Ask anything about patients, schedule, services</span>
      </div>

      <div style={s.msgs}>
        {messages.map(m => (
          <div key={m.id} style={m.role === 'user' ? s.userBubble : s.botBubble}>
            {renderMd(m.content)}
          </div>
        ))}
        {sending && (
          <div style={s.botBubble}>
            <span style={{ color: '#999', fontSize: 12 }}>Thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {firstUser && (
        <div style={s.suggs}>
          {SUGGESTIONS.map(sugg => (
            <button key={sugg} style={s.suggBtn}
              onClick={() => {
                if (sugg.includes('[')) { setInput(sugg); inputRef.current?.focus(); }
                else sendMessage(sugg);
              }}>
              {sugg}
            </button>
          ))}
        </div>
      )}

      <div style={s.inputRow}>
        <textarea
          ref={inputRef}
          rows={1}
          style={s.textarea}
          placeholder="Ask the assistant…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }}
        />
        <button style={s.sendBtn(!!input.trim() && !sending)} onClick={() => sendMessage()}>↑</button>
      </div>
    </div>
  );
}

// ── Inbox sidebar ─────────────────────────────────────────────────
function InboxSidebar({ selected, onSelect, session }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [newSearch, setNewSearch] = useState('');
  const [newResults, setNewResults] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const searchTO = useRef(null);

  useEffect(() => {
    fetch('/api/admin/conversations?days=90&limit=200')
      .then(r => r.json())
      .then(d => {
        const convos = (d.conversations || []).map(c => ({
          id: c.patient_id || null,
          name: c.patient_name || c.recipient || 'Unknown',
          phone: c.recipient || null,
          ghl_contact_id: c.ghl_contact_id || null,
          lastMessage: c.last_message_at,
          preview: (c.last_message || '').slice(0, 60),
          direction: c.last_direction,
          unread: c.unread_count || 0,
        }));
        setContacts(convos);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Search for new patient to start conversation
  useEffect(() => {
    clearTimeout(searchTO.current);
    if (!newSearch || newSearch.length < 2) { setNewResults([]); return; }
    searchTO.current = setTimeout(async () => {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(newSearch)}`);
      const data = await res.json();
      setNewResults((data.patients || data || []).slice(0, 8).map(p => ({
        id: p.id,
        name: p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name,
        phone: p.phone,
      })));
    }, 300);
  }, [newSearch]);

  const filtered = contacts.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const s = {
    sidebar: {
      width: 220, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: '#fafafa', borderRight: '1px solid #e8e8e8',
      height: '100%',
    },
    sidebarTop: { padding: '10px 10px 6px', borderBottom: '1px solid #e8e8e8' },
    searchInput: {
      width: '100%', boxSizing: 'border-box',
      border: '1px solid #e0e0e0', borderRadius: 7,
      padding: '6px 10px', fontSize: 13, outline: 'none',
      background: '#fff',
    },
    newBtn: {
      width: '100%', marginTop: 6, padding: '6px 0',
      background: '#111', color: '#fff', border: 'none',
      borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500,
    },
    list: { flex: 1, overflowY: 'auto' },
    item: (sel) => ({
      padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
      background: sel ? '#f0f0f0' : 'transparent',
      borderLeft: sel ? '3px solid #111' : '3px solid transparent',
    }),
    name: { fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 },
    preview: { fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    unread: {
      display: 'inline-block', background: '#ef4444', color: '#fff',
      borderRadius: 10, fontSize: 10, padding: '1px 6px', marginLeft: 6,
    },
    newPanel: { padding: '10px 10px 6px', borderBottom: '1px solid #e8e8e8' },
    newInput: {
      width: '100%', boxSizing: 'border-box',
      border: '1px solid #e0e0e0', borderRadius: 7,
      padding: '6px 10px', fontSize: 13, outline: 'none', background: '#fff',
    },
    newResult: {
      padding: '7px 12px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
      fontSize: 12, color: '#333',
    },
  };

  return (
    <div style={s.sidebar}>
      <div style={s.sidebarTop}>
        <input style={s.searchInput} placeholder="Search conversations…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <button style={s.newBtn} onClick={() => { setShowNew(!showNew); setNewSearch(''); setNewResults([]); }}>
          + New Conversation
        </button>
      </div>

      {showNew && (
        <div style={s.newPanel}>
          <input style={s.newInput} autoFocus placeholder="Search patient…"
            value={newSearch} onChange={e => setNewSearch(e.target.value)} />
          {newResults.map(p => (
            <div key={p.id} style={s.newResult}
              onClick={() => { onSelect(p); setShowNew(false); setNewSearch(''); }}>
              {p.name}
              <span style={{ color: '#aaa', marginLeft: 6, fontSize: 11 }}>{p.phone}</span>
            </div>
          ))}
        </div>
      )}

      <div style={s.list}>
        {loading && <div style={{ padding: 16, fontSize: 12, color: '#999', textAlign: 'center' }}>Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 16, fontSize: 12, color: '#aaa', textAlign: 'center' }}>No conversations</div>
        )}
        {filtered.map(c => (
          <div key={c.id || c.phone} style={s.item(selected?.id === c.id && selected?.phone === c.phone)}
            onClick={() => onSelect(c)}>
            <div style={s.name}>
              {c.name}
              {c.unread > 0 && <span style={s.unread}>{c.unread}</span>}
            </div>
            <div style={s.preview}>
              {c.direction === 'inbound' ? '← ' : '→ '}{c.preview || 'No messages yet'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function FrontDesk() {
  const { employee, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const clock = useClock();

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showCharge, setShowCharge] = useState(false);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    if (!authLoading && !employee) router.push('/login');
  }, [authLoading, employee, router]);

  if (authLoading || !employee) return null;

  const s = {
    root: { display: 'flex', flexDirection: 'column', height: '100dvh', background: '#fff', overflow: 'hidden' },
    topBar: {
      height: 48, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', borderBottom: '1px solid #e8e8e8',
      background: '#111', color: '#fff',
    },
    logo: { fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: '#fff' },
    topRight: { display: 'flex', alignItems: 'center', gap: 10 },
    staffName: { fontSize: 12, color: '#aaa' },
    clockEl: { fontSize: 12, color: '#888', minWidth: 60, textAlign: 'right' },
    actionBtn: (color) => ({
      padding: '5px 14px', borderRadius: 6, border: 'none',
      background: color, color: '#fff', fontSize: 12, fontWeight: 600,
      cursor: 'pointer', letterSpacing: 0.3,
    }),
    body: { flex: 1, display: 'flex', overflow: 'hidden' },
    convPanel: { flex: 1, display: 'flex', overflow: 'hidden' },
    emptyConv: {
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#bbb', fontSize: 13, gap: 8,
    },
    botCol: { width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    modalOverlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    },
    logModal: {
      background: '#fff', borderRadius: 12, width: '90%', maxWidth: 900,
      maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    logHeader: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', borderBottom: '1px solid #e8e8e8', position: 'sticky', top: 0, background: '#fff',
    },
    closeBtn: {
      background: 'none', border: '1px solid #ddd', borderRadius: 6,
      padding: '4px 12px', cursor: 'pointer', fontSize: 13, color: '#555',
    },
  };

  return (
    <>
      <Head>
        <title>Front Desk — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#111111" />
      </Head>

      <div style={s.root}>
        {/* ── Top bar ── */}
        <div style={s.topBar}>
          <span style={s.logo}>RANGE MEDICAL  ·  FRONT DESK</span>
          <div style={s.topRight}>
            <button style={s.actionBtn('#059669')} onClick={() => setShowCharge(true)}>
              $ Charge
            </button>
            <button style={s.actionBtn('#6366f1')} onClick={() => setShowLog(true)}>
              ✎ Log Service
            </button>
            <span style={s.staffName}>{employee.name}</span>
            <span style={s.clockEl}>{clock}</span>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={s.body}>
          {/* Left: contact list + conversation */}
          <div style={s.convPanel}>
            <InboxSidebar
              selected={selectedPatient}
              onSelect={setSelectedPatient}
              session={session}
            />
            {selectedPatient ? (
              <ConversationView
                key={selectedPatient.id || selectedPatient.phone}
                patientId={selectedPatient.id}
                patientName={selectedPatient.name}
                patientPhone={selectedPatient.phone}
                ghlContactId={selectedPatient.ghl_contact_id}
                onBack={() => setSelectedPatient(null)}
              />
            ) : (
              <div style={s.emptyConv}>
                <div style={{ fontSize: 32 }}>💬</div>
                <div>Select a conversation or start a new one</div>
                <div style={{ fontSize: 11, color: '#ccc' }}>Messages from Blooio + Twilio appear here</div>
              </div>
            )}
          </div>

          {/* Right: assistant */}
          <div style={s.botCol}>
            <BotPanel session={session} employee={employee} />
          </div>
        </div>
      </div>

      {/* ── Charge modal ── */}
      {showCharge && (
        <POSChargeModal
          isOpen={showCharge}
          onClose={() => setShowCharge(false)}
          patient={selectedPatient ? {
            id: selectedPatient.id,
            first_name: selectedPatient.name?.split(' ')[0],
            last_name: selectedPatient.name?.split(' ').slice(1).join(' '),
            phone: selectedPatient.phone,
          } : null}
          stripePromise={stripePromise}
          onChargeComplete={() => setShowCharge(false)}
        />
      )}

      {/* ── Service log modal ── */}
      {showLog && (
        <div style={s.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowLog(false); }}>
          <div style={s.logModal}>
            <div style={s.logHeader}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Log Service</span>
              <button style={s.closeBtn} onClick={() => setShowLog(false)}>Close</button>
            </div>
            <ServiceLogContent />
          </div>
        </div>
      )}
    </>
  );
}
