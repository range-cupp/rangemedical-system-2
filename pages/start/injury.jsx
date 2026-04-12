// pages/start/injury.jsx
// Injury & Recovery path — clean, scannable page
// File upload for MRIs/docs + Cal.com slot picker for Recovery Assessment

import Layout from '../../components/Layout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ASSESSMENT_EVENT_TYPE_ID = process.env.NEXT_PUBLIC_ASSESSMENT_EVENT_TYPE_ID;

export default function StartInjury() {
  const router = useRouter();
  const { name } = router.query;
  const firstName = name || 'there';

  // Lead info from /start form
  const [leadInfo, setLeadInfo] = useState(null);

  // File upload
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  // Booking
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [error, setError] = useState('');

  // Load lead info from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('range_start_lead');
      if (saved) setLeadInfo(JSON.parse(saved));
    } catch (e) {}
  }, []);

  // Generate next 14 available dates (skip Sundays)
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
    if (!ASSESSMENT_EVENT_TYPE_ID) {
      setError('Scheduling not configured. Please call (949) 997-3988.');
      return;
    }
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/bookings/slots?eventTypeId=${ASSESSMENT_EVENT_TYPE_ID}&date=${dateStr}`);
      const data = await res.json();
      if (data.success && data.slots) {
        const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const filtered = {};
        Object.entries(data.slots).forEach(([dateKey, dateSlots]) => {
          const valid = dateSlots.filter(s => new Date(s.start) >= twoHoursFromNow);
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

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${firstName.toLowerCase()}-${file.name}`;
        await supabase.storage.from('start-lab-uploads').upload(path, file);
      }
      setUploadDone(true);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !leadInfo) return;
    setIsBooking(true);
    setError('');

    try {
      const res = await fetch('/api/assessment/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: leadInfo.leadId,
          eventTypeId: ASSESSMENT_EVENT_TYPE_ID,
          start: selectedSlot.start,
          patientName: `${leadInfo.firstName} ${leadInfo.lastName}`,
          patientEmail: leadInfo.email,
          patientPhone: leadInfo.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

      setBookingResult(data.booking);
      setBooked(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Could not book. Please call (949) 997-3988.');
    } finally {
      setIsBooking(false);
    }
  };

  // Format slot time — always Pacific
  const formatTime = (iso) => {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' });
  };

  return (
    <Layout
      title="Injury & Recovery — Your Next Step | Range Medical"
      description="Book your Recovery Assessment at Range Medical. We look at your injury story, see what you've tried, and build a clear recovery plan."
    >
      <Head>
        <style>{`
          .inj-page { color: #171717; }

          /* Hero */
          .inj-hero {
            max-width: 640px;
            margin: 0 auto;
            padding: 72px 20px 48px;
            text-align: center;
          }
          .inj-badge {
            display: inline-block;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 6px 14px;
            border-radius: 0;
            margin-bottom: 16px;
            background: #FEF2F2;
            color: #DC2626;
          }
          .inj-hero .inj-greeting {
            font-size: 17px;
            color: #737373;
            margin: 0 0 24px;
          }
          .inj-hero h1 {
            font-size: clamp(2.5rem, 6vw, 4rem);
            font-weight: 700;
            line-height: 1.2;
            margin: 0 0 16px;
            letter-spacing: -0.02em;
          }

          /* Scannable list sections */
          .inj-section {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px 40px;
          }
          .inj-section h2 {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 16px;
          }
          .inj-section h3 {
            font-size: 17px;
            font-weight: 700;
            margin: 0 0 12px;
          }
          .inj-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .inj-list li {
            font-size: 15px;
            color: #525252;
            padding: 6px 0;
            line-height: 1.5;
            display: flex;
            align-items: flex-start;
            gap: 10px;
          }
          .inj-list li .inj-icon {
            min-width: 20px;
            text-align: center;
            flex-shrink: 0;
          }
          .inj-divider {
            max-width: 600px;
            margin: 0 auto 40px;
            padding: 0 20px;
          }
          .inj-divider hr {
            border: none;
            border-top: 1px solid #e5e5e5;
            margin: 0;
          }

          /* Dark callout */
          .inj-callout {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px 40px;
          }
          .inj-callout-inner {
            background: #171717;
            border-radius: 0;
            padding: 28px 28px;
            color: #fff;
          }
          .inj-callout-inner h3 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 20px;
            color: #fff;
          }
          .inj-callout-item {
            display: flex;
            gap: 14px;
            align-items: flex-start;
            margin-bottom: 16px;
          }
          .inj-callout-item:last-child { margin-bottom: 0; }
          .inj-callout-num {
            width: 26px;
            height: 26px;
            min-width: 26px;
            border-radius: 50%;
            background: rgba(255,255,255,0.15);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 700;
          }
          .inj-callout-item strong {
            display: block;
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 2px;
          }
          .inj-callout-item p {
            font-size: 14px;
            color: #a3a3a3;
            line-height: 1.5;
            margin: 0;
          }

          /* Note block */
          .inj-note {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px 40px;
          }
          .inj-note-inner {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 0;
            padding: 20px 24px;
          }
          .inj-note-inner strong {
            font-size: 14px;
          }
          .inj-note-inner p {
            font-size: 14px;
            color: #525252;
            line-height: 1.6;
            margin: 6px 0 0;
          }

          /* File upload */
          .inj-upload {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px 40px;
          }
          .inj-upload h3 {
            font-size: 17px;
            font-weight: 700;
            margin: 0 0 6px;
          }
          .inj-upload > p {
            font-size: 14px;
            color: #737373;
            margin: 0 0 14px;
          }
          .inj-upload-zone {
            display: block;
            border: 2px dashed #d4d4d4;
            border-radius: 0;
            padding: 32px 24px;
            text-align: center;
            cursor: pointer;
            transition: border-color 0.2s, background 0.2s;
          }
          .inj-upload-zone:hover {
            border-color: #a3a3a3;
            background: #fafafa;
          }
          .inj-upload-zone input { display: none; }
          .inj-upload-zone .inj-upload-icon {
            font-size: 32px;
            margin-bottom: 8px;
          }
          .inj-upload-zone p {
            margin: 0;
            font-size: 14px;
            color: #737373;
          }
          .inj-file-list {
            margin-top: 12px;
          }
          .inj-file-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: #f5f5f5;
            border-radius: 0;
            margin-bottom: 6px;
            font-size: 14px;
          }
          .inj-file-remove {
            background: none;
            border: none;
            color: #dc2626;
            cursor: pointer;
            font-size: 13px;
            font-family: inherit;
          }
          .inj-upload-btn {
            margin-top: 12px;
            padding: 10px 20px;
            background: #171717;
            color: #fff;
            border: none;
            border-radius: 0;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
          }
          .inj-upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .inj-upload-success {
            margin-top: 10px;
            font-size: 14px;
            color: #16a34a;
            font-weight: 500;
          }

          /* Calendar / Slot picker */
          .inj-calendar {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px 60px;
          }
          .inj-calendar h2 {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 6px;
          }
          .inj-calendar > p {
            font-size: 14px;
            color: #737373;
            margin: 0 0 20px;
          }
          .inj-dates {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 20px;
          }
          .inj-date-btn {
            padding: 10px 14px;
            border: 1px solid #d4d4d4;
            border-radius: 0;
            background: #fff;
            cursor: pointer;
            font-size: 13px;
            font-family: inherit;
            font-weight: 500;
            transition: all 0.15s;
          }
          .inj-date-btn:hover { border-color: #a3a3a3; }
          .inj-date-btn.active {
            background: #171717;
            color: #fff;
            border-color: #171717;
          }
          .inj-slots {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 8px;
            margin-bottom: 20px;
          }
          .inj-slot-btn {
            padding: 10px;
            border: 1px solid #d4d4d4;
            border-radius: 0;
            background: #fff;
            cursor: pointer;
            font-size: 14px;
            font-family: inherit;
            text-align: center;
            transition: all 0.15s;
          }
          .inj-slot-btn:hover { border-color: #a3a3a3; }
          .inj-slot-btn.active {
            background: #171717;
            color: #fff;
            border-color: #171717;
          }
          .inj-book-btn {
            width: 100%;
            padding: 16px;
            background: #171717;
            color: #fff;
            border: none;
            border-radius: 0;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
          }
          .inj-book-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .inj-loading {
            text-align: center;
            padding: 20px;
            color: #737373;
            font-size: 14px;
          }
          .inj-error {
            background: #FEF2F2;
            color: #DC2626;
            padding: 12px 16px;
            border-radius: 0;
            font-size: 14px;
            margin-bottom: 16px;
          }
          .inj-phone-fallback {
            text-align: center;
            padding: 12px 0 0;
            font-size: 14px;
            color: #737373;
          }
          .inj-phone-fallback a {
            color: #171717;
            font-weight: 600;
            text-decoration: none;
          }

          /* Confirmation */
          .inj-confirmed {
            max-width: 560px;
            margin: 0 auto;
            padding: 80px 20px;
            text-align: center;
          }
          .inj-confirmed h1 {
            font-size: 30px;
            font-weight: 700;
            margin: 0 0 8px;
          }
          .inj-confirmed > p {
            font-size: 16px;
            color: #525252;
            margin: 0 0 32px;
            line-height: 1.6;
          }
          .inj-confirmed-card {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 0;
            padding: 28px;
            text-align: left;
          }
          .inj-confirmed-card h3 {
            font-size: 16px;
            font-weight: 700;
            margin: 0 0 16px;
          }
          .inj-confirmed-card li {
            font-size: 14px;
            color: #525252;
            padding: 4px 0;
            line-height: 1.5;
          }

          /* Fit check */
          .inj-fit {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px 40px;
          }
          .inj-fit-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .inj-fit-col h4 {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin: 0 0 8px;
          }
          .inj-fit-col ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .inj-fit-col li {
            font-size: 14px;
            color: #525252;
            padding: 4px 0;
            line-height: 1.5;
          }

          @media (max-width: 768px) {
            .inj-hero { padding: 56px 20px 36px; }
            .inj-hero h1 { font-size: 26px; }
            .inj-fit-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </Head>

      {/* --- BOOKED CONFIRMATION --- */}
      {booked ? (
        <div className="inj-page">
          <div className="inj-confirmed">
            <div className="inj-badge">Injury & Recovery</div>
            <h1>You're all set, {firstName}.</h1>
            <p>Your Recovery Assessment is booked. We'll text and email you with your appointment details and what to bring.</p>

            <div className="inj-confirmed-card">
              <h3>Before your visit:</h3>
              <ul>
                <li>Bring any imaging reports (MRI, X-ray) if you have them</li>
                <li>Bring notes from current providers (PT, chiro, surgeon)</li>
                <li>Wear comfortable clothes you can move in</li>
                <li>Write down your questions — we'll go through all of them</li>
              </ul>
            </div>

            <p style={{ marginTop: 24, fontSize: 14, color: '#737373' }}>
              Questions? Call/text <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600, textDecoration: 'none' }}>(949) 997-3988</a>
            </p>
          </div>
        </div>
      ) : (

      /* --- MAIN PAGE --- */
      <div className="inj-page">
        {/* Hero */}
        <section className="inj-hero">
          <div className="inj-badge">Injury & Recovery</div>
          <p className="inj-greeting">Hey {firstName}, we got your info.</p>
          <h1>We don't replace good rehab.<br />We support and enhance it.</h1>
        </section>

        {/* Sound like you? */}
        <section className="inj-section">
          <h2>Sound like you?</h2>
          <ul className="inj-list">
            <li><span className="inj-icon">→</span> You're dealing with an injury that's not getting better on its own</li>
            <li><span className="inj-icon">→</span> You had surgery and recovery has stalled</li>
            <li><span className="inj-icon">→</span> You've been dealing with ongoing pain or discomfort for weeks or months</li>
            <li><span className="inj-icon">→</span> You're doing the right things, but it still feels slow or keeps flaring up</li>
          </ul>
        </section>

        <div className="inj-divider"><hr /></div>

        {/* How Range fits in */}
        <section className="inj-section">
          <h2>How Range fits in</h2>
          <ul className="inj-list">
            <li><span className="inj-icon">✓</span> We look at your injury story</li>
            <li><span className="inj-icon">✓</span> We see what you've already tried</li>
            <li><span className="inj-icon">✓</span> We add the right tools to help your body calm down and heal better</li>
          </ul>
          <p style={{ fontSize: 14, color: '#525252', marginTop: 12, lineHeight: 1.6 }}>
            In <strong>Newport Beach</strong>, we work alongside the providers you already trust.<br />
            In <strong>San Clemente</strong>, body work, PT, chiro, and medical support — all under one roof.
          </p>
        </section>

        <div className="inj-divider"><hr /></div>

        {/* Recovery Visit breakdown */}
        <section className="inj-callout">
          <div className="inj-callout-inner">
            <h3>Your Recovery Assessment:</h3>
            <div className="inj-callout-item">
              <div className="inj-callout-num">1</div>
              <div>
                <strong>We listen to your story</strong>
                <p>How you got hurt. What makes it better or worse. What you've tried so far.</p>
              </div>
            </div>
            <div className="inj-callout-item">
              <div className="inj-callout-num">2</div>
              <div>
                <strong>We look at how you move</strong>
                <p>A focused exam — what your body can and can't do right now.</p>
              </div>
            </div>
            <div className="inj-callout-item">
              <div className="inj-callout-num">3</div>
              <div>
                <strong>We review your current plan</strong>
                <p>What you're doing now and how we can support it.</p>
              </div>
            </div>
            <div className="inj-callout-item">
              <div className="inj-callout-num">4</div>
              <div>
                <strong>You leave with a written recovery plan</strong>
                <p>What we think is going on, what might help, and what the next 4–6 weeks look like.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Labs note */}
        <section className="inj-note">
          <div className="inj-note-inner">
            <strong>Quick note on labs:</strong>
            <p>
              For most injury cases, we don't start with blood work. We get a clear picture from your story,
              movement exam, and how your body responds. If your provider thinks something deeper is slowing
              healing, they'll explain why labs might make sense.
            </p>
          </div>
        </section>

        <div className="inj-divider"><hr /></div>

        {/* File upload */}
        <section className="inj-upload">
          <h3>Have imaging or provider notes?</h3>
          <p>Upload MRIs, X-rays, surgical reports, or notes from your PT/chiro. (Optional — you can also bring them to your visit.)</p>

          {!uploadDone ? (
            <>
              <label className="inj-upload-zone">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.dicom,.dcm"
                  multiple
                  onChange={handleFileChange}
                />
                <div className="inj-upload-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p>Click to upload PDF, JPG, PNG, or DICOM files</p>
              </label>

              {files.length > 0 && (
                <div className="inj-file-list">
                  {files.map((f, i) => (
                    <div key={i} className="inj-file-item">
                      <span>{f.name}</span>
                      <button className="inj-file-remove" onClick={() => removeFile(i)}>Remove</button>
                    </div>
                  ))}
                  <button
                    className="inj-upload-btn"
                    onClick={handleUploadFiles}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="inj-upload-success">✓ Files uploaded successfully. We'll review them before your visit.</p>
          )}
        </section>

        <div className="inj-divider"><hr /></div>

        {/* Calendar booking */}
        <section className="inj-calendar">
          <h2>Pick a time for your Recovery Assessment</h2>
          <p>Newport Beach &amp; San Clemente available.</p>

          {error && <div className="inj-error">{error}</div>}

          {/* Date picker */}
          <div className="inj-dates">
            {getAvailableDates().map((date) => {
              const dateStr = date.toISOString().split('T')[0];
              return (
                <button
                  key={dateStr}
                  className={`inj-date-btn ${selectedDate === dateStr ? 'active' : ''}`}
                  onClick={() => handleDateClick(date)}
                >
                  {formatDate(date)}
                </button>
              );
            })}
          </div>

          {/* Slots */}
          {slotsLoading && <div className="inj-loading">Loading available times...</div>}

          {selectedDate && !slotsLoading && (
            <>
              {Object.keys(availableSlots).length > 0 ? (
                <div className="inj-slots">
                  {Object.values(availableSlots).flat().map((slot, i) => (
                    <button
                      key={i}
                      className={`inj-slot-btn ${selectedSlot?.start === slot.start ? 'active' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: '#737373', textAlign: 'center', padding: '12px 0' }}>
                  No slots available on this date. Try another day.
                </p>
              )}
            </>
          )}

          {/* Book button */}
          {selectedSlot && (
            <button
              className="inj-book-btn"
              onClick={handleBooking}
              disabled={isBooking || !leadInfo}
            >
              {isBooking ? 'Booking...' : `Confirm Recovery Assessment — ${formatTime(selectedSlot.start)}`}
            </button>
          )}

          {!leadInfo && selectedSlot && (
            <p style={{ fontSize: 13, color: '#dc2626', textAlign: 'center', marginTop: 8 }}>
              Please go back to <a href="/assessment" style={{ color: '#dc2626', fontWeight: 600 }}>/assessment</a> and fill out the form first.
            </p>
          )}

          <p className="inj-phone-fallback">
            Or call/text <a href="tel:9499973988">(949) 997-3988</a> to book
          </p>
        </section>

        {/* Disclaimer */}
        <section className="inj-section" style={{ paddingTop: 0 }}>
          <p style={{ fontSize: 13, color: '#a3a3a3', lineHeight: 1.6, fontStyle: 'italic', maxWidth: 600 }}>
            The information on this page is for educational purposes only and does not constitute medical advice for your specific situation. All treatment recommendations are made by a licensed provider after an in-person evaluation.
          </p>
        </section>

        {/* Fit check */}
        <section className="inj-fit">
          <div className="inj-fit-grid">
            <div className="inj-fit-col">
              <h4 style={{ color: '#16a34a' }}>Right for you if:</h4>
              <ul>
                <li>✓ You're tired of guessing and hoping it works itself out</li>
                <li>✓ You're doing rehab but want everything working in the same direction</li>
                <li>✓ You want a clear, realistic plan for the next few weeks</li>
              </ul>
            </div>
            <div className="inj-fit-col">
              <h4 style={{ color: '#dc2626' }}>Not for you if:</h4>
              <ul>
                <li>✗ You want a quick fix without putting in any work</li>
                <li>✗ You're not willing to follow through on a plan</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
      )}
    </Layout>
  );
}
