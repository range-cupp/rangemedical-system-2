import Layout from '../components/Layout';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function BloodworkLeadMagnet() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    const elements = document.querySelectorAll('.tx-page .tx-animate');
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/lead-magnet/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tag: 'bloodwork-leadmag' }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data.already_subscribed ? 'already' : 'success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const bullets = [
    'The 6 markers your PCP skipped — ApoB, Lp(a), free testosterone, fasting insulin, hs-CRP, estradiol — and why they matter more than anything on your standard panel',
    '6 advanced markers for the guy who wants the full picture — thyroid, DHEA-S, cortisol, vitamin D, ferritin, homocysteine',
    'A side-by-side table: "normal" vs. optimal ranges for all 12, with what each one actually tells you',
    'The danger zone — three ways guys mess this up every week, including the Reddit-dose testosterone trap',
    'Why your doctor isn\'t running these (it\'s not his fault — it\'s structural)',
  ];

  return (
    <Layout
      title="The Bloodwork Your Doctor Isn't Running | Range Medical"
      description="12 markers your PCP probably skipped. A free guide for men 45-55 who are tired of 'normal labs, feel like shit.' From Range Medical, Newport Beach."
    >
      <Head>
        <link rel="canonical" href="https://www.range-medical.com/bloodwork" />
        <meta property="og:title" content="The Bloodwork Your Doctor Isn't Running" />
        <meta property="og:description" content="What 'normal labs, feel like shit' actually means at 45. A free guide from Range Medical." />
        <meta property="og:url" content="https://www.range-medical.com/bloodwork" />
        <meta property="og:type" content="website" />
      </Head>

      <div className="tx-page">

        {/* HERO */}
        <section className="tx-hero">
          <div className="tx-container">
            <div className="tx-label">FREE GUIDE &middot; MEN 45&ndash;55</div>
            <h1>The bloodwork your doctor <em>isn&apos;t running.</em></h1>
            <div className="tx-rule" />
            <p className="tx-hero-sub">
              What &ldquo;normal labs, feel like shit&rdquo; actually means at 45. The 12 markers your PCP probably skipped, what optimal actually looks like, and what to do about the gap.
            </p>

            {/* HERO EMAIL CAPTURE */}
            {status === 'success' || status === 'already' ? (
              <div className="lm-success">
                <h3>{status === 'already' ? 'You already have it.' : 'Check your inbox.'}</h3>
                <p>
                  {status === 'already'
                    ? 'You\'re already on the list. Check your inbox for the original email, or download it again below.'
                    : 'The guide is on its way. If you don\'t see it in 2 minutes, check spam. Over the next 10 days you\'ll get four more emails from me — not daily, just enough to make sure you actually do something with this.'}
                </p>
                <a href="/bloodwork-guide.pdf" className="lm-download-link">Download the guide directly</a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="lm-form">
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="lm-input"
                  required
                  disabled={status === 'submitting'}
                />
                <button
                  type="submit"
                  className="tx-btn lm-btn"
                  disabled={status === 'submitting'}
                  style={status === 'submitting' ? { opacity: 0.6 } : undefined}
                >
                  {status === 'submitting' ? 'Sending...' : 'Send Me the Guide'}
                </button>
                {status === 'error' && (
                  <p className="lm-error">Something went wrong. Try again or email cupp@range-medical.com directly.</p>
                )}
                <p className="lm-privacy">No spam. The guide + 4 follow-up emails over 10 days. Unsubscribe anytime.</p>
              </form>
            )}
          </div>
        </section>

        {/* WHAT'S INSIDE */}
        <section className="tx-section">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">WHAT&apos;S INSIDE</div>
              <h2>10 pages. 15-minute read. <em>Here&apos;s what you get.</em></h2>
              <div className="tx-rule" />
            </div>
            <div className="tx-steps tx-animate">
              {bullets.map((text, i) => (
                <div key={i} className="tx-step">
                  <div className="tx-step-num">{String(i + 1).padStart(2, '0')}</div>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHO THIS IS FOR */}
        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">WHO THIS IS FOR</div>
              <h2>Your labs say &ldquo;normal&rdquo; but you don&apos;t <em>feel normal.</em></h2>
              <div className="tx-rule" />
              <p className="tx-section-intro">
                You&apos;re 45&ndash;55. Successful. You&apos;ve read Outlive, listened to Huberman, Googled your own testosterone levels at 2am. Your PCP says everything is fine. You don&apos;t feel fine. You&apos;re 30 pounds heavier than you were at 35, your sleep is shot, and you&apos;re quietly wondering if this is just what the rest of your life feels like.
              </p>
              <p className="tx-section-intro">
                It&apos;s not. This guide is the checklist your doctor should have given you.
              </p>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="tx-cta">
          <div className="tx-container" style={{ textAlign: 'center' }}>
            <div className="tx-animate">
              <h2 style={{ color: '#fff' }}>Get the guide.</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 480, margin: '0 auto 2rem' }}>
                12 markers, real reference ranges, no bullshit. Enter your email and it&apos;s yours.
              </p>

              {status === 'success' || status === 'already' ? (
                <div className="lm-success" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <h3 style={{ color: '#fff' }}>{status === 'already' ? 'You already have it.' : 'Check your inbox.'}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {status === 'already'
                      ? 'Check your inbox for the original email, or download it again.'
                      : 'The guide is on its way.'}
                  </p>
                  <a href="/bloodwork-guide.pdf" className="lm-download-link" style={{ color: '#fff' }}>Download directly</a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="lm-form lm-form-dark">
                  <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="lm-input lm-input-dark"
                    required
                    disabled={status === 'submitting'}
                  />
                  <button
                    type="submit"
                    className="btn-primary lm-btn"
                    disabled={status === 'submitting'}
                    style={status === 'submitting' ? { opacity: 0.6, width: '100%' } : { width: '100%' }}
                  >
                    {status === 'submitting' ? 'Sending...' : 'Send Me the Guide'}
                  </button>
                  {status === 'error' && (
                    <p className="lm-error" style={{ color: '#fca5a5' }}>Something went wrong. Try again.</p>
                  )}
                  <p className="lm-privacy" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    No spam. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

      </div>

      <style jsx>{`
        .lm-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 440px;
          margin-top: 2rem;
        }
        .lm-form-dark {
          margin: 0 auto;
        }
        .lm-input {
          width: 100%;
          padding: 16px 18px;
          font-size: 16px;
          border: 1px solid var(--color-border, #e0e0e0);
          background: var(--color-surface, #fff);
          color: var(--color-text, #1a1a1a);
          font-family: inherit;
          border-radius: 0;
          outline: none;
          transition: border-color 0.2s;
        }
        .lm-input:focus {
          border-color: var(--color-accent, #2E5D3A);
        }
        .lm-input-dark {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          color: #fff;
        }
        .lm-input-dark::placeholder {
          color: rgba(255,255,255,0.4);
        }
        .lm-input-dark:focus {
          border-color: rgba(255,255,255,0.5);
        }
        .lm-btn {
          width: 100%;
        }
        .lm-privacy {
          font-size: 12px;
          color: var(--color-text-muted, #737373);
          line-height: 1.5;
          margin: 0;
        }
        .lm-error {
          font-size: 14px;
          color: #b91c1c;
          margin: 0;
        }
        .lm-success {
          padding: 28px 24px;
          background: rgba(46, 93, 58, 0.06);
          border: 1px solid rgba(46, 93, 58, 0.15);
          margin-top: 2rem;
          max-width: 440px;
        }
        .lm-success h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px;
        }
        .lm-success p {
          font-size: 15px;
          line-height: 1.65;
          color: var(--color-text-muted, #737373);
          margin: 0 0 12px;
        }
        .lm-download-link {
          font-size: 14px;
          color: var(--color-accent, #2E5D3A);
          text-decoration: underline;
        }
      `}</style>
    </Layout>
  );
}
