// Energy & Recovery Pack — public landing + purchase page
// Pay $500, get $750 to use on Red Light Therapy + Hyperbaric Oxygen
import { useState, useEffect } from 'react';
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
      <div style={s.stripeWrap}>
        <PaymentElement />
      </div>
      {error && <div style={s.error}>{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{ ...s.payBtn, opacity: processing ? 0.6 : 1, cursor: processing ? 'not-allowed' : 'pointer' }}
      >
        {processing ? 'Processing...' : 'Pay $500 — Activate $750 Balance'}
      </button>
    </form>
  );
}

// ── Main page ──
export default function EnergyRecoveryPack() {
  const [step, setStep] = useState('info'); // info → payment → success
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState(null);
  const [config, setConfig] = useState(null);

  // Check availability on load
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
  };

  return (
    <>
      <Head>
        <title>Energy & Recovery Pack — Range Medical</title>
        <meta name="description" content="Pay $500, get $750 to use on Red Light Therapy and Hyperbaric Oxygen sessions at Range Medical in Newport Beach." />
      </Head>

      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <h1 style={s.headerLogo}>RANGE MEDICAL</h1>
          <span style={s.headerSub}>Newport Beach</span>
        </div>

        <div style={s.container}>

          {/* Hero */}
          <div style={s.hero}>
            <div style={s.badge}>Limited Availability</div>
            <h2 style={s.title}>Energy & Recovery Pack</h2>
            <p style={s.subtitle}>
              Pay $500 today. Get $750 to use on Red Light Therapy and Hyperbaric Oxygen sessions.
            </p>
          </div>

          {/* Value breakdown */}
          <div style={s.valueCard}>
            <div style={s.valueRow}>
              <span style={s.valueLabel}>You pay</span>
              <span style={s.valueAmount}>$500</span>
            </div>
            <div style={s.valueDivider} />
            <div style={s.valueRow}>
              <span style={s.valueLabel}>Your balance</span>
              <span style={{ ...s.valueAmount, color: '#16a34a', fontSize: 28 }}>$750</span>
            </div>
            <div style={s.valueDivider} />
            <div style={s.valueRow}>
              <span style={s.valueLabel}>You save</span>
              <span style={{ ...s.valueAmount, color: '#b45309' }}>$250</span>
            </div>
          </div>

          {/* How it works */}
          <div style={s.section}>
            <h3 style={s.sectionTitle}>How It Works</h3>
            <div style={s.step}>
              <div style={s.stepNum}>1</div>
              <div>
                <div style={s.stepTitle}>Purchase your pack</div>
                <div style={s.stepDesc}>One-time payment of $500 activates your $750 balance.</div>
              </div>
            </div>
            <div style={s.step}>
              <div style={s.stepNum}>2</div>
              <div>
                <div style={s.stepTitle}>Book your sessions</div>
                <div style={s.stepDesc}>Use your balance on any Red Light Therapy or Hyperbaric Oxygen session.</div>
              </div>
            </div>
            <div style={s.step}>
              <div style={s.stepNum}>3</div>
              <div>
                <div style={s.stepTitle}>Recover and perform</div>
                <div style={s.stepDesc}>Come in on your schedule. Your balance is applied automatically.</div>
              </div>
            </div>
          </div>

          {/* Fine print */}
          <div style={s.details}>
            <div style={s.detailItem}>$500 base balance never expires</div>
            <div style={s.detailItem}>$250 bonus balance valid for 90 days</div>
            <div style={s.detailItem}>Use across multiple visits until balance is used</div>
            <div style={s.detailItem}>Non-refundable after purchase</div>
          </div>

          {/* Availability */}
          {config && !soldOut && config.packs_remaining <= 10 && (
            <div style={s.urgency}>
              Only {config.packs_remaining} pack{config.packs_remaining !== 1 ? 's' : ''} remaining
            </div>
          )}

          {/* ── FORM / PAYMENT / SUCCESS ── */}

          {soldOut && (
            <div style={s.soldOut}>
              This offer is currently sold out. Call (949) 997-3988 to join the waitlist.
            </div>
          )}

          {!soldOut && step === 'info' && (
            <form onSubmit={handleContinue} style={s.form}>
              <div style={s.fieldRow}>
                <div style={s.fieldHalf}>
                  <label style={s.label}>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    style={s.input}
                    required
                  />
                </div>
                <div style={s.fieldHalf}>
                  <label style={s.label}>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    style={s.input}
                    required
                  />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={s.input}
                  required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(949) 555-0123"
                  style={s.input}
                />
              </div>
              {formError && <div style={s.error}>{formError}</div>}
              <button
                type="submit"
                disabled={creating}
                style={{ ...s.payBtn, opacity: creating ? 0.6 : 1, cursor: creating ? 'not-allowed' : 'pointer' }}
              >
                {creating ? 'Loading...' : 'Continue to Payment — $500'}
              </button>
            </form>
          )}

          {!soldOut && step === 'payment' && clientSecret && (
            <div style={s.form}>
              <div style={s.paymentHeader}>
                <div style={{ fontSize: 14, color: '#525252' }}>
                  {firstName} {lastName} — {email}
                </div>
                <button onClick={() => setStep('info')} style={s.backLink}>Edit</button>
              </div>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: { borderRadius: '0px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
                  },
                }}
              >
                <PaymentForm onSuccess={handlePaymentSuccess} />
              </Elements>
            </div>
          )}

          {step === 'success' && (
            <div style={s.successCard}>
              <div style={s.successCheck}>✓</div>
              <h3 style={s.successTitle}>You're all set!</h3>
              <p style={s.successText}>
                Your Energy & Recovery balance of <strong>$750</strong> is now active.
              </p>
              <p style={s.successText}>
                Book your first Red Light Therapy or Hyperbaric Oxygen session by calling or texting us.
              </p>
              <a href="tel:9499973988" style={s.phoneBtn}>(949) 997-3988</a>
              <p style={s.successNote}>
                We've sent a confirmation to your phone. You can also call or text us anytime to book.
              </p>
            </div>
          )}

          {/* Footer */}
          <div style={s.footer}>
            <div style={s.footerName}>Range Medical</div>
            <div style={s.footerAddr}>1901 Westcliff Drive, Suite 10, Newport Beach, CA</div>
            <div style={s.footerPhone}>(949) 997-3988 — range-medical.com</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Styles ──
const s = {
  page: {
    minHeight: '100vh',
    background: '#fafafa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    background: '#171717',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLogo: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 2,
    color: '#fff',
    margin: 0,
  },
  headerSub: {
    fontSize: 12,
    color: '#999',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  container: {
    maxWidth: 520,
    margin: '0 auto',
    padding: '24px 20px 40px',
  },
  hero: {
    textAlign: 'center',
    marginBottom: 24,
  },
  badge: {
    display: 'inline-block',
    background: '#171717',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '6px 16px',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#171717',
    margin: '0 0 8px',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 16,
    color: '#525252',
    margin: 0,
    lineHeight: 1.5,
  },
  valueCard: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    padding: '20px 24px',
    marginBottom: 24,
  },
  valueRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  valueLabel: {
    fontSize: 14,
    color: '#525252',
    fontWeight: 500,
  },
  valueAmount: {
    fontSize: 22,
    fontWeight: 700,
    color: '#171717',
  },
  valueDivider: {
    height: 1,
    background: '#f0f0f0',
    margin: '4px 0',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#999',
    marginBottom: 16,
  },
  step: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#171717',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#171717',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 14,
    color: '#525252',
    lineHeight: 1.4,
  },
  details: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    padding: '16px 20px',
    marginBottom: 24,
  },
  detailItem: {
    fontSize: 13,
    color: '#525252',
    padding: '6px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  urgency: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 600,
    color: '#b45309',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    padding: '10px 16px',
    marginBottom: 24,
  },
  soldOut: {
    textAlign: 'center',
    fontSize: 15,
    color: '#991b1b',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '20px',
    marginBottom: 24,
  },
  form: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    padding: '24px 20px',
    marginBottom: 24,
  },
  fieldRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 14,
  },
  fieldHalf: {
    flex: 1,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#333',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #d1d1d1',
    borderRadius: 0,
    fontSize: 15,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
  },
  payBtn: {
    width: '100%',
    marginTop: 16,
    padding: 16,
    background: '#171717',
    color: '#fff',
    border: 'none',
    borderRadius: 0,
    fontSize: 16,
    fontWeight: 600,
    fontFamily: 'inherit',
  },
  stripeWrap: {
    background: '#fafafa',
    border: '1px solid #e5e5e5',
    padding: 20,
    marginBottom: 8,
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: 13,
    padding: '10px 14px',
    marginTop: 12,
  },
  paymentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #f0f0f0',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#171717',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'inherit',
  },
  successCard: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    padding: '32px 24px',
    textAlign: 'center',
    marginBottom: 24,
  },
  successCheck: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#f0fdf4',
    color: '#16a34a',
    fontSize: 24,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#171717',
    margin: '0 0 8px',
  },
  successText: {
    fontSize: 15,
    color: '#525252',
    margin: '0 0 12px',
    lineHeight: 1.5,
  },
  phoneBtn: {
    display: 'inline-block',
    background: '#171717',
    color: '#fff',
    padding: '14px 32px',
    fontSize: 16,
    fontWeight: 600,
    textDecoration: 'none',
    margin: '8px 0 16px',
  },
  successNote: {
    fontSize: 13,
    color: '#999',
    margin: 0,
  },
  footer: {
    textAlign: 'center',
    padding: '24px 0 0',
    borderTop: '1px solid #e5e5e5',
  },
  footerName: {
    fontSize: 13,
    fontWeight: 700,
    color: '#171717',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  footerAddr: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  footerPhone: {
    fontSize: 12,
    color: '#999',
  },
};
