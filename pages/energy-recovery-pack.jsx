// Energy & Recovery Pack — public landing + purchase page (V2 design)
// Pay $500, get $750 to use on Red Light Therapy + Hyperbaric Oxygen
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ── Payment form (inside Elements provider) ──
function PaymentForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || processing) return;
    setProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/energy-recovery-pack?payment_complete=true`,
        },
        redirect: 'if_required',
      });

      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status === 'succeeded') {
        await onSuccess(paymentIntent.id);
      } else {
        throw new Error('Payment was not completed. Please try again.');
      }
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="erp-stripe-wrap">
        <PaymentElement />
      </div>
      {error && <div className="erp-error">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="erp-btn-primary"
        style={{ opacity: processing ? 0.5 : 1, cursor: processing ? 'not-allowed' : 'pointer' }}
      >
        {processing ? 'PROCESSING...' : 'PAY $500 — ACTIVATE $750 BALANCE'}
      </button>
    </form>
  );
}

// ── Scroll reveal hook ──
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('erp-visible'); observer.unobserve(el); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = '' }) {
  const ref = useReveal();
  return <div ref={ref} className={`erp-reveal ${className}`}>{children}</div>;
}

// ── Main page ──
export default function EnergyRecoveryPack() {
  const [step, setStep] = useState('info');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch('/api/energy-packs/config')
      .then(r => r.json())
      .then(data => setConfig(data))
      .catch(() => {});
  }, []);

  const soldOut = config && (!config.enabled || config.packs_remaining <= 0);

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setFormError('Please fill in your name and email.');
      return;
    }
    setFormError(null);
    setCreating(true);

    try {
      const res = await fetch('/api/stripe/service-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          amountCents: 50000,
          productName: 'Energy & Recovery Pack',
          description: 'Energy & Recovery Pack — $500 for $750 balance',
          serviceCategory: 'packages',
          serviceName: 'Energy & Recovery Pack',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');
      setClientSecret(data.clientSecret);
      setStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      await fetch('/api/energy-packs/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });
    } catch (err) {
      console.error('Purchase completion error:', err);
    }
    setStep('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>Energy & Recovery Pack — Range Medical</title>
        <meta name="description" content="Pay $500, get $750 to use on Red Light Therapy and Hyperbaric Oxygen sessions at Range Medical in Newport Beach." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div className="erp-page">

        {/* ── Header ── */}
        <header className="erp-header">
          <div className="erp-header-inner">
            <span className="erp-logo">RANGE MEDICAL</span>
            <span className="erp-header-sub">NEWPORT BEACH</span>
          </div>
        </header>

        {/* ── Success State ── */}
        {step === 'success' && (
          <section className="erp-success-section">
            <div className="erp-success-inner">
              <div className="erp-success-check">&#10003;</div>
              <h1 className="erp-success-title">YOU'RE ALL SET.</h1>
              <div className="erp-hero-rule" />
              <p className="erp-success-body">
                Your Energy & Recovery balance of <strong>$750</strong> is now active. Use it on any Red Light Therapy or Hyperbaric Oxygen session.
              </p>
              <p className="erp-success-body">
                Book your first session by calling or texting us.
              </p>
              <a href="tel:9499973988" className="erp-btn-white">(949) 997-3988</a>
              <p className="erp-success-note">We've sent a confirmation to your phone.</p>
            </div>
          </section>
        )}

        {step !== 'success' && (
          <>
            {/* ── Hero ── */}
            <section className="erp-hero">
              <div className="erp-hero-inner">
                <div className="erp-label"><span className="erp-dot" /> LIMITED AVAILABILITY</div>
                <h1>PAY $500.<br />GET $750.</h1>
                <div className="erp-hero-rule" />
                <p className="erp-hero-body">
                  The Energy & Recovery Pack gives you $750 to spend on Red Light Therapy and Hyperbaric Oxygen sessions at Range Medical. That's $250 in free sessions.
                </p>
              </div>
            </section>

            {/* ── Value breakdown ── */}
            <RevealSection>
              <section className="erp-section">
                <div className="erp-section-inner">
                  <div className="erp-value-grid">
                    <div className="erp-value-card">
                      <div className="erp-value-label">YOU PAY</div>
                      <div className="erp-value-amount">$500</div>
                      <div className="erp-value-sub">one-time</div>
                    </div>
                    <div className="erp-value-card erp-value-card-featured">
                      <div className="erp-card-badge">YOUR BALANCE</div>
                      <div className="erp-value-amount erp-green">$750</div>
                      <div className="erp-value-sub">to use on sessions</div>
                    </div>
                    <div className="erp-value-card">
                      <div className="erp-value-label">YOU SAVE</div>
                      <div className="erp-value-amount erp-amber">$250</div>
                      <div className="erp-value-sub">in free sessions</div>
                    </div>
                  </div>
                </div>
              </section>
            </RevealSection>

            {/* ── What your balance gets you ── */}
            <RevealSection>
              <section className="erp-section erp-section-dark">
                <div className="erp-section-inner">
                  <div className="erp-label erp-label-light"><span className="erp-dot erp-dot-light" /> WHAT YOUR $750 GETS YOU</div>
                  <h2 className="erp-section-title erp-white">SESSION PRICING</h2>
                  <p className="erp-section-sub erp-light">Your balance works like a pre-loaded account. When you come in for a session, we deduct the cost from your $750.</p>

                  <div className="erp-pricing-group">
                    <h3 className="erp-pricing-label">RED LIGHT THERAPY</h3>
                    <p className="erp-pricing-desc">Full-body 660-850nm wavelengths for cellular recovery and tissue repair.</p>
                    <div className="erp-pricing-grid">
                      <div className="erp-pricing-card">
                        <div className="erp-pricing-name">Single Session</div>
                        <div className="erp-pricing-price">$85</div>
                        <div className="erp-pricing-math">= 8 sessions with your pack</div>
                      </div>
                      <div className="erp-pricing-card">
                        <div className="erp-pricing-name">5-Session Pack</div>
                        <div className="erp-pricing-price">$375</div>
                        <div className="erp-pricing-detail">$75/session</div>
                        <div className="erp-pricing-math">= 2 packs (10 sessions)</div>
                      </div>
                      <div className="erp-pricing-card">
                        <div className="erp-pricing-name">10-Session Pack</div>
                        <div className="erp-pricing-price">$600</div>
                        <div className="erp-pricing-detail">$60/session</div>
                        <div className="erp-pricing-math">= 1 pack + $150 left over</div>
                      </div>
                    </div>
                  </div>

                  <div className="erp-pricing-group">
                    <h3 className="erp-pricing-label">HYPERBARIC OXYGEN THERAPY</h3>
                    <p className="erp-pricing-desc">60 minutes at 2.0 ATA. Pressurized oxygen for deep healing and recovery.</p>
                    <div className="erp-pricing-grid">
                      <div className="erp-pricing-card">
                        <div className="erp-pricing-name">Single Session</div>
                        <div className="erp-pricing-price">$185</div>
                        <div className="erp-pricing-math">= 4 sessions with your pack</div>
                      </div>
                      <div className="erp-pricing-card">
                        <div className="erp-pricing-name">5-Session Pack</div>
                        <div className="erp-pricing-price">$850</div>
                        <div className="erp-pricing-detail">$170/session</div>
                      </div>
                      <div className="erp-pricing-card">
                        <div className="erp-pricing-name">10-Session Pack</div>
                        <div className="erp-pricing-price">$1,600</div>
                        <div className="erp-pricing-detail">$160/session</div>
                      </div>
                    </div>
                  </div>

                  <div className="erp-pricing-group">
                    <h3 className="erp-pricing-label">MIX & MATCH</h3>
                    <p className="erp-pricing-desc">Use your balance on any combination. Here are some examples:</p>
                    <div className="erp-mix-grid">
                      <div className="erp-mix-card">
                        <div className="erp-mix-title">Recovery Focus</div>
                        <div className="erp-mix-items">4 HBOT sessions ($740)</div>
                        <div className="erp-mix-remaining">$10 remaining</div>
                      </div>
                      <div className="erp-mix-card">
                        <div className="erp-mix-title">Balanced Plan</div>
                        <div className="erp-mix-items">2 HBOT + 4 RLT ($710)</div>
                        <div className="erp-mix-remaining">$40 remaining</div>
                      </div>
                      <div className="erp-mix-card">
                        <div className="erp-mix-title">Light Therapy Focus</div>
                        <div className="erp-mix-items">8 Red Light sessions ($680)</div>
                        <div className="erp-mix-remaining">$70 remaining</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </RevealSection>

            {/* ── How it works ── */}
            <RevealSection>
              <section className="erp-section">
                <div className="erp-section-inner">
                  <h2 className="erp-section-title">HOW IT WORKS</h2>
                  <div className="erp-steps">
                    <div className="erp-step">
                      <div className="erp-step-num">1</div>
                      <div>
                        <div className="erp-step-title">Purchase your pack</div>
                        <div className="erp-step-desc">One-time payment of $500 activates your $750 balance instantly.</div>
                      </div>
                    </div>
                    <div className="erp-step">
                      <div className="erp-step-num">2</div>
                      <div>
                        <div className="erp-step-title">Book sessions on your schedule</div>
                        <div className="erp-step-desc">Call or text to book any Red Light or Hyperbaric session. No subscription required.</div>
                      </div>
                    </div>
                    <div className="erp-step">
                      <div className="erp-step-num">3</div>
                      <div>
                        <div className="erp-step-title">Balance applied at checkout</div>
                        <div className="erp-step-desc">When you come in, the session cost is deducted from your balance automatically.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </RevealSection>

            {/* ── Fine print ── */}
            <RevealSection>
              <section className="erp-section erp-section-light">
                <div className="erp-section-inner">
                  <h2 className="erp-section-title">THE DETAILS</h2>
                  <div className="erp-details-grid">
                    <div className="erp-detail-card">
                      <div className="erp-detail-icon">&#8734;</div>
                      <div className="erp-detail-title">$500 base never expires</div>
                      <div className="erp-detail-desc">Your base balance is yours to use whenever you're ready. No rush.</div>
                    </div>
                    <div className="erp-detail-card">
                      <div className="erp-detail-icon">90</div>
                      <div className="erp-detail-title">$250 bonus valid 90 days</div>
                      <div className="erp-detail-desc">Use your bonus within 90 days of purchase. After that, your $500 base remains.</div>
                    </div>
                    <div className="erp-detail-card">
                      <div className="erp-detail-icon">&#8596;</div>
                      <div className="erp-detail-title">Mix and match freely</div>
                      <div className="erp-detail-desc">Red Light one visit, Hyperbaric the next. Use your balance however you want.</div>
                    </div>
                    <div className="erp-detail-card">
                      <div className="erp-detail-icon">&#189;</div>
                      <div className="erp-detail-title">Partial use allowed</div>
                      <div className="erp-detail-desc">If your balance doesn't cover a full session, pay the difference with any method.</div>
                    </div>
                  </div>
                </div>
              </section>
            </RevealSection>

            {/* ── Availability ── */}
            {config && !soldOut && config.packs_remaining <= 10 && (
              <div className="erp-urgency">
                Only {config.packs_remaining} pack{config.packs_remaining !== 1 ? 's' : ''} remaining
              </div>
            )}

            {/* ── CTA / Form ── */}
            <section className="erp-section" id="buy">
              <div className="erp-section-inner">
                {soldOut ? (
                  <div className="erp-sold-out">
                    <h2 className="erp-section-title">SOLD OUT</h2>
                    <p>This offer is currently sold out. Call <a href="tel:9499973988">(949) 997-3988</a> to join the waitlist.</p>
                  </div>
                ) : step === 'info' ? (
                  <div className="erp-form-wrap">
                    <h2 className="erp-section-title">GET YOUR PACK</h2>
                    <p className="erp-section-sub">Pay $500 today. Your $750 balance activates immediately.</p>
                    <form onSubmit={handleContinue}>
                      <div className="erp-field-row">
                        <div className="erp-field-half">
                          <label className="erp-label-sm">FIRST NAME</label>
                          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="erp-input" required />
                        </div>
                        <div className="erp-field-half">
                          <label className="erp-label-sm">LAST NAME</label>
                          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="erp-input" required />
                        </div>
                      </div>
                      <div className="erp-field">
                        <label className="erp-label-sm">EMAIL</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="erp-input" required />
                      </div>
                      <div className="erp-field">
                        <label className="erp-label-sm">PHONE</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(949) 555-0123" className="erp-input" />
                      </div>
                      {formError && <div className="erp-error">{formError}</div>}
                      <button type="submit" disabled={creating} className="erp-btn-primary" style={{ opacity: creating ? 0.5 : 1 }}>
                        {creating ? 'LOADING...' : 'CONTINUE TO PAYMENT — $500'}
                      </button>
                    </form>
                  </div>
                ) : step === 'payment' && clientSecret ? (
                  <div className="erp-form-wrap">
                    <h2 className="erp-section-title">PAYMENT</h2>
                    <div className="erp-payment-header">
                      <span>{firstName} {lastName} &mdash; {email}</span>
                      <button onClick={() => setStep('info')} className="erp-back-link">Edit</button>
                    </div>
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: 'stripe',
                          variables: {
                            borderRadius: '0px',
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          },
                        },
                      }}
                    >
                      <PaymentForm onSuccess={handlePaymentSuccess} />
                    </Elements>
                  </div>
                ) : null}
              </div>
            </section>
          </>
        )}

        {/* ── Footer ── */}
        <footer className="erp-footer">
          <div className="erp-footer-inner">
            <span className="erp-logo">RANGE MEDICAL</span>
            <div className="erp-footer-info">
              1901 Westcliff Drive, Suite 10, Newport Beach, CA<br />
              (949) 997-3988 &bull; range-medical.com
            </div>
          </div>
        </footer>

      </div>

      <style jsx>{`
        .erp-page {
          min-height: 100vh;
          background: #fafafa;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1a1a1a;
        }

        /* ── Header ── */
        .erp-header {
          background: #1a1a1a;
          padding: 18px 2rem;
        }
        .erp-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .erp-logo {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.16em;
          color: #fff;
        }
        .erp-header-sub {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          color: #737373;
        }

        /* ── Hero ── */
        .erp-hero {
          padding: 6rem 2rem 4rem;
        }
        .erp-hero-inner {
          max-width: 700px;
          margin: 0 auto;
        }
        .erp-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #737373;
          margin-bottom: 1.5rem;
        }
        .erp-label-light { color: #a0a0a0; }
        .erp-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1a1a1a;
        }
        .erp-dot-light { background: #a0a0a0; }
        .erp-hero h1 {
          font-size: clamp(3rem, 8vw, 5.5rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          margin: 0 0 2.5rem;
        }
        .erp-hero-rule {
          width: 100%;
          max-width: 700px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 2rem;
        }
        .erp-hero-body {
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #737373;
          max-width: 520px;
          margin: 0;
        }

        /* ── Sections ── */
        .erp-section {
          padding: 4rem 2rem;
        }
        .erp-section-dark {
          background: #1a1a1a;
        }
        .erp-section-light {
          background: #ffffff;
          border-top: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
        }
        .erp-section-inner {
          max-width: 800px;
          margin: 0 auto;
        }
        .erp-section-title {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -0.01em;
          margin: 0 0 0.75rem;
        }
        .erp-section-sub {
          font-size: 1rem;
          color: #737373;
          line-height: 1.6;
          margin: 0 0 2rem;
        }
        .erp-white { color: #ffffff; }
        .erp-light { color: #a0a0a0; }
        .erp-green { color: #16a34a; }
        .erp-amber { color: #b45309; }

        /* ── Value cards ── */
        .erp-value-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.25rem;
        }
        .erp-value-card {
          position: relative;
          padding: 2rem 1.5rem;
          border: 1px solid #e0e0e0;
          background: #fff;
          text-align: center;
        }
        .erp-value-card-featured {
          border: 2px solid #1a1a1a;
        }
        .erp-card-badge {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.5625rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #fff;
          background: #1a1a1a;
          padding: 0.25rem 0.75rem;
          white-space: nowrap;
        }
        .erp-value-label {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #737373;
          margin-bottom: 0.5rem;
        }
        .erp-value-amount {
          font-size: 2.5rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 0.25rem;
        }
        .erp-value-sub {
          font-size: 0.8125rem;
          color: #a0a0a0;
        }

        /* ── Pricing cards (dark section) ── */
        .erp-pricing-group {
          margin-bottom: 2.5rem;
        }
        .erp-pricing-label {
          font-size: 0.8125rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #ffffff;
          margin: 0 0 0.25rem;
        }
        .erp-pricing-desc {
          font-size: 0.875rem;
          color: #a0a0a0;
          margin: 0 0 1rem;
          line-height: 1.5;
        }
        .erp-pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .erp-pricing-card {
          padding: 1.25rem;
          border: 1px solid #333;
          background: rgba(255,255,255,0.04);
        }
        .erp-pricing-name {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #a0a0a0;
          margin-bottom: 0.5rem;
        }
        .erp-pricing-price {
          font-size: 1.5rem;
          font-weight: 900;
          color: #fff;
          margin-bottom: 0.125rem;
        }
        .erp-pricing-detail {
          font-size: 0.75rem;
          color: #737373;
          margin-bottom: 0.5rem;
        }
        .erp-pricing-math {
          font-size: 0.75rem;
          font-weight: 600;
          color: #16a34a;
          margin-top: 0.5rem;
        }

        /* ── Mix & match ── */
        .erp-mix-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .erp-mix-card {
          padding: 1.25rem;
          border: 1px solid #333;
          background: rgba(255,255,255,0.04);
        }
        .erp-mix-title {
          font-size: 0.8125rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.5rem;
        }
        .erp-mix-items {
          font-size: 0.8125rem;
          color: #a0a0a0;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .erp-mix-remaining {
          font-size: 0.75rem;
          font-weight: 600;
          color: #16a34a;
        }

        /* ── Steps ── */
        .erp-steps {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .erp-step {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
        }
        .erp-step-num {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #1a1a1a;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .erp-step-title {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .erp-step-desc {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.5;
        }

        /* ── Details grid ── */
        .erp-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .erp-detail-card {
          padding: 1.5rem;
          border: 1px solid #e0e0e0;
        }
        .erp-detail-icon {
          font-size: 1.5rem;
          font-weight: 900;
          color: #1a1a1a;
          margin-bottom: 0.75rem;
        }
        .erp-detail-title {
          font-size: 0.9375rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .erp-detail-desc {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.5;
        }

        /* ── Urgency ── */
        .erp-urgency {
          text-align: center;
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #b45309;
          background: #fffbeb;
          border-top: 1px solid #fde68a;
          border-bottom: 1px solid #fde68a;
          padding: 0.875rem 2rem;
        }

        /* ── Form ── */
        .erp-form-wrap {
          max-width: 480px;
          margin: 0 auto;
        }
        .erp-field-row {
          display: flex;
          gap: 12px;
          margin-bottom: 14px;
        }
        .erp-field-half { flex: 1; }
        .erp-field { margin-bottom: 14px; }
        .erp-label-sm {
          display: block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 6px;
        }
        .erp-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #d4d4d4;
          border-radius: 0;
          font-size: 15px;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
        }
        .erp-input:focus { border-color: #1a1a1a; }
        .erp-btn-primary {
          display: block;
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #1a1a1a;
          color: #fff;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .erp-btn-primary:hover { background: #404040; }
        .erp-stripe-wrap {
          background: #fafafa;
          border: 1px solid #e0e0e0;
          padding: 20px;
          margin-bottom: 8px;
        }
        .erp-error {
          background: #fef2f2;
          color: #dc2626;
          font-size: 13px;
          padding: 10px 14px;
          margin-top: 12px;
        }
        .erp-payment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 14px;
          color: #737373;
        }
        .erp-back-link {
          background: none;
          border: none;
          color: #1a1a1a;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          font-family: inherit;
        }
        .erp-sold-out {
          text-align: center;
          padding: 2rem;
          color: #737373;
        }
        .erp-sold-out a { color: #1a1a1a; font-weight: 700; }

        /* ── Success ── */
        .erp-success-section {
          padding: 6rem 2rem;
          text-align: center;
        }
        .erp-success-inner {
          max-width: 520px;
          margin: 0 auto;
        }
        .erp-success-check {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #f0fdf4;
          color: #16a34a;
          font-size: 28px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
        }
        .erp-success-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 900;
          letter-spacing: -0.02em;
          margin: 0 0 1.5rem;
        }
        .erp-success-body {
          font-size: 1.0625rem;
          color: #737373;
          line-height: 1.75;
          margin: 0 0 1rem;
        }
        .erp-btn-white {
          display: inline-block;
          background: #1a1a1a;
          color: #fff;
          padding: 0.875rem 2.5rem;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-decoration: none;
          margin: 1rem 0;
          transition: background 0.2s;
        }
        .erp-btn-white:hover { background: #404040; }
        .erp-success-note {
          font-size: 0.8125rem;
          color: #a0a0a0;
          margin-top: 1rem;
        }

        /* ── Footer ── */
        .erp-footer {
          padding: 2.5rem 2rem;
          border-top: 1px solid #e0e0e0;
          text-align: center;
        }
        .erp-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .erp-footer .erp-logo {
          color: #1a1a1a;
          display: block;
          margin-bottom: 0.5rem;
        }
        .erp-footer-info {
          font-size: 0.8125rem;
          color: #a0a0a0;
          line-height: 1.6;
        }

        /* ── Scroll reveal ── */
        .erp-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .erp-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .erp-hero { padding: 4rem 1.5rem 3rem; }
          .erp-section { padding: 3rem 1.5rem; }
          .erp-value-grid { grid-template-columns: 1fr; gap: 1rem; }
          .erp-pricing-grid { grid-template-columns: 1fr; }
          .erp-mix-grid { grid-template-columns: 1fr; }
          .erp-details-grid { grid-template-columns: 1fr; }
          .erp-field-row { flex-direction: column; gap: 14px; }
        }
      `}</style>
    </>
  );
}
