import { useState, useEffect, useRef, useCallback } from 'react';

export default function AiAssistant({ context, services, patientName, onCartAction }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, []);

  const speak = useCallback((text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleaned = text.replace(/\*\*/g, '').replace(/```[\s\S]*?```/g, '');
    const utt = new SpeechSynthesisUtterance(cleaned);
    utt.rate = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(v => v.name === 'Samantha') ||
      voices.find(v => v.lang === 'en-US' && v.localService) ||
      voices[0];
    if (preferred) utt.voice = preferred;
    window.speechSynthesis.speak(utt);
  }, [ttsEnabled]);

  async function handleSend(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    const userMsg = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const svcPayload = (services || []).map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        price_cents: s.price || s.price_cents,
        sub_category: s.sub_category,
        recurring: s.recurring,
        description: s.description,
        duration_days: s.duration_days,
        delivery_method: s.delivery_method,
      }));
      const resp = await fetch('/api/ai/checkout-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          services: svcPayload,
          patientName: patientName || '',
          context: context || 'checkout',
        }),
      });
      const data = await resp.json();
      if (data.error) {
        const errMsg = { role: 'assistant', content: 'Sorry, something went wrong. Try again.' };
        setMessages(prev => [...prev, errMsg]);
        speak(errMsg.content);
      } else {
        const assistantMsg = { role: 'assistant', content: data.reply };
        if (data.cartAction?.items?.length > 0) {
          assistantMsg.cartAction = data.cartAction;
          if (onCartAction) onCartAction(data.cartAction.items);
        }
        setMessages(prev => [...prev, assistantMsg]);
        speak(data.reply);
      }
    } catch {
      const errMsg = { role: 'assistant', content: 'Connection error. Try again.' };
      setMessages(prev => [...prev, errMsg]);
      speak(errMsg.content);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([]);
    setInput('');
    setLoading(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function toggleTts() {
    if (ttsEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
    setTtsEnabled(!ttsEnabled);
  }

  const addedCount = messages.filter(m => m.role === 'assistant' && m.cartAction).length;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={styles.barWrap}>
        <button style={styles.barToggle} onClick={() => setOpen(!open)}>
          <span style={styles.barIcon}>✦</span>
          <span style={styles.barLabel}>
            {open ? 'Close Assistant' : 'AI Checkout Assistant'}
          </span>
          {addedCount > 0 && !open && (
            <span style={styles.barBadge}>{addedCount} added</span>
          )}
        </button>
      </div>
      {open && (
        <div style={styles.drawer}>
          <div style={styles.messageArea}>
            {messages.length === 0 && (
              <div style={styles.welcome}>
                <div style={styles.welcomeIcon}>✦</div>
                <div style={styles.welcomeTitle}>Hey! What are we checking out?</div>
                <div style={styles.welcomeHint}>
                  Just type or dictate what you need — I'll confirm before adding anything.
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} style={msg.role === 'user' ? styles.msgUser : styles.msgAssistant}>
                {msg.role === 'assistant' && <div style={styles.avatar}>✦</div>}
                <div style={msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}>
                  {msg.content}
                  {msg.cartAction && (
                    <div style={styles.cartAdded}>
                      ✓ {msg.cartAction.items.length} item{msg.cartAction.items.length !== 1 ? 's' : ''} added to cart
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={styles.msgAssistant}>
                <div style={styles.avatar}>✦</div>
                <div style={styles.bubbleAssistant}>
                  <span style={styles.typing}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div style={styles.inputArea}>
            <input
              type="text"
              placeholder="Type or dictate with Wispr..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              style={styles.inputField}
              disabled={loading}
            />
            <button
              style={{ ...styles.sendBtn, opacity: loading || !input.trim() ? 0.4 : 1 }}
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
            >
              ↑
            </button>
            <button
              style={ttsEnabled ? styles.ttsBtnActive : styles.ttsBtn}
              onClick={toggleTts}
              title={ttsEnabled ? 'Mute voice' : 'Enable voice'}
            >
              {ttsEnabled ? '🔊' : '🔇'}
            </button>
            {messages.length > 0 && (
              <button style={styles.resetBtn} onClick={handleReset} title="New conversation">
                ↻
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  barWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  barToggle: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #c7d2fe',
    background: '#fafbff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    color: '#4f46e5',
    textAlign: 'left',
  },
  barIcon: { fontSize: '16px' },
  barLabel: { flex: 1 },
  barBadge: {
    fontSize: '11px',
    fontWeight: 700,
    background: '#dcfce7',
    color: '#16a34a',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  drawer: {
    borderRadius: '10px',
    border: '1.5px solid #c7d2fe',
    background: '#fff',
    marginTop: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '400px',
  },
  messageArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    minHeight: '120px',
    maxHeight: '300px',
  },
  welcome: { textAlign: 'center', padding: '20px 0' },
  welcomeIcon: { fontSize: '28px', color: '#6366f1', marginBottom: '8px' },
  welcomeTitle: { fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' },
  welcomeHint: { fontSize: '13px', color: '#888' },
  msgUser: { display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' },
  msgAssistant: { display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px' },
  avatar: {
    width: '28px', height: '28px', borderRadius: '50%', background: '#eef2ff',
    color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 700, flexShrink: 0,
  },
  bubbleUser: {
    background: '#4f46e5', color: '#fff', padding: '10px 14px',
    borderRadius: '14px 14px 4px 14px', fontSize: '14px', lineHeight: '1.4', maxWidth: '80%',
  },
  bubbleAssistant: {
    background: '#f3f4f6', color: '#1a1a1a', padding: '10px 14px',
    borderRadius: '14px 14px 14px 4px', fontSize: '14px', lineHeight: '1.4', maxWidth: '85%',
  },
  cartAdded: {
    marginTop: '8px', padding: '6px 10px', background: '#dcfce7', color: '#166534',
    borderRadius: '6px', fontSize: '12px', fontWeight: 700,
  },
  typing: { color: '#888', fontStyle: 'italic' },
  inputArea: {
    display: 'flex', gap: '8px', padding: '10px 14px',
    borderTop: '1px solid #e5e7eb', background: '#fafbff',
  },
  inputField: {
    flex: 1, border: '1px solid #e0e0e0', borderRadius: '8px',
    padding: '10px 12px', fontSize: '14px', outline: 'none', background: '#fff',
  },
  sendBtn: {
    width: '38px', height: '38px', borderRadius: '8px', border: 'none',
    background: '#4f46e5', color: '#fff', fontSize: '18px', fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  resetBtn: {
    width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #e0e0e0',
    background: '#fff', color: '#888', fontSize: '18px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ttsBtn: {
    width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #e0e0e0',
    background: '#fff', fontSize: '16px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ttsBtnActive: {
    width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #c7d2fe',
    background: '#eef2ff', fontSize: '16px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
};
