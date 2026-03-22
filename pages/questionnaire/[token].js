// pages/questionnaire/[token].js
// Patient-facing baseline questionnaire — token-gated, no login required
// Matches intake form design: Inter/system font, black/white/gray, Range Medical header
// Mobile-first, progress bar, one section at a time, auto-save
// Uses getServerSideProps to load data before render

import { useState, useCallback } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import {
  DOOR1_SECTIONS,
  DOOR2_CORE_SECTIONS,
  DOOR2_FINAL_SECTION,
  getApplicableModalities,
  SEVERITY5_OPTIONS,
  AGREE4_OPTIONS,
  BOTHER8_OPTIONS,
} from '../../lib/questionnaire-definitions';

// ═══════════════════════════════════════════════════════════
// Server-side data loading
// ═══════════════════════════════════════════════════════════
export async function getServerSideProps(context) {
  const { token } = context.params;

  try {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Look up questionnaire by token
  const { data: questionnaire, error: qErr } = await supabase
    .from('baseline_questionnaires')
    .select('*')
    .eq('token', token)
    .single();

  if (qErr || !questionnaire) {
    return {
      props: {
        pageError: 'Questionnaire not found or link expired.',
        initialData: null,
        token,
      },
    };
  }

  // Fetch intake data for branching logic
  let intakeData = null;
  if (questionnaire.intake_id) {
    const { data: intake } = await supabase
      .from('intakes')
      .select('symptoms, gender, first_name, injured, interested_in_optimization')
      .eq('id', questionnaire.intake_id)
      .single();
    intakeData = intake;
  }

  // Determine which sections to show
  // Door 1 = injury only, Door 2 = optimization only, Door 3 = both (seamless)
  let sections = [];

  // Door 1 or combined: start with injury baseline
  if (questionnaire.door === 1 || questionnaire.door === 3) {
    sections.push(...DOOR1_SECTIONS.map(s => ({ ...s })));
  }

  // Door 2 or combined: add optimization sections
  if (questionnaire.door === 2 || questionnaire.door === 3) {
    sections.push(...DOOR2_CORE_SECTIONS.map(s => ({ ...s })));
    if (intakeData) {
      const modalities = getApplicableModalities(intakeData.symptoms, intakeData.gender);
      sections.push(...modalities.map(s => ({ ...s })));
    }
    sections.push({ ...DOOR2_FINAL_SECTION });
  }

  return {
    props: {
      pageError: null,
      token,
      initialData: {
        id: questionnaire.id,
        door: questionnaire.door,
        questionnaire_type: questionnaire.questionnaire_type,
        status: questionnaire.status,
        responses: questionnaire.responses || {},
        sections_completed: questionnaire.sections_completed || [],
        sections,
        patient_first_name: intakeData?.first_name || null,
      },
    },
  };

  } catch (err) {
    console.error('getServerSideProps error:', err);
    return {
      props: {
        pageError: 'Something went wrong loading your questionnaire.',
        initialData: null,
        token,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════
export default function BaselineQuestionnaire({ pageError, initialData, token }) {
  const alreadyComplete = initialData?.status === 'completed';

  const [sections] = useState(initialData?.sections || []);
  const [currentSection, setCurrentSection] = useState(() => {
    if (!initialData) return 0;
    const completed = initialData.sections_completed || [];
    if (completed.length > 0 && initialData.sections) {
      const lastIdx = initialData.sections.findIndex(
        s => s.id === completed[completed.length - 1]
      );
      if (lastIdx >= 0 && lastIdx < initialData.sections.length - 1) {
        return lastIdx + 1;
      }
    }
    return 0;
  });
  const [responses, setResponses] = useState(() => {
    const saved = initialData?.responses || {};
    // Initialize slider defaults so they count as "answered"
    const allSections = initialData?.sections || [];
    for (const section of allSections) {
      for (const q of section.questions) {
        if (q.type === 'slider' && saved[q.id] === undefined) {
          saved[q.id] = q.defaultValue ?? q.min ?? 0;
        }
      }
    }
    return saved;
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(alreadyComplete);
  const firstName = initialData?.patient_first_name || '';

  // Update a response value
  const updateResponse = useCallback((questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  }, []);

  // Auto-save section progress
  const saveSection = async (sectionId, sectionResponses) => {
    setSaving(true);
    try {
      await fetch(`/api/questionnaire/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: sectionResponses,
          section_id: sectionId,
        }),
      });
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // Check if current section has all required questions answered
  const isSectionComplete = () => {
    if (!sections[currentSection]) return false;
    const section = sections[currentSection];
    return section.questions.every(q => {
      if (q.type === 'textarea') return true; // optional
      const val = responses[q.id];
      return val !== undefined && val !== null && val !== '';
    });
  };

  // Navigate forward
  const nextSection = async () => {
    const section = sections[currentSection];

    // Collect responses for this section
    const sectionResponses = {};
    section.questions.forEach(q => {
      if (responses[q.id] !== undefined) {
        sectionResponses[q.id] = responses[q.id];
      }
    });

    // Auto-save
    await saveSection(section.id, sectionResponses);

    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      // Final section — submit
      await handleSubmit();
    }
  };

  // Navigate backward
  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  // Final submission
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/questionnaire/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });
      if (res.ok) {
        setComplete(true);
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Progress percentage
  const progress = sections.length > 0
    ? Math.round(((currentSection + 1) / sections.length) * 100)
    : 0;

  // ─── Error state ───
  if (pageError) {
    return (
      <Page title="Error">
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>!</div>
          <h1 style={styles.errorTitle}>Unable to Load</h1>
          <p style={styles.errorText}>{pageError}</p>
          <p style={styles.errorHint}>
            If you believe this is a mistake, please contact Range Medical at (949) 997-3988.
          </p>
        </div>
      </Page>
    );
  }

  // ─── Complete state ───
  if (complete) {
    return (
      <Page title="Complete">
        <div style={styles.successContainer}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.successTitle}>All done{firstName ? `, ${firstName}` : ''}!</h1>
          <p style={styles.successText}>
            Your responses have been submitted. Your care team will review everything before your appointment.
          </p>
          <p style={styles.successHint}>You can close this page now.</p>
        </div>
      </Page>
    );
  }

  const section = sections[currentSection];
  if (!section) return null;

  const isLastSection = currentSection === sections.length - 1;
  const canProceed = isSectionComplete();

  return (
    <Page title={section.title || 'Questionnaire'}>
      {/* Progress bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <span style={styles.progressText}>
          {currentSection + 1} of {sections.length}
        </span>
      </div>

      {/* Section content */}
      <div style={styles.formContainer}>
        <h2 style={styles.sectionTitle}>{section.title}</h2>
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

        {/* Navigation */}
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
            {submitting ? 'Submitting...' : isLastSection ? 'Submit' : 'Continue'}
          </button>
        </div>

        {saving && (
          <p style={styles.savingIndicator}>Saving...</p>
        )}
      </div>
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
      <label style={styles.questionLabel}>
        {q.text}
      </label>

      {/* Slider (NRS 0-10) */}
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

      {/* Single select (radio-style cards) */}
      {q.type === 'single_select' && (
        <div style={styles.optionsGrid}>
          {q.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                ...styles.optionCard,
                background: value === opt.value ? '#000' : '#fff',
                color: value === opt.value ? '#fff' : '#262626',
                borderColor: value === opt.value ? '#000' : '#d4d4d4',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Frequency scale (PHQ-9, GAD-7) */}
      {q.type === 'frequency' && (
        <div style={styles.frequencyOptions}>
          {q.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                ...styles.frequencyCard,
                background: value === opt.value ? '#000' : '#fff',
                color: value === opt.value ? '#fff' : '#262626',
                borderColor: value === opt.value ? '#000' : '#d4d4d4',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Severity 5-point (AMS) */}
      {q.type === 'severity5' && (
        <div style={styles.frequencyOptions}>
          {SEVERITY5_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                ...styles.frequencyCard,
                background: value === opt.value ? '#000' : '#fff',
                color: value === opt.value ? '#fff' : '#262626',
                borderColor: value === opt.value ? '#000' : '#d4d4d4',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Agree 4-point (TFEQ-R18) */}
      {q.type === 'agree4' && (
        <div style={styles.frequencyOptions}>
          {AGREE4_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                ...styles.frequencyCard,
                background: value === opt.value ? '#000' : '#fff',
                color: value === opt.value ? '#fff' : '#262626',
                borderColor: value === opt.value ? '#000' : '#d4d4d4',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Scale 1-8 (TFEQ-R18 restraint) */}
      {q.type === 'scale8' && (
        <div style={styles.sliderContainer}>
          <input
            type="range"
            min={1}
            max={8}
            value={value ?? 4}
            onChange={(e) => onChange(Number(e.target.value))}
            style={styles.slider}
          />
          <div style={styles.sliderLabels}>
            <span style={styles.sliderMinLabel}>No restraint (1)</span>
            <span style={styles.sliderValue}>{value ?? 4}</span>
            <span style={styles.sliderMaxLabel}>Total restraint (8)</span>
          </div>
        </div>
      )}

      {/* Bother 1-8 (MENQOL) */}
      {q.type === 'bother8' && (
        <div style={styles.frequencyOptions}>
          {BOTHER8_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                ...styles.botherCard,
                background: value === opt.value ? '#000' : '#fff',
                color: value === opt.value ? '#fff' : '#262626',
                borderColor: value === opt.value ? '#000' : '#d4d4d4',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Time input */}
      {q.type === 'time' && (
        <input
          type="time"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={styles.textInput}
        />
      )}

      {/* Number input */}
      {q.type === 'number' && (
        <div style={styles.numberContainer}>
          <input
            type="number"
            min={q.min}
            max={q.max}
            step={q.step || 1}
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            style={styles.numberInput}
            placeholder={q.placeholder || ''}
          />
          {q.suffix && <span style={styles.numberSuffix}>{q.suffix}</span>}
        </div>
      )}

      {/* Textarea */}
      {q.type === 'textarea' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={styles.textarea}
          placeholder={q.placeholder || ''}
          rows={4}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Page wrapper — shared layout with Range Medical header
// ═══════════════════════════════════════════════════════════
function Page({ title, children }) {
  return (
    <>
      <Head>
        <title>{title} | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        :root {
          --black: #000000;
          --white: #ffffff;
          --gray-50: #fafafa;
          --gray-100: #f5f5f5;
          --gray-200: #e5e5e5;
          --gray-300: #d4d4d4;
          --gray-400: #a3a3a3;
          --gray-500: #737373;
          --gray-600: #525252;
          --gray-700: #404040;
          --gray-800: #262626;
          --error: #dc2626;
          --success: #16a34a;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: var(--gray-100);
          color: var(--gray-800);
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
        }

        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: var(--gray-200);
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--black);
          cursor: pointer;
          border: 3px solid var(--white);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        input[type="range"]::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--black);
          cursor: pointer;
          border: 3px solid var(--white);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .q-container { padding: 1rem !important; }
          .q-form { padding: 1.25rem !important; }
        }
      `}</style>

      <div className="q-container" style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.clinicName}>RANGE MEDICAL</div>
          <div style={styles.headerSubtext}>Patient Questionnaire</div>
        </header>

        {children}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Styles — matches intake form design system
// ═══════════════════════════════════════════════════════════
const styles = {
  container: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '1.5rem',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  clinicName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '0.2em',
    marginBottom: '0.25rem',
  },
  headerSubtext: {
    fontSize: '0.875rem',
    color: '#737373',
  },

  // Progress
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e5e5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '0.75rem',
    color: '#737373',
    whiteSpace: 'nowrap',
  },

  // Form container
  formContainer: {
    background: '#fff',
    borderRadius: 8,
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '0.25rem',
  },
  sectionSubtitle: {
    fontSize: '0.875rem',
    color: '#737373',
    marginBottom: '1.5rem',
    lineHeight: 1.5,
  },
  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },

  // Question block
  questionBlock: {
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #f5f5f5',
  },
  questionLabel: {
    display: 'block',
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#262626',
    marginBottom: '0.75rem',
    lineHeight: 1.4,
  },

  // Slider
  sliderContainer: { padding: '0.5rem 0' },
  slider: { width: '100%', marginBottom: '0.5rem' },
  sliderLabels: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sliderMinLabel: { fontSize: '0.75rem', color: '#737373', maxWidth: '30%' },
  sliderValue: { fontSize: '1.5rem', fontWeight: 700, color: '#000' },
  sliderMaxLabel: { fontSize: '0.75rem', color: '#737373', textAlign: 'right', maxWidth: '30%' },

  // Options grid (single select)
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  optionCard: {
    padding: '0.875rem 1rem', border: '1.5px solid #d4d4d4', borderRadius: 8,
    background: '#fff', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 500,
    textAlign: 'left', transition: 'all 0.15s ease', fontFamily: 'inherit',
  },

  // Frequency options (PHQ-9, GAD-7, etc.)
  frequencyOptions: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  frequencyCard: {
    padding: '0.75rem 1rem', border: '1.5px solid #d4d4d4', borderRadius: 8,
    background: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
    textAlign: 'left', transition: 'all 0.15s ease', fontFamily: 'inherit',
  },

  // Bother cards (MENQOL)
  botherCard: {
    padding: '0.625rem 1rem', border: '1.5px solid #d4d4d4', borderRadius: 8,
    background: '#fff', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
    textAlign: 'left', transition: 'all 0.15s ease', fontFamily: 'inherit',
  },

  // Text/number inputs
  textInput: {
    width: '100%', padding: '0.75rem', border: '1px solid #d4d4d4',
    borderRadius: 4, fontSize: '1rem', fontFamily: 'inherit', outline: 'none',
  },
  numberContainer: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  numberInput: {
    width: 120, padding: '0.75rem', border: '1px solid #d4d4d4',
    borderRadius: 4, fontSize: '1rem', fontFamily: 'inherit', outline: 'none',
  },
  numberSuffix: { fontSize: '0.875rem', color: '#737373' },
  textarea: {
    width: '100%', padding: '0.75rem', border: '1px solid #d4d4d4',
    borderRadius: 4, fontSize: '1rem', fontFamily: 'inherit', outline: 'none',
    resize: 'vertical', minHeight: 100,
  },

  // Navigation
  navRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e5e5',
  },
  backButton: {
    padding: '0.75rem 1.5rem', background: 'transparent', border: '1.5px solid #d4d4d4',
    borderRadius: 8, fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', color: '#525252',
  },
  nextButton: {
    padding: '0.75rem 2rem', background: '#000', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'opacity 0.15s ease',
  },

  // Saving indicator
  savingIndicator: { textAlign: 'center', fontSize: '0.75rem', color: '#a3a3a3', marginTop: '0.75rem' },

  // Error
  errorContainer: { textAlign: 'center', padding: '4rem 2rem' },
  errorIcon: {
    width: 48, height: 48, lineHeight: '48px', borderRadius: '50%',
    background: '#fef2f2', color: '#dc2626', fontSize: '1.5rem', fontWeight: 700,
    margin: '0 auto 1rem',
  },
  errorTitle: { fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' },
  errorText: { color: '#525252', marginBottom: '1rem' },
  errorHint: { color: '#a3a3a3', fontSize: '0.875rem' },

  // Success
  successContainer: {
    textAlign: 'center', padding: '4rem 2rem', background: '#fff',
    borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  successIcon: {
    width: 56, height: 56, lineHeight: '56px', borderRadius: '50%',
    background: '#f0fdf4', color: '#16a34a', fontSize: '1.75rem', fontWeight: 700,
    margin: '0 auto 1rem',
  },
  successTitle: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' },
  successText: { color: '#525252', fontSize: '0.9375rem', marginBottom: '0.5rem', lineHeight: 1.6 },
  successHint: { color: '#a3a3a3', fontSize: '0.875rem', marginTop: '1rem' },
};
