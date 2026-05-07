import Head from 'next/head';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ChevronLeft, ChevronDown, Phone } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const ASSESSMENT_EVENT_TYPE_ID = process.env.NEXT_PUBLIC_ASSESSMENT_EVENT_TYPE_ID
  ? parseInt(process.env.NEXT_PUBLIC_ASSESSMENT_EVENT_TYPE_ID)
  : null;

const FAQS = [
  {
    q: 'Can I try a few sessions before committing to a full program?',
    a: 'Yes. After your assessment, you can start with individual sessions to see how your body responds. There is no pressure to commit to a full program right away.',
  },
  {
    q: 'What if I just want red light therapy or hyperbaric oxygen and not the full protocol?',
    a: 'That’s completely fine. You can book those sessions on their own. The assessment helps us figure out which treatments will work best for your goals, but there’s no obligation to do everything at once.',
  },
  {
    q: 'How long does the assessment take?',
    a: 'The lab draw takes about 10 minutes. The provider visit is about 30 minutes. You can do both on the same day or split them up — whatever works for your schedule.',
  },
  {
    q: 'Do I need labs if I already had some done this year?',
    a: 'Bring what you have. Your provider will review your existing labs and let you know if anything additional is needed. You may not need a full panel.',
  },
  {
    q: 'What if I’m busy and don’t have much time?',
    a: 'We get it. Most of our patients are busy professionals. The lab draw takes 10 minutes and the provider visit is about 30 minutes. We’ll work around your schedule.',
  },
  {
    q: 'Is this covered by insurance?',
    a: 'Range Medical is a cash-based clinic, which means we do not bill insurance. This lets us spend more time with you and choose the best options without insurance restrictions. Many patients use HSA or FSA funds.',
  },
  {
    q: 'What happens after the assessment?',
    a: 'You walk out with a written plan specific to you. If you want to move forward with treatment, your $197 is applied as a credit toward whatever you choose. There is no pressure to commit.',
  },
  {
    q: 'Is Range Medical the same as Range Sports Therapy?',
    a: 'We are separate practices in the same building. Range Medical focuses on lab-based health optimization — hormones, metabolism, and energy. Range Sports Therapy handles physical therapy and sports rehab.',
  },
];

// ── Styles ─────────────────────────────────────────────────────────────────

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

  guaranteeBox: {
    background: '#fafafa', border: '1px solid #e0e0e0', padding: '24px 28px', margin: '24px 0 0',
  },
  guaranteeLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: '#1a1a1a', margin: '0 0 10px',
  },
  guaranteeText: { fontSize: 15, lineHeight: 1.7, color: '#4a4a4a', margin: 0 },

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

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── Payment Section ────────────────────────────────────────────────────────

function PaymentSection({ stripeRef, elementsRef, onReady }) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    stripeRef.current = stripe;
    elementsRef.current = elements;
  }, [stripe, elements, stripeRef, elementsRef]);

  return <PaymentElement onReady={() => onReady && onReady()} options={{ layout: 'tabs' }} />;
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Assessment() {
  const [screen, setScreen] = useState(1);
  const [selectedPath, setSelectedPath] = useState('energy');
  const [openFaq, setOpenFaq] = useState(null);

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

  // Deep link: injury or both → skip landing page, go to booking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathParam = params.get('path');
    if (pathParam === 'injury' || pathParam === 'both') {
      setSelectedPath(pathParam);
      setScreen(2);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
      const val = params.get(key);
      if (val) utm[key] = val;
    });
    if (Object.keys(utm).length > 0) setUtmParams(utm);

    if (params.get('payment_complete') === 'true') {
      window.history.replaceState({}, '', '/assessment');
    }
  }, []);

  // Pre-fill from /roadmap or /start funnels
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

  // Scroll to top on screen change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const handleCTA = () => setScreen(2);
  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  // ── Lead submission ────────────────────────────────────────────────────

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
          assessmentPath: selectedPath, ...utmParams,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      setLeadId(data.leadId);
      setLeadSubmitted(true);

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

  useEffect(() => {
    if (screen === 2 && !leadSubmitted && !leadSubmitting && contactComplete) {
      const timer = setTimeout(() => submitLead(), 500);
      return () => clearTimeout(timer);
    }
  }, [screen, contactComplete, leadSubmitted, leadSubmitting, submitLead]);

  // ── Payment init ───────────────────────────────────────────────────────

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

  // ── Slot fetching ──────────────────────────────────────────────────────

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

  // ── Confirm & Pay ──────────────────────────────────────────────────────

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
        confirmParams: { return_url: `${baseUrl}/assessment?payment_complete=true` },
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
      setScreen(3);

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

  // ── Render ────────────────────────────────────────────────────────────

  const availableDates = getNext14Days();

  const ctaButton = (extra = {}) => (
    <button
      style={{ ...s.btn, ...extra }}
      onClick={handleCTA}
      onMouseEnter={e => { e.currentTarget.style.background = '#404040'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; }}
    >
      Schedule My Range Assessment
    </button>
  );

  return (
    <>
      <Head>
        <title>Range Assessment | Energy, Hormones & Weight | Range Medical</title>
        <meta name="description" content="Tired, foggy, or gaining weight even with normal labs? The $197 Range Assessment combines detailed labs with your symptoms to find what others miss. Every dollar credited toward your treatment. Newport Beach, CA." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={s.page}>

        {/* ── Header ── */}
        <div style={s.header}>
          {screen === 1 ? (
            <a href="/"><img src="https://www.range-medical.com/brand/range_logo_transparent_black.png" alt="Range Medical" style={s.logo} /></a>
          ) : (
            <img src="https://www.range-medical.com/brand/range_logo_transparent_black.png" alt="Range Medical" style={s.logo} />
          )}
        </div>

        <div style={s.container}>

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 1 — LANDING PAGE
              ════════════════════════════════════════════════════════════ */}
          {screen === 1 && (
            <>
              {/* ── Hero ── */}
              <div style={s.heroSection}>
                <div style={s.label}>
                  <span style={s.dot} /> THE RANGE ASSESSMENT
                </div>
                <h1 style={s.headline}>
                  YOUR LABS CAME<br />BACK &ldquo;NORMAL.&rdquo;<br />YOU STILL DON&apos;T<br />FEEL RIGHT.
                </h1>
                <div style={s.rule} />
                <p style={s.headlineSub}>
                  The Range Assessment matches how you feel with what your labs actually show &mdash; so you get a real plan, not another guess.
                </p>
                <div style={s.offerBox}>
                  The Range Assessment is <strong>$197</strong> today, and every dollar is credited toward any treatment plan you start with us.
                </div>
                {ctaButton()}
              </div>

              {/* ── Is This You? ── */}
              <div style={s.section}>
                <div style={s.label}>
                  <span style={s.dot} /> IS THIS YOU?
                </div>
                <div style={s.rule} />
                <p style={s.body}>
                  You&apos;ve been to the doctor. Your labs came back &ldquo;fine.&rdquo; But something still doesn&apos;t feel right.
                </p>
                <div>
                  {[
                    'You wake up tired even after a full night of sleep',
                    'Afternoon energy crashes that coffee can’t fix',
                    'Brain fog and trouble staying focused',
                    'Weight that won’t budge no matter what you try',
                    'Mood changes, low drive, or restless sleep',
                    'A feeling that something is off — even though no one can tell you what',
                  ].map((item, i) => (
                    <div key={i} style={s.checkItem}>
                      <span style={s.checkDot} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p style={{ ...s.body, marginTop: 20, marginBottom: 0 }}>
                  You&apos;re not imagining it. And you&apos;re not alone.
                </p>
              </div>

              {/* ── What Happens ── */}
              <div style={s.section}>
                <div style={s.label}>
                  <span style={s.dot} /> WHAT HAPPENS IN YOUR RANGE ASSESSMENT
                </div>
                <div style={s.rule} />
                <p style={s.body}>
                  From first call to written plan, most patients finish in about a week.
                </p>
                {[
                  { num: '01', title: 'Schedule and Get Labs Done', desc: 'Book your visit and come in for a quick lab draw. Takes about 10 minutes. We can usually get you in this week.' },
                  { num: '02', title: 'Symptom Questionnaire', desc: 'Fill out a short form about how you’ve been feeling — energy, sleep, mood, focus, weight. Takes about 5 minutes.' },
                  { num: '03', title: '1:1 Provider Review', desc: 'Sit down with your provider. They walk through your labs and symptoms side by side, in plain language. No jargon. No rushing.' },
                  { num: '04', title: 'Your Written Plan + $197 Credit', desc: 'Walk out with a clear plan built for you. Every dollar of your $197 is applied toward whatever treatment you choose.' },
                ].map((step, i) => (
                  <div key={i} style={i < 3 ? s.step : s.stepLast}>
                    <div style={s.stepNum}>{step.num}</div>
                    <div>
                      <div style={s.stepTitle}>{step.title}</div>
                      <p style={s.stepDesc}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Why This Works ── */}
              <div style={s.section}>
                <div style={s.label}>
                  <span style={s.dot} /> WHY THIS WORKS BETTER THAN GUESSING
                </div>
                <div style={s.rule} />
                <p style={s.body}>
                  Most doctors look at your labs or ask how you feel. We do both &mdash; at the same time.
                </p>
                <p style={s.body}>
                  When we line up your numbers with your symptoms, patterns show up that a standard checkup misses. That&apos;s how we find the real issue &mdash; not just the one that looks &ldquo;normal&rdquo; on paper.
                </p>
                <p style={s.body}>
                  This same approach helped one of our founders, Chris, get his energy back after years of feeling off. Labs plus symptoms, not guessing. Along the way, he lost about 100 pounds.
                </p>
                <div style={{ margin: '20px 0 28px' }}>
                  {[
                    'Labs that go deeper than a standard blood panel',
                    'A side-by-side review of what you feel and what your labs show',
                    'A plan built for your body, your goals, and your schedule',
                    'No pressure — you decide what’s right for you',
                  ].map((item, i) => (
                    <div key={i} style={s.checkItem}>
                      <span style={s.checkDot} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                {ctaButton()}
              </div>

              {/* ── Cost & Guarantee ── */}
              <div style={s.section}>
                <div style={s.label}>
                  <span style={s.dot} /> WHAT IT COSTS & OUR GUARANTEE
                </div>
                <div style={s.rule} />
                <p style={s.body}>
                  The Range Assessment is <strong>$197</strong>. Every dollar is credited toward any treatment plan you start with Range Medical.
                </p>
                <p style={s.body}>
                  That means if you move forward, the assessment is essentially free.
                </p>
                <div style={s.guaranteeBox}>
                  <div style={s.guaranteeLabel}>Our Energy Guarantee</div>
                  <p style={s.guaranteeText}>
                    If you move into our Cellular Energy Reset program, we check your energy by week 3. If your self-rated energy has not improved by at least 2 points on a 10-point scale, we add 2 extra weeks of red light therapy sessions at no additional charge.
                  </p>
                </div>
                <p style={{ ...s.body, marginTop: 20, marginBottom: 0 }}>
                  We&apos;re not interested in selling you something that doesn&apos;t work. If you don&apos;t feel a real difference, we make it right.
                </p>
              </div>

              {/* ── FAQ ── */}
              <div style={s.section}>
                <div style={s.label}>
                  <span style={s.dot} /> FREQUENTLY ASKED QUESTIONS
                </div>
                <div style={s.rule} />
                {FAQS.map((faq, i) => (
                  <div key={i} style={s.faqItem}>
                    <button style={s.faqQ} onClick={() => toggleFaq(i)}>
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={18}
                        style={{
                          transition: 'transform 0.2s',
                          transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                          flexShrink: 0, color: '#a0a0a0',
                        }}
                      />
                    </button>
                    {openFaq === i && <p style={s.faqA}>{faq.a}</p>}
                  </div>
                ))}
              </div>

              {/* ── Final CTA ── */}
              <div style={s.finalCta}>
                <h2 style={s.finalHeadline}>
                  YOU DON&apos;T HAVE TO<br />KEEP GUESSING.
                </h2>
                <p style={s.finalSub}>
                  Get the answers and a real plan to feel like yourself again.
                </p>
                {ctaButton()}
                <div style={{ marginTop: 24 }}>
                  <a href="tel:9499973988" style={s.contactLink}>
                    <Phone size={14} /> (949) 997-3988
                  </a>
                </div>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 2 — BOOKING (CONTACT + PAYMENT + SCHEDULING)
              ════════════════════════════════════════════════════════════ */}
          {screen === 2 && (
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
                  <span style={s.dot} /> BOOK YOUR ASSESSMENT
                </div>
                <h2 style={{ ...s.headline, fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 12 }}>
                  ALMOST THERE.
                </h2>
                <div style={s.rule} />

                {/* Contact Info */}
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

                {/* Payment */}
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

                {/* Pick Your Time */}
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
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 3 — CONFIRMATION
              ════════════════════════════════════════════════════════════ */}
          {screen === 3 && (
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
          )}

        </div>
      </div>
    </>
  );
}
