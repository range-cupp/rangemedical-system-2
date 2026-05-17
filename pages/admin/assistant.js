import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ShoppingCart, Calendar, User, X, Check, Plus, MessageSquare, Trash2, Search, Mail, FileText, CheckSquare, Clock, CreditCard, TestTube, Shield, UserCheck, MessageCircle, AlertTriangle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

const WELCOME_MSG = { role: 'assistant', content: 'Hey! What can I help with? I can check out patients, book appointments, look up records, add notes, create tasks, send emails, send consent forms, or answer questions about services and pricing.' };

function renderMarkdown(text) {
  if (!text) return text;
  const cleaned = text.replace(/^#{1,6}\s+/gm, '');
  const parts = cleaned.split(/(\*\*[^*]+?\*\*)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+?)\*\*$/);
    if (boldMatch) return <strong key={i}>{boldMatch[1]}</strong>;
    return part;
  });
}

function ScheduleCard({ data, onSelectPatient, onLookupRecords, styles }) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const appts = data.appointments || [];
  const s = data.summary;
  const statusStyle = { scheduled: { bg: '#dbeafe', text: '#1e40af', label: 'Scheduled' }, confirmed: { bg: '#dcfce7', text: '#166534', label: 'Confirmed' }, completed: { bg: '#f3f4f6', text: '#6b7280', label: 'Completed' }, 'no-show': { bg: '#fee2e2', text: '#dc2626', label: 'No Show' }, checked_in: { bg: '#fef3c7', text: '#92400e', label: 'Checked In' } };

  const categories = ['all', ...new Set(appts.map(a => a.category || a.service).filter(Boolean))];
  const filtered = categoryFilter === 'all' ? appts : appts.filter(a => (a.category || a.service) === categoryFilter);

  return (
    <div style={styles.toolCard}>
      <div style={styles.toolCardHeader}>
        <Calendar size={14} /> Schedule — {new Date(data.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        <span style={{ marginLeft: 'auto', fontWeight: 400, color: '#6b7280' }}>
          {s.total} appointment{s.total !== 1 ? 's' : ''}
        </span>
      </div>
      {categories.length > 2 && (
        <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', overflowX: 'auto', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{ padding: '3px 10px', border: '1px solid', borderColor: categoryFilter === cat ? '#4338ca' : '#d1d5db', borderRadius: '12px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', background: categoryFilter === cat ? '#4338ca' : '#fff', color: categoryFilter === cat ? '#fff' : '#374151' }}
            >
              {cat === 'all' ? `All (${appts.length})` : `${cat} (${appts.filter(a => (a.category || a.service) === cat).length})`}
            </button>
          ))}
        </div>
      )}
      {filtered.length === 0 ? (
        <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No appointments{categoryFilter !== 'all' ? ' in this category' : ' scheduled'}</div>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filtered.map((a, i) => {
            const ss = statusStyle[a.checked_in ? 'checked_in' : a.status] || statusStyle.scheduled;
            const expanded = expandedId === i;
            return (
              <div key={i}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderBottom: expanded ? 'none' : '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.1s' }}
                  onClick={() => setExpandedId(expanded ? null : i)}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: '58px', fontSize: '13px', fontWeight: 600, color: '#4338ca', flexShrink: 0 }}>{a.time}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{a.patient_name}</span>
                      <span style={{ ...styles.badge, background: ss.bg, color: ss.text }}>{ss.label}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '1px' }}>{a.service}</div>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      style={{ padding: '4px 8px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '6px', fontSize: '11px', color: '#4338ca', cursor: 'pointer', fontWeight: 500 }}
                      onClick={(e) => { e.stopPropagation(); onLookupRecords(a); }}
                    >Records</button>
                    <span style={{ fontSize: '12px', color: '#9ca3af', transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                  </div>
                </div>
                {expanded && (
                  <div style={{ padding: '6px 12px 10px 80px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', fontSize: '12px', color: '#6b7280' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {a.provider && <span>Provider: <strong style={{ color: '#111827' }}>{a.provider}</strong></span>}
                      {a.duration && <span>Duration: <strong style={{ color: '#111827' }}>{a.duration}min</strong></span>}
                      {a.category && <span>Category: <strong style={{ color: '#111827' }}>{a.category}</strong></span>}
                      {a.visit_reason && <span>Reason: <strong style={{ color: '#111827' }}>{a.visit_reason}</strong></span>}
                    </div>
                    {a.notes && <div style={{ marginTop: '4px', fontStyle: 'italic' }}>{a.notes}</div>}
                    <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                      <button
                        style={{ padding: '3px 8px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', color: '#374151' }}
                        onClick={() => onSelectPatient(a)}
                      >Select Patient</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {s.total > 0 && (
        <div style={{ display: 'flex', gap: '12px', padding: '8px 12px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: '11px', color: '#6b7280' }}>
          {s.confirmed > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} /> {s.confirmed} confirmed</span>}
          {s.scheduled > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} /> {s.scheduled} scheduled</span>}
          {s.completed > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af', display: 'inline-block' }} /> {s.completed} completed</span>}
        </div>
      )}
    </div>
  );
}

const PROGRAM_COLORS = {
  hrt: { bg: '#f3e8ff', text: '#7c3aed', label: 'HRT' },
  weight_loss: { bg: '#dbeafe', text: '#1e40af', label: 'Weight Loss' },
  peptide: { bg: '#dcfce7', text: '#166534', label: 'Peptide' },
  iv: { bg: '#ffedd5', text: '#c2410c', label: 'IV' },
  hbot: { bg: '#e0e7ff', text: '#3730a3', label: 'HBOT' },
  rlt: { bg: '#fee2e2', text: '#dc2626', label: 'RLT' },
  injection: { bg: '#fef3c7', text: '#92400e', label: 'Injection' },
};

const STATUS_COLORS = {
  active: { bg: '#dcfce7', text: '#166534', label: 'Active' },
  inactive: { bg: '#fee2e2', text: '#991b1b', label: 'Inactive' },
  new: { bg: '#dbeafe', text: '#1e40af', label: 'New' },
};

export default function AssistantPage() {
  const { session, employee } = useAuth();
  const userEmail = employee?.email || session?.user?.email || '';

  const [chatId, setChatId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([{ ...WELCOME_MSG, ts: Date.now() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [patient, setPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    fetch('/api/pos/services?active=true').then(r => r.json()).then(d => setServices(d.services || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (userEmail) loadChatList();
  }, [userEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadChatList() {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/ai/assistant-chats?user_email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      setChatList(data.chats || []);
    } catch (err) { console.error('loadChatList error:', err); }
  }

  async function saveChat(msgs, pName, pId) {
    if (!userEmail || msgs.length <= 1) return;
    const firstUserMsg = msgs.find(m => m.role === 'user');
    const title = firstUserMsg ? firstUserMsg.content.slice(0, 60) : 'New Chat';
    const saveable = msgs.map(m => ({ role: m.role, content: m.content, ts: m.ts, toolResults: m.toolResults }));

    try {
      if (chatId) {
        await fetch('/api/ai/assistant-chats', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: chatId, title, messages: saveable, patient_name: pName, patient_id: pId }),
        });
      } else {
        const res = await fetch('/api/ai/assistant-chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_email: userEmail, title, messages: saveable, patient_name: pName, patient_id: pId }),
        });
        const data = await res.json();
        if (data.chat?.id) setChatId(data.chat.id);
      }
      loadChatList();
    } catch (err) { console.error('saveChat error:', err); }
  }

  function debouncedSave(msgs) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveChat(msgs, patient?.name, patient?.id), 1000);
  }

  async function loadChat(id) {
    try {
      const res = await fetch(`/api/ai/assistant-chats?id=${id}`);
      const data = await res.json();
      if (data.chat) {
        setChatId(data.chat.id);
        setMessages(data.chat.messages || [{ ...WELCOME_MSG, ts: Date.now() }]);
        if (data.chat.patient_name) setPatient({ id: data.chat.patient_id, name: data.chat.patient_name });
        else setPatient(null);
        setCart([]);
        setCartOpen(false);
      }
    } catch {}
  }

  function startNewChat() {
    setChatId(null);
    setMessages([{ ...WELCOME_MSG, ts: Date.now() }]);
    setPatient(null);
    setCart([]);
    setCartOpen(false);
    setInput('');
    inputRef.current?.focus();
  }

  async function deleteChat(id, e) {
    e.stopPropagation();
    try {
      await fetch(`/api/ai/assistant-chats?id=${id}`, { method: 'DELETE' });
      if (chatId === id) startNewChat();
      loadChatList();
    } catch {}
  }

  const searchPatients = useCallback(async (q) => {
    if (!q || q.length < 2) { setPatientResults([]); return; }
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setPatientResults(data.patients || []);
    } catch { setPatientResults([]); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchPatients(patientSearch), 300);
    return () => clearTimeout(t);
  }, [patientSearch, searchPatients]);

  async function handleToolCall(toolCall) {
    const { name, input: args } = toolCall;

    if (name === 'add_to_cart') {
      const items = (args.items || []).map(item => {
        const catalogMatch = item.catalog_id
          ? services.find(s => String(s.id) === String(item.catalog_id))
          : services.find(s => s.name?.toLowerCase() === item.name?.toLowerCase())
            || services.find(s => s.name?.toLowerCase().includes(item.name?.toLowerCase()));
        return {
          id: catalogMatch?.id || item.catalog_id || `ai-${Date.now()}`,
          name: catalogMatch?.name || item.name,
          price: catalogMatch?.price_cents || item.price_cents || 0,
          quantity: item.quantity || 1,
        };
      });
      setCart(prev => {
        const next = [...prev];
        for (const item of items) {
          const existing = next.find(i => i.id === item.id);
          if (existing) existing.quantity += item.quantity;
          else next.push(item);
        }
        return next;
      });
      setCartOpen(true);
      return { success: true, added: items.map(i => `${i.name} x${i.quantity} — $${((i.price * i.quantity) / 100).toFixed(2)}`).join(', ') };
    }

    if (name === 'search_patient') {
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(args.query)}`);
        const data = await res.json();
        const pts = (data.patients || []).slice(0, 5).map(p => ({ id: p.id, name: p.name || `${p.first_name} ${p.last_name}`, phone: p.phone, email: p.email }));
        if (pts.length === 0) return { found: false, message: `No patients found matching "${args.query}"` };
        return { found: true, patients: pts };
      } catch { return { error: 'Search failed' }; }
    }

    if (name === 'check_slots') {
      try {
        const svcRes = await fetch('/api/bookings/event-types');
        const svcData = await svcRes.json();
        const allSvcs = svcData.eventTypes || [];
        const q = (args.service || '').toLowerCase();
        const svc = allSvcs.find(s => s.title?.toLowerCase().includes(q) || s.slug?.toLowerCase().includes(q) || s.category?.toLowerCase() === q);
        if (!svc) return { error: `No service matching "${args.service}". Available: ${allSvcs.map(s => s.title).join(', ')}` };
        const slotsRes = await fetch(`/api/bookings/slots?serviceSlug=${encodeURIComponent(svc.slug)}&date=${args.date}`);
        const slotsData = await slotsRes.json();
        const raw = slotsData.slots?.[args.date] || [];
        const slots = raw.map(s => ({
          time: new Date(s.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' }),
          start_iso: s.start,
        }));
        return { service_name: svc.title, service_slug: svc.slug, duration_minutes: svc.length, date: args.date, slots, slot_count: slots.length };
      } catch { return { error: 'Failed to check slots' }; }
    }

    if (name === 'book_appointment') {
      try {
        const startISO = args.start_iso;
        const dur = args.duration_minutes || 60;
        const endISO = new Date(new Date(startISO).getTime() + dur * 60000).toISOString();
        const res = await fetch('/api/appointments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: args.patient_id, patient_name: args.patient_name,
            service_name: args.service, service_slug: args.service_slug,
            start_time: startISO, end_time: endISO, duration_minutes: dur,
            visit_reason: args.service, source: 'assistant', created_by: 'AI Assistant', send_notification: true,
          }),
        });
        const data = await res.json();
        if (res.ok && !data.error) return { success: true, message: `Booked ${args.patient_name} for ${args.service}` };
        return { error: data.error || 'Booking failed' };
      } catch { return { error: 'Failed to create booking' }; }
    }
    if (name === 'draft_email') {
      return { draft: true, to: args.to, to_name: args.to_name || '', subject: args.subject, body: args.body };
    }

    if (name === 'lookup_patient_records') {
      try {
        const pid = args.patient_id || patient?.id;
        if (!pid) return { error: 'No patient selected. Search for a patient first.' };
        const res = await fetch(`/api/ai/patient-records?patient_id=${pid}`);
        const data = await res.json();
        if (!res.ok) return { error: data.error || 'Failed to fetch records' };
        return data;
      } catch { return { error: 'Failed to fetch patient records' }; }
    }

    if (name === 'add_note') {
      try {
        const pid = args.patient_id || patient?.id;
        if (!pid) return { error: 'No patient selected. Search for a patient first.' };
        const res = await fetch('/api/ai/add-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: pid,
            body: args.note_text,
            created_by: employee?.name || 'AI Assistant',
            note_category: args.note_category || 'internal',
          }),
        });
        const data = await res.json();
        if (data.success) return { success: true, note_id: data.note_id, patient_name: patient?.name || 'Patient', note_text: args.note_text, note_category: args.note_category || 'internal' };
        return { error: data.error || 'Failed to add note' };
      } catch { return { error: 'Failed to add note' }; }
    }

    if (name === 'today_schedule') {
      try {
        const dateParam = args.date ? `?date=${args.date}` : '';
        const res = await fetch(`/api/ai/today-schedule${dateParam}`);
        const data = await res.json();
        if (!res.ok) return { error: data.error || 'Failed to fetch schedule' };
        return data;
      } catch { return { error: 'Failed to fetch schedule' }; }
    }

    if (name === 'create_task') {
      try {
        const res = await fetch('/api/ai/create-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: args.title,
            description: args.description || null,
            assigned_to_name: args.assigned_to_name,
            patient_id: patient?.id || null,
            patient_name: args.patient_name || patient?.name || null,
            priority: args.priority || 'medium',
            due_date: args.due_date || null,
            task_category: args.task_category || 'business',
            created_by_id: employee?.id || null,
          }),
        });
        const data = await res.json();
        if (data.success) return { success: true, task: data.task, assigned_to_name: data.assigned_to_name };
        return { error: data.error || 'Failed to create task' };
      } catch { return { error: 'Failed to create task' }; }
    }

    if (name === 'lookup_comms_history') {
      try {
        const pid = args.patient_id || patient?.id;
        if (!pid) return { error: 'No patient selected. Search for a patient first.' };
        const channelParam = args.channel ? `&channel=${args.channel}` : '';
        const res = await fetch(`/api/ai/comms-history?patient_id=${pid}${channelParam}`);
        const data = await res.json();
        if (!res.ok) return { error: data.error || 'Failed to fetch comms' };
        return data;
      } catch { return { error: 'Failed to fetch comms history' }; }
    }

    if (name === 'cancel_appointment') {
      try {
        const res = await fetch('/api/ai/cancel-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointment_id: args.appointment_id,
            reason: args.reason || null,
            cancelled_by: employee?.name || 'AI Assistant',
          }),
        });
        const data = await res.json();
        if (data.success) return data;
        return { error: data.error || 'Failed to cancel' };
      } catch { return { error: 'Failed to cancel appointment' }; }
    }

    if (name === 'lookup_lab_results') {
      try {
        const pid = args.patient_id || patient?.id;
        if (!pid) return { error: 'No patient selected. Search for a patient first.' };
        const res = await fetch(`/api/ai/lab-results?patient_id=${pid}`);
        const data = await res.json();
        if (!res.ok) return { error: data.error || 'Failed to fetch labs' };
        return data;
      } catch { return { error: 'Failed to fetch lab results' }; }
    }

    if (name === 'lookup_membership') {
      try {
        const pid = args.patient_id || patient?.id;
        if (!pid) return { error: 'No patient selected. Search for a patient first.' };
        const res = await fetch(`/api/ai/membership-status?patient_id=${pid}`);
        const data = await res.json();
        if (!res.ok) return { error: data.error || 'Failed to fetch memberships' };
        return data;
      } catch { return { error: 'Failed to fetch membership status' }; }
    }

    if (name === 'lookup_consent_forms') {
      try {
        const pid = args.patient_id || patient?.id;
        if (!pid) return { error: 'No patient selected. Search for a patient first.' };
        const res = await fetch(`/api/ai/consent-status?patient_id=${pid}`);
        const data = await res.json();
        if (!res.ok) return { error: data.error || 'Failed to fetch consents' };
        return data;
      } catch { return { error: 'Failed to fetch consent status' }; }
    }

    if (name === 'lookup_payments') {
      try {
        const pid = args.patient_id || patient?.id;
        if (!pid) return { error: 'No patient selected. Search for a patient first.' };
        const res = await fetch(`/api/ai/payment-history?patient_id=${pid}`);
        const data = await res.json();
        if (!res.ok) return { error: data.error || 'Failed to fetch payments' };
        return data;
      } catch { return { error: 'Failed to fetch payment history' }; }
    }

    if (name === 'program_due_list') {
      try {
        const res = await fetch(`/api/ai/program-due-list?program=${encodeURIComponent(args.program)}`);
        const data = await res.json();
        if (!res.ok) return { error: data.error || 'Failed to fetch program due list' };
        return data;
      } catch { return { error: 'Failed to fetch program due list' }; }
    }

    if (name === 'send_consent_forms') {
      try {
        const pid = args.patient_id || patient?.id;
        if (!pid) return { error: 'No patient selected. Search for a patient first.' };
        const svc = args.service_category || 'general';
        const res = await fetch(`/api/ai/check-missing-forms?patient_id=${pid}&service=${svc}`);
        const data = await res.json();
        if (!res.ok) return { error: data.error || 'Failed to check forms' };
        if (!data.patient_email) return { error: `No email on file for ${data.patient_name}. Add their email first.` };
        if (data.all_complete) return { all_complete: true, patient_name: data.patient_name, service: svc, signed_types: data.signed_types };
        return { preview: true, ...data };
      } catch { return { error: 'Failed to check missing forms' }; }
    }

    return { error: `Unknown action: ${name}` };
  }

  async function sendDraftEmail(draft) {
    try {
      const res = await fetch('/api/ai/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: draft.to,
          subject: draft.subject,
          body: draft.body,
          patient_id: patient?.id || null,
          patient_name: patient?.name || draft.to_name || null,
          sent_by_name: employee?.name || null,
          sent_by_id: employee?.id || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => {
          if (!m.toolResults) return m;
          return { ...m, toolResults: m.toolResults.map(tr =>
            tr.tool === 'draft_email' && tr.result.to === draft.to && tr.result.subject === draft.subject
              ? { ...tr, result: { ...tr.result, sent: true } }
              : tr
          )};
        }));
        return true;
      }
      return false;
    } catch { return false; }
  }

  async function sendConsentForms(data) {
    try {
      const res = await fetch('/api/admin/send-forms-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.patient_email,
          firstName: data.first_name,
          formIds: data.forms_to_send.map(f => f.id),
          patientId: data.patient_id,
          patientName: data.patient_name,
          patientPhone: data.patient_phone,
          metadata: { source: 'ai-assistant', sent_by: employee?.name },
        }),
      });
      const result = await res.json();
      if (result.success) {
        setMessages(prev => prev.map(m => {
          if (!m.toolResults) return m;
          return { ...m, toolResults: m.toolResults.map(tr =>
            tr.tool === 'send_consent_forms' && tr.result.patient_id === data.patient_id && tr.result.preview
              ? { ...tr, result: { ...tr.result, sent: true, bundle_url: result.bundleUrl } }
              : tr
          )};
        }));
        return true;
      }
      return false;
    } catch { return false; }
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text.trim(), ts: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = newMessages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, services, patientName: patient?.name, patientId: patient?.id, context: 'general' }),
      });
      const data = await res.json();

      if (data.toolCalls && data.toolCalls.length > 0) {
        const toolResults = [];
        for (const tc of data.toolCalls) {
          const result = await handleToolCall(tc);
          toolResults.push({ tool: tc.name, input: tc.input, result });
        }
        const toolResultText = toolResults.map(tr => {
          if (tr.tool === 'add_to_cart') return `Added to cart: ${tr.result.added || 'items added'}`;
          if (tr.tool === 'search_patient' && tr.result.found) return `Found: ${tr.result.patients.map(p => p.name).join(', ')}`;
          if (tr.tool === 'search_patient') return tr.result.message || 'No patients found';
          if (tr.tool === 'check_slots') return tr.result.slots ? `${tr.result.slot_count} slots available for ${tr.result.service_name}` : tr.result.error;
          if (tr.tool === 'book_appointment') return tr.result.success ? tr.result.message : tr.result.error;
          if (tr.tool === 'add_note') return tr.result.success ? `Note added to ${tr.result.patient_name}'s chart` : tr.result.error;
          if (tr.tool === 'create_task') return tr.result.success ? `Task "${tr.result.task.title}" created, assigned to ${tr.result.assigned_to_name}` : tr.result.error;
          if (tr.tool === 'today_schedule' && tr.result.appointments) return `${tr.result.summary.total} appointments on ${tr.result.date} (${tr.result.summary.confirmed} confirmed, ${tr.result.summary.scheduled} scheduled). The schedule card is shown to the user — do NOT list out all the appointments in text. Just give a brief summary like "33 appointments today, busy morning with trials and labs."}`;
          if (tr.tool === 'lookup_comms_history' && tr.result.comms) return `${tr.result.summary.total} recent communications (${tr.result.summary.inbound} inbound, ${tr.result.summary.outbound} outbound)`;
          if (tr.tool === 'cancel_appointment' && tr.result.success) return `Cancelled ${tr.result.patient_name}'s ${tr.result.service} at ${tr.result.time}`;
          if (tr.tool === 'lookup_lab_results' && tr.result.labs) return `${tr.result.summary.total} lab records (${tr.result.summary.completed} completed, ${tr.result.summary.pending} pending). Next lab: ${tr.result.summary.next_lab || 'not scheduled'}`;
          if (tr.tool === 'lookup_membership' && tr.result.memberships) return `${tr.result.summary.active_count} active membership(s): ${tr.result.summary.active_names}`;
          if (tr.tool === 'lookup_consent_forms' && tr.result.forms) return `${tr.result.summary.total_signed} consent forms signed. Intake: ${tr.result.summary.has_intake ? 'yes' : 'NO'}, HIPAA: ${tr.result.summary.has_hipaa ? 'yes' : 'NO'}`;
          if (tr.tool === 'lookup_payments' && tr.result.summary) return `Credit balance: ${tr.result.summary.credit_balance}. Total spent: ${tr.result.summary.total_spent}. ${tr.result.summary.pending_invoices} pending invoice(s). Last payment: ${tr.result.summary.last_payment || 'none'}`;
          if (tr.tool === 'program_due_list' && tr.result.patients) return `${tr.result.summary.due_count} ${tr.result.program.replace(/_/g, ' ')} patients due (${tr.result.summary.overdue} overdue, ${tr.result.summary.due_now} due now, ${tr.result.summary.due_soon} due soon) out of ${tr.result.summary.total_active} active. The list card is shown — do NOT list all patients in text. Just summarize the numbers.`;
          if (tr.tool === 'send_consent_forms' && tr.result.all_complete) return `${tr.result.patient_name} has all forms complete for ${tr.result.service} — nothing to send.`;
          if (tr.tool === 'send_consent_forms' && tr.result.preview) return `Ready to send ${tr.result.forms_to_send.length} form(s) to ${tr.result.patient_name} at ${tr.result.patient_email}: ${tr.result.forms_to_send.map(f => f.name).join(', ')}. The send card is shown — staff will click Send to confirm.`;
          if (tr.tool === 'send_consent_forms' && tr.result.error) return tr.result.error;
          return JSON.stringify(tr.result);
        }).join('\n');

        const assistantMsg = { role: 'assistant', content: data.reply || toolResultText, toolResults, ts: Date.now() };
        const withAssistant = [...newMessages, assistantMsg];
        setMessages(withAssistant);

        const followUpMessages = [...apiMessages, { role: 'assistant', content: data.reply || toolResultText }];
        const toolContext = toolResults.map(tr => `[Tool: ${tr.tool}] Result: ${JSON.stringify(tr.result)}`).join('\n');
        followUpMessages.push({ role: 'user', content: `[System] Tool results:\n${toolContext}\n\nGive a brief confirmation to the user about what just happened.` });

        const followUp = await fetch('/api/ai/assistant-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: followUpMessages, services, patientName: patient?.name, patientId: patient?.id, context: 'general' }),
        });
        const followUpData = await followUp.json();
        if (followUpData.reply) {
          const final = [...withAssistant.slice(0, -1), { ...assistantMsg, content: followUpData.reply }];
          setMessages(final);
          debouncedSave(final);
        } else {
          debouncedSave(withAssistant);
        }
      } else {
        const aiMsg = { role: 'assistant', content: data.reply || 'Sorry, I didn\'t get that.', ts: Date.now() };
        const final = [...newMessages, aiMsg];
        setMessages(final);
        debouncedSave(final);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = { role: 'assistant', content: 'Something went wrong. Try again?', ts: Date.now() };
      setMessages(prev => [...prev, errMsg]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  function removeFromCart(index) { setCart(prev => prev.filter((_, i) => i !== index)); }
  const cartTotal = cart.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  function formatChatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (diff < 604800000) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function renderToolCard(tr) {
    if (tr.tool === 'add_to_cart' && tr.result.success) {
      return (<div style={st.toolCard}><div style={st.toolCardHeader}><ShoppingCart size={14} /> Added to Cart</div><div style={st.toolCardBody}>{tr.result.added}</div></div>);
    }
    if (tr.tool === 'search_patient' && tr.result.found) {
      return (<div style={st.toolCard}><div style={st.toolCardHeader}><User size={14} /> Patient Results</div>
        {tr.result.patients.map(p => (<div key={p.id} style={st.patientResultRow} onClick={() => setPatient(p)}><span style={{ fontWeight: 600 }}>{p.name}</span><span style={{ color: '#6b7280', fontSize: '12px' }}>{p.phone || p.email || ''}</span></div>))}
      </div>);
    }
    if (tr.tool === 'check_slots' && tr.result.slots) {
      return (<div style={st.toolCard}><div style={st.toolCardHeader}><Calendar size={14} /> {tr.result.service_name} — {tr.result.date}</div>
        <div style={st.slotsGrid}>
          {tr.result.slots.slice(0, 12).map((slot, i) => (
            <button key={i} style={st.slotBtn} onClick={() => { setInput(`Book ${patient?.name || 'the patient'} for ${tr.result.service_name} at ${slot.time}`); inputRef.current?.focus(); }}>{slot.time}</button>
          ))}
        </div>
        {tr.result.slots.length > 12 && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', padding: '0 12px 8px' }}>+{tr.result.slots.length - 12} more slots</div>}
      </div>);
    }
    if (tr.tool === 'book_appointment') {
      return (<div style={{ ...st.toolCard, borderColor: tr.result.success ? '#86efac' : '#fca5a5' }}><div style={st.toolCardHeader}>{tr.result.success ? <Check size={14} /> : <X size={14} />} {tr.result.success ? 'Booked' : 'Booking Failed'}</div><div style={st.toolCardBody}>{tr.result.message || tr.result.error}</div></div>);
    }
    if (tr.tool === 'draft_email' && tr.result.draft) {
      const d = tr.result;
      return (
        <div style={{ ...st.toolCard, borderColor: d.sent ? '#86efac' : '#c7d2fe' }}>
          <div style={st.toolCardHeader}>
            <Mail size={14} /> {d.sent ? 'Email Sent' : 'Email Draft'}
          </div>
          <div style={{ padding: '10px 12px', fontSize: '13px' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>To: </span>
              <span style={{ fontWeight: 500 }}>{d.to_name ? `${d.to_name} <${d.to}>` : d.to}</span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>Subject: </span>
              <span style={{ fontWeight: 600 }}>{d.subject}</span>
            </div>
            <div style={{ padding: '10px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '13px', color: '#374151' }}>
              {d.body}
            </div>
            {!d.sent && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={() => sendDraftEmail(d)}
                  style={{ padding: '7px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} /> Send Email
                </button>
                <button
                  onClick={() => { setInput(`Edit email: change the subject to... and the body to...`); inputRef.current?.focus(); }}
                  style={{ padding: '7px 16px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Edit
                </button>
              </div>
            )}
            {d.sent && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '12px', fontWeight: 600 }}>
                <Check size={14} /> Sent successfully
              </div>
            )}
          </div>
        </div>
      );
    }
    if (tr.tool === 'today_schedule' && tr.result.appointments) {
      return (
        <ScheduleCard
          data={tr.result}
          styles={st}
          onSelectPatient={(a) => { if (a.patient_id) setPatient({ id: a.patient_id, name: a.patient_name, phone: a.patient_phone }); }}
          onLookupRecords={(a) => { if (a.patient_id) { setPatient({ id: a.patient_id, name: a.patient_name, phone: a.patient_phone }); setInput(`Look up ${a.patient_name}'s records`); inputRef.current?.focus(); } }}
        />
      );
    }
    if (tr.tool === 'add_note' && tr.result.success) {
      return (
        <div style={{ ...st.toolCard, borderColor: '#86efac' }}>
          <div style={st.toolCardHeader}><FileText size={14} /> Note Added</div>
          <div style={{ padding: '8px 12px', fontSize: '13px' }}>
            <div style={{ fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              {tr.result.patient_name} — {tr.result.note_category === 'clinical' ? 'Clinical' : 'Internal'} Note
            </div>
            <div style={{ padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '13px', color: '#374151' }}>
              {tr.result.note_text}
            </div>
          </div>
        </div>
      );
    }
    if (tr.tool === 'add_note' && tr.result.error) {
      return (<div style={{ ...st.toolCard, borderColor: '#fca5a5' }}><div style={st.toolCardHeader}><X size={14} /> Note Failed</div><div style={st.toolCardBody}>{tr.result.error}</div></div>);
    }
    if (tr.tool === 'create_task' && tr.result.success) {
      const t = tr.result.task;
      const priorityColors = { high: { bg: '#fee2e2', text: '#dc2626' }, medium: { bg: '#fef3c7', text: '#92400e' }, low: { bg: '#f3f4f6', text: '#6b7280' } };
      const pc = priorityColors[t.priority] || priorityColors.medium;
      return (
        <div style={{ ...st.toolCard, borderColor: '#86efac' }}>
          <div style={st.toolCardHeader}><CheckSquare size={14} /> Task Created</div>
          <div style={{ padding: '8px 12px', fontSize: '13px' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t.title}</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#6b7280' }}>
              <span>Assigned to <span style={{ fontWeight: 600, color: '#111827' }}>{tr.result.assigned_to_name}</span></span>
              <span style={{ ...st.badge, background: pc.bg, color: pc.text }}>{t.priority}</span>
              {t.due_date && <span>Due {new Date(t.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
            </div>
          </div>
        </div>
      );
    }
    if (tr.tool === 'create_task' && tr.result.error) {
      return (<div style={{ ...st.toolCard, borderColor: '#fca5a5' }}><div style={st.toolCardHeader}><X size={14} /> Task Failed</div><div style={st.toolCardBody}>{tr.result.error}</div></div>);
    }
    if (tr.tool === 'lookup_patient_records' && tr.result.protocols) {
      const { protocols, appointments, recentVisits, prescriptions } = tr.result;
      return (
        <div style={st.toolCard}>
          <div style={st.toolCardHeader}><User size={14} /> Patient Records</div>
          <div style={{ padding: '8px 12px', fontSize: '13px' }}>
            {protocols.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 600, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Active Protocols</div>
                {protocols.map((p, i) => (
                  <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontWeight: 600 }}>{p.medication || p.program}</span>
                    {p.dose && <span style={{ color: '#6b7280' }}> — {p.dose}</span>}
                    {p.frequency && <span style={{ color: '#6b7280' }}>, {p.frequency}</span>}
                    {p.next_date && <div style={{ fontSize: '12px', color: '#4f46e5' }}>Next: {new Date(p.next_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                    {p.last_refill && <div style={{ fontSize: '12px', color: '#6b7280' }}>Last refill: {new Date(p.last_refill + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                  </div>
                ))}
              </div>
            )}
            {appointments.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 600, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Upcoming Appointments</div>
                {appointments.slice(0, 5).map((a, i) => (
                  <div key={i} style={{ padding: '4px 0', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600 }}>{a.service}</span> — {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })}
                  </div>
                ))}
              </div>
            )}
            {recentVisits.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Recent Visits</div>
                {recentVisits.slice(0, 5).map((v, i) => (
                  <div key={i} style={{ padding: '4px 0', fontSize: '12px', color: '#4b5563' }}>
                    {new Date(v.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {v.medication || v.category || v.type}{v.dosage ? ` (${v.dosage})` : ''}
                  </div>
                ))}
              </div>
            )}
            {protocols.length === 0 && appointments.length === 0 && recentVisits.length === 0 && (
              <div style={{ color: '#9ca3af' }}>No active records found for this patient.</div>
            )}
          </div>
        </div>
      );
    }
    if (tr.tool === 'lookup_comms_history' && tr.result.comms) {
      const comms = tr.result.comms;
      return (
        <div style={st.toolCard}>
          <div style={st.toolCardHeader}><MessageCircle size={14} /> Recent Communications</div>
          {comms.length === 0 ? (
            <div style={{ padding: '12px', color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>No communications found</div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {comms.map((c, i) => (
                <div key={i} style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ ...st.badge, background: c.direction === 'inbound' ? '#dbeafe' : '#f3f4f6', color: c.direction === 'inbound' ? '#1e40af' : '#6b7280' }}>{c.direction === 'inbound' ? '← In' : '→ Out'}</span>
                    <span style={{ ...st.badge, background: c.channel === 'email' ? '#fef3c7' : '#dcfce7', color: c.channel === 'email' ? '#92400e' : '#166534' }}>{c.channel}</span>
                    <span style={{ color: '#9ca3af', fontSize: '11px', marginLeft: 'auto' }}>{new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })}</span>
                  </div>
                  {c.subject && <div style={{ fontWeight: 600, fontSize: '12px', color: '#374151' }}>{c.subject}</div>}
                  <div style={{ color: '#6b7280', lineHeight: '1.4' }}>{c.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (tr.tool === 'cancel_appointment') {
      const ok = tr.result.success;
      return (
        <div style={{ ...st.toolCard, borderColor: ok ? '#fca5a5' : '#e5e7eb' }}>
          <div style={st.toolCardHeader}>{ok ? <Check size={14} /> : <X size={14} />} {ok ? 'Appointment Cancelled' : 'Cancel Failed'}</div>
          <div style={st.toolCardBody}>{ok ? `${tr.result.patient_name}'s ${tr.result.service} at ${tr.result.time} has been cancelled.` : tr.result.error}</div>
        </div>
      );
    }
    if (tr.tool === 'lookup_lab_results' && tr.result.labs) {
      const { labs, summary } = tr.result;
      const statusColors = { completed: '#16a34a', provider_reviewed: '#16a34a', pending: '#d97706', awaiting_results: '#d97706', draw_scheduled: '#6366f1', draw_complete: '#6366f1' };
      return (
        <div style={st.toolCard}>
          <div style={st.toolCardHeader}><TestTube size={14} /> Lab Results</div>
          <div style={{ padding: '8px 12px', fontSize: '13px' }}>
            {labs.length === 0 ? (
              <div style={{ color: '#9ca3af' }}>No lab records found.</div>
            ) : (
              <>
                {labs.slice(0, 5).map((l, i) => (
                  <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600 }}>{l.panel}</span>
                      <span style={{ fontSize: '11px', color: statusColors[l.status] || '#6b7280', fontWeight: 600 }}>{l.status?.replace(/_/g, ' ')}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {l.test_date && <span>{new Date(l.test_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                      {l.provider && <span> · {l.provider}</span>}
                      {l.biomarker_count > 0 && <span> · {l.biomarker_count} biomarkers</span>}
                    </div>
                    {l.synopsis && <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px', fontStyle: 'italic' }}>{l.synopsis}</div>}
                  </div>
                ))}
                {summary.next_lab && <div style={{ fontSize: '12px', color: '#4f46e5', marginTop: '6px' }}>Next lab: {new Date(summary.next_lab + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
              </>
            )}
          </div>
        </div>
      );
    }
    if (tr.tool === 'lookup_membership' && tr.result.memberships) {
      const { memberships, summary } = tr.result;
      const statusColors = { active: '#16a34a', past_due: '#dc2626', canceled: '#6b7280', paused: '#d97706' };
      return (
        <div style={st.toolCard}>
          <div style={st.toolCardHeader}><UserCheck size={14} /> Memberships</div>
          <div style={{ padding: '8px 12px', fontSize: '13px' }}>
            {memberships.length === 0 ? (
              <div style={{ color: '#9ca3af' }}>No memberships found.</div>
            ) : memberships.map((m, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: statusColors[m.status] || '#6b7280' }}>{m.status}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {m.price && <span>{m.price} {m.billing_cycle}</span>}
                  {m.current_period_end && <span> · Renews {new Date(m.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                  {m.cancels_at_period_end && <span style={{ color: '#dc2626' }}> · Cancels at period end</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (tr.tool === 'program_due_list' && tr.result.patients) {
      const { patients: pats, summary: sum, program: prog } = tr.result;
      const programLabel = prog.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const urgencyStyles = { overdue: { bg: '#fee2e2', text: '#dc2626' }, due_now: { bg: '#fef3c7', text: '#92400e' }, due_soon: { bg: '#dbeafe', text: '#1e40af' } };
      return (
        <div style={st.toolCard}>
          <div style={st.toolCardHeader}>
            <CreditCard size={14} /> {programLabel} — Payment Due
            <span style={{ marginLeft: 'auto', fontWeight: 400, color: '#6b7280' }}>
              {sum.due_count} of {sum.total_active} active
            </span>
          </div>
          {sum.due_count === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#16a34a', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Check size={14} /> All {programLabel.toLowerCase()} patients are current on payments.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px', padding: '8px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>
                {sum.overdue > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#dc2626', fontWeight: 600 }}><AlertTriangle size={11} /> {sum.overdue} overdue</span>}
                {sum.due_now > 0 && <span style={{ color: '#92400e', fontWeight: 600 }}>{sum.due_now} due now</span>}
                {sum.due_soon > 0 && <span style={{ color: '#1e40af' }}>{sum.due_soon} due soon</span>}
              </div>
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {pats.map((p, i) => {
                  const us = urgencyStyles[p.urgency] || urgencyStyles.due_soon;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#111827' }}>{p.patient_name}</span>
                          <span style={{ ...st.badge, background: us.bg, color: us.text }}>{p.urgency_label}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '1px' }}>
                          {p.medication} {p.dose}{p.sessions_used !== undefined && p.total_sessions ? ` — ${p.sessions_used}/${p.total_sessions} used` : ''}
                          {p.last_purchase_date ? ` — Last paid ${new Date(p.last_purchase_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ' — No purchases'}
                        </div>
                      </div>
                      <button
                        style={{ padding: '4px 8px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '6px', fontSize: '11px', color: '#4338ca', cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}
                        onClick={() => { setPatient({ id: p.patient_id, name: p.patient_name, phone: p.patient_phone }); setInput(`Look up ${p.patient_name}'s records`); inputRef.current?.focus(); }}
                      >Records</button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      );
    }
    if (tr.tool === 'send_consent_forms' && tr.result.preview) {
      const d = tr.result;
      return (
        <div style={{ ...st.toolCard, borderColor: d.sent ? '#86efac' : '#c7d2fe' }}>
          <div style={st.toolCardHeader}>
            <Mail size={14} /> {d.sent ? 'Forms Sent' : 'Send Consent Forms'}
          </div>
          <div style={{ padding: '10px 12px', fontSize: '13px' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>To: </span>
              <span style={{ fontWeight: 500 }}>{d.patient_name} &lt;{d.patient_email}&gt;</span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>Service: </span>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{d.service.replace(/_/g, ' ')}</span>
            </div>
            <div style={{ padding: '8px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
              <div style={{ fontWeight: 600, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>Forms to Send</div>
              {d.forms_to_send.map(f => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #f3f4f6', fontSize: '12px' }}>
                  <span style={{ color: '#374151', fontWeight: 500 }}>{f.name}</span>
                  <span style={{ color: '#9ca3af', fontSize: '11px' }}>{f.time}</span>
                </div>
              ))}
            </div>
            {d.signed_types.length > 0 && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#6b7280' }}>
                Already signed: {d.signed_types.join(', ')}
              </div>
            )}
            {!d.sent && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={() => sendConsentForms(d)}
                  style={{ padding: '7px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} /> Send Forms
                </button>
              </div>
            )}
            {d.sent && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '12px', fontWeight: 600 }}>
                <Check size={14} /> Sent to {d.patient_email}
              </div>
            )}
          </div>
        </div>
      );
    }
    if (tr.tool === 'send_consent_forms' && tr.result.all_complete) {
      return (
        <div style={{ ...st.toolCard, borderColor: '#86efac' }}>
          <div style={st.toolCardHeader}><Shield size={14} /> All Forms Complete</div>
          <div style={{ padding: '8px 12px', fontSize: '13px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={14} /> {tr.result.patient_name} has all required forms signed for {tr.result.service.replace(/_/g, ' ')}.
          </div>
        </div>
      );
    }
    if (tr.tool === 'lookup_consent_forms' && tr.result.forms !== undefined) {
      const { signed_types, has_basics, missing_by_service } = tr.result;
      return (
        <div style={st.toolCard}>
          <div style={st.toolCardHeader}><Shield size={14} /> Consent Forms</div>
          <div style={{ padding: '8px 12px', fontSize: '13px' }}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Signed</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {signed_types.length > 0 ? signed_types.map(t => (
                  <span key={t} style={{ ...st.badge, background: '#dcfce7', color: '#166534' }}>{t}</span>
                )) : <span style={{ color: '#9ca3af' }}>None</span>}
              </div>
            </div>
            {!has_basics && (
              <div style={{ padding: '6px 8px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', color: '#dc2626', marginBottom: '6px' }}>
                Missing required forms: {!signed_types.includes('intake') && 'Intake'}{!signed_types.includes('intake') && !signed_types.includes('hipaa') && ', '}{!signed_types.includes('hipaa') && 'HIPAA'}
              </div>
            )}
            {Object.keys(missing_by_service).length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Missing by Service</div>
                {Object.entries(missing_by_service).filter(([k]) => k !== 'general').map(([svc, forms]) => (
                  <div key={svc} style={{ fontSize: '12px', color: '#6b7280', padding: '2px 0' }}>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{svc.replace(/_/g, ' ')}</span>: {forms.join(', ')}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    if (tr.tool === 'lookup_payments' && tr.result.summary) {
      const { purchases, invoices, summary } = tr.result;
      return (
        <div style={st.toolCard}>
          <div style={st.toolCardHeader}><CreditCard size={14} /> Payment History</div>
          <div style={{ padding: '8px 12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', padding: '8px 10px', background: '#f9fafb', borderRadius: '6px' }}>
              <div><div style={{ fontSize: '11px', color: '#6b7280' }}>Credit Balance</div><div style={{ fontWeight: 700, color: summary.credit_balance_cents > 0 ? '#16a34a' : '#111827' }}>{summary.credit_balance}</div></div>
              <div><div style={{ fontSize: '11px', color: '#6b7280' }}>Total Spent</div><div style={{ fontWeight: 700 }}>{summary.total_spent}</div></div>
              {summary.pending_invoices > 0 && <div><div style={{ fontSize: '11px', color: '#dc2626' }}>Pending Invoices</div><div style={{ fontWeight: 700, color: '#dc2626' }}>{summary.pending_invoices}</div></div>}
            </div>
            {purchases.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Recent Purchases</div>
                {purchases.slice(0, 8).map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f3f4f6', fontSize: '12px' }}>
                    <span style={{ color: '#374151' }}>{p.item}{p.quantity > 1 ? ` (×${p.quantity})` : ''}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{p.amount}</span>
                      <span style={{ color: '#9ca3af', fontSize: '11px' }}>{p.date ? new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {purchases.length === 0 && <div style={{ color: '#9ca3af' }}>No purchase history found.</div>}
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <AdminLayout title="Assistant">
      <div style={st.container}>
        {/* Chat history sidebar */}
        {historyOpen && (
          <div style={st.historySidebar}>
            <div style={st.historyHeader}>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Chats</span>
              <button style={st.newChatBtn} onClick={startNewChat}><Plus size={14} /> New</button>
            </div>
            <div style={{ padding: '8px 10px 4px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '8px', top: '7px', color: '#9ca3af' }} />
                <input
                  value={historyFilter}
                  onChange={e => setHistoryFilter(e.target.value)}
                  placeholder="Search chats..."
                  style={{ width: '100%', padding: '6px 8px 6px 28px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', outline: 'none', background: '#fff' }}
                />
              </div>
            </div>
            <div style={st.historyList}>
              {chatList.filter(c => {
                if (!historyFilter) return true;
                const q = historyFilter.toLowerCase();
                return (c.title || '').toLowerCase().includes(q) || (c.patient_name || '').toLowerCase().includes(q);
              }).map(c => (
                <div key={c.id} style={{ ...st.historyItem, background: c.id === chatId ? '#eef2ff' : 'transparent' }} onClick={() => loadChat(c.id)}>
                  <MessageSquare size={14} style={{ flexShrink: 0, color: '#9ca3af' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={st.historyTitle}>{c.title}</div>
                    <div style={st.historyMeta}>
                      {c.patient_name && <span>{c.patient_name} · </span>}
                      {formatChatDate(c.updated_at)}
                    </div>
                  </div>
                  <button style={{ ...st.clearBtn, opacity: 0.4 }} onClick={(e) => deleteChat(c.id, e)}><Trash2 size={12} /></button>
                </div>
              ))}
              {chatList.length === 0 && <div style={{ padding: '16px', fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>No previous chats</div>}
            </div>
          </div>
        )}

        {/* Main chat area */}
        <div style={st.chatArea}>
          <div style={st.patientBar}>
            <button style={st.toggleHistoryBtn} onClick={() => setHistoryOpen(!historyOpen)}>
              <MessageSquare size={16} />
            </button>
            {patient ? (
              <div style={st.selectedPatient}>
                <User size={14} />
                <span style={{ fontWeight: 600 }}>{patient.name}</span>
                <button style={st.clearBtn} onClick={() => setPatient(null)}><X size={12} /></button>
              </div>
            ) : (
              <div style={st.patientSearchWrap}>
                <input style={st.patientInput} placeholder="Search patient (optional)..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                {patientResults.length > 0 && (
                  <div style={st.patientDropdown}>
                    {patientResults.map(p => {
                      const statusStyle = STATUS_COLORS[p.patientStatus] || STATUS_COLORS.new;
                      return (
                        <div key={p.id} style={st.patientOption} onClick={() => { setPatient(p); setPatientSearch(''); setPatientResults([]); }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{p.name || `${p.first_name} ${p.last_name}`}</span>
                              <span style={{ ...st.badge, background: statusStyle.bg, color: statusStyle.text }}>{statusStyle.label}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#6b7280' }}>
                              {p.phone && <span>{p.phone}</span>}
                              {p.email && <span>{p.email}</span>}
                            </div>
                            {p.activePrograms && p.activePrograms.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                                {p.activePrograms.map(prog => {
                                  const c = PROGRAM_COLORS[prog];
                                  return c ? <span key={prog} style={{ ...st.badge, background: c.bg, color: c.text }}>{c.label}</span> : null;
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {cart.length > 0 && (
              <button style={st.cartToggle} onClick={() => setCartOpen(!cartOpen)}>
                <ShoppingCart size={14} /><span>{cart.length}</span><span style={{ fontWeight: 400, color: '#6b7280' }}>${(cartTotal / 100).toFixed(2)}</span>
              </button>
            )}
          </div>

          <div style={st.messagesList}>
            {messages.map((msg, i) => (
              <div key={i} style={msg.role === 'user' ? st.userMsgRow : st.aiMsgRow}>
                <div style={msg.role === 'user' ? st.userBubble : st.aiBubble}>
                  {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                  {msg.toolResults && msg.toolResults.map((tr, j) => (
                    <div key={j} style={{ marginTop: '8px' }}>{renderToolCard(tr)}</div>
                  ))}
                </div>
              </div>
            ))}
            {loading && (<div style={st.aiMsgRow}><div style={{ ...st.aiBubble, color: '#9ca3af' }}>Thinking...</div></div>)}
            <div ref={messagesEndRef} />
          </div>

          <div style={st.inputBar}>
            <input ref={inputRef} style={st.textInput} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Type a message... (e.g. 'Add B12 injection 12-pack' or 'Book Sarah for HBOT tomorrow')" disabled={loading} />
            <button style={{ ...st.sendBtn, opacity: loading || !input.trim() ? 0.4 : 1 }} onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>

        {cartOpen && cart.length > 0 && (
          <div style={st.cartSidebar}>
            <div style={st.cartHeader}><span style={{ fontWeight: 700, fontSize: '15px' }}>Cart</span><button style={st.clearBtn} onClick={() => setCartOpen(false)}><X size={14} /></button></div>
            {cart.map((item, i) => (
              <div key={i} style={st.cartItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.quantity > 1 ? `${item.quantity} × ` : ''}${((item.price || 0) / 100).toFixed(2)}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>${(((item.price || 0) * (item.quantity || 1)) / 100).toFixed(2)}</div>
                <button style={{ ...st.clearBtn, marginLeft: '8px' }} onClick={() => removeFromCart(i)}><X size={12} /></button>
              </div>
            ))}
            <div style={st.cartTotal}><span>Total</span><span style={{ fontWeight: 700, fontSize: '18px' }}>${(cartTotal / 100).toFixed(2)}</span></div>
            <button style={st.checkoutBtn} onClick={() => {
              const params = new URLSearchParams();
              if (patient?.id) params.set('patient_id', patient.id);
              window.location.href = `/admin/checkout${params.toString() ? '?' + params : ''}`;
            }}>Go to Checkout</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const st = {
  container: { display: 'flex', height: 'calc(100vh - 80px)', gap: '0' },
  historySidebar: { width: '260px', borderRight: '1px solid #e5e7eb', background: '#fafafa', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #e5e7eb' },
  newChatBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  historyList: { flex: 1, overflowY: 'auto' },
  historyItem: { display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' },
  historyTitle: { fontSize: '13px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  historyMeta: { fontSize: '11px', color: '#9ca3af', marginTop: '2px' },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  patientBar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' },
  toggleHistoryBtn: { background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', color: '#6b7280' },
  selectedPatient: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#eef2ff', borderRadius: '8px', fontSize: '13px', color: '#4338ca' },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#9ca3af', display: 'flex' },
  patientSearchWrap: { position: 'relative', flex: 1, maxWidth: '400px' },
  patientInput: { width: '100%', padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' },
  patientDropdown: { position: 'absolute', top: '100%', left: 0, width: '420px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '10px', marginTop: '4px', maxHeight: '360px', overflowY: 'auto', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
  patientOption: { padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', fontSize: '13px', borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' },
  badge: { display: 'inline-block', fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '4px', lineHeight: '16px', whiteSpace: 'nowrap' },
  cartToggle: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#166534' },
  messagesList: { flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  userMsgRow: { display: 'flex', justifyContent: 'flex-end' },
  aiMsgRow: { display: 'flex', justifyContent: 'flex-start' },
  userBubble: { maxWidth: '70%', padding: '10px 14px', background: '#4f46e5', color: '#fff', borderRadius: '16px 16px 4px 16px', fontSize: '14px', lineHeight: '1.5' },
  aiBubble: { maxWidth: '80%', padding: '10px 14px', background: '#f3f4f6', color: '#111827', borderRadius: '16px 16px 16px 4px', fontSize: '14px', lineHeight: '1.5' },
  inputBar: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderTop: '1px solid #e5e7eb', background: '#fff' },
  textInput: { flex: 1, padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: '12px', fontSize: '14px', outline: 'none' },
  sendBtn: { width: '44px', height: '44px', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  toolCard: { border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', background: '#fff' },
  toolCardHeader: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#f9fafb', fontSize: '12px', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' },
  toolCardBody: { padding: '8px 12px', fontSize: '13px', color: '#4b5563' },
  patientResultRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f3f4f6' },
  slotsGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 12px' },
  slotBtn: { padding: '6px 12px', border: '1px solid #c7d2fe', borderRadius: '8px', background: '#eef2ff', color: '#4338ca', fontSize: '12px', fontWeight: 500, cursor: 'pointer' },
  cartSidebar: { width: '280px', borderLeft: '1px solid #e5e7eb', background: '#fff', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' },
  cartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cartItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  cartTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '2px solid #111827', marginTop: 'auto', fontSize: '15px', fontWeight: 600 },
  checkoutBtn: { width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
};
