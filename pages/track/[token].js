// /pages/track/[token].js
// Patient Recovery Tracker - Complete Premium Experience
// Range Medical
// Features: Wellness tracking, milestones, weight logging, messaging, refills, preferences

import { useState, useEffect, useCallback } from 'react';
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
  '2x_daily': { label: '2× Daily', schedule: 'Morning & Evening' },
  'daily': { label: 'Daily', schedule: 'Once per day' },
  '5_on_2_off': { label: '5 On / 2 Off', schedule: 'Mon-Fri, rest Sat-Sun' },
  'every_other_day': { label: 'Every Other Day', schedule: 'Alternating days' },
  '3x_weekly': { label: '3× Weekly', schedule: 'Mon, Wed, Fri' },
  '2x_weekly': { label: '2× Weekly', schedule: 'Monday & Thursday' },
  'weekly': { label: 'Weekly', schedule: 'Once per week' },
  '3x weekly': { label: '3× Weekly', schedule: 'Mon, Wed, Fri' },
  '2x weekly': { label: '2× Weekly', schedule: 'Monday & Thursday' },
  '1x weekly': { label: 'Weekly', schedule: 'Once per week' },
  '5 on 2 off': { label: '5 On / 2 Off', schedule: 'Mon-Fri, rest Sat-Sun' }
};

// Wellness metrics
const WELLNESS_METRICS = [
  { key: 'energy', label: 'Energy', lowLabel: 'Exhausted', highLabel: 'Energetic', icon: '⚡', color: '#ff9800' },
  { key: 'sleep', label: 'Sleep', lowLabel: 'Poor', highLabel: 'Excellent', icon: '😴', color: '#5c6bc0' },
  { key: 'pain', label: 'Pain', lowLabel: 'None', highLabel: 'Severe', icon: '🩹', color: '#ef5350', inverted: true },
  { key: 'recovery', label: 'Recovery', lowLabel: 'Slow', highLabel: 'Fast', icon: '💪', color: '#26a69a' },
  { key: 'wellbeing', label: 'Overall', lowLabel: 'Poor', highLabel: 'Great', icon: '✨', color: '#ab47bc' }
];

// Milestone definitions
const MILESTONES = [
  { day: 1, title: "You're Started! 🚀", message: "Day 1 complete. The journey begins!" },
  { day: 3, title: "Building Momentum! 💪", message: "3 days in. Your body is already responding." },
  { day: 5, title: "High Five! ✋", message: "5 days done. You're building a healthy habit!" },
  { percent: 25, title: "Quarter Way! 🎯", message: "25% complete. Keep going!" },
  { percent: 50, title: "Halfway There! 🏔️", message: "50% done! You're crushing it!" },
  { percent: 75, title: "Final Stretch! 🏃", message: "75% complete. The finish line is in sight!" },
  { percent: 100, title: "Protocol Complete! 🎉", message: "Amazing work! You did it!" }
];

// Message categories
const MESSAGE_CATEGORIES = [
  { value: 'question', label: '❓ Question', description: 'General question about my protocol' },
  { value: 'side_effect', label: '⚠️ Side Effect', description: 'Experiencing a side effect' },
  { value: 'scheduling', label: '📅 Scheduling', description: 'Need to reschedule or adjust' },
  { value: 'other', label: '💬 Other', description: 'Something else' }
];

// Reminder time options
const REMINDER_TIMES = [
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '18:30', label: '6:30 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' }
];

export default function PatientTracker() {
  const router = useRouter();
  const { token } = router.query;

  // Core state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(null);
  
  // Questionnaire state
  const [intakeQuestionnaire, setIntakeQuestionnaire] = useState(null);
  const [completionQuestionnaire, setCompletionQuestionnaire] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Wellness tracking
  const [symptoms, setSymptoms] = useState({ logs: [], stats: {} });
  const [showWellnessCheckIn, setShowWellnessCheckIn] = useState(false);
  const [wellnessData, setWellnessData] = useState({
    energy: 5, sleep: 5, pain: 5, recovery: 5, wellbeing: 5, notes: ''
  });
  const [savingWellness, setSavingWellness] = useState(false);
  const [todayLogged, setTodayLogged] = useState(false);
  
  // Weight tracking
  const [weightLogs, setWeightLogs] = useState({ logs: [], stats: {} });
  const [showWeightLog, setShowWeightLog] = useState(false);
  const [currentWeight, setCurrentWeight] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);
  
  // Milestones
  const [showMilestone, setShowMilestone] = useState(null);
  const [celebratedMilestones, setCelebratedMilestones] = useState([]);
  
  // Messaging
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageCategory, setMessageCategory] = useState('question');
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Refill
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [refillNotes, setRefillNotes] = useState('');
  const [sendingRefill, setSendingRefill] = useState(false);
  const [hasPendingRefill, setHasPendingRefill] = useState(false);
  
  // Preferences
  const [showSettings, setShowSettings] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('18:30');
  const [savingPrefs, setSavingPrefs] = useState(false);
  
  // Completion summary
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  
  // Form data for questionnaires
  const [formData, setFormData] = useState({
    sleep_quality: 5, energy_level: 5, current_medications: '', recovery_goals: '', goals_achieved: '',
    overall_improvement: 5, would_recommend: true, continue_treatment: true, additional_notes: '',
    primary_complaint: '', injury_location: '', injury_duration: '', pain_level: 5, pain_frequency: '',
    mobility_score: 5, activities_limited: [], previous_treatments: '',
    current_weight: '', goal_weight: '', weight_at_completion: '', appetite_level: 5, cravings_level: 5,
    exercise_frequency: '', diet_description: '', previous_weight_loss_attempts: '',
    side_effects: [], side_effects_severity: 0, clothing_fit_change: ''
  });

  // =====================================================
  // DATA FETCHING
  // =====================================================
  
  useEffect(() => {
    if (token) {
      fetchAllData();
      // Load celebrated milestones from localStorage
      const stored = localStorage.getItem(`milestones_${token}`);
      if (stored) setCelebratedMilestones(JSON.parse(stored));
    }
  }, [token]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch main tracker data
      const res = await fetch(`/api/patient/tracker?token=${token}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setIntakeQuestionnaire(json.intakeQuestionnaire || null);
        setCompletionQuestionnaire(json.completionQuestionnaire || null);
        
        // Show intake form if needed
        const category = getQuestionnaireCategory(json.protocol?.program_type, json.protocol?.program_name);
        if (category && !json.intakeQuestionnaire) {
          setActiveForm('intake');
        }
      } else {
        setError('Protocol not found. Please check your link.');
        setLoading(false);
        return;
      }
      
      // Fetch symptoms
      await fetchSymptoms();
      
      // Fetch weight logs (for weight loss)
      await fetchWeightLogs();
      
      // Fetch preferences
      await fetchPreferences();
      
      // Check refill status
      await checkRefillStatus();
      
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
  
  const fetchWeightLogs = async () => {
    try {
      const res = await fetch(`/api/patient/weight?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setWeightLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch weight:', err);
    }
  };
  
  const fetchPreferences = async () => {
    try {
      const res = await fetch(`/api/patient/preferences?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setRemindersEnabled(data.reminders_enabled);
        setReminderTime(data.preferred_reminder_time || '18:30');
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  };
  
  const checkRefillStatus = async () => {
    try {
      const res = await fetch(`/api/patient/refill?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setHasPendingRefill(data.hasPendingRequest);
      }
    } catch (err) {
      console.error('Failed to check refill:', err);
    }
  };

  // =====================================================
  // ACTIONS
  // =====================================================
  
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
        await fetchSymptoms();
      }
    } catch (err) {
      console.error('Failed to save wellness:', err);
    }
    setSavingWellness(false);
  };
  
  const saveWeight = async () => {
    if (!currentWeight) return;
    setSavingWeight(true);
    try {
      const res = await fetch(`/api/patient/weight?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: parseFloat(currentWeight) })
      });
      
      if (res.ok) {
        setShowWeightLog(false);
        setCurrentWeight('');
        await fetchWeightLogs();
      }
    } catch (err) {
      console.error('Failed to save weight:', err);
    }
    setSavingWeight(false);
  };
  
  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch(`/api/patient/preferences?token=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminders_enabled: remindersEnabled,
          preferred_reminder_time: reminderTime
        })
      });
      
      if (res.ok) {
        setShowSettings(false);
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
    setSavingPrefs(false);
  };
  
  const sendMessage = async () => {
    if (!messageText.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/patient/message?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          category: messageCategory
        })
      });
      
      if (res.ok) {
        setShowMessageModal(false);
        setMessageText('');
        alert('Message sent! We\'ll get back to you soon.');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send. Please try again or call us.');
    }
    setSendingMessage(false);
  };
  
  const requestRefill = async () => {
    setSendingRefill(true);
    try {
      const res = await fetch(`/api/patient/refill?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: refillNotes })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setShowRefillModal(false);
        setRefillNotes('');
        setHasPendingRefill(true);
        alert(data.message || 'Request submitted!');
      } else {
        alert(data.error || 'Failed to submit request');
      }
    } catch (err) {
      console.error('Failed to request refill:', err);
      alert('Failed to submit. Please call us.');
    }
    setSendingRefill(false);
  };

  const toggleDay = async (day, isCompleted) => {
    setSaving(day);
    try {
      const res = await fetch(`/api/patient/tracker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, day_number: Math.floor(day), action: isCompleted ? 'remove' : 'add' })
      });
      if (res.ok) {
        await fetchAllData();
        
        // Check for milestones after logging
        if (!isCompleted) {
          checkMilestones(day);
        }
      }
    } catch (err) {
      console.error('Error toggling day:', err);
    }
    setSaving(null);
  };
  
  // =====================================================
  // MILESTONE CHECKING
  // =====================================================
  
  const checkMilestones = (completedDay) => {
    const protocol = data?.protocol;
    const injectionLogs = data?.injectionLogs || [];
    const totalDays = protocol?.duration_days || 10;
    const completedCount = injectionLogs.length + 1; // +1 for the one just completed
    const progress = Math.round((completedCount / totalDays) * 100);
    
    // Find applicable milestone
    for (const milestone of MILESTONES) {
      const key = milestone.day ? `day_${milestone.day}` : `percent_${milestone.percent}`;
      
      if (celebratedMilestones.includes(key)) continue;
      
      if (milestone.day && completedCount === milestone.day) {
        celebrateMilestone(milestone, key);
        return;
      }
      
      if (milestone.percent && progress >= milestone.percent) {
        celebrateMilestone(milestone, key);
        return;
      }
    }
  };
  
  const celebrateMilestone = (milestone, key) => {
    setShowMilestone(milestone);
    const updated = [...celebratedMilestones, key];
    setCelebratedMilestones(updated);
    localStorage.setItem(`milestones_${token}`, JSON.stringify(updated));
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => setShowMilestone(null), 4000);
  };

  // =====================================================
  // HELPERS
  // =====================================================
  
  const getQuestionnaireCategory = (programType, programName) => {
    if (!programType && !programName) return null;
    
    // Check by program type
    const peptideTypes = ['recovery_jumpstart_10day', 'month_program_30day', 'maintenance_4week', 'injection_clinic', 'jumpstart_10day', 'recovery_10day', 'month_30day'];
    const weightLossTypes = ['weight_loss_program', 'weight_loss_injection', 'weight_loss'];
    
    if (peptideTypes.includes(programType)) return 'peptide';
    if (weightLossTypes.includes(programType)) return 'weight_loss';
    
    // Also check program_type and program_name for weight loss keywords
    const lowerType = (programType || '').toLowerCase();
    const lowerName = (programName || '').toLowerCase();
    if (lowerType.includes('weight') || lowerName.includes('weight loss')) {
      return 'weight_loss';
    }
    
    return null;
  };

  const getPeptideInfo = (peptideName) => {
    if (!peptideName) return null;
    const normalizedName = peptideName.trim();
    if (PEPTIDE_INFO[normalizedName]) return PEPTIDE_INFO[normalizedName];
    for (const key of Object.keys(PEPTIDE_INFO)) {
      if (normalizedName.toLowerCase().includes(key.toLowerCase())) {
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
    } else if (f.includes('5_on_2_off') || f.includes('5 on 2 off')) {
      // Mon-Fri each week (5 days on, 2 days off)
      const weeks = Math.ceil(duration / 7);
      for (let i = 0; i < weeks; i++) {
        days.push({ day: i * 7 + 1, label: `Wk${i + 1}`, subLabel: 'Mon' });
        days.push({ day: i * 7 + 2, label: `Wk${i + 1}`, subLabel: 'Tue' });
        days.push({ day: i * 7 + 3, label: `Wk${i + 1}`, subLabel: 'Wed' });
        days.push({ day: i * 7 + 4, label: `Wk${i + 1}`, subLabel: 'Thu' });
        days.push({ day: i * 7 + 5, label: `Wk${i + 1}`, subLabel: 'Fri' });
      }
    } else if (f.includes('3x_weekly') || f.includes('3x weekly')) {
      const weeks = Math.ceil(duration / 7);
      for (let i = 0; i < weeks; i++) {
        days.push({ day: i * 7 + 1, label: `Wk${i + 1}`, subLabel: 'Mon' });
        days.push({ day: i * 7 + 3, label: `Wk${i + 1}`, subLabel: 'Wed' });
        days.push({ day: i * 7 + 5, label: `Wk${i + 1}`, subLabel: 'Fri' });
      }
    } else if (f.includes('2x_weekly') || f.includes('2x weekly')) {
      const weeks = Math.ceil(duration / 7);
      for (let i = 0; i < weeks; i++) {
        days.push({ day: i * 7 + 1, label: `Wk${i + 1}`, subLabel: 'Mon' });
        days.push({ day: i * 7 + 4, label: `Wk${i + 1}`, subLabel: 'Thu' });
      }
    } else if (f.includes('weekly') && !f.includes('2x') && !f.includes('3x')) {
      const weeks = Math.ceil(duration / 7);
      for (let i = 1; i <= weeks; i++) days.push({ day: i * 7, label: `Wk ${i}` });
    } else if (f.includes('every_other') || f.includes('every other')) {
      for (let i = 1; i <= duration; i += 2) days.push({ day: i, label: `Day ${i}` });
    } else {
      for (let i = 1; i <= duration; i++) days.push({ day: i, label: `${i}` });
    }
    return days;
  };

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

  // =====================================================
  // SUB-COMPONENTS
  // =====================================================
  
  const ScoreSlider = ({ label, value, onChange, lowLabel = '1', highLabel = '10', color = '#000' }) => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <label style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{label}</label>
        <span style={{ fontSize: '24px', fontWeight: '700', color }}>{value}</span>
      </div>
      <input type="range" min="1" max="10" value={value} onChange={(e) => onChange(parseInt(e.target.value))} 
        style={{ width: '100%', height: '8px', borderRadius: '4px', outline: 'none', WebkitAppearance: 'none', 
          background: `linear-gradient(to right, ${color} ${(value - 1) * 11.1}%, #e0e0e0 ${(value - 1) * 11.1}%)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontSize: '11px', color: '#888' }}>{lowLabel}</span>
        <span style={{ fontSize: '11px', color: '#888' }}>{highLabel}</span>
      </div>
    </div>
  );

  // Confetti Animation
  const Confetti = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {[...Array(50)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: '10px',
          height: '10px',
          background: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f'][i % 6],
          left: `${Math.random() * 100}%`,
          top: '-10px',
          borderRadius: Math.random() > 0.5 ? '50%' : '0',
          animation: `confetti-fall ${2 + Math.random() * 2}s linear forwards`,
          animationDelay: `${Math.random() * 0.5}s`
        }} />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );

  // Milestone Celebration Modal
  const MilestoneModal = ({ milestone }) => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9998, padding: '20px'
    }} onClick={() => setShowMilestone(null)}>
      <Confetti />
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '24px', padding: '40px', textAlign: 'center', color: 'white',
        maxWidth: '320px', width: '100%', animation: 'pop-in 0.3s ease'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '700' }}>{milestone.title}</h2>
        <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>{milestone.message}</p>
      </div>
      <style jsx>{`
        @keyframes pop-in {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );

  // Weight Chart
  // Enhanced Weight Loss Journey Dashboard
  const WeightChart = ({ logs }) => {
    if (!logs || logs.length < 2) return null;
    const weights = logs.map(l => parseFloat(l.weight));
    const max = Math.max(...weights);
    const min = Math.min(...weights);
    const range = max - min || 1;
    const width = 280;
    const height = 100;
    const padding = 10;
    
    const points = weights.map((w, i) => {
      const x = padding + (i / (weights.length - 1)) * (width - 2 * padding);
      const y = padding + ((max - w) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
    
    // Create gradient fill area
    const areaPoints = `${padding},${height - padding} ` + points + ` ${width - padding},${height - padding}`;
    
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff9800" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff9800" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#weightGradient)" />
        <polyline points={points} fill="none" stroke="#ff9800" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {weights.map((w, i) => {
          const x = padding + (i / (weights.length - 1)) * (width - 2 * padding);
          const y = padding + ((max - w) / range) * (height - 2 * padding);
          return <circle key={i} cx={x} cy={y} r="4" fill="#ff9800" />;
        })}
      </svg>
    );
  };

  // Weight Loss Journey Stats Component
  const WeightLossJourney = () => {
    const logs = weightLogs.logs || [];
    const stats = weightLogs.stats || {};
    
    if (logs.length === 0) {
      return (
        <div style={{ margin: '0 20px 20px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', 
            borderRadius: '20px', 
            padding: '24px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚖️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>Start Your Weight Journey</h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px', opacity: 0.9 }}>
              Log your first weigh-in to begin tracking your transformation
            </p>
            <button
              onClick={() => setShowWeightLog(true)}
              style={{
                background: 'white',
                color: '#f57c00',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '25px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Log Weight
            </button>
          </div>
        </div>
      );
    }

    const startWeight = stats.startWeight || logs[0]?.weight;
    const currentWeight = stats.currentWeight || logs[logs.length - 1]?.weight;
    const totalLost = startWeight - currentWeight;
    const percentLost = startWeight > 0 ? ((totalLost / startWeight) * 100).toFixed(1) : 0;
    
    // Calculate weekly average loss
    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];
    const daysBetween = firstLog && lastLog ? 
      Math.max(1, Math.ceil((new Date(lastLog.log_date) - new Date(firstLog.log_date)) / (1000 * 60 * 60 * 24))) : 1;
    const weeklyAvg = daysBetween > 0 ? ((totalLost / daysBetween) * 7).toFixed(1) : 0;
    
    // Get last 7 days progress
    const last7Days = logs.slice(-7);
    const last7DaysChange = last7Days.length >= 2 ? 
      (parseFloat(last7Days[0].weight) - parseFloat(last7Days[last7Days.length - 1].weight)).toFixed(1) : 0;
    
    // Milestones
    const milestones = [
      { lbs: 5, emoji: '🌟', label: '5 lbs' },
      { lbs: 10, emoji: '⭐', label: '10 lbs' },
      { lbs: 15, emoji: '🔥', label: '15 lbs' },
      { lbs: 20, emoji: '💪', label: '20 lbs' },
      { lbs: 25, emoji: '🏆', label: '25 lbs' },
      { lbs: 30, emoji: '👑', label: '30 lbs' },
      { lbs: 40, emoji: '🚀', label: '40 lbs' },
      { lbs: 50, emoji: '💎', label: '50 lbs' }
    ];
    
    const achievedMilestones = milestones.filter(m => totalLost >= m.lbs);
    const nextMilestone = milestones.find(m => totalLost < m.lbs);
    const progressToNext = nextMilestone ? 
      Math.min(100, ((totalLost / nextMilestone.lbs) * 100).toFixed(0)) : 100;

    return (
      <div style={{ margin: '0 20px 20px' }}>
        {/* Main Stats Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', 
          borderRadius: '20px', 
          padding: '24px',
          color: 'white',
          marginBottom: '16px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '4px' }}>Total Lost</div>
            <div style={{ fontSize: '48px', fontWeight: '700', color: totalLost > 0 ? '#4caf50' : '#fff' }}>
              {totalLost > 0 ? '-' : ''}{Math.abs(totalLost).toFixed(1)}
              <span style={{ fontSize: '24px', marginLeft: '4px' }}>lbs</span>
            </div>
            <div style={{ fontSize: '14px', color: '#4caf50', marginTop: '4px' }}>
              {percentLost}% of starting weight
            </div>
          </div>
          
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Start</div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>{startWeight}</div>
              <div style={{ fontSize: '10px', opacity: 0.5 }}>lbs</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Current</div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>{currentWeight}</div>
              <div style={{ fontSize: '10px', opacity: 0.5 }}>lbs</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Weekly Avg</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: weeklyAvg > 0 ? '#4caf50' : '#fff' }}>
                {weeklyAvg > 0 ? '-' : ''}{Math.abs(weeklyAvg)}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.5 }}>lbs/week</div>
            </div>
          </div>
          
          {/* Chart */}
          {logs.length >= 2 && (
            <div style={{ marginBottom: '16px' }}>
              <WeightChart logs={logs} />
            </div>
          )}
          
          {/* Log Weight Button */}
          <button
            onClick={() => setShowWeightLog(true)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ⚖️ Log Today's Weight
          </button>
        </div>
        
        {/* Progress to Next Milestone */}
        {nextMilestone && (
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Next Milestone</span>
              <span style={{ fontSize: '24px' }}>{nextMilestone.emoji}</span>
            </div>
            <div style={{ 
              background: '#f0f0f0', 
              borderRadius: '10px', 
              height: '12px', 
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{ 
                width: `${progressToNext}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #ff9800 0%, #f57c00 100%)',
                borderRadius: '10px',
                transition: 'width 0.5s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
              <span>{totalLost.toFixed(1)} lbs lost</span>
              <span>{nextMilestone.label} goal</span>
            </div>
          </div>
        )}
        
        {/* Achieved Milestones */}
        {achievedMilestones.length > 0 && (
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              🏅 Milestones Achieved
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {achievedMilestones.map((m, i) => (
                <div key={i} style={{
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {m.emoji} {m.label}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recent Weigh-ins */}
        {logs.length > 0 && (
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              📊 Recent Weigh-ins
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.slice(-5).reverse().map((log, i) => {
                const prevLog = logs[logs.indexOf(log) - 1];
                const change = prevLog ? (parseFloat(log.weight) - parseFloat(prevLog.weight)).toFixed(1) : 0;
                return (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: '#fafafa',
                    borderRadius: '10px'
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>{log.weight} lbs</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    {prevLog && (
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: change < 0 ? '#4caf50' : change > 0 ? '#f44336' : '#888',
                        background: change < 0 ? '#e8f5e9' : change > 0 ? '#ffebee' : '#f5f5f5',
                        padding: '4px 10px',
                        borderRadius: '12px'
                      }}>
                        {change > 0 ? '+' : ''}{change} lbs
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Progress Mini Chart
  const ProgressChart = ({ logs, metric }) => {
    if (!logs || logs.length < 2) return null;
    const values = logs.map(l => l[metric.key]).filter(v => v !== null);
    if (values.length < 2) return null;
    const width = 80; const height = 30;
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - 1) / 9) * height;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polyline points={points} fill="none" stroke={metric.color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  };

  // =====================================================
  // MODALS
  // =====================================================

  const WellnessCheckInModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', color: 'white', padding: '24px', borderRadius: '20px 20px 0 0', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌟</div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Daily Check-In</h2>
          <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.8 }}>{todayLogged ? 'Update your scores' : 'How are you feeling today?'}</p>
        </div>
        <div style={{ padding: '24px' }}>
          {WELLNESS_METRICS.map(metric => (
            <div key={metric.key} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{metric.icon}</span> {metric.label}
                </span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: metric.color, background: `${metric.color}15`, padding: '4px 12px', borderRadius: '12px' }}>
                  {wellnessData[metric.key]}
                </span>
              </div>
              <input type="range" min="1" max="10" value={wellnessData[metric.key]} 
                onChange={(e) => setWellnessData(prev => ({ ...prev, [metric.key]: parseInt(e.target.value) }))}
                style={{ width: '100%', height: '8px', borderRadius: '4px', WebkitAppearance: 'none',
                  background: `linear-gradient(to right, ${metric.color} ${(wellnessData[metric.key] - 1) * 11.1}%, #e8e8e8 ${(wellnessData[metric.key] - 1) * 11.1}%)` }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: '#999' }}>{metric.lowLabel}</span>
                <span style={{ fontSize: '10px', color: '#999' }}>{metric.highLabel}</span>
              </div>
            </div>
          ))}
          <textarea value={wellnessData.notes} onChange={(e) => setWellnessData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Notes (optional)..." rows={2}
            style={{ width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '12px', fontSize: '14px', resize: 'none', boxSizing: 'border-box', marginTop: '8px' }} />
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowWellnessCheckIn(false)} style={{ flex: 1, padding: '14px', background: '#f5f5f5', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
          <button onClick={saveWellnessCheckIn} disabled={savingWellness} style={{ flex: 2, padding: '14px', background: savingWellness ? '#ccc' : 'linear-gradient(135deg, #000 0%, #333 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: savingWellness ? 'wait' : 'pointer' }}>
            {savingWellness ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );

  const WeightLogModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '340px' }}>
        <div style={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white', padding: '24px', borderRadius: '20px 20px 0 0', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚖️</div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Log Weight</h2>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <input type="number" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)}
              placeholder="185" style={{ fontSize: '48px', fontWeight: '700', width: '150px', textAlign: 'center', border: 'none', borderBottom: '3px solid #ff9800', outline: 'none', padding: '8px' }} />
            <span style={{ fontSize: '24px', color: '#888', marginLeft: '8px' }}>lbs</span>
          </div>
          {weightLogs.stats?.startWeight && (
            <div style={{ background: '#fff3e0', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#e65100' }}>
                Started at {weightLogs.stats.startWeight} lbs
                {weightLogs.stats.totalChange !== 0 && (
                  <span style={{ fontWeight: '600' }}> • {weightLogs.stats.totalChange > 0 ? '+' : ''}{weightLogs.stats.totalChange.toFixed(1)} lbs</span>
                )}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowWeightLog(false)} style={{ flex: 1, padding: '14px', background: '#f5f5f5', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={saveWeight} disabled={!currentWeight || savingWeight} style={{ flex: 2, padding: '14px', background: !currentWeight || savingWeight ? '#ccc' : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: !currentWeight || savingWeight ? 'not-allowed' : 'pointer' }}>
            {savingWeight ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );

  const MessageModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', color: 'white', padding: '24px', borderRadius: '20px 20px 0 0' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>💬 Message the Clinic</h2>
          <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.8 }}>We'll respond within 24 hours</p>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>What's this about?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {MESSAGE_CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setMessageCategory(cat.value)}
                  style={{ padding: '12px', border: messageCategory === cat.value ? '2px solid #000' : '1px solid #e0e0e0', borderRadius: '12px', background: messageCategory === cat.value ? '#f5f5f5' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Your message</label>
            <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message here..." rows={4}
              style={{ width: '100%', padding: '14px', border: '1px solid #e0e0e0', borderRadius: '12px', fontSize: '15px', resize: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowMessageModal(false)} style={{ flex: 1, padding: '14px', background: '#f5f5f5', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={sendMessage} disabled={!messageText.trim() || sendingMessage} style={{ flex: 2, padding: '14px', background: !messageText.trim() || sendingMessage ? '#ccc' : '#000', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: !messageText.trim() || sendingMessage ? 'not-allowed' : 'pointer' }}>
            {sendingMessage ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );

  const RefillModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '380px' }}>
        <div style={{ background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)', color: 'white', padding: '24px', borderRadius: '20px 20px 0 0', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Request Refill</h2>
          <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.9 }}>{data?.protocol?.program_name}</p>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 16px' }}>
            We'll prepare your refill and contact you when it's ready for pickup or shipping.
          </p>
          <textarea value={refillNotes} onChange={(e) => setRefillNotes(e.target.value)}
            placeholder="Any notes? (optional)" rows={2}
            style={{ width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '12px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowRefillModal(false)} style={{ flex: 1, padding: '14px', background: '#f5f5f5', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={requestRefill} disabled={sendingRefill} style={{ flex: 2, padding: '14px', background: sendingRefill ? '#ccc' : 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: sendingRefill ? 'wait' : 'pointer' }}>
            {sendingRefill ? 'Submitting...' : 'Request Refill'}
          </button>
        </div>
      </div>
    </div>
  );

  const SettingsModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '360px' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>⚙️ Settings</h2>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600' }}>Reminders</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Get reminded to log injections</div>
            </div>
            <button onClick={() => setRemindersEnabled(!remindersEnabled)}
              style={{ width: '52px', height: '32px', borderRadius: '16px', border: 'none', background: remindersEnabled ? '#4caf50' : '#e0e0e0', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '13px', background: 'white', position: 'absolute', top: '3px', left: remindersEnabled ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          {remindersEnabled && (
            <div>
              <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>Reminder Time</label>
              <select value={reminderTime} onChange={(e) => setReminderTime(e.target.value)}
                style={{ width: '100%', padding: '14px', border: '1px solid #e0e0e0', borderRadius: '12px', fontSize: '15px', background: 'white' }}>
                {REMINDER_TIMES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowSettings(false)} style={{ flex: 1, padding: '14px', background: '#f5f5f5', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={savePreferences} disabled={savingPrefs} style={{ flex: 1, padding: '14px', background: savingPrefs ? '#ccc' : '#000', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: savingPrefs ? 'wait' : 'pointer' }}>
            {savingPrefs ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );

  // Completion Summary
  const CompletionSummaryModal = () => {
    const intake = intakeQuestionnaire;
    const latest = symptoms.stats?.latestLog;
    const wLogs = weightLogs;
    
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Protocol Complete!</h2>
            <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.9 }}>{data?.protocol?.program_name}</p>
          </div>
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#888', letterSpacing: '1px', margin: '0 0 16px' }}>YOUR RESULTS</h3>
            
            {/* Wellness comparison */}
            {symptoms.stats?.hasData && (
              <div style={{ marginBottom: '24px' }}>
                {WELLNESS_METRICS.map(metric => {
                  const change = symptoms.stats.changes?.[metric.key];
                  if (!change) return null;
                  const improved = metric.inverted ? change.value < 0 : change.value > 0;
                  return (
                    <div key={metric.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: '14px' }}>{metric.icon} {metric.label}</span>
                      <span style={{ fontWeight: '600', color: improved ? '#4caf50' : change.value === 0 ? '#888' : '#f44336' }}>
                        {improved ? '↑' : change.value === 0 ? '→' : '↓'} {Math.abs(change.percent)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Weight loss results */}
            {wLogs.stats?.hasData && wLogs.stats.totalChange !== 0 && (
              <div style={{ background: '#fff3e0', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: '#e65100', marginBottom: '8px' }}>Total Weight Change</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: wLogs.stats.totalChange < 0 ? '#4caf50' : '#f44336' }}>
                  {wLogs.stats.totalChange > 0 ? '+' : ''}{wLogs.stats.totalChange.toFixed(1)} lbs
                </div>
              </div>
            )}
            
            {/* Next steps */}
            <div style={{ background: '#f5f5f5', borderRadius: '16px', padding: '20px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '600' }}>What's Next?</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                Ready to continue your progress? Request a refill or schedule a follow-up with our team.
              </p>
            </div>
          </div>
          <div style={{ padding: '0 24px 24px', display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowCompletionSummary(false)} style={{ flex: 1, padding: '14px', background: '#f5f5f5', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer' }}>Close</button>
            <button onClick={() => { setShowCompletionSummary(false); setShowRefillModal(true); }} style={{ flex: 1, padding: '14px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Request Refill</button>
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // MAIN RENDER
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
  const category = getQuestionnaireCategory(protocol?.program_type, protocol?.program_name);
  const isWeightLoss = category === 'weight_loss';
  const isPeptide = category === 'peptide';
  const isInClinic = protocol?.injection_location === 'in_clinic';
  
  const primaryPeptide = protocol?.primary_peptide;
  const peptideInfo = getPeptideInfo(primaryPeptide);
  const frequencyInfo = FREQUENCY_DISPLAY[protocol?.dose_frequency] || FREQUENCY_DISPLAY['daily'];
  const streak = calculateStreak();
  
  const injectionDays = generateInjectionDays(protocol?.dose_frequency, totalDays);
  const totalInjections = injectionDays.length;
  const completedCount = completedDays.length;
  const injectionProgress = totalInjections > 0 ? Math.round((completedCount / totalInjections) * 100) : 0;
  const isComplete = injectionProgress >= 100;

  return (
    <>
      <Head>
        <title>{protocol?.patient_name ? `${protocol.patient_name} - ` : ''}Tracker | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
      </Head>
      
      {/* Modals */}
      {showMilestone && <MilestoneModal milestone={showMilestone} />}
      {showWellnessCheckIn && <WellnessCheckInModal />}
      {showWeightLog && <WeightLogModal />}
      {showMessageModal && <MessageModal />}
      {showRefillModal && <RefillModal />}
      {showSettings && <SettingsModal />}
      {showCompletionSummary && <CompletionSummaryModal />}
      
      <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', letterSpacing: '2px' }}>RANGE MEDICAL</h1>
            <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>{isWeightLoss ? 'Weight Loss Journey' : 'Recovery Tracker'}</p>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>⚙️</button>
        </header>

        {/* Welcome Card */}
        <div style={{ margin: '20px', background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#888' }}>Welcome back,</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a' }}>{protocol?.patient_name}</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{protocol?.program_name}</div>
            </div>
            {streak > 0 && (
              <div style={{ background: '#fff3e0', borderRadius: '12px', padding: '8px 12px' }}>
                <span style={{ fontSize: '13px', color: '#e65100', fontWeight: '600' }}>🔥 {streak} day streak</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            {daysLeft > 0 && <span style={{ background: '#f5f5f5', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#666' }}>📅 {daysLeft} days left</span>}
            {isComplete && <span style={{ background: '#e8f5e9', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#2e7d32', fontWeight: '600' }}>✓ Complete!</span>}
          </div>
        </div>

        {/* Action Buttons Row */}
        {!activeForm && !isInClinic && (
          <div style={{ margin: '0 20px 20px', display: 'grid', gridTemplateColumns: isWeightLoss ? '1fr 1fr' : '1fr', gap: '12px' }}>
            {/* Wellness Check-in */}
            <button onClick={() => setShowWellnessCheckIn(true)} style={{ padding: '16px', background: todayLogged ? '#e8f5e9' : '#fff8e1', border: 'none', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
              <span style={{ fontSize: '24px' }}>{todayLogged ? '✅' : '📊'}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{todayLogged ? 'Check-In Done' : 'Daily Check-In'}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Track wellness</div>
              </div>
            </button>
            
            {/* Weight Log (weight loss only) */}
            {isWeightLoss && (
              <button onClick={() => setShowWeightLog(true)} style={{ padding: '16px', background: '#fff3e0', border: 'none', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                <span style={{ fontSize: '24px' }}>⚖️</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>Log Weight</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    {weightLogs.stats?.currentWeight ? `Current: ${weightLogs.stats.currentWeight} lbs` : 'Track progress'}
                  </div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Weight Loss Journey Dashboard */}
        {isWeightLoss && !activeForm && (
          <WeightLossJourney />
        )}

        {/* Wellness Progress Card */}
        {symptoms.logs?.length >= 2 && !activeForm && (
          <div style={{ margin: '0 20px 20px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600' }}>Your Progress</span>
                <span style={{ fontSize: '11px', color: '#888' }}>{symptoms.logs.length} check-ins</span>
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {WELLNESS_METRICS.map(metric => {
                  const values = symptoms.logs.map(l => l[metric.key]).filter(v => v !== null);
                  if (values.length < 2) return null;
                  const first = values[0];
                  const last = values[values.length - 1];
                  const change = last - first;
                  const improved = metric.inverted ? change < 0 : change > 0;
                  return (
                    <div key={metric.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{metric.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{metric.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ProgressChart logs={symptoms.logs} metric={metric} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: improved ? '#4caf50' : change === 0 ? '#888' : '#ef5350' }}>
                          {first}→{last}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Injection Progress */}
        {!activeForm && (
          <div style={{ margin: '0 20px 20px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600' }}>Injections</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: isWeightLoss ? '#ff9800' : '#000' }}>
                  {completedCount}<span style={{ fontSize: '14px', fontWeight: '400', color: '#888' }}>/{totalInjections}</span>
                </span>
              </div>
              <div style={{ height: '10px', background: '#f0f0f0', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${injectionProgress}%`, background: isWeightLoss ? '#ff9800' : '#000', transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', color: '#888' }}>
                <span>{injectionProgress}% complete</span>
                <span>{totalInjections - completedCount} remaining</span>
              </div>
              
              {/* Calendar Grid */}
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {injectionDays.map((item, idx) => {
                  const isCompleted = completedDays.includes(Math.floor(item.day));
                  const isSaving = saving === item.day;
                  const accent = isWeightLoss ? '#ff9800' : '#000';
                  return (
                    <button key={`${item.day}-${idx}`} onClick={() => toggleDay(item.day, isCompleted)} disabled={isInClinic || isSaving}
                      style={{ aspectRatio: '1', borderRadius: '10px', border: isCompleted ? `2px solid ${accent}` : '1px solid #e8e8e8', background: isCompleted ? accent : '#fafafa', color: isCompleted ? 'white' : '#333', fontSize: '14px', fontWeight: '600', cursor: isInClinic ? 'default' : 'pointer', opacity: isSaving ? 0.5 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span>{item.label}</span>
                      {item.subLabel && <span style={{ fontSize: '9px', opacity: 0.7 }}>{item.subLabel}</span>}
                      {isCompleted && <span style={{ fontSize: '10px' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!activeForm && (
          <div style={{ margin: '0 20px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={() => setShowMessageModal(true)} style={{ padding: '16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>💬</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Message Clinic</span>
              </button>
              <button onClick={() => hasPendingRefill ? null : setShowRefillModal(true)} disabled={hasPendingRefill}
                style={{ padding: '16px', background: hasPendingRefill ? '#e8f5e9' : 'white', border: '1px solid #e0e0e0', borderRadius: '14px', cursor: hasPendingRefill ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: hasPendingRefill ? 0.8 : 1 }}>
                <span style={{ fontSize: '18px' }}>{hasPendingRefill ? '✓' : '📦'}</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{hasPendingRefill ? 'Refill Requested' : 'Request Refill'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Completion Summary Button */}
        {isComplete && !activeForm && (
          <div style={{ margin: '0 20px 20px' }}>
            <button onClick={() => setShowCompletionSummary(true)} style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '16px', cursor: 'pointer', color: 'white' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏆</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>View Your Results</div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>See how far you've come!</div>
            </button>
          </div>
        )}

        {/* Call Button */}
        <div style={{ textAlign: 'center', margin: '32px 20px' }}>
          <a href="tel:9499973988" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: '#f5f5f5', borderRadius: '25px', color: '#333', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            📞 (949) 997-3988
          </a>
        </div>

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '24px 20px 40px', borderTop: '1px solid #f0f0f0', background: 'white' }}>
          <div style={{ fontSize: '11px', color: '#ccc', letterSpacing: '2px' }}>RANGE MEDICAL</div>
          <div style={{ fontSize: '11px', color: '#bbb' }}>Newport Beach, CA</div>
        </footer>
      </div>
    </>
  );
}
