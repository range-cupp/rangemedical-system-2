import { useState, useRef, useCallback, useEffect } from 'react';
import { getVoiceContext } from '../lib/voice-contexts';

export default function VoiceAssistant({ context = 'general', data = {}, onAction }) {
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

  async function connect() {
    setStatus('connecting');
    try {
      const voiceCtx = getVoiceContext(context, data);
      const sessionRes = await fetch('/api/ai/realtime-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: voiceCtx.instructions,
          tools: voiceCtx.tools,
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
    // Log all events for debugging (remove later)
    if (!event.type?.includes('audio.delta')) {
      console.log('[Voice]', event.type, event.error ? event.error : '');
    }

    switch (event.type) {
      case 'error':
        console.error('[Voice] Server error:', event.error);
        break;

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
    try {
      const args = JSON.parse(item.arguments);
      console.log('[Voice] Function call:', item.name, args);

      if (onAction) {
        onAction(item.name, args);
      }

      // Send function result back
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: item.call_id,
            output: JSON.stringify({ success: true }),
          },
        }));
        wsRef.current.send(JSON.stringify({ type: 'response.create' }));
      }
    } catch (err) {
      console.error('Function call parse error:', err);
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
