import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, MicOff, ShoppingCart, Calendar, User, Clock, X, Check } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hey! What can I help with? I can check out patients, book appointments, look up patient info, or answer questions about services and pricing.', ts: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [patient, setPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch('/api/pos/services?active=true')
      .then(r => r.json())
      .then(d => setServices(d.services || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const searchPatients = useCallback(async (q) => {
    if (!q || q.length < 2) { setPatientResults([]); return; }
    setSearchingPatient(true);
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setPatientResults(data.patients || []);
    } catch { setPatientResults([]); }
    setSearchingPatient(false);
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
          if (existing) { existing.quantity += item.quantity; }
          else { next.push(item); }
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
            patient_id: args.patient_id,
            patient_name: args.patient_name,
            service_name: args.service,
            service_slug: args.service_slug,
            start_time: startISO,
            end_time: endISO,
            duration_minutes: dur,
            visit_reason: args.service,
            source: 'assistant',
            created_by: 'AI Assistant',
            send_notification: true,
          }),
        });
        const data = await res.json();
        if (res.ok && !data.error) return { success: true, message: `Booked ${args.patient_name} for ${args.service}` };
        return { error: data.error || 'Booking failed' };
      } catch { return { error: 'Failed to create booking' }; }
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
        body: JSON.stringify({
          messages: apiMessages,
          services,
          patientName: patient?.name,
          patientId: patient?.id,
          context: 'general',
        }),
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

        const assistantMsg = {
          role: 'assistant',
          content: data.reply || toolResultText,
          toolResults,
          ts: Date.now(),
        };
        setMessages(prev => [...prev, assistantMsg]);

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
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.toolResults) {
              return [...prev.slice(0, -1), { ...last, content: followUpData.reply }];
            }
            return [...prev, { role: 'assistant', content: followUpData.reply, ts: Date.now() }];
          });
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, I didn\'t get that.', ts: Date.now() }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again?', ts: Date.now() }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  function removeFromCart(index) {
    setCart(prev => prev.filter((_, i) => i !== index));
  }

  const cartTotal = cart.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  function renderToolCard(tr) {
    if (tr.tool === 'add_to_cart' && tr.result.success) {
      return (
        <div style={s.toolCard}>
          <div style={s.toolCardHeader}><ShoppingCart size={14} /> Added to Cart</div>
          <div style={s.toolCardBody}>{tr.result.added}</div>
        </div>
      );
    }
    if (tr.tool === 'search_patient' && tr.result.found) {
      return (
        <div style={s.toolCard}>
          <div style={s.toolCardHeader}><User size={14} /> Patient Results</div>
          {tr.result.patients.map(p => (
            <div key={p.id} style={s.patientResultRow} onClick={() => setPatient(p)}>
              <span style={{ fontWeight: 600 }}>{p.name}</span>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>{p.phone || p.email || ''}</span>
            </div>
          ))}
        </div>
      );
    }
    if (tr.tool === 'check_slots' && tr.result.slots) {
      return (
        <div style={s.toolCard}>
          <div style={s.toolCardHeader}><Calendar size={14} /> {tr.result.service_name} — {tr.result.date}</div>
          <div style={s.slotsGrid}>
            {tr.result.slots.slice(0, 12).map((slot, i) => (
              <button key={i} style={s.slotBtn} onClick={() => {
                setInput(`Book ${patient?.name || 'the patient'} for ${tr.result.service_name} at ${slot.time}`);
                inputRef.current?.focus();
              }}>
                {slot.time}
              </button>
            ))}
          </div>
          {tr.result.slots.length > 12 && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>+{tr.result.slots.length - 12} more slots</div>}
        </div>
      );
    }
    if (tr.tool === 'book_appointment') {
      return (
        <div style={{ ...s.toolCard, borderColor: tr.result.success ? '#86efac' : '#fca5a5' }}>
          <div style={s.toolCardHeader}>{tr.result.success ? <Check size={14} /> : <X size={14} />} {tr.result.success ? 'Booked' : 'Booking Failed'}</div>
          <div style={s.toolCardBody}>{tr.result.message || tr.result.error}</div>
        </div>
      );
    }
    return null;
  }

  return (
    <AdminLayout title="Assistant">
      <div style={s.container}>
        <div style={s.chatArea}>
          {/* Patient bar */}
          <div style={s.patientBar}>
            {patient ? (
              <div style={s.selectedPatient}>
                <User size={14} />
                <span style={{ fontWeight: 600 }}>{patient.name}</span>
                <button style={s.clearBtn} onClick={() => setPatient(null)}><X size={12} /></button>
              </div>
            ) : (
              <div style={s.patientSearchWrap}>
                <input
                  style={s.patientInput}
                  placeholder="Search patient (optional)..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                />
                {patientResults.length > 0 && (
                  <div style={s.patientDropdown}>
                    {patientResults.map(p => (
                      <div key={p.id} style={s.patientOption} onClick={() => {
                        setPatient(p);
                        setPatientSearch('');
                        setPatientResults([]);
                      }}>
                        <span style={{ fontWeight: 500 }}>{p.name || `${p.first_name} ${p.last_name}`}</span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{p.phone || p.email || ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {cart.length > 0 && (
              <button style={s.cartToggle} onClick={() => setCartOpen(!cartOpen)}>
                <ShoppingCart size={14} />
                <span>{cart.length}</span>
                <span style={{ fontWeight: 400, color: '#6b7280' }}>${(cartTotal / 100).toFixed(2)}</span>
              </button>
            )}
          </div>

          {/* Messages */}
          <div style={s.messagesList}>
            {messages.map((msg, i) => (
              <div key={i} style={msg.role === 'user' ? s.userMsgRow : s.aiMsgRow}>
                <div style={msg.role === 'user' ? s.userBubble : s.aiBubble}>
                  {msg.content}
                  {msg.toolResults && msg.toolResults.map((tr, j) => (
                    <div key={j} style={{ marginTop: '8px' }}>{renderToolCard(tr)}</div>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div style={s.aiMsgRow}>
                <div style={{ ...s.aiBubble, color: '#9ca3af' }}>Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={s.inputBar}>
            <input
              ref={inputRef}
              style={s.textInput}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Type a message... (e.g. 'Add B12 injection 12-pack' or 'Book Sarah for HBOT tomorrow')"
              disabled={loading}
            />
            <button style={{ ...s.sendBtn, opacity: loading || !input.trim() ? 0.4 : 1 }} onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Cart sidebar */}
        {cartOpen && cart.length > 0 && (
          <div style={s.cartSidebar}>
            <div style={s.cartHeader}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Cart</span>
              <button style={s.clearBtn} onClick={() => setCartOpen(false)}><X size={14} /></button>
            </div>
            {cart.map((item, i) => (
              <div key={i} style={s.cartItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {item.quantity > 1 ? `${item.quantity} × ` : ''}${((item.price || 0) / 100).toFixed(2)}
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>${(((item.price || 0) * (item.quantity || 1)) / 100).toFixed(2)}</div>
                <button style={{ ...s.clearBtn, marginLeft: '8px' }} onClick={() => removeFromCart(i)}><X size={12} /></button>
              </div>
            ))}
            <div style={s.cartTotal}>
              <span>Total</span>
              <span style={{ fontWeight: 700, fontSize: '18px' }}>${(cartTotal / 100).toFixed(2)}</span>
            </div>
            <button style={s.checkoutBtn} onClick={() => {
              const params = new URLSearchParams();
              if (patient?.id) params.set('patient_id', patient.id);
              window.location.href = `/admin/checkout${params.toString() ? '?' + params : ''}`;
            }}>
              Go to Checkout
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const s = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 80px)',
    gap: '0',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  patientBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fff',
  },
  selectedPatient: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    background: '#eef2ff',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#4338ca',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    color: '#9ca3af',
    display: 'flex',
  },
  patientSearchWrap: {
    position: 'relative',
    flex: 1,
    maxWidth: '300px',
  },
  patientInput: {
    width: '100%',
    padding: '6px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
  },
  patientDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    marginTop: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  patientOption: {
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    borderBottom: '1px solid #f3f4f6',
  },
  cartToggle: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    color: '#166534',
  },
  messagesList: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  userMsgRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  aiMsgRow: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  userBubble: {
    maxWidth: '70%',
    padding: '10px 14px',
    background: '#4f46e5',
    color: '#fff',
    borderRadius: '16px 16px 4px 16px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  aiBubble: {
    maxWidth: '80%',
    padding: '10px 14px',
    background: '#f3f4f6',
    color: '#111827',
    borderRadius: '16px 16px 16px 4px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  inputBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
    background: '#fff',
  },
  textInput: {
    flex: 1,
    padding: '12px 16px',
    border: '1.5px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
  },
  sendBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    border: 'none',
    background: '#4f46e5',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#fff',
  },
  toolCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: '#f9fafb',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
  },
  toolCardBody: {
    padding: '8px 12px',
    fontSize: '13px',
    color: '#4b5563',
  },
  patientResultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '13px',
    borderBottom: '1px solid #f3f4f6',
  },
  slotsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    padding: '8px 12px',
  },
  slotBtn: {
    padding: '6px 12px',
    border: '1px solid #c7d2fe',
    borderRadius: '8px',
    background: '#eef2ff',
    color: '#4338ca',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  cartSidebar: {
    width: '280px',
    borderLeft: '1px solid #e5e7eb',
    background: '#fff',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  cartTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderTop: '2px solid #111827',
    marginTop: 'auto',
    fontSize: '15px',
    fontWeight: 600,
  },
  checkoutBtn: {
    width: '100%',
    padding: '12px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
