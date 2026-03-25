// /components/AppCallBar.js
// Floating call UI for the Range Medical Staff App
// Shows as a sticky bar when a call is active or incoming
// Range Medical

import { CALL_STATE } from '../hooks/useVoiceCall';

export default function AppCallBar({ callState, callInfo, muted, onHangUp, onToggleMute, formatDuration, incomingCall, onAnswer, onReject }) {
  // Incoming call notification
  if (callState === CALL_STATE.INCOMING) {
    const from = callInfo?.from || callInfo?.name || 'Unknown caller';
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        zIndex: 100,
        background: '#0f172a',
        borderBottom: '3px solid #22c55e',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        {/* Pulsing ring icon */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📞</div>
          <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #22c55e', opacity: 0.5, animation: 'ring-pulse 1.4s ease-out infinite' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Incoming call</div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{from}</div>
        </div>
        <button
          onClick={onReject}
          style={{ width: 44, height: 44, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          📵
        </button>
        <button
          onClick={onAnswer}
          style={{ width: 44, height: 44, borderRadius: '50%', background: '#22c55e', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          📞
        </button>
        <style>{`@keyframes ring-pulse { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.6); opacity: 0; } }`}</style>
      </div>
    );
  }

  // Active call bar
  if (callState === CALL_STATE.CALLING || callState === CALL_STATE.IN_CALL) {
    const isConnected = callState === CALL_STATE.IN_CALL;
    const label = callInfo?.name || callInfo?.to || callInfo?.from || 'Unknown';
    const duration = callInfo?.duration || 0;

    return (
      <div style={{
        position: 'fixed',
        bottom: 72,  // Just above the tab bar
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: 456,
        zIndex: 50,
        background: isConnected ? '#166534' : '#1e293b',
        borderRadius: 0,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: `1.5px solid ${isConnected ? '#22c55e' : '#334155'}`,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: isConnected ? '#bbf7d0' : '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isConnected ? `On call · ${formatDuration(duration)}` : 'Calling…'}
          </div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
            {label}
          </div>
        </div>

        {/* Mute button */}
        {isConnected && (
          <button
            onClick={onToggleMute}
            title={muted ? 'Unmute' : 'Mute'}
            style={{
              width: 40, height: 40,
              borderRadius: '50%',
              background: muted ? '#ef4444' : 'rgba(255,255,255,0.12)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {muted ? '🔇' : '🎤'}
          </button>
        )}

        {/* Hang up */}
        <button
          onClick={onHangUp}
          title="Hang up"
          style={{
            width: 44, height: 44,
            borderRadius: '50%',
            background: '#ef4444',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          📵
        </button>
      </div>
    );
  }

  // Call just ended
  if (callState === CALL_STATE.ENDED) {
    const label = callInfo?.name || callInfo?.to || callInfo?.from || '';
    const duration = callInfo?.duration || 0;
    return (
      <div style={{
        position: 'fixed',
        bottom: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: 456,
        zIndex: 50,
        background: '#1e293b',
        borderRadius: 0,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '1.5px solid #334155',
      }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Call ended</div>
          <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>
            {label}{duration > 0 ? ` · ${formatDuration(duration)}` : ''}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
