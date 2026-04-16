// /pages/quote/[token].js
// Public-facing custom pricing quote page — v2 design
// Range Medical

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const fmt = (cents) => `$${((cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' }) : '';

export default function QuotePage() {
  const router = useRouter();
  const { token } = router.query;
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isPreview = router.query.preview === 'true';

  useEffect(() => {
    if (!token) return;
    const url = isPreview ? `/api/quotes/${token}?preview=true` : `/api/quotes/${token}`;
    fetch(url)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) setError(d.error || 'Not found');
        else setQuote(d);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [token, isPreview]);

  const wide = !!(quote && Array.isArray(quote.options) && quote.options.length > 1);
  return (
    <Shell wide={wide}>
      <Head>
        <title>Your Range Medical Pricing</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      {isPreview && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          padding: '12px 20px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: '#92400e',
        }}>
          <span>Preview Mode — views are not being tracked</span>
          <button
            onClick={() => window.close()}
            style={{ background: 'none', border: '1px solid #92400e', padding: '4px 14px', fontSize: 13, fontWeight: 600, color: '#92400e', cursor: 'pointer' }}
          >
            Close Preview
          </button>
        </div>
      )}
      {loading && <p style={{ color: '#737373', fontSize: 14 }}>Loading…</p>}
      {!loading && error && <p style={{ color: '#737373', fontSize: 14 }}>{error}</p>}

      {!loading && !error && quote && (() => {
        const firstName = (quote.recipient_name || '').split(' ')[0];
        const expired = quote.expires_at && new Date(quote.expires_at) < new Date();
        const opts = Array.isArray(quote.options) && quote.options.length > 0 ? quote.options : null;
        return (
          <>
            <div className="kicker">
              <span className="dot" />
              PREPARED FOR {firstName?.toUpperCase()} · {fmtDate(quote.created_at).toUpperCase()}
              {quote.expires_at ? ` · EXPIRES ${fmtDate(quote.expires_at).toUpperCase()}` : ''}
            </div>

            <h1 className="headline">
              {(quote.title || (opts ? 'COMPARE YOUR OPTIONS' : 'YOUR CUSTOM PRICING')).toUpperCase()}
            </h1>
            <div className="rule" />

            {quote.intro_note && (
              <p className="intro">{quote.intro_note}</p>
            )}

            {opts ? (
              <div className="options-grid" style={{ gridTemplateColumns: `repeat(${opts.length}, minmax(0, 1fr))` }}>
                {opts.map((opt, oi) => {
                  const optDiscount = Number(opt.discount_cents) || 0;
                  return (
                    <div key={oi} className="option-card">
                      <div className="opt-name">{opt.name || `Option ${oi + 1}`}</div>
                      <div className="opt-items">
                        {(opt.items || []).map((it, i) => (
                          <div key={i} className="opt-item">
                            <div className="opt-item-name">
                              {it.name}{Number(it.qty) > 1 ? ` × ${it.qty}` : ''}
                            </div>
                            {it.description && <div className="opt-item-desc">{it.description}</div>}
                            <div className="opt-item-price">
                              ${(Number(it.price) * Number(it.qty || 1)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={`opt-total${optDiscount > 0 ? ' opt-total-has-adj' : ''}`}>
                        {optDiscount > 0 && (
                          <>
                            <div className="opt-adj">
                              <span>Subtotal</span>
                              <span>{fmt(opt.subtotal_cents)}</span>
                            </div>
                            <div className="opt-adj opt-adj-discount">
                              <span>Bundle Discount</span>
                              <span>−{fmt(optDiscount)}</span>
                            </div>
                          </>
                        )}
                        <div className="opt-total-main">
                          <div className="opt-total-label">TOTAL</div>
                          <div className="opt-total-value">{fmt(opt.total_cents)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
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

                <div className="totals-block">
                  {Number(quote.discount_cents) > 0 && (
                    <>
                      <div className="adj-row">
                        <span className="adj-label">Subtotal</span>
                        <span className="adj-value">{fmt(quote.subtotal_cents)}</span>
                      </div>
                      <div className="adj-row adj-discount">
                        <span className="adj-label">Bundle Discount</span>
                        <span className="adj-value">−{fmt(quote.discount_cents)}</span>
                      </div>
                    </>
                  )}
                  <div className="total-row">
                    <div className="total-label">TOTAL</div>
                    <div className="total-value">{fmt(quote.total_cents)}</div>
                  </div>
                </div>
              </>
            )}

            {expired ? (
              <div style={{ marginTop: 40, padding: 20, background: '#fafafa', textAlign: 'center', fontSize: 13, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                This quote has expired — text us for an updated price
              </div>
            ) : (
              <div className="ctas">
                <a className="btn-primary" href={`sms:+19495395023?&body=${encodeURIComponent(`Hi Range Medical — I'd like to move forward with my quote: "${quote.title || 'Custom Pricing'}" (ref ${quote.token}). My name is ${quote.recipient_name}.`)}`}>Text Us to Get Started</a>
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
        .totals-block {
          margin-top: 28px;
          border-top: 3px solid #0a0a0a;
          border-bottom: 3px solid #0a0a0a;
        }
        .adj-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 14px 0;
          font-size: 16px;
          color: #525252;
          border-bottom: 1px solid #e0e0e0;
        }
        .adj-row:first-child { padding-top: 22px; }
        .adj-label { font-weight: 500; }
        .adj-value { font-weight: 700; }
        .adj-discount { color: #c0392b; }
        .adj-discount .adj-label { font-weight: 600; }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 28px 0;
        }
        .adj-row + .total-row { padding-top: 22px; }
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
        .options-grid {
          display: grid;
          gap: 20px;
          margin-top: 8px;
        }
        @media (max-width: 720px) {
          .options-grid { grid-template-columns: 1fr !important; }
        }
        .option-card {
          border: 1.5px solid #0a0a0a;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          background: #fff;
        }
        .opt-name {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0a0a0a;
          padding-bottom: 16px;
          border-bottom: 2px solid #0a0a0a;
          margin-bottom: 20px;
        }
        .opt-items {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .opt-item {
          padding-bottom: 18px;
          border-bottom: 1px solid #e0e0e0;
        }
        .opt-item:last-child { border-bottom: none; }
        .opt-item-name {
          font-size: 15px;
          font-weight: 700;
          color: #0a0a0a;
          line-height: 1.35;
        }
        .opt-item-desc {
          font-size: 12px;
          color: #737373;
          margin-top: 6px;
          line-height: 1.55;
        }
        .opt-item-price {
          font-size: 15px;
          font-weight: 700;
          color: #0a0a0a;
          margin-top: 8px;
        }
        .opt-total {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 2px solid #0a0a0a;
        }
        .opt-adj {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 13px;
          color: #525252;
          padding: 6px 0;
        }
        .opt-adj > span:last-child { font-weight: 700; }
        .opt-adj-discount { color: #c0392b; }
        .opt-total-main {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .opt-total-has-adj .opt-total-main {
          margin-top: 10px;
          padding-top: 12px;
          border-top: 1px solid #e0e0e0;
        }
        .opt-total-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #737373;
          text-transform: uppercase;
        }
        .opt-total-value {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #0a0a0a;
        }
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

function Shell({ children, wide }) {
  const maxW = wide ? 1080 : 760;
  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      color: '#0a0a0a',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <header style={{ borderBottom: '1px solid #e0e0e0', background: '#fff' }}>
        <div style={{ maxWidth: maxW, margin: '0 auto', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.14em' }}>RANGE MEDICAL</div>
          <div style={{ fontSize: 11, color: '#737373', textAlign: 'right', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
            range-medical.com · (949) 539-5023
          </div>
        </div>
      </header>
      <div style={{ maxWidth: maxW, margin: '0 auto', padding: '64px 28px 80px' }}>
        {children}
      </div>
    </div>
  );
}
