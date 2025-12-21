// /pages/onboard/[token].js
// Patient Onboarding - Capture Goals & Baseline
// Range Medical - Premium Design

import { useState } from 'react';
import Head from 'next/head';

const GOALS = [
  { id: 'energy', label: 'More Energy', icon: '⚡' },
  { id: 'weight', label: 'Weight Loss', icon: '⚖️' },
  { id: 'sleep', label: 'Better Sleep', icon: '😴' },
  { id: 'focus', label: 'Mental Clarity', icon: '🧠' },
  { id: 'recovery', label: 'Faster Recovery', icon: '💪' },
  { id: 'hormones', label: 'Hormone Balance', icon: '⚗️' },
  { id: 'longevity', label: 'Longevity', icon: '🌿' },
  { id: 'libido', label: 'Libido', icon: '❤️‍🔥' }
];

export default function PatientOnboarding() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  
  const [data, setData] = useState({
    goals: [],
    whyNow: '',
    importance: 7,
    symptoms: {
      energy: 5,
      sleep: 5,
      mood: 5,
      brain_fog: 5,
      pain: 5,
      libido: 5
    },
    weight: ''
  });

  const toggleGoal = (goalId) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const updateSymptom = (key, value) => {
    setData(prev => ({
      ...prev,
      symptoms: { ...prev.symptoms, [key]: value }
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = window.location.pathname.split('/').pop();
      const res = await fetch(`/api/onboard/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_goals: data.goals,
          why_now: data.whyNow,
          importance_score: data.importance,
          baseline_symptoms: data.symptoms,
          start_weight: data.weight ? parseFloat(data.weight) : null
        })
      });
      
      if (res.ok) {
        setComplete(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (complete) {
    return (
      <>
        <Head><title>Welcome to Range | Range Medical</title></Head>
        <div style={styles.container}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>✓</div>
            <h1 style={styles.successTitle}>You're all set</h1>
            <p style={styles.successText}>
              Your care team will use this to personalize your experience. 
              We'll be in touch soon.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Get Started | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; background: #fafafa; }
          input[type="range"] { -webkit-appearance: none; width: 100%; height: 8px; border-radius: 4px; background: #e5e5e5; }
          input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 28px; height: 28px; border-radius: 50%; background: #000; cursor: pointer; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        `}</style>
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo}>RANGE</div>
          <div style={styles.progress}>
            <div style={{ ...styles.progressFill, width: `${(step / 4) * 100}%` }} />
          </div>
        </header>

        <main style={styles.main}>
          {/* Step 1: Goals */}
          {step === 1 && (
            <div style={styles.step}>
              <h1 style={styles.title}>What brings you to Range?</h1>
              <p style={styles.subtitle}>Select all that apply</p>

              <div style={styles.goalGrid}>
                {GOALS.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    style={{
                      ...styles.goalCard,
                      background: data.goals.includes(goal.id) ? '#000' : '#fff',
                      color: data.goals.includes(goal.id) ? '#fff' : '#000',
                      borderColor: data.goals.includes(goal.id) ? '#000' : '#e5e5e5'
                    }}
                  >
                    <span style={styles.goalIcon}>{goal.icon}</span>
                    <span style={styles.goalLabel}>{goal.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={data.goals.length === 0}
                style={{
                  ...styles.nextButton,
                  opacity: data.goals.length === 0 ? 0.5 : 1
                }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Why Now */}
          {step === 2 && (
            <div style={styles.step}>
              <h1 style={styles.title}>Why is this important now?</h1>
              <p style={styles.subtitle}>What will change when you feel your best?</p>

              <textarea
                value={data.whyNow}
                onChange={(e) => setData({ ...data, whyNow: e.target.value })}
                placeholder="I want to have energy to play with my kids after work..."
                style={styles.textarea}
                rows={4}
              />

              <div style={styles.importanceSection}>
                <label style={styles.label}>
                  How important is fixing this in the next 90 days?
                </label>
                <div style={styles.sliderRow}>
                  <span style={styles.sliderLabel}>Not urgent</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={data.importance}
                    onChange={(e) => setData({ ...data, importance: parseInt(e.target.value) })}
                    style={styles.slider}
                  />
                  <span style={styles.sliderLabel}>Critical</span>
                </div>
                <div style={styles.importanceValue}>{data.importance}/10</div>
              </div>

              <div style={styles.buttonRow}>
                <button onClick={() => setStep(1)} style={styles.backButton}>Back</button>
                <button onClick={() => setStep(3)} style={styles.nextButton}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Baseline Symptoms */}
          {step === 3 && (
            <div style={styles.step}>
              <h1 style={styles.title}>How do you feel today?</h1>
              <p style={styles.subtitle}>This helps us track your progress</p>

              <div style={styles.symptomList}>
                <SymptomSlider
                  label="Energy Level"
                  value={data.symptoms.energy}
                  onChange={(v) => updateSymptom('energy', v)}
                  lowLabel="Exhausted"
                  highLabel="Energized"
                />
                <SymptomSlider
                  label="Sleep Quality"
                  value={data.symptoms.sleep}
                  onChange={(v) => updateSymptom('sleep', v)}
                  lowLabel="Poor"
                  highLabel="Great"
                />
                <SymptomSlider
                  label="Mood"
                  value={data.symptoms.mood}
                  onChange={(v) => updateSymptom('mood', v)}
                  lowLabel="Low"
                  highLabel="Excellent"
                />
                <SymptomSlider
                  label="Mental Clarity"
                  value={data.symptoms.brain_fog}
                  onChange={(v) => updateSymptom('brain_fog', v)}
                  lowLabel="Foggy"
                  highLabel="Sharp"
                />
                <SymptomSlider
                  label="Pain / Discomfort"
                  value={data.symptoms.pain}
                  onChange={(v) => updateSymptom('pain', v)}
                  lowLabel="Severe"
                  highLabel="None"
                />
                <SymptomSlider
                  label="Libido"
                  value={data.symptoms.libido}
                  onChange={(v) => updateSymptom('libido', v)}
                  lowLabel="Low"
                  highLabel="High"
                />
              </div>

              <div style={styles.buttonRow}>
                <button onClick={() => setStep(2)} style={styles.backButton}>Back</button>
                <button onClick={() => setStep(4)} style={styles.nextButton}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 4: Weight & Confirm */}
          {step === 4 && (
            <div style={styles.step}>
              <h1 style={styles.title}>One last thing</h1>
              <p style={styles.subtitle}>Optional: Enter your current weight to track progress</p>

              <div style={styles.weightInput}>
                <input
                  type="number"
                  value={data.weight}
                  onChange={(e) => setData({ ...data, weight: e.target.value })}
                  placeholder="185"
                  style={styles.weightField}
                />
                <span style={styles.weightUnit}>lbs</span>
              </div>

              <div style={styles.summary}>
                <div style={styles.summaryTitle}>Your Profile</div>
                <div style={styles.summaryRow}>
                  <span>Goals:</span>
                  <span>{data.goals.map(g => GOALS.find(x => x.id === g)?.label).join(', ')}</span>
                </div>
                {data.whyNow && (
                  <div style={styles.summaryRow}>
                    <span>Your why:</span>
                    <span style={{ fontStyle: 'italic' }}>"{data.whyNow.substring(0, 50)}{data.whyNow.length > 50 ? '...' : ''}"</span>
                  </div>
                )}
                <div style={styles.summaryRow}>
                  <span>Importance:</span>
                  <span>{data.importance}/10</span>
                </div>
              </div>

              <div style={styles.buttonRow}>
                <button onClick={() => setStep(3)} style={styles.backButton}>Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  style={styles.submitButton}
                >
                  {saving ? 'Saving...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function SymptomSlider({ label, value, onChange, lowLabel, highLabel }) {
  return (
    <div style={styles.symptomItem}>
      <div style={styles.symptomHeader}>
        <span style={styles.symptomLabel}>{label}</span>
        <span style={styles.symptomValue}>{value}/10</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      />
      <div style={styles.symptomRange}>
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#fafafa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  
  header: {
    padding: '20px 24px',
    background: '#fff',
    borderBottom: '1px solid #f0f0f0'
  },
  logo: {
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '2px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  progress: {
    height: '4px',
    background: '#f0f0f0',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: '#000',
    transition: 'width 0.3s ease'
  },
  
  main: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '32px 24px'
  },
  
  step: {},
  
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px',
    color: '#000',
    lineHeight: 1.2
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 32px'
  },
  
  goalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '32px'
  },
  goalCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px',
    border: '2px solid',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '90px'
  },
  goalIcon: {
    fontSize: '24px',
    marginBottom: '8px'
  },
  goalLabel: {
    fontSize: '14px',
    fontWeight: '600'
  },
  
  textarea: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    border: '2px solid #e5e5e5',
    borderRadius: '12px',
    resize: 'none',
    fontFamily: 'inherit',
    marginBottom: '32px',
    boxSizing: 'border-box'
  },
  
  importanceSection: {
    marginBottom: '32px'
  },
  label: {
    display: 'block',
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  slider: {
    flex: 1
  },
  sliderLabel: {
    fontSize: '12px',
    color: '#999',
    minWidth: '60px'
  },
  importanceValue: {
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: '700',
    marginTop: '12px'
  },
  
  symptomList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '32px'
  },
  symptomItem: {},
  symptomHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  symptomLabel: {
    fontSize: '15px',
    fontWeight: '600'
  },
  symptomValue: {
    fontSize: '15px',
    fontWeight: '700'
  },
  symptomRange: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#999',
    marginTop: '4px'
  },
  
  weightInput: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '32px'
  },
  weightField: {
    width: '120px',
    padding: '16px',
    fontSize: '24px',
    fontWeight: '600',
    textAlign: 'center',
    border: '2px solid #e5e5e5',
    borderRadius: '12px'
  },
  weightUnit: {
    fontSize: '18px',
    color: '#666'
  },
  
  summary: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '32px'
  },
  summaryTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '16px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    marginBottom: '12px',
    gap: '16px'
  },
  
  buttonRow: {
    display: 'flex',
    gap: '12px'
  },
  backButton: {
    padding: '16px 24px',
    background: '#f5f5f5',
    color: '#333',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  nextButton: {
    flex: 1,
    padding: '16px 24px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  submitButton: {
    flex: 1,
    padding: '16px 24px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  
  successCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '48px 32px',
    textAlign: 'center',
    maxWidth: '400px',
    margin: '80px auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  successIcon: {
    width: '64px',
    height: '64px',
    background: '#000',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    margin: '0 auto 24px'
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 12px'
  },
  successText: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
    lineHeight: 1.5
  }
};
