// /pages/track/[token].js
// Patient Recovery Tracker - Premium Design
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// =====================================================
// PEPTIDE BENEFITS DATABASE
// =====================================================
const PEPTIDE_INFO = {
  'BPC-157': {
    description: 'Body Protection Compound-157 is a synthetic peptide derived from human gastric juice.',
    benefits: ['Accelerates tissue healing', 'Reduces inflammation', 'Supports gut health', 'Promotes tendon & ligament repair'],
    bestFor: 'Injury recovery, joint pain, gut issues'
  },
  'TB-500': {
    description: 'Thymosin Beta-4 is a naturally occurring peptide that promotes healing and reduces inflammation.',
    benefits: ['Enhances muscle recovery', 'Improves flexibility', 'Supports cardiovascular health', 'Accelerates wound healing'],
    bestFor: 'Muscle injuries, chronic pain, athletic recovery'
  },
  'BPC-157 / TB-500': {
    description: 'A powerful combination that synergistically accelerates healing and reduces inflammation.',
    benefits: ['Enhanced tissue repair', 'Faster recovery time', 'Reduced inflammation', 'Improved mobility'],
    bestFor: 'Comprehensive injury recovery, chronic conditions'
  },
  'CJC-1295 / Ipamorelin': {
    description: 'Growth hormone releasing peptide combination for optimal HGH stimulation.',
    benefits: ['Increased muscle mass', 'Better sleep quality', 'Enhanced fat metabolism', 'Improved skin elasticity'],
    bestFor: 'Anti-aging, body composition, recovery'
  },
  'Semaglutide': {
    description: 'A GLP-1 receptor agonist that regulates appetite and blood sugar.',
    benefits: ['Significant weight loss', 'Reduced appetite', 'Better blood sugar control', 'Cardiovascular benefits'],
    bestFor: 'Weight management, metabolic health'
  },
  'Tirzepatide': {
    description: 'Dual GIP/GLP-1 receptor agonist for enhanced metabolic control.',
    benefits: ['Superior weight loss', 'Appetite suppression', 'Improved insulin sensitivity', 'Reduced cravings'],
    bestFor: 'Weight loss, Type 2 diabetes management'
  }
};

// Frequency display mapping
const FREQUENCY_DISPLAY = {
  '2x_daily': { label: '2× Daily', schedule: 'Morning & Evening', icon: '🌅🌙' },
  'daily': { label: 'Daily', schedule: 'Once per day', icon: '📅' },
  'every_other_day': { label: 'Every Other Day', schedule: 'Alternating days', icon: '📆' },
  '2x_weekly': { label: '2× Weekly', schedule: 'Monday & Thursday', icon: '📌' },
  'weekly': { label: 'Weekly', schedule: 'Once per week', icon: '🗓️' },
  '2x weekly': { label: '2× Weekly', schedule: 'Monday & Thursday', icon: '📌' },
  '1x weekly': { label: 'Weekly', schedule: 'Once per week', icon: '🗓️' }
};

// =====================================================
// OPTIONS
// =====================================================
const PEPTIDE_ACTIVITIES = ['Walking', 'Running', 'Weight Training', 'Sports', 'Work/Job', 'Household Chores', 'Sleep', 'Sitting/Standing', 'Driving'];
const PAIN_FREQUENCIES = ['Constant (always present)', 'Frequent (most of the day)', 'Intermittent (comes and goes)', 'Only with activity', 'Only at night'];
const INJURY_DURATIONS = ['Less than 1 week', '1-2 weeks', '2-4 weeks', '1-3 months', '3-6 months', '6-12 months', 'More than 1 year'];
const EXERCISE_FREQUENCIES = ['None', '1-2 times per week', '3-4 times per week', '5+ times per week'];
const SIDE_EFFECTS = ['Nausea', 'Fatigue', 'Headache', 'Constipation', 'Diarrhea', 'Dizziness', 'Injection Site Reaction', 'None'];
const CLOTHING_CHANGES = ['Much looser', 'Slightly looser', 'About the same', 'Slightly tighter'];

export default function PatientTracker() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(null);
  
  // Questionnaire state
  const [intakeQuestionnaire, setIntakeQuestionnaire] = useState(null);
  const [completionQuestionnaire, setCompletionQuestionnaire] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    sleep_quality: 5, energy_level: 5, current_medications: '', recovery_goals: '', goals_achieved: '',
    overall_improvement: 5, would_recommend: true, continue_treatment: true, additional_notes: '',
    primary_complaint: '', injury_location: '', injury_duration: '', pain_level: 5, pain_frequency: '',
    mobility_score: 5, activities_limited: [], previous_treatments: '',
    current_weight: '', goal_weight: '', weight_at_completion: '', appetite_level: 5, cravings_level: 5,
    exercise_frequency: '', diet_description: '', previous_weight_loss_attempts: '',
    side_effects: [], side_effects_severity: 0, clothing_fit_change: ''
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

  const getQuestionnaireCategory = (programType) => {
    if (!programType) return null;
    const peptideTypes = ['recovery_jumpstart_10day', 'month_program_30day', 'maintenance_4week', 'injection_clinic', 'jumpstart_10day', 'recovery_10day', 'month_30day'];
    const weightLossTypes = ['weight_loss_program', 'weight_loss_injection'];
    if (peptideTypes.includes(programType)) return 'peptide';
    if (weightLossTypes.includes(programType)) return 'weight_loss';
    return null;
  };

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
        newEffects = newEffects.includes(effect) ? newEffects.filter(e => e !== effect) : [...newEffects, effect];
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
        body: JSON.stringify({ token, questionnaire_type: type, questionnaire_category: category, ...formData })
      });
      if (res.ok) {
        const result = await res.json();
        if (type === 'intake') setIntakeQuestionnaire(result.response);
        else setCompletionQuestionnaire(result.response);
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

  // Calculate injection days based on frequency
  const getInjectionDays = (startDate, durationDays, frequency, isWeightLoss) => {
    const start = startDate ? new Date(startDate) : new Date();
    const days = [];
    
    if (isWeightLoss) {
      const weeks = Math.ceil(durationDays / 7);
      if (frequency === '2x weekly' || frequency === '2x_weekly') {
        for (let week = 0; week < weeks; week++) {
          const day1 = week * 7 + 1;
          const day2 = week * 7 + 4;
          if (day1 <= durationDays) days.push({ day: day1, label: `Wk${week + 1}a`, week: week + 1, shot: 1 });
          if (day2 <= durationDays) days.push({ day: day2, label: `Wk${week + 1}b`, week: week + 1, shot: 2 });
        }
      } else {
        for (let week = 0; week < weeks; week++) {
          const day = week * 7 + 1;
          if (day <= durationDays) days.push({ day, label: `Week ${week + 1}`, week: week + 1, shot: 1 });
        }
      }
      return days;
    }

    // Peptide frequency logic
    if (frequency === '2x_daily') {
      for (let i = 1; i <= durationDays; i++) {
        days.push({ day: i, label: `${i}`, subLabel: 'AM', isAM: true });
        days.push({ day: i + 0.5, label: `${i}`, subLabel: 'PM', isPM: true, dayNumber: i });
      }
      return days;
    }
    
    if (frequency === 'every_other_day') {
      for (let i = 1; i <= durationDays; i += 2) {
        days.push({ day: i, label: `Day ${i}` });
      }
      return days;
    }
    
    if (frequency === '2x_weekly' || frequency === '2x weekly') {
      const weeks = Math.ceil(durationDays / 7);
      for (let week = 0; week < weeks; week++) {
        const day1 = week * 7 + 1; // Monday
        const day2 = week * 7 + 4; // Thursday
        if (day1 <= durationDays) days.push({ day: day1, label: `Wk${week + 1} Mon` });
        if (day2 <= durationDays) days.push({ day: day2, label: `Wk${week + 1} Thu` });
      }
      return days;
    }
    
    if (frequency === 'weekly') {
      const weeks = Math.ceil(durationDays / 7);
      for (let week = 0; week < weeks; week++) {
        const day = week * 7 + 1;
        if (day <= durationDays) days.push({ day, label: `Week ${week + 1}` });
      }
      return days;
    }
    
    // Daily (default)
    for (let i = 1; i <= durationDays; i++) {
      days.push({ day: i, label: `${i}` });
    }
    return days;
  };

  const toggleDay = async (dayValue, isCompleted) => {
    if (isInClinic) return;
    setSaving(dayValue);
    
    try {
      const res = await fetch(`/api/patient/tracker?token=${token}`, {
        method: isCompleted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: Math.floor(dayValue) })
      });
      
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
    
    setSaving(null);
  };

  // Score Slider Component
  const ScoreSlider = ({ label, value, onChange, lowLabel, highLabel, color }) => (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#1a1a1a' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: '#888', width: '60px' }}>{lowLabel}</span>
        <input type="range" min="0" max="10" value={value} onChange={(e) => onChange(parseInt(e.target.value))} 
          style={{ flex: 1, height: '6px', WebkitAppearance: 'none', background: `linear-gradient(to right, ${color || '#000'} 0%, ${color || '#000'} ${value * 10}%, #e0e0e0 ${value * 10}%, #e0e0e0 100%)`, borderRadius: '3px', outline: 'none' }} />
        <span style={{ fontSize: '11px', color: '#888', width: '60px', textAlign: 'right' }}>{highLabel}</span>
      </div>
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <span style={{ display: 'inline-block', background: color || '#000', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>{value}/10</span>
      </div>
    </div>
  );

  // Get peptide info
  const getPeptideInfo = (peptideName) => {
    if (!peptideName) return null;
    // Check for exact match first
    if (PEPTIDE_INFO[peptideName]) return PEPTIDE_INFO[peptideName];
    // Check for partial match
    for (const key of Object.keys(PEPTIDE_INFO)) {
      if (peptideName.toLowerCase().includes(key.toLowerCase())) return PEPTIDE_INFO[key];
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', background: '#fafafa' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f0f0f0', borderTop: '3px solid #000', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#666', fontSize: '14px' }}>Loading your tracker...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', padding: '24px', background: '#fafafa' }}>
        <div style={{ textAlign: 'center', maxWidth: '300px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
          <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.5' }}>{error}</p>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '16px' }}>Need help? Call <a href="tel:9499973988" style={{ color: '#000', fontWeight: '600' }}>(949) 997-3988</a></p>
        </div>
      </div>
    );
  }

  const protocol = data?.protocol;
  const injectionLogs = data?.injectionLogs || [];
  const completedDays = injectionLogs.map(log => log.day_number);
  const totalDays = protocol?.duration_days || 10;
  const daysLeft = protocol?.end_date ? Math.max(0, Math.ceil((new Date(protocol.end_date) - new Date()) / (1000*60*60*24))) : 0;
  const category = getQuestionnaireCategory(protocol?.program_type);
  const isWeightLoss = category === 'weight_loss';
  const isPeptide = category === 'peptide';
  const isInClinic = protocol?.injection_location === 'in_clinic';
  
  const primaryPeptide = protocol?.primary_peptide;
  const secondaryPeptide = protocol?.secondary_peptide;
  const peptideInfo = getPeptideInfo(primaryPeptide);
  const frequencyInfo = FREQUENCY_DISPLAY[protocol?.dose_frequency] || FREQUENCY_DISPLAY['daily'];

  return (
    <>
      <Head>
        <title>{protocol?.patient_name ? `${protocol.patient_name} - ` : ''}{isWeightLoss ? 'Weight Loss' : 'Recovery'} Tracker | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
      </Head>
      
      <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        {/* Premium Header */}
        <header style={{ 
          background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)', 
          color: 'white', 
          padding: '24px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '3px', opacity: 0.6, marginBottom: '8px' }}>RANGE MEDICAL</div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '600', letterSpacing: '0.5px' }}>
            {isWeightLoss ? 'Weight Loss Journey' : 'Recovery Tracker'}
          </h1>
        </header>

        {/* In-Clinic Banner */}
        {isInClinic && (
          <div style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', padding: '16px 24px', textAlign: 'center', borderBottom: '1px solid #90caf9' }}>
            <div style={{ fontSize: '14px', color: '#1565c0', fontWeight: '600' }}>🏥 In-Clinic Protocol</div>
            <div style={{ fontSize: '12px', color: '#1976d2', marginTop: '4px' }}>Progress recorded by our staff during visits</div>
          </div>
        )}

        {/* Patient Welcome Card */}
        <div style={{ margin: '20px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Welcome back,</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>{protocol?.patient_name}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>{protocol?.program_name}</div>
          {daysLeft > 0 && (
            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f8f8f8', borderRadius: '10px', display: 'inline-block' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>{daysLeft} days remaining</span>
            </div>
          )}
        </div>

        {/* =====================================================
            PROTOCOL INFO CARDS - New Premium Design
        ===================================================== */}
        {!activeForm && (primaryPeptide || protocol?.dose_frequency) && (
          <div style={{ margin: '0 20px 20px' }}>
            
            {/* Your Protocol Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', 
              borderRadius: '16px', 
              padding: '24px', 
              marginBottom: '16px',
              color: 'white'
            }}>
              <div style={{ fontSize: '11px', letterSpacing: '2px', opacity: 0.5, marginBottom: '16px' }}>YOUR PROTOCOL</div>
              
              {/* Primary Peptide */}
              {primaryPeptide && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>{primaryPeptide}</div>
                  {secondaryPeptide && (
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>+ {secondaryPeptide}</div>
                  )}
                </div>
              )}
              
              {/* Dosing Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {protocol?.dose_amount && (
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '4px' }}>DOSAGE</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{protocol.dose_amount}</div>
                  </div>
                )}
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '4px' }}>FREQUENCY</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{frequencyInfo.label}</div>
                  <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>{frequencyInfo.schedule}</div>
                </div>
              </div>
            </div>

            {/* Benefits Card */}
            {peptideInfo && (
              <div style={{ 
                background: 'white', 
                borderRadius: '16px', 
                padding: '24px', 
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#888', marginBottom: '16px' }}>HOW IT HELPS</div>
                
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
                  {peptideInfo.description}
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {peptideInfo.benefits.map((benefit, i) => (
                    <div key={i} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '10px 12px',
                      background: '#f8f8f8',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#333'
                    }}>
                      <span style={{ color: '#4caf50' }}>✓</span>
                      {benefit}
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '16px', padding: '12px 16px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4f8 100%)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#1565c0', fontWeight: '600', marginBottom: '4px' }}>BEST FOR</div>
                  <div style={{ fontSize: '13px', color: '#333' }}>{peptideInfo.bestFor}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            INTAKE FORMS (Peptide & Weight Loss)
        ===================================================== */}
        {activeForm === 'intake' && isPeptide && !isInClinic && (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)', color: 'white', padding: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Starting Assessment</h2>
                <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.7 }}>Help us track your recovery progress</p>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1a1a1a' }}>What's your main issue? *</label>
                  <textarea value={formData.primary_complaint} onChange={(e) => setFormData({ ...formData, primary_complaint: e.target.value })} required rows={2} placeholder="e.g., Shoulder pain, lower back inflammation" style={{ width: '100%', padding: '14px', border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box', resize: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1a1a1a' }}>Location *</label>
                    <input type="text" value={formData.injury_location} onChange={(e) => setFormData({ ...formData, injury_location: e.target.value })} placeholder="e.g., Right shoulder" style={{ width: '100%', padding: '14px', border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1a1a1a' }}>How long?</label>
                    <select value={formData.injury_duration} onChange={(e) => setFormData({ ...formData, injury_duration: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box', background: 'white' }}>
                      <option value="">Select...</option>
                      {INJURY_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <ScoreSlider label="Current Pain Level *" value={formData.pain_level} onChange={(v) => setFormData({ ...formData, pain_level: v })} lowLabel="No pain" highLabel="Severe" color={formData.pain_level > 6 ? '#c62828' : formData.pain_level > 3 ? '#ef6c00' : '#2e7d32'} />
                <ScoreSlider label="Mobility / Range of Motion" value={formData.mobility_score} onChange={(v) => setFormData({ ...formData, mobility_score: v })} lowLabel="Very limited" highLabel="Full" />
                <ScoreSlider label="Sleep Quality" value={formData.sleep_quality} onChange={(v) => setFormData({ ...formData, sleep_quality: v })} lowLabel="Very poor" highLabel="Excellent" />
                <ScoreSlider label="Energy Level" value={formData.energy_level} onChange={(v) => setFormData({ ...formData, energy_level: v })} lowLabel="Exhausted" highLabel="Energetic" />
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1a1a1a' }}>Activities limited by your condition</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {PEPTIDE_ACTIVITIES.map(a => (
                      <button key={a} type="button" onClick={() => handleActivityToggle(a)} style={{ padding: '10px 16px', borderRadius: '25px', fontSize: '13px', cursor: 'pointer', border: formData.activities_limited.includes(a) ? '2px solid #000' : '1px solid #e0e0e0', background: formData.activities_limited.includes(a) ? '#000' : 'white', color: formData.activities_limited.includes(a) ? 'white' : '#333', fontWeight: '500', transition: 'all 0.2s' }}>{a}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1a1a1a' }}>What do you hope to achieve? *</label>
                  <textarea value={formData.recovery_goals} onChange={(e) => setFormData({ ...formData, recovery_goals: e.target.value })} rows={2} placeholder="e.g., Reduce pain, return to exercise, sleep better" style={{ width: '100%', padding: '14px', border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box', resize: 'none' }} />
                </div>
                <button onClick={() => submitQuestionnaire('intake')} disabled={submitting || !formData.primary_complaint} style={{ width: '100%', padding: '16px', background: submitting || !formData.primary_complaint ? '#ccc' : 'linear-gradient(135deg, #000 0%, #333 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: submitting ? 'wait' : 'pointer', marginBottom: '12px' }}>{submitting ? 'Saving...' : 'Save & Start Tracking'}</button>
                <button onClick={() => setActiveForm(null)} style={{ width: '100%', padding: '14px', background: 'transparent', color: '#888', border: 'none', fontSize: '14px', cursor: 'pointer' }}>Skip for now</button>
              </div>
            </div>
          </div>
        )}

        {activeForm === 'intake' && isWeightLoss && !isInClinic && (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white', padding: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Starting Assessment</h2>
                <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.9 }}>Let's capture your starting point</p>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1a1a1a' }}>Current Weight (lbs) *</label>
                    <input type="number" value={formData.current_weight} onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })} placeholder="185" style={{ width: '100%', padding: '14px', border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1a1a1a' }}>Goal Weight (lbs)</label>
                    <input type="number" value={formData.goal_weight} onChange={(e) => setFormData({ ...formData, goal_weight: e.target.value })} placeholder="165" style={{ width: '100%', padding: '14px', border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <ScoreSlider label="Appetite Level" value={formData.appetite_level} onChange={(v) => setFormData({ ...formData, appetite_level: v })} lowLabel="No appetite" highLabel="Always hungry" color="#ff9800" />
                <ScoreSlider label="Cravings Level" value={formData.cravings_level} onChange={(v) => setFormData({ ...formData, cravings_level: v })} lowLabel="No cravings" highLabel="Intense" color="#ff9800" />
                <ScoreSlider label="Energy Level" value={formData.energy_level} onChange={(v) => setFormData({ ...formData, energy_level: v })} lowLabel="Exhausted" highLabel="Energetic" />
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1a1a1a' }}>What are your goals? *</label>
                  <textarea value={formData.recovery_goals} onChange={(e) => setFormData({ ...formData, recovery_goals: e.target.value })} rows={2} placeholder="e.g., Lose 20 lbs, more energy, fit into old clothes" style={{ width: '100%', padding: '14px', border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box', resize: 'none' }} />
                </div>
                <button onClick={() => submitQuestionnaire('intake')} disabled={submitting || !formData.current_weight} style={{ width: '100%', padding: '16px', background: submitting || !formData.current_weight ? '#ccc' : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: submitting ? 'wait' : 'pointer', marginBottom: '12px' }}>{submitting ? 'Saving...' : 'Save & Start Tracking'}</button>
                <button onClick={() => setActiveForm(null)} style={{ width: '100%', padding: '14px', background: 'transparent', color: '#888', border: 'none', fontSize: '14px', cursor: 'pointer' }}>Skip for now</button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            MAIN TRACKER VIEW
        ===================================================== */}
        {!activeForm && (
          <div style={{ padding: '0 20px 40px' }}>
            
            {/* Intake Summary Cards */}
            {intakeQuestionnaire && isPeptide && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#888', letterSpacing: '1px' }}>STARTING BASELINE</span>
                  <span style={{ fontSize: '11px', color: '#4caf50', background: '#e8f5e9', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>✓ Recorded</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div style={{ padding: '12px', background: '#f8f8f8', borderRadius: '10px' }}><div style={{ fontSize: '24px', fontWeight: '700', color: intakeQuestionnaire.pain_level > 6 ? '#c62828' : '#333' }}>{intakeQuestionnaire.pain_level}</div><div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Pain</div></div>
                  <div style={{ padding: '12px', background: '#f8f8f8', borderRadius: '10px' }}><div style={{ fontSize: '24px', fontWeight: '700' }}>{intakeQuestionnaire.mobility_score}</div><div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Mobility</div></div>
                  <div style={{ padding: '12px', background: '#f8f8f8', borderRadius: '10px' }}><div style={{ fontSize: '24px', fontWeight: '700' }}>{intakeQuestionnaire.sleep_quality}</div><div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Sleep</div></div>
                  <div style={{ padding: '12px', background: '#f8f8f8', borderRadius: '10px' }}><div style={{ fontSize: '24px', fontWeight: '700' }}>{intakeQuestionnaire.energy_level}</div><div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Energy</div></div>
                </div>
              </div>
            )}

            {intakeQuestionnaire && isWeightLoss && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#e65100', letterSpacing: '1px' }}>STARTING POINT</span>
                  <span style={{ fontSize: '11px', color: '#4caf50', background: '#e8f5e9', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>✓ Recorded</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div style={{ padding: '12px', background: '#fff8e1', borderRadius: '10px' }}><div style={{ fontSize: '24px', fontWeight: '700' }}>{intakeQuestionnaire.current_weight}</div><div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>lbs</div></div>
                  <div style={{ padding: '12px', background: '#f8f8f8', borderRadius: '10px' }}><div style={{ fontSize: '24px', fontWeight: '700' }}>{intakeQuestionnaire.goal_weight || '—'}</div><div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Goal</div></div>
                  <div style={{ padding: '12px', background: '#f8f8f8', borderRadius: '10px' }}><div style={{ fontSize: '24px', fontWeight: '700' }}>{intakeQuestionnaire.appetite_level}</div><div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Appetite</div></div>
                  <div style={{ padding: '12px', background: '#f8f8f8', borderRadius: '10px' }}><div style={{ fontSize: '24px', fontWeight: '700' }}>{intakeQuestionnaire.cravings_level}</div><div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Cravings</div></div>
                </div>
              </div>
            )}

            {/* Prompt for intake */}
            {!intakeQuestionnaire && category && !isInClinic && (
              <button onClick={() => setActiveForm('intake')} style={{ width: '100%', padding: '20px', background: 'white', border: '2px dashed #ddd', borderRadius: '16px', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#333' }}>Complete Your Starting Assessment</div>
                <div style={{ fontSize: '13px', color: '#888' }}>Help us track your progress</div>
              </button>
            )}

            {/* Progress Card */}
            {(() => {
              const injectionDays = getInjectionDays(protocol?.start_date, totalDays, protocol?.dose_frequency, isWeightLoss);
              const completedCount = injectionDays.filter(d => completedDays.includes(Math.floor(d.day))).length;
              const totalInjections = injectionDays.length;
              const injectionProgress = Math.round((completedCount / totalInjections) * 100);
              
              return (
                <>
                  {/* Progress Bar Card */}
                  <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>Progress</span>
                      <span style={{ fontSize: '24px', fontWeight: '700', color: isWeightLoss ? '#ff9800' : '#000' }}>
                        {completedCount}<span style={{ fontSize: '14px', fontWeight: '400', color: '#888' }}>/{totalInjections}</span>
                      </span>
                    </div>
                    <div style={{ height: '10px', background: '#f0f0f0', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${injectionProgress}%`, 
                        background: isWeightLoss ? 'linear-gradient(90deg, #ff9800, #ffb74d)' : 'linear-gradient(90deg, #000, #444)', 
                        transition: 'width 0.5s ease',
                        borderRadius: '5px'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: '#888' }}>
                      <span>{injectionProgress}% complete</span>
                      <span>{totalInjections - completedCount} remaining</span>
                    </div>
                  </div>

                  {/* Injection Calendar */}
                  <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>Injection Calendar</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                          {isInClinic ? 'Recorded by staff' : 'Tap to mark complete'}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{frequencyInfo.label}</div>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: isWeightLoss ? 'repeat(4, 1fr)' : protocol?.dose_frequency === '2x_daily' ? 'repeat(5, 1fr)' : 'repeat(5, 1fr)', 
                      gap: '10px' 
                    }}>
                      {injectionDays.map((item, idx) => {
                        const dayKey = item.day;
                        const isCompleted = completedDays.includes(Math.floor(item.day));
                        const isSaving = saving === dayKey;
                        const isClickable = !isInClinic && !isSaving;
                        const accentColor = isWeightLoss ? '#ff9800' : '#000';
                        
                        return (
                          <button 
                            key={`${item.day}-${idx}`}
                            onClick={() => {
                              if (isClickable) {
                                toggleDay(item.day, isCompleted);
                              }
                            }}
                            disabled={!isClickable}
                            style={{
                              aspectRatio: isWeightLoss ? '1.3' : '1',
                              borderRadius: '12px',
                              border: isCompleted ? `2px solid ${accentColor}` : '1px solid #e8e8e8',
                              background: isCompleted ? accentColor : '#fafafa',
                              color: isCompleted ? 'white' : '#333',
                              fontSize: isWeightLoss ? '12px' : '15px',
                              fontWeight: '600',
                              cursor: isClickable ? 'pointer' : 'default',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: isSaving ? 0.5 : 1,
                              transition: 'all 0.2s ease',
                              padding: '8px 4px',
                              WebkitTapHighlightColor: 'transparent'
                            }}
                          >
                            <span>{item.label}</span>
                            {item.subLabel && <span style={{ fontSize: '10px', opacity: 0.7 }}>{item.subLabel}</span>}
                            {isCompleted && <span style={{ fontSize: '12px', marginTop: '2px' }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Contact */}
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Questions about your protocol?</div>
              <a href="tel:9499973988" style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '12px 24px', 
                background: '#f8f8f8', 
                borderRadius: '25px', 
                color: '#333', 
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                📞 (949) 997-3988
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ 
          textAlign: 'center', 
          padding: '24px 20px 40px', 
          borderTop: '1px solid #f0f0f0',
          background: 'white'
        }}>
          <div style={{ fontSize: '11px', color: '#ccc', letterSpacing: '2px', marginBottom: '4px' }}>RANGE MEDICAL</div>
          <div style={{ fontSize: '11px', color: '#bbb' }}>Costa Mesa, California</div>
        </footer>
      </div>
    </>
  );
}
