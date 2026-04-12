import Head from 'next/head';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Zap, Shield, Check, ChevronLeft, Phone } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const ASSESSMENT_EVENT_TYPE_ID = process.env.NEXT_PUBLIC_ASSESSMENT_EVENT_TYPE_ID
  ? parseInt(process.env.NEXT_PUBLIC_ASSESSMENT_EVENT_TYPE_ID)
  : null;

const VIDEO_URLS = {
  injury: 'https://sixcoo3swhy8bu1g.public.blob.vercel-storage.com/vsl/injury-assessment.mp4',
  energy: 'https://sixcoo3swhy8bu1g.public.blob.vercel-storage.com/vsl/energy-assessment.mp4',
  both: 'https://sixcoo3swhy8bu1g.public.blob.vercel-storage.com/vsl/energy-assessment.mp4',
};

const PATH_COPY = {
  injury: 'Whether you are recovering from surgery, dealing with chronic pain, or trying to get back to full strength, we build a plan around your body and your goals.',
  energy: 'Fatigue, weight gain, brain fog, low drive. These are not things you just live with. We find the root cause and fix it.',
  both: 'From injury recovery to hormone optimization, we take a full-spectrum approach to get you feeling and performing at your best.',
};

// ── Styles ──────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh',
    background: '#FAFAFA',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  container: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '40px 20px 60px',
  },
  logo: {
    textAlign: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: '0.15em',
    color: '#1a1a1a',
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 26,
    fontWeight: 700,
    color: '#171717',
    textAlign: 'center',
    lineHeight: 1.3,
    marginBottom: 32,
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: 12,
    padding: '24px 20px',
    marginBottom: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: '#F5F5F5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: '#171717',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: '#737373',
    lineHeight: 1.4,
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 14,
    color: '#737373',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    marginBottom: 24,
  },
  video: {
    width: '100%',
    borderRadius: 12,
    background: '#000',
    marginBottom: 24,
  },
  copy: {
    fontSize: 16,
    color: '#525252',
    lineHeight: 1.6,
    marginBottom: 24,
  },
  price: {
    fontSize: 15,
    color: '#171717',
    fontWeight: 500,
    marginBottom: 28,
    background: '#F5F5F5',
    padding: '14px 18px',
    borderRadius: 10,
  },
  btn: {
    width: '100%',
    padding: '16px 32px',
    background: '#171717',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  btnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#737373',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: '#171717',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '14px',
    border: '1px solid #DDD',
    borderRadius: 8,
    fontSize: 16,
    color: '#171717',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 14,
    WebkitAppearance: 'none',
  },
  inputRow: {
    display: 'flex',
    gap: 12,
  },
  divider: {
    borderTop: '1px solid #E5E5E5',
    margin: '28px 0',
  },
  dateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 8,
    marginBottom: 20,
  },
  dateBtn: {
    padding: '12px 8px',
    border: '1px solid #DDD',
    borderRadius: 8,
    background: '#FFF',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 500,
    color: '#171717',
    transition: 'all 0.15s',
  },
  dateBtnSelected: {
    background: '#171717',
    color: '#FFF',
    borderColor: '#171717',
  },
  timeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 20,
  },
  timeBtn: {
    padding: '12px 8px',
    border: '1px solid #DDD',
    borderRadius: 8,
    background: '#FFF',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 500,
    color: '#171717',
    transition: 'all 0.15s',
  },
  timeBtnSelected: {
    background: '#171717',
    color: '#FFF',
    borderColor: '#171717',
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  confirmBox: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: '#F0FDF4',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  confirmTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#171717',
    marginBottom: 12,
  },
  confirmDetail: {
    fontSize: 16,
    color: '#525252',
    lineHeight: 1.6,
    marginBottom: 12,
  },
  loadingDots: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
    padding: 20,
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function getNext14Days() {
  const days = [];
  const now = new Date();
  // Start from tomorrow
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  for (let i = 0; i < 21 && days.length < 14; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    if (d.getDay() !== 0) { // Skip Sundays
      days.push(d);
    }
  }
  return days;
}

function formatDateBtn(d) {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
}

function formatDateISO(d) {
  // Format as YYYY-MM-DD in Pacific time
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Los_Angeles',
  });
  return formatter.format(d);
}

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  });
}

function formatConfirmationDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  });
}

function filterSlotsByBuffer(slots) {
  const now = new Date();
  const bufferMs = 2 * 60 * 60 * 1000; // 2 hours
  const cutoff = new Date(now.getTime() + bufferMs);
  return slots.filter(slot => new Date(slot.time) > cutoff);
}

function formatPhoneDisplay(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

// ── Payment Section (must be inside Elements provider) ──────────────────────

function PaymentSection({ stripeRef, elementsRef, onReady }) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    stripeRef.current = stripe;
    elementsRef.current = elements;
  }, [stripe, elements, stripeRef, elementsRef]);

  return (
    <PaymentElement
      onReady={() => onReady && onReady()}
      options={{
        layout: 'tabs',
      }}
    />
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function Assessment() {
  // Flow state
  const [screen, setScreen] = useState(1);
  const [selectedPath, setSelectedPath] = useState(null);

  // Contact info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Lead + payment
  const [leadId, setLeadId] = useState(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  // Scheduling
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Confirmation
  const [bookingResult, setBookingResult] = useState(null);

  // Stripe refs
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);

  // Restore path from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('assessment_path');
      if (saved && ['injury', 'energy', 'both'].includes(saved)) {
        setSelectedPath(saved);
      }
    } catch (e) {
      // localStorage not available
    }
  }, []);

  // Handle Stripe redirect return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_complete') === 'true') {
      // Payment completed via redirect — clean up URL
      window.history.replaceState({}, '', '/assessment');
    }
  }, []);

  // ── Screen 1: Path Selection ──────────────────────────────────────────────

  const handlePathSelect = (path) => {
    setSelectedPath(path);
    try {
      localStorage.setItem('assessment_path', path);
    } catch (e) {
      // ignore
    }
    setScreen(2);
  };

  // ── Screen 3: Lead submission ─────────────────────────────────────────────

  const contactComplete = firstName.trim() && lastName.trim() && email.trim() && phone.trim();

  const submitLead = useCallback(async () => {
    if (leadSubmitted || leadSubmitting || !contactComplete) return;

    setLeadSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          assessmentPath: selectedPath,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      setLeadId(data.leadId);
      setLeadSubmitted(true);
    } catch (err) {
      console.error('Lead submit error:', err);
      // Don't block the user — they can still fill payment
      setLeadSubmitted(true);
    } finally {
      setLeadSubmitting(false);
    }
  }, [firstName, lastName, email, phone, selectedPath, leadSubmitted, leadSubmitting, contactComplete]);

  // Initialize payment once lead is submitted
  useEffect(() => {
    if (!leadSubmitted || clientSecret) return;

    const initPayment = async () => {
      try {
        const res = await fetch('/api/assessment/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            email: email.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Payment init failed');

        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (err) {
        console.error('Payment init error:', err);
        setError('Could not initialize payment. Please refresh and try again.');
      }
    };

    initPayment();
  }, [leadSubmitted, leadId, clientSecret, email, firstName, lastName, phone]);

  // Fetch slots when date is selected
  useEffect(() => {
    if (!selectedDate || !ASSESSMENT_EVENT_TYPE_ID) return;

    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSlots([]);
      setSelectedSlot(null);

      try {
        const dateStr = formatDateISO(selectedDate);
        const res = await fetch(`/api/bookings/slots?eventTypeId=${ASSESSMENT_EVENT_TYPE_ID}&date=${dateStr}`);
        const data = await res.json();

        if (data.success && data.slots) {
          const filtered = filterSlotsByBuffer(data.slots);
          setSlots(filtered);
        }
      } catch (err) {
        console.error('Slots fetch error:', err);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate]);

  // ── Screen 3: Confirm & Pay ───────────────────────────────────────────────

  const canConfirm = contactComplete && paymentReady && selectedSlot && !submitting;

  const handleConfirm = async () => {
    if (!canConfirm) return;

    const stripe = stripeRef.current;
    const elements = elementsRef.current;

    if (!stripe || !elements) {
      setError('Payment not ready. Please wait a moment and try again.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Process payment
      const baseUrl = window.location.origin;
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${baseUrl}/assessment?payment_complete=true` },
        redirect: 'if_required',
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error('Payment was not completed. Please try again.');
      }

      // 2. Confirm payment on backend
      await fetch('/api/assessment/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          paymentIntentId: paymentIntent.id,
        }),
      });

      // 3. Book the appointment
      const bookRes = await fetch('/api/assessment/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          eventTypeId: ASSESSMENT_EVENT_TYPE_ID,
          start: selectedSlot,
          patientName: `${firstName.trim()} ${lastName.trim()}`,
          patientEmail: email.trim(),
          patientPhone: phone.trim(),
        }),
      });

      const bookData = await bookRes.json();

      if (!bookRes.ok) {
        // Payment succeeded but booking failed — show a message with the phone number
        setError(bookData.error || 'Payment succeeded but booking failed. Please call (949) 997-3988 to schedule.');
        setSubmitting(false);
        return;
      }

      setBookingResult({
        start: bookData.booking?.start || selectedSlot,
      });
      setScreen(4);
    } catch (err) {
      console.error('Confirm error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const availableDates = getNext14Days();

  return (
    <>
      <Head>
        <title>Range Assessment | Range Medical</title>
        <meta name="description" content="Book your in-clinic Range Assessment. Personalized treatment plan for injury recovery, hormone optimization, and full-spectrum health." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={s.page}>
        <div style={s.container}>

          {/* Logo */}
          <div style={s.logo}>
            <span style={s.logoText}>RANGE MEDICAL</span>
          </div>

          {/* ── Screen 1: Path Selection ──────────────────────────────── */}
          {screen === 1 && (
            <>
              <h1 style={s.headline}>What do you want the most help with right now?</h1>

              <div
                style={s.card}
                onClick={() => handlePathSelect('injury')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#171717'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5E5'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={s.cardIcon}>
                  <Activity size={22} color="#171717" />
                </div>
                <div>
                  <div style={s.cardTitle}>Injury & Recovery</div>
                  <div style={s.cardSub}>Pain, healing, post-surgery recovery</div>
                </div>
              </div>

              <div
                style={s.card}
                onClick={() => handlePathSelect('energy')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#171717'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5E5'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={s.cardIcon}>
                  <Zap size={22} color="#171717" />
                </div>
                <div>
                  <div style={s.cardTitle}>Energy, Hormones & Weight</div>
                  <div style={s.cardSub}>Fatigue, weight gain, brain fog, low drive</div>
                </div>
              </div>

              <div
                style={s.card}
                onClick={() => handlePathSelect('both')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#171717'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5E5'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={s.cardIcon}>
                  <Shield size={22} color="#171717" />
                </div>
                <div>
                  <div style={s.cardTitle}>Both</div>
                  <div style={s.cardSub}>Full-spectrum health optimization</div>
                </div>
              </div>
            </>
          )}

          {/* ── Screen 2: VSL + Offer ─────────────────────────────────── */}
          {screen === 2 && selectedPath && (
            <>
              <button style={s.backBtn} onClick={() => setScreen(1)}>
                <ChevronLeft size={16} /> Back
              </button>

              <video
                style={s.video}
                controls
                playsInline
                preload="metadata"
                src={VIDEO_URLS[selectedPath]}
              />

              <p style={s.copy}>{PATH_COPY[selectedPath]}</p>

              <div style={s.price}>
                <strong>$197</strong> — applied as credit toward your first treatment or lab package
              </div>

              <button
                style={s.btn}
                onClick={() => setScreen(3)}
                onMouseEnter={e => { e.currentTarget.style.background = '#000'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#171717'; }}
              >
                Book My Assessment — $197
              </button>
            </>
          )}

          {/* ── Screen 3: Contact + Payment + Scheduling ──────────────── */}
          {screen === 3 && selectedPath && (
            <>
              <button style={s.backBtn} onClick={() => setScreen(2)}>
                <ChevronLeft size={16} /> Back
              </button>

              <h2 style={{ ...s.headline, fontSize: 22, marginBottom: 28 }}>Complete Your Booking</h2>

              {/* Section A: Contact Info */}
              <div style={s.sectionTitle}>Contact Information</div>

              <div style={s.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>First Name</label>
                  <input
                    style={s.input}
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Last Name</label>
                  <input
                    style={s.input}
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <label style={s.label}>Email</label>
              <input
                style={s.input}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <label style={s.label}>Phone</label>
              <input
                style={s.input}
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onBlur={() => {
                  if (contactComplete && !leadSubmitted) {
                    submitLead();
                  }
                }}
                placeholder="(555) 555-5555"
                autoComplete="tel"
              />

              {leadSubmitting && (
                <div style={s.loadingDots}>Saving your info...</div>
              )}

              <div style={s.divider} />

              {/* Section B: Payment */}
              <div style={s.sectionTitle}>Payment</div>

              {!leadSubmitted && !clientSecret && (
                <div style={{ ...s.loadingDots, padding: '20px 0' }}>
                  Fill in your contact details above to continue
                </div>
              )}

              {leadSubmitted && !clientSecret && (
                <div style={s.loadingDots}>Loading payment form...</div>
              )}

              {clientSecret && stripePromise && (
                <div style={{ marginBottom: 8 }}>
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          borderRadius: '8px',
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        },
                      },
                    }}
                  >
                    <PaymentSection
                      stripeRef={stripeRef}
                      elementsRef={elementsRef}
                      onReady={() => setPaymentReady(true)}
                    />
                  </Elements>
                </div>
              )}

              <div style={s.divider} />

              {/* Section C: Pick Your Time */}
              <div style={s.sectionTitle}>Pick Your Time</div>

              {!ASSESSMENT_EVENT_TYPE_ID && (
                <div style={s.loadingDots}>Scheduling not available. Please call (949) 997-3988.</div>
              )}

              {ASSESSMENT_EVENT_TYPE_ID && (
                <>
                  <div style={s.dateGrid}>
                    {availableDates.map(d => {
                      const iso = formatDateISO(d);
                      const isSelected = selectedDate && formatDateISO(selectedDate) === iso;
                      return (
                        <button
                          key={iso}
                          style={{
                            ...s.dateBtn,
                            ...(isSelected ? s.dateBtnSelected : {}),
                          }}
                          onClick={() => setSelectedDate(d)}
                        >
                          {formatDateBtn(d)}
                        </button>
                      );
                    })}
                  </div>

                  {slotsLoading && (
                    <div style={s.loadingDots}>Loading available times...</div>
                  )}

                  {selectedDate && !slotsLoading && slots.length === 0 && (
                    <div style={s.loadingDots}>No available times on this date. Please select another day.</div>
                  )}

                  {slots.length > 0 && (
                    <div style={s.timeGrid}>
                      {slots.map(slot => {
                        const isSelected = selectedSlot === slot.time;
                        return (
                          <button
                            key={slot.time}
                            style={{
                              ...s.timeBtn,
                              ...(isSelected ? s.timeBtnSelected : {}),
                            }}
                            onClick={() => setSelectedSlot(slot.time)}
                          >
                            {formatTime(slot.time)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              <div style={s.divider} />

              {/* Section D: Confirm */}
              {error && <div style={s.error}>{error}</div>}

              <button
                style={{
                  ...s.btn,
                  ...(canConfirm ? {} : s.btnDisabled),
                }}
                disabled={!canConfirm}
                onClick={handleConfirm}
              >
                {submitting ? 'Processing...' : 'Confirm & Pay — $197'}
              </button>
            </>
          )}

          {/* ── Screen 4: Confirmation ────────────────────────────────── */}
          {screen === 4 && (
            <div style={s.confirmBox}>
              <div style={s.checkCircle}>
                <Check size={36} color="#16A34A" />
              </div>

              <h1 style={s.confirmTitle}>
                You're All Set, {firstName.trim()}!
              </h1>

              {bookingResult?.start && (
                <p style={s.confirmDetail}>
                  Your appointment is booked for<br />
                  <strong>{formatConfirmationDate(bookingResult.start)}</strong>
                </p>
              )}

              <p style={s.confirmDetail}>
                Your $197 will be applied as a credit toward your treatment plan.
              </p>

              <p style={{ ...s.confirmDetail, marginBottom: 32 }}>
                We've sent a text to {formatPhoneDisplay(phone)} with your appointment details.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#737373', fontSize: 15 }}>
                <Phone size={16} />
                <span>Questions? <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600, textDecoration: 'none' }}>(949) 997-3988</a></span>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
