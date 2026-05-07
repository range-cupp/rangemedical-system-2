import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ChevronLeft, Phone } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const ASSESSMENT_EVENT_TYPE_ID = process.env.NEXT_PUBLIC_ASSESSMENT_EVENT_TYPE_ID
  ? parseInt(process.env.NEXT_PUBLIC_ASSESSMENT_EVENT_TYPE_ID)
  : null;

// ── Shared Styles ─────────────────────────────────────────────────────────

export const styles = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  header: {
    borderBottom: '1px solid #e8e8e8',
    padding: '0 2.5rem',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { height: 48, display: 'block' },
  container: { maxWidth: 640, margin: '0 auto', padding: '0 2rem 80px' },

  label: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
    color: '#737373', textTransform: 'uppercase', marginBottom: 8,
  },
  dot: { display: 'inline-block', width: 8, height: 8, background: '#808080' },
  rule: { width: '100%', height: 1, background: '#e0e0e0', margin: '0 0 24px' },

  heroSection: { padding: '5rem 0 0' },
  headline: {
    fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 900, color: '#1a1a1a',
    lineHeight: 0.95, letterSpacing: '-0.02em', margin: '0 0 20px',
  },
  headlineSub: {
    fontSize: 17, lineHeight: 1.75, color: '#737373', margin: '0 0 32px', maxWidth: 520,
  },
  offerBox: {
    background: '#fafafa', borderLeft: '3px solid #1a1a1a',
    padding: '16px 20px', margin: '0 0 32px',
    fontSize: 15, lineHeight: 1.7, color: '#1a1a1a', fontWeight: 500,
  },

  btn: {
    width: '100%', padding: '16px 32px', background: '#1a1a1a', color: '#ffffff',
    fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
    border: 'none', cursor: 'pointer', transition: 'background 0.2s',
  },
  btnDisabled: { opacity: 0.35, cursor: 'not-allowed' },

  section: { padding: '3.5rem 0', borderBottom: '1px solid #e0e0e0' },
  body: { fontSize: 16, lineHeight: 1.75, color: '#4a4a4a', margin: '0 0 16px' },

  checkItem: {
    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '10px 0',
    fontSize: 15, lineHeight: 1.7, color: '#4a4a4a',
  },
  checkDot: {
    width: 6, height: 6, background: '#1a1a1a', borderRadius: '50%',
    marginTop: 10, flexShrink: 0,
  },

  step: { display: 'flex', gap: 24, padding: '28px 0', borderBottom: '1px solid #f0f0f0' },
  stepLast: { display: 'flex', gap: 24, padding: '28px 0' },
  stepNum: { fontSize: 32, fontWeight: 900, color: '#e0e0e0', lineHeight: 1, minWidth: 44 },
  stepTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' },
  stepDesc: { fontSize: 15, lineHeight: 1.7, color: '#737373', margin: 0 },

  faqItem: { borderBottom: '1px solid #e0e0e0' },
  faqQ: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
    padding: '20px 0', cursor: 'pointer', background: 'none', border: 'none',
    width: '100%', textAlign: 'left', fontSize: 16, fontWeight: 600, color: '#1a1a1a',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  faqA: { fontSize: 15, lineHeight: 1.7, color: '#737373', padding: '0 0 20px', margin: 0 },

  finalCta: { textAlign: 'center', padding: '4rem 0 2rem' },
  finalHeadline: {
    fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, color: '#1a1a1a',
    lineHeight: 1, letterSpacing: '-0.02em', margin: '0 0 16px',
  },
  finalSub: {
    fontSize: 16, lineHeight: 1.75, color: '#737373', margin: '0 auto 32px', maxWidth: 420,
  },

  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 700, color: '#737373', background: 'none',
    border: 'none', cursor: 'pointer', padding: 0, marginBottom: 32,
    letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'color 0.2s',
  },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
    color: '#737373', textTransform: 'uppercase', marginBottom: 8,
  },
  sectionRule: { width: '100%', height: 1, background: '#e0e0e0', marginBottom: 20 },
  formLabel: {
    display: 'block', fontSize: 12, fontWeight: 700, color: '#1a1a1a',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  input: {
    width: '100%', padding: '14px 16px', border: '1px solid #e0e0e0',
    fontSize: 16, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box',
    marginBottom: 16, WebkitAppearance: 'none',
    fontFamily: "'Inter', -apple-system, sans-serif", transition: 'border-color 0.2s',
  },
  inputRow: { display: 'flex', gap: 16 },
  divider: { borderTop: '1px solid #e0e0e0', margin: '32px 0' },
  dateGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 0, marginBottom: 24, border: '1px solid #e0e0e0',
  },
  dateBtn: {
    padding: '14px 8px', border: 'none', borderRight: '1px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer',
    textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#1a1a1a',
    transition: 'all 0.15s', fontFamily: "'Inter', -apple-system, sans-serif",
  },
  dateBtnSelected: { background: '#1a1a1a', color: '#fff' },
  timeGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 0, marginBottom: 24, border: '1px solid #e0e0e0',
  },
  timeBtn: {
    padding: '14px 8px', border: 'none', borderRight: '1px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer',
    textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#1a1a1a',
    transition: 'all 0.15s', fontFamily: "'Inter', -apple-system, sans-serif",
  },
  timeBtnSelected: { background: '#1a1a1a', color: '#fff' },
  error: { color: '#DC2626', fontSize: 14, marginTop: 8, marginBottom: 12 },
  loadingDots: { fontSize: 14, color: '#737373', textAlign: 'center', padding: 20 },

  confirmBox: { textAlign: 'center', padding: '80px 0 40px' },
  checkMark: {
    width: 64, height: 64, border: '2px solid #1a1a1a',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  confirmTitle: {
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: '#1a1a1a',
    lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 20,
  },
  confirmDetail: { fontSize: 17, color: '#737373', lineHeight: 1.75, marginBottom: 12 },
  contactLink: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#1a1a1a',
    textTransform: 'uppercase', borderBottom: '1.5px solid #1a1a1a',
    paddingBottom: 3, textDecoration: 'none', marginTop: 24,
  },
};

const s = styles;

// ── Helpers ─────────────────────────────────────────────────────────────

function getNext14Days() {
  const days = [];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  for (let i = 0; i < 14 && days.length < 7; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    if (d.getDay() !== 0) days.push(d);
  }
  return days;
}

function formatDateBtn(d) {
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles',
  });
}

function formatDateISO(d) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Los_Angeles',
  }).format(d);
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
  });
}

function formatConfirmationDate(isoString) {
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
  });
}

function filterSlotsByBuffer(slots) {
  const cutoff = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return slots.filter(slot => new Date(slot.start) > cutoff);
}

function formatPhoneDisplay(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === '1') return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone;
}

function PaymentSection({ stripeRef, elementsRef, onReady }) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    stripeRef.current = stripe;
    elementsRef.current = elements;
  }, [stripe, elements, stripeRef, elementsRef]);

  return <PaymentElement onReady={() => onReady && onReady()} options={{ layout: 'tabs' }} />;
}

// ── Booking Component ─────────────────────────────────────────────────────

export default function AssessmentBooking({ path = 'energy', onBack }) {
  const [confirmed, setConfirmed] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [utmParams, setUtmParams] = useState({});

  const [leadId, setLeadId] = useState(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [metaEventId, setMetaEventId] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  const stripeRef = useRef(null);
  const elementsRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
      const val = params.get(key);
      if (val) utm[key] = val;
    });
    if (Object.keys(utm).length > 0) setUtmParams(utm);

    if (params.get('payment_complete') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    try {
      const source = localStorage.getItem('range_roadmap_contact') || localStorage.getItem('range_start_lead');
      if (!source) return;
      const parsed = JSON.parse(source);
      if (parsed.firstName && !firstName) setFirstName(parsed.firstName);
      if (parsed.lastName && !lastName) setLastName(parsed.lastName);
      if (parsed.email && !email) setEmail(parsed.email);
      if (parsed.phone && !phone) setPhone(parsed.phone);
    } catch (e) { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          firstName: firstName.trim(), lastName: lastName.trim(),
          email: email.trim(), phone: phone.trim(),
          assessmentPath: path, ...utmParams,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      setLeadId(data.leadId);
      setLeadSubmitted(true);

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', { content_name: path });
      }
    } catch (err) {
      console.error('Lead submit error:', err);
      setLeadSubmitted(true);
    } finally {
      setLeadSubmitting(false);
    }
  }, [firstName, lastName, email, phone, path, leadSubmitted, leadSubmitting, contactComplete, utmParams]);

  useEffect(() => {
    if (!leadSubmitted && !leadSubmitting && contactComplete) {
      const timer = setTimeout(() => submitLead(), 500);
      return () => clearTimeout(timer);
    }
  }, [contactComplete, leadSubmitted, leadSubmitting, submitLead]);

  useEffect(() => {
    if (!leadSubmitted || clientSecret) return;
    const initPayment = async () => {
      try {
        const readCookie = (name) => {
          if (typeof document === 'undefined') return '';
          const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
          return match ? decodeURIComponent(match[1]) : '';
        };
        const res = await fetch('/api/assessment/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId, email: email.trim(), firstName: firstName.trim(),
            lastName: lastName.trim(), phone: phone.trim(),
            meta: { fbp: readCookie('_fbp'), fbc: readCookie('_fbc') },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Payment init failed');
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setMetaEventId(data.metaEventId || null);
      } catch (err) {
        console.error('Payment init error:', err);
        setError('Could not initialize payment. Please refresh and try again.');
      }
    };
    initPayment();
  }, [leadSubmitted, leadId, clientSecret, email, firstName, lastName, phone]);

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
          const raw = data.slots;
          const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? (raw[dateStr] || []) : []);
          setSlots(filterSlotsByBuffer(list));
        }
      } catch (err) {
        console.error('Slots fetch error:', err);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate]);

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
      const baseUrl = window.location.origin;
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${baseUrl}${window.location.pathname}?payment_complete=true` },
        redirect: 'if_required',
      });
      if (stripeError) throw new Error(stripeError.message);
      if (!paymentIntent || paymentIntent.status !== 'succeeded') throw new Error('Payment was not completed. Please try again.');

      await fetch('/api/assessment/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, paymentIntentId: paymentIntent.id }),
      });

      const bookRes = await fetch('/api/assessment/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId, eventTypeId: ASSESSMENT_EVENT_TYPE_ID, start: selectedSlot,
          patientName: `${firstName.trim()} ${lastName.trim()}`,
          patientEmail: email.trim(), patientPhone: phone.trim(),
        }),
      });
      const bookData = await bookRes.json();

      if (!bookRes.ok) {
        setError(bookData.error || 'Payment succeeded but booking failed. Please call (949) 997-3988 to schedule.');
        setSubmitting(false);
        return;
      }

      setBookingResult({ start: bookData.booking?.start || selectedSlot });
      setConfirmed(true);
      window.scrollTo(0, 0);

      window.history.pushState({}, '', '/assessment/confirmed');

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', { value: 197.00, currency: 'USD' }, metaEventId ? { eventID: metaEventId } : undefined);
      }
    } catch (err) {
      console.error('Confirm error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const availableDates = getNext14Days();

  // ── Confirmation ──
  if (confirmed) {
    return (
      <div style={s.confirmBox}>
        <div style={s.checkMark}>
          <Check size={32} color="#1a1a1a" strokeWidth={2.5} />
        </div>
        <h1 style={s.confirmTitle}>
          YOU&apos;RE ALL SET,<br />{firstName.trim().toUpperCase()}.
        </h1>
        <div style={{ width: 60, height: 1, background: '#e0e0e0', margin: '24px auto' }} />
        {bookingResult?.start && (
          <p style={s.confirmDetail}>
            Your appointment is booked for<br />
            <strong style={{ color: '#1a1a1a' }}>{formatConfirmationDate(bookingResult.start)}</strong>
          </p>
        )}
        <p style={s.confirmDetail}>Your $197 will be applied as a credit toward your treatment plan.</p>
        <p style={s.confirmDetail}>We&apos;ve sent a text to {formatPhoneDisplay(phone)} with your details.</p>
        <a href="tel:9499973988" style={s.contactLink}>
          <Phone size={14} /> (949) 997-3988
        </a>
      </div>
    );
  }

  // ── Booking Form ──
  return (
    <div style={{ paddingTop: 40 }}>
      {onBack && (
        <button
          style={s.backBtn}
          onClick={onBack}
          onMouseEnter={e => { e.currentTarget.style.color = '#1a1a1a'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#737373'; }}
        >
          <ChevronLeft size={14} /> BACK
        </button>
      )}

      <div style={s.label}>
        <span style={s.dot} /> BOOK YOUR ASSESSMENT
      </div>
      <h2 style={{ ...s.headline, fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 12 }}>
        ALMOST THERE.
      </h2>
      <div style={s.rule} />

      <div style={{ marginTop: 32 }}>
        <div style={s.sectionLabel}>
          <span style={s.dot} /> CONTACT INFORMATION
        </div>
        <div style={s.sectionRule} />

        <div style={s.inputRow}>
          <div style={{ flex: 1 }}>
            <label style={s.formLabel}>First Name</label>
            <input
              style={s.input} type="text" value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="First name" autoComplete="given-name"
              onFocus={e => { e.currentTarget.style.borderColor = '#1a1a1a'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={s.formLabel}>Last Name</label>
            <input
              style={s.input} type="text" value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Last name" autoComplete="family-name"
              onFocus={e => { e.currentTarget.style.borderColor = '#1a1a1a'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
            />
          </div>
        </div>

        <label style={s.formLabel}>Email</label>
        <input
          style={s.input} type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" autoComplete="email"
          onFocus={e => { e.currentTarget.style.borderColor = '#1a1a1a'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
        />

        <label style={s.formLabel}>Phone</label>
        <input
          style={s.input} type="tel" value={phone}
          onChange={e => setPhone(e.target.value)}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e0e0e0';
            if (contactComplete && !leadSubmitted) submitLead();
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#1a1a1a'; }}
          placeholder="(555) 555-5555" autoComplete="tel"
        />

        {leadSubmitting && <div style={s.loadingDots}>Saving your info...</div>}
      </div>

      <div style={s.divider} />

      <div style={s.sectionLabel}>
        <span style={s.dot} /> PAYMENT
      </div>
      <div style={s.sectionRule} />

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
                  borderRadius: '0px',
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  colorPrimary: '#1a1a1a',
                },
                rules: {
                  '.Input': { borderColor: '#e0e0e0', borderRadius: '0px' },
                  '.Input:focus': { borderColor: '#1a1a1a', boxShadow: 'none' },
                  '.Tab': { borderRadius: '0px' },
                  '.Tab--selected': { borderColor: '#1a1a1a' },
                },
              },
            }}
          >
            <PaymentSection stripeRef={stripeRef} elementsRef={elementsRef} onReady={() => setPaymentReady(true)} />
          </Elements>
        </div>
      )}

      <div style={s.divider} />

      <div style={s.sectionLabel}>
        <span style={s.dot} /> PICK YOUR TIME
      </div>
      <div style={s.sectionRule} />

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
                <button key={iso} style={{ ...s.dateBtn, ...(isSelected ? s.dateBtnSelected : {}) }} onClick={() => setSelectedDate(d)}>
                  {formatDateBtn(d)}
                </button>
              );
            })}
          </div>

          {slotsLoading && <div style={s.loadingDots}>Loading available times...</div>}
          {selectedDate && !slotsLoading && slots.length === 0 && (
            <div style={s.loadingDots}>No available times on this date. Please select another day.</div>
          )}
          {slots.length > 0 && (
            <div style={s.timeGrid}>
              {slots.map(slot => {
                const isSelected = selectedSlot === slot.start;
                return (
                  <button key={slot.start} style={{ ...s.timeBtn, ...(isSelected ? s.timeBtnSelected : {}) }} onClick={() => setSelectedSlot(slot.start)}>
                    {formatTime(slot.start)}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      <div style={s.divider} />

      {error && <div style={s.error}>{error}</div>}

      <button
        style={{ ...s.btn, ...(canConfirm ? {} : s.btnDisabled) }}
        disabled={!canConfirm}
        onClick={handleConfirm}
        onMouseEnter={e => { if (canConfirm) e.currentTarget.style.background = '#404040'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; }}
      >
        {submitting ? 'PROCESSING...' : 'CONFIRM & PAY — $197'}
      </button>
    </div>
  );
}
