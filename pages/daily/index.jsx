// pages/daily/index.jsx
// Daily Action Tip — landing page (served at daily.range-medical.com via subdomain rewrite)
// Single email capture. Sales-y but voice-led. Black/white/gray. No fluff.

import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function DailyLanding() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'submitting') return;
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('That email looks off. Try again.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/daily/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          utm_source: router.query.utm_source || null,
          utm_medium: router.query.utm_medium || null,
          utm_campaign: router.query.utm_campaign || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong. Try again.');
        setStatus('error');
        return;
      }
      setStatus('success');
    } catch (err) {
      setErrorMsg('Network hiccup. Try again.');
      setStatus('error');
    }
  };

  return (
    <>
      <Head>
        <title>Daily Action Tip | Range Medical</title>
        <meta
          name="description"
          content="Under-a-minute health tips for guys 40+ who are tired of being told everything looks fine. One email a day. No fluff."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Daily Action Tip" />
        <meta
          property="og:description"
          content="Under-a-minute health tips for guys 40+ who are tired of being told everything looks fine."
        />
        <meta property="og:type" content="website" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="page">
        <header className="topbar">
          <a href="https://range-medical.com" className="brand">RANGE MEDICAL</a>
          <span className="topbar-tag">Daily Action Tip</span>
        </header>

        <main className="hero">
          <div className="kicker">
            <span className="dot" />
            One email. 60 seconds. Free.
          </div>

          <h1>
            Health tips for guys 40+ who are tired of being told <em>everything looks fine.</em>
          </h1>

          <p className="lede">
            One specific, under-a-minute thing you can do today to feel less like
            a slowly deflating air mattress. No 4,000-word newsletters. No
            supplement funnel. No "10 hacks for limitless energy."
          </p>

          {status !== 'success' ? (
            <form className="form" onSubmit={handleSubmit} noValidate>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                disabled={status === 'submitting'}
                required
                aria-label="Email address"
                className="email-input"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="submit-btn"
              >
                {status === 'submitting' ? 'Adding you…' : 'Get the daily tip'}
              </button>
              {status === 'error' && errorMsg && (
                <div className="form-error">{errorMsg}</div>
              )}
            </form>
          ) : (
            <div className="success">
              <div className="success-mark">✓</div>
              <h2>Done.</h2>
              <p>Check your inbox in a minute. Email 1 is on its way.</p>
              <p className="success-fineprint">
                Doesn't show up in 5 min? Check spam, then promotions. If you
                still don't see it, reply to <a href="mailto:cupp@range-medical.com">cupp@range-medical.com</a> and I'll fix it.
              </p>
            </div>
          )}

          <div className="trust">
            <div className="trust-row">
              <span>One email a day. 6am Pacific.</span>
              <span className="dotsep">·</span>
              <span>Unsubscribe in one click.</span>
              <span className="dotsep">·</span>
              <span>Your email goes nowhere else. Ever.</span>
            </div>
          </div>
        </main>

        <section className="what-it-is">
          <div className="kicker dark">What you actually get</div>
          <ul className="bullets">
            <li>
              <strong>One tip. Every day. Under 60 seconds to read.</strong> Sleep,
              recovery, food, hormones, the soft middle, the libido slide, the
              pickleball-recovery-took-three-days problem. Specific, actionable,
              no fluff.
            </li>
            <li>
              <strong>Written by a guy who runs a clinic, not a guy with a podcast.</strong>{' '}
              I see the same problems on repeat in Newport Beach every week. The
              tips are the small stuff that actually moves the needle — the
              things I tell people in the chair that cost nothing.
            </li>
            <li>
              <strong>Zero "wellness influencer" energy.</strong> No mushroom
              coffee affiliate links. No 12-week transformation funnel. No
              "as a man, you owe it to yourself…" preamble. No lecture about
              giving up wine, steak, or the rest of your life.
            </li>
            <li>
              <strong>No 101 content.</strong> If you've already read Attia,
              listened to Huberman, and googled peptides at 11pm, we're past
              that. This is the next layer down.
            </li>
          </ul>
        </section>

        <section className="who">
          <div className="kicker dark">Who this is for</div>
          <p className="who-body">
            Guys 45+ who got the bloodwork back, were told <em>everything looks fine</em>,
            and still feel like garbage. Wake up at 3am. Out of breath tying
            shoes. Pickleball recovery now takes three days. Lift weights and
            somehow lose muscle. Libido is on a slow fade. The mirror feels less
            and less familiar.
          </p>
          <p className="who-body">
            If that's you, this is for you. If it's not, no hard feelings.
          </p>
        </section>

        <section className="signup-bottom">
          {status !== 'success' ? (
            <>
              <h3>Still here? Hand over the email.</h3>
              <form className="form form-secondary" onSubmit={handleSubmit} noValidate>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  disabled={status === 'submitting'}
                  required
                  aria-label="Email address"
                  className="email-input"
                />
                <button type="submit" disabled={status === 'submitting'} className="submit-btn">
                  {status === 'submitting' ? 'Adding you…' : 'Get the daily tip'}
                </button>
              </form>
            </>
          ) : (
            <h3>You're in. Go check your inbox.</h3>
          )}
        </section>

        <footer className="footer">
          <p className="footer-line">
            Range Medical · 1901 Westcliff Drive, Suite 10, Newport Beach, CA · (949) 997-3988
          </p>
          <p className="footer-line">
            <a href="https://range-medical.com">range-medical.com</a>
            &nbsp;·&nbsp;
            <a href="https://range-medical.com/privacy">Privacy</a>
            &nbsp;·&nbsp;
            One-click unsubscribe in every email. Educational only — not medical advice.
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

        .hero {
          max-width: 720px;
          margin: 0 auto;
          padding: 64px 24px 56px;
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

        .kicker.dark {
          color: #0a0a0a;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #16a34a;
          display: inline-block;
        }

        h1 {
          font-size: clamp(2rem, 4.8vw, 3rem);
          line-height: 1.15;
          letter-spacing: -0.025em;
          font-weight: 800;
          color: #0a0a0a;
          margin: 0 0 22px 0;
          text-transform: none;
        }

        h1 em {
          font-style: italic;
          font-weight: 800;
          color: #888;
        }

        .lede {
          font-size: 1.05rem;
          line-height: 1.65;
          color: #444;
          max-width: 560px;
          margin: 0 0 28px 0;
        }

        .form {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          max-width: 520px;
          margin-bottom: 14px;
        }

        .email-input {
          flex: 1 1 260px;
          font-family: inherit;
          font-size: 16px;
          padding: 14px 16px;
          background: #ffffff;
          color: #0a0a0a;
          border: 1.5px solid #0a0a0a;
          border-radius: 0;
          outline: none;
          transition: border-color 0.15s ease;
          min-width: 0;
        }

        .email-input:focus {
          border-color: #0a0a0a;
          box-shadow: 0 0 0 3px rgba(10, 10, 10, 0.08);
        }

        .email-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .submit-btn {
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.02em;
          padding: 14px 22px;
          background: #0a0a0a;
          color: #ffffff;
          border: 1.5px solid #0a0a0a;
          border-radius: 0;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }

        .submit-btn:hover:not(:disabled) {
          background: #1a1a1a;
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(1px);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-error {
          flex-basis: 100%;
          font-size: 13px;
          color: #c52828;
          margin-top: 4px;
        }

        .trust {
          margin-top: 18px;
        }

        .trust-row {
          font-size: 12px;
          color: #888;
          letter-spacing: 0.01em;
        }

        .dotsep {
          margin: 0 8px;
          color: #ccc;
        }

        .success {
          padding: 32px 0 8px;
          max-width: 520px;
        }

        .success-mark {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #16a34a;
          color: #fff;
          font-size: 22px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .success h2 {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 8px 0;
          text-transform: none;
        }

        .success p {
          font-size: 0.95rem;
          color: #444;
          margin: 0 0 8px 0;
        }

        .success-fineprint {
          font-size: 13px !important;
          color: #888 !important;
          margin-top: 14px !important;
        }

        .success-fineprint a {
          color: #0a0a0a;
          text-decoration: underline;
        }

        .what-it-is,
        .who {
          max-width: 720px;
          margin: 0 auto;
          padding: 56px 24px;
          border-top: 1px solid #ececec;
        }

        .bullets {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .bullets li {
          font-size: 1rem;
          line-height: 1.65;
          color: #333;
          padding: 14px 0 14px 24px;
          border-bottom: 1px solid #f0f0f0;
          position: relative;
        }

        .bullets li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 24px;
          width: 12px;
          height: 1.5px;
          background: #0a0a0a;
        }

        .bullets li:last-child {
          border-bottom: none;
        }

        .bullets strong {
          color: #0a0a0a;
          font-weight: 700;
        }

        .who-body {
          font-size: 1rem;
          line-height: 1.7;
          color: #333;
          margin: 0 0 14px 0;
          max-width: 600px;
        }

        .who-body em {
          font-style: italic;
          color: #888;
        }

        .signup-bottom {
          max-width: 720px;
          margin: 0 auto;
          padding: 48px 24px 64px;
          border-top: 1px solid #ececec;
        }

        .signup-bottom h3 {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 18px 0;
        }

        .form-secondary {
          margin-bottom: 0;
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
          margin: 0 0 4px 0;
          line-height: 1.6;
        }

        .footer a {
          color: #888;
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .hero {
            padding: 40px 20px 36px;
          }
          h1 {
            font-size: 2rem;
          }
          .lede {
            font-size: 1rem;
          }
          .what-it-is,
          .who,
          .signup-bottom {
            padding: 40px 20px;
          }
        }
      `}</style>
    </>
  );
}
