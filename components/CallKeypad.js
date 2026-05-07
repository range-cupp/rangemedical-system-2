// /components/CallKeypad.js
// DTMF keypad overlay for in-call digit sending and standalone dialing.
// Range Medical

import { useState } from 'react';

const KEYS = [
  { digit: '1', sub: '' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '' },
  { digit: '0', sub: '+' },
  { digit: '#', sub: '' },
];

export default function CallKeypad({ onDigit, onClose, onCall, dialMode }) {
  const [dialInput, setDialInput] = useState('');

  const handlePress = (digit) => {
    if (dialMode) {
      setDialInput(prev => prev + digit);
    }
    if (onDigit) onDigit(digit);
  };

  const handleBackspace = () => {
    setDialInput(prev => prev.slice(0, -1));
  };

  const handleDial = () => {
    if (onCall && dialInput.trim()) {
      onCall(dialInput.trim());
      setDialInput('');
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={e => e.stopPropagation()}>
        {dialMode && (
          <div style={styles.dialDisplay}>
            <input
              type="tel"
              value={dialInput}
              onChange={e => setDialInput(e.target.value.replace(/[^0-9+*#]/g, ''))}
              style={styles.dialInput}
              placeholder="Enter number"
              autoFocus
            />
            {dialInput && (
              <button onClick={handleBackspace} style={styles.backspaceBtn} aria-label="Delete">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            )}
          </div>
        )}

        {!dialMode && (
          <div style={styles.dtmfLabel}>Keypad</div>
        )}

        <div style={styles.grid}>
          {KEYS.map(({ digit, sub }) => (
            <button
              key={digit}
              onClick={() => handlePress(digit)}
              style={styles.key}
            >
              <span style={styles.keyDigit}>{digit}</span>
              {sub && <span style={styles.keySub}>{sub}</span>}
            </button>
          ))}
        </div>

        {dialMode && (
          <div style={styles.dialActions}>
            <button
              onClick={handleDial}
              disabled={!dialInput.trim()}
              style={{ ...styles.callBtn, opacity: dialInput.trim() ? 1 : 0.4 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </button>
          </div>
        )}

        <button onClick={onClose} style={styles.closeBtn}>
          {dialMode ? 'Cancel' : 'Close'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sheet: {
    background: '#fff',
    width: '100%',
    maxWidth: 480,
    borderRadius: '16px 16px 0 0',
    padding: '20px 24px calc(20px + env(safe-area-inset-bottom, 0px))',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  dtmfLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 12,
  },
  dialDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 16,
    padding: '0 8px',
  },
  dialInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    letterSpacing: '0.02em',
  },
  backspaceBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 6,
    display: 'flex',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    width: '100%',
    maxWidth: 280,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: '#f1f5f9',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
    margin: '0 auto',
  },
  keyDigit: {
    fontSize: 24,
    fontWeight: 600,
    color: '#0f172a',
    lineHeight: 1,
  },
  keySub: {
    fontSize: 9,
    fontWeight: 600,
    color: '#94a3b8',
    letterSpacing: '0.12em',
    marginTop: 2,
  },
  dialActions: {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'center',
  },
  callBtn: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: '#22c55e',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    marginTop: 16,
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '8px 16px',
  },
};
