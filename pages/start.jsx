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
    title: 'Injury Recovery',
    subtitle: 'Not healing like you should, recovering from surgery, or dealing with ongoing pain. We usually start with a focused recovery visit — no labs up front.',
    color: '#DC2626',
    bgColor: '#FEF2F2',
  },
  {
    id: 'energy',
    title: 'Energy, Hormones, or Weight Loss',
    subtitle: "Fatigue, brain fog, weight gain, low libido, or just not feeling like yourself. We start with labs — you'll choose an Essential or Elite panel on the next screen.",
    color: '#16A34A',
    bgColor: '#F0FDF4',
  },
];

export default function StartPage() {
  const router = useRouter();
  const [selectedDoor, setSelectedDoor] = useState(null);
  const [formStep, setFormStep] = useState(1); // 1 = questions, 2 = contact info
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
    if (doorId === 'injury') {
      router.push('/assessment?path=injury&from=start');
    } else {
      router.push('/assessment');
    }
  };

  const handleContinueToContact = () => {
    if (!form.mainConcern.trim()) {
      setError('Please tell us what\'s bothering you so we can help.');
      return;
    }
    setError('');

    // Injury path: skip contact info — go straight to assessment questions
    // Contact info will be collected after recommendation, before payment
    if (selectedDoor === 'injury') {
      try {
        localStorage.setItem('range_start_lead', JSON.stringify({
          path: 'injury',
          mainConcern: form.mainConcern.trim(),
          urgency: form.urgency,
          hasRecentLabs: form.hasRecentLabs,
          fromStart: true,
        }));
      } catch (e) {}
      router.push('/assessment?path=injury&from=start');
      return;
    }

    // Energy path: show contact info step
    setFormStep(2);
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

      // Save contact info so assessment page can pre-fill (no double-entry)
      try {
        localStorage.setItem('range_start_lead', JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          path: selectedDoor,
          leadId: data.leadId || null,
        }));
      } catch (e) { /* localStorage not available — non-blocking */ }

      // Redirect based on path
      if (selectedDoor === 'injury') {
        // Go straight into the injury assessment questions (contact info auto-filled, step 0 skipped)
        router.push('/assessment?path=injury&from=start');
      } else {
        // Energy path goes to lab panel selection page
        router.push(`/start/${selectedDoor}?name=${encodeURIComponent(form.firstName.trim())}`);
      }
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
          .start-page {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
            color: #171717;
          }

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

          /* Hero — V2: left-aligned, hairline rule */
          .start-hero {
            padding: 6rem 2rem 5rem;
            text-align: left;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            max-width: 1200px;
            margin: 0 auto;
          }
          .start-hero h1 {
            font-size: clamp(2.5rem, 6vw, 4rem);
            font-weight: 900;
            line-height: 0.95;
            letter-spacing: -0.02em;
            text-transform: uppercase;
            margin: 0 0 1.5rem;
            max-width: 680px;
            color: #171717;
          }
          .start-hero-rule {
            width: 48px;
            height: 1px;
            background: #e0e0e0;
            margin-bottom: 1.5rem;
          }
          .start-hero p {
            font-size: 1.0625rem;
            color: #737373;
            line-height: 1.7;
            margin: 0 0 2.5rem;
            max-width: 600px;
          }

          /* Video */
          .start-video-wrap {
            max-width: 640px;
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
            font-size: 2rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.02em;
            line-height: 0.95;
            margin: 0 0 1rem;
          }
          .start-doors > p {
            font-size: 1.0625rem;
            color: #737373;
            line-height: 1.7;
            margin: 0 0 2.5rem;
          }
          .start-doors-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0;
            max-width: 700px;
            border: 1px solid #e0e0e0;
          }
          .start-door-card {
            border-right: 1px solid #e0e0e0;
            padding: 2.5rem 2rem;
            cursor: pointer;
            transition: all 0.25s ease;
            background: #fff;
          }
          .start-door-card:last-child {
            border-right: none;
          }
          .start-door-card:hover {
            background: #fafafa;
          }
          .start-door-card.selected {
            background: #fafafa;
          }
          .start-door-card h3 {
            font-size: 1.125rem;
            font-weight: 700;
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
            border: 1px solid #e0e0e0;
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
            border: 1px solid #e0e0e0;
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
            background: #e0e0e0;
            outline: none;
          }
          .start-urgency input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 22px;
            height: 22px;
            background: #1a1a1a;
            cursor: pointer;
          }
          .start-urgency-val {
            font-size: 20px;
            font-weight: 700;
            min-width: 28px;
            text-align: center;
            color: #808080;
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
            background: #d4d4d4;
            transition: background 0.2s;
          }
          .start-toggle input:checked + .start-toggle-track {
            background: #1a1a1a;
          }
          .start-toggle-knob {
            position: absolute;
            top: 3px;
            left: 3px;
            width: 20px;
            height: 20px;
            background: #fff;
            transition: transform 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          }
          .start-toggle input:checked ~ .start-toggle-knob {
            transform: translateX(22px);
          }

          /* File upload */
          .start-file-upload {
            border: 2px dashed #e0e0e0;
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
            accent-color: #1a1a1a;
          }
          .start-consent label {
            font-size: 13px;
            color: #525252;
            line-height: 1.5;
          }

          /* Buttons — V2: no border-radius, 11px, 700 weight, uppercase */
          .start-submit-btn {
            width: 100%;
            padding: 0.875rem 2rem;
            background: #1a1a1a;
            color: #fff;
            border: none;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
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
            font-size: 14px;
            margin-bottom: 16px;
          }

          /* Step indicator */
          .start-step-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 24px;
          }
          .start-step-dot {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 700;
          }
          .start-step-dot.active {
            background: #1a1a1a;
            color: #fff;
          }
          .start-step-dot.done {
            background: #16a34a;
            color: #fff;
          }
          .start-step-dot.upcoming {
            background: #e0e0e0;
            color: #a3a3a3;
          }
          .start-step-line {
            width: 32px;
            height: 2px;
            background: #e0e0e0;
          }
          .start-step-line.done {
            background: #16a34a;
          }

          /* $50 off banner */
          .start-offer-banner {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 16px 20px;
            margin-bottom: 24px;
            text-align: center;
          }
          .start-offer-banner .offer-amount {
            font-size: 20px;
            font-weight: 700;
            color: #16a34a;
            display: block;
            margin-bottom: 2px;
          }
          .start-offer-banner p {
            font-size: 14px;
            color: #525252;
            margin: 0;
            line-height: 1.5;
          }

          /* Continue button (step 1) — V2 */
          .start-continue-btn {
            width: 100%;
            padding: 0.875rem 2rem;
            background: #1a1a1a;
            color: #fff;
            border: none;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.2s;
            font-family: inherit;
          }
          .start-continue-btn:hover {
            background: #404040;
          }

          /* Back link */
          .start-back-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: #737373;
            cursor: pointer;
            background: none;
            border: none;
            font-family: inherit;
            padding: 0;
            margin-bottom: 20px;
          }
          .start-back-link:hover {
            color: #171717;
          }

          /* How it works — V2 */
          .start-how {
            max-width: 1200px;
            margin: 0 auto;
            padding: 6rem 2rem;
            border-top: 1px solid #e0e0e0;
          }
          .start-how h2 {
            font-size: 2rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.02em;
            line-height: 0.95;
            margin: 0 0 2.5rem;
          }
          .start-steps {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
            border: 1px solid #e0e0e0;
          }
          .start-step {
            padding: 2rem;
            border-right: 1px solid #e0e0e0;
          }
          .start-step:last-child {
            border-right: none;
          }
          .start-step-num {
            width: 40px;
            height: 40px;
            background: #1a1a1a;
            color: #808080;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 900;
            margin: 0 0 12px;
          }
          .start-step h4 {
            font-size: 15px;
            font-weight: 700;
            margin: 0 0 6px;
          }
          .start-step p {
            font-size: 14px;
            color: #737373;
            margin: 0;
            line-height: 1.5;
          }

          @media (max-width: 768px) {
            .start-hero { padding: 4rem 1.5rem 3rem; }
            .start-hero h1 { font-size: 2rem; }
            .start-hero p { font-size: 1rem; }
            .start-doors-grid {
              grid-template-columns: 1fr;
            }
            .start-door-card {
              border-right: none;
              border-bottom: 1px solid #e0e0e0;
            }
            .start-door-card:last-child {
              border-bottom: none;
            }
            .start-door-card { padding: 2rem 1.5rem; }
            .start-form-card { padding: 28px 20px; }
            .start-form-row { grid-template-columns: 1fr; gap: 0; }
            .start-steps {
              grid-template-columns: 1fr;
            }
            .start-step {
              border-right: none;
              border-bottom: 1px solid #e0e0e0;
            }
            .start-step:last-child {
              border-bottom: none;
            }
          }
        `}</style>
      </Head>

      <div className="start-page">
        {/* Hero */}
        <section className="start-hero">
          <div className="v2-label"><span className="v2-dot" /> Start Here</div>
          <h1 className={animClass('hero-h1')} data-anim-id="hero-h1">NOT FEELING LIKE YOURSELF?<br />START HERE.</h1>
          <div className="start-hero-rule" />
          <p className={animClass('hero-p')} data-anim-id="hero-p">
            Tell us what you're dealing with, and we'll show you the best next step. Takes about 3 minutes.
          </p>

          <div className={`start-video-wrap ${animClass('hero-video')}`} data-anim-id="hero-video">
            <iframe
              src="https://www.youtube.com/embed/NKce39USIn4?si=6HETgP5XHeCypRWi&controls=0&rel=0"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </div>
        </section>

        {/* Pick Your Door */}
        <section className="start-doors">
          <div className="v2-label" style={{ marginBottom: '1rem' }}><span className="v2-dot" /> What Brings You In</div>
          <h2 className={animClass('doors-h2')} data-anim-id="doors-h2">WHAT BRINGS YOU IN?</h2>
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
                <h3>{door.title}</h3>
                <p>{door.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        {/* No form — doors navigate directly */}

        {/* How It Works */}
        <section className="start-how">
          <div className="v2-label" style={{ marginBottom: '1rem' }}><span className="v2-dot" /> How It Works</div>
          <h2 className={animClass('how-h2')} data-anim-id="how-h2">HOW RANGE WORKS</h2>
          <div className="start-steps">
            <div className={`start-step ${animClass('step-1')}`} data-anim-id="step-1">
              <div className="start-step-num">1</div>
              <h4>Pick your path</h4>
              <p>Injury recovery or energy, hormones, and weight loss. Click the one that fits you above.</p>
            </div>
            <div className={`start-step ${animClass('step-2')}`} data-anim-id="step-2">
              <div className="start-step-num">2</div>
              <h4>We figure out what's going on</h4>
              <p>A focused visit for injuries. Labs and a provider review for energy and hormones.</p>
            </div>
            <div className={`start-step ${animClass('step-3')}`} data-anim-id="step-3">
              <div className="start-step-num">3</div>
              <h4>Get a written plan</h4>
              <p>Clear next steps your provider walks you through. No guesswork.</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
