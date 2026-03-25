// /pages/app/calls.js
// Call log — recent inbound + outbound calls — Range Medical Employee App

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../../components/AppLayout';
import useVoiceCall from '../../hooks/useVoiceCall';

export default function AppCalls() {
  const router = useRouter();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('staff_session');
    if (session) try { setStaff(JSON.parse(session)); } catch {}
    fetchCalls();
  }, []);

  const voice = useVoiceCall({ staffName: staff?.name });

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/twilio/sync-calls?limit=40');
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls || []);
      }
    } catch {
      // If sync-calls doesn't support GET the right way, fall back to empty
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = new Date(now - 86400000).toDateString() === d.toDateString();
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (isToday) return `Today ${timeStr}`;
    if (isYesterday) return `Yesterday ${timeStr}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + timeStr;
  };

  const directionIcon = (dir, status) => {
    if (status === 'no-answer' || status === 'busy' || status === 'failed') return '↗️';
    if (dir === 'inbound') return '↙️';
    return '↗️';
  };

  const directionColor = (dir, status) => {
    if (status === 'no-answer' || status === 'busy' || status === 'failed') return '#ef4444';
    if (dir === 'inbound') return '#22c55e';
    return '#6366f1';
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
        {/* Voice device status */}
        {voice.error && (
          <div style={{ margin: '12px 12px 0', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 0, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
            {voice.error}
          </div>
        )}

        {/* Quick dial */}
        <div style={{ margin: '12px 12px 0', background: '#fff', borderRadius: 0, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 10 }}>Quick Dial</div>
          <QuickDial onCall={(to) => { voice.initDevice(); voice.call({ to }); }} isActive={voice.isActive} />
        </div>

        {/* Call log */}
        <div style={{ padding: '16px 16px 6px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Recent Calls</div>

        {loading ? (
          <div className="app-spinner" />
        ) : calls.length === 0 ? (
          <div className="app-empty">
            <div style={{ fontSize: 36, marginBottom: 12 }}>📞</div>
            No call history yet
          </div>
        ) : (
          <div style={{ background: '#fff', margin: '0 12px', borderRadius: 0, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {calls.map((c, i) => {
              const number = c.direction === 'inbound' ? c.from_number || c.from : c.to_number || c.to;
              const name = c.patient_name || c.contact_name || null;
              const color = directionColor(c.direction, c.status);
              return (
                <div
                  key={c.id || c.sid || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderBottom: i < calls.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onClick={() => {
                    if (number && !voice.isActive) {
                      voice.initDevice();
                      voice.call({ to: number, name });
                    }
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {directionIcon(c.direction, c.status)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {name || number || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {name && <span>{number} · </span>}
                      {formatTime(c.start_time || c.created_at)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color }}>
                      {c.status === 'completed' ? formatDuration(c.duration) : c.status || '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AppLayout>
    </>
  );
}

function QuickDial({ onCall, isActive }) {
  const [number, setNumber] = useState('');

  const handleCall = () => {
    if (!number.trim() || isActive) return;
    let n = number.replace(/\D/g, '');
    if (n.length === 10) n = '+1' + n;
    else if (n.length === 11 && n.startsWith('1')) n = '+' + n;
    else if (!n.startsWith('+')) n = '+' + n;
    onCall(n);
    setNumber('');
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        value={number}
        onChange={e => setNumber(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleCall()}
        placeholder="Enter phone number"
        type="tel"
        style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 0, padding: '10px 12px', fontSize: 15, outline: 'none', WebkitAppearance: 'none' }}
      />
      <button
        onClick={handleCall}
        disabled={!number.trim() || isActive}
        style={{
          background: (!number.trim() || isActive) ? '#e2e8f0' : '#22c55e',
          border: 'none',
          borderRadius: 0,
          padding: '10px 16px',
          color: (!number.trim() || isActive) ? '#94a3b8' : '#fff',
          fontWeight: 700,
          fontSize: 20,
          cursor: (!number.trim() || isActive) ? 'not-allowed' : 'pointer',
        }}
      >
        📞
      </button>
    </div>
  );
}
