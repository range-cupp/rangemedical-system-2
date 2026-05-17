import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ShoppingCart, Calendar, User, X, Check, Plus, MessageSquare, Trash2, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

const WELCOME_MSG = { role: 'assistant', content: 'Hey! What can I help with? I can check out patients, book appointments, look up patient info, or answer questions about services and pricing.' };

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

    return { error: `Unknown action: ${name}` };
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
