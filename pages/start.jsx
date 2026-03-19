// pages/start.jsx
// "Start Here" funnel — one front door for every inquiry
// Two doors: Injury Recovery vs Energy/Hormones/Weight

import Layout from '../components/Layout';
import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const DOORS = [
  {
    id: 'injury',
    icon: '🩹',
    title: 'Injury Recovery',
    subtitle: 'Sports injuries, post-surgical recovery, chronic pain, or just not healing like you should. We usually start with a focused recovery visit — no labs up front.',
    color: '#DC2626',
    bgColor: '#FEF2F2',
  },
  {
    id: 'energy',
    icon: '⚡',
    title: 'Energy, Hormones, or Weight Loss',
    subtitle: "Fatigue, brain fog, weight gain, low libido, or just not feeling like yourself. We start with labs — you'll choose an Essential or Elite panel on the next screen.",
    color: '#16A34A',
    bgColor: '#F0FDF4',
  },
];

export default function StartPage() {
  const router = useRouter();
  const [selectedDoor, setSelectedDoor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);
  const [visibleIds, setVisibleIds] = useState(new Set());

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mainConcern: '',
    urgency: 7,
    hasRecentLabs: false,
    labFile: null,
    consentSms: false,
  });

  // Scroll-based animations — track visibility in React state so re-renders don't strip it
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.animId;
            if (id) {
              setVisibleIds((prev) => {
                const next = new Set(prev);
                next.add(id);
                return next;
              });
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    const elements = document.querySelectorAll('.start-page [data-anim-id]');
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  const animClass = (id) =>
    `start-animate${visibleIds.has(id) ? ' visible' : ''}`;

  const handleDoorClick = (doorId) => {
    setSelectedDoor(doorId);
    setError('');
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!form.consentSms) {
      setError('Please agree to receive text messages to continue.');
      return;
    }

    setSubmitting(true);

    try {
      // Upload lab file if present
      let labFileUrl = null;
      if (form.labFile && form.hasRecentLabs) {
        const fileExt = form.labFile.name.split('.').pop();
        const filePath = `${Date.now()}-${form.firstName.toLowerCase()}-${form.lastName.toLowerCase()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('start-lab-uploads')
          .upload(filePath, form.labFile);

        if (uploadError) {
          console.error('Lab upload error:', uploadError);
          // Continue without file — don't block submission
        } else {
          const { data: urlData } = supabase.storage
            .from('start-lab-uploads')
            .getPublicUrl(filePath);
          labFileUrl = urlData?.publicUrl || filePath;
        }
      }

      const res = await fetch('/api/start/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          path: selectedDoor,
          mainConcern: form.mainConcern.trim(),
          urgency: form.urgency,
          hasRecentLabs: form.hasRecentLabs,
          labFileUrl,
          consentSms: form.consentSms,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Redirect to path-specific thank-you page
      router.push(`/start/${selectedDoor}?name=${encodeURIComponent(form.firstName.trim())}`);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeDoor = DOORS.find((d) => d.id === selectedDoor);

  return (
    <Layout title="Start Here | Range Medical" description="Not feeling like yourself? Tell us what you're dealing with and we'll show you the best next step.">
      <Head>
        <style>{`
          .start-page { color: #171717; }

          /* Animations */
          .start-animate {
            opacity: 0;
            transform: translateY(24px);
            transition: opacity 0.7s ease, transform 0.7s ease;
          }
          .start-animate.visible {
            opacity: 1;
            transform: translateY(0);
          }

          /* Hero */
          .start-hero {
            padding: 80px 20px 60px;
            text-align: center;
            max-width: 720px;
            margin: 0 auto;
          }
          .start-hero h1 {
            font-size: 42px;
            font-weight: 700;
            line-height: 1.15;
            margin: 0 0 16px;
            letter-spacing: -0.02em;
          }
          .start-hero p {
            font-size: 18px;
            color: #525252;
            line-height: 1.6;
            margin: 0 0 40px;
          }

          /* Video placeholder */
          .start-video-wrap {
            max-width: 640px;
            margin: 0 auto;
            border-radius: 12px;
            overflow: hidden;
            background: #000;
            aspect-ratio: 16/9;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .start-video-placeholder {
            text-align: center;
            color: #a3a3a3;
          }
          .start-video-placeholder .play-icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: rgba(255,255,255,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px;
          }
          .start-video-placeholder .play-icon svg {
            width: 24px;
            height: 24px;
            fill: white;
            margin-left: 3px;
          }
          .start-video-placeholder span {
            font-size: 14px;
          }

          /* Doors */
          .start-doors {
            max-width: 960px;
            margin: 0 auto;
            padding: 40px 20px 60px;
          }
          .start-doors h2 {
            text-align: center;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 12px;
          }
          .start-doors > p {
            text-align: center;
            font-size: 16px;
            color: #737373;
            margin: 0 0 40px;
          }
          .start-doors-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            max-width: 700px;
            margin: 0 auto;
          }
          .start-door-card {
            border: 2px solid #e5e5e5;
            border-radius: 16px;
            padding: 32px 24px;
            text-align: center;
            cursor: pointer;
            transition: all 0.25s ease;
            background: #fff;
          }
          .start-door-card:hover {
            border-color: #a3a3a3;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          }
          .start-door-card.selected {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          }
          .start-door-icon {
            font-size: 40px;
            margin-bottom: 16px;
          }
          .start-door-card h3 {
            font-size: 17px;
            font-weight: 600;
            line-height: 1.4;
            margin: 0 0 8px;
          }
          .start-door-card p {
            font-size: 14px;
            color: #737373;
            line-height: 1.5;
            margin: 0;
          }

          /* Form */
          .start-form-section {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px 80px;
          }
          .start-form-card {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 16px;
            padding: 40px 32px;
          }
          .start-form-card h3 {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          .start-form-card > p {
            font-size: 14px;
            color: #737373;
            margin: 0 0 28px;
          }
          .start-form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .start-field {
            margin-bottom: 20px;
          }
          .start-field label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #525252;
            margin-bottom: 6px;
          }
          .start-field input[type="text"],
          .start-field input[type="email"],
          .start-field input[type="tel"],
          .start-field textarea {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid #d4d4d4;
            border-radius: 8px;
            font-size: 15px;
            font-family: inherit;
            background: #fff;
            transition: border-color 0.2s;
            box-sizing: border-box;
          }
          .start-field input:focus,
          .start-field textarea:focus {
            outline: none;
            border-color: #171717;
          }
          .start-field textarea {
            resize: vertical;
            min-height: 80px;
          }

          /* Urgency slider */
          .start-urgency {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .start-urgency input[type="range"] {
            flex: 1;
            -webkit-appearance: none;
            height: 6px;
            border-radius: 3px;
            background: #e5e5e5;
            outline: none;
          }
          .start-urgency input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #171717;
            cursor: pointer;
          }
          .start-urgency-val {
            font-size: 20px;
            font-weight: 700;
            min-width: 28px;
            text-align: center;
          }

          /* Toggle */
          .start-toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
          }
          .start-toggle-label {
            font-size: 14px;
            font-weight: 500;
          }
          .start-toggle {
            position: relative;
            width: 48px;
            height: 26px;
            cursor: pointer;
          }
          .start-toggle input {
            display: none;
          }
          .start-toggle-track {
            position: absolute;
            inset: 0;
            border-radius: 13px;
            background: #d4d4d4;
            transition: background 0.2s;
          }
          .start-toggle input:checked + .start-toggle-track {
            background: #171717;
          }
          .start-toggle-knob {
            position: absolute;
            top: 3px;
            left: 3px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #fff;
            transition: transform 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          }
          .start-toggle input:checked ~ .start-toggle-knob {
            transform: translateX(22px);
          }

          /* File upload */
          .start-file-upload {
            border: 2px dashed #d4d4d4;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: border-color 0.2s;
            margin-top: 8px;
          }
          .start-file-upload:hover {
            border-color: #a3a3a3;
          }
          .start-file-upload input {
            display: none;
          }
          .start-file-upload p {
            margin: 0;
            font-size: 14px;
            color: #737373;
          }
          .start-file-upload .file-name {
            color: #171717;
            font-weight: 500;
          }

          /* Consent */
          .start-consent {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin: 24px 0;
          }
          .start-consent input[type="checkbox"] {
            margin-top: 3px;
            width: 18px;
            height: 18px;
            accent-color: #171717;
          }
          .start-consent label {
            font-size: 13px;
            color: #525252;
            line-height: 1.5;
          }

          /* Submit */
          .start-submit-btn {
            width: 100%;
            padding: 16px;
            background: #171717;
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
            font-family: inherit;
          }
          .start-submit-btn:hover:not(:disabled) {
            background: #404040;
          }
          .start-submit-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .start-error {
            background: #FEF2F2;
            color: #DC2626;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 16px;
          }

          /* How it works */
          .start-how {
            max-width: 720px;
            margin: 0 auto;
            padding: 60px 20px;
            border-top: 1px solid #e5e5e5;
          }
          .start-how h2 {
            text-align: center;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 40px;
          }
          .start-steps {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
          }
          .start-step {
            text-align: center;
          }
          .start-step-num {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #171717;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 700;
            margin: 0 auto 12px;
          }
          .start-step h4 {
            font-size: 15px;
            font-weight: 600;
            margin: 0 0 6px;
          }
          .start-step p {
            font-size: 14px;
            color: #737373;
            margin: 0;
            line-height: 1.5;
          }

          @media (max-width: 768px) {
            .start-hero { padding: 60px 20px 40px; }
            .start-hero h1 { font-size: 30px; }
            .start-hero p { font-size: 16px; }
            .start-doors-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
            .start-door-card { padding: 24px 20px; }
            .start-form-card { padding: 28px 20px; }
            .start-form-row { grid-template-columns: 1fr; gap: 0; }
            .start-steps { grid-template-columns: 1fr; gap: 24px; }
          }
        `}</style>
      </Head>

      <div className="start-page">
        {/* Hero */}
        <section className="start-hero">
          <h1 className={animClass('hero-h1')} data-anim-id="hero-h1">Not feeling like yourself?<br />Start here.</h1>
          <p className={animClass('hero-p')} data-anim-id="hero-p">
            Tell us what you're dealing with, and we'll show you the best next step. Takes about 3 minutes.
          </p>

          <div className={`start-video-wrap ${animClass('hero-video')}`} data-anim-id="hero-video">
            <div className="start-video-placeholder">
              <div className="play-icon">
                <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
              </div>
              <span>Video coming soon</span>
            </div>
          </div>
        </section>

        {/* Pick Your Door */}
        <section className="start-doors">
          <h2 className={animClass('doors-h2')} data-anim-id="doors-h2">What brings you in?</h2>
          <p className={animClass('doors-p')} data-anim-id="doors-p">Pick the one that fits best. We'll take it from there.</p>

          <div className="start-doors-grid">
            {DOORS.map((door) => (
              <div
                key={door.id}
                className={`start-door-card ${animClass(`door-${door.id}`)} ${selectedDoor === door.id ? 'selected' : ''}`}
                data-anim-id={`door-${door.id}`}
                style={
                  selectedDoor === door.id
                    ? { borderColor: door.color, background: door.bgColor }
                    : {}
                }
                onClick={() => handleDoorClick(door.id)}
              >
                <div className="start-door-icon">{door.icon}</div>
                <h3>{door.title}</h3>
                <p>{door.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Inline Form */}
        {selectedDoor && (
          <section className="start-form-section" ref={formRef}>
            <div className="start-form-card">
              <h3>Tell us a little about you</h3>
              <p>We'll text you a short video and your next step.</p>

              <form onSubmit={handleSubmit}>
                {error && <div className="start-error">{error}</div>}

                <div className="start-form-row">
                  <div className="start-field">
                    <label>First name *</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div className="start-field">
                    <label>Last name *</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className="start-form-row">
                  <div className="start-field">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="you@email.com"
                    />
                  </div>
                  <div className="start-field">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(949) 555-1234"
                    />
                  </div>
                </div>

                <div className="start-field">
                  <label>What's bothering you most right now?</label>
                  <textarea
                    value={form.mainConcern}
                    onChange={(e) => handleChange('mainConcern', e.target.value)}
                    placeholder={
                      selectedDoor === 'injury'
                        ? 'e.g., Torn ACL 3 months ago, still can\'t run...'
                        : 'e.g., Exhausted by 2pm every day, brain fog, gained 15 lbs...'
                    }
                  />
                </div>

                <div className="start-field">
                  <label>How important is it to fix this in the next 90 days?</label>
                  <div className="start-urgency">
                    <span style={{ fontSize: 13, color: '#a3a3a3' }}>Not urgent</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={form.urgency}
                      onChange={(e) => handleChange('urgency', parseInt(e.target.value))}
                    />
                    <span style={{ fontSize: 13, color: '#a3a3a3' }}>Critical</span>
                    <span className="start-urgency-val">{form.urgency}</span>
                  </div>
                </div>

                <div className="start-field">
                  <div className="start-toggle-row">
                    <span className="start-toggle-label">Do you have recent labs?</span>
                    <label className="start-toggle">
                      <input
                        type="checkbox"
                        checked={form.hasRecentLabs}
                        onChange={(e) => handleChange('hasRecentLabs', e.target.checked)}
                      />
                      <div className="start-toggle-track" />
                      <div className="start-toggle-knob" />
                    </label>
                  </div>
                </div>

                {form.hasRecentLabs && (
                  <div className="start-field">
                    <label>Upload your lab results (optional)</label>
                    <label className="start-file-upload">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleChange('labFile', e.target.files[0] || null)}
                      />
                      {form.labFile ? (
                        <p className="file-name">{form.labFile.name}</p>
                      ) : (
                        <p>Click to upload PDF, JPG, or PNG</p>
                      )}
                    </label>
                  </div>
                )}

                <div className="start-consent">
                  <input
                    type="checkbox"
                    id="consent-sms"
                    checked={form.consentSms}
                    onChange={(e) => handleChange('consentSms', e.target.checked)}
                  />
                  <label htmlFor="consent-sms">
                    I agree to receive text messages from Range Medical about my inquiry.
                    Message & data rates may apply. Reply STOP to opt out.
                  </label>
                </div>

                <button
                  type="submit"
                  className="start-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Get My Next Step'}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="start-how">
          <h2 className={animClass('how-h2')} data-anim-id="how-h2">How Range Works</h2>
          <div className="start-steps">
            <div className={`start-step ${animClass('step-1')}`} data-anim-id="step-1">
              <div className="start-step-num">1</div>
              <h4>Tell us your main problem</h4>
              <p>Pick the path that fits you and fill out the short form above.</p>
            </div>
            <div className={`start-step ${animClass('step-2')}`} data-anim-id="step-2">
              <div className="start-step-num">2</div>
              <h4>Choose your first step</h4>
              <p>Injury recovery starts with a focused visit. Energy and hormones start with labs.</p>
            </div>
            <div className={`start-step ${animClass('step-3')}`} data-anim-id="step-3">
              <div className="start-step-num">3</div>
              <h4>Get a written plan</h4>
              <p>After your visit or lab review, you get a clear plan your provider walks you through.</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
