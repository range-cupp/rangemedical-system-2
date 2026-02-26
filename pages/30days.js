// /pages/oxygen.js
// 30-day email series opt-in landing page
// Instagram comment trigger: "oxygen"

import { useState } from 'react';
import Head from 'next/head';

export default function OxygenLanding() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/oxygen/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), email: email.trim() }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Try again.');
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>30 Days of Things Worth Knowing | Chris Cupp</title>
        <meta name="description" content="One email a day from Chris Cupp. Two minutes. No fluff. Just the stuff your doctor probably never explained." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={styles.page}>
        <div style={styles.container}>

          {/* Brand */}
          <p style={styles.brand}>RANGE MEDICAL</p>

          {/* Headline */}
          <h1 style={styles.headline}>
            Things most people don't know about their own body.
          </h1>

          {/* Subhead */}
          <p style={styles.subhead}>
            One email a day from Chris Cupp. Two minutes. No fluff. Just the stuff your doctor probably never explained — and what you can actually do about it.
          </p>

          {/* Value props */}
          <div style={styles.props}>
            <div style={styles.prop}>
              <span style={styles.check}>&#10003;</span>
              <span>Longevity, biohacking & recovery — explained at a human level</span>
            </div>
            <div style={styles.prop}>
              <span style={styles.check}>&#10003;</span>
              <span>Actionable every day — things you can do at home or ask for at your local clinic</span>
            </div>
            <div style={styles.prop}>
              <span style={styles.check}>&#10003;</span>
              <span>Two-minute read — short enough to stick, useful enough to share</span>
            </div>
          </div>

          {/* Form / Success */}
          {!submitted ? (
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                style={styles.input}
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...styles.button,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? 'One sec...' : 'Send Me Day One'}
              </button>
              {error && <p style={styles.error}>{error}</p>}
              <p style={styles.privacy}>
                No spam. Unsubscribe anytime. Just 30 days of things worth knowing.
              </p>
            </form>
          ) : (
            <div style={styles.success}>
              <p style={styles.successHeadline}>You're in. Day one is on the way.</p>
            </div>
          )}

          {/* Footer */}
          <p style={styles.footer}>
            Chris Cupp &middot; Range Medical &middot; Newport Beach, CA
          </p>

        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    justifyContent: 'center',
    padding: '0 20px',
  },
  container: {
    width: '100%',
    maxWidth: '520px',
    paddingTop: '60px',
    paddingBottom: '60px',
  },
  brand: {
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '0.18em',
    color: '#b0b0b0',
    marginBottom: '48px',
  },
  headline: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1.25',
    color: '#0a0a0a',
    marginBottom: '20px',
    letterSpacing: '-0.02em',
  },
  subhead: {
    fontSize: '16px',
    lineHeight: '1.65',
    color: '#555555',
    marginBottom: '40px',
  },
  props: {
    marginBottom: '44px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  prop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    fontSize: '15px',
    lineHeight: '1.55',
    color: '#2a2a2a',
  },
  check: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#999999',
    flexShrink: 0,
    marginTop: '2px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '48px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #d4d4d4',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: 'inherit',
    color: '#0a0a0a',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
  },
  button: {
    width: '100%',
    padding: '16px',
    background: '#0a0a0a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    fontFamily: 'inherit',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'background 0.15s',
  },
  error: {
    fontSize: '14px',
    color: '#c00',
    margin: '0',
  },
  privacy: {
    fontSize: '13px',
    color: '#999999',
    lineHeight: '1.5',
    margin: '0',
    textAlign: 'center',
  },
  success: {
    padding: '40px 0',
    marginBottom: '48px',
  },
  successHeadline: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#0a0a0a',
    lineHeight: '1.4',
  },
  footer: {
    fontSize: '13px',
    color: '#b0b0b0',
    letterSpacing: '0.01em',
  },
};
