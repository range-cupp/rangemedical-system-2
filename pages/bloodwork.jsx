import Head from 'next/head';
import { useState } from 'react';

export default function BloodworkLeadMagnet() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

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

  return (
    <>
      <Head>
        <title>The Bloodwork Your Doctor Isn't Running | Range Medical</title>
        <meta name="description" content="12 markers your PCP probably skipped. A free guide for men 45-55 who are tired of 'normal labs, feel like shit.' From Range Medical, Newport Beach." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="The Bloodwork Your Doctor Isn't Running" />
        <meta property="og:description" content="What 'normal labs, feel like shit' actually means at 45. A free guide from Range Medical." />
        <meta property="og:type" content="website" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div style={s.page}>
        <header style={s.header}>
          <img
            src="/brand/range_logo_transparent_black.png"
            alt="Range Medical"
            style={s.logo}
          />
        </header>

        <main style={s.container}>
          {/* HERO */}
          <section style={s.heroSection}>
            <div style={s.label}>
              <span style={s.dot} />
              FREE GUIDE &nbsp;&middot;&nbsp; MEN 45&ndash;55
            </div>
            <h1 style={s.headline}>
              The Bloodwork Your Doctor Isn&apos;t Running
            </h1>
            <p style={s.headlineSub}>
              What &ldquo;normal labs, feel like shit&rdquo; actually means at 45. The 12 markers your PCP probably skipped, what optimal actually looks like, and what to do about the gap.
            </p>
          </section>

          {/* WHAT'S INSIDE */}
          <section style={s.section}>
            <div style={s.sectionLabel}>
              <span style={s.dot} />
              WHAT&apos;S INSIDE
            </div>
            <div style={s.sectionRule} />
            <div style={s.bulletList}>
              {[
                'The 6 markers your PCP skipped — ApoB, Lp(a), free testosterone, fasting insulin, hs-CRP, estradiol — and why they matter more than anything on your standard panel',
                '6 advanced markers for the guy who wants the full picture — thyroid, DHEA-S, cortisol, vitamin D, ferritin, homocysteine',
                'A side-by-side table: "normal" vs. optimal ranges for all 12, with what each one actually tells you',
                'The danger zone — three ways Newport Beach guys mess this up every week, including the Reddit-dose testosterone trap',
                'Why your doctor isn\'t running these (it\'s not his fault — it\'s structural)',
              ].map((text, i) => (
                <div key={i} style={s.bulletItem}>
                  <span style={s.bulletNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={s.bulletText}>{text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* EMAIL CAPTURE */}
          <section style={s.section}>
            <div style={s.sectionLabel}>
              <span style={s.dot} />
              GET THE GUIDE
            </div>
            <div style={s.sectionRule} />

            {status === 'success' ? (
              <div style={s.successBox}>
                <p style={s.successTitle}>Check your inbox.</p>
                <p style={s.successText}>
                  The guide is on its way. If you don&apos;t see it in 2 minutes, check spam. Over the next 10 days you&apos;ll get four more emails from me — not daily, just enough to make sure you actually do something with this.
                </p>
                <a href="/bloodwork-guide.pdf" style={s.directLink}>
                  Or download it directly here
                </a>
              </div>
            ) : status === 'already' ? (
              <div style={s.successBox}>
                <p style={s.successTitle}>You already have it.</p>
                <p style={s.successText}>
                  You&apos;re already on the list. Check your inbox for the original email, or download it again below.
                </p>
                <a href="/bloodwork-guide.pdf" style={s.directLink}>
                  Download the guide
                </a>
              </div>
            ) : (
              <>
                <p style={s.captureText}>
                  10 pages. 15-minute read. Enter your email and I&apos;ll send it over.
                </p>
                <form onSubmit={handleSubmit} style={s.form}>
                  <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={s.input}
                    required
                    disabled={status === 'submitting'}
                  />
                  <button
                    type="submit"
                    style={{
                      ...s.btn,
                      opacity: status === 'submitting' ? 0.6 : 1,
                    }}
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? 'Sending...' : 'Send Me the Guide'}
                  </button>
                </form>
                {status === 'error' && (
                  <p style={s.errorText}>Something went wrong. Try again or email me directly at cupp@range-medical.com.</p>
                )}
                <p style={s.privacyText}>
                  No spam. You&apos;ll get the guide + 4 follow-up emails over 10 days. Unsubscribe anytime.
                </p>
              </>
            )}
          </section>

          {/* WHO THIS IS FOR */}
          <section style={s.section}>
            <div style={s.sectionLabel}>
              <span style={s.dot} />
              WHO THIS IS FOR
            </div>
            <div style={s.sectionRule} />
            <p style={s.sectionBody}>
              You&apos;re 45&ndash;55. Successful. You&apos;ve read Outlive, listened to Huberman, Googled your own testosterone levels at 2am. Your PCP says everything is fine. You don&apos;t feel fine. You&apos;re 30 pounds heavier than you were at 35, your sleep is shot, and you&apos;re quietly wondering if this is just what the rest of your life feels like.
            </p>
            <p style={s.sectionBody}>
              It&apos;s not. This guide is the checklist your doctor should have given you.
            </p>
          </section>

          {/* ABOUT */}
          <section style={s.section}>
            <div style={s.sectionLabel}>
              <span style={s.dot} />
              FROM
            </div>
            <div style={s.sectionRule} />
            <p style={s.sectionBody}>
              I&apos;m Chris Cupp. I run Range Medical in Newport Beach. I&apos;m not a doctor &mdash; I&apos;m the patient who became the operator. Lost 100 pounds, figured out my own hormones and metabolism, and built this clinic because the version of healthcare I needed at 40 didn&apos;t exist.
            </p>
            <p style={s.sectionBody}>
              This guide is what I wish someone had handed me at 42 instead of &ldquo;your labs look fine, see you next year.&rdquo;
            </p>
          </section>
        </main>

        <footer style={s.footer}>
          <div style={s.footerInner}>
            <div style={s.footerCol}>
              <p style={s.footerLabel}>RANGE MEDICAL</p>
              <p style={s.footerText}>
                1901 Westcliff Drive, Suite 10<br />
                Newport Beach, CA 92660
              </p>
            </div>
            <div style={s.footerCol}>
              <p style={s.footerLabel}>CONTACT</p>
              <p style={s.footerText}>
                (949) 997-3988<br />
                range-medical.com
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    WebkitFontSmoothing: 'antialiased',
    color: '#1a1a1a',
  },
  header: {
    borderBottom: '1px solid #e8e8e8',
    padding: '0 2.5rem',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 48,
    display: 'block',
  },
  container: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '0 2rem 80px',
  },

  heroSection: {
    padding: '5rem 0 2rem',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#737373',
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    background: '#1B4D8C',
  },
  headline: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontSize: 'clamp(2rem, 5vw, 2.75rem)',
    fontWeight: 700,
    color: '#0B1B2B',
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    margin: '0 0 20px',
  },
  headlineSub: {
    fontSize: 17,
    lineHeight: 1.75,
    color: '#737373',
    margin: '0',
    maxWidth: 560,
  },

  section: {
    padding: '2.5rem 0 0',
  },
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#737373',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionRule: {
    height: 1,
    background: '#e0e0e0',
    marginBottom: 24,
  },
  sectionBody: {
    fontSize: 16,
    lineHeight: 1.7,
    color: '#525252',
    margin: '0 0 16px',
  },

  bulletList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  bulletItem: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  bulletNum: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1B4D8C',
    marginTop: 3,
    flexShrink: 0,
    width: 24,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 1.65,
    color: '#525252',
  },

  captureText: {
    fontSize: 16,
    lineHeight: 1.7,
    color: '#525252',
    margin: '0 0 20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  input: {
    width: '100%',
    padding: '16px 18px',
    fontSize: 16,
    border: '1px solid #d4d4d4',
    background: '#fafafa',
    color: '#1a1a1a',
    fontFamily: 'inherit',
    outline: 'none',
  },
  btn: {
    display: 'block',
    width: '100%',
    padding: '18px 32px',
    background: '#0B1B2B',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  privacyText: {
    fontSize: 12,
    color: '#a3a3a3',
    marginTop: 12,
    lineHeight: 1.5,
  },
  errorText: {
    fontSize: 14,
    color: '#7A2E2E',
    marginTop: 8,
  },

  successBox: {
    padding: '28px 24px',
    background: '#f0f7f0',
    border: '1px solid #c6e0c6',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 8px',
  },
  successText: {
    fontSize: 15,
    lineHeight: 1.65,
    color: '#525252',
    margin: '0 0 16px',
  },
  directLink: {
    fontSize: 14,
    color: '#1B4D8C',
    textDecoration: 'underline',
  },

  footer: {
    borderTop: '1px solid #e8e8e8',
    padding: '40px 2rem',
    background: '#fafafa',
  },
  footerInner: {
    maxWidth: 640,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 40,
    flexWrap: 'wrap',
  },
  footerCol: {},
  footerLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#a3a3a3',
    margin: '0 0 8px',
  },
  footerText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#737373',
    margin: 0,
  },
};
