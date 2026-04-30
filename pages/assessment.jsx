import Head from 'next/head';
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

// ── v2 Styles ──────────────────────────────────────────────────────────────

const s = {
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
    padding: '5rem 0 3.5rem',
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
    background: '#808080',
  },
  headline: {
    fontSize: 'clamp(2rem, 5vw, 2.75rem)',
    fontWeight: 900,
    color: '#1a1a1a',
    lineHeight: 0.95,
    letterSpacing: '-0.02em',
    margin: '0 0 20px',
  },
  headlineSub: {
    fontSize: 17,
    lineHeight: 1.75,
    color: '#737373',
    margin: '0 0 40px',
    maxWidth: 480,
  },
  rule: {
    width: '100%',
    height: 1,
    background: '#e0e0e0',
    margin: '0 0 24px',
  },
  // Path cards — v2 editorial style
  pathGrid: {
    borderTop: '1px solid #e0e0e0',
  },
  pathCard: {
    padding: '2.5rem 0',
    borderBottom: '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'padding-left 0.2s',
  },
  pathNumber: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#808080',
    letterSpacing: '0.05em',
    marginBottom: 12,
  },
  pathTitle: {
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    color: '#1a1a1a',
    margin: '0 0 10px',
  },
  pathSub: {
    fontSize: 15,
    lineHeight: 1.7,
    color: '#737373',
    margin: 0,
  },
  pathBtn: {
    display: 'inline-block',
    marginTop: 20,
    padding: '12px 24px',
    background: '#1a1a1a',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  // Back button
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    color: '#737373',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    marginBottom: 32,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    transition: 'color 0.2s',
  },
  // VSL screen
  video: {
    width: '100%',
    background: '#000',
    marginBottom: 32,
  },
  copy: {
    fontSize: 17,
    color: '#737373',
    lineHeight: 1.75,
    marginBottom: 28,
  },
  price: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: 500,
    marginBottom: 32,
    background: '#fafafa',
    padding: '16px 20px',
    borderLeft: '3px solid #1a1a1a',
  },
  // CTA button — v2 style
  btn: {
    width: '100%',
    padding: '16px 32px',
    background: '#1a1a1a',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  btnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  // Section labels
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#737373',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionRule: {
    width: '100%',
    height: 1,
    background: '#e0e0e0',
    marginBottom: 20,
  },
  // Form inputs
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #e0e0e0',
    fontSize: 16,
    color: '#1a1a1a',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 16,
    WebkitAppearance: 'none',
    fontFamily: "'Inter', -apple-system, sans-serif",
    transition: 'border-color 0.2s',
  },
  inputRow: {
    display: 'flex',
    gap: 16,
  },
  divider: {
    borderTop: '1px solid #e0e0e0',
    margin: '32px 0',
  },
  // Date + time grids
  dateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 0,
    marginBottom: 24,
    border: '1px solid #e0e0e0',
  },
  dateBtn: {
    padding: '14px 8px',
    border: 'none',
    borderRight: '1px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: '#1a1a1a',
    transition: 'all 0.15s',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  dateBtnSelected: {
    background: '#1a1a1a',
    color: '#fff',
  },
  timeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 0,
    marginBottom: 24,
    border: '1px solid #e0e0e0',
  },
  timeBtn: {
    padding: '14px 8px',
    border: 'none',
    borderRight: '1px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a1a',
    transition: 'all 0.15s',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  timeBtnSelected: {
    background: '#1a1a1a',
    color: '#fff',
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  // Confirmation — v2
  confirmBox: {
    textAlign: 'center',
    padding: '80px 0 40px',
  },
  checkMark: {
    width: 64,
    height: 64,
    border: '2px solid #1a1a1a',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  confirmTitle: {
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
    fontWeight: 900,
    color: '#1a1a1a',
    lineHeight: 0.95,
    letterSpacing: '-0.02em',
    marginBottom: 20,
  },
  confirmDetail: {
    fontSize: 17,
    color: '#737373',
    lineHeight: 1.75,
    marginBottom: 12,
  },
  loadingDots: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
    padding: 20,
  },
  contactLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#1a1a1a',
    textTransform: 'uppercase',
    borderBottom: '1.5px solid #1a1a1a',
    paddingBottom: 3,
    textDecoration: 'none',
    marginTop: 24,
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function getNext14Days() {
  const days = [];
  const now = new Date();
  // Start from tomorrow
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  for (let i = 0; i < 14 && days.length < 7; i++) {
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
  const bufferMs = 2 * 60 * 60 * 1000;
  const cutoff = new Date(now.getTime() + bufferMs);
  return slots.filter(slot => new Date(slot.start) > cutoff);
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

  // UTM tracking
  const [utmParams, setUtmParams] = useState({});

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

  // Check for ?path= query param (deep link from home page) or restore from localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathParam = params.get('path');
    if (pathParam && ['injury', 'energy', 'both'].includes(pathParam)) {
      setSelectedPath(pathParam);
      setScreen(2);
      try { localStorage.setItem('assessment_path', pathParam); } catch (e) {}
      return;
    }
    try {
      const saved = localStorage.getItem('assessment_path');
      if (saved && ['injury', 'energy', 'both'].includes(saved)) {
        setSelectedPath(saved);
      }
    } catch (e) {
      // localStorage not available
    }
  }, []);

  // Capture UTM parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
      const val = params.get(key);
      if (val) utm[key] = val;
    });
    if (Object.keys(utm).length > 0) setUtmParams(utm);

    // Handle Stripe redirect return
    if (params.get('payment_complete') === 'true') {
      window.history.replaceState({}, '', '/assessment');
    }
  }, []);

  // Pre-fill contact info from /roadmap or /start funnels — no double-entry
  useEffect(() => {
    try {
      const roadmapContact = localStorage.getItem('range_roadmap_contact');
      const startLead = localStorage.getItem('range_start_lead');
      const source = roadmapContact || startLead;
      if (!source) return;
      const parsed = JSON.parse(source);
      if (parsed.firstName && !firstName) setFirstName(parsed.firstName);
      if (parsed.lastName && !lastName) setLastName(parsed.lastName);
      if (parsed.email && !email) setEmail(parsed.email);
      if (parsed.phone && !phone) setPhone(parsed.phone);
    } catch (e) {
      // localStorage unavailable or malformed — ignore
    }
    // Run once on mount — intentionally omit deps so we don't overwrite user edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          ...utmParams,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      setLeadId(data.leadId);
      setLeadSubmitted(true);

      // Fire Meta Pixel Lead event
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', { content_name: selectedPath });
      }
    } catch (err) {
      console.error('Lead submit error:', err);
      setLeadSubmitted(true);
    } finally {
      setLeadSubmitting(false);
    }
  }, [firstName, lastName, email, phone, selectedPath, leadSubmitted, leadSubmitting, contactComplete, utmParams]);

  // Auto-submit lead when all contact fields are filled (handles browser autofill)
  useEffect(() => {
    if (screen === 3 && !leadSubmitted && !leadSubmitting && contactComplete) {
      const timer = setTimeout(() => {
        submitLead();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [screen, contactComplete, leadSubmitted, leadSubmitting, submitLead]);

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
          // Cal.com v2 returns { 'YYYY-MM-DD': [{ start, end }] } for format=range
          const raw = data.slots;
          const list = Array.isArray(raw)
            ? raw
            : (raw && typeof raw === 'object' ? (raw[dateStr] || []) : []);
          const filtered = filterSlotsByBuffer(list);
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
        setError(bookData.error || 'Payment succeeded but booking failed. Please call (949) 997-3988 to schedule.');
        setSubmitting(false);
        return;
      }

      setBookingResult({
        start: bookData.booking?.start || selectedSlot,
      });
      setScreen(4);

      // Push /assessment/confirmed for Google Ads conversion tracking
      window.history.pushState({}, '', '/assessment/confirmed');

      // Fire Meta Pixel Purchase event
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', { value: 197.00, currency: 'USD' });
      }
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

        {/* ── Header ── */}
        <div style={s.header}>
          {screen === 1 ? (
            <a href="/">
              <img
                src="https://www.range-medical.com/brand/range_logo_transparent_black.png"
                alt="Range Medical"
                style={s.logo}
              />
            </a>
          ) : (
            <img
              src="https://www.range-medical.com/brand/range_logo_transparent_black.png"
              alt="Range Medical"
              style={s.logo}
            />
          )}
        </div>

        <div style={s.container}>

          {/* ── Screen 1: Path Selection ──────────────────────────────── */}
          {screen === 1 && (
            <>
              <div style={s.heroSection}>
                <div style={s.label}>
                  <span style={s.dot} /> YOUR ASSESSMENT
                </div>
                <h1 style={s.headline}>
                  BETTER ENERGY.<br />FASTER RECOVERY.<br />OPTIMIZED HEALTH.
                </h1>
                <div style={s.rule} />
                <p style={s.headlineSub}>
                  Pick the path that matches your situation. Both start with a $197 assessment — credited toward your treatment.
                </p>
              </div>

              <div style={s.pathGrid}>
                {[
                  {
                    num: '01',
                    path: 'injury',
                    title: 'INJURY & RECOVERY',
                    sub: 'Pain, healing, post-surgery — we build a recovery protocol around your timeline.',
                  },
                  {
                    num: '02',
                    path: 'energy',
                    title: 'ENERGY, HORMONES & WEIGHT',
                    sub: 'Fatigue, weight gain, brain fog, low drive — we start with labs and find the root cause.',
                  },
                  {
                    num: '03',
                    path: 'both',
                    title: 'BOTH',
                    sub: 'Full-spectrum health optimization — injury recovery and hormones together.',
                  },
                ].map((item) => (
                  <div
                    key={item.path}
                    style={s.pathCard}
                    onClick={() => handlePathSelect(item.path)}
                    onMouseEnter={e => { e.currentTarget.style.paddingLeft = '1rem'; }}
                    onMouseLeave={e => { e.currentTarget.style.paddingLeft = '0'; }}
                  >
                    <span style={s.pathNumber}>{item.num}</span>
                    <div style={s.pathTitle}>{item.title}</div>
                    <p style={s.pathSub}>{item.sub}</p>
                    <button
                      style={s.pathBtn}
                      onMouseEnter={e => { e.currentTarget.style.background = '#404040'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; }}
                    >
                      SELECT THIS PATH &rarr;
                    </button>
                  </div>
                ))}
              </div>

              {/* Testimonials */}
              <div style={{ marginTop: 48 }}>
                <div style={s.label}>
                  <span style={s.dot} /> WHAT OUR PATIENTS SAY
                </div>
                <div style={s.rule} />

                {[
                  {
                    name: 'Mark T.',
                    text: 'I recently experienced a shoulder injury and scheduled a few PT appointments. When I asked about peptides to help fast-track my recovery, they walked me upstairs and introduced me to the team at Range Medical. My labs were thoroughly reviewed, clearly explained, and a thoughtful health plan was put in place.',
                    highlight: 'Labs thoroughly reviewed, clearly explained, and a thoughtful health plan was put in place.',
                  },
                  {
                    name: 'Jessica R.',
                    text: 'Range Medical has been an integral part of my healing journey. I noticed significant improvement shortly after starting recovery peptides. My results are consistent and I trust the quality and providers. All of the providers are friendly, incredibly knowledgeable and go above and beyond.',
                    highlight: 'My results are consistent and I trust the quality and providers.',
                  },
                  {
                    name: 'Michael B.',
                    text: 'Best medical experience I\'ve had. No rushed appointments, no feeling like just another number. They genuinely care about helping you optimize your health. The peptide protocols have been excellent for my recovery.',
                    highlight: 'No rushed appointments, no feeling like just another number.',
                  },
                ].map((review) => (
                  <div key={review.name} style={{ padding: '24px 0', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: '#f59e0b' }}>&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{review.name}</span>
                    </div>
                    <p style={{ fontSize: 15, lineHeight: 1.7, color: '#737373', margin: '0 0 8px', fontStyle: 'italic' }}>
                      &ldquo;{review.highlight}&rdquo;
                    </p>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: '#a0a0a0', margin: 0 }}>
                      {review.text}
                    </p>
                  </div>
                ))}

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <a
                    href="/reviews"
                    style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#1a1a1a', textTransform: 'uppercase', borderBottom: '1.5px solid #1a1a1a', paddingBottom: 3, textDecoration: 'none' }}
                  >
                    READ MORE REVIEWS &rarr;
                  </a>
                </div>
              </div>
            </>
          )}

          {/* ── Screen 2: VSL + Offer ─────────────────────────────────── */}
          {screen === 2 && selectedPath && (
            <>
              <div style={{ paddingTop: 40 }}>
                <button
                  style={s.backBtn}
                  onClick={() => setScreen(1)}
                  onMouseEnter={e => { e.currentTarget.style.color = '#1a1a1a'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#737373'; }}
                >
                  <ChevronLeft size={14} /> BACK
                </button>

                <div style={s.label}>
                  <span style={s.dot} /> YOUR PATH
                </div>

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
                  <ul style={{ margin: '12px 0 0', paddingLeft: 18, listStyle: 'none' }}>
                    {selectedPath === 'injury' && (
                      <>
                        <li style={{ fontSize: 14, color: '#4a4a4a', lineHeight: 1.8 }}>&#10003;&ensp;1-on-1 consultation focused on your injury and recovery timeline</li>
                        <li style={{ fontSize: 14, color: '#4a4a4a', lineHeight: 1.8 }}>&#10003;&ensp;Custom recovery protocol built around your goals</li>
                        <li style={{ fontSize: 14, color: '#4a4a4a', lineHeight: 1.8 }}>&#10003;&ensp;$197 applied as credit toward your treatment plan</li>
                      </>
                    )}
                    {selectedPath === 'energy' && (
                      <>
                        <li style={{ fontSize: 14, color: '#4a4a4a', lineHeight: 1.8 }}>&#10003;&ensp;1-on-1 consultation focused on energy, hormones, and metabolism</li>
                        <li style={{ fontSize: 14, color: '#4a4a4a', lineHeight: 1.8 }}>&#10003;&ensp;Personalized roadmap based on your symptoms and goals</li>
                        <li style={{ fontSize: 14, color: '#4a4a4a', lineHeight: 1.8 }}>&#10003;&ensp;$197 applied as credit toward your labs or treatment plan</li>
                      </>
                    )}
                    {selectedPath === 'both' && (
                      <>
                        <li style={{ fontSize: 14, color: '#4a4a4a', lineHeight: 1.8 }}>&#10003;&ensp;1-on-1 consultation covering injury recovery and hormone optimization</li>
                        <li style={{ fontSize: 14, color: '#4a4a4a', lineHeight: 1.8 }}>&#10003;&ensp;Full-spectrum health assessment with a personalized plan</li>
                        <li style={{ fontSize: 14, color: '#4a4a4a', lineHeight: 1.8 }}>&#10003;&ensp;$197 applied as credit toward your treatment or labs</li>
                      </>
                    )}
                  </ul>
                </div>

                <button
                  style={s.btn}
                  onClick={() => setScreen(3)}
                  onMouseEnter={e => { e.currentTarget.style.background = '#404040'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; }}
                >
                  BOOK MY ASSESSMENT — $197
                </button>
              </div>
            </>
          )}

          {/* ── Screen 3: Contact + Payment + Scheduling ──────────────── */}
          {screen === 3 && selectedPath && (
            <>
              <div style={{ paddingTop: 40 }}>
                <button
                  style={s.backBtn}
                  onClick={() => setScreen(2)}
                  onMouseEnter={e => { e.currentTarget.style.color = '#1a1a1a'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#737373'; }}
                >
                  <ChevronLeft size={14} /> BACK
                </button>

                <div style={s.label}>
                  <span style={s.dot} /> COMPLETE YOUR BOOKING
                </div>
                <h2 style={{ ...s.headline, fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 12 }}>
                  ALMOST THERE.
                </h2>
                <div style={s.rule} />

                {/* Section A: Contact Info */}
                <div style={{ marginTop: 32 }}>
                  <div style={s.sectionLabel}>
                    <span style={s.dot} /> CONTACT INFORMATION
                  </div>
                  <div style={s.sectionRule} />

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
                        onFocus={e => { e.currentTarget.style.borderColor = '#1a1a1a'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
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
                        onFocus={e => { e.currentTarget.style.borderColor = '#1a1a1a'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
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
                    onFocus={e => { e.currentTarget.style.borderColor = '#1a1a1a'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
                  />

                  <label style={s.label}>Phone</label>
                  <input
                    style={s.input}
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      if (contactComplete && !leadSubmitted) {
                        submitLead();
                      }
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#1a1a1a'; }}
                    placeholder="(555) 555-5555"
                    autoComplete="tel"
                  />

                  {leadSubmitting && (
                    <div style={s.loadingDots}>Saving your info...</div>
                  )}
                </div>

                <div style={s.divider} />

                {/* Section B: Payment */}
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
                            '.Input': {
                              borderColor: '#e0e0e0',
                              borderRadius: '0px',
                            },
                            '.Input:focus': {
                              borderColor: '#1a1a1a',
                              boxShadow: 'none',
                            },
                            '.Tab': {
                              borderRadius: '0px',
                            },
                            '.Tab--selected': {
                              borderColor: '#1a1a1a',
                            },
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
                          const isSelected = selectedSlot === slot.start;
                          return (
                            <button
                              key={slot.start}
                              style={{
                                ...s.timeBtn,
                                ...(isSelected ? s.timeBtnSelected : {}),
                              }}
                              onClick={() => setSelectedSlot(slot.start)}
                            >
                              {formatTime(slot.start)}
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
                  onMouseEnter={e => { if (canConfirm) e.currentTarget.style.background = '#404040'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; }}
                >
                  {submitting ? 'PROCESSING...' : 'CONFIRM & PAY — $197'}
                </button>
              </div>
            </>
          )}

          {/* ── Screen 4: Confirmation ────────────────────────────────── */}
          {screen === 4 && (
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

              <p style={s.confirmDetail}>
                Your $197 will be applied as a credit toward your treatment plan.
              </p>

              <p style={s.confirmDetail}>
                We&apos;ve sent a text to {formatPhoneDisplay(phone)} with your details.
              </p>

              <a href="tel:9499973988" style={s.contactLink}>
                <Phone size={14} />
                (949) 997-3988
              </a>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
