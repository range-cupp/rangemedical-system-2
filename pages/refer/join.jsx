import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';

export default function JoinReferralProgram() {
  // Modes: 'landing' | 'new' | 'hub'
  const [mode, setMode] = useState('landing');
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '' });
  const [lookupEmail, setLookupEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [resent, setResent] = useState(false);

  // Scroll to top on mode change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);

  // Try to look up existing partner by email
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupEmail) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/referral/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lookupEmail }),
      });
      const data = await res.json();
      if (data.found) {
        setResult(data);
        setMode('hub');
      } else {
        // Not found — move to new signup with email pre-filled
        setForm(f => ({ ...f, email: lookupEmail }));
        setMode('new');
      }
    } catch {
      setError('Something went wrong. Try again.');
    }
    setSubmitting(false);
  };

  // New partner signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.first_name || !form.last_name || !form.phone || !form.email) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/referral/create-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResult({ ...data, lead_count: 0 });
      setMode('hub');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(result.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareViaText = () => {
    const message = `Hey — I go to Range Medical for peptides, hormones, recovery, all of it. They're legit. Here's my link if you want to check it out: ${result.link}`;
    window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
  };

  const resendLink = async () => {
    setResent(false);
    try {
      // Re-create triggers the SMS again (idempotent for existing partners)
      await fetch('/api/referral/create-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: result.name, last_name: '', phone: '', email: lookupEmail || form.email }),
      });
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch {
      // Silent fail
    }
  };

  return (
    <Layout
      title="Refer Friends to Range Medical"
      description="Get your personal referral link for Range Medical. Share it with friends and family."
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="join-page">

        {/* ==================== LANDING — Email gate ==================== */}
        {mode === 'landing' && (
          <>
            <section className="join-hero">
              <div className="join-container">
                <div className="v2-label"><span className="v2-dot" /> REFERRAL PROGRAM</div>
                <h1>Share Range Medical with the people you care about.</h1>
                <div className="join-rule" />
                <p className="join-body">You already know what we do. Now you can send anyone your personal link — they'll get priority attention from our team.</p>
              </div>
            </section>

            <section className="join-section join-section-alt">
              <div className="join-container">
                <div className="join-steps">
                  <div className="join-step">
                    <div className="join-step-num">1</div>
                    <div>
                      <div className="join-step-title">Enter your email below</div>
                      <div className="join-step-desc">If you've done this before, we'll pull up your link instantly.</div>
                    </div>
                  </div>
                  <div className="join-step">
                    <div className="join-step-num">2</div>
                    <div>
                      <div className="join-step-title">Get your personal link</div>
                      <div className="join-step-desc">Unique to you — anyone who uses it is connected to your name.</div>
                    </div>
                  </div>
                  <div className="join-step">
                    <div className="join-step-num">3</div>
                    <div>
                      <div className="join-step-title">Text it to whoever you want</div>
                      <div className="join-step-desc">We'll reach out to them within 24 hours.</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="join-section">
              <div className="join-container">
                <div className="v2-label"><span className="v2-dot" /> GET STARTED</div>
                <form onSubmit={handleLookup} className="join-form">
                  <div className="join-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={lookupEmail}
                      onChange={e => setLookupEmail(e.target.value)}
                      placeholder="you@email.com"
                      autoFocus
                    />
                  </div>

                  {error && <p className="join-error">{error}</p>}

                  <button type="submit" className="join-submit" disabled={submitting || !lookupEmail}>
                    {submitting ? 'Checking...' : 'Continue'}
                  </button>
                </form>
              </div>
            </section>
          </>
        )}

        {/* ==================== NEW SIGNUP ==================== */}
        {mode === 'new' && (
          <>
            <section className="join-hero">
              <div className="join-container">
                <div className="v2-label"><span className="v2-dot" /> SET UP YOUR LINK</div>
                <h1>Quick setup — takes 15 seconds.</h1>
                <div className="join-rule" />
                <p className="join-body">Fill in your info and we'll create your personal referral link. We'll also text it to you so you always have it.</p>
              </div>
            </section>

            <section className="join-section">
              <div className="join-container">
                <div className="v2-label"><span className="v2-dot" /> YOUR INFO</div>
                <form onSubmit={handleSignup} className="join-form">
                  <div className="join-row">
                    <div className="join-field">
                      <label>First Name</label>
                      <input type="text" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" autoFocus />
                    </div>
                    <div className="join-field">
                      <label>Last Name</label>
                      <input type="text" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" />
                    </div>
                  </div>
                  <div className="join-row">
                    <div className="join-field">
                      <label>Phone</label>
                      <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 555-5555" />
                    </div>
                    <div className="join-field">
                      <label>Email</label>
                      <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@email.com" />
                    </div>
                  </div>

                  {error && <p className="join-error">{error}</p>}

                  <button type="submit" className="join-submit" disabled={submitting}>
                    {submitting ? 'Setting up...' : 'Get My Referral Link'}
                  </button>

                  <button type="button" className="join-back-link" onClick={() => { setMode('landing'); setError(''); }}>
                    ← Back
                  </button>
                </form>
              </div>
            </section>
          </>
        )}

        {/* ==================== SHARE HUB ==================== */}
        {mode === 'hub' && result && (
          <>
            <section className="join-hero">
              <div className="join-container">
                <div className="v2-label"><span className="v2-dot" /> YOUR REFERRAL LINK</div>
                <h1>Here's your link, {result.name}.</h1>
                <div className="join-rule" />
                <p className="join-body">This is your personal referral link. Send it to anyone you want to refer to Range Medical. When they fill out the form, our team will reach out to them within 24 hours.</p>
              </div>
            </section>

            <section className="join-section">
              <div className="join-container">
                {/* Link display */}
                <div className="join-link-box">
                  <div className="join-link-url">{result.link}</div>
                  <button onClick={copyLink} className="join-copy-btn">
                    {copied ? '✓ Copied' : 'Copy Link'}
                  </button>
                </div>

                {/* Primary action */}
                <button onClick={shareViaText} className="join-share-btn">
                  Text This Link to Someone
                </button>

                <p className="join-share-note">This opens your text messages with a pre-written message. Just pick who to send it to.</p>

                {/* Stats */}
                {result.lead_count > 0 && (
                  <div className="join-stat-box">
                    <div className="join-stat-num">{result.lead_count}</div>
                    <div className="join-stat-label">{result.lead_count === 1 ? 'person has' : 'people have'} used your link</div>
                  </div>
                )}

                {/* How to find your link later */}
                <div className="join-tip">
                  <div className="join-tip-title">How to find this link later</div>
                  <p>We texted this link to you. To find it, search your text messages for "Range Medical."</p>
                  <p style={{ marginTop: '0.75rem' }}>You can also come back to <strong>range-medical.com/refer/join</strong> anytime, enter your email, and your link will come right up.</p>
                  <p style={{ marginTop: '0.75rem' }}>
                    <button onClick={resendLink} className="join-resend-btn">
                      {resent ? '✓ Sent — check your texts' : 'Text me my link again'}
                    </button>
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <section className="join-section join-section-inverted">
              <div className="join-container" style={{ textAlign: 'center' }}>
                <p className="join-body" style={{ margin: '0 auto', textAlign: 'center' }}>Questions? We're here.</p>
                <div className="join-cta-buttons">
                  <a href="tel:+19499973988" className="join-btn-primary">CALL (949) 997-3988</a>
                  <a href="sms:+19499973988" className="join-btn-outline">TEXT US</a>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        .join-page { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased; background: #ffffff; color: #171717; overflow-x: hidden; }
        .join-container { max-width: 640px; margin: 0 auto; padding: 0 2rem; }
        .join-section { padding: 4rem 2rem; }
        .join-section-alt { background: #fafafa; padding: 3rem 2rem; }
        .join-section-inverted { background: #1a1a1a; color: #ffffff; padding: 4rem 2rem; }
        .join-hero { padding: 6rem 2rem 4rem; }
        .join-page h1 { font-size: clamp(1.75rem, 4.5vw, 2.75rem); font-weight: 900; line-height: 1.05; letter-spacing: -0.02em; text-transform: uppercase; color: #171717; margin-bottom: 1.25rem; }
        .join-rule { width: 48px; height: 1px; background: #e0e0e0; margin-bottom: 1.5rem; }
        .join-body { font-size: 1.0625rem; font-weight: 400; line-height: 1.7; color: #737373; max-width: 520px; }
        .join-section-inverted .join-body { color: rgba(255, 255, 255, 0.55); }

        /* Steps */
        .join-steps { display: flex; flex-direction: column; gap: 0; }
        .join-step { display: flex; align-items: flex-start; gap: 1.25rem; padding: 1.25rem 0; border-bottom: 1px solid #e0e0e0; }
        .join-step:last-child { border-bottom: none; }
        .join-step-num { width: 32px; height: 32px; background: #1a1a1a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
        .join-step-title { font-size: 0.9375rem; font-weight: 700; color: #171717; margin-bottom: 0.15rem; }
        .join-step-desc { font-size: 0.8125rem; color: #737373; line-height: 1.5; }

        /* Form */
        .join-form { margin-top: 0.5rem; }
        .join-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
        .join-field { display: flex; flex-direction: column; margin-top: 0; }
        .join-field label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #737373; text-transform: uppercase; margin-bottom: 0.5rem; }
        .join-field input { padding: 0.75rem 1rem; font-size: 0.9375rem; border: 1px solid #e0e0e0; background: #fff; color: #171717; font-family: inherit; transition: border-color 0.15s; outline: none; }
        .join-field input:focus { border-color: #1a1a1a; }
        .join-error { color: #dc2626; font-size: 0.875rem; margin-top: 1rem; }
        .join-submit { display: block; width: 100%; margin-top: 1.5rem; padding: 1rem; background: #1a1a1a; color: #fff; border: none; font-family: inherit; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: background 0.15s; }
        .join-submit:hover { background: #333; }
        .join-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .join-back-link { display: block; width: 100%; margin-top: 1rem; padding: 0.75rem; background: transparent; border: none; font-family: inherit; font-size: 13px; color: #888; cursor: pointer; text-align: center; }
        .join-back-link:hover { color: #1a1a1a; }

        /* Link result */
        .join-link-box { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; background: #fafafa; border: 1px solid #e0e0e0; margin-bottom: 1.5rem; }
        .join-link-url { flex: 1; font-size: 0.9375rem; font-weight: 600; color: #171717; word-break: break-all; font-family: 'SF Mono', 'Fira Code', monospace; }
        .join-copy-btn { padding: 0.5rem 1.25rem; background: #fff; border: 1px solid #d0d0d0; font-family: inherit; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
        .join-copy-btn:hover { border-color: #1a1a1a; }

        .join-share-btn { display: block; width: 100%; padding: 1.125rem; background: #1a1a1a; color: #fff; border: none; font-family: inherit; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: background 0.15s; margin-bottom: 1rem; }
        .join-share-btn:hover { background: #333; }
        .join-share-note { font-size: 0.8125rem; color: #999; text-align: center; margin-bottom: 2rem; }

        /* Stats */
        .join-stat-box { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; background: #fafafa; border: 1px solid #e0e0e0; margin-bottom: 1.5rem; }
        .join-stat-num { font-size: 2rem; font-weight: 900; color: #171717; line-height: 1; }
        .join-stat-label { font-size: 0.875rem; color: #737373; }

        /* Tip box */
        .join-tip { background: #fafafa; border: 1px solid #e0e0e0; padding: 1.25rem 1.5rem; }
        .join-tip-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #171717; margin-bottom: 0.75rem; }
        .join-tip p { font-size: 0.875rem; color: #737373; line-height: 1.6; margin: 0; }
        .join-resend-btn { background: none; border: none; padding: 0; font-family: inherit; font-size: 0.875rem; color: #1a1a1a; font-weight: 600; text-decoration: underline; cursor: pointer; }
        .join-resend-btn:hover { color: #000; }

        /* Footer CTA */
        .join-cta-buttons { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin: 1.5rem 0; }
        .join-btn-primary { display: inline-block; background: #fff; color: #1a1a1a; padding: 0.875rem 2rem; text-decoration: none; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; transition: background 0.2s; }
        .join-btn-primary:hover { background: #e0e0e0; }
        .join-btn-outline { display: inline-block; background: transparent; color: #fff; padding: 0.875rem 2rem; border: 1px solid rgba(255,255,255,0.3); text-decoration: none; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; transition: all 0.2s; }
        .join-btn-outline:hover { background: #fff; color: #1a1a1a; }

        @media (max-width: 768px) {
          .join-page h1 { font-size: 1.5rem; }
          .join-hero { padding: 3.5rem 2rem 3rem; }
          .join-section { padding: 3rem 1.5rem; }
          .join-section-alt { padding: 2.5rem 1.5rem; }
          .join-section-inverted { padding: 3rem 1.5rem; }
          .join-row { grid-template-columns: 1fr; }
          .join-link-box { flex-direction: column; align-items: stretch; text-align: center; }
          .join-cta-buttons { flex-direction: column; align-items: center; }
          .join-stat-box { flex-direction: column; text-align: center; gap: 0.25rem; }
        }
      `}</style>
    </Layout>
  );
}
