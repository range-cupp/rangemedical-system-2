// pages/offer-success.jsx
// Post-checkout success page for new patient offers.
// Confirms payment, then shows a date/slot scheduler to book the session.

import Layout from '../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { NEW_PATIENT_OFFERS } from '../lib/offer-config';

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

export default function OfferSuccess() {
  const router = useRouter();
  const { session_id, offerId } = router.query;

  const [status, setStatus] = useState('loading');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');

  const [phase, setPhase] = useState('schedule');
  const days = useMemo(() => getNext14Days(), []);
  const [selectedDate, setSelectedDate] = useState('');
  const [slotsByDate, setSlotsByDate] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [contactInfo, setContactInfo] = useState({ firstName: '', lastName: '', phone: '' });
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');
  const [bookedTime, setBookedTime] = useState(null);

  const offer = NEW_PATIENT_OFFERS.find(o => o.id === offerId) || null;

  useEffect(() => {
    if (days.length > 0 && !selectedDate) {
      setSelectedDate(days[0].dateISO);
    }
  }, [days]);

  useEffect(() => {
    if (!session_id) return;
    fetch(`/api/offers/verify-checkout?session_id=${session_id}`)
      .then(r => r.json())
      .then(data => {
        if (data.paid) {
          setStatus('paid');
          setCustomerEmail(data.email || '');
          setCustomerName(data.name || '');
          if (data.name) {
            const parts = data.name.trim().split(/\s+/);
            setContactInfo(prev => ({
              ...prev,
              firstName: parts[0] || '',
              lastName: parts.slice(1).join(' ') || '',
            }));
          }
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [session_id]);

  useEffect(() => {
    if (status !== 'paid' || !offer || !selectedDate) return;
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
  }, [status, offer, selectedDate]);

  async function handleBook() {
    if (!selectedSlot || !contactInfo.firstName.trim() || !contactInfo.phone.trim()) return;
    setBooking(true);
    setBookError('');
    try {
      const res = await fetch('/api/offers/confirm-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session_id,
          offerId,
          slotStart: selectedSlot,
          firstName: contactInfo.firstName.trim(),
          lastName: contactInfo.lastName.trim(),
          email: customerEmail,
          phone: contactInfo.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.slotUnavailable) {
          setSlotsByDate(prev => { const n = { ...prev }; delete n[selectedDate]; return n; });
          setSelectedSlot(null);
          setBookError('That time was just taken. Please pick another slot.');
        } else {
          setBookError(data.error || 'Could not book. Please try again.');
        }
        setBooking(false);
        return;
      }
      setBookedTime(selectedSlot);
      setPhase('done');
    } catch (err) {
      setBookError('Something went wrong. Please try again.');
      setBooking(false);
    }
  }

  if (status === 'loading') {
    return (
      <Layout title="Confirming your payment...">
        <div style={{ textAlign: 'center', padding: '120px 2rem', minHeight: '60vh' }}>
          <p style={{ fontSize: '17px', color: '#737373' }}>Confirming your payment...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'error' || !offer) {
    return (
      <Layout title="Something went wrong">
        <div style={{ textAlign: 'center', padding: '120px 2rem', minHeight: '60vh' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 12px' }}>Something went wrong</h1>
          <p style={{ fontSize: '17px', color: '#737373', margin: '0 0 2rem' }}>
            We couldn&apos;t confirm your payment. If you were charged, please contact us and we&apos;ll sort it out.
          </p>
          <Link href="/" className="btn-primary">Back to Homepage</Link>
          <p style={{ fontSize: '14px', color: '#a0a0a0', marginTop: '1.5rem' }}>
            Call or text <a href="tel:9499973988" style={{ color: '#1a1a1a', fontWeight: 600 }}>(949) 997-3988</a>
          </p>
        </div>
      </Layout>
    );
  }

  if (phase === 'done') {
    return (
      <Layout title={`You're booked — ${offer.name}`}>
        <Head>
          <meta name="robots" content="noindex" />
        </Head>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '80px 2rem 120px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px' }}>You&apos;re all set.</h1>
          <p style={{ fontSize: '17px', color: '#525252', lineHeight: 1.6 }}>
            Your <strong>{offer.name}</strong> is booked for:
          </p>
          <p style={{ fontSize: '20px', fontWeight: 700, margin: '16px 0', color: '#1a1a1a' }}>
            {formatSlotFull(bookedTime)}
          </p>
          <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 12, padding: '20px 24px', margin: '24px 0', textAlign: 'left' }}>
            <p style={{ fontSize: '14px', color: '#737373', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</p>
            <p style={{ fontSize: '16px', color: '#1a1a1a', margin: '0 0 12px', fontWeight: 600 }}>Range Medical</p>
            <p style={{ fontSize: '14px', color: '#525252', margin: 0, lineHeight: 1.5 }}>
              1901 Westcliff Dr, Suite 10<br />Newport Beach, CA 92660
            </p>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', margin: '16px 0', textAlign: 'left' }}>
            <p style={{ fontSize: '14px', color: '#15803d', margin: 0, lineHeight: 1.6 }}>
              We&apos;ll send you a confirmation text shortly. During your visit, we may ask a few questions about your energy, sleep, and recovery to see if a Range Assessment could help.
            </p>
          </div>
          <p style={{ fontSize: '14px', color: '#a0a0a0', marginTop: '2rem' }}>
            Questions? Call or text <a href="tel:9499973988" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>(949) 997-3988</a>
          </p>
        </div>
      </Layout>
    );
  }

  const slots = slotsByDate[selectedDate];

  return (
    <Layout title={`Schedule Your ${offer.name}`}>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 2rem 100px' }}>
        {/* Payment confirmed banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 28 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span style={{ fontSize: '14px', color: '#15803d', fontWeight: 600 }}>
            Payment confirmed &mdash; {offer.name} ({offer.priceDisplay})
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 1.75rem)', fontWeight: 800, letterSpacing: '-0.01em', margin: '0 0 6px' }}>
          Now pick a time.
        </h1>
        <p style={{ fontSize: '15px', color: '#525252', margin: '0 0 24px', lineHeight: 1.5 }}>
          Pacific time &middot; {offer.durationMinutes} minutes &middot; Newport Beach
        </p>

        {/* Day selector — two rows of 7 */}
        {[days.slice(0, 7), days.slice(7, 14)].map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {row.map(d => {
              const active = d.dateISO === selectedDate;
              return (
                <button
                  key={d.dateISO}
                  onClick={() => { setSelectedDate(d.dateISO); setSelectedSlot(null); }}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    border: active ? '2px solid #1a1a1a' : '1px solid #e0e0e0',
                    borderRadius: 8,
                    background: active ? '#1a1a1a' : '#fff',
                    color: active ? '#fff' : '#1a1a1a',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 500, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.weekdayShort}</span>
                  <span style={{ display: 'block', fontSize: '16px', fontWeight: 700 }}>{d.day}</span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 500, opacity: 0.6 }}>{d.monthShort}</span>
                </button>
              );
            })}
          </div>
        ))}

        {/* Slots */}
        <div style={{ padding: '16px 0', borderTop: '1px solid #e5e5e5', marginTop: 12 }}>
          {loadingSlots && (
            <p style={{ fontSize: '14px', color: '#737373', textAlign: 'center', padding: '24px 0' }}>Loading open times...</p>
          )}
          {!loadingSlots && slots && slots.length === 0 && (
            <p style={{ fontSize: '14px', color: '#737373', textAlign: 'center', padding: '24px 0' }}>No open times this day. Try another date.</p>
          )}
          {!loadingSlots && slots && slots.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
              {slots.map((slot, i) => {
                const startISO = slot.start || slot.time || slot;
                const active = selectedSlot === startISO;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedSlot(startISO)}
                    style={{
                      padding: '10px 8px',
                      border: active ? '2px solid #1a1a1a' : '1px solid #e0e0e0',
                      borderRadius: 8,
                      background: active ? '#1a1a1a' : '#fff',
                      color: active ? '#fff' : '#1a1a1a',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  >
                    {formatSlotTime(startISO)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Contact info + book */}
        {selectedSlot && (
          <div style={{ marginTop: 20, borderTop: '1px solid #e5e5e5', paddingTop: 20 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px' }}>Your info</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="First name"
                value={contactInfo.firstName}
                onChange={e => setContactInfo(p => ({ ...p, firstName: e.target.value }))}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Last name"
                value={contactInfo.lastName}
                onChange={e => setContactInfo(p => ({ ...p, lastName: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <input
              type="tel"
              placeholder="Mobile phone"
              value={contactInfo.phone}
              onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))}
              style={{ ...inputStyle, marginBottom: 16 }}
            />

            {bookError && (
              <p style={{ fontSize: '14px', color: '#dc2626', margin: '0 0 12px' }}>{bookError}</p>
            )}

            <button
              onClick={handleBook}
              disabled={booking || !contactInfo.firstName.trim() || !contactInfo.phone.trim()}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: booking ? '#a0a0a0' : '#2E5D3A',
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                fontSize: '16px',
                fontWeight: 600,
                cursor: booking ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {booking ? 'Booking...' : `Book ${offer.name}`}
            </button>

            <p style={{ fontSize: '13px', color: '#a0a0a0', textAlign: 'center', marginTop: 10 }}>
              {formatSlotFull(selectedSlot)} &middot; Range Medical, Newport Beach
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  fontSize: '15px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};
