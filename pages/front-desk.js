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
// ── Collapsible section header ─────────────────────────────────────
function SidebarSection({ title, icon, count, badge, expanded, onToggle, children }) {
  return (
    <div style={{ borderBottom: '1px solid #e8eaed' }}>
      <div onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', cursor: 'pointer', userSelect: 'none' }}
        onMouseEnter={e => e.currentTarget.style.background = '#eff1f3'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <span style={{ fontSize: 10, color: '#999', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>▶</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: 0.3 }}>{icon} {title}</span>
        {count > 0 && (
          <span style={{ fontSize: 9, fontWeight: 700, color: badge === 'red' ? '#fff' : '#666', background: badge === 'red' ? '#ef4444' : '#e8eaed', borderRadius: 10, padding: '1px 6px', marginLeft: 'auto' }}>
            {count}
          </span>
        )}
      </div>
      {expanded && children}
    </div>
  );
}

// ── Today's Schedule section ──────────────────────────────────────
function TodaySchedule({ onSelectPatient }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    fetch(`/api/app/schedule?date=${today}&days=1`)
      .then(r => r.json())
      .then(data => {
        const appts = data.appointments || [];
        // Sort by start_time
        appts.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        setAppointments(appts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '8px 14px', fontSize: 11, color: '#aaa' }}>Loading…</div>;
  if (appointments.length === 0) return <div style={{ padding: '8px 14px', fontSize: 11, color: '#bbb' }}>No appointments today</div>;

  return (
    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
      {appointments.map(a => {
        const time = new Date(a.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
        const patientName = a.patients ? `${a.patients.first_name || ''} ${a.patients.last_name || ''}`.trim() : (a.patient_name || 'Unknown');
        const statusColors = { checked_in: '#22c55e', confirmed: '#3b82f6', scheduled: '#f59e0b', rescheduled: '#f97316' };
        const dotColor = statusColors[a.status] || '#ccc';
        return (
          <div key={a.id}
            onClick={() => {
              const pid = a.patient_id || a.patients?.id;
              if (pid) onSelectPatient({ id: pid, name: patientName, phone: a.patients?.phone });
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 11 }}
            onMouseEnter={e => e.currentTarget.style.background = '#eff1f3'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: '#333', minWidth: 48, flexShrink: 0 }}>{time}</span>
            <span style={{ color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {patientName}
            </span>
            <span style={{ color: '#aaa', fontSize: 10, flexShrink: 0, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.event_type_title || a.title || ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── My Tasks section ──────────────────────────────────────────────
function MyTasks({ employeeId, onSelectPatient }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(() => {
    if (!employeeId) return;
    fetch(`/api/admin/tasks?filter=my&status=pending&employee_id=${employeeId}`)
      .then(r => r.json())
      .then(data => setTasks(data.tasks || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employeeId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const completeTask = async (e, taskId) => {
    e.stopPropagation();
    await fetch('/api/admin/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: 'completed' }),
    });
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  if (loading) return <div style={{ padding: '8px 14px', fontSize: 11, color: '#aaa' }}>Loading…</div>;
  if (tasks.length === 0) return <div style={{ padding: '8px 14px', fontSize: 11, color: '#bbb' }}>No pending tasks</div>;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
      {tasks.map(t => {
        const overdue = t.due_date && t.due_date < today;
        const dueToday = t.due_date === today;
        const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
        return (
          <div key={t.id}
            onClick={() => {
              if (t.patient_id) onSelectPatient({ id: t.patient_id, name: t.patient_name || 'Patient' });
            }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '6px 10px 6px 14px', cursor: t.patient_id ? 'pointer' : 'default', fontSize: 11 }}
            onMouseEnter={e => e.currentTarget.style.background = '#eff1f3'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <button onClick={(e) => completeTask(e, t.id)}
              style={{ width: 14, height: 14, borderRadius: 3, border: '1.5px solid #ccc', background: 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 1, padding: 0 }}
              title="Complete task" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: priorityColors[t.priority] || '#ccc', flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
              </div>
              {(t.patient_name || t.due_date) && (
                <div style={{ fontSize: 10, color: overdue ? '#ef4444' : dueToday ? '#f59e0b' : '#999', marginTop: 1 }}>
                  {t.patient_name && <span>{t.patient_name}</span>}
                  {t.patient_name && t.due_date && <span> · </span>}
                  {t.due_date && <span>{overdue ? 'Overdue' : dueToday ? 'Due today' : `Due ${new Date(t.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Sidebar with Schedule, Tasks, and Conversations ───────────────
function InboxSidebar({ selected, onSelect, employeeId }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newSearch, setNewSearch] = useState('');
  const [newResults, setNewResults] = useState([]);
  const searchTO = useRef(null);

  // Section collapse state — schedule and tasks open by default
  const [showSchedule, setShowSchedule] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showConversations, setShowConversations] = useState(true);

  // Schedule + task counts for badges
  const [scheduleCount, setScheduleCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

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

  // Fetch counts for badges
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    fetch(`/api/app/schedule?date=${today}&days=1`)
      .then(r => r.json())
      .then(data => setScheduleCount((data.appointments || []).length))
      .catch(() => {});
    if (employeeId) {
      fetch(`/api/admin/unread-tasks?employee_id=${employeeId}`)
        .then(r => r.json())
        .then(data => setTaskCount(data.count || 0))
        .catch(() => {});
    }
  }, [employeeId]);

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

  const unreadCount = contacts.filter(c => c.unread > 0).length;
  const filtered = contacts.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const isSelected = (c) => selected && (selected.id ? selected.id === c.id : selected.phone === c.phone);

  return (
    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#f7f8fa', borderRight: '1px solid #e8eaed', height: '100%' }}>

      {/* Today's Schedule */}
      <SidebarSection title="TODAY" icon="📅" count={scheduleCount} expanded={showSchedule} onToggle={() => setShowSchedule(!showSchedule)}>
        <TodaySchedule onSelectPatient={onSelect} />
      </SidebarSection>

      {/* My Tasks */}
      <SidebarSection title="TASKS" icon="✅" count={taskCount} badge={taskCount > 0 ? 'red' : null} expanded={showTasks} onToggle={() => setShowTasks(!showTasks)}>
        <MyTasks employeeId={employeeId} onSelectPatient={onSelect} />
      </SidebarSection>

      {/* Conversations */}
      <SidebarSection title="MESSAGES" icon="💬" count={unreadCount} badge={unreadCount > 0 ? 'red' : null} expanded={showConversations} onToggle={() => setShowConversations(!showConversations)}>
        <div style={{ padding: '4px 10px 6px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter conversations..."
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e0e0e0', borderRadius: 8, padding: '5px 8px', fontSize: 11, outline: 'none', background: '#fff', color: '#333' }}
          />
          <button
            onClick={() => { setShowNew(!showNew); setNewSearch(''); setNewResults([]); }}
            style={{ width: '100%', marginTop: 4, padding: '5px 0', background: showNew ? '#333' : '#111', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
            {showNew ? '↑ Cancel' : '+ New Conversation'}
          </button>
        </div>

        {/* New conversation search */}
        {showNew && (
          <div style={{ padding: '0 10px 6px', borderBottom: '1px solid #e8eaed' }}>
            <input autoFocus value={newSearch} onChange={e => setNewSearch(e.target.value)}
              placeholder="Search patient name..."
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #6366f1', borderRadius: 8, padding: '5px 8px', fontSize: 11, outline: 'none', background: '#fff' }} />
            {newResults.map(p => (
              <div key={p.id || p.phone} onClick={() => { onSelect(p); setShowNew(false); setNewSearch(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 4px', cursor: 'pointer', borderRadius: 6 }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: avatarColor(p.name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                  {initials(p.name).toUpperCase()}
                </div>
                <div style={{ fontSize: 11, color: '#333', fontWeight: 500 }}>{p.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Contact list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ padding: 12, textAlign: 'center', fontSize: 11, color: '#aaa' }}>Loading…</div>}
          {!loading && filtered.length === 0 && <div style={{ padding: 12, textAlign: 'center', fontSize: 11, color: '#bbb' }}>No conversations</div>}
          {filtered.map(c => {
            const sel = isSelected(c);
            const color = avatarColor(c.name);
            return (
              <div key={c.id || c.phone}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', borderBottom: '1px solid #eff0f1', background: sel ? '#fff' : 'transparent', borderLeft: sel ? '3px solid #6366f1' : '3px solid transparent', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#eff1f3'; }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                onClick={() => {
                  if (c.unread > 0) setContacts(prev => prev.map(x => (x.id === c.id && x.phone === c.phone) ? { ...x, unread: 0 } : x));
                  onSelect(c);
                }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                    {initials(c.name).toUpperCase()}
                  </div>
                  {c.unread > 0 && (
                    <div style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #f7f8fa' }}>
                      {c.unread > 9 ? '9+' : c.unread}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: c.unread > 0 ? 700 : 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{c.name}</span>
                    <span style={{ fontSize: 9, color: '#bbb', flexShrink: 0 }}>{timeAgo(c.lastMessage)}</span>
                  </div>
                  <div style={{ fontSize: 10, color: c.unread > 0 ? '#555' : '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.direction === 'inbound' ? '' : '↗ '}{c.preview || 'No messages yet'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SidebarSection>
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
          <a href={selectedPatient.id ? `/patients/${selectedPatient.id}` : '#'} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: color + '15', borderRadius: 20, width: 'fit-content', textDecoration: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.querySelector('.pt-name').style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.querySelector('.pt-name').style.textDecoration = 'none'}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>
              {initials(selectedPatient.name).toUpperCase()}
            </div>
            <span className="pt-name" style={{ fontSize: 11, fontWeight: 600, color: color }}>{selectedPatient.name}</span>
          </a>
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
        <a href={patient.id ? `/patients/${patient.id}` : '#'} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 4, textDecoration: 'none', display: 'block' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >{patient.name}</a>
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
          <InboxSidebar selected={selectedPatient} onSelect={p => { setSelectedPatient(p); setWalkinPatient(null); }} employeeId={employee.id} />

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
        <ServiceLogContent
          autoOpen
          onClose={() => setShowLog(false)}
          preselectedPatient={activePatient ? {
            id: activePatient.id,
            name: activePatient.name,
            phone: activePatient.phone,
          } : null}
        />
      )}
    </>
  );
}
