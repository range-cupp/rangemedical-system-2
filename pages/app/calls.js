// /pages/app/calls.js
// Calls tab — keypad dialer + patient picker + recent call history
// Range Medical Employee App

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../../components/AppLayout';
import useVoiceCall, { CALL_STATE } from '../../hooks/useVoiceCall';

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

export default function AppCalls() {
  const router = useRouter();
  const [staff, setStaff] = useState(null);
  const [view, setView] = useState('keypad'); // 'keypad' | 'recents'
  const [dialInput, setDialInput] = useState('');
  const [calls, setCalls] = useState([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    const session = localStorage.getItem('staff_session');
    if (session) try { setStaff(JSON.parse(session)); } catch {}
  }, []);

  const voice = useVoiceCall({ employeeId: staff?.id });

  // Fetch recent calls
  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    setLoadingCalls(true);
    try {
      const res = await fetch('/api/twilio/sync-calls?limit=30');
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls || []);
      }
    } catch {} finally {
      setLoadingCalls(false);
    }
  };

  // Patient search with debounce
  const handlePatientSearch = (q) => {
    setPatientSearch(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setPatientResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await fetch(`/api/patient/search?q=${encodeURIComponent(q)}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          setPatientResults(data.patients || []);
        }
      } catch {} finally {
        setSearchingPatients(false);
      }
    }, 300);
  };

  const handleDial = (number, name) => {
    if (!number || voice.isActive) return;
    let n = number.replace(/\D/g, '');
    if (n.length === 10) n = '+1' + n;
    else if (n.length === 11 && n.startsWith('1')) n = '+' + n;
    else if (!n.startsWith('+')) n = '+' + n;
    voice.call({ to: n, name: name || n });
  };

  const handleKeyPress = (digit) => {
    setDialInput(prev => prev + digit);
    if (voice.callState === CALL_STATE.IN_CALL) {
      voice.sendDigits(digit);
    }
  };

  const handleBackspace = () => {
    setDialInput(prev => prev.slice(0, -1));
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
    if (isToday) return timeStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' }) + ' ' + timeStr;
  };

  const formatDuration = (secs) => {
    if (!secs) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <>
      <Head>
        <title>Calls — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <AppLayout title="Calls" voiceHook={voice}>
        {/* Error banner */}
        {voice.error && (
          <div style={{ margin: '12px 12px 0', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
            {voice.error}
          </div>
        )}

        {/* Toggle: Keypad / Recents */}
        <div style={{ display: 'flex', margin: '12px 12px 0', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setView('keypad')}
            style={{
              flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: view === 'keypad' ? '#fff' : 'transparent',
              color: view === 'keypad' ? '#0f172a' : '#64748b',
              borderRadius: 6,
              boxShadow: view === 'keypad' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >Keypad</button>
          <button
            onClick={() => setView('recents')}
            style={{
              flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: view === 'recents' ? '#fff' : 'transparent',
              color: view === 'recents' ? '#0f172a' : '#64748b',
              borderRadius: 6,
              boxShadow: view === 'recents' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >Recents</button>
        </div>

        {view === 'keypad' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 12px' }}>
            {/* Patient search */}
            <div style={{ width: '100%', marginBottom: 16 }}>
              <input
                value={patientSearch}
                onChange={e => handlePatientSearch(e.target.value)}
                placeholder="Search patients to call..."
                type="search"
                style={{
                  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8,
                  padding: '10px 14px', fontSize: 15, outline: 'none', background: '#fff',
                }}
              />
              {patientResults.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 4, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  {patientResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (p.phone) {
                          handleDial(p.phone, `${p.first_name} ${p.last_name}`);
                          setPatientSearch('');
                          setPatientResults([]);
                        }
                      }}
                      disabled={!p.phone}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                        padding: '12px 14px', border: 'none', borderBottom: '1px solid #f1f5f9',
                        background: 'none', cursor: p.phone ? 'pointer' : 'default', textAlign: 'left',
                        opacity: p.phone ? 1 : 0.5,
                      }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#475569', flexShrink: 0 }}>
                        {(p.first_name?.[0] || '') + (p.last_name?.[0] || '')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{p.first_name} {p.last_name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.phone || 'No phone'}</div>
                      </div>
                      {p.phone && (
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {searchingPatients && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>Searching...</div>}
            </div>

            {/* Dial display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 280, marginBottom: 12, minHeight: 40 }}>
              <input
                type="tel"
                value={dialInput}
                onChange={e => setDialInput(e.target.value.replace(/[^0-9+*#]/g, ''))}
                placeholder="Enter number"
                style={{ flex: 1, fontSize: 22, fontWeight: 700, color: '#0f172a', textAlign: 'center', border: 'none', outline: 'none', background: 'transparent' }}
              />
              {dialInput && (
                <button onClick={handleBackspace} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                </button>
              )}
            </div>

            {/* Keypad grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', maxWidth: 280 }}>
              {KEYS.map(({ digit, sub }) => (
                <button
                  key={digit}
                  onClick={() => handleKeyPress(digit)}
                  style={{
                    width: 68, height: 68, borderRadius: '50%', background: '#f1f5f9', border: 'none',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>{digit}</span>
                  {sub && <span style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.12em', marginTop: 2 }}>{sub}</span>}
                </button>
              ))}
            </div>

            {/* Call button */}
            <button
              onClick={() => handleDial(dialInput)}
              disabled={!dialInput.trim() || voice.isActive}
              style={{
                marginTop: 16, width: 60, height: 60, borderRadius: '50%',
                background: (!dialInput.trim() || voice.isActive) ? '#e2e8f0' : '#22c55e',
                border: 'none', cursor: (!dialInput.trim() || voice.isActive) ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </button>

            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Calls from (949) 997-3988</div>
          </div>
        )}

        {view === 'recents' && (
          <div style={{ padding: '12px' }}>
            {loadingCalls ? (
              <div className="app-spinner" />
            ) : calls.length === 0 ? (
              <div className="app-empty">
                <div style={{ fontSize: 36, marginBottom: 12 }}>📞</div>
                No call history yet
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {calls.map((c, i) => {
                  const number = c.direction === 'inbound' ? c.from_number || c.from : c.to_number || c.to;
                  const name = c.patient_name || c.contact_name || null;
                  const isMissed = c.status === 'no-answer' || c.status === 'busy' || c.status === 'failed';
                  const color = isMissed ? '#ef4444' : (c.direction === 'inbound' ? '#22c55e' : '#6366f1');
                  const icon = isMissed ? '↗️' : (c.direction === 'inbound' ? '↙️' : '↗️');
                  return (
                    <div
                      key={c.id || c.sid || i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                        borderBottom: i < calls.length - 1 ? '1px solid #f1f5f9' : 'none',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                      }}
                      onClick={() => { if (number && !voice.isActive) handleDial(number, name); }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        {icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: isMissed ? '#ef4444' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {name || number || 'Unknown'}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                          {name && number && <span>{number} · </span>}
                          {formatTime(c.start_time || c.created_at)}
                          {c.status === 'completed' && c.duration ? ` · ${formatDuration(c.duration)}` : ''}
                        </div>
                      </div>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </AppLayout>
    </>
  );
}
