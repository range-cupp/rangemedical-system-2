// pages/hbot-trial.jsx
// HBOT Trial landing page: contact info → problem/importance → Stripe payment → confirmation
// 3 Hyperbaric Oxygen sessions over 10 days for $149
// Range Medical

import Layout from '../components/Layout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const TEAL = '#0891b2';
const TEAL_BG = '#ecfeff';

const PROBLEM_OPTIONS = [
  'Brain fog / focus',
  'Headaches',
  'Slow recovery',
  'Sleep',
  'Other',
];

function CheckoutForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setPayError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/hbot-trial?payment_complete=true` },
        redirect: 'if_required',
      });

      if (error) throw new Error(error.message);
      if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      setPayError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {payError && <p style={{ color: '#dc2626', fontSize: 14, marginTop: 12 }}>{payError}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          width: '100%', marginTop: 20, padding: 16, background: TEAL, color: '#fff',
          border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600,
          cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.6 : 1,
          fontFamily: 'inherit',
        }}
      >
        {processing ? 'Processing...' : 'Start My Trial \u2014 $149'}
      </button>
    </form>
  );
}

export default function HBOTTrial() {
  const router = useRouter();
  const { trial_id: trialIdParam } = router.query;

  const [step, setStep] = useState('contact');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Contact
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Qualification
  const [mainProblem, setMainProblem] = useState('');
  const [importance, setImportance] = useState(null);

  // Payment
  const [clientSecret, setClientSecret] = useState(null);
  const [trialId, setTrialId] = useState(null);

  // Pre-fill from existing trial pass if trial_id present
  useEffect(() => {
    if (!trialIdParam) return;
    setTrialId(trialIdParam);

    fetch(`/api/hbot-trial/get-trial?id=${trialIdParam}`)
      .then(r => r.json())
      .then(data => {
        if (data.trial) {
          if (data.trial.first_name) setFirstName(data.trial.first_name);
          if (data.trial.last_name) setLastName(data.trial.last_name);
          if (data.trial.email) setEmail(data.trial.email);
          if (data.trial.phone) setPhone(data.trial.phone);
        }
      })
      .catch(() => {});
  }, [trialIdParam]);

  const handleContactSubmit = async () => {
    if (!firstName || !lastName || !email || !phone) {
      setError('Please fill in all fields.');
      return;
    }
    if (!mainProblem) {
      setError('Please select what you want to improve.');
      return;
    }
    if (importance === null) {
      setError('Please rate how important this is to you.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const payRes = await fetch('/api/hbot-trial/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, email, phone,
          main_problem: mainProblem,
          importance_1_10: importance,
          trialId: trialId || null,
        }),
      });
      const payData = await payRes.json();

      if (payData.clientSecret) {
        setClientSecret(payData.clientSecret);
        if (typeof fbq === 'function') fbq('track', 'Lead', { content_name: 'hbot-trial', value: 149.00, currency: 'USD' });
        setStep('payment');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(payData.error || 'Could not initialize payment');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      const res = await fetch('/api/hbot-trial/checkout-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          trialId: trialId || null,
          firstName, lastName, email, phone,
          main_problem: mainProblem,
          importance_1_10: importance,
        }),
      });
      const data = await res.json();
      if (data.trialId) setTrialId(data.trialId);
    } catch (e) {
      console.error('Checkout complete error:', e);
    }
    if (typeof fbq === 'function') fbq('track', 'Purchase', { content_name: 'hbot-trial', value: 149.00, currency: 'USD' });
    setStep('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout title="Hyperbaric Recovery Trial \u2014 10 Days for $149 | Range Medical">
      <Head><meta name="robots" content="noindex, nofollow" /></Head>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '72px 20px 80px', color: '#171717' }}>

        {/* CONTACT STEP */}
        {step === 'contact' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <span style={{ display: 'inline-block', background: TEAL_BG, color: TEAL, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 14px', borderRadius: 0, marginBottom: 12 }}>
                Recovery Trial
              </span>
              <h1 style={{ fontSize: 30, fontWeight: 700, margin: '0 0 8px' }}>3 Hyperbaric Oxygen Sessions in 10 Days</h1>
              <p style={{ fontSize: 22, fontWeight: 700, color: TEAL, margin: '0 0 16px' }}>$149</p>
              <p style={{ fontSize: 16, color: '#525252', margin: 0, lineHeight: 1.6 }}>
                Pressurized oxygen sessions for 10 days, plus a Brain & Recovery check-in to see what changed.
              </p>
            </div>

            <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', padding: 20, marginBottom: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>What you get:</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  '3 hyperbaric sessions over 10 days',
                  '60-minute pressurized sessions',
                  'Before & after Brain & Recovery check-in',
                  'Personalized next-step recommendation',
                ].map((item, i) => (
                  <li key={i} style={{ fontSize: 14, color: '#525252', padding: '4px 0', lineHeight: 1.5 }}>
                    <span style={{ color: '#16a34a', fontWeight: 700, marginRight: 8 }}>&#10003;</span>{item}
                  </li>
                ))}
              </ul>
            </div>

            {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 4 }}>First name *</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" style={{ width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 4 }}>Last name *</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" style={{ width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 4 }}>Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={{ width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 4 }}>Phone *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(949) 555-1234" style={{ width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            {/* Main problem dropdown */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 4 }}>What do you most want to improve? *</label>
              <select
                value={mainProblem}
                onChange={e => setMainProblem(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' }}
              >
                <option value="">Select...</option>
                {PROBLEM_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Importance scale */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 4 }}>How important is fixing this to you? *</label>
              <p style={{ fontSize: 12, color: '#a3a3a3', margin: '0 0 8px' }}>1 = not very, 10 = extremely</p>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setImportance(n)}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      border: importance === n ? `2px solid ${TEAL}` : '1px solid #d4d4d4',
                      background: importance === n ? TEAL : '#fff',
                      color: importance === n ? '#fff' : '#171717',
                      fontSize: 14,
                      fontWeight: importance === n ? 700 : 400,
                      cursor: 'pointer',
                      borderRadius: 0,
                      fontFamily: 'inherit',
                      minHeight: 44,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleContactSubmit}
              disabled={submitting}
              style={{
                width: '100%', padding: 16, background: TEAL, color: '#fff',
                border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              {submitting ? 'Setting up...' : 'Continue to Payment \u2014 $149'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#a3a3a3', marginTop: 12 }}>
              By continuing, you agree to receive texts from Range Medical. Reply STOP to opt out.
            </p>
          </>
        )}

        {/* PAYMENT STEP */}
        {step === 'payment' && clientSecret && stripePromise && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <span style={{ display: 'inline-block', background: TEAL_BG, color: TEAL, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 14px', borderRadius: 0, marginBottom: 12 }}>
                Recovery Trial \u2014 $149
              </span>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Payment</h1>
              <p style={{ fontSize: 15, color: '#525252', margin: 0 }}>
                Secure checkout for your Hyperbaric Recovery Trial \u2014 3 sessions over 10 days.
              </p>
            </div>

            <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', padding: 24 }}>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <CheckoutForm onSuccess={handlePaymentSuccess} />
              </Elements>
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#a3a3a3', marginTop: 16 }}>
              Your payment is secure. 3 hyperbaric sessions over 10 days.
            </p>
          </>
        )}

        {/* DONE STEP */}
        {step === 'done' && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, background: '#22c55e', borderRadius: '50%', marginBottom: 20 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 700, margin: '0 0 8px' }}>You're in, {firstName}!</h1>
              <p style={{ fontSize: 16, color: '#525252', margin: '0 0 32px', lineHeight: 1.6 }}>
                Your Hyperbaric Recovery Trial is confirmed. We'll text you everything you need.
              </p>
            </div>

            <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', padding: 28, marginBottom: 24 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 16px' }}>Next steps:</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>
                  <span style={{ color: TEAL, fontWeight: 700, marginRight: 8 }}>1.</span>
                  Complete your 60-second Brain & Recovery survey (check your texts)
                </li>
                <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>
                  <span style={{ color: TEAL, fontWeight: 700, marginRight: 8 }}>2.</span>
                  Call or text (949) 997-3988 to book your first session
                </li>
                <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>
                  <span style={{ color: TEAL, fontWeight: 700, marginRight: 8 }}>3.</span>
                  Come in for your 3 sessions over 10 days
                </li>
                <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>
                  <span style={{ color: TEAL, fontWeight: 700, marginRight: 8 }}>4.</span>
                  We'll do a quick check-in at the end to see how you're feeling
                </li>
              </ul>
            </div>

            {trialId && (
              <a
                href={`/hbot-trial/survey?trial_id=${trialId}&type=pre`}
                style={{
                  display: 'block', width: '100%', padding: 16, background: TEAL, color: '#fff',
                  border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600,
                  textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box',
                }}
              >
                Take Brain & Recovery Survey Now
              </a>
            )}

            <p style={{ textAlign: 'center', fontSize: 14, color: '#737373', marginTop: 16 }}>
              Questions? Call/text <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600, textDecoration: 'none' }}>(949) 997-3988</a>
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}
