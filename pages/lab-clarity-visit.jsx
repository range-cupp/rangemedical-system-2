import Head from 'next/head';
import { useState, useMemo, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

/* ── Slot generation ── */

function getAvailableDates() {
  const now = new Date();
  const pacificStr = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  const pacific = new Date(pacificStr);
  const today = new Date(pacific.getFullYear(), pacific.getMonth(), pacific.getDate());

  const dates = [];
  for (let i = 0; i <= 28; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    if (dow !== 4 && dow !== 5) continue;
    const dateStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
    dates.push({
      dateStr,
      dayName: dow === 4 ? 'Thu' : 'Fri',
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return dates;
}

const MORNING_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30'];
const AFTERNOON_SLOTS = ['13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];
const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

function getSlotsForDate(dateStr) {
  const now = new Date();
  const pacificStr = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  const pacificNow = new Date(pacificStr);

  return ALL_SLOTS.map(time => {
    const [h, m] = time.split(':').map(Number);
    const [y, mo, d] = dateStr.split('-').map(Number);
    const slotDate = new Date(y, mo - 1, d, h, m);
    if (slotDate <= pacificNow) return null;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h;
    return { time, label: `${displayH}:${String(m).padStart(2, '0')} ${ampm}` };
  }).filter(Boolean);
}

/* ── Static content ── */

const STEPS = [
  { num: 1, title: 'Share your symptoms and goals', desc: 'Tell us what you’re experiencing — low energy, weight gain, brain fog, or something else.' },
  { num: 2, title: 'We review how you feel and your labs', desc: 'Your provider connects your symptoms to what the data shows (or what we need to test).' },
  { num: 3, title: 'You leave with a written plan and lab recommendation', desc: 'A clear next step — no guesswork, no pressure.' },
];

const FAQS = [
  {
    q: 'Is the $97 visit really credited to labs or treatment?',
    a: 'Yes. If you move forward with labs or treatment within 7 days, we apply your full $97 at checkout.',
  },
  {
    q: 'Do you take insurance?',
    a: 'We are a cash-pay clinic. Many clients use HSA/FSA cards.',
  },
  {
    q: 'What if I need to reschedule?',
    a: 'Email us at info@range-medical.com at least 24 hours before your time and we’ll help you move it.',
  },
];

const REVIEWS = [
  { name: 'Sarah M.', location: 'Newport Beach', text: 'I was skeptical, but after the Assessment I finally understood why I'd been so tired. Six weeks later I feel like myself again.' },
  { name: 'David L.', location: 'Costa Mesa', text: 'I kept telling my doctor I was tired and foggy. They said everything was normal. Range ran deeper labs and found the problem in two weeks.' },
  { name: 'Jennifer K.', location: 'Irvine', text: 'Clear communication, no pressure, and a plan that actually made sense. This is what healthcare should be.' },
];

const WHY_BULLETS = [
  'We start with data, not guesswork',
  'Local clinic focused on hormones, energy, and long-term health',
  'Co-created protocols used by high performers and athletes',
];

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1a1a1a',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      '::placeholder': { color: '#737373' },
    },
    invalid: { color: '#b91c1c' },
  },
};

/* ── Wrapper (provides Stripe context) ── */

export default function LabClarityVisit() {
  return (
    <Elements stripe={stripePromise}>
      <LabClarityContent />
    </Elements>
  );
}

/* ── Page content ── */

function LabClarityContent() {
  const stripe = useStripe();
  const elements = useElements();

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', dob: '', concern: '', agreed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const calendarRef = useRef(null);

  const dates = useMemo(() => getAvailableDates(), []);
  const slots = useMemo(() => (selectedDate ? getSlotsForDate(selectedDate) : []), [selectedDate]);

  function scrollToCalendar() {
    calendarRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleDateSelect(dateStr) {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setError(null);
  }

  function handleSlotSelect(time) {
    setSelectedTime(time);
    setError(null);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !form.agreed || !stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    try {
      const piRes = await fetch('/api/lab-clarity/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: form.fullName.trim(), email: form.email.trim() }),
      });
      const piData = await piRes.json();
      if (!piRes.ok) throw new Error(piData.error || 'Payment initialization failed.');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        piData.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: form.fullName.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
            },
          },
        }
      );

      if (stripeError) throw new Error(stripeError.message);

      const bookRes = await fetch('/api/lab-clarity/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          dob: form.dob || null,
          concern: form.concern.trim() || null,
          date: selectedDate,
          time: selectedTime,
          paymentIntentId: paymentIntent.id,
        }),
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok) throw new Error(bookData.error || 'Booking failed.');

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedDateLabel = selectedDate
    ? dates.find(d => d.dateStr === selectedDate)
    : null;

  const selectedSlotLabel = selectedTime
    ? slots.find(s => s.time === selectedTime)?.label
    : null;

  return (
    <>
      <Head>
        <title>Lab Clarity Visit — Range Medical | Newport Beach</title>
        <meta name="description" content="Match how you feel with what your labs actually show. $97 Lab Clarity Visit at Range Medical in Newport Beach." />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Lab Clarity Visit — Range Medical" />
        <meta property="og:description" content="Not feeling like yourself? Start with a 1-on-1 Lab Clarity Visit. $97, credited toward labs or treatment." />
        <meta property="og:type" content="website" />
      </Head>

      <div style={s.page}>
        {/* ── Hero ── */}
        <section style={s.hero}>
          <div style={s.container}>
            <p style={s.eyebrow}>For Men 40–55 in Newport Beach</p>
            <h1 style={s.h1}>Not Feeling Like Yourself?<br />Start With a Lab Clarity Visit.</h1>
            <p style={s.subhead}>Match how you feel with what your labs actually show — in one 1-on-1 visit.</p>

            <ul style={s.bulletList}>
              <li style={s.bulletItem}><span style={s.bulletCheck}>✓</span> 1-on-1 provider visit on Thursday or Friday</li>
              <li style={s.bulletItem}><span style={s.bulletCheck}>✓</span> Review symptoms, goals, and history</li>
              <li style={s.bulletItem}><span style={s.bulletCheck}>✓</span> Get a simple written plan and recommended labs</li>
              <li style={s.bulletItem}><span style={s.bulletCheck}>✓</span> Your $97 is credited toward any lab panel or treatment you choose in 7 days</li>
            </ul>

            <div style={s.priceBar}>
              <span style={s.priceLabel}>Lab Clarity Visit:</span>
              <span style={s.priceNew}>$97</span>
              <span style={s.priceOld}>$197</span>
            </div>

            <button onClick={scrollToCalendar} style={s.ctaBtn}>
              See Thursday &amp; Friday Times
            </button>
          </div>
        </section>

        {/* ── Choose Your Time ── */}
        <section ref={calendarRef} style={s.sectionAlt} id="choose-time">
          <div style={s.container}>
            <h2 style={s.h2}>Choose Your Thursday or Friday Time</h2>

            {submitted ? (
              <div style={s.successBox}>
                <div style={s.successIcon}>✓</div>
                <h3 style={s.successTitle}>You're booked.</h3>
                <p style={s.successText}>Check your email for the details of your Lab Clarity Visit.</p>
              </div>
            ) : (
              <>
                {/* Date selector */}
                <div className="lcv-dates">
                  {dates.map(d => (
                    <button
                      key={d.dateStr}
                      onClick={() => handleDateSelect(d.dateStr)}
                      style={{
                        ...s.dateBtn,
                        ...(selectedDate === d.dateStr ? s.dateBtnActive : {}),
                      }}
                    >
                      <span style={s.dateDow}>{d.dayName}</span>
                      <span style={s.dateLabel}>{d.label}</span>
                    </button>
                  ))}
                </div>

                {/* Slot grid */}
                {selectedDate && (
                  <div style={{ marginTop: 24 }}>
                    {slots.length > 0 ? (
                      <div className="lcv-slots">
                        {slots.map(slot => (
                          <button
                            key={slot.time}
                            onClick={() => handleSlotSelect(slot.time)}
                            style={{
                              ...s.slotBtn,
                              ...(selectedTime === slot.time ? s.slotBtnActive : {}),
                            }}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p style={s.noSlots}>No available times for this date. Please select another day.</p>
                    )}
                  </div>
                )}

                {/* Booking form */}
                {selectedTime && (
                  <form onSubmit={handleSubmit} style={s.form}>
                    <p style={s.formSummary}>
                      Selected: <strong>{selectedDateLabel?.dayName} {selectedDateLabel?.label}</strong> at <strong>{selectedSlotLabel}</strong>
                    </p>

                    <div style={s.fieldGroup}>
                      <label style={s.label}>Full Name *</label>
                      <input
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                        style={s.input}
                        placeholder="John Smith"
                      />
                    </div>

                    <div style={s.fieldRow}>
                      <div style={s.fieldHalf}>
                        <label style={s.label}>Email *</label>
                        <input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          style={s.input}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div style={s.fieldHalf}>
                        <label style={s.label}>Phone *</label>
                        <input
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleChange}
                          required
                          style={s.input}
                          placeholder="(949) 555-0100"
                        />
                      </div>
                    </div>

                    <div style={s.fieldGroup}>
                      <label style={s.label}>Date of Birth <span style={s.optional}>(optional)</span></label>
                      <input
                        name="dob"
                        type="date"
                        value={form.dob}
                        onChange={handleChange}
                        style={s.input}
                      />
                    </div>

                    <div style={s.fieldGroup}>
                      <label style={s.label}>What's bothering you most right now? <span style={s.optional}>(optional)</span></label>
                      <textarea
                        name="concern"
                        value={form.concern}
                        onChange={handleChange}
                        rows={3}
                        style={{ ...s.input, resize: 'vertical' }}
                        placeholder="Low energy, weight gain, brain fog…"
                      />
                    </div>

                    {/* Payment */}
                    <div style={s.paymentSection}>
                      <div style={s.paymentHeader}>
                        <span style={s.paymentTitle}>Payment</span>
                        <div style={s.paymentPricing}>
                          <span style={s.paymentOld}>$197</span>
                          <span style={s.paymentNew}>$97</span>
                        </div>
                      </div>
                      <div style={s.cardWrapper}>
                        <CardElement options={CARD_OPTIONS} />
                      </div>
                      <p style={s.paymentNote}>Your $97 is credited toward labs or treatment if you continue within 7 days.</p>
                    </div>

                    <label style={s.checkboxLabel}>
                      <input
                        name="agreed"
                        type="checkbox"
                        checked={form.agreed}
                        onChange={handleChange}
                        style={s.checkbox}
                      />
                      <span>I understand this is a $97 cash-pay visit and my $97 is credited toward labs or treatment if I continue within 7 days.</span>
                    </label>

                    {error && <p style={s.error}>{error}</p>}

                    <button
                      type="submit"
                      disabled={submitting || !form.agreed || !stripe}
                      style={{
                        ...s.submitBtn,
                        ...(submitting || !form.agreed || !stripe ? s.submitBtnDisabled : {}),
                      }}
                    >
                      {submitting ? 'Processing payment…' : 'Pay $97 & Book My Visit'}
                    </button>
                  </form>
                )}

                {!selectedDate && (
                  <p style={s.helperText}>
                    Once you choose a time, you'll enter your details and pay the $97 to confirm your visit.
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── What Happens ── */}
        <section style={s.section}>
          <div style={s.container}>
            <h2 style={s.h2}>What Happens in Your Lab Clarity Visit</h2>
            <div className="lcv-steps">
              {STEPS.map(step => (
                <div key={step.num} style={s.stepCard}>
                  <div style={s.stepNum}>Step {step.num}</div>
                  <h3 style={s.stepTitle}>{step.title}</h3>
                  <p style={s.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Range Medical ── */}
        <section style={s.sectionAlt}>
          <div style={s.container}>
            <h2 style={s.h2}>Why Men in Newport Beach Choose Range Medical</h2>
            <ul style={s.whyList}>
              {WHY_BULLETS.map((b, i) => (
                <li key={i} style={s.whyItem}>
                  <span style={s.whyIcon}>✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Reviews ── */}
        <section style={s.section}>
          <div style={s.container}>
            <h2 style={s.h2}>What Our Patients Say</h2>
            <div className="lcv-steps">
              {REVIEWS.map((r, i) => (
                <div key={i} style={s.reviewCard}>
                  <div style={s.stars}>★★★★★</div>
                  <p style={s.reviewText}>"{r.text}"</p>
                  <p style={s.reviewAuthor}>{r.name} <span style={s.reviewLocation}>· {r.location}</span></p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Location ── */}
        <section style={s.section}>
          <div style={s.container}>
            <div style={s.locationBox}>
              <p style={s.locationEyebrow}>Where to Find Us</p>
              <h3 style={s.locationName}>Range Medical · Newport Beach</h3>
              <p style={s.locationAddress}>
                <a
                  href="https://maps.google.com/?q=1901+Westcliff+Drive,+Suite+10,+Newport+Beach,+CA+92660"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={s.locationLink}
                >
                  1901 Westcliff Drive, Suite 10<br />Newport Beach, CA 92660
                </a>
              </p>
              <iframe
                title="Range Medical location map"
                style={s.mapFrame}
                src="https://maps.google.com/maps?q=1901+Westcliff+Drive,+Suite+10,+Newport+Beach,+CA+92660&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={s.sectionAlt}>
          <div style={s.container}>
            <h2 style={s.h2}>Frequently Asked Questions</h2>
            <div style={s.faqList}>
              {FAQS.map((faq, i) => (
                <div key={i} style={s.faqItem}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={s.faqQuestion}
                  >
                    <span>{faq.q}</span>
                    <span style={s.faqArrow}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <p style={s.faqAnswer}>{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={s.footer}>
          <div style={s.container}>
            <div style={s.footerContent}>
              <div>
                <p style={s.footerName}>Range Medical</p>
                <p style={s.footerInfo}>1901 Westcliff Drive, Suite 10</p>
                <p style={s.footerInfo}>Newport Beach, CA 92660</p>
              </div>
              <div>
                <p style={s.footerInfo}>(949) 997-3988</p>
                <p style={s.footerInfo}>info@range-medical.com</p>
              </div>
            </div>
            <p style={s.disclaimer}>
              This page does not provide medical advice. All visits are subject to provider review and medical appropriateness.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ── Styles ── */

const ACCENT = '#2E5D3A';
const TEXT = '#1a1a1a';
const TEXT_MUTED = '#737373';
const BG = '#FAF9F6';
const SURFACE = '#ffffff';
const BORDER = '#e0ddd8';

const s = {
  page: {
    background: BG,
    color: TEXT,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    minHeight: '100vh',
  },

  container: {
    maxWidth: 840,
    margin: '0 auto',
    padding: '0 24px',
  },

  /* Hero */
  hero: {
    background: SURFACE,
    padding: '80px 0 64px',
    borderBottom: `1px solid ${BORDER}`,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: ACCENT,
    marginBottom: 16,
  },
  h1: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(28px, 5vw, 44px)',
    fontWeight: 400,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    color: TEXT,
    marginBottom: 16,
  },
  subhead: {
    fontSize: 18,
    lineHeight: 1.6,
    color: TEXT_MUTED,
    marginBottom: 32,
    maxWidth: 560,
  },
  bulletList: {
    listStyle: 'none',
    padding: 0,
    marginBottom: 32,
  },
  bulletItem: {
    fontSize: 16,
    lineHeight: 1.6,
    color: TEXT,
    padding: '6px 0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletCheck: {
    color: ACCENT,
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
    marginTop: 2,
  },
  priceBar: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 32,
    padding: '16px 20px',
    background: '#f0eeea',
    borderRadius: 8,
    maxWidth: 'fit-content',
  },
  priceLabel: {
    fontSize: 15,
    fontWeight: 500,
    color: TEXT,
  },
  priceNew: {
    fontSize: 28,
    fontWeight: 700,
    color: ACCENT,
  },
  priceOld: {
    fontSize: 18,
    color: TEXT_MUTED,
    textDecoration: 'line-through',
  },
  ctaBtn: {
    display: 'inline-block',
    background: ACCENT,
    color: '#fff',
    border: 'none',
    borderRadius: 999,
    padding: '16px 36px',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },

  /* Sections */
  section: {
    padding: '72px 0',
  },
  sectionAlt: {
    padding: '72px 0',
    background: SURFACE,
  },

  h2: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(24px, 4vw, 34px)',
    fontWeight: 400,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    color: TEXT,
    marginBottom: 32,
    textAlign: 'center',
  },

  /* Date selector */
  dateBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 20px',
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    background: BG,
    cursor: 'pointer',
    transition: 'all 0.15s',
    minWidth: 80,
    flexShrink: 0,
  },
  dateBtnActive: {
    background: ACCENT,
    borderColor: ACCENT,
    color: '#fff',
  },
  dateDow: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: 500,
  },

  /* Slot grid */
  slotBtn: {
    padding: '10px 4px',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    background: BG,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.15s',
    textAlign: 'center',
  },
  slotBtnActive: {
    background: ACCENT,
    borderColor: ACCENT,
    color: '#fff',
  },
  noSlots: {
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 15,
    padding: '24px 0',
  },

  /* Form */
  form: {
    marginTop: 32,
    padding: '32px',
    background: BG,
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
  },
  formSummary: {
    fontSize: 15,
    color: TEXT,
    marginBottom: 24,
    padding: '12px 16px',
    background: SURFACE,
    borderRadius: 8,
    border: `1px solid ${BORDER}`,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  fieldHalf: {
    flex: '1 1 200px',
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: TEXT,
    marginBottom: 6,
  },
  optional: {
    fontWeight: 400,
    color: TEXT_MUTED,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    fontSize: 15,
    fontFamily: 'inherit',
    background: SURFACE,
    color: TEXT,
    outline: 'none',
    boxSizing: 'border-box',
  },

  /* Payment */
  paymentSection: {
    marginBottom: 24,
    padding: '20px 20px 16px',
    background: SURFACE,
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
  },
  paymentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: TEXT,
  },
  paymentPricing: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
  },
  paymentOld: {
    fontSize: 16,
    color: TEXT_MUTED,
    textDecoration: 'line-through',
  },
  paymentNew: {
    fontSize: 22,
    fontWeight: 700,
    color: ACCENT,
  },
  cardWrapper: {
    padding: '12px 14px',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    background: '#fff',
  },
  paymentNote: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 10,
    lineHeight: 1.5,
  },

  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 14,
    lineHeight: 1.5,
    color: TEXT,
    marginBottom: 24,
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: 3,
    flexShrink: 0,
    accentColor: ACCENT,
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
    marginBottom: 16,
    padding: '10px 14px',
    background: '#fef2f2',
    borderRadius: 8,
  },
  submitBtn: {
    width: '100%',
    padding: '14px 24px',
    background: ACCENT,
    color: '#fff',
    border: 'none',
    borderRadius: 999,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  submitBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  helperText: {
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 15,
    marginTop: 24,
    lineHeight: 1.6,
  },

  /* Success */
  successBox: {
    textAlign: 'center',
    padding: '48px 24px',
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: ACCENT,
    color: '#fff',
    fontSize: 28,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 24,
    fontWeight: 500,
    color: TEXT,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: TEXT_MUTED,
    lineHeight: 1.6,
  },

  /* Steps */
  stepCard: {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: '28px 24px',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: ACCENT,
    marginBottom: 8,
  },
  stepTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 500,
    color: TEXT,
    lineHeight: 1.3,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: TEXT_MUTED,
    lineHeight: 1.6,
  },

  /* Why */
  whyList: {
    listStyle: 'none',
    padding: 0,
    maxWidth: 560,
    margin: '0 auto',
  },
  whyItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    fontSize: 16,
    lineHeight: 1.6,
    color: TEXT,
    padding: '10px 0',
  },
  whyIcon: {
    color: ACCENT,
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
    marginTop: 2,
  },

  /* Reviews */
  reviewCard: {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: '24px',
  },
  stars: {
    fontSize: 18,
    color: '#f59e0b',
    letterSpacing: 2,
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 15,
    color: TEXT,
    lineHeight: 1.6,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: 600,
    color: TEXT,
  },
  reviewLocation: {
    fontWeight: 400,
    color: TEXT_MUTED,
  },

  /* Location */
  locationBox: {
    maxWidth: 680,
    margin: '0 auto',
  },
  locationEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: ACCENT,
    marginBottom: 10,
  },
  locationName: {
    fontFamily: "'Fraunces', serif",
    fontSize: 20,
    fontWeight: 700,
    color: TEXT,
    marginBottom: 6,
  },
  locationAddress: {
    fontSize: 15,
    color: TEXT_MUTED,
    lineHeight: 1.55,
    marginBottom: 16,
  },
  locationLink: {
    color: TEXT_MUTED,
    textDecoration: 'none',
    borderBottom: `1px solid ${BORDER}`,
  },
  mapFrame: {
    width: '100%',
    height: 280,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    display: 'block',
  },

  /* FAQ */
  faqList: {
    maxWidth: 640,
    margin: '0 auto',
  },
  faqItem: {
    borderBottom: `1px solid ${BORDER}`,
  },
  faqQuestion: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 0',
    background: 'none',
    border: 'none',
    fontSize: 16,
    fontWeight: 500,
    color: TEXT,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    gap: 16,
  },
  faqArrow: {
    fontSize: 20,
    fontWeight: 300,
    color: TEXT_MUTED,
    flexShrink: 0,
  },
  faqAnswer: {
    fontSize: 15,
    color: TEXT_MUTED,
    lineHeight: 1.6,
    padding: '0 0 18px',
  },

  /* Footer */
  footer: {
    background: TEXT,
    color: '#ccc',
    padding: '48px 0 32px',
  },
  footerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 24,
    marginBottom: 24,
  },
  footerName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    marginBottom: 6,
  },
  footerInfo: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#aaa',
  },
  disclaimer: {
    fontSize: 12,
    color: '#888',
    lineHeight: 1.5,
    borderTop: '1px solid #333',
    paddingTop: 20,
  },
};
