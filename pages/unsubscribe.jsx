import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function UnsubscribePage() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setStatus(sp.get('status') || 'landing');
  }, []);

  return (
    <>
      <Head>
        <title>Unsubscribed | Range Medical</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#fff',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: 3, margin: '0 0 40px' }}>
          RANGE MEDICAL
        </h1>

        {status === 'ok' && (
          <>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px', color: '#111' }}>
              You've been unsubscribed.
            </h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
              You won't receive promotional emails from us anymore.
              If you ever change your mind, just let us know at{' '}
              <a href="tel:9499973988" style={{ color: '#111' }}>(949) 997-3988</a>.
            </p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px', color: '#111' }}>
              Invalid link.
            </h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
              That unsubscribe link doesn't look right. If you'd like to be removed,
              email us at <a href="mailto:cupp@range-medical.com" style={{ color: '#111' }}>cupp@range-medical.com</a>.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px', color: '#111' }}>
              Something went wrong.
            </h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
              Please try again or email us at{' '}
              <a href="mailto:cupp@range-medical.com" style={{ color: '#111' }}>cupp@range-medical.com</a>.
            </p>
          </>
        )}

        {status === 'landing' && (
          <>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px', color: '#111' }}>
              Need to unsubscribe?
            </h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
              Use the unsubscribe link at the bottom of any email from us.
              Or email <a href="mailto:cupp@range-medical.com" style={{ color: '#111' }}>cupp@range-medical.com</a> and we'll handle it.
            </p>
          </>
        )}

        <p style={{ fontSize: 12, color: '#999', marginTop: 60 }}>
          1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660
        </p>
      </div>
    </>
  );
}
