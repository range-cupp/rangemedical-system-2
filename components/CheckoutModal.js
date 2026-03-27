// components/CheckoutModal.js
// Reusable embedded Stripe checkout modal for service pages
// Replaces buy.stripe.com Payment Link redirects with on-site payment

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ── Stripe Payment Form (must be inside <Elements>) ────────────────────────
function PaymentForm({ onSuccess, onError, productName, amountLabel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [payError, setPayError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || processing || completing) return;
    setProcessing(true);
    setPayError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}?payment_complete=true`,
        },
        redirect: 'if_required',
      });

      if (error) throw new Error(error.message);
      if (paymentIntent?.status === 'succeeded') {
        setProcessing(false);
        setCompleting(true);
        await onSuccess(paymentIntent.id);
      }
    } catch (err) {
      setPayError(err.message);
      if (onError) onError(err.message);
      setProcessing(false);
    }
  };

  const busy = processing || completing;
  const label = completing ? 'Confirming...' : processing ? 'Processing...' : `Pay ${amountLabel}`;

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {payError && <p style={s.error}>{payError}</p>}
      <button type="submit" disabled={!stripe || busy} style={{
        ...s.submitBtn,
        opacity: busy ? 0.85 : 1,
        cursor: busy ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        background: busy ? '#333' : '#171717',
        transition: 'background 0.2s, opacity 0.2s',
      }}>
        {busy && (
          <span style={{
            display: 'inline-block', width: 18, height: 18,
            border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
            borderRadius: '50%', animation: 'checkoutSpin 0.6s linear infinite',
          }} />
        )}
        {label}
      </button>
      {busy && (
        <style>{`@keyframes checkoutSpin { to { transform: rotate(360deg); } }`}</style>
      )}
    </form>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────────
export default function CheckoutModal({
  isOpen,
  onClose,
  productName,
  amountCents,
  amountLabel,
  description,
  serviceCategory,
  serviceName,
}) {
  // Steps: contact → payment → success
  const [step, setStep] = useState('contact');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay so closing animation can play before reset
      const t = setTimeout(() => {
        setStep('contact');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setError('');
        setSubmitting(false);
        setClientSecret(null);
        setPaymentIntentId(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Step 1: Submit contact info → create PaymentIntent
  const handleContactSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/stripe/service-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          amountCents,
          productName: serviceName || productName,
          description: description || productName,
          serviceCategory: serviceCategory || null,
          serviceName: serviceName || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Could not initialize payment');

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStep('payment');
      } else {
        throw new Error('Could not initialize payment');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Payment success → record purchase
  const handlePaymentSuccess = async (piId) => {
    setPaymentIntentId(piId);

    // Record the purchase server-side
    try {
      const res = await fetch('/api/stripe/checkout-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: piId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          amountCents,
          productName: serviceName || productName,
          description: description || productName,
          serviceCategory: serviceCategory || null,
          serviceName: serviceName || null,
        }),
      });
      await res.json(); // Ensure response completes
    } catch (e) {
      console.error('Post-payment recording error:', e);
    }

    setStep('success');
  };

  return (
    <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.modal}>
        {/* Close button */}
        <button onClick={onClose} style={s.closeBtn} aria-label="Close">&times;</button>

        {/* ── CONTACT STEP ── */}
        {step === 'contact' && (
          <>
            <div style={s.header}>
              <div style={s.badge}>{productName}</div>
              <h2 style={s.title}>Enter your info to get started</h2>
              <p style={s.subtitle}>Secure checkout — you won't leave this page.</p>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.row}>
              <div style={s.half}>
                <label style={s.label}>First name *</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" style={s.input} />
              </div>
              <div style={s.half}>
                <label style={s.label}>Last name *</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" style={s.input} />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={s.input} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Phone *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(949) 555-1234" style={s.input} />
            </div>

            <button onClick={handleContactSubmit} disabled={submitting} style={{ ...s.submitBtn, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Setting up...' : `Continue to Payment — ${amountLabel}`}
            </button>

            <p style={s.disclaimer}>
              By continuing, you agree to receive texts from Range Medical. Reply STOP to opt out.
            </p>
          </>
        )}

        {/* ── PAYMENT STEP ── */}
        {step === 'payment' && clientSecret && stripePromise && (
          <>
            <div style={s.header}>
              <div style={s.badge}>{productName} — {amountLabel}</div>
              <h2 style={s.title}>Payment</h2>
              <p style={s.subtitle}>Secure checkout for {firstName}.</p>
            </div>

            <div style={s.stripeWrap}>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <PaymentForm
                  onSuccess={handlePaymentSuccess}
                  productName={productName}
                  amountLabel={amountLabel}
                />
              </Elements>
            </div>

            <button onClick={() => setStep('contact')} style={s.backBtn}>
              &larr; Back
            </button>

            <p style={s.disclaimer}>
              Your payment is processed securely by Stripe. We never store your card details.
            </p>
          </>
        )}

        {/* ── SUCCESS STEP ── */}
        {step === 'success' && (
          <>
            <div style={{ ...s.header, textAlign: 'center' }}>
              <div style={s.checkCircle}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 style={{ ...s.title, marginTop: 16 }}>Payment received!</h2>
              <p style={s.subtitle}>
                Thank you, {firstName}. We'll be in touch shortly with next steps.
              </p>
            </div>

            <div style={s.nextSteps}>
              <h3 style={s.nextStepsTitle}>What happens next:</h3>
              <ul style={s.nextStepsList}>
                <li>You'll receive a confirmation text and email</li>
                <li>Our team will reach out to schedule your appointment</li>
                <li>Questions? Call or text <a href="tel:9499973988" style={s.link}>(949) 997-3988</a></li>
              </ul>
            </div>

            <button onClick={onClose} style={s.submitBtn}>Done</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000, padding: 20,
  },
  modal: {
    background: '#fff', width: '100%', maxWidth: 480,
    maxHeight: '90vh', overflowY: 'auto',
    padding: '32px 28px', position: 'relative',
    borderRadius: 0, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 16,
    background: 'none', border: 'none', fontSize: 28,
    color: '#737373', cursor: 'pointer', lineHeight: 1, padding: 4,
  },
  header: { textAlign: 'center', marginBottom: 24 },
  badge: {
    display: 'inline-block', background: '#f0fdf4', color: '#16a34a',
    fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.06em', padding: '6px 14px', marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: '#171717' },
  subtitle: { fontSize: 14, color: '#525252', margin: 0 },
  row: { display: 'flex', gap: 12, marginBottom: 12 },
  half: { flex: 1 },
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 4 },
  input: {
    width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4',
    borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%', marginTop: 16, padding: 16, background: '#171717', color: '#fff',
    border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600, fontFamily: 'inherit',
  },
  backBtn: {
    background: 'none', border: 'none', color: '#737373',
    fontSize: 14, cursor: 'pointer', marginTop: 12, padding: 0, fontFamily: 'inherit',
  },
  disclaimer: {
    textAlign: 'center', fontSize: 12, color: '#a3a3a3', marginTop: 12, marginBottom: 0,
  },
  error: { color: '#dc2626', fontSize: 14, marginTop: 12 },
  errorBox: {
    background: '#fef2f2', color: '#dc2626', padding: '12px 16px',
    fontSize: 14, marginBottom: 16,
  },
  stripeWrap: {
    background: '#fafafa', border: '1px solid #e5e5e5', padding: 24,
  },
  checkCircle: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 64, height: 64, background: '#22c55e', borderRadius: '50%',
  },
  nextSteps: {
    background: '#fafafa', border: '1px solid #e5e5e5', padding: '20px 24px', marginBottom: 8,
  },
  nextStepsTitle: { fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: '#171717' },
  nextStepsList: { listStyle: 'none', padding: 0, margin: 0 },
  link: { color: '#171717', fontWeight: 600, textDecoration: 'none' },
};

// Add list item spacing via CSS-in-JS
s.nextStepsList['& li'] = { padding: '4px 0', fontSize: 14, color: '#525252' };
