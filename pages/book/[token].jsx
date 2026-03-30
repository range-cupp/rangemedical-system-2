// pages/book/[token].jsx
// Patient self-booking page for in-clinic HRT and weight loss injections
// Uses protocol access_token — reusable link, not one-time
import Layout from '../../components/Layout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SelfBooking() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [step, setStep] = useState('pick'); // pick | calendar | confirmed
  const [selectedOption, setSelectedOption] = useState(null);

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [eventTypeId, setEventTypeId] = useState(null);
  const [calendarDates, setCalendarDates] = useState([]);
  const [bookingResult, setBookingResult] = useState(null);

  // Validate token on load
  useEffect(() => {
    if (!token) return;
    async function validate() {
      try {
        const res = await fetch(`/api/book/validate?token=${token}`);
        const result = await res.json();
        if (!res.ok || !result.valid) {
          setError(result.message || result.error || 'This booking link is not valid.');
        } else {
          setData(result);
          // If only one booking option, auto-select it
          if (result.bookingOptions.length === 1) {
            setSelectedOption(result.bookingOptions[0]);
            setStep('calendar');
          }
        }
      } catch {
        setError('Something went wrong. Please try again.');
      }
      setLoading(false);
    }
    validate();
  }, [token]);

  // Build next 14 days in Pacific Time
  useEffect(() => {
    if (step !== 'calendar') return;
    const dates = [];
    const now = new Date();
    const todayPST = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    for (let i = 0; i < 14; i++) {
      const d = new Date(todayPST);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    setCalendarDates(dates);
    setSelectedDate(formatDate(dates[0]));
  }, [step]);

  // Fetch event type ID when option is selected
  useEffect(() => {
    if (!selectedOption) return;
    async function fetchEventTypes() {
      try {
        const res = await fetch('/api/bookings/event-types');
        const result = await res.json();
        if (result.eventTypes) {
          const match = result.eventTypes.find((et) => et.slug === selectedOption.slug);
          if (match) setEventTypeId(match.id);
        }
      } catch (err) {
        console.error('Failed to fetch event types:', err);
      }
    }
    fetchEventTypes();
  }, [selectedOption]);

  // Fetch slots when date or event type changes
  useEffect(() => {
    if (!selectedDate || !eventTypeId) return;
    setSlotsLoading(true);
    setSelectedSlot(null);

    async function fetchSlots() {
      try {
        const res = await fetch(`/api/book/slots?date=${selectedDate}&eventTypeId=${eventTypeId}`);
        const result = await res.json();
        if (result.slots) {
          const allSlots = [];
          for (const dateSlots of Object.values(result.slots)) {
            for (const slot of dateSlots) {
              const slotTime = new Date(slot.start || slot.time);
              const slotDatePST = slotTime.toLocaleDateString('en-US', {
                timeZone: 'America/Los_Angeles',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              }).split('/');
              const slotDateStr = `${slotDatePST[2]}-${slotDatePST[0]}-${slotDatePST[1]}`;
              if (slotDateStr === selectedDate) {
                allSlots.push(slot);
              }
            }
          }
          allSlots.sort((a, b) => new Date(a.start || a.time) - new Date(b.start || b.time));
          setSlots(allSlots);
        } else {
          setSlots([]);
        }
      } catch {
        setSlots([]);
      }
      setSlotsLoading(false);
    }
    fetchSlots();
  }, [selectedDate, eventTypeId]);

  // Book the slot
  async function handleBook() {
    if (!selectedSlot || booking) return;
    setBooking(true);

    try {
      const res = await fetch('/api/book/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          eventTypeId,
          slug: selectedOption.slug,
          slotStart: selectedSlot.start || selectedSlot.time,
          patientName: data.patient.name,
          patientEmail: data.patient.email,
          patientPhone: data.patient.phone,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setBookingResult(result.booking);
        setStep('confirmed');
      } else {
        alert(result.error || 'Booking failed. Please try another time.');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    }
    setBooking(false);
  }

  function selectOption(option) {
    setSelectedOption(option);
    setStep('calendar');
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout title="Book Your Injection | Range Medical">
        <Head><meta name="robots" content="noindex, nofollow" /></Head>
        <div style={s.center}><p style={s.loadingText}>Loading...</p></div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Book Your Injection | Range Medical">
        <Head><meta name="robots" content="noindex, nofollow" /></Head>
        <div style={s.center}>
          <div style={s.errorCard}>
            <h2 style={s.errorTitle}>Link Not Found</h2>
            <p style={s.errorText}>{error}</p>
            <p style={s.errorText}>
              Need help? Call <a href="tel:+19495395023" style={{ color: '#111', fontWeight: 600 }}>(949) 539-5023</a> or{' '}
              <a href="sms:+19495395023" style={{ color: '#111', fontWeight: 600 }}>text us</a>.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const firstName = data?.patient?.firstName || 'there';
  const hasMultipleOptions = data?.bookingOptions?.length > 1;

  return (
    <Layout title="Book Your Injection | Range Medical" description="Book your next injection at Range Medical.">
      <Head><meta name="robots" content="noindex, nofollow" /></Head>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.container}>
          <h1 style={s.heroTitle}>Hey {firstName} — book your next injection</h1>
          <p style={s.heroSub}>Pick a time that works for you and we will have everything ready when you arrive.</p>
        </div>
      </section>

      {/* Step: Pick injection type (only if multiple protocols) */}
      {step === 'pick' && hasMultipleOptions && (
        <section style={s.section}>
          <div style={s.container}>
            <div style={s.kicker}>Your Protocols</div>
            <h2 style={s.sectionTitle}>Which injection are you booking?</h2>
            <p style={s.sectionSub}>Select the injection and we will show you available times.</p>

            <div style={s.optionsGrid}>
              {data.bookingOptions.map((opt) => (
                <button
                  key={opt.slug}
                  onClick={() => selectOption(opt)}
                  style={s.optionCard}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#111'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                >
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>{opt.icon}</div>
                  <h3 style={s.optionName}>{opt.label}</h3>
                  <p style={s.optionSubtitle}>{opt.subtitle}</p>
                  <div style={s.optionDuration}>{opt.duration}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Step: Calendar */}
      {step === 'calendar' && (
        <section style={s.section}>
          <div style={s.container}>
            {hasMultipleOptions && (
              <button onClick={() => { setStep('pick'); setSelectedOption(null); setSlots([]); setSelectedDate(null); setEventTypeId(null); }} style={s.backBtn}>
                ← Change injection
              </button>
            )}

            <div style={s.kicker}>{selectedOption?.label}</div>
            <h2 style={s.sectionTitle}>Pick a Date & Time</h2>
            <p style={s.sectionSub}>Select a day, then choose an available time slot.</p>

            {/* Date picker */}
            <div style={s.dateRow}>
              {calendarDates.map((d) => {
                const dateStr = formatDate(d);
                const isSelected = dateStr === selectedDate;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    style={{
                      ...s.dateBtn,
                      ...(isSelected ? s.dateBtnActive : {}),
                    }}
                  >
                    <span style={s.dateDow}>{d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Los_Angeles' })}</span>
                    <span style={s.dateDay}>{d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/Los_Angeles' })}</span>
                    <span style={s.dateMonth}>{d.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/Los_Angeles' })}</span>
                  </button>
                );
              })}
            </div>

            {/* Time slots */}
            <div style={s.slotsArea}>
              {slotsLoading ? (
                <p style={s.slotsMsg}>Loading available times...</p>
              ) : slots.length === 0 ? (
                <div style={s.noSlotsBox}>
                  <p style={s.noSlotsText}>No openings on this day.</p>
                  <p style={s.noSlotsText}>Try another date, or reach out and we will get you in:</p>
                  <div style={s.contactRow}>
                    <a href="sms:+19495395023" style={s.contactBtn}>Text Us</a>
                    <a href="tel:+19495395023" style={s.contactBtnOutline}>Call (949) 539-5023</a>
                  </div>
                </div>
              ) : (
                <>
                  <div style={s.slotsGrid}>
                    {slots.map((slot, i) => {
                      const time = new Date(slot.start || slot.time);
                      const label = time.toLocaleTimeString('en-US', {
                        timeZone: 'America/Los_Angeles',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      });
                      const isSelected = selectedSlot && (selectedSlot.start || selectedSlot.time) === (slot.start || slot.time);
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            ...s.slotBtn,
                            ...(isSelected ? s.slotBtnActive : {}),
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {selectedSlot && (
                    <div style={s.confirmArea}>
                      <p style={s.confirmText}>
                        {selectedOption?.label} on{' '}
                        <strong>
                          {new Date(selectedSlot.start || selectedSlot.time).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'America/Los_Angeles',
                          })}
                        </strong>{' '}
                        at{' '}
                        <strong>
                          {new Date(selectedSlot.start || selectedSlot.time).toLocaleTimeString('en-US', {
                            timeZone: 'America/Los_Angeles',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </strong>
                      </p>
                      <button onClick={handleBook} disabled={booking} style={s.bookBtn}>
                        {booking ? 'Booking...' : 'Book My Injection'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Step: Confirmed */}
      {step === 'confirmed' && (
        <section style={s.section}>
          <div style={s.container}>
            <div style={s.confirmedCard}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
              <h2 style={s.confirmedTitle}>You are all set!</h2>
              <p style={s.confirmedText}>
                Your {selectedOption?.label?.toLowerCase()} is booked{bookingResult?.assignedTo ? ` with ${bookingResult.assignedTo}` : ''}.
                You will receive a confirmation text shortly.
              </p>
              <p style={s.confirmedText}>
                See you at Range Medical!
              </p>
              <p style={{ ...s.confirmedText, marginTop: '24px', fontSize: '14px', color: '#9ca3af' }}>
                Need to reschedule? Call <a href="tel:+19495395023" style={{ color: '#111', fontWeight: 600 }}>(949) 539-5023</a> or{' '}
                <a href="sms:+19495395023" style={{ color: '#111', fontWeight: 600 }}>text us</a>.
              </p>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Styles ──────────────────────────────────────────────────────────────────

const s = {
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '24px' },
  loadingText: { color: '#6b7280', fontSize: '16px' },
  errorCard: { textAlign: 'center', maxWidth: '420px' },
  errorTitle: { fontSize: '22px', fontWeight: 700, color: '#111', margin: '0 0 12px' },
  errorText: { fontSize: '15px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 8px' },

  hero: { textAlign: 'center', padding: '64px 24px 40px', background: '#fafafa' },
  container: { maxWidth: '640px', margin: '0 auto' },
  heroTitle: { fontSize: '28px', fontWeight: 800, color: '#111', margin: '0 0 12px', lineHeight: 1.2 },
  heroSub: { fontSize: '16px', color: '#6b7280', lineHeight: 1.6, margin: 0 },

  section: { padding: '48px 24px' },
  kicker: { fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '8px', textAlign: 'center' },
  sectionTitle: { fontSize: '24px', fontWeight: 700, color: '#111', margin: '0 0 8px', textAlign: 'center' },
  sectionSub: { fontSize: '15px', color: '#6b7280', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.6 },

  optionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', maxWidth: '600px', margin: '0 auto' },
  optionCard: {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0', padding: '32px 24px',
    textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s',
    display: 'flex', flexDirection: 'column', alignItems: 'center', outline: 'none',
  },
  optionName: { fontSize: '18px', fontWeight: 700, color: '#111', margin: '0 0 4px' },
  optionSubtitle: { fontSize: '13px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' },
  optionDuration: { fontSize: '13px', color: '#9ca3af', fontWeight: 500 },

  backBtn: { background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer', padding: 0, display: 'block', margin: '0 auto 16px', outline: 'none' },

  dateRow: { display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0 16px', marginBottom: '8px' },
  dateBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
    padding: '10px 14px', border: '1px solid #e5e7eb', background: '#fff',
    cursor: 'pointer', minWidth: '64px', borderRadius: '0', transition: 'all 0.15s', outline: 'none',
  },
  dateBtnActive: { borderColor: '#111', background: '#111', color: '#fff' },
  dateDow: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  dateDay: { fontSize: '20px', fontWeight: 700 },
  dateMonth: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' },

  slotsArea: { minHeight: '200px' },
  slotsMsg: { textAlign: 'center', color: '#9ca3af', fontSize: '15px', padding: '40px 0' },
  noSlotsBox: { textAlign: 'center', padding: '32px 16px' },
  noSlotsText: { fontSize: '15px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 8px' },
  contactRow: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' },
  contactBtn: {
    background: '#111', color: '#fff', padding: '12px 28px', fontSize: '15px', fontWeight: 600,
    textDecoration: 'none', display: 'inline-block',
  },
  contactBtnOutline: {
    background: '#fff', color: '#111', padding: '12px 28px', fontSize: '15px', fontWeight: 600,
    border: '1px solid #111', textDecoration: 'none', display: 'inline-block',
  },
  slotsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' },
  slotBtn: {
    padding: '12px 8px', border: '1px solid #e5e7eb', background: '#fff',
    fontSize: '14px', fontWeight: 500, color: '#111', cursor: 'pointer',
    borderRadius: '0', transition: 'all 0.15s', textAlign: 'center', outline: 'none',
  },
  slotBtnActive: { borderColor: '#111', background: '#111', color: '#fff' },

  confirmArea: { textAlign: 'center', marginTop: '32px', padding: '24px', background: '#fafafa', border: '1px solid #e5e7eb' },
  confirmText: { fontSize: '15px', color: '#374151', lineHeight: 1.6, margin: '0 0 20px' },
  bookBtn: {
    background: '#111', color: '#fff', border: 'none', padding: '14px 40px',
    fontSize: '16px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px',
    transition: 'opacity 0.2s', outline: 'none',
  },

  confirmedCard: { textAlign: 'center', padding: '48px 24px' },
  confirmedTitle: { fontSize: '24px', fontWeight: 700, color: '#111', margin: '0 0 16px' },
  confirmedText: { fontSize: '16px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 8px' },
};
