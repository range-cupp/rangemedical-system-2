// pages/offers/[id].jsx
// Embedded new-patient offer funnel.
// Steps: contact info → pick a time → pay → confirmation.

import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { NEW_PATIENT_OFFERS } from '../../lib/offer-config';
import { formatPhone } from '../../lib/format-utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const ACCENT = '#1a1a1a';

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Payment Form (inside Stripe Elements) ────────────────────────────────────

function PaymentForm({ offer, contact, selectedSlot, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError('');

    try {
      const piRes = await fetch('/api/offers/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offer.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
        }),
      });
      const piData = await piRes.json();
      if (piData.alreadyUsed) {
        setError('You\'ve already used a new patient offer. These are limited to one per patient.');
        setProcessing(false);
        return;
      }
      if (!piRes.ok) throw new Error(piData.error || 'Payment failed');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(piData.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: `${contact.firstName} ${contact.lastName}`.trim(),
            email: contact.email,
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
    <form onSubmit={handlePay}>
      <div style={styles.summaryBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>{offer.name}</span>
          <div>
            <span style={{ fontSize: '13px', color: '#a0a0a0', textDecoration: 'line-through', marginRight: 6 }}>{offer.regularPriceDisplay}</span>
            <span style={{ fontWeight: 700, fontSize: '17px', color: ACCENT }}>{offer.priceDisplay}</span>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#737373', margin: '6px 0 0' }}>
          {formatSlotFull(selectedSlot)}
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={styles.fieldLabel}>Card details</label>
        <div style={styles.cardElement}>
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#171717',
                fontFamily: 'Inter, -apple-system, sans-serif',
                '::placeholder': { color: '#a3a3a3' },
              },
              invalid: { color: '#dc2626' },
            },
          }} />
        </div>
      </div>

      {error && <p style={{ color: '#dc2626', fontSize: '14px', margin: '0 0 12px' }}>{error}</p>}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{ ...styles.primaryBtn, opacity: processing ? 0.6 : 1 }}
      >
        {processing ? 'Processing...' : `Pay ${offer.priceDisplay}`}
      </button>

      <p style={{ fontSize: '12px', color: '#a0a0a0', textAlign: 'center', marginTop: 10 }}>
        Secure payment via Stripe. HSA &amp; FSA accepted.
      </p>
    </form>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function OfferFunnel() {
  const router = useRouter();
  const { id } = router.query;

  const offer = NEW_PATIENT_OFFERS.find(o => o.id === id) || null;

  const [step, setStep] = useState('contact');
  const [contact, setContact] = useState({ firstName: '', lastName: '', email: '', phone: '', consent: false });
  const [errors, setErrors] = useState({});
  const [topError, setTopError] = useState('');

  const days = useMemo(() => getNext14Days(), []);
  const [selectedDate, setSelectedDate] = useState('');
  const [slotsByDate, setSlotsByDate] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [bookError, setBookError] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookedTime, setBookedTime] = useState(null);

  useEffect(() => {
    if (days.length > 0 && !selectedDate) setSelectedDate(days[0].dateISO);
  }, [days]);

  useEffect(() => {
    if (step !== 'schedule' || !offer || !selectedDate) return;
    if (slotsByDate[selectedDate] !== undefined) return;
    setLoadingSlots(true);
    fetch(`/api/bookings/slots?serviceSlug=${offer.serviceSlug}&date=${selectedDate}`)
      .then(r => r.json())
      .then(data => {
        const raw = data?.slots;
        const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? (raw[selectedDate] || []) : []);
        setSlotsByDate(prev => ({ ...prev, [selectedDate]: list }));
      })
      .catch(() => setSlotsByDate(prev => ({ ...prev, [selectedDate]: [] })))
      .finally(() => setLoadingSlots(false));
  }, [step, offer, selectedDate]);

  function clearFieldError(field) {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleContactSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!contact.firstName.trim()) next.firstName = 'Please enter your first name.';
    if (!contact.lastName.trim()) next.lastName = 'Please enter your last name.';
    if (!contact.phone.trim()) next.phone = 'Please enter your mobile phone.';
    if (!contact.email.trim()) next.email = 'Please enter your email.';
    if (!contact.consent) next.consent = 'Required to continue.';

    if (Object.keys(next).length > 0) {
      setErrors(next);
      setTopError(`Please fill in the ${Object.keys(next).length} highlighted field${Object.keys(next).length === 1 ? '' : 's'} below.`);
      return;
    }
    setErrors({});
    setTopError('');
    setStep('schedule');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSlotConfirm() {
    if (!selectedSlot) return;
    setStep('pay');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handlePaymentSuccess(paymentIntentId) {
    setBooking(true);
    setBookError('');
    try {
      const res = await fetch('/api/offers/confirm-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          offerId: offer.id,
          slotStart: selectedSlot,
          firstName: contact.firstName.trim(),
          lastName: contact.lastName.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.slotUnavailable) {
          setSlotsByDate(prev => { const n = { ...prev }; delete n[selectedDate]; return n; });
          setSelectedSlot(null);
          setBookError('That time was just taken. Please pick another slot.');
          setStep('schedule');
        } else {
          setBookError(data.error || 'Could not book. Please try again.');
        }
        setBooking(false);
        return;
      }
      setBookedTime(selectedSlot);
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setBookError('Something went wrong. Please try again.');
      setBooking(false);
    }
  }

  if (!id) return null;
  if (!offer) {
    return (
      <Layout title="Offer Not Found">
        <div style={{ textAlign: 'center', padding: '120px 2rem' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 12px' }}>Offer not found</h1>
          <Link href="/#new-patient-offers" className="btn-primary">See Our Offers</Link>
        </div>
      </Layout>
    );
  }

  const stepNum = step === 'contact' ? 1 : step === 'schedule' ? 2 : step === 'pay' ? 3 : 4;

  return (
    <Layout title={`${offer.name} | Range Medical`} logoOnly>
      <Head>
        <meta name="robots" content="noindex" />
        <style>{`
          .of-page { color: #171717; }
          .of-container { max-width: 640px; margin: 0 auto; padding: 0 2rem; }

          .of-hero { padding: 4rem 2rem 2rem; max-width: 640px; margin: 0 auto; }
          .of-eyebrow {
            font-size: 11px; font-weight: 700; letter-spacing: 0.18em;
            text-transform: uppercase; color: ${ACCENT}; margin: 0 0 12px;
          }
          .of-hero h1 {
            font-size: clamp(1.75rem, 4.5vw, 2.25rem);
            font-weight: 800; line-height: 1.1; margin: 0 0 12px; letter-spacing: -0.02em;
          }
          .of-hero .of-sub {
            font-size: 16px; color: #525252; line-height: 1.6; margin: 0 0 8px;
          }
          .of-price-tag {
            display: inline-block; font-size: 22px; font-weight: 800;
            color: ${ACCENT}; margin: 0 0 20px;
          }

          .of-progress { display: flex; gap: 6px; margin-bottom: 28px; }
          .of-progress-step {
            flex: 1; height: 4px; border-radius: 2px; background: #e5e5e5;
            transition: background 0.3s;
          }
          .of-progress-step.active { background: ${ACCENT}; }

          .of-step-card {
            background: #fff; border: 1px solid #e0e0e0; padding: 28px 24px;
            margin-bottom: 3rem;
          }
          .of-step-card h2 {
            font-size: 18px; font-weight: 700; margin: 0 0 6px;
          }
          .of-step-intro {
            font-size: 14px; color: #525252; line-height: 1.5; margin: 0 0 20px;
          }
          .of-field { margin-bottom: 16px; }
          .of-field label {
            display: block; font-size: 13px; font-weight: 600;
            color: #525252; margin-bottom: 5px;
          }
          .of-field input[type="text"],
          .of-field input[type="email"],
          .of-field input[type="tel"] {
            width: 100%; padding: 12px 14px; border: 1px solid #e0e0e0;
            font-size: 15px; font-family: inherit; background: #fff;
            transition: border-color 0.2s; box-sizing: border-box; color: #171717;
          }
          .of-field input:focus { outline: none; border-color: ${ACCENT}; }
          .of-field input.of-has-error { border-color: #DC2626; background: #FEF2F2; }

          .of-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          @media (max-width: 480px) { .of-two-col { grid-template-columns: 1fr; } }

          .of-consent {
            display: flex; align-items: flex-start; gap: 10px; margin: 18px 0 4px;
          }
          .of-consent input[type="checkbox"] {
            width: 20px; height: 20px; min-width: 20px; accent-color: ${ACCENT}; flex-shrink: 0; margin-top: 1px;
          }
          .of-consent label { font-size: 13px; color: #525252; line-height: 1.5; }
          .of-consent.of-has-error {
            border-left: 3px solid #DC2626; background: #FEF2F2; padding: 10px 12px;
          }

          .of-btn {
            width: 100%; padding: 16px; background: ${ACCENT}; color: #fff;
            border: none; font-size: 15px; font-weight: 700; cursor: pointer;
            transition: background 0.2s; font-family: inherit; border-radius: 999px;
            margin-top: 16px; letter-spacing: 0.01em;
          }
          .of-btn:hover:not(:disabled) { background: #000; }
          .of-btn:disabled { opacity: 0.5; cursor: not-allowed; }

          .of-error {
            background: #FEF2F2; color: #DC2626; padding: 12px 16px;
            font-size: 14px; margin-bottom: 16px; border-left: 3px solid #DC2626;
          }
          .of-field-errmsg {
            color: #DC2626; font-size: 13px; font-weight: 600; margin-top: 5px;
          }

          .of-bullets { list-style: none; padding: 0; margin: 0 0 16px; }
          .of-bullets li {
            font-size: 14px; color: #525252; line-height: 1.6;
            padding: 3px 0 3px 18px; position: relative;
          }
          .of-bullets li::before {
            content: ''; position: absolute; left: 0; top: 11px;
            width: 6px; height: 6px; border-radius: 50%;
            background: ${ACCENT}; opacity: 0.4;
          }

          .of-back-link {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 14px; color: #737373; text-decoration: none;
            margin-bottom: 8px; cursor: pointer; border: none; background: none;
            font-family: inherit; padding: 0;
          }
          .of-back-link:hover { color: #171717; }

          .of-where {
            display: flex; align-items: center; gap: 6px;
            font-size: 13px; color: #525252; margin: 0 0 0;
          }
        `}</style>
      </Head>

      <div className="of-page">
        {/* Hero */}
        <section className="of-hero">
          <p className="of-eyebrow">New Patient Offer &middot; Newport Beach</p>
          <h1>{offer.name}</h1>
          <p className="of-sub">{offer.shortDescription}</p>
          <div style={{ margin: '0 0 20px' }}>
            <span style={{ fontSize: '18px', color: '#a0a0a0', textDecoration: 'line-through', marginRight: 8 }}>{offer.regularPriceDisplay}</span>
            <span className="of-price-tag" style={{ margin: 0 }}>{offer.priceDisplay}</span>
            <span style={{ display: 'inline-block', fontSize: '13px', color: '#16a34a', fontWeight: 600, marginLeft: 10 }}>
              Save ${(offer.regularPriceCents - offer.priceCents) / 100}
            </span>
          </div>
          <ul className="of-bullets">
            {offer.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
          <p className="of-where">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            1901 Westcliff Drive, Suite 10, Newport Beach, CA
          </p>
        </section>

        <div className="of-container" style={{ paddingBottom: '4rem' }}>
          {/* Progress bar */}
          {step !== 'done' && (
            <div className="of-progress">
              {[1, 2, 3].map(n => (
                <div key={n} className={`of-progress-step${n <= stepNum ? ' active' : ''}`} />
              ))}
            </div>
          )}

          {/* ── Step 1: Contact Info ── */}
          {step === 'contact' && (
            <form onSubmit={handleContactSubmit}>
              <div className="of-step-card">
                <h2>Step 1: Your Info</h2>
                <p className="of-step-intro">
                  Tell us how to reach you so we can confirm your booking and send visit details.
                </p>

                {topError && <div className="of-error">{topError}</div>}

                <div className="of-two-col" style={{ marginBottom: 16 }}>
                  <div className="of-field" style={{ margin: 0 }}>
                    <label htmlFor="of-first">First name</label>
                    <input
                      id="of-first" type="text" autoComplete="given-name"
                      className={errors.firstName ? 'of-has-error' : ''}
                      value={contact.firstName}
                      onChange={e => { setContact({ ...contact, firstName: e.target.value }); clearFieldError('firstName'); }}
                    />
                    {errors.firstName && <div className="of-field-errmsg">{errors.firstName}</div>}
                  </div>
                  <div className="of-field" style={{ margin: 0 }}>
                    <label htmlFor="of-last">Last name</label>
                    <input
                      id="of-last" type="text" autoComplete="family-name"
                      className={errors.lastName ? 'of-has-error' : ''}
                      value={contact.lastName}
                      onChange={e => { setContact({ ...contact, lastName: e.target.value }); clearFieldError('lastName'); }}
                    />
                    {errors.lastName && <div className="of-field-errmsg">{errors.lastName}</div>}
                  </div>
                </div>

                <div className="of-field">
                  <label htmlFor="of-phone">Mobile phone</label>
                  <input
                    id="of-phone" type="tel" autoComplete="tel" placeholder="(949) 555-0123"
                    className={errors.phone ? 'of-has-error' : ''}
                    value={contact.phone}
                    onChange={e => { setContact({ ...contact, phone: formatPhone(e.target.value) }); clearFieldError('phone'); }}
                  />
                  {errors.phone && <div className="of-field-errmsg">{errors.phone}</div>}
                </div>

                <div className="of-field">
                  <label htmlFor="of-email">Email</label>
                  <input
                    id="of-email" type="email" autoComplete="email"
                    className={errors.email ? 'of-has-error' : ''}
                    value={contact.email}
                    onChange={e => { setContact({ ...contact, email: e.target.value }); clearFieldError('email'); }}
                  />
                  {errors.email && <div className="of-field-errmsg">{errors.email}</div>}
                </div>

                <div className={`of-consent${errors.consent ? ' of-has-error' : ''}`}>
                  <input
                    id="of-consent" type="checkbox"
                    checked={contact.consent}
                    onChange={e => { setContact({ ...contact, consent: e.target.checked }); clearFieldError('consent'); }}
                  />
                  <label htmlFor="of-consent">
                    I consent to receive text messages from Range Medical regarding my care and appointments. Message and data rates may apply. Reply STOP to opt out.
                  </label>
                </div>
                {errors.consent && <div className="of-field-errmsg">{errors.consent}</div>}

                <button type="submit" className="of-btn">
                  Continue &mdash; Pick a Time
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: Schedule ── */}
          {step === 'schedule' && (
            <div className="of-step-card">
              <button className="of-back-link" onClick={() => { setStep('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
                Back
              </button>
              <h2>Step 2: Pick a Time</h2>
              <p className="of-step-intro">
                Pacific time &middot; {offer.durationMinutes} minutes &middot; Newport Beach
              </p>

              {/* Day selector */}
              {[days.slice(0, 7), days.slice(7, 14)].map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                  {row.map(d => {
                    const active = d.dateISO === selectedDate;
                    return (
                      <button
                        key={d.dateISO}
                        onClick={() => { setSelectedDate(d.dateISO); setSelectedSlot(null); }}
                        style={{
                          flex: 1, padding: '8px 0', border: active ? `2px solid ${ACCENT}` : '1px solid #e0e0e0',
                          borderRadius: 8, background: active ? ACCENT : '#fff',
                          color: active ? '#fff' : '#1a1a1a', cursor: 'pointer', textAlign: 'center',
                          fontSize: '12px', fontWeight: 600, lineHeight: 1.3, fontFamily: 'inherit',
                        }}
                      >
                        <span style={{ display: 'block', fontSize: '10px', fontWeight: 500, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.weekdayShort}</span>
                        <span style={{ display: 'block', fontSize: '15px', fontWeight: 700 }}>{d.day}</span>
                        <span style={{ display: 'block', fontSize: '10px', fontWeight: 500, opacity: 0.6 }}>{d.monthShort}</span>
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Slots */}
              <div style={{ padding: '14px 0', borderTop: '1px solid #e5e5e5', marginTop: 10 }}>
                {loadingSlots && (
                  <p style={{ fontSize: '14px', color: '#737373', textAlign: 'center', padding: '20px 0' }}>Loading open times...</p>
                )}
                {!loadingSlots && slotsByDate[selectedDate] && slotsByDate[selectedDate].length === 0 && (
                  <p style={{ fontSize: '14px', color: '#737373', textAlign: 'center', padding: '20px 0' }}>No open times this day. Try another date.</p>
                )}
                {!loadingSlots && slotsByDate[selectedDate] && slotsByDate[selectedDate].length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 7 }}>
                    {slotsByDate[selectedDate].map((slot, i) => {
                      const startISO = slot.start || slot.time || slot;
                      const active = selectedSlot === startISO;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedSlot(startISO)}
                          style={{
                            padding: '10px 6px', border: active ? `2px solid ${ACCENT}` : '1px solid #e0e0e0',
                            borderRadius: 8, background: active ? ACCENT : '#fff',
                            color: active ? '#fff' : '#1a1a1a', cursor: 'pointer',
                            fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
                          }}
                        >
                          {formatSlotTime(startISO)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedSlot && (
                <>
                  <p style={{ fontSize: '14px', color: '#525252', textAlign: 'center', margin: '8px 0 0' }}>
                    {formatSlotFull(selectedSlot)}
                  </p>
                  <button className="of-btn" onClick={handleSlotConfirm}>
                    Continue &mdash; Payment
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Step 3: Pay ── */}
          {step === 'pay' && (
            <div className="of-step-card">
              <button className="of-back-link" onClick={() => { setStep('schedule'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
                Back
              </button>
              <h2>Step 3: Payment</h2>
              <p className="of-step-intro">
                Complete your purchase to confirm your booking.
              </p>

              {bookError && <div className="of-error">{bookError}</div>}

              <Elements stripe={stripePromise}>
                <PaymentForm
                  offer={offer}
                  contact={contact}
                  selectedSlot={selectedSlot}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0 40px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 8px' }}>You&apos;re all set.</h1>
              <p style={{ fontSize: '16px', color: '#525252', lineHeight: 1.6 }}>
                Your <strong>{offer.name}</strong> is booked for:
              </p>
              <p style={{ fontSize: '20px', fontWeight: 700, margin: '14px 0', color: '#1a1a1a' }}>
                {formatSlotFull(bookedTime)}
              </p>

              <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 12, padding: '18px 22px', margin: '20px 0', textAlign: 'left' }}>
                <p style={{ fontSize: '13px', color: '#737373', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</p>
                <p style={{ fontSize: '15px', color: '#1a1a1a', margin: '0 0 8px', fontWeight: 600 }}>Range Medical</p>
                <p style={{ fontSize: '14px', color: '#525252', margin: 0, lineHeight: 1.5 }}>
                  1901 Westcliff Dr, Suite 10<br />Newport Beach, CA 92660
                </p>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', margin: '14px 0', textAlign: 'left' }}>
                <p style={{ fontSize: '14px', color: '#15803d', margin: 0, lineHeight: 1.6 }}>
                  We&apos;ll send you a confirmation text shortly. During your visit, we may ask a few questions about your energy, sleep, and recovery to see if a Range Assessment could help.
                </p>
              </div>

              <p style={{ fontSize: '14px', color: '#a0a0a0', marginTop: '1.5rem' }}>
                Questions? Call or text <a href="tel:9499973988" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>(949) 997-3988</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  summaryBox: {
    background: '#fafafa',
    border: '1px solid #e5e5e5',
    borderRadius: 10,
    padding: '16px 18px',
    marginBottom: 20,
  },
  fieldLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#525252',
    marginBottom: 6,
  },
  cardElement: {
    padding: '14px',
    border: '1px solid #e0e0e0',
    background: '#fff',
    transition: 'border-color 0.2s',
  },
  primaryBtn: {
    width: '100%',
    padding: '16px',
    background: ACCENT,
    color: '#fff',
    border: 'none',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    borderRadius: 999,
    letterSpacing: '0.01em',
  },
};
