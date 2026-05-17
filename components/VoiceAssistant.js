import { useState, useRef, useCallback, useEffect } from 'react';

export default function VoiceAssistant({ services, patientName, onCartAction }) {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorDetail, setErrorDetail] = useState('');
  const [transcript, setTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const playbackQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const nextPlaybackTimeRef = useRef(0);

  useEffect(() => {
    return () => disconnect();
  }, []);

  function buildSystemPrompt() {
    const catalog = (services || []).map(s => {
      const price = s.price_cents || s.price || 0;
      const priceStr = price ? `$${(price / 100).toFixed(0)}` : 'varies';
      return `- "${s.name}" (id:${s.id}) | ${priceStr}${s.sub_category ? ` | ${s.sub_category}` : ''}`;
    }).join('\n');

    return `You are a checkout assistant at Range Medical clinic. You help staff ring up patients through voice conversation. Be conversational, brief, and sound like a helpful coworker.

PATIENT: ${patientName || 'Unknown'}

CATALOG:
${catalog}

PRODUCT DECISION TREES — ask these questions one at a time:

WEIGHT LOSS:
1. Which medication? Tirzepatide, Retatrutide, or Semaglutide
2. What dose? Tirzepatide: 1.25mg ($50), 2.5mg ($100), 5mg ($137), 7.5mg ($150), 10mg ($162), 12.5mg ($175). Retatrutide: 1mg ($62.50) up to 12mg ($215)
3. How many injections? Usually 4 (monthly block)
4. Take-home or in-clinic?

IV THERAPY:
- Range IV signature drips (all $225): Signature, Immune Defense, Energy & Vitality, Muscle Recovery, Detox & Cellular Repair
- Specialty: NAD+ (250mg $375, 500mg $525, 750mg $650, 1000mg $775), Vitamin C (25g $215, 50g $255, 75g $330), Glutathione (1g $170, 2g $190, 3g $215)

PEPTIDES:
1. Which program? BPC-157, Recovery 4-Blend, KLOW, GLOW, GH Blends, BDNF, MOTS-C, etc.
2. Duration? 10 Day ($250), 20 Day ($450), 30 Day ($675)
3. Phase? (if applicable)
4. Take-home or in-clinic?

INJECTIONS:
- Standard ($35): B12, B-Complex, Vitamin D3, Biotin, Amino Blend, BCAA, NAC
- Premium ($50): L-Carnitine, Glutathione, MIC-B12/Skinny Shot
- NAD+ ($0.50/mg): 50mg $25, 100mg $50, 150mg $75
- Buy 10 Get 12 at 10+ units

HRT:
1. Primary medication? Testosterone Cypionate, Enanthate, HCG, Nandrolone
2. Route? Intramuscular (every 3.5 days/weekly) or Subcutaneous (daily)
3. Dose? Males: 20-200mg, Females: 5-100mg
4. Supply type? Pre-filled syringes, Vial 5ml, Vial 10ml
5. Secondary meds? HCG, Gonadorelin, Anastrozole

HBOT: Single $185, 5-Pack $850, 10-Pack $1600
RED LIGHT: Single $85, 5-Pack $375, 10-Pack $600

RULES:
- Ask one question at a time. Don't dump all options at once.
- Common abbreviations: "tirz" = Tirzepatide, "sema" = Semaglutide, "reta" = Retatrutide, "test cyp" = Testosterone Cypionate, "BPC" = BPC-157, "NAD" = NAD+, "HBOT" = Hyperbaric
- Once you have all details, confirm the item, price, and quantity.
- When staff confirms, call the add_to_cart function.
- Keep responses SHORT — 1-2 sentences max. This is voice, not text.
- If the staff says multiple items at once, handle them one at a time.`;
  }

  function buildTools() {
    return [{
      type: 'function',
      name: 'add_to_cart',
      description: 'Add confirmed items to the checkout cart. Only call after staff verbally confirms.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Display name of the item' },
                catalog_id: { type: 'string', description: 'Exact ID from the catalog' },
                quantity: { type: 'number', description: 'Number of units' },
                price_cents: { type: 'number', description: 'Price per unit in cents' },
              },
              required: ['name', 'quantity'],
            },
          },
        },
        required: ['items'],
      },
    }];
  }

  async function connect() {
    setStatus('connecting');
    try {
      const sessionRes = await fetch('/api/ai/realtime-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: buildSystemPrompt(),
          tools: buildTools(),
        }),
      });
      const sessionData = await sessionRes.json();
      if (!sessionData.clientSecret) {
        const detail = sessionData.detail || sessionData.error || 'Unknown error';
        console.error('Voice session error:', detail);
        setErrorDetail(typeof detail === 'string' ? detail : JSON.stringify(detail));
        setStatus('error');
        return;
      }
      setErrorDetail('');

      const model = sessionData.model || 'gpt-4o-mini-realtime-preview';
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${model}`,
        ['realtime', `openai-insecure-api-key.${sessionData.clientSecret}`]
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        setActive(true);
        startMic();
      };

      ws.onmessage = (event) => handleServerEvent(JSON.parse(event.data));

      ws.onerror = () => {
        setStatus('error');
        disconnect();
      };

      ws.onclose = () => {
        setStatus('idle');
        setActive(false);
      };
    } catch (err) {
      console.error('Voice connect error:', err);
      setStatus('error');
    }
  }

  function disconnect() {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    setActive(false);
    setStatus('idle');
    setTranscript('');
    setAiTranscript('');
  }

  async function startMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 24000, channelCount: 1 } });
      streamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const pcm = e.inputBuffer.getChannelData(0);
        const int16 = float32ToInt16(pcm);
        const b64 = arrayBufferToBase64(int16.buffer);
        wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64 }));
      };

      source.connect(processor);
      processor.connect(ctx.destination);
      setStatus('listening');
    } catch (err) {
      console.error('Mic error:', err);
      setStatus('error');
    }
  }

  function handleServerEvent(event) {
    switch (event.type) {
      // Speech detection (both beta and GA names)
      case 'input_audio_buffer.speech_started':
        setStatus('listening');
        stopPlayback();
        break;

      case 'input_audio_buffer.speech_stopped':
        setStatus('processing');
        break;

      // User transcript (beta + GA)
      case 'conversation.item.input_audio_transcription.completed':
        setTranscript(event.transcript || '');
        break;

      // AI text transcript (beta names)
      case 'response.audio_transcript.delta':
        setAiTranscript(prev => prev + (event.delta || ''));
        break;

      // AI text transcript (GA names)
      case 'response.output_audio_transcript.delta':
        setAiTranscript(prev => prev + (event.delta || ''));
        break;

      case 'response.audio_transcript.done':
      case 'response.output_audio_transcript.done':
        setStatus('listening');
        break;

      // AI audio (beta name)
      case 'response.audio.delta':
        if (event.delta) {
          const audioData = base64ToInt16(event.delta);
          queuePlayback(audioData);
        }
        setStatus('speaking');
        break;

      // AI audio (GA name)
      case 'response.output_audio.delta':
        if (event.delta) {
          const audioData = base64ToInt16(event.delta);
          queuePlayback(audioData);
        }
        setStatus('speaking');
        break;

      // AI text output (GA)
      case 'response.output_text.delta':
        setAiTranscript(prev => prev + (event.delta || ''));
        break;

      case 'response.function_call_arguments.done':
        handleFunctionCall(event);
        break;

      case 'response.done':
        if (event.response?.output) {
          for (const item of event.response.output) {
            if (item.type === 'function_call') {
              handleFunctionCallFromOutput(item);
            }
          }
        }
        break;
    }
  }

  function handleFunctionCall(event) {
    // Handled in response.done for complete args
  }

  function handleFunctionCallFromOutput(item) {
    if (item.name === 'add_to_cart') {
      try {
        const args = JSON.parse(item.arguments);
        const resolved = (args.items || []).map(cartItem => {
          const svc = (services || []).find(s =>
            String(s.id) === String(cartItem.catalog_id) ||
            s.name.toLowerCase().includes((cartItem.name || '').toLowerCase())
          );
          if (svc) {
            return {
              id: svc.id,
              name: svc.name,
              category: svc.category,
              price: svc.price_cents || svc.price || cartItem.price_cents || 0,
              quantity: cartItem.quantity || 1,
              recurring: svc.recurring || false,
              source: 'pos_service',
            };
          }
          return null;
        }).filter(Boolean);

        if (resolved.length > 0 && onCartAction) {
          onCartAction(resolved);
        }

        // Send function result back
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: item.call_id,
              output: JSON.stringify({ success: true, added: resolved.length }),
            },
          }));
          wsRef.current.send(JSON.stringify({ type: 'response.create' }));
        }
      } catch (err) {
        console.error('Function call parse error:', err);
      }
    }
  }

  function queuePlayback(int16Data) {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const float32 = int16ToFloat32(int16Data);
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startTime = Math.max(now, nextPlaybackTimeRef.current);
    source.start(startTime);
    nextPlaybackTimeRef.current = startTime + buffer.duration;

    playbackQueueRef.current.push(source);
    isPlayingRef.current = true;

    source.onended = () => {
      playbackQueueRef.current = playbackQueueRef.current.filter(s => s !== source);
      if (playbackQueueRef.current.length === 0) {
        isPlayingRef.current = false;
      }
    };
  }

  function stopPlayback() {
    for (const source of playbackQueueRef.current) {
      try { source.stop(); } catch {}
    }
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlaybackTimeRef.current = 0;
    setAiTranscript('');
  }

  function float32ToInt16(float32) {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }

  function int16ToFloat32(int16) {
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF);
    }
    return float32;
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToInt16(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  }

  const statusLabel = {
    idle: 'Start Voice',
    connecting: 'Connecting...',
    connected: 'Connected',
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
    error: 'Error — Try Again',
  };

  const statusColor = {
    idle: '#6366f1',
    connecting: '#f59e0b',
    connected: '#10b981',
    listening: '#10b981',
    processing: '#f59e0b',
    speaking: '#6366f1',
    error: '#ef4444',
  };

  return (
    <div style={styles.wrap}>
      <button
        style={{
          ...styles.voiceBtn,
          background: active ? '#fee2e2' : '#eef2ff',
          borderColor: active ? '#fca5a5' : '#c7d2fe',
          color: active ? '#dc2626' : '#4f46e5',
        }}
        onClick={active ? disconnect : connect}
      >
        <span style={styles.pulse(active, statusColor[status])}>
          {active ? '■' : '🎙'}
        </span>
        <span style={styles.btnLabel}>
          {active ? 'End Voice' : 'Voice Checkout'}
        </span>
        <span style={{ ...styles.statusDot, background: statusColor[status] }} />
        <span style={styles.statusText}>{statusLabel[status]}</span>
      </button>
      {errorDetail && (
        <div style={{ margin: '8px 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '12px', color: '#991b1b', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {errorDetail}
        </div>
      )}
      {active && (
        <div style={styles.transcriptArea}>
          {transcript && (
            <div style={styles.userLine}>
              <span style={styles.lineLabel}>You:</span> {transcript}
            </div>
          )}
          {aiTranscript && (
            <div style={styles.aiLine}>
              <span style={styles.lineLabel}>AI:</span> {aiTranscript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { marginBottom: '12px' },
  voiceBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'left',
    background: '#eef2ff',
  },
  pulse: (active, color) => ({
    fontSize: active ? '14px' : '18px',
    width: '24px',
    textAlign: 'center',
    animation: active ? 'none' : undefined,
  }),
  btnLabel: { flex: 1 },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '12px',
    color: '#666',
    fontWeight: 400,
  },
  transcriptArea: {
    marginTop: '8px',
    padding: '12px',
    borderRadius: '8px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  userLine: { color: '#374151', marginBottom: '6px' },
  aiLine: { color: '#4f46e5' },
  lineLabel: { fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', marginRight: '6px' },
};
