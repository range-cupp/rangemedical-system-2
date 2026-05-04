// pages/hrt-questionnaire-male.jsx
// Patient-facing HRT questionnaire for men considering hormone replacement therapy.
// Standalone (no token) — sent via the Guides system.
// Matches the v2 design used by /pages/questionnaire/[token].js exactly.

import { useState, useCallback, useMemo } from 'react';
import Head from 'next/head';

// ═══════════════════════════════════════════════════════════
// Questionnaire definition
// ═══════════════════════════════════════════════════════════
const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const SECTIONS = [
  {
    id: 'patient_info',
    title: 'Your information',
    subtitle: 'A few quick details so your provider can reach you and review your responses.',
    questions: [
      { id: 'first_name', text: 'First name', type: 'text', placeholder: 'First name', required: true },
      { id: 'last_name', text: 'Last name', type: 'text', placeholder: 'Last name', required: true },
      { id: 'date_of_birth', text: 'Date of birth', type: 'date', required: true },
      { id: 'phone', text: 'Mobile phone', type: 'tel', placeholder: '(555) 555-5555', required: true },
      { id: 'email', text: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
    ],
  },
  {
    id: 'symptoms',
    title: 'Symptom severity',
    subtitle: 'Rate each symptom on a 0–10 scale. 0 means you do not experience it; 10 means severe.',
    questions: [
      { id: 'sym_sleep_disruption',     text: 'Sleep disruption',          type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_irritability',         text: 'Irritability',              type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_depression',           text: 'Depression',                type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_breast_development',   text: 'Breast development',        type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_morning_erections',    text: 'Decreased morning erections', type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_sex_drive',            text: 'Decreased sex drive',       type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_climax',               text: 'Harder to reach climax',    type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_testicular_size',      text: 'Reduced testicular size',   type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_motivation',           text: 'Decreased motivation',      type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_self_confidence',      text: 'Decreased self confidence', type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_abdominal_fat',        text: 'Abdominal fat',             type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_muscle_atrophy',       text: 'Muscle atrophy',            type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_fatigue',              text: 'Fatigue',                   type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_recent_memory',        text: 'Loss of recent memory',     type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_dry_skin',             text: 'Dry skin',                  type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_arthritis',            text: 'Arthritis or joint pain',   type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_hair_loss',            text: 'Hair loss',                 type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
      { id: 'sym_weight_gain',          text: 'Weight gain',               type: 'slider', min: 0, max: 10, defaultValue: 0, minLabel: 'None', maxLabel: 'Severe' },
    ],
  },
  {
    id: 'family_and_sexual_health',
    title: 'Family planning & sexual health',
    subtitle: 'Please answer the following questions.',
    questions: [
      { id: 'has_children',                 text: 'Do you have any children?',                                          type: 'single_select', options: YES_NO_OPTIONS },
      { id: 'plan_more_children',           text: 'Do you plan to have more children?',                                 type: 'single_select', options: YES_NO_OPTIONS },
      { id: 'partner_pregnant_breastfeeding', text: 'Do you currently have a partner who is pregnant or breastfeeding?', type: 'single_select', options: YES_NO_OPTIONS },
      { id: 'past_steroids',                text: 'Have you used steroids in the past?',                                type: 'single_select', options: YES_NO_OPTIONS },
      { id: 'current_steroids',             text: 'Do you currently use steroids?',                                     type: 'single_select', options: YES_NO_OPTIONS },
      { id: 'sexually_active',              text: 'Are you currently sexually active?',                                 type: 'single_select', options: YES_NO_OPTIONS },
    ],
  },
  {
    id: 'goals',
    title: 'Your goals',
    subtitle: 'What are your top three goals for starting hormone replacement therapy?',
    questions: [
      { id: 'goal_1', text: 'Goal #1', type: 'textarea', placeholder: 'e.g. more energy throughout the day', required: true },
      { id: 'goal_2', text: 'Goal #2', type: 'textarea', placeholder: 'e.g. improved strength and recovery', required: true },
      { id: 'goal_3', text: 'Goal #3', type: 'textarea', placeholder: 'e.g. better sleep and mood', required: true },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════
export default function HrtMaleQuestionnaire() {
  const sections = SECTIONS;
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState(() => {
    // Initialize slider defaults so they count as answered
    const initial = {};
    for (const section of sections) {
      for (const q of section.questions) {
        if (q.type === 'slider' && initial[q.id] === undefined) {
          initial[q.id] = q.defaultValue ?? q.min ?? 0;
        }
      }
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const updateResponse = useCallback((questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const isSectionComplete = () => {
    if (!sections[currentSection]) return false;
    const section = sections[currentSection];
    return section.questions.every(q => {
      if (q.required === false) return true;
      if (q.type === 'textarea' && q.required !== true) return true;
      const val = responses[q.id];
      return val !== undefined && val !== null && val !== '';
    });
  };

  const nextSection = async () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      await handleSubmit();
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/hrt-questionnaire-male/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });
      if (res.ok) {
        setComplete(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Something went wrong submitting your responses.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMsg('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = useMemo(
    () => (sections.length > 0
      ? Math.round(((currentSection + 1) / sections.length) * 100)
      : 0),
    [currentSection, sections.length]
  );

  const firstName = responses.first_name || '';

  // ─── Complete state ───
  if (complete) {
    return (
      <Page title="Complete">
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.successTitle}>All done{firstName ? `, ${firstName}` : ''}</h1>
          <p style={styles.successText}>
            Your responses have been submitted. Your care team at Range Medical will review everything before your appointment.
          </p>
          <p style={{ ...styles.successText, color: '#a0a0a0', fontSize: '14px', marginTop: '16px' }}>
            You can close this page now.
          </p>
        </div>
      </Page>
    );
  }

  const section = sections[currentSection];
  if (!section) return null;

  const isLastSection = currentSection === sections.length - 1;
  const canProceed = isSectionComplete();

  return (
    <Page title={section.title || 'HRT Questionnaire'} progress={progress}>
      <main style={styles.main}>
        <div style={styles.sectionLabel}>
          <div style={styles.sectionLabelDot} />
          <span>Section {currentSection + 1} of {sections.length}</span>
        </div>

        <h1 style={styles.sectionTitle}>{section.title}</h1>
        {section.subtitle && (
          <p style={styles.sectionSubtitle}>{section.subtitle}</p>
        )}

        <div style={styles.questionList}>
          {section.questions.map((q, idx) => (
            <QuestionRenderer
              key={q.id}
              question={q}
              value={responses[q.id]}
              onChange={(val) => updateResponse(q.id, val)}
              index={idx}
            />
          ))}
        </div>

        {errorMsg && (
          <p style={styles.errorMsg}>{errorMsg}</p>
        )}

        <div style={styles.navRow}>
          {currentSection > 0 ? (
            <button onClick={prevSection} style={styles.backButton}>
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={nextSection}
            disabled={!canProceed || submitting}
            style={{
              ...styles.nextButton,
              opacity: canProceed && !submitting ? 1 : 0.4,
            }}
          >
            {submitting ? 'SUBMITTING...' : isLastSection ? 'SUBMIT' : 'CONTINUE'}
          </button>
        </div>
      </main>
    </Page>
  );
}

// ═══════════════════════════════════════════════════════════
// Question Renderer — handles all question types
// ═══════════════════════════════════════════════════════════
function QuestionRenderer({ question, value, onChange }) {
  const q = question;

  return (
    <div style={styles.questionBlock}>
      <label style={styles.questionLabel}>{q.text}</label>

      {q.type === 'slider' && (
        <div style={styles.sliderContainer}>
          <input
            type="range"
            min={q.min}
            max={q.max}
            value={value ?? q.defaultValue ?? q.min}
            onChange={(e) => onChange(Number(e.target.value))}
            style={styles.slider}
          />
          <div style={styles.sliderLabels}>
            <span style={styles.sliderMinLabel}>{q.minLabel}</span>
            <span style={styles.sliderValue}>{value ?? q.defaultValue ?? q.min}</span>
            <span style={styles.sliderMaxLabel}>{q.maxLabel}</span>
          </div>
        </div>
      )}

      {q.type === 'single_select' && (
        <div style={styles.optionsGrid}>
          {q.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                ...styles.optionCard,
                background: value === opt.value ? '#1a1a1a' : '#fff',
                color: value === opt.value ? '#fff' : '#1a1a1a',
                borderColor: value === opt.value ? '#1a1a1a' : '#e0e0e0',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {(q.type === 'text' || q.type === 'email' || q.type === 'tel') && (
        <input
          type={q.type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={styles.textInput}
          placeholder={q.placeholder || ''}
          autoComplete={q.type === 'email' ? 'email' : q.type === 'tel' ? 'tel' : 'off'}
        />
      )}

      {q.type === 'date' && (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={styles.textInput}
        />
      )}

      {q.type === 'textarea' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={styles.textarea}
          placeholder={q.placeholder || ''}
          rows={3}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Page wrapper — Range Medical v2 design
// ═══════════════════════════════════════════════════════════
function Page({ title, progress, children }) {
  return (
    <>
      <Head>
        <title>{title} | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #fafafa;
          color: #1a1a1a;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
        }

        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 0;
          background: #e0e0e0;
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1a1a1a;
          cursor: pointer;
          border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        input[type="range"]::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1a1a1a;
          cursor: pointer;
          border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
      `}</style>

      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.wordmark}>RANGE</div>
          {progress != null && (
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
          )}
        </header>

        {children}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Styles — Range Medical v2 design system
// ═══════════════════════════════════════════════════════════
const styles = {
  container: {
    minHeight: '100vh',
    background: '#fafafa',
  },
  header: {
    padding: '20px 24px',
    background: '#fff',
    borderBottom: '1px solid #e8e8e8',
  },
  wordmark: {
    fontSize: '13px',
    fontWeight: 800,
    letterSpacing: '0.15em',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: '16px',
  },
  progressBar: {
    height: 4,
    background: '#f0f0f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#1a1a1a',
    transition: 'width 0.3s ease',
  },

  main: {
    maxWidth: 500,
    margin: '0 auto',
    padding: '32px 24px',
  },

  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#808080',
  },
  sectionLabelDot: {
    width: 8,
    height: 8,
    background: '#808080',
  },

  sectionTitle: {
    fontSize: '28px',
    fontWeight: 700,
    margin: '0 0 8px',
    color: '#1a1a1a',
    lineHeight: 1.2,
  },
  sectionSubtitle: {
    fontSize: '16px',
    color: '#737373',
    margin: '0 0 32px',
    lineHeight: 1.6,
  },

  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  questionBlock: {
    paddingBottom: '24px',
    borderBottom: '1px solid #e5e5e5',
  },
  questionLabel: {
    display: 'block',
    fontSize: '15px',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '12px',
    lineHeight: 1.4,
  },

  sliderContainer: { padding: '8px 0' },
  slider: { width: '100%', marginBottom: '8px' },
  sliderLabels: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sliderMinLabel: { fontSize: '11px', color: '#a0a0a0', maxWidth: '30%' },
  sliderValue: { fontSize: '24px', fontWeight: 700, color: '#1a1a1a' },
  sliderMaxLabel: { fontSize: '11px', color: '#a0a0a0', textAlign: 'right', maxWidth: '30%' },

  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  optionCard: {
    padding: '14px 16px', border: '2px solid #e0e0e0', borderRadius: 0,
    background: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 500,
    textAlign: 'left', transition: 'all 0.15s ease', fontFamily: 'inherit',
  },

  textInput: {
    width: '100%', padding: '14px 16px', border: '2px solid #e0e0e0',
    borderRadius: 0, fontSize: '16px', fontFamily: 'inherit', outline: 'none',
  },
  textarea: {
    width: '100%', padding: '14px 16px', border: '2px solid #e0e0e0',
    borderRadius: 0, fontSize: '16px', fontFamily: 'inherit', outline: 'none',
    resize: 'none', minHeight: 90,
  },

  navRow: {
    display: 'flex', gap: '12px',
    marginTop: '32px',
  },
  backButton: {
    padding: '16px 24px', background: '#f5f5f5', border: 'none',
    borderRadius: 0, fontSize: '11px', fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', color: '#404040', letterSpacing: '0.12em', textTransform: 'uppercase',
  },
  nextButton: {
    flex: 1, padding: '16px 24px', background: '#1a1a1a', color: '#fff', border: 'none',
    borderRadius: 0, fontSize: '11px', fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', letterSpacing: '0.12em', textTransform: 'uppercase',
    transition: 'opacity 0.15s ease',
  },

  errorMsg: {
    marginTop: '16px',
    padding: '12px 16px',
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: '14px',
    border: '1px solid #fecaca',
  },

  successCard: {
    background: '#fff',
    padding: '48px 32px',
    textAlign: 'center',
    maxWidth: 400,
    margin: '80px auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  successIcon: {
    width: 64, height: 64, borderRadius: '50%',
    background: '#1a1a1a', color: '#fff', fontSize: '28px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px',
  },
  successTitle: { fontSize: '24px', fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' },
  successText: { fontSize: '16px', color: '#737373', margin: 0, lineHeight: 1.6 },
};
