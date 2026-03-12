// /pages/app/login.js
// Staff login — Step 1: pick your name, Step 2: enter PIN
// Handles shared PINs gracefully by scoping auth to selected employee
// Range Medical Employee App

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AppLogin() {
  const router = useRouter();
  const [step, setStep] = useState('name'); // 'name' | 'pin'
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Already logged in?
    const session = localStorage.getItem('staff_session');
    if (session) {
      try { JSON.parse(session); router.replace('/app'); return; } catch {}
    }
    // Load employee list
    fetch('/api/app/auth')
      .then(r => r.json())
      .then(d => setEmployees(d.employees || []))
      .catch(() => setError('Could not load employee list'));
  }, [router]);

  // Focus PIN input when we enter PIN step
  useEffect(() => {
    if (step === 'pin') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [step]);

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setPin('');
    setError('');
    setStep('pin');
  };

  const handleDigit = (d) => {
    if (pin.length < 8) setPin(p => p + d);
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  // Auto-submit after short pause when 4+ digits entered
  useEffect(() => {
    if (step === 'pin' && pin.length >= 4) {
      const t = setTimeout(handleSubmit, 400);
      return () => clearTimeout(t);
    }
  }, [pin, step]);

  const handleSubmit = async () => {
    if (pin.length < 4 || loading || !selectedEmployee) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/app/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, employee_id: selectedEmployee.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid PIN');
      localStorage.setItem('staff_session', JSON.stringify(data.session));
      router.replace('/app');
    } catch (err) {
      setError(err.message);
      setPin('');
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  // Get initials for avatar
  const initials = (name) => name ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <>
      <Head>
        <title>Range Medical Staff</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #0f172a; }
        #__next { height: 100%; }
        .login-wrap {
          min-height: 100dvh;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px));
        }
        .login-logo { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; margin-bottom: 4px; }
        .login-subtitle { font-size: 13px; color: #64748b; margin-bottom: 36px; }

        /* Name picker */
        .name-grid {
          width: 100%;
          max-width: 340px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .name-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #1e293b;
          border: none;
          border-radius: 14px;
          padding: 14px 16px;
          cursor: pointer;
          color: #e2e8f0;
          font-size: 16px;
          font-weight: 500;
          text-align: left;
          -webkit-tap-highlight-color: transparent;
          transition: background 0.1s, transform 0.1s;
          width: 100%;
        }
        .name-btn:active { background: #334155; transform: scale(0.98); }
        .name-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: #334155;
          color: #94a3b8;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700;
          flex-shrink: 0;
        }
        .name-info { display: flex; flex-direction: column; }
        .name-title { font-size: 12px; color: #64748b; margin-top: 2px; }

        /* PIN step */
        .pin-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
          width: 100%;
          max-width: 280px;
        }
        .pin-avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: #334155;
          color: #94a3b8;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700;
          flex-shrink: 0;
        }
        .pin-name { font-size: 17px; font-weight: 600; color: #fff; }
        .pin-change { font-size: 12px; color: #475569; margin-top: 2px; cursor: pointer; }
        .pin-change:hover { color: #94a3b8; }

        .pin-dots {
          display: flex; gap: 14px; margin-bottom: 20px; justify-content: center;
        }
        .pin-dot {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid #334155;
          background: transparent;
          transition: all 0.15s;
        }
        .pin-dot.filled { background: #fff; border-color: #fff; transform: scale(1.1); }
        .pin-error { color: #f87171; font-size: 13px; text-align: center; margin-bottom: 16px; min-height: 20px; }
        .keypad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%; max-width: 280px;
        }
        .key {
          aspect-ratio: 1;
          border-radius: 50%;
          border: none;
          background: #1e293b;
          color: #e2e8f0;
          font-size: 22px; font-weight: 500;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          -webkit-tap-highlight-color: transparent;
          transition: background 0.1s, transform 0.1s;
          user-select: none;
        }
        .key:active { background: #334155; transform: scale(0.92); }
        .key.key-empty { background: transparent; cursor: default; }
        .key.key-delete { background: transparent; font-size: 18px; }
        .key.key-delete:active { background: #1e293b; }
      `}</style>

      <div className="login-wrap">
        <div className="login-logo">Range Medical</div>
        <div className="login-subtitle">Staff Portal</div>

        {step === 'name' && (
          <div className="name-grid">
            {employees.length === 0 && !error && (
              <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>Loading…</div>
            )}
            {error && <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{error}</div>}
            {employees.map(emp => (
              <button key={emp.id} className="name-btn" onClick={() => handleSelectEmployee(emp)}>
                <div className="name-avatar">{initials(emp.name)}</div>
                <div className="name-info">
                  <span>{emp.name}</span>
                  {emp.title && <span className="name-title">{emp.title}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'pin' && selectedEmployee && (
          <>
            <div className="pin-header">
              <div className="pin-avatar">{initials(selectedEmployee.name)}</div>
              <div>
                <div className="pin-name">{selectedEmployee.name}</div>
                <div className="pin-change" onClick={() => { setStep('name'); setPin(''); setError(''); }}>
                  Not you? Switch
                </div>
              </div>
            </div>

            <div className="pin-dots">
              {Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
                <div key={i} className={`pin-dot${i < pin.length ? ' filled' : ''}`} />
              ))}
            </div>

            <div className="pin-error">{error}</div>

            <div className="keypad">
              {DIGITS.map((d, i) => {
                if (d === '') return <div key={i} className="key key-empty" />;
                if (d === '⌫') return (
                  <button key={i} className="key key-delete" onClick={handleDelete} disabled={loading}>⌫</button>
                );
                return (
                  <button key={i} className="key" onClick={() => handleDigit(d)} disabled={loading}>{d}</button>
                );
              })}
            </div>

            {loading && (
              <div style={{ marginTop: 32, color: '#64748b', fontSize: 13 }}>Verifying…</div>
            )}
          </>
        )}

        {/* Hidden input to help mobile keyboards on the PIN step */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          value={pin}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 8);
            setPin(val);
          }}
        />
      </div>
    </>
  );
}
