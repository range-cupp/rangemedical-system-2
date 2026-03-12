// /pages/app/login.js
// Staff PIN login screen — Range Medical Employee App

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AppLogin() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Already logged in?
    const session = localStorage.getItem('staff_session');
    if (session) {
      try {
        JSON.parse(session);
        router.replace('/app');
        return;
      } catch {}
    }
    // Focus input
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [router]);

  const handleDigit = (d) => {
    if (pin.length < 8) setPin(p => p + d);
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  // Auto-submit when 4-6 digits entered (try after brief pause)
  useEffect(() => {
    if (pin.length >= 4) {
      const t = setTimeout(handleSubmit, 400);
      return () => clearTimeout(t);
    }
  }, [pin]);

  const handleSubmit = async () => {
    if (pin.length < 4 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/app/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
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
          padding: 24px 24px calc(24px + env(safe-area-inset-bottom, 0px));
        }
        .login-logo {
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }
        .login-subtitle {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 48px;
        }
        .pin-dots {
          display: flex;
          gap: 14px;
          margin-bottom: 36px;
          justify-content: center;
        }
        .pin-dot {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid #334155;
          background: transparent;
          transition: all 0.15s;
        }
        .pin-dot.filled {
          background: #fff;
          border-color: #fff;
          transform: scale(1.1);
        }
        .pin-error {
          color: #f87171;
          font-size: 13px;
          text-align: center;
          margin-bottom: 24px;
          min-height: 20px;
        }
        .keypad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
          max-width: 280px;
        }
        .key {
          aspect-ratio: 1;
          border-radius: 50%;
          border: none;
          background: #1e293b;
          color: #e2e8f0;
          font-size: 22px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
          transition: background 0.1s, transform 0.1s;
          user-select: none;
        }
        .key:active { background: #334155; transform: scale(0.92); }
        .key.key-empty { background: transparent; cursor: default; }
        .key.key-delete { background: transparent; font-size: 18px; }
        .key.key-delete:active { background: #1e293b; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .shake { animation: shake 0.4s; }
      `}</style>

      <div className="login-wrap">
        <div className="login-logo">Range Medical</div>
        <div className="login-subtitle">Staff Portal</div>

        {/* PIN dots — show up to 8 */}
        <div className="pin-dots">
          {Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
            <div key={i} className={`pin-dot${i < pin.length ? ' filled' : ''}`} />
          ))}
        </div>

        <div className={`pin-error${error ? '' : ''}`}>{error}</div>

        {/* Keypad */}
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
      </div>
    </>
  );
}
