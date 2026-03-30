// pages/birthday/[token].jsx
// Birthday gift landing page — patient picks injection type, selects a time, books
import Layout from '../../components/Layout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// ── Injection options ────────────────────────────────────────────────────────

const INJECTION_OPTIONS = [
  {
    id: 'range-injections',
    name: 'Range Injection',
    subtitle: 'Vitamin & Amino Acid',
    description: 'Choose from B12, amino acids, glutathione, and other vitamin injections. Quick — in and out in 5 minutes.',
    icon: '\u{1F489}',
    duration: '~5 min',
  },
  {
    id: 'nad-injection',
    name: 'NAD+ Injection',
    subtitle: 'Cellular Energy',
    description: 'NAD+ subcutaneous injection for cellular repair, energy, and anti-aging benefits.',
    icon: '\u26A1',
    duration: '~5 min',
  },
];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function BirthdayGift() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [giftData, setGiftData] = useState(null);
  const [step, setStep] = useState('pick'); // pick | calendar | confirmed
  const [selectedType, setSelectedType] = useState(null);

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [eventTypeId, setEventTypeId] = useState(null);
  const [calendarDates, setCalendarDates] = useState([]);

  // Validate token on load
  useEffect(() => {
    if (!token) return;
    async function validate() {
      try {
        const res = await fetch(`/api/birthday/validate?token=${token}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setError(data.message || data.error || 'This gift link is not valid.');
        } else {
          setGiftData(data);
        }
      } catch {
        setError('Something went wrong. Please try again.');
      }
      setLoading(false);
    }
    validate();
  }, [token]);

  // Build next 14 days of dates when calendar step loads (in Pacific Time)
  useEffect(() => {
    if (step !== 'calendar') return;
    const dates = [];
    const now = new Date();
    // Get today's date in PST
    const todayPST = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    for (let i = 0; i < 14; i++) {
      const d = new Date(todayPST);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    setCalendarDates(dates);
    // Auto-select today
    setSelectedDate(formatDate(dates[0]));
  }, [step]);

  // Fetch event type ID when injection type is selected
  useEffect(() => {
    if (!selectedType) return;
    async function fetchEventTypes() {
      try {
        const res = await fetch('/api/bookings/event-types');
        const data = await res.json();
        if (data.eventTypes) {
          const match = data.eventTypes.find((et) => et.slug === selectedType);
          if (match) setEventTypeId(match.id);
        }
      } catch (err) {
        console.error('Failed to fetch event types:', err);
      }
    }
    fetchEventTypes();
  }, [selectedType]);

  // Fetch slots when date or event type changes
  useEffect(() => {
    if (!selectedDate || !eventTypeId || !selectedType) return;
    setSlotsLoading(true);
    setSelectedSlot(null);

    async function fetchSlots() {
      try {
        const res = await fetch(`/api/birthday/slots?type=${selectedType}&date=${selectedDate}&eventTypeId=${eventTypeId}`);
        const data = await res.json();
        if (data.slots) {
          // Flatten slots from date-keyed object, filtering to only slots on the selected PST date
          const allSlots = [];
          for (const dateSlots of Object.values(data.slots)) {
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
          // Sort by time
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
  }, [selectedDate, eventTypeId, selectedType]);

  // Book the slot
  async function handleBook() {
    if (!selectedSlot || booking) return;
    setBooking(true);

    try {
      const res = await fetch('/api/birthday/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          injectionType: selectedType,
          eventTypeId,
          slotStart: selectedSlot.start || selectedSlot.time,
          patientName: giftData.patient.name,
          patientEmail: giftData.patient.email,
          patientPhone: giftData.patient.phone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStep('confirmed');
      } else {
        alert(data.error || 'Booking failed. Please try another time.');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    }
    setBooking(false);
  }

  function selectInjection(typeId) {
    setSelectedType(typeId);
    setStep('calendar');
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout title="Birthday Gift | Range Medical">
        <Head><meta name="robots" content="noindex, nofollow" /></Head>
        <div style={s.center}><p style={s.loadingText}>Loading your gift...</p></div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Birthday Gift | Range Medical">
        <Head><meta name="robots" content="noindex, nofollow" /></Head>
        <div style={s.center}>
          <div style={s.errorCard}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎂</div>
            <h2 style={s.errorTitle}>Oops</h2>
            <p style={s.errorText}>{error}</p>
            <p style={s.errorText}>Questions? Call us at <a href="tel:+19499973988" style={{ color: '#111', fontWeight: 600 }}>(949) 997-3988</a></p>
          </div>
        </div>
      </Layout>
    );
  }

  const firstName = giftData?.patient?.firstName || 'there';

  return (
    <Layout title="Happy Birthday! | Range Medical" description="Your free birthday injection from Range Medical.">
      <Head><meta name="robots" content="noindex, nofollow" /></Head>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.container}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>🎂</div>
          <h1 style={s.heroTitle}>Happy Birthday, {firstName}!</h1>
          <p style={s.heroSub}>
            From all of us at Range Medical — we want to celebrate you. Enjoy a <strong>free injection</strong> on us during your birthday month.
          </p>
        </div>
      </section>

      {/* Step: Pick injection */}
      {step === 'pick' && (
        <section style={s.section}>
          <div style={s.container}>
            <div style={s.kicker}>Your Gift</div>
            <h2 style={s.sectionTitle}>Choose Your Injection</h2>
            <p style={s.sectionSub}>Select which injection you would like and we will show you available times.</p>

            <div style={s.optionsGrid}>
              {INJECTION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => selectInjection(opt.id)}
                  style={s.optionCard}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#111'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                >
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>{opt.icon}</div>
                  <h3 style={s.optionName}>{opt.name}</h3>
                  <p style={s.optionSubtitle}>{opt.subtitle}</p>
                  <p style={s.optionDesc}>{opt.description}</p>
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
            <button onClick={() => { setStep('pick'); setSelectedType(null); setSlots([]); setSelectedDate(null); }} style={s.backBtn}>
              ← Change injection
            </button>

            <div style={s.kicker}>
              {INJECTION_OPTIONS.find((o) => o.id === selectedType)?.name}
            </div>
            <h2 style={s.sectionTitle}>Pick a Date & Time</h2>
            <p style={s.sectionSub}>Select a day, then choose an available time slot.</p>

            {/* Date picker — horizontal scroll */}
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
                <p style={s.slotsMsg}>No available times on this day. Try another date.</p>
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
                        {INJECTION_OPTIONS.find((o) => o.id === selectedType)?.name} on{' '}
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
                        {booking ? 'Booking...' : 'Book My Free Injection'}
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
                Your free birthday injection is booked. You will receive a confirmation text shortly with the details.
              </p>
              <p style={s.confirmedText}>
                Happy Birthday from the Range Medical team — we will see you soon!
              </p>
              <p style={{ ...s.confirmedText, marginTop: '24px', fontSize: '14px', color: '#9ca3af' }}>
                Questions? Call us at <a href="tel:+19499973988" style={{ color: '#111', fontWeight: 600 }}>(949) 997-3988</a>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Footer note */}
      <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}>
        Gift valid during your birthday month only. One free injection per year.
      </div>
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
  heroTitle: { fontSize: '32px', fontWeight: 800, color: '#111', margin: '0 0 12px', lineHeight: 1.2 },
  heroSub: { fontSize: '17px', color: '#6b7280', lineHeight: 1.6, margin: 0 },

  section: { padding: '48px 24px' },
  kicker: { fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '8px', textAlign: 'center' },
  sectionTitle: { fontSize: '24px', fontWeight: 700, color: '#111', margin: '0 0 8px', textAlign: 'center' },
  sectionSub: { fontSize: '15px', color: '#6b7280', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.6 },

  optionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', maxWidth: '600px', margin: '0 auto' },
  optionCard: {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0', padding: '32px 24px',
    textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    outline: 'none',
  },
  optionName: { fontSize: '18px', fontWeight: 700, color: '#111', margin: '0 0 4px' },
  optionSubtitle: { fontSize: '13px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' },
  optionDesc: { fontSize: '14px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 16px' },
  optionDuration: { fontSize: '13px', color: '#9ca3af', fontWeight: 500 },

  backBtn: { background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0, display: 'block', margin: '0 auto 16px' },

  dateRow: { display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0 16px', marginBottom: '8px' },
  dateBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
    padding: '10px 14px', border: '1px solid #e5e7eb', background: '#fff',
    cursor: 'pointer', minWidth: '64px', borderRadius: '0', transition: 'all 0.15s',
    outline: 'none',
  },
  dateBtnActive: { borderColor: '#111', background: '#111', color: '#fff' },
  dateDow: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  dateDay: { fontSize: '20px', fontWeight: 700 },
  dateMonth: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' },

  slotsArea: { minHeight: '200px' },
  slotsMsg: { textAlign: 'center', color: '#9ca3af', fontSize: '15px', padding: '40px 0' },
  slotsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' },
  slotBtn: {
    padding: '12px 8px', border: '1px solid #e5e7eb', background: '#fff',
    fontSize: '14px', fontWeight: 500, color: '#111', cursor: 'pointer',
    borderRadius: '0', transition: 'all 0.15s', textAlign: 'center',
    outline: 'none',
  },
  slotBtnActive: { borderColor: '#111', background: '#111', color: '#fff' },

  confirmArea: { textAlign: 'center', marginTop: '32px', padding: '24px', background: '#fafafa', border: '1px solid #e5e7eb' },
  confirmText: { fontSize: '15px', color: '#374151', lineHeight: 1.6, margin: '0 0 20px' },
  bookBtn: {
    background: '#111', color: '#fff', border: 'none', padding: '14px 40px',
    fontSize: '16px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px',
    transition: 'opacity 0.2s',
  },

  confirmedCard: { textAlign: 'center', padding: '48px 24px' },
  confirmedTitle: { fontSize: '24px', fontWeight: 700, color: '#111', margin: '0 0 16px' },
  confirmedText: { fontSize: '16px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 8px' },
};
