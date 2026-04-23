// /components/FreeSessionScheduler.js
// Post-form scheduler for the free HBOT / RLT session opt-in.
// Phases: schedule (pick date + slot) -> pay (save card via SetupIntent +
// agree to $25 no-show fee) -> booking (in-flight) -> done (confirmation).
// Falls back to a plain "we'll text you" screen if Cal.com / Stripe config
// is missing so the form submit never strands the lead.

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

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

// ─────────────────────────────────────────────────────────────────────────────

function PaymentForm({
  selectedSlot, agreed, onAgreedChange, accent, trialLabel,
  sessionDurationMinutes, onBack, onBook, errorMsg,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [localError, setLocalError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!agreed) {
      setLocalError('Please check the box to agree to the $25 no-show fee.');
      return;
    }
    setProcessing(true);
    setLocalError('');
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?setup=complete`;
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });
      if (error) {
        console.error('Stripe confirmSetup error:', error);
        throw new Error(error.message || 'Card could not be verified. Please check the details and try again.');
      }

      const paymentMethodId = setupIntent?.payment_method;
      if (!paymentMethodId) throw new Error('Card verified but no payment method returned. Please try again.');

      await onBook(paymentMethodId);
    } catch (err) {
      console.error('Payment step error:', err);
      setLocalError(err.message || 'Something went wrong.');
    } finally {
      setProcessing(false);
    }
  };

  const showError = localError || errorMsg;

  return (
    <form onSubmit={submit}>
      <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', padding: 16, marginBottom: 18 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#737373', margin: '0 0 6px' }}>Your free session</p>
        <p style={{ fontSize: 16, color: '#171717', margin: '0 0 2px', fontWeight: 700 }}>{formatSlotFull(selectedSlot)}</p>
        <p style={{ fontSize: 13, color: '#737373', margin: 0 }}>{sessionDurationMinutes} minutes · {trialLabel} · 1901 Westcliff Dr #10, Newport Beach</p>
      </div>

      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#171717', margin: '0 0 4px' }}>Card for the no-show hold</p>
        <p style={{ fontSize: 12, color: '#737373', margin: '0 0 10px', lineHeight: 1.5 }}>
          We only charge $25 if you don&apos;t show up and haven&apos;t texted us at least an hour ahead. The session itself is free.
        </p>
        <div style={{ border: '1px solid #e0e0e0', padding: '12px 14px', background: '#fff' }}>
          <PaymentElement />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0 14px' }}>
        <input
          id="fs-noshow"
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreedChange(e.target.checked)}
          style={{ width: 22, height: 22, minWidth: 22, minHeight: 22, accentColor: accent, marginTop: 0 }}
        />
        <label htmlFor="fs-noshow" style={{ fontSize: 13, color: '#404040', lineHeight: 1.5 }}>
          I agree to a <strong>$25 no-show fee</strong> if I don&apos;t show up and haven&apos;t cancelled or rescheduled at least an hour ahead. The card above will be charged only in that case.
        </label>
      </div>

      {showError && (
        <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px 14px', fontSize: 14, marginBottom: 12, borderLeft: '3px solid #DC2626' }}>
          {showError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={onBack}
          disabled={processing}
          style={{ padding: '16px 22px', background: '#fff', color: '#171717', border: '1px solid #d4d4d4', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || !agreed || processing}
          style={{
            flex: 1, padding: 16, background: processing ? '#404040' : accent, color: '#fff',
            border: 'none', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: (!stripe || !agreed || processing) ? 'not-allowed' : 'pointer',
            opacity: (!stripe || !agreed || processing) ? 0.6 : 1, fontFamily: 'inherit',
          }}
        >
          {processing ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'fs-spin 0.8s linear infinite' }} />
              Booking…
            </span>
          ) : 'Book My Free Session'}
        </button>
        <style>{`@keyframes fs-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function BookedDone({ firstName, bookedStart, sessionDurationMinutes, trialLabel, accent, accentBg }) {
  return (
    <section style={{ maxWidth: 560, margin: '0 auto', padding: '6rem 2rem 4rem', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, background: accent, borderRadius: '50%', marginBottom: 20 }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      </div>
      <h1 style={{ fontSize: 'clamp(1.75rem, 4.5vw, 2.25rem)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
        You&apos;re booked, {firstName}!
      </h1>
      <p style={{ fontSize: 17, color: '#171717', margin: '0 0 6px', fontWeight: 700 }}>
        {formatSlotFull(bookedStart)}
      </p>
      <p style={{ fontSize: 14, color: '#525252', margin: '0 0 12px', lineHeight: 1.6 }}>
        {sessionDurationMinutes}-minute {trialLabel} session · 1901 Westcliff Dr #10, Newport Beach
      </p>
      <div style={{ background: accentBg, border: `1px solid ${accent}`, padding: '14px 18px', margin: '24px auto 0', textAlign: 'left', maxWidth: 480 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>Card on file</p>
        <p style={{ fontSize: 13, color: '#404040', margin: 0, lineHeight: 1.5 }}>
          We&apos;ll only charge $25 if you don&apos;t show and haven&apos;t texted us at least an hour ahead.
        </p>
      </div>
      <p style={{ marginTop: 24, fontSize: 14, color: '#737373' }}>
        Need to change or cancel? Call/text{' '}
        <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600, textDecoration: 'none' }}>(949) 997-3988</a>
      </p>
    </section>
  );
}

function FallbackDone({ firstName, accent }) {
  return (
    <section style={{ maxWidth: 560, margin: '0 auto', padding: '6rem 2rem 4rem', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, background: accent, borderRadius: '50%', marginBottom: 20 }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      </div>
      <h1 style={{ fontSize: 'clamp(1.75rem, 4.5vw, 2.25rem)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
        You&apos;re in, {firstName}!
      </h1>
      <p style={{ fontSize: 16, color: '#525252', margin: '0 0 12px', lineHeight: 1.6 }}>
        Your free session is reserved. We&apos;ll text you within a business day to pick a time.
      </p>
      <p style={{ fontSize: 14, color: '#737373', marginTop: 18 }}>
        Questions? Call/text{' '}
        <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600, textDecoration: 'none' }}>(949) 997-3988</a>
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function FreeSessionScheduler({
  trialId,
  eventTypeId,
  setupClientSecret,
  sessionDurationMinutes = 60,
  trialLabel = 'HBOT',
  accentColor = '#171717',
  accentBg = '#fafafa',
  firstName = 'there',
}) {
  const [phase, setPhase] = useState('schedule');
  const days = useMemoDays();
  const [selectedDate, setSelectedDate] = useState(days[0].dateISO);
  const [slotsByDate, setSlotsByDate] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [noShowAgreed, setNoShowAgreed] = useState(false);
  const [bookError, setBookError] = useState('');
  const [bookedStart, setBookedStart] = useState(null);

  useEffect(() => {
    if (!eventTypeId || !selectedDate) return;
    if (slotsByDate[selectedDate] !== undefined) return;
    setLoadingSlots(true);
    fetch(`/api/bookings/slots?eventTypeId=${eventTypeId}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        const raw = data?.slots;
        // Cal.com v2 returns { 'YYYY-MM-DD': [{ start: iso }] } for format=range
        const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? (raw[selectedDate] || []) : []);
        setSlotsByDate((prev) => ({ ...prev, [selectedDate]: list }));
      })
      .catch(() => setSlotsByDate((prev) => ({ ...prev, [selectedDate]: [] })))
      .finally(() => setLoadingSlots(false));
  }, [eventTypeId, selectedDate]);

  if (!eventTypeId || !setupClientSecret || !stripePromise) {
    return <FallbackDone firstName={firstName} accent={accentColor} />;
  }

  if (phase === 'done') {
    return (
      <BookedDone
        firstName={firstName}
        bookedStart={bookedStart}
        sessionDurationMinutes={sessionDurationMinutes}
        trialLabel={trialLabel}
        accent={accentColor}
        accentBg={accentBg}
      />
    );
  }

  const slots = slotsByDate[selectedDate];

  return (
    <section style={{ maxWidth: 680, margin: '0 auto', padding: '48px 2rem 4rem' }}>
      {phase === 'schedule' && (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a3a3a3', margin: '0 0 6px' }}>Final step</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 1.75rem)', fontWeight: 800, letterSpacing: '-0.01em', margin: 0 }}>
            Pick a time that works for you
          </h2>
          <p style={{ fontSize: 14, color: '#525252', margin: '8px 0 22px', lineHeight: 1.5 }}>
            Pacific time · {sessionDurationMinutes} minutes · Newport Beach. On the next step you&apos;ll add a card for a $25 no-show hold (only charged if you miss it).
          </p>

          <DaySelector days={days.slice(0, 7)} selectedDate={selectedDate} onChange={(d) => { setSelectedDate(d); setSelectedSlot(null); }} accent={accentColor} />
          <DaySelector days={days.slice(7, 14)} selectedDate={selectedDate} onChange={(d) => { setSelectedDate(d); setSelectedSlot(null); }} accent={accentColor} />

          <div style={{ padding: '16px 0', borderTop: '1px solid #e5e5e5', marginTop: 12 }}>
            {loadingSlots && (
              <p style={{ fontSize: 14, color: '#737373', textAlign: 'center', padding: '24px 0' }}>Loading open times…</p>
            )}
            {!loadingSlots && slots?.length === 0 && (
              <p style={{ fontSize: 14, color: '#737373', textAlign: 'center', padding: '24px 0' }}>
                No openings this day. Try another day — or reply to the text we sent and we&apos;ll find time.
              </p>
            )}
            {!loadingSlots && slots?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))', gap: 8 }}>
                {slots.map((slot) => {
                  const iso = typeof slot === 'string' ? slot : slot.start;
                  const active = selectedSlot === iso;
                  return (
                    <button key={iso} type="button" onClick={() => setSelectedSlot(iso)}
                      style={{
                        padding: '12px 6px', background: active ? accentColor : '#fff',
                        color: active ? '#fff' : '#171717',
                        border: `1px solid ${active ? accentColor : '#e0e0e0'}`,
                        cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                      }}>
                      {formatSlotTime(iso)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {bookError && (
            <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px 14px', fontSize: 14, margin: '12px 0', borderLeft: '3px solid #DC2626' }}>
              {bookError}
            </div>
          )}

          <button type="button" disabled={!selectedSlot}
            onClick={() => { setBookError(''); setPhase('pay'); }}
            style={{
              width: '100%', padding: 18, marginTop: 18,
              background: selectedSlot ? accentColor : '#a3a3a3',
              color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: selectedSlot ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', opacity: selectedSlot ? 1 : 0.6,
            }}>
            {selectedSlot ? 'Continue — add card & confirm' : 'Pick a time to continue'}
          </button>
        </>
      )}

      {phase === 'pay' && (
        <Elements stripe={stripePromise} options={{ clientSecret: setupClientSecret, appearance: { theme: 'stripe' } }}>
          <PaymentForm
            selectedSlot={selectedSlot}
            agreed={noShowAgreed}
            onAgreedChange={setNoShowAgreed}
            accent={accentColor}
            trialLabel={trialLabel}
            sessionDurationMinutes={sessionDurationMinutes}
            onBack={() => setPhase('schedule')}
            errorMsg={bookError}
            onBook={async (paymentMethodId) => {
              setBookError('');
              setPhase('booking');
              try {
                const res = await fetch('/api/free-session/book', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    trialId, eventTypeId,
                    slotStart: selectedSlot,
                    paymentMethodId,
                    noShowAgreed: true,
                  }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setBookError(data.error || 'Could not book. Please try again.');
                  if (data.slotUnavailable) {
                    setSlotsByDate((prev) => { const n = { ...prev }; delete n[selectedDate]; return n; });
                    setSelectedSlot(null);
                    setPhase('schedule');
                  } else {
                    setPhase('pay');
                  }
                  return;
                }
                setBookedStart(data.scheduledStart || selectedSlot);
                setPhase('done');
              } catch (err) {
                setBookError(err.message || 'Could not book. Please try again.');
                setPhase('pay');
              }
            }}
          />
        </Elements>
      )}

      {phase === 'booking' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `3px solid ${accentColor}33`, borderTopColor: accentColor, borderRadius: '50%', animation: 'fs-spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 16, color: '#171717', fontWeight: 700, margin: '18px 0 4px' }}>Booking your session…</p>
          <p style={{ fontSize: 13, color: '#737373', margin: 0 }}>Holding your time and saving your card — just a moment.</p>
          <style>{`@keyframes fs-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </section>
  );
}

// cheap memoization so days[0] is stable across renders
function useMemoDays() {
  const [d] = useState(() => getNext14Days());
  return d;
}

function DaySelector({ days, selectedDate, onChange, accent }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginBottom: 8 }}>
      {days.map((d) => {
        const active = selectedDate === d.dateISO;
        return (
          <button key={d.dateISO} type="button" onClick={() => onChange(d.dateISO)}
            style={{
              padding: '10px 4px',
              background: active ? accent : '#fff',
              color: active ? '#fff' : '#171717',
              border: `1px solid ${active ? accent : '#e0e0e0'}`,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.85 }}>{d.weekdayShort}</div>
            <div style={{ fontSize: 18, fontWeight: 700, margin: '2px 0' }}>{d.day}</div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>{d.monthShort}</div>
          </button>
        );
      })}
    </div>
  );
}
