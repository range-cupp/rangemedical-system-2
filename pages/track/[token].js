// /pages/track/[token].js
// Patient Recovery Tracker with Peptide & Weight Loss Questionnaires
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// =====================================================
// PEPTIDE OPTIONS
// =====================================================
const PEPTIDE_ACTIVITIES = [
  'Walking', 'Running', 'Weight Training', 'Sports', 'Work/Job',
  'Household Chores', 'Sleep', 'Sitting/Standing', 'Driving'
];

const PAIN_FREQUENCIES = [
  'Constant (always present)',
  'Frequent (most of the day)',
  'Intermittent (comes and goes)',
  'Only with activity',
  'Only at night'
];

const INJURY_DURATIONS = [
  'Less than 1 week', '1-2 weeks', '2-4 weeks', '1-3 months',
  '3-6 months', '6-12 months', 'More than 1 year'
];

// =====================================================
// WEIGHT LOSS OPTIONS
// =====================================================
const EXERCISE_FREQUENCIES = [
  'None',
  '1-2 times per week',
  '3-4 times per week',
  '5+ times per week'
];

const SIDE_EFFECTS = [
  'Nausea', 'Fatigue', 'Headache', 'Constipation', 
  'Diarrhea', 'Dizziness', 'Injection Site Reaction', 'None'
];

const CLOTHING_CHANGES = [
  'Much looser',
  'Slightly looser', 
  'About the same',
  'Slightly tighter'
];

export default function PatientTracker() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [saving, setSaving] = useState(null);
  
  // Questionnaire state
  const [intakeQuestionnaire, setIntakeQuestionnaire] = useState(null);
  const [completionQuestionnaire, setCompletionQuestionnaire] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Unified form data for both types
  const [formData, setFormData] = useState({
    // Shared
    sleep_quality: 5,
    energy_level: 5,
    current_medications: '',
    recovery_goals: '',
    goals_achieved: '',
    overall_improvement: 5,
    would_recommend: true,
    continue_treatment: true,
    additional_notes: '',
    // Peptide-specific
    primary_complaint: '',
    injury_location: '',
    injury_duration: '',
    pain_level: 5,
    pain_frequency: '',
    mobility_score: 5,
    activities_limited: [],
    previous_treatments: '',
    // Weight Loss-specific
    current_weight: '',
    goal_weight: '',
    weight_at_completion: '',
    appetite_level: 5,
    cravings_level: 5,
    exercise_frequency: '',
    diet_description: '',
    previous_weight_loss_attempts: '',
    side_effects: [],
    side_effects_severity: 0,
    clothing_fit_change: ''
  });

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/patient/tracker?token=${token}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setIntakeQuestionnaire(json.intakeQuestionnaire || null);
        setCompletionQuestionnaire(json.completionQuestionnaire || null);
        
        // Determine if we should show a form
        const category = getQuestionnaireCategory(json.protocol?.program_type);
        if (category && !json.intakeQuestionnaire) {
          setActiveForm('intake');
        }
      } else {
        setError('Protocol not found. Please check your link.');
      }
    } catch (err) {
      setError('Unable to load. Please try again.');
    }
    setLoading(false);
  };

  // Determine questionnaire category from program type
  const getQuestionnaireCategory = (programType) => {
    if (!programType) return null;
    
    const peptideTypes = ['recovery_jumpstart_10day', 'month_program_30day', 'maintenance_4week', 
                          'injection_clinic', 'jumpstart_10day', 'recovery_10day', 'month_30day'];
    const weightLossTypes = ['weight_loss_program', 'weight_loss_injection'];
    
    if (peptideTypes.includes(programType)) return 'peptide';
    if (weightLossTypes.includes(programType)) return 'weight_loss';
    
    // Check by name if type not matched
    return null;
  };

  const isNearEnd = (protocol) => {
    if (!protocol?.end_date) return false;
    const daysLeft = Math.ceil((new Date(protocol.end_date) - new Date()) / (1000*60*60*24));
    return daysLeft <= 2;
  };

  // Form handlers
  const handleActivityToggle = (activity) => {
    setFormData(prev => ({
      ...prev,
      activities_limited: prev.activities_limited.includes(activity)
        ? prev.activities_limited.filter(a => a !== activity)
        : [...prev.activities_limited, activity]
    }));
  };

  const handleSideEffectToggle = (effect) => {
    setFormData(prev => {
      let newEffects;
      if (effect === 'None') {
        newEffects = prev.side_effects.includes('None') ? [] : ['None'];
      } else {
        newEffects = prev.side_effects.filter(e => e !== 'None');
        if (newEffects.includes(effect)) {
          newEffects = newEffects.filter(e => e !== effect);
        } else {
          newEffects = [...newEffects, effect];
        }
      }
      return { ...prev, side_effects: newEffects };
    });
  };

  const submitQuestionnaire = async (type) => {
    setSubmitting(true);
    const category = getQuestionnaireCategory(data?.protocol?.program_type);
    
    try {
      const res = await fetch(`/api/patient/questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          questionnaire_type: type,
          questionnaire_category: category,
          ...formData
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (type === 'intake') {
          setIntakeQuestionnaire(result.response);
        } else {
          setCompletionQuestionnaire(result.response);
        }
        setActiveForm(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save');
      }
    } catch (err) {
      alert('Error saving. Please try again.');
    }
    setSubmitting(false);
  };

  // Injection tracker - Calculate injection days for weight loss
  const getInjectionDays = (durationDays, frequency, isWeightLoss) => {
    if (!isWeightLoss) {
      // For peptides, return all days (or handle other frequencies)
      if (!frequency || frequency === 'Daily') {
        return Array.from({ length: durationDays }, (_, i) => ({ day: i + 1, label: `${i + 1}` }));
      }
      if (frequency === 'Every other day') {
        return Array.from({ length: durationDays }, (_, i) => i + 1)
          .filter(d => d % 2 === 1)
          .map(d => ({ day: d, label: `${d}` }));
      }
      if (frequency.includes('5 days on')) {
        return Array.from({ length: durationDays }, (_, i) => i + 1)
          .filter(d => {
            const dayInWeek = ((d - 1) % 7) + 1;
            return dayInWeek <= 5;
          })
          .map(d => ({ day: d, label: `${d}` }));
      }
      // Default: all days
      return Array.from({ length: durationDays }, (_, i) => ({ day: i + 1, label: `${i + 1}` }));
    }
    
    // Weight Loss: Calculate weekly injection days
    const weeks = Math.ceil(durationDays / 7);
    const injectionDays = [];
    
    if (frequency === '2x weekly') {
      // 2x weekly: Days 1, 4, 8, 11, 15, 18, etc. (Mon/Thu pattern)
      for (let week = 0; week < weeks; week++) {
        const day1 = week * 7 + 1;
        const day2 = week * 7 + 4;
        if (day1 <= durationDays) injectionDays.push({ day: day1, label: `Wk${week + 1}a`, week: week + 1, shot: 1 });
        if (day2 <= durationDays) injectionDays.push({ day: day2, label: `Wk${week + 1}b`, week: week + 1, shot: 2 });
      }
    } else {
      // 1x weekly: Days 1, 8, 15, 22, etc.
      for (let week = 0; week < weeks; week++) {
        const day = week * 7 + 1;
        if (day <= durationDays) injectionDays.push({ day: day, label: `Week ${week + 1}`, week: week + 1, shot: 1 });
      }
    }
    
    return injectionDays;
  };

  const toggleDay = async (day, isCompleted) => {
    if (isInClinic) return; // Read-only for in-clinic
    setSaving(day);
    try {
      await fetch(`/api/patient/tracker?token=${token}`, {
        method: isCompleted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
    setSaving(null);
  };

  // Score Slider Component
  const ScoreSlider = ({ label, value, onChange, lowLabel, highLabel, color }) => (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#666', width: '55px' }}>{lowLabel}</span>
        <input type="range" min="0" max="10" value={value} onChange={(e) => onChange(parseInt(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: '11px', color: '#666', width: '55px', textAlign: 'right' }}>{highLabel}</span>
      </div>
      <div style={{ textAlign: 'center', marginTop: '4px' }}>
        <span style={{ display: 'inline-block', background: color || 'black', color: 'white', padding: '2px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: '600' }}>{value}/10</span>
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', padding: '20px', textAlign: 'center' }}>
        <div><div style={{ fontSize: '48px', marginBottom: '16px' }}>:(</div><p style={{ color: '#666' }}>{error}</p></div>
      </div>
    );
  }

  const protocol = data?.protocol;
  const injectionLogs = data?.injectionLogs || [];
  const completedDays = injectionLogs.map(log => log.day_number);
  const totalDays = protocol?.duration_days || 10;
  const progress = Math.round((completedDays.length / totalDays) * 100);
  const daysLeft = protocol?.end_date ? Math.max(0, Math.ceil((new Date(protocol.end_date) - new Date()) / (1000*60*60*24))) : 0;
  const category = getQuestionnaireCategory(protocol?.program_type);
  const isWeightLoss = category === 'weight_loss';
  const isPeptide = category === 'peptide';
  const isInClinic = protocol?.injection_location === 'in_clinic';

  return (
    <>
      <Head>
        <title>{isWeightLoss ? 'Weight Loss Tracker' : 'Recovery Tracker'} | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui' }}>
        {/* Header */}
        <header style={{ background: 'black', color: 'white', padding: '20px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', letterSpacing: '2px' }}>RANGE MEDICAL</h1>
          <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.8 }}>{isWeightLoss ? 'Weight Loss Tracker' : 'Recovery Tracker'}</p>
        </header>

        {/* In-Clinic Banner */}
        {isInClinic && (
          <div style={{ background: '#e3f2fd', borderBottom: '1px solid #90caf9', padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#1565c0', fontWeight: '500' }}>🏥 In-Clinic Protocol</div>
            <div style={{ fontSize: '12px', color: '#1976d2', marginTop: '4px' }}>Your progress is recorded by our staff during visits</div>
          </div>
        )}

        {/* Patient Info */}
        <div style={{ background: 'white', padding: '16px 20px', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>{protocol?.patient_name}</div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{protocol?.program_name}</div>
        </div>

        {/* =====================================================
            PEPTIDE INTAKE FORM (Take-Home Only)
        ===================================================== */}
        {activeForm === 'intake' && isPeptide && !isInClinic && (
          <div style={{ padding: '16px' }}>
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ background: 'black', color: 'white', padding: '16px 20px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Starting Assessment</h2>
                <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.8 }}>Help us track your recovery progress</p>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>What's your main issue? *</label>
                  <textarea value={formData.primary_complaint} onChange={(e) => setFormData({ ...formData, primary_complaint: e.target.value })} required rows={2} placeholder="e.g., Shoulder pain, lower back inflammation" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Location *</label>
                    <input type="text" value={formData.injury_location} onChange={(e) => setFormData({ ...formData, injury_location: e.target.value })} placeholder="e.g., Right shoulder" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>How long?</label>
                    <select value={formData.injury_duration} onChange={(e) => setFormData({ ...formData, injury_duration: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}>
                      <option value="">Select...</option>
                      {INJURY_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <ScoreSlider label="Current Pain Level *" value={formData.pain_level} onChange={(v) => setFormData({ ...formData, pain_level: v })} lowLabel="No pain" highLabel="Severe" color={formData.pain_level > 6 ? '#c62828' : formData.pain_level > 3 ? '#ef6c00' : '#2e7d32'} />
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Pain Frequency</label>
                  <select value={formData.pain_frequency} onChange={(e) => setFormData({ ...formData, pain_frequency: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}>
                    <option value="">Select...</option>
                    {PAIN_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <ScoreSlider label="Mobility / Range of Motion" value={formData.mobility_score} onChange={(v) => setFormData({ ...formData, mobility_score: v })} lowLabel="Very limited" highLabel="Full" />
                <ScoreSlider label="Sleep Quality" value={formData.sleep_quality} onChange={(v) => setFormData({ ...formData, sleep_quality: v })} lowLabel="Very poor" highLabel="Excellent" />
                <ScoreSlider label="Energy Level" value={formData.energy_level} onChange={(v) => setFormData({ ...formData, energy_level: v })} lowLabel="Exhausted" highLabel="Energetic" />
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Activities limited by your condition</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {PEPTIDE_ACTIVITIES.map(a => (
                      <button key={a} type="button" onClick={() => handleActivityToggle(a)} style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', border: formData.activities_limited.includes(a) ? '2px solid black' : '1px solid #ddd', background: formData.activities_limited.includes(a) ? 'black' : 'white', color: formData.activities_limited.includes(a) ? 'white' : '#333' }}>{a}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>What do you hope to achieve? *</label>
                  <textarea value={formData.recovery_goals} onChange={(e) => setFormData({ ...formData, recovery_goals: e.target.value })} rows={2} placeholder="e.g., Reduce pain, return to exercise, sleep better" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => submitQuestionnaire('intake')} disabled={submitting || !formData.primary_complaint} style={{ width: '100%', padding: '14px', background: submitting ? '#666' : 'black', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}>{submitting ? 'Saving...' : 'Save & Start Tracking'}</button>
                <button onClick={() => setActiveForm(null)} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#666', border: 'none', fontSize: '13px', cursor: 'pointer' }}>Skip for now</button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            WEIGHT LOSS INTAKE FORM
        ===================================================== */}
        {activeForm === 'intake' && isWeightLoss && !isInClinic && (
          <div style={{ padding: '16px' }}>
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ background: '#ff9800', color: 'white', padding: '16px 20px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Starting Assessment</h2>
                <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.9 }}>Let's capture your starting point</p>
              </div>
              <div style={{ padding: '20px' }}>
                {/* Weight */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Current Weight (lbs) *</label>
                    <input type="number" value={formData.current_weight} onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })} placeholder="e.g., 185" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Goal Weight (lbs)</label>
                    <input type="number" value={formData.goal_weight} onChange={(e) => setFormData({ ...formData, goal_weight: e.target.value })} placeholder="e.g., 165" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <ScoreSlider label="Appetite Level" value={formData.appetite_level} onChange={(v) => setFormData({ ...formData, appetite_level: v })} lowLabel="No appetite" highLabel="Always hungry" color="#ff9800" />
                <ScoreSlider label="Cravings Level" value={formData.cravings_level} onChange={(v) => setFormData({ ...formData, cravings_level: v })} lowLabel="No cravings" highLabel="Intense cravings" color="#ff9800" />
                <ScoreSlider label="Energy Level" value={formData.energy_level} onChange={(v) => setFormData({ ...formData, energy_level: v })} lowLabel="Exhausted" highLabel="Energetic" />
                <ScoreSlider label="Sleep Quality" value={formData.sleep_quality} onChange={(v) => setFormData({ ...formData, sleep_quality: v })} lowLabel="Very poor" highLabel="Excellent" />
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Exercise Frequency</label>
                  <select value={formData.exercise_frequency} onChange={(e) => setFormData({ ...formData, exercise_frequency: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}>
                    <option value="">Select...</option>
                    {EXERCISE_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Current Medications</label>
                  <input type="text" value={formData.current_medications} onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })} placeholder="e.g., Metformin, Ozempic, etc." style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>What have you tried before?</label>
                  <textarea value={formData.previous_weight_loss_attempts} onChange={(e) => setFormData({ ...formData, previous_weight_loss_attempts: e.target.value })} rows={2} placeholder="e.g., Keto, Weight Watchers, other medications" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>What are your goals? *</label>
                  <textarea value={formData.recovery_goals} onChange={(e) => setFormData({ ...formData, recovery_goals: e.target.value })} rows={2} placeholder="e.g., Lose 20 lbs, fit into old clothes, more energy" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => submitQuestionnaire('intake')} disabled={submitting || !formData.current_weight} style={{ width: '100%', padding: '14px', background: submitting ? '#666' : '#ff9800', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}>{submitting ? 'Saving...' : 'Save & Start Tracking'}</button>
                <button onClick={() => setActiveForm(null)} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#666', border: 'none', fontSize: '13px', cursor: 'pointer' }}>Skip for now</button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            PEPTIDE COMPLETION FORM
        ===================================================== */}
        {activeForm === 'completion' && isPeptide && !isInClinic && (
          <div style={{ padding: '16px' }}>
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ background: '#2e7d32', color: 'white', padding: '16px 20px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Protocol Completion</h2>
                <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.9 }}>Let's see your progress!</p>
              </div>
              <div style={{ padding: '20px' }}>
                {intakeQuestionnaire && (
                  <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>YOUR STARTING BASELINE</div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                      <div><div style={{ fontSize: '20px', fontWeight: '700' }}>{intakeQuestionnaire.pain_level}</div><div style={{ fontSize: '10px', color: '#666' }}>Pain</div></div>
                      <div><div style={{ fontSize: '20px', fontWeight: '700' }}>{intakeQuestionnaire.mobility_score}</div><div style={{ fontSize: '10px', color: '#666' }}>Mobility</div></div>
                      <div><div style={{ fontSize: '20px', fontWeight: '700' }}>{intakeQuestionnaire.sleep_quality}</div><div style={{ fontSize: '10px', color: '#666' }}>Sleep</div></div>
                      <div><div style={{ fontSize: '20px', fontWeight: '700' }}>{intakeQuestionnaire.energy_level}</div><div style={{ fontSize: '10px', color: '#666' }}>Energy</div></div>
                    </div>
                  </div>
                )}
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Rate how you feel <strong>now</strong>:</p>
                <ScoreSlider label="Current Pain Level" value={formData.pain_level} onChange={(v) => setFormData({ ...formData, pain_level: v })} lowLabel="No pain" highLabel="Severe" color={formData.pain_level > 6 ? '#c62828' : formData.pain_level > 3 ? '#ef6c00' : '#2e7d32'} />
                <ScoreSlider label="Mobility" value={formData.mobility_score} onChange={(v) => setFormData({ ...formData, mobility_score: v })} lowLabel="Very limited" highLabel="Full" />
                <ScoreSlider label="Sleep Quality" value={formData.sleep_quality} onChange={(v) => setFormData({ ...formData, sleep_quality: v })} lowLabel="Very poor" highLabel="Excellent" />
                <ScoreSlider label="Energy Level" value={formData.energy_level} onChange={(v) => setFormData({ ...formData, energy_level: v })} lowLabel="Exhausted" highLabel="Energetic" />
                <ScoreSlider label="Overall Improvement" value={formData.overall_improvement} onChange={(v) => setFormData({ ...formData, overall_improvement: v })} lowLabel="Worse" highLabel="Much better" color="#1565c0" />
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>What improvements did you notice?</label>
                  <textarea value={formData.goals_achieved} onChange={(e) => setFormData({ ...formData, goals_achieved: e.target.value })} rows={2} placeholder="e.g., Less pain, sleeping better, back to exercising" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Would you like to continue treatment?</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setFormData({ ...formData, continue_treatment: true })} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', border: formData.continue_treatment ? '2px solid #2e7d32' : '1px solid #ddd', background: formData.continue_treatment ? '#e8f5e9' : 'white', color: formData.continue_treatment ? '#2e7d32' : '#333' }}>Yes, I'm interested</button>
                    <button type="button" onClick={() => setFormData({ ...formData, continue_treatment: false })} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', border: !formData.continue_treatment ? '2px solid #666' : '1px solid #ddd', background: !formData.continue_treatment ? '#f5f5f5' : 'white', color: '#333' }}>Not right now</button>
                  </div>
                </div>
                <button onClick={() => submitQuestionnaire('completion')} disabled={submitting} style={{ width: '100%', padding: '14px', background: submitting ? '#666' : '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}>{submitting ? 'Saving...' : 'Submit'}</button>
                <button onClick={() => setActiveForm(null)} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#666', border: 'none', fontSize: '13px', cursor: 'pointer' }}>I'll do this later</button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            WEIGHT LOSS COMPLETION FORM
        ===================================================== */}
        {activeForm === 'completion' && isWeightLoss && !isInClinic && (
          <div style={{ padding: '16px' }}>
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ background: '#2e7d32', color: 'white', padding: '16px 20px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Monthly Check-In</h2>
                <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.9 }}>Let's see your progress!</p>
              </div>
              <div style={{ padding: '20px' }}>
                {intakeQuestionnaire && (
                  <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#e65100', marginBottom: '8px' }}>STARTING POINT</div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                      <div><div style={{ fontSize: '20px', fontWeight: '700' }}>{intakeQuestionnaire.current_weight}</div><div style={{ fontSize: '10px', color: '#666' }}>lbs</div></div>
                      <div><div style={{ fontSize: '20px', fontWeight: '700' }}>{intakeQuestionnaire.appetite_level}/10</div><div style={{ fontSize: '10px', color: '#666' }}>Appetite</div></div>
                      <div><div style={{ fontSize: '20px', fontWeight: '700' }}>{intakeQuestionnaire.cravings_level}/10</div><div style={{ fontSize: '10px', color: '#666' }}>Cravings</div></div>
                    </div>
                  </div>
                )}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Current Weight (lbs) *</label>
                  <input type="number" value={formData.weight_at_completion} onChange={(e) => setFormData({ ...formData, weight_at_completion: e.target.value })} placeholder="e.g., 178" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                  {intakeQuestionnaire?.current_weight && formData.weight_at_completion && (
                    <div style={{ marginTop: '8px', fontSize: '14px', color: parseFloat(formData.weight_at_completion) < parseFloat(intakeQuestionnaire.current_weight) ? '#2e7d32' : '#666' }}>
                      {parseFloat(formData.weight_at_completion) < parseFloat(intakeQuestionnaire.current_weight) 
                        ? `🎉 Down ${(parseFloat(intakeQuestionnaire.current_weight) - parseFloat(formData.weight_at_completion)).toFixed(1)} lbs!`
                        : parseFloat(formData.weight_at_completion) === parseFloat(intakeQuestionnaire.current_weight)
                        ? 'Same as starting weight'
                        : `Up ${(parseFloat(formData.weight_at_completion) - parseFloat(intakeQuestionnaire.current_weight)).toFixed(1)} lbs`
                      }
                    </div>
                  )}
                </div>
                <ScoreSlider label="Current Appetite" value={formData.appetite_level} onChange={(v) => setFormData({ ...formData, appetite_level: v })} lowLabel="No appetite" highLabel="Always hungry" color="#ff9800" />
                <ScoreSlider label="Current Cravings" value={formData.cravings_level} onChange={(v) => setFormData({ ...formData, cravings_level: v })} lowLabel="No cravings" highLabel="Intense" color="#ff9800" />
                <ScoreSlider label="Energy Level" value={formData.energy_level} onChange={(v) => setFormData({ ...formData, energy_level: v })} lowLabel="Exhausted" highLabel="Energetic" />
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Any side effects?</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {SIDE_EFFECTS.map(e => (
                      <button key={e} type="button" onClick={() => handleSideEffectToggle(e)} style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', border: formData.side_effects.includes(e) ? '2px solid #ff9800' : '1px solid #ddd', background: formData.side_effects.includes(e) ? '#fff3e0' : 'white', color: formData.side_effects.includes(e) ? '#e65100' : '#333' }}>{e}</button>
                    ))}
                  </div>
                </div>
                {formData.side_effects.length > 0 && !formData.side_effects.includes('None') && (
                  <ScoreSlider label="Side Effects Severity" value={formData.side_effects_severity} onChange={(v) => setFormData({ ...formData, side_effects_severity: v })} lowLabel="Mild" highLabel="Severe" color="#c62828" />
                )}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>How are your clothes fitting?</label>
                  <select value={formData.clothing_fit_change} onChange={(e) => setFormData({ ...formData, clothing_fit_change: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}>
                    <option value="">Select...</option>
                    {CLOTHING_CHANGES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Would you like to continue?</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setFormData({ ...formData, continue_treatment: true })} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', border: formData.continue_treatment ? '2px solid #2e7d32' : '1px solid #ddd', background: formData.continue_treatment ? '#e8f5e9' : 'white', color: formData.continue_treatment ? '#2e7d32' : '#333' }}>Yes!</button>
                    <button type="button" onClick={() => setFormData({ ...formData, continue_treatment: false })} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', border: !formData.continue_treatment ? '2px solid #666' : '1px solid #ddd', background: !formData.continue_treatment ? '#f5f5f5' : 'white', color: '#333' }}>Not now</button>
                  </div>
                </div>
                <button onClick={() => submitQuestionnaire('completion')} disabled={submitting || !formData.weight_at_completion} style={{ width: '100%', padding: '14px', background: submitting ? '#666' : '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}>{submitting ? 'Saving...' : 'Submit'}</button>
                <button onClick={() => setActiveForm(null)} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#666', border: 'none', fontSize: '13px', cursor: 'pointer' }}>I'll do this later</button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            MAIN TRACKER VIEW
        ===================================================== */}
        {!activeForm && (
          <div style={{ padding: '16px' }}>
            
            {/* Peptide Intake Summary */}
            {intakeQuestionnaire && isPeptide && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#666' }}>STARTING BASELINE</span>
                  <span style={{ fontSize: '11px', color: '#4caf50', background: '#e8f5e9', padding: '2px 8px', borderRadius: '10px' }}>Recorded</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div><div style={{ fontSize: '22px', fontWeight: '700', color: intakeQuestionnaire.pain_level > 6 ? '#c62828' : intakeQuestionnaire.pain_level > 3 ? '#ef6c00' : '#2e7d32' }}>{intakeQuestionnaire.pain_level}</div><div style={{ fontSize: '11px', color: '#666' }}>Pain</div></div>
                  <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{intakeQuestionnaire.mobility_score}</div><div style={{ fontSize: '11px', color: '#666' }}>Mobility</div></div>
                  <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{intakeQuestionnaire.sleep_quality}</div><div style={{ fontSize: '11px', color: '#666' }}>Sleep</div></div>
                  <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{intakeQuestionnaire.energy_level}</div><div style={{ fontSize: '11px', color: '#666' }}>Energy</div></div>
                </div>
              </div>
            )}

            {/* Weight Loss Intake Summary */}
            {intakeQuestionnaire && isWeightLoss && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#e65100' }}>STARTING POINT</span>
                  <span style={{ fontSize: '11px', color: '#4caf50', background: '#e8f5e9', padding: '2px 8px', borderRadius: '10px' }}>Recorded</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{intakeQuestionnaire.current_weight}</div><div style={{ fontSize: '11px', color: '#666' }}>lbs</div></div>
                  <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{intakeQuestionnaire.goal_weight || '—'}</div><div style={{ fontSize: '11px', color: '#666' }}>Goal</div></div>
                  <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{intakeQuestionnaire.appetite_level}/10</div><div style={{ fontSize: '11px', color: '#666' }}>Appetite</div></div>
                  <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{intakeQuestionnaire.cravings_level}/10</div><div style={{ fontSize: '11px', color: '#666' }}>Cravings</div></div>
                </div>
              </div>
            )}

            {/* Completion Summary */}
            {completionQuestionnaire && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #4caf50' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#2e7d32' }}>FINAL RESULTS</span>
                  <span style={{ fontSize: '11px', color: 'white', background: '#4caf50', padding: '2px 8px', borderRadius: '10px' }}>Complete</span>
                </div>
                {isPeptide && (
                  <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div><div style={{ fontSize: '22px', fontWeight: '700', color: '#2e7d32' }}>{completionQuestionnaire.pain_level}</div><div style={{ fontSize: '11px', color: '#666' }}>Pain</div></div>
                    <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{completionQuestionnaire.mobility_score}</div><div style={{ fontSize: '11px', color: '#666' }}>Mobility</div></div>
                    <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{completionQuestionnaire.overall_improvement}</div><div style={{ fontSize: '11px', color: '#666' }}>Improvement</div></div>
                  </div>
                )}
                {isWeightLoss && (
                  <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#2e7d32' }}>{completionQuestionnaire.weight_at_completion}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>lbs</div>
                      {intakeQuestionnaire?.current_weight && (
                        <div style={{ fontSize: '11px', color: '#4caf50', marginTop: '2px' }}>
                          {parseFloat(intakeQuestionnaire.current_weight) - parseFloat(completionQuestionnaire.weight_at_completion) > 0 
                            ? `↓${(parseFloat(intakeQuestionnaire.current_weight) - parseFloat(completionQuestionnaire.weight_at_completion)).toFixed(1)}`
                            : ''}
                        </div>
                      )}
                    </div>
                    <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{completionQuestionnaire.appetite_level}/10</div><div style={{ fontSize: '11px', color: '#666' }}>Appetite</div></div>
                    <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{completionQuestionnaire.cravings_level}/10</div><div style={{ fontSize: '11px', color: '#666' }}>Cravings</div></div>
                  </div>
                )}
              </div>
            )}

            {/* Prompt for intake - Take-Home Only */}
            {!intakeQuestionnaire && category && !isInClinic && (
              <button onClick={() => setActiveForm('intake')} style={{ width: '100%', padding: '16px', background: 'white', border: '2px dashed #ddd', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Complete Your Starting Assessment</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Help us track your progress</div>
              </button>
            )}

            {/* In-Clinic: Show message if no intake yet */}
            {!intakeQuestionnaire && category && isInClinic && (
              <div style={{ width: '100%', padding: '16px', background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '12px', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#1565c0' }}>Assessment Pending</div>
                <div style={{ fontSize: '12px', color: '#1976d2' }}>Our staff will record your starting assessment at your visit</div>
              </div>
            )}

            {/* Prompt for completion - Take-Home Only */}
            {intakeQuestionnaire && !completionQuestionnaire && daysLeft <= 2 && !isInClinic && (
              <button onClick={() => setActiveForm('completion')} style={{ width: '100%', padding: '16px', background: '#e8f5e9', border: '2px solid #4caf50', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ fontWeight: '600', color: '#2e7d32', marginBottom: '4px' }}>Protocol Ending Soon!</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Complete your final assessment</div>
              </button>
            )}

            {/* Progress */}
            {(() => {
              const injectionDays = getInjectionDays(totalDays, protocol?.dose_frequency, isWeightLoss);
              const completedCount = injectionDays.filter(d => completedDays.includes(d.day)).length;
              const totalInjections = injectionDays.length;
              const injectionProgress = Math.round((completedCount / totalInjections) * 100);
              
              return (
                <>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>Injection Progress</span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>
                        {completedCount} / {totalInjections} {isWeightLoss ? 'injections' : 'days'}
                      </span>
                    </div>
                    <div style={{ height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${injectionProgress}%`, background: isWeightLoss ? '#ff9800' : 'black', transition: 'width 0.3s' }} />
                    </div>
                    {daysLeft > 0 && <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'right' }}>{daysLeft} days remaining</div>}
                    {isWeightLoss && (
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
                        {protocol?.dose_frequency === '2x weekly' ? '2 injections per week (split dose)' : '1 injection per week'}
                      </div>
                    )}
                  </div>

                  {/* Injection Calendar */}
                  <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
                      {isInClinic ? 'Your Injection Schedule' : 'Tap to mark complete'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isWeightLoss ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)', gap: '10px' }}>
                      {injectionDays.map(({ day, label, week }) => {
                        const isCompleted = completedDays.includes(day);
                        const isSaving = saving === day;
                        const accentColor = isWeightLoss ? '#ff9800' : 'black';
                        const isClickable = !isInClinic && !isSaving;
                        
                        return (
                          <button key={day} onClick={() => isClickable && toggleDay(day, isCompleted)} disabled={!isClickable}
                            style={{
                              aspectRatio: isWeightLoss ? '1.2' : '1',
                              borderRadius: '8px', 
                              fontSize: isWeightLoss ? '13px' : '16px', 
                              fontWeight: '600', 
                              cursor: isClickable ? 'pointer' : 'default',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                              opacity: isSaving ? 0.5 : 1,
                              border: isCompleted ? `2px solid ${accentColor}` : '1px solid #ddd',
                              background: isCompleted ? accentColor : 'white',
                              color: isCompleted ? 'white' : '#333',
                              padding: '8px 4px'
                            }}
                          >
                            <span>{label}</span>
                            {isCompleted && <span style={{ fontSize: '10px' }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#666' }}>
              Questions? <a href="tel:9499973988" style={{ color: 'black', fontWeight: '500' }}>(949) 997-3988</a>
            </div>
          </div>
        )}

        <footer style={{ textAlign: 'center', padding: '20px', fontSize: '11px', color: '#999' }}>Range Medical · Costa Mesa, CA</footer>
      </div>
    </>
  );
}
