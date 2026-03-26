// pages/energy-check.jsx
// "Energy & Recovery Check" — quiz-based lead magnet funnel
// Flow: Landing + contact → 10 quiz questions → Scored results + CTA

import Layout from '../components/Layout';
import Head from 'next/head';
import Script from 'next/script';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';

const META_PIXEL_ID = '4295373617400545';

const QUESTIONS = [
  {
    id: 'energy_level',
    text: 'How would you rate your daily energy level?',
    type: 'slider',
    min: 1,
    max: 10,
    lowLabel: 'Running on empty',
    highLabel: 'Fully charged',
    scoreMap: (val) => (val <= 3 ? 3 : val <= 5 ? 2 : val <= 7 ? 1 : 0),
  },
  {
    id: 'brain_fog',
    text: 'Do you experience brain fog or difficulty concentrating?',
    type: 'single',
    options: [
      { label: 'Never', value: 'never', score: 0 },
      { label: 'Sometimes', value: 'sometimes', score: 1 },
      { label: 'Often', value: 'often', score: 2 },
      { label: 'Daily', value: 'daily', score: 3 },
    ],
  },
  {
    id: 'recovery_speed',
    text: 'How quickly do you recover from workouts or physical activity?',
    type: 'single',
    options: [
      { label: 'I bounce back fine', value: 'fine', score: 0 },
      { label: 'A bit slower than I\'d like', value: 'slow', score: 1 },
      { label: 'Noticeably slow', value: 'very_slow', score: 2 },
      { label: 'I avoid exercise because of it', value: 'avoid', score: 3 },
    ],
  },
  {
    id: 'sleep',
    text: "How's your sleep?",
    type: 'single',
    options: [
      { label: 'Great — I wake up rested', value: 'great', score: 0 },
      { label: 'OK — could be better', value: 'ok', score: 1 },
      { label: 'Poor — I toss and turn', value: 'poor', score: 2 },
      { label: 'Terrible — it affects my day', value: 'terrible', score: 3 },
    ],
  },
  {
    id: 'body_comp',
    text: 'Have you noticed changes in your body composition despite consistent effort?',
    type: 'single',
    options: [
      { label: 'No — things are on track', value: 'no', score: 0 },
      { label: 'Some changes I can\'t explain', value: 'some', score: 1 },
      { label: 'Yes — significantly', value: 'significant', score: 3 },
    ],
  },
  {
    id: 'duration',
    text: 'How long have these symptoms been going on?',
    type: 'single',
    options: [
      { label: 'Less than 3 months', value: 'lt3m', score: 0 },
      { label: '3–6 months', value: '3to6m', score: 1 },
      { label: '6–12 months', value: '6to12m', score: 2 },
      { label: 'Over a year', value: 'gt1y', score: 3 },
    ],
  },
  {
    id: 'recent_labs',
    text: 'Have you had bloodwork done in the last 12 months?',
    type: 'single',
    options: [
      { label: 'Yes — comprehensive panel', value: 'comprehensive', score: 0 },
      { label: 'Yes — just basics (CBC, metabolic)', value: 'basic', score: 1 },
      { label: 'No', value: 'no', score: 2 },
    ],
  },
  {
    id: 'tried_treatments',
    text: 'Have you tried hormone therapy, peptides, or IV therapy before?',
    type: 'single',
    options: [
      { label: 'Yes', value: 'yes', score: 0 },
      { label: 'No', value: 'no', score: 1 },
      { label: 'Not sure what those are', value: 'unsure', score: 1 },
    ],
  },
  {
    id: 'importance',
    text: 'How important is it to you to fix this in the next 30 days?',
    type: 'slider',
    min: 1,
    max: 10,
    lowLabel: 'Not urgent',
    highLabel: 'Top priority',
    scoreMap: (val) => (val >= 8 ? 3 : val >= 5 ? 2 : val >= 3 ? 1 : 0),
  },
];

function computeScore(answers) {
  let total = 0;
  for (const q of QUESTIONS) {
    const val = answers[q.id];
    if (val === undefined || val === null) continue;
    if (q.type === 'slider' && q.scoreMap) {
      total += q.scoreMap(val);
    } else if (q.type === 'single') {
      const opt = q.options.find((o) => o.value === val);
      if (opt) total += opt.score;
    }
  }
  return total;
}

function getSeverity(score) {
  if (score <= 8) return 'green';
  if (score <= 16) return 'yellow';
  return 'red';
}

const SEVERITY_CONFIG = {
  green: {
    color: '#16A34A',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    label: 'LOW',
    headline: 'Your energy looks solid.',
    description: 'Your symptoms are mild — a few targeted adjustments could make a real difference. But even mild patterns can mask something deeper that only labs can reveal.',
  },
  yellow: {
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    label: 'MODERATE',
    headline: 'There are clear patterns worth investigating.',
    description: 'Multiple areas are flagging — this isn\'t just "getting older." These symptoms often point to hormonal, nutrient, or cellular-level issues that respond well to targeted protocols.',
  },
  red: {
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    label: 'HIGH',
    headline: 'Multiple red flags here.',
    description: 'Your body is sending clear signals. Symptoms at this level rarely resolve on their own — they typically point to measurable deficiencies or imbalances that show up on labwork.',
  },
};

function getTips(answers) {
  const tips = [];
  if (['poor', 'terrible'].includes(answers.sleep)) {
    tips.push('Sleep is your recovery foundation. Poor sleep alone can tank energy, focus, and body composition. Addressing this first creates a multiplier effect on everything else.');
  }
  if (['often', 'daily'].includes(answers.brain_fog)) {
    tips.push('Persistent brain fog is often tied to inflammation, hormone imbalance, or nutrient gaps — not just stress or aging. Labs can usually pinpoint the driver.');
  }
  if (['very_slow', 'avoid'].includes(answers.recovery_speed)) {
    tips.push('Slow recovery suggests your body\'s repair systems aren\'t firing at full capacity. This is one of the most responsive areas to targeted treatment.');
  }
  if (answers.body_comp === 'significant') {
    tips.push('Unexplained body composition changes despite effort are a classic hormone signal — especially testosterone, thyroid, and cortisol. Worth measuring.');
  }
  if (['6to12m', 'gt1y'].includes(answers.duration)) {
    tips.push('Symptoms lasting 6+ months rarely self-correct. The longer they persist, the more likely there\'s a measurable root cause. Earlier intervention = faster results.');
  }
  if (answers.recent_labs === 'no') {
    tips.push('Flying blind without recent labs means you\'re guessing. A comprehensive panel gives you and your provider an actual map to work from.');
  }
  // Return top 3
  return tips.slice(0, 3);
}

export default function EnergyCheckPage() {
  const router = useRouter();
  const [step, setStep] = useState('landing'); // landing, quiz, results
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sliderValues, setSliderValues] = useState({ energy_level: 5, importance: 5 });
  const [contact, setContact] = useState({ firstName: '', email: '', phone: '', consentSms: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState(null);
  const [severity, setSeverity] = useState(null);
  const quizRef = useRef(null);
  const resultsRef = useRef(null);

  const source = router.query.src || router.query.source || 'direct';

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contact.firstName.trim() || !contact.email.trim() || !contact.phone.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setStep('quiz');
    if (typeof fbq === 'function') fbq('track', 'Lead', { content_name: 'energy-check-start' });
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const advancingRef = useRef(false);

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Auto-advance after 400ms for single-select
    const q = QUESTIONS[quizIndex];
    if (q.type === 'single' && !advancingRef.current) {
      advancingRef.current = true;
      setTimeout(() => {
        advanceQuiz();
        advancingRef.current = false;
      }, 400);
    }
  };

  const handleSliderConfirm = () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    const q = QUESTIONS[quizIndex];
    setAnswers((prev) => ({ ...prev, [q.id]: sliderValues[q.id] }));
    advanceQuiz();
    setTimeout(() => { advancingRef.current = false; }, 100);
  };

  const advanceQuiz = () => {
    if (quizIndex < QUESTIONS.length - 1) {
      setQuizIndex((prev) => prev + 1);
      // Instant scroll to top so progress bar is always visible — no jarring animation
      setTimeout(() => window.scrollTo({ top: 0 }), 50);
    } else if (!submitting) {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    setError('');

    // Merge slider values for any unanswered sliders
    const finalAnswers = { ...answers };
    for (const q of QUESTIONS) {
      if (q.type === 'slider' && finalAnswers[q.id] === undefined) {
        finalAnswers[q.id] = sliderValues[q.id];
      }
    }

    const computedScore = computeScore(finalAnswers);
    const computedSeverity = getSeverity(computedScore);

    try {
      const res = await fetch('/api/energy-check/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: contact.firstName.trim(),
          email: contact.email.trim().toLowerCase(),
          phone: contact.phone.trim(),
          primaryConcern: 'energy',
          answers: finalAnswers,
          score: computedScore,
          severity: computedSeverity,
          door: 'energy',
          consentSms: contact.consentSms,
          source,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setScore(computedScore);
      setSeverity(computedSeverity);
      setStep('results');
      if (typeof fbq === 'function') fbq('track', 'CompleteRegistration', { content_name: 'energy-check-complete', value: computedScore, status: computedSeverity });
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = QUESTIONS[Math.min(quizIndex, QUESTIONS.length - 1)];
  const progress = ((quizIndex + 1) / QUESTIONS.length) * 100;
  const tips = severity ? getTips(answers) : [];
  const severityInfo = severity ? SEVERITY_CONFIG[severity] : null;

  const ctaUrl = `/start/energy?name=${encodeURIComponent(contact.firstName.trim())}&from=energy-check`;
  const ctaLabel = 'Pick Your Lab Panel';

  return (
    <Layout title="Energy & Recovery Check | Range Medical" description="Take the free 3-minute Energy & Recovery Check. Find out why you feel tired, foggy, or slow to recover.">
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <Head>
        <style>{`
          .ec-page { color: #171717; }

          /* Animations */
          .ec-fade-in {
            animation: ecFadeIn 0.5s ease forwards;
          }
          @keyframes ecFadeIn {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Hero */
          .ec-hero {
            padding: 6rem 2rem 2rem;
            text-align: left;
            max-width: 680px;
            margin: 0 auto;
          }
          .ec-hero h1 {
            font-size: clamp(2.5rem, 6vw, 4rem);
            font-weight: 900;
            line-height: 0.95;
            margin: 0 0 20px;
            letter-spacing: -0.02em;
            text-transform: uppercase;
          }
          .ec-hero-rule {
            width: 100%;
            height: 1px;
            background: #e0e0e0;
            margin-bottom: 20px;
          }
          .ec-hero p {
            font-size: 18px;
            color: #737373;
            line-height: 1.6;
            margin: 0;
          }

          /* Contact form */
          .ec-form-section {
            max-width: 480px;
            margin: 0 auto;
            padding: 40px 2rem 6rem;
          }
          .ec-form-card {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            padding: 36px 28px;
          }
          .ec-form-card h3 {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          .ec-form-card > p {
            font-size: 14px;
            color: #737373;
            margin: 0 0 24px;
          }
          .ec-field {
            margin-bottom: 18px;
          }
          .ec-field label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #737373;
            margin-bottom: 6px;
          }
          .ec-field input[type="text"],
          .ec-field input[type="email"],
          .ec-field input[type="tel"] {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid #e0e0e0;
            font-size: 15px;
            font-family: inherit;
            background: #fff;
            transition: border-color 0.2s;
            box-sizing: border-box;
          }
          .ec-field input:focus {
            outline: none;
            border-color: #171717;
          }

          /* Consent */
          .ec-consent {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin: 20px 0 24px;
          }
          .ec-consent input[type="checkbox"] {
            margin-top: 0;
            width: 24px;
            height: 24px;
            min-width: 24px;
            min-height: 24px;
            accent-color: #171717;
            flex-shrink: 0;
          }
          .ec-consent label {
            font-size: 13px;
            color: #737373;
            line-height: 1.5;
          }

          /* Buttons */
          .ec-btn {
            width: 100%;
            padding: 16px;
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
          .ec-btn:hover:not(:disabled) {
            background: #404040;
          }
          .ec-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .ec-btn-outline {
            width: 100%;
            padding: 16px;
            background: #fff;
            color: #1a1a1a;
            border: 2px solid #1a1a1a;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
          }
          .ec-btn-outline:hover {
            background: #f5f5f5;
          }
          .ec-error {
            background: #FEF2F2;
            color: #DC2626;
            padding: 12px 16px;
            font-size: 14px;
            margin-bottom: 16px;
          }

          /* Quiz */
          .ec-quiz-section {
            max-width: 560px;
            margin: 0 auto;
            padding: 40px 2rem 6rem;
          }
          .ec-progress-bar {
            width: 100%;
            height: 6px;
            background: #e0e0e0;
            margin-bottom: 8px;
            overflow: hidden;
          }
          .ec-progress-fill {
            height: 100%;
            background: #808080;
            transition: width 0.4s ease;
          }
          .ec-progress-text {
            font-size: 13px;
            color: #a3a3a3;
            margin-bottom: 32px;
          }
          .ec-question-card {
            background: #fff;
            border: 1px solid #e0e0e0;
            padding: 36px 28px;
          }
          .ec-question-card h2 {
            font-size: 22px;
            font-weight: 700;
            line-height: 1.3;
            margin: 0 0 24px;
          }
          .ec-option {
            display: block;
            width: 100%;
            padding: 16px 18px;
            border: 1px solid #e0e0e0;
            background: #fff;
            font-size: 15px;
            font-weight: 500;
            color: #171717;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 10px;
            font-family: inherit;
          }
          .ec-option:hover {
            border-color: #a3a3a3;
            background: #fafafa;
          }
          .ec-option.selected {
            border-color: #1a1a1a;
            background: #f5f5f5;
          }

          /* Slider question */
          .ec-slider-wrap {
            padding: 8px 0;
          }
          .ec-slider-labels {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: #737373;
            margin-bottom: 12px;
          }
          .ec-slider-input {
            width: 100%;
            -webkit-appearance: none;
            height: 8px;
            background: #e0e0e0;
            outline: none;
          }
          .ec-slider-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #1a1a1a;
            cursor: pointer;
          }
          .ec-slider-input::-moz-range-thumb {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #1a1a1a;
            cursor: pointer;
            border: none;
          }
          .ec-slider-value {
            text-align: center;
            font-size: 48px;
            font-weight: 900;
            margin: 20px 0;
            line-height: 1;
            color: #808080;
          }
          .ec-slider-confirm {
            margin-top: 8px;
          }

          /* Results */
          .ec-results-section {
            max-width: 600px;
            margin: 0 auto;
            padding: 6rem 2rem;
          }
          .ec-score-card {
            padding: 36px 28px;
            text-align: center;
            margin-bottom: 32px;
          }
          .ec-score-badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            padding: 6px 16px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-bottom: 16px;
          }
          .ec-score-card h2 {
            font-size: 28px;
            font-weight: 900;
            margin: 0 0 12px;
            line-height: 0.95;
            text-transform: uppercase;
            letter-spacing: -0.02em;
          }
          .ec-score-card p {
            font-size: 16px;
            color: #737373;
            line-height: 1.6;
            margin: 0;
          }
          .ec-score-number {
            font-size: 64px;
            font-weight: 900;
            line-height: 1;
            margin-bottom: 8px;
            color: #808080;
          }
          .ec-score-label {
            font-size: 14px;
            color: #737373;
            margin-bottom: 20px;
          }

          /* Tips */
          .ec-tips {
            margin-bottom: 36px;
          }
          .ec-tips h3 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 16px;
          }
          .ec-tip {
            display: flex;
            gap: 12px;
            padding: 16px;
            background: #fafafa;
            border: 1px solid #e0e0e0;
            margin-bottom: 10px;
            font-size: 14px;
            line-height: 1.6;
            color: #737373;
          }
          .ec-tip-number {
            flex-shrink: 0;
            font-size: 14px;
            font-weight: 900;
            color: #808080;
            margin-top: 2px;
          }

          /* Pivot */
          .ec-pivot {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            padding: 32px 28px;
            margin-bottom: 24px;
          }
          .ec-pivot h3 {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 12px;
          }
          .ec-pivot p {
            font-size: 15px;
            color: #737373;
            line-height: 1.7;
            margin: 0 0 24px;
          }
          .ec-pivot-features {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            margin-bottom: 24px;
          }
          .ec-pivot-feature {
            text-align: center;
            padding: 16px 8px;
            background: #fff;
            border: 1px solid #e0e0e0;
          }
          .ec-pivot-feature-text {
            font-size: 13px;
            font-weight: 600;
            color: #171717;
            line-height: 1.3;
          }

          /* Trust */
          .ec-trust {
            text-align: center;
            padding: 0 0 40px;
          }
          .ec-trust p {
            font-size: 13px;
            color: #a3a3a3;
            margin: 0;
            line-height: 1.5;
          }

          /* Trust bar (landing) */
          .ec-trust-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
            padding: 0 2rem 8px;
            max-width: 680px;
            margin: 0 auto;
          }
          .ec-trust-item {
            font-size: 13px;
            color: #737373;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .ec-trust-item strong {
            color: #171717;
          }
          .ec-stars {
            color: #F59E0B;
            font-size: 14px;
            letter-spacing: 1px;
          }

          /* Testimonial */
          .ec-testimonial {
            max-width: 480px;
            margin: 0 auto;
            padding: 0 2rem;
          }
          .ec-testimonial-card {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            padding: 20px 24px;
            font-size: 14px;
            line-height: 1.6;
            color: #525252;
            font-style: italic;
          }
          .ec-testimonial-attr {
            font-style: normal;
            font-size: 13px;
            color: #a3a3a3;
            margin-top: 10px;
          }

          /* Sticky mobile CTA */
          .ec-sticky-cta {
            display: none;
          }
          @media (max-width: 640px) {
            .ec-sticky-cta {
              display: block;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              background: #fff;
              border-top: 1px solid #e0e0e0;
              padding: 12px 20px;
              padding-bottom: max(12px, env(safe-area-inset-bottom));
              z-index: 50;
            }
            .ec-results-section {
              padding-bottom: 100px;
            }
          }

          /* Responsive */
          @media (max-width: 640px) {
            .ec-hero { padding: 4rem 2rem 2rem; }
            .ec-hero h1 { font-size: 32px; }
            .ec-hero p { font-size: 16px; }
            .ec-form-card { padding: 28px 20px; }
            .ec-question-card { padding: 28px 20px; }
            .ec-question-card h2 { font-size: 19px; }
            .ec-score-card { padding: 28px 20px; }
            .ec-score-card h2 { font-size: 24px; }
            .ec-score-number { font-size: 48px; }
            .ec-pivot { padding: 24px 20px; }
            .ec-pivot-features { grid-template-columns: 1fr; gap: 8px; }
            .ec-results-section { padding: 4rem 2rem; }
          }
        `}</style>
      </Head>

      <div className="ec-page">
        {/* ── STEP 1: LANDING + CONTACT ── */}
        {step === 'landing' && (
          <div className="ec-fade-in">
            <div className="ec-hero">
              <div className="v2-label"><span className="v2-dot" /> FREE — TAKES 3 MINUTES</div>
              <h1>Energy & Recovery Check</h1>
              <div className="ec-hero-rule" />
              <p>Find out why you feel tired, foggy, or slow to recover — and what to do about it in the next 30 days.</p>
              <p style={{ fontSize: 14, color: '#a3a3a3', marginTop: 12 }}>If your score shows moderate or high concern, we may recommend starting with a lab panel so your provider has real data to work from.</p>
            </div>

            <div className="ec-trust-bar">
              <div className="ec-trust-item">
                <span className="ec-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                <strong>5.0 stars</strong> on Google
              </div>
              <div className="ec-trust-item">
                Newport Beach &middot; Board-certified providers
              </div>
            </div>

            <div className="ec-form-section">
              <div className="ec-form-card">
                <h3>Start Your Check</h3>
                <p>We&apos;ll ask 9 quick questions, then show you exactly what&apos;s going on.</p>

                {error && <div className="ec-error">{error}</div>}

                <form onSubmit={handleContactSubmit}>
                  <div className="ec-field">
                    <label htmlFor="ec-first">First Name</label>
                    <input
                      id="ec-first"
                      type="text"
                      value={contact.firstName}
                      onChange={(e) => setContact((c) => ({ ...c, firstName: e.target.value }))}
                      placeholder="First name"
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="ec-field">
                    <label htmlFor="ec-email">Email</label>
                    <input
                      id="ec-email"
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                      placeholder="you@email.com"
                      autoComplete="email"
                    />
                  </div>
                  <div className="ec-field">
                    <label htmlFor="ec-phone">Phone</label>
                    <input
                      id="ec-phone"
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                      placeholder="(949) 555-1234"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="ec-consent">
                    <input
                      type="checkbox"
                      id="ec-sms-consent"
                      checked={contact.consentSms}
                      onChange={(e) => setContact((c) => ({ ...c, consentSms: e.target.checked }))}
                    />
                    <label htmlFor="ec-sms-consent">
                      I agree to receive text messages from Range Medical with my results and follow-up info. Msg & data rates may apply. Reply STOP to unsubscribe.
                    </label>
                  </div>

                  <button type="submit" className="ec-btn">
                    Start the 3-Minute Check
                  </button>
                </form>
              </div>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#a3a3a3' }}>
                No cost. No obligation. Results in 3 minutes.
              </div>
            </div>

            <div className="ec-testimonial">
              <div className="ec-testimonial-card">
                &ldquo;My labs were thoroughly reviewed, clearly explained, and a thoughtful health plan was put in place. From start to finish, the entire experience was professional, efficient, and genuinely personalized.&rdquo;
                <div className="ec-testimonial-attr">&mdash; Mark T., Google Review</div>
              </div>
              <div className="ec-testimonial-card" style={{ marginTop: 12 }}>
                &ldquo;Clear communication, no pressure, and a plan that actually made sense. This is what healthcare should be.&rdquo;
                <div className="ec-testimonial-attr">&mdash; Jennifer K., Google Review</div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: QUIZ ── */}
        {step === 'quiz' && (
          <div className="ec-fade-in" ref={quizRef}>
            <div className="ec-quiz-section">
              <div className="ec-progress-bar">
                <div className="ec-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="ec-progress-text">
                Question {quizIndex + 1} of {QUESTIONS.length}
              </div>

              <div className="ec-question-card ec-fade-in" key={currentQuestion.id}>
                <h2>{currentQuestion.text}</h2>

                {currentQuestion.type === 'single' && (
                  <div>
                    {currentQuestion.options.map((opt) => (
                      <button
                        key={opt.value}
                        className={`ec-option${answers[currentQuestion.id] === opt.value ? ' selected' : ''}`}
                        onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'slider' && (
                  <div className="ec-slider-wrap">
                    <div className="ec-slider-value">
                      {sliderValues[currentQuestion.id] || 5}
                    </div>
                    <div className="ec-slider-labels">
                      <span>{currentQuestion.lowLabel}</span>
                      <span>{currentQuestion.highLabel}</span>
                    </div>
                    <input
                      type="range"
                      className="ec-slider-input"
                      min={currentQuestion.min}
                      max={currentQuestion.max}
                      value={sliderValues[currentQuestion.id] || 5}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSliderValues((prev) => ({ ...prev, [currentQuestion.id]: val }));
                      }}
                    />
                    <div className="ec-slider-confirm">
                      <button
                        className="ec-btn"
                        onClick={handleSliderConfirm}
                        style={{ marginTop: 20 }}
                      >
                        {quizIndex === QUESTIONS.length - 1 ? 'See My Results' : 'Next'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && <div className="ec-error" style={{ marginTop: 16 }}>{error}</div>}
              {submitting && (
                <div style={{ textAlign: 'center', marginTop: 24, color: '#737373', fontSize: 15 }}>
                  Calculating your results...
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: RESULTS ── */}
        {step === 'results' && severityInfo && (
          <div className="ec-fade-in" ref={resultsRef}>
            <div className="ec-results-section">
              {/* Score card */}
              <div
                className="ec-score-card"
                style={{ background: severityInfo.bg, border: `1px solid ${severityInfo.border}` }}
              >
                <div className="ec-score-badge" style={{ background: severityInfo.color, color: '#fff' }}>
                  {severityInfo.label} CONCERN
                </div>
                <div className="ec-score-number">
                  {score}
                </div>
                <div className="ec-score-label">out of 24 points</div>
                <h2>{severityInfo.headline}</h2>
                <p>{severityInfo.description}</p>
              </div>

              {/* Trust strip on results */}
              <div className="ec-trust-bar" style={{ paddingBottom: 24 }}>
                <div className="ec-trust-item">
                  <span className="ec-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                  <strong>5.0 stars</strong> on Google
                </div>
                <div className="ec-trust-item">
                  Board-certified providers &middot; Newport Beach
                </div>
              </div>

              {/* Tips */}
              {tips.length > 0 && (
                <div className="ec-tips">
                  <div className="v2-label"><span className="v2-dot" /> BASED ON YOUR ANSWERS</div>
                  {tips.map((tip, i) => (
                    <div key={i} className="ec-tip">
                      <div className="ec-tip-number">{i + 1}</div>
                      <div>{tip}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* What the quiz can't do */}
              <div className="ec-pivot" style={{ marginBottom: 16 }}>
                <h3>Here&apos;s the thing this quiz can&apos;t do.</h3>
                <p>
                  It can spot patterns in your symptoms — but it can&apos;t see your hormones, nutrients, or deeper cellular markers.
                </p>
              </div>

              {/* Step 1: Pick your lab panel */}
              <div className="ec-pivot">
                <div className="v2-label"><span className="v2-dot" /> STEP 1</div>
                <h3>Pick your lab panel.</h3>
                <p>
                  The first step for patients with a score like yours is a comprehensive lab panel. You come into our Newport Beach clinic for a quick blood draw. When your results are back, your provider reviews them with you 1-on-1 and builds a written plan.
                </p>

                <div className="ec-pivot-features">
                  <div className="ec-pivot-feature">
                    <div className="ec-pivot-feature-text">Comprehensive<br/>Lab Panel</div>
                  </div>
                  <div className="ec-pivot-feature">
                    <div className="ec-pivot-feature-text">1-on-1 Provider<br/>Review</div>
                  </div>
                  <div className="ec-pivot-feature">
                    <div className="ec-pivot-feature-text">Written<br/>Action Plan</div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: '#737373', margin: '0 0 20px', lineHeight: 1.6 }}>
                  Your lab visit is first. Your provider review happens once your results are in.
                </p>

                <a href={ctaUrl} style={{ textDecoration: 'none' }}>
                  <button className="ec-btn">{ctaLabel}</button>
                </a>

                <p style={{ fontSize: 13, color: '#a3a3a3', marginTop: 12, lineHeight: 1.6, textAlign: 'center' }}>
                  Choose Essential or Elite, pick a time for your blood draw, and we&apos;ll text you a confirmation.
                </p>
              </div>

              <div className="ec-trust">
                <p>Range Medical &middot; Newport Beach, CA<br/>No cost for the check. No obligation to book.</p>
                <p style={{ marginTop: 8 }}>
                  Questions? Call or text{' '}
                  <a href="tel:+19499973988" style={{ color: '#737373' }}>(949) 997-3988</a>
                </p>
              </div>
            </div>

            {/* Sticky mobile CTA */}
            <div className="ec-sticky-cta">
              <a href={ctaUrl} style={{ textDecoration: 'none' }}>
                <button className="ec-btn">{ctaLabel}</button>
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
