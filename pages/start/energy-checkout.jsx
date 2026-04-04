// pages/start/energy-checkout.jsx
// Energy panel checkout: contact info → Stripe payment → book lab draw
// Reached from /start/energy after clicking a panel

import Layout from '../../components/Layout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const ASSESSMENT_EVENT_TYPE_ID = process.env.NEXT_PUBLIC_ASSESSMENT_EVENT_TYPE_ID;

const PANEL_INFO = {
  essential: { name: 'Essential Panel', basePrice: 350, discountedPrice: 350 },
  elite: { name: 'Elite Panel', basePrice: 750, discountedPrice: 750 },
};

// Stripe payment form (must be inside <Elements>)
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
        confirmParams: { return_url: `${window.location.origin}/start/energy-checkout?payment_complete=true` },
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
          width: '100%', marginTop: 20, padding: 16, background: '#171717', color: '#fff',
          border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600,
          cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.6 : 1,
          fontFamily: 'inherit',
        }}
      >
        {processing ? 'Processing...' : 'Complete Payment'}
      </button>
    </form>
  );
}

export default function EnergyCheckout() {
  const router = useRouter();
  const { panel: panelParam } = router.query;
  const panel = PANEL_INFO[panelParam] ? panelParam : null;
  const panelInfo = panel ? PANEL_INFO[panel] : null;

  // Steps: contact → payment → booking → done
  const [step, setStep] = useState('contact'); // contact | payment | booking | done
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Contact
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referredBy, setReferredBy] = useState('');

  // Payment
  const [clientSecret, setClientSecret] = useState(null);
  const [leadId, setLeadId] = useState(null);

  // Booking
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // Pre-fill from localStorage if they came through /start
  useEffect(() => {
    try {
      const saved = localStorage.getItem('range_start_lead');
      if (saved) {
        const lead = JSON.parse(saved);
        if (lead.firstName) setFirstName(lead.firstName);
        if (lead.lastName) setLastName(lead.lastName);
        if (lead.email) setEmail(lead.email);
        if (lead.phone) setPhone(lead.phone);
      }
    } catch (e) {}
  }, []);

  // Invalid panel
  if (router.isReady && !panelInfo) {
    return (
      <Layout title="Choose a Panel | Range Medical">
        <div style={{ textAlign: 'center', padding: '120px 20px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Please choose a panel first</h1>
          <p style={{ color: '#737373', marginTop: 8 }}>
            <a href="/range-assessment" style={{ color: '#171717', fontWeight: 600 }}>Go back to Range Assessment</a>
          </p>
        </div>
      </Layout>
    );
  }

  if (!panelInfo) {
    return <Layout title="Loading... | Range Medical"><div style={{ textAlign: 'center', padding: '120px 20px' }}><p style={{ color: '#737373' }}>Loading...</p></div></Layout>;
  }

  // Step 1: Contact info submission
  const handleContactSubmit = async () => {
    if (!firstName || !lastName || !email || !phone) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      // Create start lead + patient
      const startRes = await fetch('/api/start/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, email, phone,
          path: 'energy',
          mainConcern: `Selected ${panelInfo.name}`,
          urgency: 7,
          hasRecentLabs: false,
          consentSms: true,
          referredBy: referredBy || null,
        }),
      });
      const startData = await startRes.json();

      // Save to localStorage
      localStorage.setItem('range_start_lead', JSON.stringify({
        firstName, lastName, email, phone,
        path: 'energy', panel,
        leadId: startData.leadId || null,
      }));

      // Create payment intent
      const payRes = await fetch('/api/assessment/energy-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: startData.leadId || null,
          email, firstName, lastName, phone,
          panelType: panel,
        }),
      });
      const payData = await payRes.json();

      if (payData.clientSecret) {
        setClientSecret(payData.clientSecret);
        setLeadId(startData.leadId || null);
        setStep('payment');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error('Could not initialize payment');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Payment success
  const handlePaymentSuccess = async (paymentIntentId) => {
    // Confirm payment on backend
    try {
      await fetch('/api/assessment/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, paymentIntentId }),
      });
    } catch (e) {
      console.error('Payment confirmation error:', e);
    }
    setStep('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Booking helpers
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i < 22 && dates.length < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() !== 0) dates.push(d);
    }
    return dates;
  };

  const fetchSlots = async (dateStr) => {
    if (!ASSESSMENT_EVENT_TYPE_ID) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/bookings/slots?eventTypeId=${ASSESSMENT_EVENT_TYPE_ID}&date=${dateStr}`);
      const data = await res.json();
      if (data.success && data.slots) {
        const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const filtered = {};
        Object.entries(data.slots).forEach(([dateKey, dateSlots]) => {
          const valid = dateSlots.filter(s => new Date(s.start) >= twoHoursFromNow);
          if (valid.length > 0) filtered[dateKey] = valid;
        });
        setAvailableSlots(filtered);
      } else {
        setAvailableSlots({});
      }
    } catch (err) {
      setAvailableSlots({});
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateClick = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    fetchSlots(dateStr);
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    setIsBooking(true);
    setError('');
    try {
      const res = await fetch('/api/assessment/energy-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          eventTypeId: ASSESSMENT_EVENT_TYPE_ID,
          start: selectedSlot.start,
          patientName: `${firstName} ${lastName}`,
          patientEmail: email,
          patientPhone: phone,
          panelType: panel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setBookingResult(data.booking);
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Could not book. Please call (949) 997-3988.');
    } finally {
      setIsBooking(false);
    }
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <Layout title={`${panelInfo.name} — Checkout | Range Medical`}>
      <Head><meta name="robots" content="noindex, nofollow" /></Head>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '72px 20px 80px', color: '#171717' }}>

        {/* ── STEP: CONTACT ── */}
        {step === 'contact' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <span style={{ display: 'inline-block', background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 14px', borderRadius: 0, marginBottom: 12 }}>
                {panelInfo.name}
              </span>
              <h1 style={{ fontSize: 30, fontWeight: 700, margin: '0 0 8px' }}>Enter your info to get started</h1>
              <p style={{ fontSize: 16, color: '#525252', margin: 0 }}>
                Your {panelInfo.name} includes blood work, a 1:1 provider review, and a personalized written plan.
              </p>
            </div>

            {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 0, fontSize: 14, marginBottom: 16 }}>{error}</div>}

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
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 4 }}>Phone *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(949) 555-1234" style={{ width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 4 }}>Who referred you? <span style={{ fontWeight: 400, color: '#a3a3a3' }}>(optional)</span></label>
              <input type="text" value={referredBy} onChange={e => setReferredBy(e.target.value)} placeholder="Name of person or provider" style={{ width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <button
              onClick={handleContactSubmit}
              disabled={submitting}
              style={{
                width: '100%', padding: 16, background: '#171717', color: '#fff',
                border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              {submitting ? 'Setting up...' : `Continue to Payment — $${panelInfo.discountedPrice}`}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#a3a3a3', marginTop: 12 }}>
              By continuing, you agree to receive texts from Range Medical. Reply STOP to opt out.
            </p>
          </>
        )}

        {/* ── STEP: PAYMENT ── */}
        {step === 'payment' && clientSecret && stripePromise && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <span style={{ display: 'inline-block', background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 14px', borderRadius: 0, marginBottom: 12 }}>
                {panelInfo.name} — ${panelInfo.basePrice}
              </span>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Payment</h1>
              <p style={{ fontSize: 15, color: '#525252', margin: 0 }}>
                Secure checkout for your {panelInfo.name}.
              </p>
            </div>

            <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 0, padding: '24px' }}>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <CheckoutForm onSuccess={handlePaymentSuccess} />
              </Elements>
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#a3a3a3', marginTop: 16 }}>
              Your payment is secure. This includes labs, provider review, and your written plan.
            </p>
          </>
        )}

        {/* ── STEP: BOOK LAB DRAW ── */}
        {step === 'booking' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: '#22c55e', borderRadius: '50%', marginBottom: 16 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Payment received!</h1>
              <p style={{ fontSize: 15, color: '#525252', margin: 0 }}>
                Now pick a time for your blood draw.
              </p>
            </div>

            {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 0, fontSize: 14, marginBottom: 16 }}>{error}</div>}

            <p style={{ fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Select a date</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {getAvailableDates().map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const isActive = selectedDate === dateStr;
                return (
                  <button key={dateStr} onClick={() => handleDateClick(date)} style={{
                    padding: '10px 14px', border: isActive ? '2px solid #171717' : '1px solid #d4d4d4',
                    borderRadius: 0, background: isActive ? '#171717' : '#fff', color: isActive ? '#fff' : '#171717',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {formatDate(date)}
                  </button>
                );
              })}
            </div>

            {slotsLoading && <p style={{ textAlign: 'center', color: '#737373', fontSize: 14, padding: '16px 0' }}>Loading times...</p>}

            {selectedDate && !slotsLoading && (
              Object.keys(availableSlots).length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 20 }}>
                  {Object.values(availableSlots).flat().map((slot, i) => {
                    const isActive = selectedSlot?.start === slot.start;
                    return (
                      <button key={i} onClick={() => setSelectedSlot(slot)} style={{
                        padding: 10, border: isActive ? '2px solid #171717' : '1px solid #d4d4d4',
                        borderRadius: 0, background: isActive ? '#171717' : '#fff', color: isActive ? '#fff' : '#171717',
                        fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                      }}>
                        {formatTime(slot.start)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#737373', fontSize: 14, padding: '12px 0' }}>No times available on this date. Try another day.</p>
              )
            )}

            {selectedSlot && (
              <button onClick={handleBookSlot} disabled={isBooking} style={{
                width: '100%', padding: 16, background: '#171717', color: '#fff',
                border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600,
                cursor: isBooking ? 'not-allowed' : 'pointer', opacity: isBooking ? 0.6 : 1,
                fontFamily: 'inherit',
              }}>
                {isBooking ? 'Booking...' : `Confirm Blood Draw — ${formatTime(selectedSlot.start)}`}
              </button>
            )}

            <p style={{ textAlign: 'center', fontSize: 14, color: '#737373', marginTop: 16 }}>
              Or call/text <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600, textDecoration: 'none' }}>(949) 997-3988</a> to book
            </p>
          </>
        )}

        {/* ── STEP: DONE ── */}
        {step === 'done' && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, background: '#22c55e', borderRadius: '50%', marginBottom: 20 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 700, margin: '0 0 8px' }}>You're all set, {firstName}!</h1>
              <p style={{ fontSize: 16, color: '#525252', margin: '0 0 32px', lineHeight: 1.6 }}>
                Your {panelInfo.name} is paid and your blood draw is booked. We'll text you everything you need.
              </p>
            </div>

            <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 0, padding: 28, marginBottom: 24 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 16px' }}>What to expect:</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>✓ We'll text you lab prep instructions and what to expect</li>
                <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>✓ You'll receive a medical intake form to complete before your visit</li>
                <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>✓ Fast for 10-12 hours before your blood draw (water is fine)</li>
                <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>✓ Results are typically ready in 5-7 business days</li>
                <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>✓ We'll schedule your 1:1 provider review once results are back</li>
              </ul>
            </div>

            <p style={{ textAlign: 'center', fontSize: 14, color: '#737373' }}>
              Questions? Call/text <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600, textDecoration: 'none' }}>(949) 997-3988</a>
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}
