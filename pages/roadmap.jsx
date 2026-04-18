// pages/roadmap.jsx
// Aspiration-based lead magnet — "Your Personalized 6-Month Transformation Roadmap"
// Two doors: Injury Recovery vs Energy/Hormones/Weight Loss
// Flow: door → missing-out chips → success vision → cost of waiting → urgency → contact → roadmap
// Urgency 7-10 → prominent Range Assessment CTA
// Urgency 1-6 → roadmap delivered + email nurture sequence

import Layout from '../components/Layout';
import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';

const DOORS = [
  {
    id: 'injury',
    title: 'Injury Recovery',
    subtitle: "You're not healing the way you should. Pain, stiffness, or a setback that won't resolve.",
    color: '#DC2626',
    bgColor: '#FEF2F2',
  },
  {
    id: 'energy',
    title: 'Energy, Hormones, or Weight Loss',
    subtitle: 'Tired, foggy, heavier than you want, or just not feeling like yourself.',
    color: '#16A34A',
    bgColor: '#F0FDF4',
  },
];

const MISSING_OUT_CHIPS = {
  injury: [
    'The gym and training hard',
    'Hiking and the outdoors',
    'Sports and pickup games',
    'Playing with my kids / grandkids',
    'Traveling without pain',
    'Sleeping through the night',
    'Working without limits',
    'Being active with my partner',
    'Doing what I used to love',
    'Being confident in my body',
  ],
  energy: [
    'Energy for my family',
    'Confidence in how I look',
    'Focus at work',
    'Sex drive and intimacy',
    'Quality sleep',
    'Consistent mood',
    'Control over my weight',
    'Motivation to train',
    'Feeling like myself again',
    'Being present with the people I love',
  ],
};

const URGENCY_LABEL = (val) => {
  if (val <= 3) return 'Not urgent — just exploring';
  if (val <= 6) return 'Worth looking into';
  if (val <= 8) return 'Ready to start soon';
  return 'Need this resolved now';
};

const ROADMAP_CONTENT = {
  injury: {
    rootCause:
      "Slow recovery is almost never one thing. It's a stack: inflammation load, cellular energy capacity, and peptide signaling that isn't firing the way it should. When you treat one and miss the others, you plateau.",
    interventions: [
      {
        name: 'Regenerative Peptides (BPC-157, TB4)',
        detail:
          'Directly accelerate tissue repair — tendon, ligament, soft tissue, gut lining. Usually the first lever we pull.',
      },
      {
        name: 'Hyperbaric Oxygen (HBOT)',
        detail:
          'Floods tissue with oxygen at pressure. Cuts recovery timelines roughly in half for soft-tissue injuries.',
      },
      {
        name: 'Red Light Therapy',
        detail:
          'Mitochondrial stimulation at the cellular level. Pairs with HBOT and peptides to amplify healing.',
      },
      {
        name: 'Targeted Injections (PRP, Exosomes)',
        detail:
          'For stubborn joints, tendons, or old injuries that peptides alone can\'t resolve. Not needed for everyone.',
      },
    ],
    missingPiece:
      "You can't self-diagnose which stack fits your specific injury. You need a provider who examines you, reviews your imaging, and builds a protocol around your timeline.",
    phases: [
      { label: 'Weeks 1-4', text: 'Reduce inflammation, kickstart repair with peptides + HBOT/RLT.' },
      { label: 'Weeks 5-12', text: 'Rebuild capacity. Layer in strength, targeted injections if needed.' },
      { label: 'Months 4-6', text: 'Return to full performance. Maintenance protocol, prevent re-injury.' },
    ],
  },
  energy: {
    rootCause:
      "Energy, weight, and how you feel are almost always a hormone-metabolism-mitochondria problem — usually layered. Testosterone drops, thyroid drifts, insulin resistance builds, cellular energy production slows. You feel all of it at once and it gets blamed on 'getting older.'",
    interventions: [
      {
        name: 'Hormone Replacement (HRT)',
        detail:
          "Testosterone, thyroid, and supporting hormones — dialed to your labs, not a stock dose. This is the foundation for most of what you're feeling.",
      },
      {
        name: 'Weight Loss Medication (Tirzepatide, Retatrutide)',
        detail:
          "GLP-1s actually work. Paired with the right nutrition and hormones, weight comes off and stays off.",
      },
      {
        name: 'Peptide Therapy',
        detail:
          'Targeted peptides for energy, recovery, sleep, cognition. Layers on top of HRT for patients who want more.',
      },
      {
        name: 'IV Therapy + NAD',
        detail:
          'Cellular-level support. NAD for energy, IVs for hydration, nutrients, and targeted deficits.',
      },
    ],
    missingPiece:
      "You can't guess which systems are off. An Essential or Elite lab panel shows exactly what's happening — and a provider review turns that data into a plan you can actually execute.",
    phases: [
      { label: 'Weeks 1-2', text: 'Labs drawn, full workup reviewed. Baseline established.' },
      { label: 'Weeks 3-8', text: 'Protocol starts — HRT, GLP-1, or peptides based on your labs.' },
      { label: 'Months 3-6', text: 'Dial in. Adjust doses, re-check labs, add layers. You feel the shift.' },
    ],
  },
};

export default function RoadmapPage() {
  const router = useRouter();
  const [screen, setScreen] = useState(1); // 1=door, 2=chips, 3=success, 4=cost, 5=urgency, 6=contact, 7=roadmap
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const [form, setForm] = useState({
    path: null,
    missingOut: [],
    successVision: '',
    costOfWaiting: '',
    urgency: 7,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    consentSms: false,
  });

  // Scroll to top of card on step change
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }, [screen]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleChip = (chip) => {
    setForm((prev) => ({
      ...prev,
      missingOut: prev.missingOut.includes(chip)
        ? prev.missingOut.filter((c) => c !== chip)
        : [...prev.missingOut, chip],
    }));
  };

  const goNext = () => {
    setError('');
    if (screen === 1 && !form.path) {
      setError('Pick one to continue.');
      return;
    }
    if (screen === 2 && form.missingOut.length === 0) {
      setError('Pick at least one so we can personalize your roadmap.');
      return;
    }
    if (screen === 3 && !form.successVision.trim()) {
      setError('Tell us what success would look like.');
      return;
    }
    if (screen === 4 && !form.costOfWaiting.trim()) {
      setError('This one matters — take a second to answer.');
      return;
    }
    setScreen(screen + 1);
  };

  const goBack = () => {
    setError('');
    if (screen > 1) setScreen(screen - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (!form.consentSms) {
      setError('Please agree to receive text messages so we can send you your roadmap.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/roadmap/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          path: form.path,
          missingOut: form.missingOut,
          successVision: form.successVision.trim(),
          costOfWaiting: form.costOfWaiting.trim(),
          urgency: form.urgency,
          consentSms: form.consentSms,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      // Save contact so assessment page auto-fills — no double-entry
      try {
        localStorage.setItem(
          'range_roadmap_contact',
          JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            path: form.path,
          })
        );
      } catch (e) {
        /* non-blocking */
      }

      setScreen(7);
    } catch (err) {
      console.error('Roadmap submit error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goToAssessment = () => {
    router.push(`/assessment?path=${form.path}&from=roadmap`);
  };

  const roadmap = form.path ? ROADMAP_CONTENT[form.path] : null;
  const chips = form.path ? MISSING_OUT_CHIPS[form.path] : [];
  const isAssessmentTier = form.urgency >= 7;
  const totalSteps = 6;
  const progress = screen <= 6 ? ((screen - 1) / totalSteps) * 100 : 100;

  return (
    <Layout
      title="Your 6-Month Transformation Roadmap | Range Medical"
      description="Get a personalized roadmap for the next 6 months. Tell us where you are, where you want to be, and we'll show you the path — free."
    >
      <Head>
        <style>{`
          .rm-roadmap {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
            color: #171717;
            min-height: calc(100vh - 80px);
            background: #fff;
          }
          .rm-roadmap-hero {
            max-width: 720px;
            margin: 0 auto;
            padding: 4rem 2rem 2rem;
          }
          .rm-roadmap-hero .rm-tag {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #737373;
            margin-bottom: 1rem;
          }
          .rm-roadmap-hero h1 {
            font-size: clamp(2rem, 5vw, 3.25rem);
            font-weight: 900;
            line-height: 1;
            letter-spacing: -0.02em;
            text-transform: uppercase;
            margin: 0 0 1rem;
          }
          .rm-roadmap-hero .rule {
            width: 48px;
            height: 1px;
            background: #171717;
            margin: 0 0 1.25rem;
          }
          .rm-roadmap-hero p {
            font-size: 1.0625rem;
            line-height: 1.65;
            color: #525252;
            margin: 0;
          }
          .rm-roadmap-wrap {
            max-width: 720px;
            margin: 0 auto;
            padding: 0 2rem 5rem;
          }

          /* Progress bar */
          .rm-progress-wrap {
            margin-bottom: 2rem;
          }
          .rm-progress-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #737373;
          }
          .rm-progress-bar {
            height: 1px;
            background: #e0e0e0;
            position: relative;
          }
          .rm-progress-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 1px;
            background: #171717;
            transition: width 0.4s ease;
          }

          /* Card */
          .rm-card {
            background: #fff;
            border: 1px solid #e0e0e0;
            padding: 2.5rem 2rem;
          }
          .rm-card h2 {
            font-size: 1.5rem;
            font-weight: 900;
            line-height: 1.15;
            letter-spacing: -0.01em;
            margin: 0 0 0.5rem;
          }
          .rm-card .rm-sub {
            font-size: 0.9375rem;
            color: #737373;
            line-height: 1.6;
            margin: 0 0 1.75rem;
          }

          /* Door cards */
          .rm-doors {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            border: 1px solid #e0e0e0;
          }
          .rm-door {
            padding: 2rem 1.5rem;
            cursor: pointer;
            background: #fff;
            transition: all 0.2s;
            border-right: 1px solid #e0e0e0;
          }
          .rm-door:last-child { border-right: none; }
          .rm-door:hover { background: #fafafa; }
          .rm-door.selected {
            background: #fafafa;
          }
          .rm-door h3 {
            font-size: 1.0625rem;
            font-weight: 700;
            margin: 0 0 6px;
          }
          .rm-door p {
            font-size: 13px;
            color: #737373;
            line-height: 1.5;
            margin: 0;
          }

          /* Chips */
          .rm-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .rm-chip {
            padding: 10px 14px;
            border: 1px solid #e0e0e0;
            background: #fff;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.15s;
            font-family: inherit;
            color: #171717;
          }
          .rm-chip:hover { border-color: #171717; }
          .rm-chip.selected {
            background: #171717;
            color: #fff;
            border-color: #171717;
          }

          /* Textarea */
          .rm-textarea {
            width: 100%;
            min-height: 110px;
            padding: 14px 16px;
            border: 1px solid #e0e0e0;
            font-family: inherit;
            font-size: 15px;
            line-height: 1.5;
            background: #fff;
            resize: vertical;
            box-sizing: border-box;
            color: #171717;
          }
          .rm-textarea:focus {
            outline: none;
            border-color: #171717;
          }

          /* Urgency slider */
          .rm-slider-wrap {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            padding: 2rem 1.5rem;
            text-align: center;
          }
          .rm-slider-value {
            font-size: 3rem;
            font-weight: 900;
            line-height: 1;
            margin: 0 0 0.25rem;
            letter-spacing: -0.02em;
          }
          .rm-slider-label {
            font-size: 13px;
            font-weight: 600;
            color: #525252;
            margin-bottom: 1.5rem;
          }
          .rm-slider {
            width: 100%;
            -webkit-appearance: none;
            height: 2px;
            background: #e0e0e0;
            outline: none;
            margin-bottom: 12px;
          }
          .rm-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 24px;
            height: 24px;
            background: #171717;
            cursor: pointer;
            border: 3px solid #fff;
            box-shadow: 0 0 0 1px #171717;
          }
          .rm-slider::-moz-range-thumb {
            width: 24px;
            height: 24px;
            background: #171717;
            cursor: pointer;
            border: 3px solid #fff;
            box-shadow: 0 0 0 1px #171717;
          }
          .rm-slider-ticks {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #737373;
          }

          /* Contact */
          .rm-field { margin-bottom: 1rem; }
          .rm-field label {
            display: block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #737373;
            margin-bottom: 6px;
          }
          .rm-field input {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid #e0e0e0;
            font-family: inherit;
            font-size: 15px;
            background: #fff;
            box-sizing: border-box;
            color: #171717;
          }
          .rm-field input:focus {
            outline: none;
            border-color: #171717;
          }
          .rm-field-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .rm-consent {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            margin: 1.25rem 0;
          }
          .rm-consent input {
            margin-top: 2px;
            width: 18px;
            height: 18px;
            accent-color: #171717;
          }
          .rm-consent label {
            font-size: 13px;
            color: #525252;
            line-height: 1.5;
          }

          /* Buttons */
          .rm-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            margin-top: 2rem;
          }
          .rm-back {
            background: none;
            border: none;
            font-family: inherit;
            font-size: 13px;
            color: #737373;
            cursor: pointer;
            padding: 0;
            letter-spacing: 0.02em;
          }
          .rm-back:hover { color: #171717; }
          .rm-next {
            padding: 0.9rem 2.25rem;
            background: #171717;
            color: #fff;
            border: none;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.2s;
          }
          .rm-next:hover:not(:disabled) { background: #404040; }
          .rm-next:disabled { opacity: 0.5; cursor: not-allowed; }
          .rm-next-wide {
            width: 100%;
          }
          .rm-error {
            background: #FEF2F2;
            color: #DC2626;
            padding: 12px 16px;
            font-size: 14px;
            margin-bottom: 1rem;
          }

          /* Roadmap screen */
          .rm-roadmap-result h1 {
            font-size: clamp(1.75rem, 4.5vw, 2.5rem);
            font-weight: 900;
            line-height: 1.05;
            letter-spacing: -0.02em;
            text-transform: uppercase;
            margin: 0 0 1rem;
          }
          .rm-section {
            margin-top: 2.5rem;
          }
          .rm-section-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #737373;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .rm-section-label::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #e0e0e0;
          }
          .rm-section h3 {
            font-size: 1.25rem;
            font-weight: 900;
            line-height: 1.2;
            margin: 0 0 0.75rem;
          }
          .rm-section p {
            font-size: 15px;
            color: #525252;
            line-height: 1.65;
            margin: 0 0 1rem;
          }
          .rm-interventions {
            border-top: 1px solid #e0e0e0;
          }
          .rm-intervention {
            padding: 1.25rem 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .rm-intervention h4 {
            font-size: 15px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          .rm-intervention p {
            font-size: 14px;
            color: #737373;
            margin: 0;
            line-height: 1.55;
          }
          .rm-phases {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
            border: 1px solid #e0e0e0;
          }
          .rm-phase {
            padding: 1.25rem 1rem;
            border-right: 1px solid #e0e0e0;
          }
          .rm-phase:last-child { border-right: none; }
          .rm-phase-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #737373;
            margin-bottom: 6px;
          }
          .rm-phase-text {
            font-size: 13.5px;
            color: #171717;
            line-height: 1.5;
          }

          /* Missing piece callout */
          .rm-missing-piece {
            background: #171717;
            color: #fff;
            padding: 2rem 1.75rem;
            margin-top: 2.5rem;
          }
          .rm-missing-piece .label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #a3a3a3;
            margin-bottom: 10px;
          }
          .rm-missing-piece p {
            font-size: 16px;
            line-height: 1.65;
            margin: 0 0 1.25rem;
            color: #fff;
          }

          /* CTA */
          .rm-cta {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            padding: 2rem 1.75rem;
            margin-top: 1.5rem;
          }
          .rm-cta.prominent {
            background: #16a34a;
            border-color: #16a34a;
          }
          .rm-cta.prominent .label { color: #bbf7d0; }
          .rm-cta.prominent h3,
          .rm-cta.prominent p { color: #fff; }
          .rm-cta .label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #737373;
            margin-bottom: 10px;
          }
          .rm-cta h3 {
            font-size: 1.25rem;
            font-weight: 900;
            margin: 0 0 0.5rem;
            line-height: 1.2;
          }
          .rm-cta p {
            font-size: 15px;
            color: #525252;
            line-height: 1.6;
            margin: 0 0 1.25rem;
          }
          .rm-cta-btn {
            display: inline-block;
            padding: 0.95rem 2rem;
            background: #171717;
            color: #fff;
            border: none;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            cursor: pointer;
            text-decoration: none;
            transition: background 0.2s;
          }
          .rm-cta-btn:hover { background: #404040; }
          .rm-cta.prominent .rm-cta-btn {
            background: #fff;
            color: #16a34a;
          }
          .rm-cta.prominent .rm-cta-btn:hover {
            background: #f0fdf4;
          }
          .rm-soft-link {
            display: inline-block;
            margin-top: 1rem;
            font-size: 13px;
            color: #737373;
            text-decoration: underline;
            cursor: pointer;
            background: none;
            border: none;
            font-family: inherit;
            padding: 0;
          }
          .rm-soft-link:hover { color: #171717; }

          /* Missing-out recap */
          .rm-recap {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin: 0.25rem 0 0.5rem;
          }
          .rm-recap-chip {
            font-size: 12px;
            padding: 5px 10px;
            background: #fafafa;
            border: 1px solid #e0e0e0;
            color: #525252;
          }

          @media (max-width: 640px) {
            .rm-roadmap-hero { padding: 2.5rem 1.25rem 1.5rem; }
            .rm-roadmap-wrap { padding: 0 1.25rem 4rem; }
            .rm-card { padding: 1.75rem 1.25rem; }
            .rm-doors { grid-template-columns: 1fr; }
            .rm-door { border-right: none; border-bottom: 1px solid #e0e0e0; }
            .rm-door:last-child { border-bottom: none; }
            .rm-field-row { grid-template-columns: 1fr; gap: 0; }
            .rm-phases { grid-template-columns: 1fr; }
            .rm-phase { border-right: none; border-bottom: 1px solid #e0e0e0; }
            .rm-phase:last-child { border-bottom: none; }
          }
        `}</style>
      </Head>

      <div className="rm-roadmap">
        {/* Hero */}
        {screen < 7 && (
          <section className="rm-roadmap-hero">
            <div className="rm-tag">Free Tool — About 4 Minutes</div>
            <h1>
              Your 6-Month
              <br />
              Transformation Roadmap.
            </h1>
            <div className="rule" />
            <p>
              Tell us where you are, where you want to be, and we'll build you a real plan for the next 6 months.
              No generic advice. No upsells.
            </p>
          </section>
        )}

        <section className="rm-roadmap-wrap" ref={scrollRef}>
          {screen < 7 && (
            <div className="rm-progress-wrap">
              <div className="rm-progress-meta">
                <span>Step {screen} of {totalSteps}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="rm-progress-bar">
                <div className="rm-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Screen 1: Door */}
          {screen === 1 && (
            <div className="rm-card">
              <h2>Which one sounds like you?</h2>
              <p className="rm-sub">This shapes the roadmap we build. Pick the one that's bugging you most right now.</p>

              {error && <div className="rm-error">{error}</div>}

              <div className="rm-doors">
                {DOORS.map((d) => (
                  <div
                    key={d.id}
                    className={`rm-door ${form.path === d.id ? 'selected' : ''}`}
                    style={form.path === d.id ? { borderColor: d.color, background: d.bgColor } : {}}
                    onClick={() => update('path', d.id)}
                  >
                    <h3>{d.title}</h3>
                    <p>{d.subtitle}</p>
                  </div>
                ))}
              </div>

              <div className="rm-actions">
                <span />
                <button className="rm-next" onClick={goNext} disabled={!form.path}>Continue</button>
              </div>
            </div>
          )}

          {/* Screen 2: Missing-out chips */}
          {screen === 2 && (
            <div className="rm-card">
              <h2>What are you missing out on right now?</h2>
              <p className="rm-sub">
                Pick everything that fits. These are the things we'll build your roadmap around.
              </p>

              {error && <div className="rm-error">{error}</div>}

              <div className="rm-chips">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={`rm-chip ${form.missingOut.includes(chip) ? 'selected' : ''}`}
                    onClick={() => toggleChip(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="rm-actions">
                <button className="rm-back" onClick={goBack}>← Back</button>
                <button className="rm-next" onClick={goNext}>Continue</button>
              </div>
            </div>
          )}

          {/* Screen 3: Success vision */}
          {screen === 3 && (
            <div className="rm-card">
              <h2>If we worked together for 6 months, what would make it a success for you?</h2>
              <p className="rm-sub">
                Be specific. "Back in the gym 4x a week" beats "feel better." The more specific, the better the roadmap.
              </p>

              {error && <div className="rm-error">{error}</div>}

              <textarea
                className="rm-textarea"
                value={form.successVision}
                onChange={(e) => update('successVision', e.target.value)}
                placeholder="In 6 months, I want to be..."
                autoFocus
              />

              <div className="rm-actions">
                <button className="rm-back" onClick={goBack}>← Back</button>
                <button className="rm-next" onClick={goNext}>Continue</button>
              </div>
            </div>
          )}

          {/* Screen 4: Cost of waiting */}
          {screen === 4 && (
            <div className="rm-card">
              <h2>What happens if nothing changes in the next year?</h2>
              <p className="rm-sub">
                Not a trick question. If you keep doing what you're doing, where does this end up? What does it cost you?
              </p>

              {error && <div className="rm-error">{error}</div>}

              <textarea
                className="rm-textarea"
                value={form.costOfWaiting}
                onChange={(e) => update('costOfWaiting', e.target.value)}
                placeholder="If nothing changes..."
                autoFocus
              />

              <div className="rm-actions">
                <button className="rm-back" onClick={goBack}>← Back</button>
                <button className="rm-next" onClick={goNext}>Continue</button>
              </div>
            </div>
          )}

          {/* Screen 5: Urgency */}
          {screen === 5 && (
            <div className="rm-card">
              <h2>How ready are you to solve this now?</h2>
              <p className="rm-sub">
                Be honest. This tells us whether to send you the roadmap and let you take your time, or move fast.
              </p>

              <div className="rm-slider-wrap">
                <div className="rm-slider-value">{form.urgency}</div>
                <div className="rm-slider-label">{URGENCY_LABEL(form.urgency)}</div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form.urgency}
                  onChange={(e) => update('urgency', parseInt(e.target.value, 10))}
                  className="rm-slider"
                />
                <div className="rm-slider-ticks">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              <div className="rm-actions">
                <button className="rm-back" onClick={goBack}>← Back</button>
                <button className="rm-next" onClick={goNext}>Continue</button>
              </div>
            </div>
          )}

          {/* Screen 6: Contact */}
          {screen === 6 && (
            <div className="rm-card">
              <h2>Where should we send your roadmap?</h2>
              <p className="rm-sub">
                We'll email it now and text you a copy. No spam, no sales calls unless you ask for one.
              </p>

              {error && <div className="rm-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="rm-field-row">
                  <div className="rm-field">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => update('firstName', e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <div className="rm-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => update('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="rm-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    required
                  />
                </div>

                <div className="rm-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    required
                  />
                </div>

                <div className="rm-consent">
                  <input
                    type="checkbox"
                    id="rm-consent"
                    checked={form.consentSms}
                    onChange={(e) => update('consentSms', e.target.checked)}
                  />
                  <label htmlFor="rm-consent">
                    I agree to receive text messages from Range Medical about my roadmap and next steps.
                    Standard message and data rates may apply. Text STOP to opt out.
                  </label>
                </div>

                <div className="rm-actions">
                  <button type="button" className="rm-back" onClick={goBack}>← Back</button>
                  <button type="submit" className="rm-next" disabled={submitting}>
                    {submitting ? 'Building Roadmap…' : 'See My Roadmap'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Screen 7: Roadmap delivered */}
          {screen === 7 && roadmap && (
            <div className="rm-card rm-roadmap-result">
              <div className="rm-tag" style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
                textTransform: 'uppercase', color: '#737373', marginBottom: '0.75rem',
              }}>
                Your Personalized Roadmap
              </div>
              <h1>
                Here's your 6-month
                <br />
                path, {form.firstName}.
              </h1>

              {/* Recap */}
              <div className="rm-section">
                <div className="rm-section-label">What You're Missing</div>
                <div className="rm-recap">
                  {form.missingOut.map((chip) => (
                    <span key={chip} className="rm-recap-chip">{chip}</span>
                  ))}
                </div>
              </div>

              {form.successVision && (
                <div className="rm-section">
                  <div className="rm-section-label">What Success Looks Like</div>
                  <p style={{ fontStyle: 'italic', borderLeft: '2px solid #171717', paddingLeft: '1rem', margin: 0 }}>
                    "{form.successVision}"
                  </p>
                </div>
              )}

              {/* Root cause */}
              <div className="rm-section">
                <div className="rm-section-label">What's Actually Going On</div>
                <p>{roadmap.rootCause}</p>
              </div>

              {/* Interventions */}
              <div className="rm-section">
                <div className="rm-section-label">The Tools That Work</div>
                <div className="rm-interventions">
                  {roadmap.interventions.map((iv) => (
                    <div className="rm-intervention" key={iv.name}>
                      <h4>{iv.name}</h4>
                      <p>{iv.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phases */}
              <div className="rm-section">
                <div className="rm-section-label">Your Timeline</div>
                <div className="rm-phases">
                  {roadmap.phases.map((p) => (
                    <div className="rm-phase" key={p.label}>
                      <div className="rm-phase-label">{p.label}</div>
                      <div className="rm-phase-text">{p.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* The missing piece */}
              <div className="rm-missing-piece">
                <div className="label">The Piece You Can't Do Alone</div>
                <p>{roadmap.missingPiece}</p>
              </div>

              {/* CTA */}
              {isAssessmentTier ? (
                <div className="rm-cta prominent">
                  <div className="label">Your Next Step</div>
                  <h3>Book Your Range Assessment.</h3>
                  <p>
                    This is how we turn your roadmap into a real plan. 45 minutes with a provider, a full review
                    of your history and goals, and a protocol you can start on. $197 — credited back if you move forward.
                    Your contact info is already saved, so booking takes about 2 minutes.
                  </p>
                  <button className="rm-cta-btn" onClick={goToAssessment}>
                    Book My Range Assessment →
                  </button>
                </div>
              ) : (
                <div className="rm-cta">
                  <div className="label">Your Next Step</div>
                  <h3>We'll send you the full roadmap and check in.</h3>
                  <p>
                    You said you're not ready to move fast — that's fine. We'll email you your roadmap plus a
                    short series breaking down each piece over the next couple weeks. When you're ready, the
                    Range Assessment is here for you.
                  </p>
                  <button className="rm-cta-btn" onClick={goToAssessment}>
                    I'm Ready — Book Assessment →
                  </button>
                  <div>
                    <a href="/" className="rm-soft-link">Or just head back to the site →</a>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
