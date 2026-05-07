// pages/schedule-iv.jsx
// Patient-facing page to book a complimentary Range IV (HRT membership perk).
// Uses the native scheduling engine (lib/scheduling.js via /api/bookings/*).
// Accepts ?pid= (patient_id), ?name=, ?email= for pre-fill / booking.

import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const SERVICE_SLUG = 'range-iv';

export default function ScheduleIV() {
  const router = useRouter();
  const { pid, name, email } = router.query;

  const [step, setStep] = useState('booking'); // booking | done
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);

  // 14 upcoming non-Sunday dates, starting tomorrow
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i < 22 && dates.length < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() !== 0) dates.push(d);
    }
    return dates;
  };

  const fetchSlots = async (dateStr) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/bookings/slots?serviceSlug=${SERVICE_SLUG}&date=${dateStr}`);
      const data = await res.json();
      if (data.success && data.slots) {
        const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const filtered = {};
        Object.entries(data.slots).forEach(([dateKey, dateSlots]) => {
          const valid = dateSlots.filter((s) => new Date(s.start) >= twoHoursFromNow);
          if (valid.length > 0) filtered[dateKey] = valid;
        });
        setAvailableSlots(filtered);
      } else {
        setAvailableSlots({});
      }
    } catch (err) {
      setAvailableSlots({});
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateClick = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    fetchSlots(dateStr);
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    if (!pid) {
      setError('We could not identify your account from this link. Please call or text (949) 997-3988 to book.');
      return;
    }
    setIsBooking(true);
    setError('');
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSlug: SERVICE_SLUG,
          start: selectedSlot.start,
          patientId: pid,
          patientName: name || 'Patient',
          patientEmail: email || null,
          serviceName: 'Range IV (HRT Membership)',
          notes: 'Complimentary Range IV — included with HRT membership',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setBookingResult({ ...data.booking, start: selectedSlot.start });
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Could not book. Please call (949) 997-3988.');
    } finally {
      setIsBooking(false);
    }
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });

  const formatDateLong = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Los_Angeles',
    });

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Los_Angeles',
    });

  const slotList = Object.values(availableSlots).flat();

  return (
    <Layout
      title="Schedule Your Range IV | Range Medical"
      description="Schedule your complimentary Range IV session at Range Medical in Newport Beach. Included with your HRT membership."
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">HRT Membership Perk</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Complimentary with HRT Membership</span>
          <h1>Schedule Your Range IV</h1>
          <p className="hero-sub">
            Your monthly Range IV is ready. Pick a time below and we will have everything prepared for your visit.
          </p>
        </div>
      </section>

      {/* What to Expect */}
      {step === 'booking' && (
        <section className="section">
          <div className="container">
            <div className="section-kicker">Your Visit</div>
            <h2 className="section-title">What to Expect</h2>
            <p className="section-subtitle">A personalized IV session included with your HRT membership.</p>

            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <div style={styles.infoIcon}>&#128167;</div>
                <h3 style={styles.infoCardTitle}>Custom IV Blend</h3>
                <p style={styles.infoCardText}>
                  5 vitamins and minerals tailored to how you are feeling that day. Add extras for a small upcharge.
                </p>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoIcon}>&#9201;</div>
                <h3 style={styles.infoCardTitle}>~60 Minute Session</h3>
                <p style={styles.infoCardText}>Relax in our comfortable lounge while your IV drip does the work.</p>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoIcon}>&#10003;</div>
                <h3 style={styles.infoCardTitle}>No Additional Cost</h3>
                <p style={styles.infoCardText}>
                  Your Range IV with 5 vitamins and minerals is included at no charge with your HRT membership.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Booking Section */}
      <section className="section section-gray" id="book">
        <div className="container">
          {step === 'booking' && (
            <>
              <div className="section-kicker">Pick a Time</div>
              <h2 className="section-title">Select Your Appointment</h2>
              <p className="section-subtitle">Choose a time that works for you. Sessions are approximately 60 minutes.</p>

              <div style={{ maxWidth: 540, margin: '32px auto 0' }}>
                {error && (
                  <div
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      padding: '12px 16px',
                      fontSize: 14,
                      marginBottom: 16,
                      border: '1px solid #fecaca',
                    }}
                  >
                    {error}
                  </div>
                )}

                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#525252',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Select a date
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {getAvailableDates().map((date) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const isActive = selectedDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleDateClick(date)}
                        style={{
                          padding: '10px 14px',
                          border: isActive ? '2px solid #171717' : '1px solid #d4d4d4',
                          background: isActive ? '#171717' : '#fff',
                          color: isActive ? '#fff' : '#171717',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {formatDate(date)}
                      </button>
                    );
                  })}
                </div>

                {slotsLoading && (
                  <p style={{ textAlign: 'center', color: '#737373', fontSize: 14, padding: '16px 0' }}>
                    Loading times...
                  </p>
                )}

                {selectedDate && !slotsLoading && (
                  <>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#525252',
                        marginBottom: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Available times
                    </p>
                    {slotList.length > 0 ? (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                          gap: 8,
                          marginBottom: 24,
                        }}
                      >
                        {slotList.map((slot, i) => {
                          const isActive = selectedSlot?.start === slot.start;
                          return (
                            <button
                              key={i}
                              onClick={() => setSelectedSlot(slot)}
                              style={{
                                padding: 10,
                                border: isActive ? '2px solid #171717' : '1px solid #d4d4d4',
                                background: isActive ? '#171717' : '#fff',
                                color: isActive ? '#fff' : '#171717',
                                fontSize: 14,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                textAlign: 'center',
                              }}
                            >
                              {formatTime(slot.start)}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#737373', fontSize: 14, padding: '12px 0' }}>
                        No times available on this date. Try another day.
                      </p>
                    )}
                  </>
                )}

                {selectedSlot && (
                  <button
                    onClick={handleBookSlot}
                    disabled={isBooking}
                    style={{
                      width: '100%',
                      padding: 16,
                      background: '#171717',
                      color: '#fff',
                      border: 'none',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: isBooking ? 'not-allowed' : 'pointer',
                      opacity: isBooking ? 0.6 : 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    {isBooking ? 'Booking...' : `Confirm Appointment — ${formatTime(selectedSlot.start)}`}
                  </button>
                )}

                <p style={{ textAlign: 'center', fontSize: 14, color: '#737373', marginTop: 16 }}>
                  Questions? Call or text{' '}
                  <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600, textDecoration: 'none' }}>
                    (949) 997-3988
                  </a>
                </p>
              </div>
            </>
          )}

          {step === 'done' && bookingResult && (
            <div style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  background: '#22c55e',
                  borderRadius: '50%',
                  marginBottom: 20,
                }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="section-title" style={{ marginBottom: 12 }}>You are booked!</h2>
              <p style={{ fontSize: 16, color: '#525252', margin: '0 0 28px', lineHeight: 1.6 }}>
                Your Range IV is scheduled for{' '}
                <strong>{formatDateLong(bookingResult.start)}</strong> at{' '}
                <strong>{formatTime(bookingResult.start)}</strong>.
              </p>

              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e5e5e5',
                  padding: 28,
                  marginBottom: 24,
                  textAlign: 'left',
                }}
              >
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 16px' }}>Before your visit:</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>
                    &#10003; Hydrate well in the 24 hours before your appointment
                  </li>
                  <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>
                    &#10003; Eat a light meal beforehand &mdash; do not come on an empty stomach
                  </li>
                  <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>
                    &#10003; Wear something with sleeves that roll up easily
                  </li>
                  <li style={{ fontSize: 14, color: '#525252', padding: '6px 0', lineHeight: 1.5 }}>
                    &#10003; Plan for ~60 minutes at the clinic
                  </li>
                </ul>
              </div>

              <p style={{ textAlign: 'center', fontSize: 14, color: '#737373' }}>
                Need to reschedule? Call or text{' '}
                <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600, textDecoration: 'none' }}>
                  (949) 997-3988
                </a>
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

const styles = {
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
    marginTop: '32px',
    maxWidth: '900px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  infoCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0',
    padding: '28px 24px',
    textAlign: 'center',
  },
  infoIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  infoCardTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#111',
    margin: '0 0 8px',
  },
  infoCardText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#6b7280',
    margin: 0,
  },
};
