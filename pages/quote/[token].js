// /pages/quote/[token].js
// Public-facing custom pricing quote page — v2 design
// Range Medical

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const fmt = (cents) => `$${((cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '';

export default function QuotePage() {
  const router = useRouter();
  const { token } = router.query;
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/quotes/${token}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) setError(d.error || 'Not found');
        else setQuote(d);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [token]);

  return (
    <Shell>
      <Head>
        <title>Your Range Medical Pricing</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      {loading && <p style={{ color: '#737373', fontSize: 14 }}>Loading…</p>}
      {!loading && error && <p style={{ color: '#737373', fontSize: 14 }}>{error}</p>}

      {!loading && !error && quote && (() => {
        const firstName = (quote.recipient_name || '').split(' ')[0];
        const expired = quote.expires_at && new Date(quote.expires_at) < new Date();
        return (
          <>
            <div className="kicker">
              <span className="dot" />
              PREPARED FOR {firstName?.toUpperCase()} · {fmtDate(quote.created_at).toUpperCase()}
              {quote.expires_at ? ` · EXPIRES ${fmtDate(quote.expires_at).toUpperCase()}` : ''}
            </div>

            <h1 className="headline">
              {(quote.title || 'YOUR CUSTOM PRICING').toUpperCase()}
            </h1>
            <div className="rule" />

            {quote.intro_note && (
              <p className="intro">{quote.intro_note}</p>
            )}

            <div className="items">
              {(quote.items || []).map((it, i) => (
                <div key={i} className="item">
                  <div className="item-main">
                    <div className="item-name">
                      {it.name}{Number(it.qty) > 1 ? ` × ${it.qty}` : ''}
                    </div>
                    {it.description && (
                      <div className="item-desc">{it.description}</div>
                    )}
                  </div>
                  <div className="item-price">
                    ${(Number(it.price) * Number(it.qty || 1)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            <div className="total-row">
              <div className="total-label">TOTAL</div>
              <div className="total-value">{fmt(quote.total_cents)}</div>
            </div>

            {expired ? (
              <div style={{ marginTop: 40, padding: 20, background: '#fafafa', textAlign: 'center', fontSize: 13, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                This quote has expired — text us for an updated price
              </div>
            ) : (
              <div className="ctas">
                <a className="btn-primary" href="sms:+19495395023">Text Us to Get Started</a>
                <a className="btn-secondary" href="tel:+19495395023">Call (949) 539-5023</a>
              </div>
            )}

            <div className="footer">
              RANGE MEDICAL · 1901 WESTCLIFF DRIVE, SUITE 10 · NEWPORT BEACH, CA<br />
              Prepared specifically for {quote.recipient_name}. All services require provider review and approval.
            </div>
          </>
        );
      })()}

      <style jsx>{`
        .kicker {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #737373;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }
        .dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #c0392b;
        }
        .headline {
          font-size: clamp(2.5rem, 7vw, 4.5rem);
          font-weight: 900;
          line-height: 0.92;
          letter-spacing: -0.02em;
          margin: 0 0 1.5rem;
          color: #0a0a0a;
        }
        .rule {
          width: 60px;
          height: 4px;
          background: #0a0a0a;
          margin-bottom: 2.5rem;
        }
        .intro {
          font-size: 17px;
          line-height: 1.7;
          color: #404040;
          background: #fafafa;
          padding: 24px 28px;
          border-left: 3px solid #0a0a0a;
          margin: 0 0 3rem;
          white-space: pre-wrap;
        }
        .items {
          border-top: 1px solid #0a0a0a;
        }
        .item {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          padding: 28px 0;
          border-bottom: 1px solid #e0e0e0;
          align-items: baseline;
        }
        .item-main { flex: 1; }
        .item-name {
          font-size: 18px;
          font-weight: 700;
          color: #0a0a0a;
          letter-spacing: -0.01em;
        }
        .item-desc {
          font-size: 14px;
          color: #737373;
          margin-top: 8px;
          line-height: 1.6;
        }
        .item-price {
          font-size: 20px;
          font-weight: 700;
          white-space: nowrap;
          color: #0a0a0a;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-top: 28px;
          padding: 28px 0;
          border-top: 3px solid #0a0a0a;
          border-bottom: 3px solid #0a0a0a;
        }
        .total-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #737373;
        }
        .total-value {
          font-size: 40px;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #0a0a0a;
        }
        .ctas {
          margin-top: 48px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .btn-primary {
          background: #0a0a0a;
          color: #fff;
          border: none;
          padding: 22px 28px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
          text-align: center;
          transition: background 0.2s;
        }
        .btn-primary:hover { background: #404040; }
        .btn-secondary {
          background: #fff;
          color: #0a0a0a;
          border: 1.5px solid #0a0a0a;
          padding: 20px 28px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          text-align: center;
          transition: all 0.2s;
        }
        .btn-secondary:hover { background: #0a0a0a; color: #fff; }
        .footer {
          margin-top: 64px;
          padding-top: 28px;
          border-top: 1px solid #e0e0e0;
          font-size: 11px;
          color: #737373;
          line-height: 1.7;
          letter-spacing: 0.04em;
        }
      `}</style>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      color: '#0a0a0a',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <header style={{ borderBottom: '1px solid #e0e0e0', background: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.14em' }}>RANGE MEDICAL</div>
          <div style={{ fontSize: 11, color: '#737373', textAlign: 'right', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
            range-medical.com · (949) 539-5023
          </div>
        </div>
      </header>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 28px 80px' }}>
        {children}
      </div>
    </div>
  );
}
