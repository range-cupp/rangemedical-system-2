// /components/AdminCallBar.js
// Floating softphone widget for the Range Medical admin dashboard.
// Bottom-right pinned. Shows incoming ring, active call, and ended states.
// Desktop-optimized — wider than the mobile AppCallBar and uses real buttons.
// Range Medical System

import { CALL_STATE } from '../hooks/useVoiceCall';

export default function AdminCallBar({
  callState,
  callInfo,
  muted,
  onHangUp,
  onToggleMute,
  formatDuration,
  onAnswer,
  onReject,
}) {
  // Format a phone number for display (E.164 → (949) 997-3988)
  const fmtPhone = (raw) => {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return raw;
  };

  // ── Incoming call ──────────────────────────────────────────────────────────
  if (callState === CALL_STATE.INCOMING) {
    const from = callInfo?.name || fmtPhone(callInfo?.from) || 'Unknown caller';
    return (
      <div style={styles.incoming}>
        <div style={styles.ringIconWrap}>
          <div style={styles.ringIcon}>📞</div>
          <div style={styles.ringPulse} />
        </div>
        <div style={styles.body}>
          <div style={styles.incomingLabel}>Incoming call</div>
          <div style={styles.name}>{from}</div>
        </div>
        <button onClick={onReject} style={{ ...styles.btn, ...styles.btnReject }} title="Decline">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
            <line x1="23" y1="1" x2="1" y2="23"/>
          </svg>
        </button>
        <button onClick={onAnswer} style={{ ...styles.btn, ...styles.btnAnswer }} title="Answer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </button>
        <style>{`@keyframes range-ring-pulse { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.7); opacity: 0; } }`}</style>
      </div>
    );
  }

  // ── Active call (ringing outbound OR connected) ────────────────────────────
  if (callState === CALL_STATE.CALLING || callState === CALL_STATE.IN_CALL) {
    const isConnected = callState === CALL_STATE.IN_CALL;
    const rawTarget = callInfo?.to || callInfo?.from || '';
    const label = callInfo?.name || fmtPhone(rawTarget) || 'Unknown';
    const duration = callInfo?.duration || 0;

    return (
      <div style={{ ...styles.active, borderColor: isConnected ? '#22c55e' : '#475569' }}>
        <div style={{ ...styles.statusDot, background: isConnected ? '#22c55e' : '#f59e0b' }} />
        <div style={styles.body}>
          <div style={styles.activeLabel}>
            {isConnected ? `On call · ${formatDuration(duration)}` : 'Calling…'}
          </div>
          <div style={styles.name}>{label}</div>
        </div>

        {isConnected && (
          <button
            onClick={onToggleMute}
            title={muted ? 'Unmute' : 'Mute'}
            style={{ ...styles.btn, ...(muted ? styles.btnMuteOn : styles.btnMuteOff) }}
          >
            {muted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
        )}

        <button onClick={onHangUp} style={{ ...styles.btn, ...styles.btnReject }} title="Hang up">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
            <line x1="23" y1="1" x2="1" y2="23"/>
          </svg>
        </button>
      </div>
    );
  }

  // ── Call just ended (auto-dismisses after 3s via hook) ─────────────────────
  if (callState === CALL_STATE.ENDED) {
    const rawTarget = callInfo?.to || callInfo?.from || '';
    const label = callInfo?.name || fmtPhone(rawTarget) || '';
    const duration = callInfo?.duration || 0;
    return (
      <div style={{ ...styles.active, borderColor: '#475569' }}>
        <div style={{ ...styles.statusDot, background: '#94a3b8' }} />
        <div style={styles.body}>
          <div style={styles.activeLabel}>Call ended</div>
          <div style={styles.name}>{label}{duration > 0 ? ` · ${formatDuration(duration)}` : ''}</div>
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  // Shared base for bottom-right pinning
  incoming: {
    position: 'fixed',
    bottom: 20,
    right: 20,
    zIndex: 10000,
    minWidth: 360,
    background: '#0f172a',
    border: '2px solid #22c55e',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
  },
  active: {
    position: 'fixed',
    bottom: 20,
    right: 20,
    zIndex: 10000,
    minWidth: 320,
    background: '#0f172a',
    border: '1.5px solid #475569',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
  },
  ringIconWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  ringIcon: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#22c55e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  ringPulse: {
    position: 'absolute',
    inset: -4,
    borderRadius: '50%',
    border: '2px solid #22c55e',
    opacity: 0.6,
    animation: 'range-ring-pulse 1.4s ease-out infinite',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  incomingLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  activeLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  name: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: 2,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: 0,
  },
  btnAnswer: { background: '#22c55e' },
  btnReject: { background: '#ef4444' },
  btnMuteOn:  { background: '#ef4444' },
  btnMuteOff: { background: 'rgba(255,255,255,0.12)' },
};
