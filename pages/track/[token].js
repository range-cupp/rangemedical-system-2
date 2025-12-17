// /pages/track/[token].js
// Patient Recovery Tracker with Intake & Completion Assessments
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Options
const ACTIVITIES = [
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
  const [activeForm, setActiveForm] = useState(null); // 'intake' | 'completion' | null
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    primary_complaint: '',
    injury_location: '',
    injury_duration: '',
    pain_level: 5,
    pain_frequency: '',
    mobility_score: 5,
    sleep_quality: 5,
    energy_level: 5,
    activities_limited: [],
    previous_treatments: '',
    current_medications: '',
    recovery_goals: '',
    goals_achieved: '',
    overall_improvement: 5,
    would_recommend: true,
    continue_treatment: true,
    additional_notes: ''
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
        
        // Set questionnaire data
        setIntakeQuestionnaire(json.intakeQuestionnaire || null);
        setCompletionQuestionnaire(json.completionQuestionnaire || null);
        
        // Determine if we should show a form
        if (isPeptideProtocol(json.protocol?.program_type)) {
          if (!json.intakeQuestionnaire) {
            // No intake yet - show intake form
            setActiveForm('intake');
          } else if (!json.completionQuestionnaire && isNearEnd(json.protocol)) {
            // Has intake, no completion, near end - prompt for completion
            // Don't auto-show, let them tap button
          }
        }
      } else {
        setError('Protocol not found. Please check your link.');
      }
    } catch (err) {
      setError('Unable to load. Please try again.');
    }
    setLoading(false);
  };

  const isPeptideProtocol = (programType) => {
    if (!programType) return false;
    return ['recovery_jumpstart_10day', 'month_program_30day', 'maintenance_4week', 
            'injection_clinic', 'jumpstart_10day', 'recovery_10day', 'month_30day'].includes(programType);
  };

  const isNearEnd = (protocol) => {
    if (!protocol?.end_date) return false;
    const endDate = new Date(protocol.end_date);
    const today = new Date();
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return daysLeft <= 2; // Show completion prompt in last 2 days
  };

  const handleActivityToggle = (activity) => {
    setFormData(prev => ({
      ...prev,
      activities_limited: prev.activities_limited.includes(activity)
        ? prev.activities_limited.filter(a => a !== activity)
        : [...prev.activities_limited, activity]
    }));
  };

  const submitQuestionnaire = async (type) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/patient/questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          questionnaire_type: type,
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
        // Reset form
        setFormData({
          primary_complaint: '',
          injury_location: '',
          injury_duration: '',
          pain_level: 5,
          pain_frequency: '',
          mobility_score: 5,
          sleep_quality: 5,
          energy_level: 5,
          activities_limited: [],
          previous_treatments: '',
          current_medications: '',
          recovery_goals: '',
          goals_achieved: '',
          overall_improvement: 5,
          would_recommend: true,
          continue_treatment: true,
          additional_notes: ''
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save');
      }
    } catch (err) {
      alert('Error saving. Please try again.');
    }
    setSubmitting(false);
  };

  // Injection tracker functions
  const isOffDay = (dayNumber, frequency) => {
    if (!frequency) return false;
    if (frequency.includes('5 days on')) {
      const dayInWeek = ((dayNumber - 1) % 7) + 1;
      return dayInWeek === 6 || dayInWeek === 7;
    }
    if (frequency === '1x weekly') return ((dayNumber - 1) % 7) !== 0;
    if (frequency === '2x weekly') {
      const d = ((dayNumber - 1) % 7) + 1;
      return d !== 1 && d !== 4;
    }
    if (frequency === '3x weekly') {
      const d = ((dayNumber - 1) % 7) + 1;
      return d !== 1 && d !== 3 && d !== 5;
    }
    if (frequency === 'Every other day') return dayNumber % 2 === 0;
    return false;
  };

  const toggleDay = async (day, isCompleted, isOff) => {
    if (isOff) return;
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

  // Score Slider
  const ScoreSlider = ({ label, value, onChange, lowLabel, highLabel, color }) => (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#666', width: '55px' }}>{lowLabel}</span>
        <input
          type="range" min="0" max="10" value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: '11px', color: '#666', width: '55px', textAlign: 'right' }}>{highLabel}</span>
      </div>
      <div style={{ textAlign: 'center', marginTop: '4px' }}>
        <span style={{
          display: 'inline-block',
          background: color || 'black',
          color: 'white',
          padding: '2px 12px',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {value}/10
        </span>
      </div>
    </div>
  );

  // Loading
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        Loading...
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', padding: '20px', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>:(</div>
          <p style={{ color: '#666' }}>{error}</p>
        </div>
      </div>
    );
  }

  const protocol = data?.protocol;
  const injectionLogs = data?.injectionLogs || [];
  const completedDays = injectionLogs.map(log => log.day_number);
  const totalDays = protocol?.duration_days || 10;
  const progress = Math.round((completedDays.length / totalDays) * 100);
  const daysLeft = protocol?.end_date ? Math.max(0, Math.ceil((new Date(protocol.end_date) - new Date()) / (1000*60*60*24))) : 0;

  return (
    <>
      <Head>
        <title>Recovery Tracker | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui' }}>
        {/* Header */}
        <header style={{ background: 'black', color: 'white', padding: '20px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', letterSpacing: '2px' }}>RANGE MEDICAL</h1>
          <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.8 }}>Recovery Tracker</p>
        </header>

        {/* Patient Info */}
        <div style={{ background: 'white', padding: '16px 20px', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>{protocol?.patient_name}</div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{protocol?.program_name}</div>
        </div>

        {/* INTAKE FORM */}
        {activeForm === 'intake' && (
          <div style={{ padding: '16px' }}>
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ background: 'black', color: 'white', padding: '16px 20px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Starting Assessment</h2>
                <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.8 }}>
                  Let's capture your baseline so we can track your progress
                </p>
              </div>

              <div style={{ padding: '20px' }}>
                {/* Primary Complaint */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    What's your main issue? *
                  </label>
                  <textarea
                    value={formData.primary_complaint}
                    onChange={(e) => setFormData({ ...formData, primary_complaint: e.target.value })}
                    required rows={2}
                    placeholder="e.g., Shoulder pain, lower back inflammation"
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Location & Duration */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Location *</label>
                    <input
                      type="text"
                      value={formData.injury_location}
                      onChange={(e) => setFormData({ ...formData, injury_location: e.target.value })}
                      placeholder="e.g., Right shoulder"
                      style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>How long? *</label>
                    <select
                      value={formData.injury_duration}
                      onChange={(e) => setFormData({ ...formData, injury_duration: e.target.value })}
                      style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}
                    >
                      <option value="">Select...</option>
                      {INJURY_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Pain Level */}
                <ScoreSlider
                  label="Current Pain Level *"
                  value={formData.pain_level}
                  onChange={(v) => setFormData({ ...formData, pain_level: v })}
                  lowLabel="No pain"
                  highLabel="Severe"
                  color={formData.pain_level > 6 ? '#c62828' : formData.pain_level > 3 ? '#ef6c00' : '#2e7d32'}
                />

                {/* Pain Frequency */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Pain Frequency *</label>
                  <select
                    value={formData.pain_frequency}
                    onChange={(e) => setFormData({ ...formData, pain_frequency: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}
                  >
                    <option value="">Select...</option>
                    {PAIN_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <ScoreSlider label="Mobility / Range of Motion" value={formData.mobility_score} onChange={(v) => setFormData({ ...formData, mobility_score: v })} lowLabel="Very limited" highLabel="Full" />
                <ScoreSlider label="Sleep Quality" value={formData.sleep_quality} onChange={(v) => setFormData({ ...formData, sleep_quality: v })} lowLabel="Very poor" highLabel="Excellent" />
                <ScoreSlider label="Energy Level" value={formData.energy_level} onChange={(v) => setFormData({ ...formData, energy_level: v })} lowLabel="Exhausted" highLabel="Energetic" />

                {/* Activities */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Activities limited by your condition</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {ACTIVITIES.map(a => (
                      <button key={a} type="button" onClick={() => handleActivityToggle(a)}
                        style={{
                          padding: '8px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                          border: formData.activities_limited.includes(a) ? '2px solid black' : '1px solid #ddd',
                          background: formData.activities_limited.includes(a) ? 'black' : 'white',
                          color: formData.activities_limited.includes(a) ? 'white' : '#333'
                        }}
                      >{a}</button>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>What do you hope to achieve? *</label>
                  <textarea
                    value={formData.recovery_goals}
                    onChange={(e) => setFormData({ ...formData, recovery_goals: e.target.value })}
                    rows={2}
                    placeholder="e.g., Reduce pain, return to exercise, sleep better"
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={() => submitQuestionnaire('intake')}
                  disabled={submitting || !formData.primary_complaint || !formData.injury_location || !formData.pain_frequency}
                  style={{
                    width: '100%', padding: '14px', background: submitting ? '#666' : 'black', color: 'white',
                    border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px'
                  }}
                >
                  {submitting ? 'Saving...' : 'Save & Start Tracking'}
                </button>
                <button onClick={() => setActiveForm(null)} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#666', border: 'none', fontSize: '13px', cursor: 'pointer' }}>
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COMPLETION FORM */}
        {activeForm === 'completion' && (
          <div style={{ padding: '16px' }}>
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ background: '#2e7d32', color: 'white', padding: '16px 20px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Protocol Completion Assessment</h2>
                <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.9 }}>
                  Let's see how you've improved!
                </p>
              </div>

              <div style={{ padding: '20px' }}>
                {/* Show baseline comparison if we have intake */}
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

                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 20px' }}>
                  Rate how you feel <strong>now</strong> at the end of your protocol:
                </p>

                <ScoreSlider
                  label="Current Pain Level"
                  value={formData.pain_level}
                  onChange={(v) => setFormData({ ...formData, pain_level: v })}
                  lowLabel="No pain"
                  highLabel="Severe"
                  color={formData.pain_level > 6 ? '#c62828' : formData.pain_level > 3 ? '#ef6c00' : '#2e7d32'}
                />
                <ScoreSlider label="Mobility / Range of Motion" value={formData.mobility_score} onChange={(v) => setFormData({ ...formData, mobility_score: v })} lowLabel="Very limited" highLabel="Full" />
                <ScoreSlider label="Sleep Quality" value={formData.sleep_quality} onChange={(v) => setFormData({ ...formData, sleep_quality: v })} lowLabel="Very poor" highLabel="Excellent" />
                <ScoreSlider label="Energy Level" value={formData.energy_level} onChange={(v) => setFormData({ ...formData, energy_level: v })} lowLabel="Exhausted" highLabel="Energetic" />

                <ScoreSlider
                  label="Overall Improvement"
                  value={formData.overall_improvement}
                  onChange={(v) => setFormData({ ...formData, overall_improvement: v })}
                  lowLabel="Worse"
                  highLabel="Much better"
                  color="#1565c0"
                />

                {/* Goals achieved */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>What improvements did you notice?</label>
                  <textarea
                    value={formData.goals_achieved}
                    onChange={(e) => setFormData({ ...formData, goals_achieved: e.target.value })}
                    rows={2}
                    placeholder="e.g., Less pain in the morning, can exercise again, sleeping better"
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Continue treatment */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Would you like to continue treatment?</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setFormData({ ...formData, continue_treatment: true })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                        border: formData.continue_treatment ? '2px solid black' : '1px solid #ddd',
                        background: formData.continue_treatment ? 'black' : 'white',
                        color: formData.continue_treatment ? 'white' : '#333'
                      }}
                    >Yes, I'm interested</button>
                    <button type="button" onClick={() => setFormData({ ...formData, continue_treatment: false })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                        border: !formData.continue_treatment ? '2px solid black' : '1px solid #ddd',
                        background: !formData.continue_treatment ? 'black' : 'white',
                        color: !formData.continue_treatment ? 'white' : '#333'
                      }}
                    >Not right now</button>
                  </div>
                </div>

                {/* Additional notes */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Any other feedback?</label>
                  <textarea
                    value={formData.additional_notes}
                    onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                    rows={2}
                    placeholder="Optional"
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  onClick={() => submitQuestionnaire('completion')}
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '14px', background: submitting ? '#666' : '#2e7d32', color: 'white',
                    border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px'
                  }}
                >
                  {submitting ? 'Saving...' : 'Submit Completion Assessment'}
                </button>
                <button onClick={() => setActiveForm(null)} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#666', border: 'none', fontSize: '13px', cursor: 'pointer' }}>
                  I'll do this later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN TRACKER VIEW (when no form active) */}
        {!activeForm && (
          <div style={{ padding: '16px' }}>
            
            {/* Intake Summary (if completed) */}
            {intakeQuestionnaire && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#666' }}>STARTING BASELINE</span>
                  <span style={{ fontSize: '11px', color: '#4caf50', background: '#e8f5e9', padding: '2px 8px', borderRadius: '10px' }}>Recorded</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: intakeQuestionnaire.pain_level > 6 ? '#c62828' : intakeQuestionnaire.pain_level > 3 ? '#ef6c00' : '#2e7d32' }}>{intakeQuestionnaire.pain_level}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Pain</div>
                  </div>
                  <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{intakeQuestionnaire.mobility_score}</div><div style={{ fontSize: '11px', color: '#666' }}>Mobility</div></div>
                  <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{intakeQuestionnaire.sleep_quality}</div><div style={{ fontSize: '11px', color: '#666' }}>Sleep</div></div>
                  <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{intakeQuestionnaire.energy_level}</div><div style={{ fontSize: '11px', color: '#666' }}>Energy</div></div>
                </div>
                {intakeQuestionnaire.injury_location && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0', fontSize: '13px', color: '#666' }}>
                    <strong>Focus:</strong> {intakeQuestionnaire.injury_location}
                  </div>
                )}
              </div>
            )}

            {/* Completion Summary (if completed) */}
            {completionQuestionnaire && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #4caf50' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#2e7d32' }}>FINAL RESULTS</span>
                  <span style={{ fontSize: '11px', color: 'white', background: '#4caf50', padding: '2px 8px', borderRadius: '10px' }}>Complete</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: completionQuestionnaire.pain_level > 6 ? '#c62828' : completionQuestionnaire.pain_level > 3 ? '#ef6c00' : '#2e7d32' }}>
                      {completionQuestionnaire.pain_level}
                      {intakeQuestionnaire && (
                        <span style={{ fontSize: '12px', marginLeft: '4px', color: completionQuestionnaire.pain_level < intakeQuestionnaire.pain_level ? '#4caf50' : '#c62828' }}>
                          ({completionQuestionnaire.pain_level < intakeQuestionnaire.pain_level ? '↓' : '↑'}{Math.abs(completionQuestionnaire.pain_level - intakeQuestionnaire.pain_level)})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Pain</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: '700' }}>
                      {completionQuestionnaire.mobility_score}
                      {intakeQuestionnaire && (
                        <span style={{ fontSize: '12px', marginLeft: '4px', color: completionQuestionnaire.mobility_score > intakeQuestionnaire.mobility_score ? '#4caf50' : '#c62828' }}>
                          ({completionQuestionnaire.mobility_score > intakeQuestionnaire.mobility_score ? '↑' : '↓'}{Math.abs(completionQuestionnaire.mobility_score - intakeQuestionnaire.mobility_score)})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Mobility</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: '700' }}>
                      {completionQuestionnaire.overall_improvement}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Improvement</div>
                  </div>
                </div>
                {completionQuestionnaire.continue_treatment && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e8f5e9', fontSize: '13px', color: '#2e7d32', textAlign: 'center' }}>
                    ✓ Patient interested in continuing treatment
                  </div>
                )}
              </div>
            )}

            {/* Prompt for intake if not done */}
            {!intakeQuestionnaire && isPeptideProtocol(protocol?.program_type) && (
              <button
                onClick={() => setActiveForm('intake')}
                style={{
                  width: '100%', padding: '16px', background: 'white', border: '2px dashed #ddd',
                  borderRadius: '12px', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Complete Your Starting Assessment</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Help us track your recovery progress</div>
              </button>
            )}

            {/* Prompt for completion if near end and intake done */}
            {intakeQuestionnaire && !completionQuestionnaire && daysLeft <= 2 && (
              <button
                onClick={() => setActiveForm('completion')}
                style={{
                  width: '100%', padding: '16px', background: '#e8f5e9', border: '2px solid #4caf50',
                  borderRadius: '12px', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: '600', color: '#2e7d32', marginBottom: '4px' }}>Protocol Ending Soon!</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Complete your final assessment to see your progress</div>
              </button>
            )}

            {/* Progress Card */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Injection Progress</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{completedDays.length} / {totalDays} days</span>
              </div>
              <div style={{ height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'black', transition: 'width 0.3s' }} />
              </div>
              {daysLeft > 0 && <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'right' }}>{daysLeft} days remaining</div>}
            </div>

            {/* Dosing Instructions */}
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              style={{
                width: '100%', padding: '14px', background: 'white', border: '1px solid #ddd',
                borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginBottom: '16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <span>Dosing Instructions</span>
              <span style={{ transform: showInstructions ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▼</span>
            </button>

            {showInstructions && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {protocol?.primary_peptide && <div style={{ marginBottom: '12px' }}><div style={{ fontSize: '12px', color: '#666' }}>Peptide</div><div style={{ fontSize: '15px', fontWeight: '600' }}>{protocol.primary_peptide}{protocol.secondary_peptide && ` / ${protocol.secondary_peptide}`}</div></div>}
                {protocol?.dose_amount && <div style={{ marginBottom: '12px' }}><div style={{ fontSize: '12px', color: '#666' }}>Dose</div><div style={{ fontSize: '15px', fontWeight: '600' }}>{protocol.dose_amount}</div></div>}
                {protocol?.dose_frequency && <div style={{ marginBottom: '12px' }}><div style={{ fontSize: '12px', color: '#666' }}>Frequency</div><div style={{ fontSize: '15px', fontWeight: '600' }}>{protocol.dose_frequency}</div></div>}
                {protocol?.special_instructions && <div><div style={{ fontSize: '12px', color: '#666' }}>Instructions</div><div style={{ fontSize: '14px', marginTop: '4px' }}>{protocol.special_instructions}</div></div>}
                {!protocol?.primary_peptide && !protocol?.dose_amount && <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Dosing instructions will appear once configured.</p>}
              </div>
            )}

            {/* Injection Calendar */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Tap each day when complete</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                  const isCompleted = completedDays.includes(day);
                  const isOff = isOffDay(day, protocol?.dose_frequency);
                  const isSaving = saving === day;
                  
                  return (
                    <button
                      key={day} onClick={() => toggleDay(day, isCompleted, isOff)} disabled={isSaving || isOff}
                      style={{
                        aspectRatio: '1', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: isOff ? 'not-allowed' : 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: isSaving ? 0.5 : 1,
                        border: isOff ? '1px dashed #ddd' : isCompleted ? '2px solid black' : '1px solid #ddd',
                        background: isOff ? '#fafafa' : isCompleted ? 'black' : 'white',
                        color: isOff ? '#ccc' : isCompleted ? 'white' : '#333'
                      }}
                    >
                      <span>{day}</span>
                      {isCompleted && <span style={{ fontSize: '10px' }}>✓</span>}
                      {isOff && <span style={{ fontSize: '8px' }}>OFF</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact */}
            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#666' }}>
              Questions? <a href="tel:9499973988" style={{ color: 'black', fontWeight: '500' }}>(949) 997-3988</a>
            </div>
          </div>
        )}

        <footer style={{ textAlign: 'center', padding: '20px', fontSize: '11px', color: '#999' }}>
          Range Medical · Costa Mesa, CA
        </footer>
      </div>
    </>
  );
}
