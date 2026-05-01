// pages/daily/unsubscribe.jsx
// Confirmation page after the API route completes the unsubscribe.
// Three states based on query string:
//   ?ok=1&t=TOKEN  → "you're out" + resubscribe button
//   ?invalid=1     → "couldn't verify that link" message
//   ?error=1       → "something broke" message
//   (no params)    → generic "looking for unsubscribe?" landing

import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function UnsubscribePage() {
  // Parse query params on the client. router.query is empty until isReady,
  // and we'd rather render decisively from the URL than flash the wrong state.
  const [params, setParams] = useState(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setParams({
      ok: sp.get('ok'),
      invalid: sp.get('invalid'),
      error: sp.get('error'),
      token: sp.get('t'),
    });
  }, []);

  const ok = params?.ok;
  const invalid = params?.invalid;
  const errFlag = params?.error;
  const token = params?.token;

  const [resubStatus, setResubStatus] = useState('idle'); // idle | submitting | success | error
  const [resubError, setResubError] = useState('');

  const handleResubscribe = async () => {
    if (!token) return;
    setResubStatus('submitting');
    setResubError('');
    try {
      const res = await fetch('/api/daily/resubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResubError(data.error || 'Something went wrong.');
        setResubStatus('error');
        return;
      }
      setResubStatus('success');
    } catch (e) {
      setResubError('Network hiccup. Try again.');
      setResubStatus('error');
    }
  };

  // Wait until URL parsing is done — avoids a flash of "looking for unsubscribe?"
  // before the real ?ok=1 state renders.
  let state;
  if (params === null) state = 'loading';
  else if (ok) state = 'unsubscribed';
  else if (invalid) state = 'invalid';
  else if (errFlag) state = 'error';
  else state = 'landing';

  return (
    <>
      <Head>
        <title>Unsubscribed | Daily Action Tip</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="page">
        <header className="topbar">
          <a href="https://www.range-medical.com" className="brand">RANGE MEDICAL</a>
          <span className="topbar-tag">Daily Action Tip</span>
        </header>

        <main className="content">
          {state === 'loading' && (
            <div aria-hidden="true" style={{ minHeight: '40vh' }} />
          )}

          {state === 'unsubscribed' && resubStatus !== 'success' && (
            <>
              <div className="kicker"><span className="dot gray" />Unsubscribed</div>
              <h1>You're out.</h1>
              <p className="lede">
                No hard feelings. The Daily Action Tip won't show up in your
                inbox anymore.
              </p>
              <p className="lede">
                If you change your mind, this list is here. Or come find me at{' '}
                <a href="https://www.range-medical.com">range-medical.com</a>.
              </p>

              {token && (
                <div className="oops">
                  <p className="oops-label">Wait — clicked that by accident?</p>
                  <button
                    type="button"
                    className="resub-btn"
                    onClick={handleResubscribe}
                    disabled={resubStatus === 'submitting'}
                  >
                    {resubStatus === 'submitting' ? 'Putting you back…' : 'Put me back on the list'}
                  </button>
                  {resubStatus === 'error' && (
                    <div className="form-error">{resubError}</div>
                  )}
                </div>
              )}
            </>
          )}

          {state === 'unsubscribed' && resubStatus === 'success' && (
            <>
              <div className="kicker"><span className="dot green" />You're back in</div>
              <h1>Welcome back.</h1>
              <p className="lede">
                I put you back on the list. The next daily tip will land in
                your inbox at 6am Pacific.
              </p>
              <p className="lede">
                If you want to peace out for real next time, the unsubscribe
                link's at the bottom of every email. No drama either way.
              </p>
            </>
          )}

          {state === 'invalid' && (
            <>
              <div className="kicker"><span className="dot gray" />Link invalid</div>
              <h1>Couldn't verify that link.</h1>
              <p className="lede">
                It might be expired, malformed, or already used. If you're
                still getting emails and want them stopped, just reply to the
                most recent one with "unsubscribe" and I'll take care of it
                manually.
              </p>
              <p className="lede">
                <a href="mailto:cupp@range-medical.com">cupp@range-medical.com</a>
              </p>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="kicker"><span className="dot red" />Something broke</div>
              <h1>That didn't work.</h1>
              <p className="lede">
                Try the unsubscribe link in your email again. If it still
                fails, email me directly and I'll get you off the list.
              </p>
              <p className="lede">
                <a href="mailto:cupp@range-medical.com">cupp@range-medical.com</a>
              </p>
            </>
          )}

          {state === 'landing' && (
            <>
              <div className="kicker"><span className="dot gray" />Heads up</div>
              <h1>Need to unsubscribe?</h1>
              <p className="lede">
                Use the unsubscribe link at the bottom of any email I've sent
                you — that's the one that knows which subscriber to remove.
                Coming straight to this page won't work without that link.
              </p>
              <p className="lede">
                Or just email me at <a href="mailto:cupp@range-medical.com">cupp@range-medical.com</a> and I'll handle it.
              </p>
            </>
          )}
        </main>

        <footer className="footer">
          <p className="footer-line">
            Range Medical · 1901 Westcliff Drive, Suite 10, Newport Beach, CA · (949) 997-3988
          </p>
        </footer>
      </div>

      <style jsx>{`
        :global(html, body) {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }
        .page {
          min-height: 100vh;
          background: #ffffff;
          color: #0a0a0a;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          line-height: 1.55;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid #ececec;
          max-width: 1200px;
          margin: 0 auto;
        }
        .brand {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.16em;
          color: #0a0a0a;
          text-decoration: none;
        }
        .topbar-tag {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #888;
        }
        .content {
          max-width: 640px;
          margin: 0 auto;
          padding: 80px 24px 80px;
        }
        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 20px;
        }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
        }
        .dot.green { background: #16a34a; }
        .dot.gray  { background: #999; }
        .dot.red   { background: #c52828; }
        h1 {
          font-size: clamp(2rem, 4.8vw, 3rem);
          line-height: 1.1;
          letter-spacing: -0.025em;
          font-weight: 800;
          color: #0a0a0a;
          margin: 0 0 22px 0;
          text-transform: none;
        }
        .lede {
          font-size: 1.05rem;
          line-height: 1.7;
          color: #444;
          max-width: 560px;
          margin: 0 0 16px 0;
        }
        .lede a {
          color: #0a0a0a;
          text-decoration: underline;
        }
        .oops {
          margin-top: 36px;
          padding-top: 28px;
          border-top: 1px solid #ececec;
        }
        .oops-label {
          font-size: 13px;
          color: #666;
          margin: 0 0 10px 0;
        }
        .resub-btn {
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.02em;
          padding: 12px 18px;
          background: #ffffff;
          color: #0a0a0a;
          border: 1.5px solid #0a0a0a;
          border-radius: 0;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, transform 0.1s;
        }
        .resub-btn:hover:not(:disabled) {
          background: #0a0a0a;
          color: #ffffff;
        }
        .resub-btn:active:not(:disabled) { transform: translateY(1px); }
        .resub-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .form-error {
          margin-top: 10px;
          font-size: 13px;
          color: #c52828;
        }
        .footer {
          border-top: 1px solid #ececec;
          padding: 28px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .footer-line {
          font-size: 12px;
          color: #888;
          margin: 0;
          line-height: 1.6;
        }
        @media (max-width: 600px) {
          .content { padding: 48px 20px; }
          h1 { font-size: 2rem; }
        }
      `}</style>
    </>
  );
}
