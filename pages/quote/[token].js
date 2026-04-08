// /pages/quote/[token].js
// Public-facing custom pricing quote page
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

  if (loading) return <Shell><p style={{ color: '#666' }}>Loading…</p></Shell>;
  if (error) return <Shell><p style={{ color: '#666' }}>{error}</p></Shell>;
  if (!quote) return null;

  const firstName = (quote.recipient_name || '').split(' ')[0];
  const expired = quote.expires_at && new Date(quote.expires_at) < new Date();

  return (
    <Shell>
      <Head>
        <title>Your Range Medical Pricing</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>
          Prepared for {firstName} · {fmtDate(quote.created_at)}{quote.expires_at ? ` · Expires ${fmtDate(quote.expires_at)}` : ''}
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {quote.title || 'Your Custom Pricing'}
        </h1>
      </div>

      {quote.intro_note && (
        <div style={{ padding: 20, background: '#fafafa', borderLeft: '3px solid #000', marginBottom: 32, fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {quote.intro_note}
        </div>
      )}

      <div style={{ borderTop: '1px solid #e5e5e5' }}>
        {(quote.items || []).map((it, i) => (
          <div key={i} style={{ padding: '24px 0', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'baseline' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#000' }}>
                {it.name}{Number(it.qty) > 1 ? ` × ${it.qty}` : ''}
              </div>
              {it.description && (
                <div style={{ fontSize: 15, color: '#666', marginTop: 6, lineHeight: 1.6 }}>{it.description}</div>
              )}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>
              ${(Number(it.price) * Number(it.qty || 1)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: '20px 0', borderTop: '2px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666' }}>Total</div>
        <div style={{ fontSize: 32, fontWeight: 700 }}>{fmt(quote.total_cents)}</div>
      </div>

      {expired ? (
        <div style={{ marginTop: 32, padding: 16, background: '#fef2f2', color: '#991b1b', textAlign: 'center', fontSize: 15 }}>
          This quote has expired. Text us at (949) 997-3988 for an updated price.
        </div>
      ) : (
        <div style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="sms:+19499973988" style={{ flex: '1 1 240px', padding: '18px 24px', background: '#000', color: '#fff', textDecoration: 'none', textAlign: 'center', fontSize: 16, fontWeight: 600 }}>
            Text Us to Get Started
          </a>
          <a href="tel:+19499973988" style={{ flex: '1 1 240px', padding: '18px 24px', background: '#fff', color: '#000', border: '1px solid #000', textDecoration: 'none', textAlign: 'center', fontSize: 16, fontWeight: 600 }}>
            Call (949) 997-3988
          </a>
        </div>
      )}

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e5e5e5', fontSize: 13, color: '#888', lineHeight: 1.6 }}>
        Range Medical · 1901 Westcliff Drive, Suite 10, Newport Beach, CA<br />
        This pricing was prepared specifically for {quote.recipient_name}. All services require provider review and approval.
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', color: '#0a0a0a' }}>
      <div style={{ borderBottom: '1.5px solid #000' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.02em' }}>RANGE MEDICAL</div>
          <div style={{ fontSize: 12, color: '#666', textAlign: 'right' }}>
            range-medical.com · (949) 997-3988
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px' }}>
        {children}
      </div>
    </div>
  );
}
