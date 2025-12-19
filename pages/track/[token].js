// /pages/track/[token].js
// Patient Recovery Tracker - Premium Design with Wellness Tracking
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

// =====================================================
// WELLNESS METRICS CONFIG
// =====================================================
const WELLNESS_METRICS = [
  { key: 'energy', label: 'Energy', lowLabel: 'Exhausted', highLabel: 'Energetic', icon: '⚡', color: '#ff9800' },
  { key: 'sleep', label: 'Sleep Quality', lowLabel: 'Poor', highLabel: 'Excellent', icon: '😴', color: '#5c6bc0' },
  { key: 'pain', label: 'Pain Level', lowLabel: 'None', highLabel: 'Severe', icon: '🩹', color: '#ef5350', inverted: true },
  { key: 'recovery', label: 'Recovery', lowLabel: 'Slow', highLabel: 'Fast', icon: '💪', color: '#26a69a' },
  { key: 'wellbeing', label: 'Overall', lowLabel: 'Poor', highLabel: 'Great', icon: '✨', color: '#ab47bc' }
];

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
  
  // Wellness tracking state
  const [symptoms, setSymptoms] = useState({ logs: [], stats: {} });
  const [showWellnessCheckIn, setShowWellnessCheckIn] = useState(false);
  const [wellnessData, setWellnessData] = useState({
    energy: 5, sleep: 5, pain: 5, recovery: 5, wellbeing: 5, notes: ''
  });
  const [savingWellness, setSavingWellness] = useState(false);
  const [todayLogged, setTodayLogged] = useState(false);
  
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
        
        // Fetch symptoms data
        fetchSymptoms();
      } else {
        setError('Protocol not found. Please check your link.');
      }
    } catch (err) {
      setError('Unable to load. Please try again.');
    }
    setLoading(false);
  };
  
  const fetchSymptoms = async () => {
    try {
      const res = await fetch(`/api/patient/symptoms?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setSymptoms(data);
        
        // Check if today is already logged
        const today = new Date().toISOString().split('T')[0];
        const todayLog = data.logs?.find(l => l.log_date === today);
        if (todayLog) {
          setTodayLogged(true);
          setWellnessData({
            energy: todayLog.energy || 5,
            sleep: todayLog.sleep || 5,
            pain: todayLog.pain || 5,
            recovery: todayLog.recovery || 5,
            wellbeing: todayLog.wellbeing || 5,
            notes: todayLog.notes || ''
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch symptoms:', err);
    }
  };
  
  const saveWellnessCheckIn = async () => {
    setSavingWellness(true);
    try {
      const res = await fetch(`/api/patient/symptoms?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wellnessData)
      });
      
      if (res.ok) {
        setTodayLogged(true);
        setShowWellnessCheckIn(false);
        fetchSymptoms(); // Refresh data
      }
    } catch (err) {
      console.error('Failed to save wellness:', err);
    }
    setSavingWellness(false);
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
        fetchData();
      }
    } catch (err) {
      console.error('Error submitting questionnaire:', err);
    }
    setSubmitting(false);
  };

  const toggleDay = async (day, isCompleted) => {
    setSaving(day);
    try {
      const res = await fetch(`/api/patient/tracker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, day_number: Math.floor(day), action: isCompleted ? 'remove' : 'add' })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error toggling day:', err);
    }
    setSaving(null);
  };

  const getPeptideInfo = (peptideName) => {
    if (!peptideName) return null;
    const normalizedName = peptideName.trim();
    if (PEPTIDE_INFO[normalizedName]) return PEPTIDE_INFO[normalizedName];
    for (const key of Object.keys(PEPTIDE_INFO)) {
      if (normalizedName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName.toLowerCase())) {
        return PEPTIDE_INFO[key];
      }
    }
    return null;
  };

  const generateInjectionDays = (frequency, duration) => {
    const days = [];
    const f = frequency?.toLowerCase() || 'daily';
    if (f.includes('2x_daily') || f.includes('twice daily')) {
      for (let i = 1; i <= duration; i++) {
        days.push({ day: i, label: `D${i}`, subLabel: 'AM' });
        days.push({ day: i + 0.5, label: `D${i}`, subLabel: 'PM' });
      }
    } else if (f.includes('weekly') && !f.includes('2x')) {
      const weeks = Math.ceil(duration / 7);
      for (let i = 1; i <= weeks; i++) days.push({ day: i * 7, label: `Wk ${i}` });
    } else if (f.includes('2x_weekly') || f.includes('2x weekly')) {
      const weeks = Math.ceil(duration / 7);
      for (let i = 0; i < weeks; i++) {
        days.push({ day: i * 7 + 1, label: `Wk${i + 1}`, subLabel: 'Mon' });
        days.push({ day: i * 7 + 4, label: `Wk${i + 1}`, subLabel: 'Thu' });
      }
    } else if (f.includes('every_other') || f.includes('every other')) {
      for (let i = 1; i <= duration; i += 2) days.push({ day: i, label: `Day ${i}` });
    } else {
      for (let i = 1; i <= duration; i++) days.push({ day: i, label: `${i}` });
    }
    return days;
  };

  // =====================================================
  // SCORE SLIDER COMPONENT
  // =====================================================
  const ScoreSlider = ({ label, value, onChange, lowLabel = '1', highLabel = '10', color = '#000' }) => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <label style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{label}</label>
        <span style={{ fontSize: '24px', fontWeight: '700', color }}>{value}</span>
      </div>
      <input type="range" min="1" max="10" value={value} onChange={(e) => onChange(parseInt(e.target.value))} style={{ width: '100%', height: '8px', borderRadius: '4px', outline: 'none', WebkitAppearance: 'none', background: `linear-gradient(to right, ${color} ${(value - 1) * 11.1}%, #e0e0e0 ${(value - 1) * 11.1}%)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontSize: '11px', color: '#888' }}>{lowLabel}</span>
        <span style={{ fontSize: '11px', color: '#888' }}>{highLabel}</span>
      </div>
    </div>
  );

  // =====================================================
  // WELLNESS CHECK-IN COMPONENT
  // =====================================================
  const WellnessCheckIn = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '20px 20px 0 0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌟</div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Daily Check-In</h2>
          <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.8 }}>
            {todayLogged ? 'Update your scores' : 'How are you feeling today?'}
          </p>
        </div>
        
        {/* Sliders */}
        <div style={{ padding: '24px' }}>
          {WELLNESS_METRICS.map(metric => (
            <div key={metric.key} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{metric.icon}</span> {metric.label}
                </span>
                <span style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: metric.color,
                  background: `${metric.color}15`,
                  padding: '4px 12px',
                  borderRadius: '12px'
                }}>
                  {wellnessData[metric.key]}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={wellnessData[metric.key]}
                onChange={(e) => setWellnessData(prev => ({ ...prev, [metric.key]: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '4px',
                  outline: 'none',
                  WebkitAppearance: 'none',
                  background: `linear-gradient(to right, ${metric.color} ${(wellnessData[metric.key] - 1) * 11.1}%, #e8e8e8 ${(wellnessData[metric.key] - 1) * 11.1}%)`
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: '#999' }}>{metric.lowLabel}</span>
                <span style={{ fontSize: '10px', color: '#999' }}>{metric.highLabel}</span>
              </div>
            </div>
          ))}
          
          {/* Notes */}
          <div style={{ marginTop: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              Notes (optional)
            </label>
            <textarea
              value={wellnessData.notes}
              onChange={(e) => setWellnessData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any symptoms, observations, or notes..."
              rows={2}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '14px',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
        
        {/* Buttons */}
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowWellnessCheckIn(false)}
            style={{
              flex: 1,
              padding: '14px',
              background: '#f5f5f5',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={saveWellnessCheckIn}
            disabled={savingWellness}
            style={{
              flex: 2,
              padding: '14px',
              background: savingWellness ? '#ccc' : 'linear-gradient(135deg, #000 0%, #333 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: savingWellness ? 'wait' : 'pointer'
            }}
          >
            {savingWellness ? 'Saving...' : todayLogged ? 'Update' : 'Save Check-In'}
          </button>
        </div>
      </div>
    </div>
  );

  // =====================================================
  // PROGRESS CHART COMPONENT (Simple visual)
  // =====================================================
  const ProgressChart = ({ logs, metric }) => {
    if (!logs || logs.length < 2) return null;
    
    const values = logs.map(l => l[metric.key]).filter(v => v !== null);
    if (values.length < 2) return null;
    
    const max = 10;
    const min = 1;
    const width = 100;
    const height = 40;
    
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / (max - min)) * height;
      return `${x},${y}`;
    }).join(' ');
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = last - first;
    const improved = metric.inverted ? change < 0 : change > 0;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          <polyline
            points={points}
            fill="none"
            stroke={metric.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '600',
          color: improved ? '#4caf50' : change === 0 ? '#888' : '#f44336'
        }}>
          {improved ? '↑' : change === 0 ? '→' : '↓'}
          {Math.abs(change)}
        </span>
      </div>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

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

  // Calculate streak
  const calculateStreak = () => {
    const logs = symptoms.logs || [];
    if (logs.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (logs.some(l => l.log_date === dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  return (
    <>
      <Head>
        <title>{protocol?.patient_name ? `${protocol.patient_name} - ` : ''}{isWeightLoss ? 'Weight Loss' : 'Recovery'} Tracker | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
      </Head>
      
      {/* Wellness Check-In Modal */}
      {showWellnessCheckIn && <WellnessCheckIn />}
      
      <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        {/* Premium Header */}
        <header style={{ 
          background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)', 
          color: 'white', 
          padding: '24px 20px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '600', letterSpacing: '3px' }}>RANGE MEDICAL</h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>
            {isWeightLoss ? 'Weight Loss Journey' : 'Recovery Tracker'}
          </p>
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
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            {daysLeft > 0 && (
              <div style={{ padding: '10px 16px', background: '#f8f8f8', borderRadius: '10px' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>📅 {daysLeft} days left</span>
              </div>
            )}
            {streak > 0 && (
              <div style={{ padding: '10px 16px', background: '#fff3e0', borderRadius: '10px' }}>
                <span style={{ fontSize: '13px', color: '#e65100' }}>🔥 {streak} day streak!</span>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            DAILY WELLNESS CHECK-IN BUTTON
        ===================================================== */}
        {!activeForm && !isInClinic && (
          <div style={{ margin: '0 20px 20px' }}>
            <button
              onClick={() => setShowWellnessCheckIn(true)}
              style={{
                width: '100%',
                padding: '20px',
                background: todayLogged 
                  ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                  : 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  background: 'white', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  {todayLogged ? '✅' : '📊'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>
                    {todayLogged ? "Today's Check-In Complete" : 'Daily Wellness Check-In'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                    {todayLogged ? 'Tap to update your scores' : 'Track how you\'re feeling today'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '20px', color: '#888' }}>→</div>
            </button>
          </div>
        )}

        {/* =====================================================
            WELLNESS PROGRESS CARD
        ===================================================== */}
        {!activeForm && symptoms.logs?.length >= 2 && (
          <div style={{ margin: '0 20px 20px' }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>Your Progress</span>
                <span style={{ fontSize: '11px', color: '#888' }}>{symptoms.logs.length} check-ins</span>
              </div>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                {WELLNESS_METRICS.map(metric => {
                  const logs = symptoms.logs || [];
                  const values = logs.map(l => l[metric.key]).filter(v => v !== null);
                  if (values.length < 2) return null;
                  
                  const first = values[0];
                  const last = values[values.length - 1];
                  const change = last - first;
                  const improved = metric.inverted ? change < 0 : change > 0;
                  
                  return (
                    <div key={metric.key} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: '#fafafa',
                      borderRadius: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>{metric.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{metric.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ProgressChart logs={symptoms.logs} metric={metric} />
                        <div style={{ 
                          padding: '4px 10px', 
                          borderRadius: '8px',
                          background: improved ? '#e8f5e9' : change === 0 ? '#f5f5f5' : '#ffebee',
                          color: improved ? '#2e7d32' : change === 0 ? '#666' : '#c62828',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {first} → {last}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Overall Improvement Message */}
              {symptoms.stats?.changes?.wellbeing?.improved && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#2e7d32' }}>
                    You're making progress!
                  </div>
                  <div style={{ fontSize: '12px', color: '#388e3c', marginTop: '4px' }}>
                    Your overall wellbeing has improved since starting
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================
            PROTOCOL INFO CARDS - Existing Premium Design
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
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {protocol?.dose_amount && (
                  <div>
                    <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '4px' }}>DOSE</div>
                    <div style={{ fontSize: '15px', fontWeight: '600' }}>{protocol.dose_amount}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '4px' }}>FREQUENCY</div>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>{frequencyInfo.label}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '4px' }}>DURATION</div>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>{totalDays} days</div>
                </div>
              </div>
            </div>

            {/* Peptide Benefits Card */}
            {peptideInfo && (
              <div style={{ 
                background: 'white', 
                borderRadius: '16px', 
                padding: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#888', marginBottom: '12px' }}>BENEFITS</div>
                <ul style={{ margin: 0, padding: '0 0 0 20px', listStyle: 'none' }}>
                  {peptideInfo.benefits.map((benefit, i) => (
                    <li key={i} style={{ 
                      padding: '8px 0', 
                      fontSize: '14px', 
                      color: '#333',
                      borderBottom: i < peptideInfo.benefits.length - 1 ? '1px solid #f0f0f0' : 'none',
                      position: 'relative'
                    }}>
                      <span style={{ position: 'absolute', left: '-20px' }}>✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            INTAKE QUESTIONNAIRE FORMS
        ===================================================== */}
        {activeForm === 'intake' && isPeptide && !isInClinic && (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #000 0%, #333 100%)', color: 'white', padding: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Starting Assessment</h2>
                <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.9 }}>Help us understand your starting point</p>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1a1a1a' }}>Primary concern *</label>
                  <textarea value={formData.primary_complaint} onChange={(e) => setFormData({ ...formData, primary_complaint: e.target.value })} rows={2} placeholder="What brings you in? Describe your main issue..." style={{ width: '100%', padding: '14px', border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box', resize: 'none' }} />
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ textAlign: 'center', padding: '12px', background: '#fafafa', borderRadius: '10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: intakeQuestionnaire.pain_level > 5 ? '#c62828' : '#2e7d32' }}>{intakeQuestionnaire.pain_level || '-'}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Pain</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: '#fafafa', borderRadius: '10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>{intakeQuestionnaire.sleep_quality || '-'}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Sleep</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: '#fafafa', borderRadius: '10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>{intakeQuestionnaire.energy_level || '-'}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Energy</div>
                  </div>
                </div>
              </div>
            )}

            {intakeQuestionnaire && isWeightLoss && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#888', letterSpacing: '1px' }}>STARTING POINT</span>
                  <span style={{ fontSize: '11px', color: '#4caf50', background: '#e8f5e9', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>✓ Recorded</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#ff9800' }}>{intakeQuestionnaire.current_weight || '-'}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Starting lbs</div>
                  </div>
                  {intakeQuestionnaire.goal_weight && (
                    <>
                      <div style={{ fontSize: '24px', color: '#ccc' }}>→</div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '700', color: '#4caf50' }}>{intakeQuestionnaire.goal_weight}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>Goal lbs</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Injection Calendar Section */}
            {(() => {
              const injectionDays = generateInjectionDays(protocol?.dose_frequency, totalDays);
              const totalInjections = injectionDays.length;
              const completedCount = completedDays.length;
              const injectionProgress = totalInjections > 0 ? Math.round((completedCount / totalInjections) * 100) : 0;
              
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
                        const accentColor = isWeightLoss ? '#ff9800' : '#000';
                        
                        return (
                          <button 
                            key={`${item.day}-${idx}`}
                            onClick={() => toggleDay(item.day, isCompleted)}
                            disabled={isInClinic || isSaving}
                            style={{
                              aspectRatio: isWeightLoss ? '1.3' : '1',
                              borderRadius: '12px',
                              border: isCompleted ? `2px solid ${accentColor}` : '1px solid #e8e8e8',
                              background: isCompleted ? accentColor : '#fafafa',
                              color: isCompleted ? 'white' : '#333',
                              fontSize: isWeightLoss ? '12px' : '15px',
                              fontWeight: '600',
                              cursor: (isInClinic || isSaving) ? 'default' : 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: isSaving ? 0.5 : 1,
                              transition: 'all 0.2s ease',
                              padding: '8px 4px',
                              WebkitTapHighlightColor: 'transparent',
                              touchAction: 'manipulation'
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
          <div style={{ fontSize: '11px', color: '#bbb' }}>Newport Beach, CA</div>
        </footer>
      </div>
    </>
  );
}
