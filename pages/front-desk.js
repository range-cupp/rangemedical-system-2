// /pages/front-desk.js
// Range Medical Front Desk — unified workspace
// Panels: contact inbox | SMS conversation | staff assistant
// Top bar: walk-in patient search | Charge | Log Service
// Full screen — no AdminLayout, no sidebar nav

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useAuth } from '../components/AuthProvider';
import { loadStripe } from '@stripe/stripe-js';

const ConversationView = dynamic(() => import('../components/ConversationView'), { ssr: false });
const ServiceLogContent = dynamic(() => import('../components/ServiceLogContent'), { ssr: false });
const POSChargeModal    = dynamic(() => import('../components/POSChargeModal'),    { ssr: false });

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ── Helpers ───────────────────────────────────────────────────────
function avatarColor(name) {
  const palette = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#22c55e','#14b8a6','#3b82f6','#84cc16','#06b6d4'];
  let h = 0;
  for (const c of (name || 'X')) h = c.charCodeAt(0) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function initials(name) {
  const parts = (name || '?').trim().split(/\s+/);
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const SUGGESTIONS = [
  "What's on the schedule today?",
  "Book [patient] for Range IV",
  "What's [patient] currently on?",
  "Send forms to [patient]",
  "Send HBOT info to [patient]",
];

// ── Inline markdown ───────────────────────────────────────────────
function renderMd(text) {
  if (!text) return null;
  return text.split('\n').map((line, li, arr) => {
    const parts = []; const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
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
  const [t, setT] = useState('');
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', timeZone:'America/Los_Angeles' }));
    tick(); const id = setInterval(tick, 15000); return () => clearInterval(id);
  }, []);
  return t;
}

// ── Walk-in patient search (top bar) ──────────────────────────────
function WalkinSearch({ onSelect }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const to = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    clearTimeout(to.current);
    if (!q || q.length < 2) { setResults([]); return; }
    to.current = setTimeout(async () => {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults((data.patients || data || []).slice(0, 8));
      setOpen(true);
    }, 250);
  }, [q]);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '0 12px', gap: 8 }}>
        <span style={{ color: '#888', fontSize: 14 }}>🔍</span>
        <input
          value={q}
          onChange={e => { setQ(e.target.value); if (!e.target.value) setOpen(false); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search patient / walk-in..."
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontSize: 13, padding: '7px 0', width: '100%',
          }}
        />
        {q && <span style={{ color: '#888', cursor: 'pointer', fontSize: 16, lineHeight: 1 }} onClick={() => { setQ(''); setResults([]); setOpen(false); }}>×</span>}
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: '#fff', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          zIndex: 200, overflow: 'hidden',
        }}>
          {results.map(p => {
            const name = p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : (p.name || 'Unknown');
            const color = avatarColor(name);
            return (
              <div key={p.id} onClick={() => { onSelect({ id: p.id, name, phone: p.phone, ghl_contact_id: p.ghl_contact_id }); setQ(''); setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {initials(name).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{name}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{p.phone || p.email || 'No contact info'}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Inbox sidebar ─────────────────────────────────────────────────
function InboxSidebar({ selected, onSelect }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newSearch, setNewSearch] = useState('');
  const [newResults, setNewResults] = useState([]);
  const searchTO = useRef(null);

  useEffect(() => {
    fetch('/api/admin/conversations?days=90&limit=200')
      .then(r => r.json())
      .then(d => setContacts((d.conversations || []).map(c => ({
        id: c.patient_id || null,
        name: c.patient_name || c.recipient || 'Unknown',
        phone: c.recipient || null,
        ghl_contact_id: c.ghl_contact_id || null,
        lastMessage: c.last_message_at,
        preview: (c.last_message || '').slice(0, 60),
        direction: c.last_direction,
        unread: c.unread_count || 0,
      }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    clearTimeout(searchTO.current);
    if (!newSearch || newSearch.length < 2) { setNewResults([]); return; }
    searchTO.current = setTimeout(async () => {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(newSearch)}`);
      const data = await res.json();
      setNewResults((data.patients || data || []).slice(0, 8).map(p => ({
        id: p.id, phone: p.phone,
        name: p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : (p.name || 'Unknown'),
      })));
    }, 300);
  }, [newSearch]);

  const filtered = contacts.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const isSelected = (c) => selected && (selected.id ? selected.id === c.id : selected.phone === c.phone);

  return (
    <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#f7f8fa', borderRight: '1px solid #e8eaed', height: '100%' }}>
      {/* Search + new */}
      <div style={{ padding: '12px 10px 8px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter conversations..."
          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e0e0e0', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', background: '#fff', color: '#333' }}
        />
        <button
          onClick={() => { setShowNew(!showNew); setNewSearch(''); setNewResults([]); }}
          style={{ width: '100%', marginTop: 6, padding: '7px 0', background: showNew ? '#333' : '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          {showNew ? '↑ Cancel' : '+ New Conversation'}
        </button>
      </div>

      {/* New conversation search */}
      {showNew && (
        <div style={{ padding: '0 10px 8px', borderBottom: '1px solid #e8eaed' }}>
          <input autoFocus value={newSearch} onChange={e => setNewSearch(e.target.value)}
            placeholder="Search patient name..."
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #6366f1', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', background: '#fff' }} />
          {newResults.map(p => (
            <div key={p.id || p.phone} onClick={() => { onSelect(p); setShowNew(false); setNewSearch(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', cursor: 'pointer', borderRadius: 6 }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: avatarColor(p.name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                {initials(p.name).toUpperCase()}
              </div>
              <div style={{ fontSize: 12, color: '#333', fontWeight: 500 }}>{p.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Contact list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#aaa' }}>Loading…</div>}
        {!loading && filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#bbb' }}>No conversations</div>}
        {filtered.map(c => {
          const sel = isSelected(c);
          const color = avatarColor(c.name);
          return (
            <div key={c.id || c.phone}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #eff0f1', background: sel ? '#fff' : 'transparent', borderLeft: sel ? '3px solid #6366f1' : '3px solid transparent', transition: 'background 0.1s' }}
              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#eff1f3'; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
              onClick={() => {
                if (c.unread > 0) setContacts(prev => prev.map(x => (x.id === c.id && x.phone === c.phone) ? { ...x, unread: 0 } : x));
                onSelect(c);
              }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                  {initials(c.name).toUpperCase()}
                </div>
                {c.unread > 0 && (
                  <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #f7f8fa' }}>
                    {c.unread > 9 ? '9+' : c.unread}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: c.unread > 0 ? 700 : 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{c.name}</span>
                  <span style={{ fontSize: 10, color: '#bbb', flexShrink: 0 }}>{timeAgo(c.lastMessage)}</span>
                </div>
                <div style={{ fontSize: 11, color: c.unread > 0 ? '#555' : '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.direction === 'inbound' ? '' : '↗ '}{c.preview || 'No messages yet'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Bot panel ─────────────────────────────────────────────────────
function BotPanel({ session, employee, selectedPatient }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesRef = useRef([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);
  const prevPatientRef = useRef(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (employee && !hasGreeted.current) {
      hasGreeted.current = true;
      setMessages([{ role: 'bot', content: `Hi ${employee.name.split(' ')[0]} 👋 What do you need?`, id: 'greeting' }]);
    }
  }, [employee]);

  // Drop a context note when the patient changes
  useEffect(() => {
    const prev = prevPatientRef.current;
    if (selectedPatient && selectedPatient.id !== prev?.id) {
      prevPatientRef.current = selectedPatient;
      setMessages(msgs => [...msgs, { role: 'bot', content: `📋 Now viewing: **${selectedPatient.name}**`, id: `ctx-${selectedPatient.id || selectedPatient.phone}`, isContext: true }]);
    } else if (!selectedPatient && prev) {
      prevPatientRef.current = null;
    }
  }, [selectedPatient]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    const patientCtx = selectedPatient
      ? [
          { role: 'user', content: `[Context] Patient currently on screen: ${selectedPatient.name}${selectedPatient.phone ? ` (${selectedPatient.phone})` : ''}. Use as default patient unless I specify someone else.` },
          { role: 'assistant', content: `Got it — I have ${selectedPatient.name.split(' ')[0]} in context.` },
        ]
      : [];

    const history = [
      ...patientCtx,
      ...messagesRef.current
        .filter(m => m.id !== 'greeting' && !m.isContext)
        .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }))
        .slice(-8),
    ];

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
  }, [input, sending, session, selectedPatient]);

  const firstUser = messages.filter(m => m.role === 'user').length === 0;
  const color = selectedPatient ? avatarColor(selectedPatient.name) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fafbff', borderLeft: '1px solid #e8eaed' }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #e8eaed', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: selectedPatient ? 6 : 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111', letterSpacing: 0.3 }}>✦ Range Assistant</span>
          <span style={{ fontSize: 10, color: '#bbb' }}>AI-powered</span>
        </div>
        {selectedPatient && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: color + '15', borderRadius: 20, width: 'fit-content' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>
              {initials(selectedPatient.name).toUpperCase()}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: color }}>{selectedPatient.name}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(m => {
          if (m.isContext) return (
            <div key={m.id} style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#aaa', background: '#f0f0f0', borderRadius: 10, padding: '2px 10px' }}>{renderMd(m.content)}</span>
            </div>
          );
          return (
            <div key={m.id} style={m.role === 'user' ? {
              alignSelf: 'flex-end', background: '#111', color: '#fff',
              borderRadius: '14px 14px 3px 14px', padding: '8px 12px',
              maxWidth: '82%', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
            } : {
              alignSelf: 'flex-start', background: '#fff', color: '#111',
              borderRadius: '14px 14px 14px 3px', padding: '8px 12px',
              maxWidth: '90%', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              border: '1px solid #e8eaed', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
            }}>
              {renderMd(m.content)}
            </div>
          );
        })}
        {sending && (
          <div style={{ alignSelf: 'flex-start', background: '#fff', border: '1px solid #e8eaed', borderRadius: '14px 14px 14px 3px', padding: '8px 14px' }}>
            <span style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#ccc', display: 'inline-block', animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {firstUser && (
        <div style={{ padding: '6px 12px 2px', display: 'flex', flexWrap: 'wrap', gap: 5, borderTop: '1px solid #f0f0f0' }}>
          {SUGGESTIONS.map(sugg => (
            <button key={sugg} onClick={() => { if (sugg.includes('[')) { setInput(sugg); inputRef.current?.focus(); } else sendMessage(sugg); }}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 12, border: '1px solid #e0e0e0', background: '#fff', color: '#555', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {sugg}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 10px', borderTop: '1px solid #e8eaed', background: '#fff', alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'; }}
          placeholder="Ask the assistant…"
          style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 10, padding: '8px 10px', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, background: '#f7f8fa' }}
        />
        <button onClick={() => sendMessage()}
          style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: input.trim() && !sending ? '#111' : '#e0e0e0', color: input.trim() && !sending ? '#fff' : '#aaa', cursor: input.trim() && !sending ? 'pointer' : 'default', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
          ↑
        </button>
      </div>
    </div>
  );
}

// ── Patient info banner (walk-in / no conversation yet) ───────────
function PatientBanner({ patient, onCharge, onLog, onDismiss }) {
  const color = avatarColor(patient.name);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', padding: 40, gap: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,.08)', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: color, color: '#fff', fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          {initials(patient.name).toUpperCase()}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 4 }}>{patient.name}</div>
        {patient.phone && <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{patient.phone}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onCharge} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>$ Charge</button>
          <button onClick={onLog} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✎ Log Service</button>
          <button onClick={onDismiss} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', color: '#555', fontSize: 13, cursor: 'pointer' }}>Dismiss</button>
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: '#aaa' }}>
          Ask the assistant about this patient →
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function FrontDesk() {
  const { employee, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const clock = useClock();

  const [selectedPatient, setSelectedPatient]     = useState(null); // from inbox
  const [walkinPatient,   setWalkinPatient]        = useState(null); // from top search
  const [showCharge,      setShowCharge]           = useState(false);
  const [showLog,         setShowLog]              = useState(false);

  useEffect(() => {
    if (!authLoading && !employee) router.push('/login');
  }, [authLoading, employee, router]);

  if (authLoading || !employee) return null;

  // Active patient for context: prefer the one selected in the inbox, fall back to walk-in
  const activePatient = selectedPatient || walkinPatient;

  const handleWalkin = (p) => {
    setWalkinPatient(p);
    setSelectedPatient(null); // clear inbox selection so the banner shows
  };

  return (
    <>
      <Head>
        <title>Front Desk — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#111111" />
        <style>{`
          body { margin: 0; background: #111; }
          * { box-sizing: border-box; }
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-5px); }
          }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        `}</style>
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#fff', overflow: 'hidden' }}>

        {/* ── Top bar ── */}
        <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', background: '#111', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: 1, whiteSpace: 'nowrap', marginRight: 4 }}>RM</span>
          <WalkinSearch onSelect={handleWalkin} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
            <button onClick={() => setShowCharge(true)}
              style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#059669', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              $ Charge
            </button>
            <button onClick={() => setShowLog(true)}
              style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ✎ Log Service
            </button>
            <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap', marginLeft: 4 }}>{employee.name.split(' ')[0]}</span>
            <span style={{ fontSize: 11, color: '#666', minWidth: 50, textAlign: 'right' }}>{clock}</span>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Inbox sidebar */}
          <InboxSidebar selected={selectedPatient} onSelect={p => { setSelectedPatient(p); setWalkinPatient(null); }} />

          {/* Center: conversation or patient banner */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {selectedPatient ? (
              <ConversationView
                key={selectedPatient.id || selectedPatient.phone}
                patientId={selectedPatient.id}
                patientName={selectedPatient.name}
                patientPhone={selectedPatient.phone}
                ghlContactId={selectedPatient.ghl_contact_id}
                onBack={() => setSelectedPatient(null)}
              />
            ) : walkinPatient ? (
              <PatientBanner
                patient={walkinPatient}
                onCharge={() => setShowCharge(true)}
                onLog={() => setShowLog(true)}
                onDismiss={() => setWalkinPatient(null)}
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ccc', gap: 10, background: '#fafafa' }}>
                <div style={{ fontSize: 40, opacity: 0.4 }}>💬</div>
                <div style={{ fontSize: 14, color: '#bbb', fontWeight: 500 }}>Select a conversation</div>
                <div style={{ fontSize: 12, color: '#ccc' }}>or search a patient to look them up</div>
              </div>
            )}
          </div>

          {/* Bot panel */}
          <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <BotPanel session={session} employee={employee} selectedPatient={activePatient} />
          </div>
        </div>
      </div>

      {/* ── Charge modal ── */}
      {showCharge && (
        <POSChargeModal
          isOpen={showCharge}
          onClose={() => setShowCharge(false)}
          patient={activePatient ? {
            id: activePatient.id,
            first_name: activePatient.name?.split(' ')[0],
            last_name: activePatient.name?.split(' ').slice(1).join(' '),
            phone: activePatient.phone,
          } : null}
          stripePromise={stripePromise}
          onChargeComplete={() => setShowCharge(false)}
        />
      )}

      {/* ── Log service modal ── */}
      {showLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowLog(false); }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '92%', maxWidth: 920, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.22)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e8e8e8', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Log Service</span>
              <button onClick={() => setShowLog(false)} style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: 7, padding: '5px 14px', cursor: 'pointer', fontSize: 13, color: '#555' }}>Close</button>
            </div>
            <ServiceLogContent />
          </div>
        </div>
      )}
    </>
  );
}
