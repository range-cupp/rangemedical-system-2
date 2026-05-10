import Layout from '../components/Layout';
import Head from 'next/head';
import { useState, useEffect, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/router';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const SERVICE_SLUG = 'range-assessment';

function ptDateParts(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.formatToParts(date).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
}

function getNext14Days() {
  const out = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const { year, month, day } = ptDateParts(d);
    const iso = `${year}-${month}-${day}`;
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short' }).format(d);
    const monthShort = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', month: 'short' }).format(d);
    out.push({ dateISO: iso, weekdayShort: weekday, day: Number(day), monthShort });
  }
  return out;
}

function formatSlotTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatSlotFull(iso) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles', weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function CheckoutForm({ patientInfo, onSuccess, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError('');

    try {
      const piRes = await fetch('/api/assessment-booking/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientInfo }),
      });
      const piData = await piRes.json();
      if (!piRes.ok) throw new Error(piData.error || 'Payment failed');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(piData.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: `${patientInfo.firstName} ${patientInfo.lastName}`,
            email: patientInfo.email,
          },
        },
      });

      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={s.summaryBox}>
        <h3 style={s.summaryTitle}>Order Summary</h3>
        <div style={{ ...s.summaryLine, borderTop: '2px solid #171717', paddingTop: '12px', marginTop: '4px' }}>
          <span style={{ fontWeight: 700, fontSize: '16px' }}>Range Assessment</span>
          <span style={{ fontWeight: 700, fontSize: '16px' }}>$197.00</span>
        </div>
      </div>

      <div style={s.creditNote}>
        Your $197 applies as a credit toward any labs or treatment plan. It is not an extra cost on top.
      </div>

      <div style={s.cardWrapper}>
        <label style={s.fieldLabel}>Card Details</label>
        <div style={s.cardElement}>
          <CardElement options={{
            style: {
              base: { fontSize: '16px', color: '#171717', fontFamily: 'Inter, -apple-system, sans-serif', '::placeholder': { color: '#a3a3a3' } },
              invalid: { color: '#dc2626' },
            },
          }} />
        </div>
      </div>

      {error && <div style={s.errorMsg}>{error}</div>}

      <div style={s.btnRow}>
        <button type="button" onClick={onBack} style={s.btnSecondary}>Back</button>
        <button type="submit" disabled={!stripe || processing} style={{ ...s.btnPrimary, opacity: processing ? 0.6 : 1 }}>
          {processing ? 'Processing...' : 'Pay $197.00'}
        </button>
      </div>
    </form>
  );
}

export default function BookAssessment() {
  const router = useRouter();
  const [step, setStep] = useState('info');
  const [patientInfo, setPatientInfo] = useState({ firstName: '', lastName: '', email: '', phone: '', dob: '' });
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const days = useMemo(() => getNext14Days(), []);
  const [selectedDate, setSelectedDate] = useState('');
  const [slotsByDate, setSlotsByDate] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');

  useEffect(() => {
    if (days.length > 0 && !selectedDate) setSelectedDate(days[0].dateISO);
  }, [days]);

  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query;
    setPatientInfo(prev => ({
      ...prev,
      firstName: q.firstName || prev.firstName,
      email: q.email || prev.email,
      phone: q.phone || prev.phone,
    }));
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (step !== 'book' || !selectedDate) return;
    if (slotsByDate[selectedDate] !== undefined) return;
    setLoadingSlots(true);
    fetch(`/api/bookings/slots?serviceSlug=${SERVICE_SLUG}&date=${selectedDate}`)
      .then(r => r.json())
      .then(data => {
        const raw = data?.slots;
        const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? (raw[selectedDate] || []) : []);
        setSlotsByDate(prev => ({ ...prev, [selectedDate]: list }));
      })
      .catch(() => setSlotsByDate(prev => ({ ...prev, [selectedDate]: [] })))
      .finally(() => setLoadingSlots(false));
  }, [step, selectedDate]);

  function validateInfo() {
    const errors = {};
    if (!patientInfo.firstName.trim()) errors.firstName = 'Required';
    if (!patientInfo.lastName.trim()) errors.lastName = 'Required';
    if (!patientInfo.email.trim() || !patientInfo.email.includes('@')) errors.email = 'Valid email required';
    if (!patientInfo.phone.trim() || patientInfo.phone.replace(/\D/g, '').length < 10) errors.phone = 'Valid phone required';
    if (!patientInfo.dob.trim()) errors.dob = 'Required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleInfoSubmit() {
    if (validateInfo()) setStep('pay');
  }

  function handlePaymentSuccess(piId) {
    setPaymentIntentId(piId);
    setStep('book');
  }

  async function handleBookSlot() {
    if (!selectedSlot) return;
    setBooking(true);
    setBookError('');
    try {
      const confirmRes = await fetch('/api/assessment-booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          patientInfo,
          appointmentTime: selectedSlot,
        }),
      });
      if (!confirmRes.ok) {
        const d = await confirmRes.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to confirm booking');
      }

      const bookRes = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSlug: SERVICE_SLUG,
          start: selectedSlot,
          patientId: null,
          patientName: `${patientInfo.firstName} ${patientInfo.lastName}`,
          patientEmail: patientInfo.email,
          patientPhone: patientInfo.phone,
          serviceName: 'Range Assessment',
          notes: `Paid $197 (PI: ${paymentIntentId}). DOB: ${patientInfo.dob}`,
        }),
      });
      const bookData = await bookRes.json().catch(() => ({}));
      if (!bookRes.ok) {
        if (bookData.slotUnavailable) {
          setSlotsByDate(prev => { const n = { ...prev }; delete n[selectedDate]; return n; });
          setSelectedSlot(null);
          setBookError('That time was just taken. Please pick another.');
        } else {
          throw new Error(bookData.error || 'Could not book. Please try again.');
        }
        setBooking(false);
        return;
      }
      setStep('done');
    } catch (err) {
      setBookError(err.message);
    }
    setBooking(false);
  }

  const slots = slotsByDate[selectedDate];

  return (
    <Layout
      title="Book Your Range Assessment | Range Medical | Newport Beach"
      description="Schedule your Range Assessment at Range Medical in Newport Beach. Pay online and book your appointment instantly."
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item"><span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google</span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">&#10003; Book &amp; Pay Online</span>
        </div>
      </div>

      <div style={s.page}>
        <div style={s.progressBar}>
          {['Your Info', 'Pay', 'Schedule'].map((label, i) => {
            const stepMap = ['info', 'pay', 'book'];
            const currentIdx = stepMap.indexOf(step === 'done' ? 'book' : step);
            const isActive = i <= currentIdx;
            return (
              <div key={label} style={{ ...s.progressStep, opacity: isActive ? 1 : 0.35 }}>
                <div style={{ ...s.progressDot, background: isActive ? '#171717' : '#d4d4d4' }}>{i + 1}</div>
                <span style={s.progressLabel}>{label}</span>
              </div>
            );
          })}
        </div>

        {step === 'info' && (
          <div style={s.stepContainer}>
            <h1 style={s.pageTitle}>Range Assessment</h1>
            <p style={s.pageSubtitle}>
              In one visit, we review focused labs and your symptoms together and give you a written plan you can follow.
            </p>

            <div style={s.priceBanner}>
              <div style={s.priceAmount}>$197</div>
              <div style={s.priceDetail}>
                Applies as a credit toward any labs or treatment plan.
              </div>
            </div>

            <div style={s.fastingTip}>
              <strong>Tip:</strong> Come fasted (no food for 12 hours, water is fine). If your provider recommends labs, we can draw blood during the same visit so you do not need a second trip.
            </div>

            <h2 style={s.sectionTitle}>Your Information</h2>

            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.fieldLabel}>First Name *</label>
                <input style={{ ...s.input, ...(formErrors.firstName ? s.inputError : {}) }} value={patientInfo.firstName} onChange={e => setPatientInfo({ ...patientInfo, firstName: e.target.value })} placeholder="First name" />
                {formErrors.firstName && <span style={s.fieldError}>{formErrors.firstName}</span>}
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Last Name *</label>
                <input style={{ ...s.input, ...(formErrors.lastName ? s.inputError : {}) }} value={patientInfo.lastName} onChange={e => setPatientInfo({ ...patientInfo, lastName: e.target.value })} placeholder="Last name" />
                {formErrors.lastName && <span style={s.fieldError}>{formErrors.lastName}</span>}
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Email *</label>
                <input style={{ ...s.input, ...(formErrors.email ? s.inputError : {}) }} type="email" value={patientInfo.email} onChange={e => setPatientInfo({ ...patientInfo, email: e.target.value })} placeholder="you@email.com" />
                {formErrors.email && <span style={s.fieldError}>{formErrors.email}</span>}
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Phone *</label>
                <input style={{ ...s.input, ...(formErrors.phone ? s.inputError : {}) }} type="tel" value={patientInfo.phone} onChange={e => setPatientInfo({ ...patientInfo, phone: e.target.value })} placeholder="(949) 555-0123" />
                {formErrors.phone && <span style={s.fieldError}>{formErrors.phone}</span>}
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Date of Birth *</label>
                <input style={{ ...s.input, ...(formErrors.dob ? s.inputError : {}) }} type="date" value={patientInfo.dob} onChange={e => setPatientInfo({ ...patientInfo, dob: e.target.value })} />
                {formErrors.dob && <span style={s.fieldError}>{formErrors.dob}</span>}
              </div>
            </div>

            <div style={{ ...s.btnRow, justifyContent: 'flex-end' }}>
              <button onClick={handleInfoSubmit} style={s.btnPrimary}>Continue to Payment</button>
            </div>
          </div>
        )}

        {step === 'pay' && (
          <div style={s.stepContainer}>
            <h2 style={s.pageTitle}>Payment</h2>
            <p style={s.pageSubtitle}>Secure checkout powered by Stripe.</p>

            <Elements stripe={stripePromise}>
              <CheckoutForm
                patientInfo={patientInfo}
                onSuccess={handlePaymentSuccess}
                onBack={() => setStep('info')}
              />
            </Elements>
          </div>
        )}

        {step === 'book' && (
          <div style={s.stepContainer}>
            <div style={s.paymentSuccess}>
              <div style={s.successIcon}>&#10003;</div>
              <h3 style={s.successTitle}>Payment Successful!</h3>
              <p style={s.successText}>Now pick your appointment time below.</p>
            </div>

            <h2 style={{ ...s.pageTitle, marginTop: '2rem' }}>Schedule Your Assessment</h2>
            <p style={s.pageSubtitle}>Pacific time. Choose a time that works for you.</p>

            <div style={s.fastingReminder}>
              Remember: come fasted (no food for 12 hours, water is fine) so we can draw labs during the same visit if needed.
            </div>

            <div style={s.dayRow}>
              {days.slice(0, 7).map(d => (
                <button
                  key={d.dateISO}
                  onClick={() => { setSelectedDate(d.dateISO); setSelectedSlot(null); }}
                  style={{
                    ...s.dayBtn,
                    ...(d.dateISO === selectedDate ? s.dayBtnActive : {}),
                  }}
                >
                  <span style={s.dayWeekday}>{d.weekdayShort}</span>
                  <span style={s.dayNum}>{d.day}</span>
                  <span style={s.dayMonth}>{d.monthShort}</span>
                </button>
              ))}
            </div>
            <div style={{ ...s.dayRow, marginTop: '8px' }}>
              {days.slice(7, 14).map(d => (
                <button
                  key={d.dateISO}
                  onClick={() => { setSelectedDate(d.dateISO); setSelectedSlot(null); }}
                  style={{
                    ...s.dayBtn,
                    ...(d.dateISO === selectedDate ? s.dayBtnActive : {}),
                  }}
                >
                  <span style={s.dayWeekday}>{d.weekdayShort}</span>
                  <span style={s.dayNum}>{d.day}</span>
                  <span style={s.dayMonth}>{d.monthShort}</span>
                </button>
              ))}
            </div>

            <div style={{ padding: '16px 0', borderTop: '1px solid #e5e5e5', marginTop: '12px' }}>
              {loadingSlots && (
                <p style={{ fontSize: '14px', color: '#737373', textAlign: 'center', padding: '24px 0' }}>Loading open times...</p>
              )}
              {!loadingSlots && slots?.length === 0 && (
                <p style={{ fontSize: '14px', color: '#737373', textAlign: 'center', padding: '24px 0' }}>
                  No openings this day. Try another date.
                </p>
              )}
              {!loadingSlots && slots?.length > 0 && (
                <div style={s.slotGrid}>
                  {slots.map(slot => {
                    const iso = typeof slot === 'string' ? slot : slot.start;
                    const isSelected = selectedSlot === iso;
                    return (
                      <button
                        key={iso}
                        onClick={() => setSelectedSlot(iso)}
                        style={{
                          ...s.slotBtn,
                          ...(isSelected ? s.slotBtnActive : {}),
                        }}
                      >
                        {formatSlotTime(iso)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {bookError && (
              <div style={s.errorMsg}>{bookError}</div>
            )}

            {selectedSlot && (
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <p style={{ fontSize: '15px', color: '#171717', fontWeight: 600, marginBottom: '16px' }}>
                  {formatSlotFull(selectedSlot)}
                </p>
                <button
                  onClick={handleBookSlot}
                  disabled={booking}
                  style={{ ...s.btnPrimary, opacity: booking ? 0.6 : 1, width: '100%', padding: '16px' }}
                >
                  {booking ? 'Booking...' : 'Book This Time'}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'done' && (
          <div style={s.stepContainer}>
            <div style={s.doneContainer}>
              <div style={s.doneIcon}>&#10003;</div>
              <h2 style={s.doneTitle}>You&#39;re All Set!</h2>
              <p style={s.doneText}>
                Your Range Assessment has been booked and paid for. Here is what happens next:
              </p>
              {selectedSlot && (
                <p style={{ fontSize: '17px', fontWeight: 700, color: '#171717', marginBottom: '2rem' }}>
                  {formatSlotFull(selectedSlot)}
                </p>
              )}
              <div style={s.doneSteps}>
                <div style={s.doneStep}>
                  <div style={s.doneStepNum}>1</div>
                  <div>
                    <strong>Check your text messages</strong>
                    <p style={s.doneStepDesc}>We will send you any required consent forms via SMS. Please complete them before your visit.</p>
                  </div>
                </div>
                <div style={s.doneStep}>
                  <div style={s.doneStepNum}>2</div>
                  <div>
                    <strong>Come fasted</strong>
                    <p style={s.doneStepDesc}>No food for 12 hours before your appointment (water is fine). This way we can draw labs during the same visit if your provider recommends them.</p>
                  </div>
                </div>
                <div style={s.doneStep}>
                  <div style={s.doneStepNum}>3</div>
                  <div>
                    <strong>Show up at your appointment time</strong>
                    <p style={s.doneStepDesc}>Range Medical, 1901 Westcliff Dr Suite 9 &amp; 10, Newport Beach, CA 92660</p>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <p style={{ color: '#737373', fontSize: '14px' }}>
                  Questions? Call us at <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600 }}>(949) 997-3988</a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const s = {
  page: { maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem 4rem', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },

  progressBar: { display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 100, background: '#fff', padding: '16px 0', borderBottom: '1px solid #e5e5e5', margin: '0 -1.5rem 2.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' },
  progressStep: { display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.3s' },
  progressDot: { width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', transition: 'background 0.3s' },
  progressLabel: { fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#525252' },

  stepContainer: { maxWidth: '560px', margin: '0 auto' },
  pageTitle: { fontSize: '1.75rem', fontWeight: 700, color: '#171717', marginBottom: '0.5rem', letterSpacing: '-0.02em' },
  pageSubtitle: { fontSize: '1rem', color: '#525252', lineHeight: 1.6, marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#171717', marginBottom: '1rem', marginTop: '1.5rem' },

  priceBanner: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', background: '#f5f5f5', border: '1px solid #e5e5e5', marginBottom: '1rem' },
  priceAmount: { fontSize: '2rem', fontWeight: 700, color: '#171717' },
  priceDetail: { fontSize: '14px', color: '#525252', lineHeight: 1.5 },

  fastingTip: { padding: '16px 18px', background: '#fffbf0', border: '1px solid #fde68a', fontSize: '14px', lineHeight: 1.6, color: '#78350f', marginBottom: '1.5rem' },
  fastingReminder: { padding: '14px 18px', background: '#fffbf0', border: '1px solid #fde68a', fontSize: '14px', lineHeight: 1.5, color: '#78350f', marginBottom: '1rem' },

  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column' },
  fieldLabel: { fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
  input: { padding: '12px 14px', border: '1px solid #d1d5db', fontSize: '15px', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s' },
  inputError: { borderColor: '#dc2626' },
  fieldError: { fontSize: '12px', color: '#dc2626', marginTop: '4px' },

  summaryBox: { padding: '20px', background: '#fafafa', border: '1px solid #e5e5e5', marginBottom: '1rem' },
  summaryTitle: { fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#737373', marginBottom: '12px' },
  summaryLine: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', color: '#171717' },
  creditNote: { padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '14px', lineHeight: 1.5, color: '#166534', marginBottom: '1.5rem' },
  cardWrapper: { marginBottom: '1.5rem' },
  cardElement: { padding: '14px', border: '1px solid #d1d5db', background: '#fff' },
  errorMsg: { padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px', marginBottom: '1rem' },

  dayRow: { display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' },
  dayBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '10px 12px', border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', minWidth: '60px', transition: 'all 0.15s' },
  dayBtnActive: { background: '#171717', borderColor: '#171717', color: '#fff' },
  dayWeekday: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6 },
  dayNum: { fontSize: '18px', fontWeight: 700 },
  dayMonth: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.6 },

  slotGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' },
  slotBtn: { padding: '12px 8px', border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, color: '#171717', transition: 'all 0.15s', textAlign: 'center' },
  slotBtnActive: { background: '#171717', borderColor: '#171717', color: '#fff' },

  paymentSuccess: { textAlign: 'center', padding: '24px', background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '1rem' },
  successIcon: { width: '48px', height: '48px', borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px' },
  successTitle: { fontSize: '18px', fontWeight: 700, color: '#166534', margin: '0 0 4px' },
  successText: { fontSize: '14px', color: '#15803d', margin: 0 },

  doneContainer: { textAlign: 'center', padding: '2rem 0' },
  doneIcon: { width: '64px', height: '64px', borderRadius: '50%', background: '#171717', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 1.5rem' },
  doneTitle: { fontSize: '1.75rem', fontWeight: 700, color: '#171717', marginBottom: '0.75rem' },
  doneText: { fontSize: '15px', color: '#525252', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto 2rem' },
  doneSteps: { textAlign: 'left', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' },
  doneStep: { display: 'flex', gap: '16px', padding: '16px', background: '#fafafa', alignItems: 'flex-start' },
  doneStepNum: { width: '28px', height: '28px', borderRadius: '50%', background: '#171717', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 },
  doneStepDesc: { fontSize: '13px', color: '#737373', margin: '4px 0 0', lineHeight: 1.5 },

  btnRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '2rem' },
  btnPrimary: { padding: '14px 28px', background: '#171717', color: '#fff', border: 'none', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' },
  btnSecondary: { padding: '14px 28px', background: '#fff', color: '#525252', border: '1px solid #d1d5db', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' },
};
