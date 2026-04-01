// /pages/admin/protocols/[id].js
// Protocol Detail - Clean day tracking
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getHRTLabSchedule, matchDrawsToLogs, isHRTProtocol } from '../../../lib/hrt-lab-schedule';
import { isRecoveryPeptide, isGHPeptide, RECOVERY_CYCLE_MAX_DAYS, RECOVERY_CYCLE_OFF_DAYS, GH_CYCLE_MAX_DAYS, GH_CYCLE_OFF_DAYS, INJECTION_METHODS, HRT_SUPPLY_TYPES, HRT_SECONDARY_MEDICATIONS, PEPTIDE_OPTIONS, WEIGHT_LOSS_MEDICATIONS } from '../../../lib/protocol-config';
import { PROTOCOL_TYPES, detectProtocolType, getDBProgramType, getDeliveryLabel } from '../../../lib/protocol-types';
import AdminLayout from '../../../components/AdminLayout';
import { useAuth } from '../../../components/AuthProvider';

// Side effects list — matches lib/wl-side-effect-guidance.js
const WL_SIDE_EFFECTS = ['Nausea', 'Fatigue', 'Constipation', 'Indigestion', 'Injection Site Pain'];

// Normalize freetext frequency values to standard codes
function normalizeFrequencyValue(freq) {
  if (!freq) return null;
  const f = freq.toLowerCase().trim();
  // Exact matches first
  if (f === 'daily' || f === 'once daily' || f === '1x daily' || f === '1x_daily') return 'daily';
  if (f === '2x daily' || f === 'twice daily' || f === '2x_daily') return '2x_daily';
  if (f === '2x weekly' || f === '2x_weekly' || f === 'twice weekly') return '2x_weekly';
  if (f === 'weekly' || f === 'once per week' || f === 'once weekly') return 'weekly';
  if (f === 'per session' || f === 'per_session') return 'per_session';
  // Ambiguous like "Daily or 2x daily" — default to daily (user sets exact in edit mode)
  if (f.includes('daily')) return 'daily';
  if (f.includes('weekly')) return 'weekly';
  return freq;
}

// Normalize protocol fields - handles both old and new column names
function normalizeProtocol(p) {
  if (!p) return p;

  // Calculate duration — program name is source of truth for X-Day protocols
  let durationDays = null;

  // 1. Parse from program_name first (e.g., "10-Day Recovery Protocol" → 10)
  if (p.program_name) {
    const match = p.program_name.match(/(\d+)[- ]?Day/i);
    if (match) durationDays = parseInt(match[1]);
  }

  // 2. duration_days or total_days from DB
  if (!durationDays) durationDays = p.duration_days || p.total_days;

  // 3. Fallback to total_sessions for non-weight-loss protocols
  const pType = (p.program_type || '').toLowerCase();
  if (!durationDays && !pType.includes('weight_loss')) {
    durationDays = p.total_sessions;
  }

  // 4. Compute from date range as last resort
  if (!durationDays && p.start_date && p.end_date) {
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const calculated = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (calculated > 0) durationDays = calculated;
  }

  return {
    ...p,
    // Normalize to actual DB column names (single source of truth)
    medication: p.medication || p.primary_peptide || null,
    selected_dose: p.selected_dose || p.dose_amount || p.starting_dose || null,
    frequency: normalizeFrequencyValue(p.frequency || p.dose_frequency),
    delivery_method: p.delivery_method || p.injection_location || null,
    // Also keep legacy aliases for backwards compat in view templates
    primary_peptide: p.medication || p.primary_peptide || null,
    dose_amount: p.selected_dose || p.dose_amount || p.starting_dose || null,
    dose_frequency: normalizeFrequencyValue(p.frequency || p.dose_frequency),
    injection_location: p.delivery_method || p.injection_location || null,
    // Duration (computed from multiple sources)
    duration_days: durationDays || null,
    total_days: durationDays || null
  };
}

// Get today in Pacific time
function getPacificToday() {
  const now = new Date();
  const pacific = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  pacific.setHours(0, 0, 0, 0);
  return pacific;
}

// Get a date for a protocol day number based on start_date (in Pacific time)
function getDateForDay(startDate, dayNum) {
  if (!startDate) return null;
  const parts = startDate.split('-');
  const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  start.setDate(start.getDate() + dayNum - 1);
  return start;
}

// Format a short date like "Feb 28"
function formatShortDate(date) {
  if (!date) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function calculateCurrentDay(startDate) {
  if (!startDate) return null;
  // Parse start date without timezone shift
  const parts = startDate.split('-');
  const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  start.setHours(0, 0, 0, 0);
  const today = getPacificToday();
  const diffTime = today - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

// Calculate effective calendar days based on frequency
// A 30-day supply taken twice daily = 15 actual days
function getEffectiveDays(durationDays, frequency) {
  if (!durationDays) return durationDays;
  if (frequency === '2x_daily') return Math.ceil(durationDays / 2);
  return durationDays;
}

export default function ProtocolDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { session } = useAuth();

  // Note delete permissions — author or admin only
  const NOTE_AUTHOR_ALIASES = {
    'burgess@range-medical.com': ['burgess@range-medical.com', 'dr. damien burgess', 'dr. burgess', 'damien burgess'],
    'lily@range-medical.com': ['lily@range-medical.com', 'lily'],
    'evan@range-medical.com': ['evan@range-medical.com', 'evan'],
    'chris@range-medical.com': ['chris@range-medical.com', 'chris', 'chris cupp'],
  };
  const currentUserEmail = session?.user?.email?.toLowerCase() || '';
  const isAdminUser = currentUserEmail === 'chris@range-medical.com';
  const canDeleteNote = (note) => {
    if (isAdminUser) return true;
    if (!note.created_by) return false;
    const aliases = NOTE_AUTHOR_ALIASES[currentUserEmail] || [];
    return note.created_by.toLowerCase() === currentUserEmail || aliases.some(a => a === note.created_by.toLowerCase());
  };

  const [protocol, setProtocol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [labSchedule, setLabSchedule] = useState([]);
  const [checkinSchedule, setCheckinSchedule] = useState([]);
  const [injectionLogs, setInjectionLogs] = useState([]);
  const [weightProgress, setWeightProgress] = useState(null);
  const [logModal, setLogModal] = useState(null); // { injectionNum, date, isCompleted }
  const [logForm, setLogForm] = useState({ weight: '', dose: '', notes: '', sideEffects: [], deliveryMethod: 'take_home', bloodPressure: '', missed: false });
  const [logSaving, setLogSaving] = useState(false);
  const [editDateModal, setEditDateModal] = useState(null); // { logId, injectionNum, currentDate, source }
  const [editDateValue, setEditDateValue] = useState('');
  const [editWeightValue, setEditWeightValue] = useState('');
  const [editDoseValue, setEditDoseValue] = useState('');
  const [editDateSaving, setEditDateSaving] = useState(false);
  const [bloodDrawModal, setBloodDrawModal] = useState(null); // { label, status, completedDate, protocolId }
  const [bloodDrawDate, setBloodDrawDate] = useState('');
  const [bloodDrawSaving, setBloodDrawSaving] = useState(false);
  const [sendingGuide, setSendingGuide] = useState(false);
  const [wlCheckinDay, setWlCheckinDay] = useState('Monday');
  const [enablingWlCheckin, setEnablingWlCheckin] = useState(false);
  const [dripLogs, setDripLogs] = useState([]);
  const [startingDrip, setStartingDrip] = useState(false);
  const [onboardingLogs, setOnboardingLogs] = useState([]);
  const [startingOnboarding, setStartingOnboarding] = useState(false);
  const [secMedPickupModal, setSecMedPickupModal] = useState(null); // { medication, detail }
  const [secMedPickupForm, setSecMedPickupForm] = useState({ date: '', num_vials: 1, dosage: '', frequency: '' });
  const [secMedPickupSaving, setSecMedPickupSaving] = useState(false);
  const [hrtReminderSchedule, setHrtReminderSchedule] = useState('mon_thu');
  const [enablingHrtReminders, setEnablingHrtReminders] = useState(false);
  const [sessionModal, setSessionModal] = useState(null); // { sessionNum }
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [encounterNotes, setEncounterNotes] = useState([]); // All encounter notes for this patient (for matching to injection dates)
  const [encounterSlideNote, setEncounterSlideNote] = useState(null); // Note to show in slide-out panel
  const [showAddClinicalNote, setShowAddClinicalNote] = useState(false);
  const [clinicalNoteInput, setClinicalNoteInput] = useState('');
  const [clinicalNoteSaving, setClinicalNoteSaving] = useState(false);
  const [clinicalNoteFormatting, setClinicalNoteFormatting] = useState(false);
  const [rangeIVStatus, setRangeIVStatus] = useState(null); // { used: bool, serviceDate, serviceLogId }
  const [redeemingRangeIV, setRedeemingRangeIV] = useState(false);
  const [exchangeModal, setExchangeModal] = useState(false);
  const [exchangeForm, setExchangeForm] = useState({ medication: '', dosage: '', frequency: 'daily', duration: '', reason: '', reasonNote: '', protocolType: '' });
  const [exchangeSaving, setExchangeSaving] = useState(false);
  const [addSessionsModal, setAddSessionsModal] = useState(false);
  const [addSessionsCount, setAddSessionsCount] = useState('');
  const [addSessionsNotes, setAddSessionsNotes] = useState('');
  const [addSessionsSaving, setAddSessionsSaving] = useState(false);

  useEffect(() => {
    if (id) fetchProtocol();
  }, [id]);

  // Auto-enter edit mode if ?edit=true
  useEffect(() => {
    if (router.query.edit === 'true' && protocol && !isEditing) {
      setIsEditing(true);
    }
  }, [router.query.edit, protocol]);

  const fetchProtocol = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/protocols/${id}`);
      if (!res.ok) throw new Error('Protocol not found');
      const data = await res.json();
      const p = normalizeProtocol(data.protocol || data);

      // Fetch patient name from patients table if missing
      let patientName = p.patient_name;
      let patientPhone = p.patient_phone;
      let patientEmail = p.patient_email;
      if (p.patient_id && !patientName) {
        try {
          const patientRes = await fetch(`/api/admin/patients?id=${p.patient_id}`);
          const patientData = await patientRes.json();
          const patient = patientData?.[0];
          if (patient) {
            patientName = patient.first_name && patient.last_name
              ? `${patient.first_name} ${patient.last_name}`
              : patient.name || patientName;
            patientPhone = patientPhone || patient.phone;
            patientEmail = patientEmail || patient.email;
          }
        } catch (e) { /* ignore */ }
      }

      const enrichedProtocol = {
        ...p,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: patientEmail
      };
      setProtocol(enrichedProtocol);

      const detectedType = detectProtocolType(enrichedProtocol.program_type, enrichedProtocol.primary_peptide);
      const durationVal = enrichedProtocol.duration_days || enrichedProtocol.total_sessions || 30;
      const freq = enrichedProtocol.dose_frequency || enrichedProtocol.frequency || 'daily';
      setForm({
        protocolType: detectedType,
        patientName: patientName || '',
        patientPhone: patientPhone || '',
        patientEmail: patientEmail || '',
        medication: enrichedProtocol.primary_peptide || '',
        dosage: enrichedProtocol.dose_amount || '',
        frequency: freq,
        deliveryMethod: enrichedProtocol.injection_location || 'take_home',
        startDate: enrichedProtocol.start_date || '',
        duration: durationVal,
        totalSessions: enrichedProtocol.total_sessions || durationVal,
        status: enrichedProtocol.status || 'active',
        notes: enrichedProtocol.notes || '',
        // HRT decision tree fields
        injectionMethod: enrichedProtocol.injection_method || '',
        supplyType: enrichedProtocol.supply_type || '',
        scheduledDays: enrichedProtocol.scheduled_days || [],
        secondaryMedications: enrichedProtocol.secondary_medications ? (typeof enrichedProtocol.secondary_medications === 'string' ? JSON.parse(enrichedProtocol.secondary_medications) : enrichedProtocol.secondary_medications) : []
      });

      // Build check-in schedule for take-home protocols (NOT HRT — HRT has its own reminder system)
      // Use effective days (accounts for twice daily cutting duration in half)
      const effectiveDuration = getEffectiveDays(durationVal, freq);
      const delivery = enrichedProtocol.injection_location;
      const isOngoingType = isHRTProtocol(enrichedProtocol.program_type) ||
        (enrichedProtocol.program_name || '').toLowerCase().includes('hrt') ||
        (enrichedProtocol.program_name || '').toLowerCase().includes('testosterone');
      if (!isOngoingType && delivery === 'take_home' && enrichedProtocol.start_date && effectiveDuration > 7) {
        buildCheckinSchedule(enrichedProtocol, effectiveDuration, id);
      } else {
        setCheckinSchedule([]);
      }

      // Fetch blood draw schedule for HRT protocols
      if (isHRTProtocol(enrichedProtocol.program_type) && enrichedProtocol.start_date) {
        fetchLabSchedule(enrichedProtocol);
      } else {
        setLabSchedule([]);
      }

      // Fetch HRT onboarding logs + Range IV status
      if (isHRTProtocol(enrichedProtocol.program_type)) {
        try {
          const obRes = await fetch(`/api/protocols/${id}`);
          const obData = await obRes.json();
          setOnboardingLogs((obData.activityLogs || []).filter(l => l.log_type === 'hrt_onboarding'));
        } catch { setOnboardingLogs([]); }
        // Fetch Range IV perk status for this billing cycle
        fetchRangeIVStatus(enrichedProtocol);
      } else {
        setOnboardingLogs([]);
        setRangeIVStatus(null);
      }

      // Fetch injection logs + weight progress for weight loss protocols
      const pt = (enrichedProtocol.program_type || '').toLowerCase();
      const pn = (enrichedProtocol.program_name || '').toLowerCase();
      const wl = pt.includes('weight_loss') ||
        ['semaglutide', 'tirzepatide', 'retatrutide'].some(m => pn.includes(m) || (enrichedProtocol.primary_peptide || '').toLowerCase().includes(m));
      if (wl) {
        fetchInjectionLogs(id);
        // Fetch drip email logs for email sequence UI
        try {
          const dripRes = await fetch(`/api/protocols/${id}`);
          const dripData = await dripRes.json();
          setDripLogs((dripData.activityLogs || []).filter(l => l.log_type === 'drip_email'));
        } catch { setDripLogs([]); }
      } else {
        setInjectionLogs([]);
        setWeightProgress(null);
        setDripLogs([]);
      }

      // Fetch clinical notes linked to this protocol + all encounter notes for this patient
      try {
        const [notesRes, encRes] = await Promise.all([
          fetch(`/api/notes/by-protocol?protocol_id=${id}`),
          enrichedProtocol.patient_id
            ? fetch(`/api/notes/by-patient?patient_id=${enrichedProtocol.patient_id}&source=encounter`)
            : Promise.resolve(null),
        ]);
        if (notesRes.ok) {
          const notesData = await notesRes.json();
          setClinicalNotes(notesData.notes || []);
        }
        if (encRes && encRes.ok) {
          const encData = await encRes.json();
          setEncounterNotes(encData.notes || []);
        }
      } catch { setClinicalNotes([]); setEncounterNotes([]); }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Range IV perk status for the current HRT billing cycle
  const fetchRangeIVStatus = async (p) => {
    try {
      const res = await fetch(`/api/protocols/${p.id}/range-iv-status`);
      if (res.ok) {
        const data = await res.json();
        setRangeIVStatus(data);
      }
    } catch (err) {
      console.error('Error fetching Range IV status:', err);
    }
  };

  const fetchLabSchedule = async (p) => {
    try {
      const res = await fetch(`/api/protocols/${p.id}`);
      const data = await res.json();
      const logs = (data.activityLogs || []).filter(l => l.log_type === 'blood_draw');

      // Fetch labs for this patient
      let patientLabs = [];
      if (p.patient_id) {
        const labsRes = await fetch(`/api/patients/${p.patient_id}`);
        const labsData = await labsRes.json();
        patientLabs = labsData.labs || [];
      }

      const firstFollowup = p.first_followup_weeks || 8;
      const schedule = getHRTLabSchedule(p.start_date, firstFollowup);
      const matched = matchDrawsToLogs(schedule, logs, patientLabs);
      setLabSchedule(matched);
    } catch (err) {
      console.error('Error fetching lab schedule:', err);
      // Still show schedule without completion data
      const firstFollowup = p.first_followup_weeks || 8;
      const schedule = getHRTLabSchedule(p.start_date, firstFollowup);
      setLabSchedule(schedule.map(s => ({ ...s, status: 'upcoming', completedDate: null })));
    }
  };

  const fetchInjectionLogs = async (protocolId) => {
    try {
      const res = await fetch(`/api/protocols/${protocolId}`);
      const data = await res.json();
      // Combine weightCheckins + activityLogs (injections + checkins) into a single timeline
      const checkins = data.weightCheckins || [];
      const activity = (data.activityLogs || []).filter(l => l.log_type === 'injection' || l.log_type === 'checkin' || l.log_type === 'missed');
      // Merge and deduplicate by id
      const allEntries = [...checkins, ...activity];
      const seen = new Set();
      const unique = allEntries.filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
      // Sort by date descending (most recent first)
      unique.sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
      setInjectionLogs(unique);
      setWeightProgress(data.weightProgress || null);

      // Sync local state with protocol.sessions_used from DB (authoritative source)
      // Do NOT auto-correct upward based on merged log count — that causes ghost entries
      // from stale cross-table data to bump the count back up after deletions.
      if (protocol && protocol.sessions_used !== undefined) {
        const dbCount = protocol.sessions_used || 0;
        if (unique.length !== dbCount) {
          // Trust the DB count, trim or pad the local log list display
          setProtocol(prev => prev);
        }
      }
    } catch (err) {
      console.error('Error fetching injection logs:', err);
      setInjectionLogs([]);
      setWeightProgress(null);
    }
  };

  const handleCalendarDayClick = (injectionNum, date) => {
    // Pre-fill dose from last logged injection (for dose escalation continuity)
    const lastDose = injectionLogs.length > 0
      ? (injectionLogs[0].dosage || (injectionLogs[0].notes || '').match(/Dose:\s*([^|]+)/)?.[1]?.trim())
      : null;
    const defaultDose = lastDose || protocol?.selected_dose || protocol?.primary_peptide || '';
    setLogForm({ weight: '', dose: defaultDose, notes: '', sideEffects: [], deliveryMethod: 'take_home', bloodPressure: '', missed: false });
    setLogModal({
      injectionNum,
      date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
  };

  // Blood draw handlers
  const handleBloodDrawClick = (draw) => {
    setBloodDrawDate(draw.completedDate || new Date().toISOString().split('T')[0]);
    setBloodDrawModal({ ...draw, protocolId: protocol?.id });
  };

  const handleBloodDrawSave = async (action = 'complete') => {
    if (!bloodDrawModal) return;
    setBloodDrawSaving(true);
    try {
      const res = await fetch(`/api/protocols/${bloodDrawModal.protocolId}/log-blood-draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawLabel: bloodDrawModal.label,
          completedDate: action === 'undo' ? null : bloodDrawDate,
          action: action === 'undo' ? 'undo' : 'complete'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setBloodDrawModal(null);
        // Refresh lab schedule
        if (protocol) fetchLabSchedule(protocol);
      } else {
        setError(data.error || 'Failed to update blood draw');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBloodDrawSaving(false);
    }
  };

  const handleToggleFollowupWeeks = async () => {
    const currentWeeks = protocol?.first_followup_weeks || 8;
    const newWeeks = currentWeeks === 8 ? 12 : 8;
    // Update local state immediately for responsive UI
    setProtocol(prev => ({ ...prev, first_followup_weeks: newWeeks }));
    fetchLabSchedule({ ...protocol, first_followup_weeks: newWeeks });
    setSuccess(`First follow-up changed to ${newWeeks} weeks`);
    // Persist to database (may fail if column doesn't exist yet — that's OK)
    try {
      await fetch(`/api/protocols/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_followup_weeks: newWeeks })
      });
    } catch (err) {
      console.error('Could not persist first_followup_weeks:', err);
    }
  };

  const handleLogInjection = async (force = false) => {
    if (!logModal) return;
    setLogSaving(true);
    try {
      const body = {
        log_date: logModal.date,
        weight: logForm.weight ? parseFloat(logForm.weight) : null,
        dose: logForm.missed ? null : (logForm.dose || null),
        notes: logForm.notes || null,
        delivery_method: logForm.missed ? null : (logForm.deliveryMethod || 'take_home'),
        side_effects: logForm.missed ? null : (logForm.sideEffects.length > 0 ? logForm.sideEffects : null),
        blood_pressure: !logForm.missed && logForm.deliveryMethod === 'in_clinic' && logForm.bloodPressure ? logForm.bloodPressure : null,
        missed: logForm.missed || false,
      };
      if (force) body.force = true;

      const res = await fetch(`/api/protocols/${id}/log-injection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.status === 409 && data.duplicate) {
        setLogSaving(false);
        if (window.confirm(data.message + '\n\nLog it anyway?')) {
          return handleLogInjection(true); // Re-submit with force
        }
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to log injection');
      setSuccess(logForm.missed ? `Injection #${data.injection_number} — missed check-in logged` : `Injection #${data.injection_number} logged`);
      setLogModal(null);
      fetchProtocol(); // Refresh all data
    } catch (err) {
      setError(err.message);
    } finally {
      setLogSaving(false);
    }
  };

  // Quick-complete: mark next injection as done with one click (no modal)
  const handleQuickComplete = async (injectionDate) => {
    setLogSaving(true);
    try {
      const dateStr = injectionDate
        ? injectionDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      const lastDose = injectionLogs.length > 0
        ? (injectionLogs[0].dosage || (injectionLogs[0].notes || '').match(/Dose:\s*([^|]+)/)?.[1]?.trim())
        : null;
      const quickBody = {
        log_date: dateStr,
        weight: null,
        dose: lastDose || protocol?.selected_dose || null,
        notes: null,
        delivery_method: 'take_home',
        side_effects: null,
        blood_pressure: null,
        missed: false,
      };
      const res = await fetch(`/api/protocols/${id}/log-injection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quickBody),
      });
      const data = await res.json();
      if (res.status === 409 && data.duplicate) {
        setLogSaving(false);
        if (window.confirm(data.message + '\n\nLog it anyway?')) {
          // Re-submit with force
          const forceRes = await fetch(`/api/protocols/${id}/log-injection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...quickBody, force: true }),
          });
          const forceData = await forceRes.json();
          if (!forceRes.ok) throw new Error(forceData.error || 'Failed to log injection');
          setSuccess(`Injection #${forceData.injection_number} marked complete`);
          fetchProtocol();
        }
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to log injection');
      setSuccess(`Injection #${data.injection_number} marked complete`);
      fetchProtocol();
    } catch (err) {
      setError(err.message);
    } finally {
      setLogSaving(false);
    }
  };

  // Quick-missed: mark next injection as missed check-in with one click
  // (missed injections skip duplicate check — always allowed)
  const handleQuickMissed = async (injectionDate) => {
    setLogSaving(true);
    try {
      const dateStr = injectionDate
        ? injectionDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/protocols/${id}/log-injection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_date: dateStr,
          weight: null,
          dose: null,
          notes: null,
          delivery_method: null,
          side_effects: null,
          blood_pressure: null,
          missed: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log missed check-in');
      setSuccess(`Injection #${data.injection_number} — missed check-in logged`);
      fetchProtocol();
    } catch (err) {
      setError(err.message);
    } finally {
      setLogSaving(false);
    }
  };

  // Edit an existing injection log (date and/or weight)
  const handleEditLogEntry = async () => {
    if (!editDateModal || !editDateValue) return;
    setEditDateSaving(true);
    try {
      // Weight: empty string means clear it, otherwise parse as number
      const weightVal = editWeightValue.trim() === '' ? null : parseFloat(editWeightValue);

      const res = await fetch(`/api/protocols/${id}/log-injection`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_id: editDateModal.logId,
          log_date: editDateValue,
          weight: weightVal,
          update_weight: true,
          dose: editDoseValue.trim() || null,
          update_dose: true,
          source: editDateModal.source || 'protocol_logs',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setSuccess(`Injection #${editDateModal.injectionNum} updated`);
      setEditDateModal(null);
      fetchProtocol(); // Refresh all data
    } catch (err) {
      setError(err.message);
    } finally {
      setEditDateSaving(false);
    }
  };

  // Open edit modal for a completed injection
  const handleEditInjection = (injectionNum) => {
    // injectionLogs are sorted descending (most recent first)
    // Sort ascending to map injection #1 = oldest, #2 = next, etc.
    const sortedAsc = [...injectionLogs].sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
    const logEntry = sortedAsc[injectionNum - 1];
    if (!logEntry) return;
    setEditDateValue(logEntry.log_date?.split('T')[0] || logEntry.log_date);
    setEditWeightValue(logEntry.weight != null ? String(logEntry.weight) : '');
    // Extract dose from dosage field (service_logs) or notes (protocol_logs)
    const logDose = logEntry.dosage || ((logEntry.notes || '').match(/Dose:\s*([^|]+)/)?.[1]?.trim()) || '';
    setEditDoseValue(logDose);
    setEditDateModal({
      logId: logEntry.id,
      injectionNum,
      currentDate: logEntry.log_date,
      source: logEntry.source || 'protocol_logs',
    });
  };

  // Clear/delete an injection log entry
  const handleClearInjection = async () => {
    if (!editDateModal) return;
    if (!confirm(`Are you sure you want to clear Injection #${editDateModal.injectionNum}? This cannot be undone.`)) return;
    setEditDateSaving(true);
    try {
      const res = await fetch(`/api/protocols/${id}/log-injection`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_id: editDateModal.logId,
          source: editDateModal.source || 'protocol_logs',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear injection');
      setSuccess(`Injection #${editDateModal.injectionNum} cleared`);
      setEditDateModal(null);
      fetchProtocol(); // Refresh all data
    } catch (err) {
      setError(err.message);
    } finally {
      setEditDateSaving(false);
    }
  };

  // Toggle delivery method (take home <-> in clinic) for a log entry
  const handleToggleDelivery = async (log) => {
    const currentType = log.log_type;
    const newType = currentType === 'injection' ? 'checkin' : 'injection';
    const newLabel = newType === 'injection' ? 'In Clinic' : 'Take Home';
    try {
      const res = await fetch(`/api/protocols/${id}/log-injection`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_id: log.id,
          log_type: newType,
          source: log.source || 'protocol_logs',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      // Update local state immediately for responsive UI
      setInjectionLogs(prev => prev.map(l => l.id === log.id ? { ...l, log_type: newType } : l));
      setSuccess(`Updated to ${newLabel}`);
    } catch (err) {
      setError(err.message);
    }
  };

  // Log a session for session-based protocols (HBOT, RLT, IV, etc.)
  const handleLogSession = async () => {
    if (!sessionModal) return;
    setSessionSaving(true);
    try {
      const res = await fetch(`/api/protocols/${id}/log-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_type: 'session',
          log_date: sessionDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log session');
      setSuccess(`Session #${sessionModal.sessionNum} logged for ${new Date(sessionDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
      setSessionModal(null);
      setSessionDate(new Date().toISOString().split('T')[0]);
      fetchProtocol();
    } catch (err) {
      setError(err.message);
    } finally {
      setSessionSaving(false);
    }
  };

  const buildCheckinSchedule = async (p, duration, protocolId) => {
    if (!p.start_date) return;
    const parts = p.start_date.split('-');
    const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const today = getPacificToday();

    // Fetch existing check-in logs
    let checkinLogs = [];
    try {
      const logsRes = await fetch(`/api/admin/protocols/${protocolId}`);
      const logsData = await logsRes.json();
      // Also check protocol_logs via the /api/protocols endpoint
      const logsRes2 = await fetch(`/api/protocols/${protocolId}`);
      const logsData2 = await logsRes2.json();
      // Include both activityLogs AND weightCheckins — patient check-ins with weight
      // get routed to weightCheckins by the API, so we need both sources
      const allLogs = [
        ...(logsData2.activityLogs || []),
        ...(logsData2.weightCheckins || [])
      ];
      checkinLogs = allLogs.filter(l => l.log_type === 'peptide_checkin' || l.log_type === 'checkin');
    } catch (e) { /* ignore */ }

    const checkins = [];
    const intervalDays = 7;

    for (let day = intervalDays; day <= duration; day += intervalDays) {
      const checkinDate = new Date(start);
      checkinDate.setDate(start.getDate() + day);
      checkinDate.setHours(0, 0, 0, 0);

      const isPast = checkinDate < today;
      const isToday = checkinDate.getTime() === today.getTime();

      // Find matching check-in log within ±3 days of expected date
      const checkinDateStr = checkinDate.toISOString().split('T')[0];
      const matchedLog = checkinLogs.find(log => {
        if (!log.log_date) return false;
        const logDate = new Date(log.log_date);
        logDate.setHours(0, 0, 0, 0);
        const diff = Math.abs(logDate - checkinDate) / (1000 * 60 * 60 * 24);
        return diff <= 3;
      });

      // Parse check-in data from notes
      let checkinData = null;
      if (matchedLog && matchedLog.notes) {
        const notes = matchedLog.notes;
        const feelingMatch = notes.match(/Feeling:\s*([^|]+)/);
        const adherenceMatch = notes.match(/Adherence:\s*(\w+)/);
        const sideEffectsMatch = notes.match(/Side effects:\s*([^|]+)/);
        const patientNotesMatch = notes.match(/Notes:\s*(.+)$/);

        checkinData = {
          date: matchedLog.log_date,
          feeling: feelingMatch ? feelingMatch[1].trim() : null,
          adherence: adherenceMatch ? adherenceMatch[1].trim() : null,
          sideEffects: sideEffectsMatch ? sideEffectsMatch[1].trim() : null,
          patientNotes: patientNotesMatch ? patientNotesMatch[1].trim() : null
        };
      }

      const weekNum = day / 7;
      const injectionNum = weekNum + 1;
      checkins.push({
        label: `Week ${weekNum} Check-in`,
        sublabel: `Injection #${injectionNum}`,
        date: checkinDateStr,
        dayNumber: day,
        status: matchedLog ? 'completed' : isToday ? 'today' : isPast ? 'overdue' : 'upcoming',
        checkinData
      });
    }
    setCheckinSchedule(checkins);
  };

  const selectedType = PROTOCOL_TYPES[form.protocolType];
  const isFormSessionBased = !!selectedType?.sessions;
  const isInjectionBased = !!selectedType?.injections;

  const handleTypeChange = (type) => {
    const typeConfig = PROTOCOL_TYPES[type];
    setForm(prev => ({
      ...prev,
      protocolType: type,
      frequency: typeConfig?.frequencies?.[0]?.value || 'daily',
      deliveryMethod: typeConfig?.deliveryMethods?.[0]?.value ||
        ((typeConfig?.sessions || typeConfig?.injections) ? 'in_clinic' : prev.deliveryMethod)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Calculate end date using effective days (twice daily = half the calendar days)
      const effectiveDays = getEffectiveDays(parseInt(form.duration), form.frequency);
      let endDate = null;
      if (form.startDate && effectiveDays) {
        const start = new Date(form.startDate);
        start.setDate(start.getDate() + effectiveDays - 1);
        endDate = start.toISOString().split('T')[0];
      }

      // For weight loss, don't overwrite total_sessions with calendar days
      // total_sessions = injection count for weight loss, duration_days for others
      const isWL = (protocol?.program_type || '').toLowerCase().includes('weight_loss');
      const saveData = {
        patient_name: form.patientName,
        patient_phone: form.patientPhone,
        patient_email: form.patientEmail,
        program_type: getDBProgramType(form.protocolType, form.duration),
        medication: form.medication,
        selected_dose: form.dosage,
        frequency: form.frequency,
        delivery_method: form.deliveryMethod,
        start_date: form.startDate,
        end_date: endDate,
        status: form.status,
        notes: form.notes
      };

      // HRT-specific fields — scheduled_days is the source of truth for HRT scheduling
      if (isHRTProtocol(form.protocolType)) {
        saveData.secondary_medications = form.secondaryMedications && form.secondaryMedications.length > 0 ? JSON.stringify(form.secondaryMedications) : '[]';
        if (form.injectionMethod) saveData.injection_method = form.injectionMethod;
        if (form.supplyType) saveData.supply_type = form.supplyType;
        if (form.scheduledDays && form.scheduledDays.length > 0) {
          saveData.scheduled_days = form.scheduledDays;
          // Auto-derive frequency and injections_per_week from scheduled_days (single source of truth)
          const numDays = form.scheduledDays.length;
          if (numDays === 7) saveData.frequency = 'Daily';
          else if (numDays === 3) saveData.frequency = '3x per week';
          else if (numDays === 1) saveData.frequency = 'Weekly';
          else saveData.frequency = '2x per week';
          saveData.injections_per_week = numDays;
          // Auto-derive hrt_reminder_schedule from scheduled_days
          const days = form.scheduledDays.map(d => d.toLowerCase());
          if (numDays === 7) {
            saveData.hrt_reminder_schedule = 'daily';
          } else if (days.includes('monday') && days.includes('thursday') && numDays === 2) {
            saveData.hrt_reminder_schedule = 'mon_thu';
          } else if (days.includes('tuesday') && days.includes('friday') && numDays === 2) {
            saveData.hrt_reminder_schedule = 'tue_fri';
          }
        }
        // Auto-derive dose_per_injection from dosage (e.g., "0.4ml/80mg" → 0.4)
        if (form.dosage) {
          const mlMatch = form.dosage.match(/^(\d+\.?\d*)ml/i);
          if (mlMatch) saveData.dose_per_injection = parseFloat(mlMatch[1]);
        }
      }

      // Only set total_sessions for non-weight-loss protocols
      if (!isWL) {
        saveData.total_sessions = parseInt(form.duration);
      }

      const res = await fetch(`/api/admin/protocols/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...saveData
        })
      });

      if (!res.ok) throw new Error('Failed to save');
      setSuccess('Protocol updated');
      setIsEditing(false);
      fetchProtocol();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSessions = async () => {
    const count = parseInt(addSessionsCount);
    if (!count || count < 1) return;
    setAddSessionsSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/protocols/${id}/add-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionsToAdd: count, mode: 'add', notes: addSessionsNotes || undefined })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add sessions');
      }
      setSuccess(`Added ${count} session${count !== 1 ? 's' : ''} to protocol`);
      setAddSessionsModal(false);
      setAddSessionsCount('');
      setAddSessionsNotes('');
      fetchProtocol();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddSessionsSaving(false);
    }
  };

  // Find encounter note matching an injection log date (within ±1 day)
  const findEncounterNoteForDate = (logDate) => {
    if (!logDate || encounterNotes.length === 0) return null;
    const target = new Date(logDate.length === 10 ? logDate + 'T12:00:00' : logDate);
    for (const note of encounterNotes) {
      if (!note.note_date) continue;
      const noteDate = new Date(note.note_date);
      const diffDays = Math.abs((target - noteDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) return note;
    }
    return null;
  };

  // Clinical notes handlers
  const handleSaveClinicalNote = async () => {
    if (!clinicalNoteInput.trim()) return;
    setClinicalNoteSaving(true);
    try {
      const res = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: protocol.patient_id,
          raw_input: clinicalNoteInput,
          body: clinicalNoteInput,
          created_by: 'Staff',
          protocol_id: id,
          protocol_name: protocol.program_name || 'Protocol',
        }),
      });
      const data = await res.json();
      if (data.note) {
        setClinicalNotes(prev => [data.note, ...prev]);
        setShowAddClinicalNote(false);
        setClinicalNoteInput('');
      }
    } catch (error) {
      console.error('Save clinical note error:', error);
    } finally {
      setClinicalNoteSaving(false);
    }
  };

  const handleFormatClinicalNote = async () => {
    if (!clinicalNoteInput.trim()) return;
    setClinicalNoteFormatting(true);
    try {
      const res = await fetch('/api/notes/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: clinicalNoteInput }),
      });
      const data = await res.json();
      if (data.formatted) {
        setClinicalNoteInput(data.formatted);
      }
    } catch (error) {
      console.error('Format note error:', error);
    } finally {
      setClinicalNoteFormatting(false);
    }
  };

  const handleDeleteClinicalNote = async (noteId) => {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesting_user: session?.user?.email || 'Staff' }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setClinicalNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Delete clinical note error:', error);
    }
  };

  // Calculations
  const programType = protocol?.program_type || '';
  const programName = (protocol?.program_name || '').toLowerCase();

  // HRT protocols — ongoing membership, not finite
  const isOngoing = isHRTProtocol(programType) ||
    programName.includes('hrt') || programName.includes('testosterone');

  // Injection protocols: single injections & injection packs
  const isInjectionProtocol = !isOngoing && (programType.includes('injection') || programName.includes('injection'));

  // Weight loss protocols: track weekly injections using sessions_used
  const isWeightLoss = !isOngoing && (programType.includes('weight_loss') ||
                       ['semaglutide', 'tirzepatide', 'retatrutide'].some(m => programName.includes(m)));

  // Session-based protocols (HBOT, Red Light, IV Therapy, Injection Packs)
  const isSessionBased = !isOngoing && ['hbot', 'hbot_sessions', 'red_light', 'red_light_sessions', 'rlt',
                          'iv_therapy', 'iv', 'iv_sessions', 'injection_pack'].includes(programType);

  // For session-based: track sessions_completed vs total_sessions
  const totalSessions = protocol?.total_sessions || 0;
  const sessionsCompleted = protocol?.sessions_completed || protocol?.sessions_used || 0;
  const sessionsRemaining = totalSessions - sessionsCompleted;

  // Weight loss: derive count from actual injection logs, not the DB counter
  // The DB counter (sessions_used) drifts when entries are created via encounter notes,
  // backfills, or manual edits. injectionLogs is the real source of truth.
  const wlTotalInjections = protocol?.total_sessions || 4;
  const wlSessionsUsed = isWeightLoss && injectionLogs.length > 0
    ? injectionLogs.filter(l => l.log_type !== 'missed').length
    : (protocol?.sessions_used || 0);
  const wlInjectionsRemaining = wlTotalInjections - wlSessionsUsed;

  // HRT ongoing calculations
  const hrtWeeksOnProtocol = isOngoing && protocol?.start_date
    ? Math.max(0, Math.floor((getPacificToday() - new Date(protocol.start_date)) / (1000 * 60 * 60 * 24 * 7)))
    : 0;
  const hrtMonthsOnProtocol = isOngoing && protocol?.start_date
    ? Math.max(0, Math.floor((getPacificToday() - new Date(protocol.start_date)) / (1000 * 60 * 60 * 24 * 30.44)))
    : 0;

  // For injection protocols: total = total_sessions (injection count)
  // For day protocols: total = duration_days (adjusted for frequency)
  const rawDuration = protocol?.duration_days || protocol?.total_sessions || 10;
  const protocolFrequency = protocol?.dose_frequency || 'daily';
  const effectiveCalendarDays = getEffectiveDays(rawDuration, protocolFrequency);
  const totalUnits = isSessionBased ? (protocol?.total_sessions || rawDuration) : effectiveCalendarDays;
  const totalDays = effectiveCalendarDays;
  const currentDay = calculateCurrentDay(protocol?.start_date);

  // Calculate current injection based on frequency (for injection packs, not weight loss)
  const getFrequencyPerWeek = (freq) => {
    if (!freq) return 1;
    const match = freq.match(/(\d+)x/);
    if (match) return parseInt(match[1]);
    if (freq === 'daily') return 7;
    if (freq === '2x_daily') return 14;
    if (freq === 'weekly') return 1;
    if (freq === '2x_weekly') return 2;
    return 1;
  };

  const frequencyPerWeek = getFrequencyPerWeek(protocol?.dose_frequency);
  const currentInjection = isInjectionProtocol
    ? Math.min(Math.ceil(currentDay * frequencyPerWeek / 7), totalUnits)
    : currentDay;

  const isActive = protocol?.status === 'active';
  const isExchanged = protocol?.status === 'exchanged';
  const isComplete = isExchanged ? true : isOngoing ? false : (isWeightLoss
    ? wlInjectionsRemaining <= 0
    : isSessionBased
      ? sessionsRemaining <= 0
      : (isInjectionProtocol
          ? currentInjection >= totalUnits
          : currentDay > totalDays));

  if (loading) {
    return <div style={styles.loadingContainer}><div style={styles.loading}>Loading...</div></div>;
  }

  return (
    <AdminLayout title={`${protocol?.patient_name || 'Protocol'} — ${protocol?.program_name || 'Detail'}`} hideHeader>
      <div style={{ ...styles.container, minHeight: 'auto' }}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <Link href="/admin/protocols" style={styles.backLink}>← Protocols</Link>
            <h1 style={styles.title}>{protocol?.patient_name || 'Patient'}</h1>
            <p style={styles.subtitle}>
              {protocol?.program_name || PROTOCOL_TYPES[form.protocolType]?.name}
              {isExchanged && <span style={{ marginLeft: 8, padding: '2px 8px', background: '#fbbf24', color: '#78350f', borderRadius: 0, fontSize: 11, fontWeight: 700 }}>EXCHANGED</span>}
            </p>
          </div>
          <div style={styles.headerActions}>
            {protocol?.patient_id && (
              <Link href={`/admin/patients/${protocol.patient_id}`} style={styles.headerBtn}>
                Patient Profile
              </Link>
            )}
            {!isEditing ? (
              <>
                <button onClick={() => setAddSessionsModal(true)} style={styles.headerBtn}>+ Add Sessions</button>
                <button onClick={() => setIsEditing(true)} style={styles.editBtn}>Edit</button>
              </>
            ) : (
              <>
                <button onClick={() => { setIsEditing(false); fetchProtocol(); }} style={styles.headerBtn}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </header>

        {error && <div style={styles.errorAlert}>{error}</div>}
        {success && <div style={styles.successAlert}>{success}</div>}

        <div style={styles.content}>
          {/* Left: Main Content */}
          <div style={styles.mainCol}>
            {/* BIG DAY/SESSION DISPLAY */}
            {!isEditing && !isOngoing && (
              <div style={styles.dayCard}>
                <div style={styles.dayLabel}>
                  {isWeightLoss ? 'CURRENT INJECTION' : isSessionBased ? 'SESSIONS USED' : (isInjectionProtocol ? 'CURRENT INJECTION' : 'CURRENT DAY')}
                </div>
                <div style={styles.dayDisplay}>
                  <span style={styles.currentDay}>
                    {isComplete ? '✓' : (
                      isWeightLoss ? (wlSessionsUsed > 0 ? wlSessionsUsed : '—') :
                      isSessionBased ? sessionsCompleted : (
                        isInjectionProtocol ? (currentInjection > 0 ? currentInjection : '—') : (currentDay > 0 ? currentDay : '—')
                      )
                    )}
                  </span>
                  <span style={styles.dayDivider}>/</span>
                  <span style={styles.totalDays}>{isWeightLoss ? wlTotalInjections : isSessionBased ? totalSessions : totalUnits}</span>
                </div>
                <div style={styles.dayStatus}>
                  {isComplete ? (
                    <span style={{ ...styles.completeText, color: isExchanged ? '#f59e0b' : '#22c55e' }}>
                      {isExchanged ? '🔄 Exchanged' : isWeightLoss ? 'All Injections Complete' : isSessionBased ? 'All Sessions Used' : 'Protocol Complete'}
                    </span>
                  ) : isWeightLoss ? (
                    <span style={styles.activeText}>
                      {wlInjectionsRemaining} injection{wlInjectionsRemaining !== 1 ? 's' : ''} remaining
                    </span>
                  ) : isSessionBased ? (
                    <span style={styles.activeText}>
                      {sessionsRemaining} session{sessionsRemaining !== 1 ? 's' : ''} remaining
                    </span>
                  ) : currentDay < 1 ? (
                    <span style={styles.notStartedText}>Not Started Yet</span>
                  ) : (
                    <span style={styles.activeText}>
                      {isInjectionProtocol
                        ? `${totalUnits - currentInjection} injections remaining`
                        : `${totalDays - currentDay} days remaining`
                      }
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                <div style={{ marginTop: '16px' }}>
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: 0,
                    fontSize: '13px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    background: isActive ? '#dcfce7' : '#f3f4f6',
                    color: isActive ? '#166534' : '#666'
                  }}>
                    {protocol?.status}
                  </span>
                </div>
              </div>
            )}

            {/* HRT / ONGOING MEMBERSHIP DISPLAY */}
            {!isEditing && isOngoing && (
              <div style={styles.dayCard}>
                <div style={styles.dayLabel}>ONGOING MEMBERSHIP</div>
                <div style={styles.dayDisplay}>
                  <span style={{ fontSize: '48px', fontWeight: '700', color: '#000' }}>
                    {hrtMonthsOnProtocol}
                  </span>
                  <span style={{ fontSize: '20px', color: '#999', marginLeft: '8px', alignSelf: 'flex-end', paddingBottom: '8px' }}>
                    {hrtMonthsOnProtocol === 1 ? 'month' : 'months'}
                  </span>
                </div>
                <div style={styles.dayStatus}>
                  <span style={styles.activeText}>
                    {protocol?.medication || 'HRT Protocol'} · {
                      protocol?.frequency === '2x_weekly' ? '2x per week' :
                      protocol?.frequency === 'weekly' ? 'Weekly' :
                      protocol?.frequency || '2x per week'
                    }
                  </span>
                </div>
                {protocol?.selected_dose && (
                  <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                    Dose: {protocol.selected_dose}
                  </div>
                )}
                <div style={{ marginTop: '4px', fontSize: '13px', color: '#999' }}>
                  Started {protocol?.start_date ? new Date(protocol.start_date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  }) : 'N/A'}
                </div>

                {/* Delivery Method Badge */}
                {protocol?.delivery_method && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: '#f0f9ff',
                    borderRadius: 0,
                    border: '1px solid #bae6fd',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>
                      {protocol.delivery_method === 'vial' ? '🧪' : '💉'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
                      {getDeliveryLabel(protocol.delivery_method, form.protocolType)}
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                <div style={{ marginTop: '16px' }}>
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: 0,
                    fontSize: '13px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    background: isActive ? '#dcfce7' : '#f3f4f6',
                    color: isActive ? '#166534' : '#666'
                  }}>
                    {protocol?.status}
                  </span>
                </div>

                {/* Secondary Medications Supply Tracking (HRT only) */}
                {isOngoing && isHRTProtocol(programType) && (() => {
                  const secDetails = protocol?.secondary_medication_details
                    ? (typeof protocol.secondary_medication_details === 'string'
                      ? JSON.parse(protocol.secondary_medication_details)
                      : protocol.secondary_medication_details)
                    : [];
                  const secMeds = form.secondaryMedications || [];
                  if (secMeds.length === 0 && secDetails.length === 0) return null;

                  return (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '8px' }}>
                        Secondary Medications
                      </div>
                      {secMeds.map(med => {
                        const detail = secDetails.find(d => d.medication === med);
                        const today = new Date(); today.setHours(0,0,0,0);
                        let daysUntil = null;
                        let isOverdue = false;
                        let isDueSoon = false;
                        if (detail?.next_expected_date) {
                          const next = new Date(detail.next_expected_date + 'T00:00:00');
                          daysUntil = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
                          isOverdue = daysUntil < 0;
                          isDueSoon = !isOverdue && daysUntil <= 7;
                        }
                        return (
                          <div key={med} style={{
                            padding: '12px 14px', marginBottom: '8px',
                            background: isOverdue ? '#fef2f2' : '#faf5ff',
                            border: `1px solid ${isOverdue ? '#fecaca' : '#e9d5ff'}`,
                            borderRadius: 0,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: detail ? '6px' : 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px' }}>💊</span>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#7c3aed' }}>{med}</span>
                                {detail?.num_vials && (
                                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                    {detail.num_vials} vial{detail.num_vials > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setSecMedPickupModal({ medication: med, detail });
                                  setSecMedPickupForm({
                                    date: new Date().toISOString().split('T')[0],
                                    num_vials: detail?.num_vials || 1,
                                    dosage: detail?.dosage || '',
                                    frequency: detail?.frequency || '',
                                  });
                                }}
                                style={{
                                  padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                                  background: '#7c3aed', color: '#fff', border: 'none',
                                  borderRadius: 0, cursor: 'pointer',
                                }}
                              >
                                Log Pickup
                              </button>
                            </div>
                            {detail ? (
                              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
                                <span style={{ color: '#6b7280' }}>
                                  Last pickup: <strong style={{ color: '#111' }}>
                                    {new Date(detail.last_refill_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </strong>
                                </span>
                                {detail.next_expected_date && (
                                  <span style={{ color: '#6b7280' }}>
                                    Next refill: <strong style={{ color: isOverdue ? '#dc2626' : isDueSoon ? '#f59e0b' : '#111' }}>
                                      {new Date(detail.next_expected_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      {isOverdue && ` (${Math.abs(daysUntil)}d overdue)`}
                                      {isDueSoon && ` (in ${daysUntil}d)`}
                                    </strong>
                                  </span>
                                )}
                                {detail.dosage && (
                                  <span style={{ color: '#6b7280' }}>{detail.dosage}{detail.frequency ? ` · ${detail.frequency}` : ''}</span>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                                No supply tracked yet — log a pickup to start tracking
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Session Grid for HBOT/RLT/IV */}
            {!isEditing && isSessionBased && totalSessions > 0 && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Session Tracker</h2>
                <div style={styles.calendarGrid}>
                  {Array.from({ length: totalSessions }, (_, i) => {
                    const num = i + 1;
                    const isUsed = num <= sessionsCompleted;
                    const isNext = num === sessionsCompleted + 1;
                    const isClickable = !isUsed && sessionsCompleted < totalSessions;

                    return (
                      <div
                        key={num}
                        onClick={isClickable ? () => { setSessionModal({ sessionNum: sessionsCompleted + 1 }); setSessionDate(new Date().toISOString().split('T')[0]); } : undefined}
                        style={{
                          ...styles.calendarDay,
                          background: isUsed ? '#22c55e' : isNext ? '#000' : '#fff',
                          color: isUsed || isNext ? '#fff' : '#000',
                          borderColor: isUsed ? '#22c55e' : isNext ? '#000' : '#e5e5e5',
                          opacity: !isUsed && !isNext ? 0.5 : 1,
                          cursor: isClickable ? 'pointer' : 'default',
                          transition: 'transform 0.1s',
                        }}
                        onMouseEnter={isClickable ? (e) => { e.currentTarget.style.transform = 'scale(1.08)'; } : undefined}
                        onMouseLeave={isClickable ? (e) => { e.currentTarget.style.transform = 'scale(1)'; } : undefined}
                      >
                        <div style={styles.dayNumber}>{num}</div>
                        {isUsed && <div style={styles.checkmark}>✓</div>}
                        {isNext && <div style={styles.todayLabel}>NEXT</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={styles.legend}>
                  <span><span style={styles.legendDot} /> Used</span>
                  <span><span style={{ ...styles.legendDot, background: '#000' }} /> Next</span>
                  <span><span style={{ ...styles.legendDot, background: '#e5e5e5' }} /> Available</span>
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', textAlign: 'center' }}>Click a session to log it</p>
              </div>
            )}

            {/* Log Session Modal */}
            {sessionModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
              }} onClick={() => setSessionModal(null)}>
                <div style={{
                  background: '#fff', borderRadius: 0, padding: '28px', width: '360px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                }} onClick={e => e.stopPropagation()}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Log Session #{sessionModal.sessionNum}</h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>{protocol?.program_name}</p>

                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Session Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 0,
                      border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '20px',
                      boxSizing: 'border-box'
                    }}
                  />

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setSessionModal(null)}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 0, border: '1px solid #d1d5db',
                        background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500
                      }}
                    >Cancel</button>
                    <button
                      onClick={handleLogSession}
                      disabled={sessionSaving}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 0, border: 'none',
                        background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600
                      }}
                    >{sessionSaving ? 'Logging...' : '✓ Log Session'}</button>
                  </div>
                </div>
              </div>
            )}

            {/* Injection Calendar for Weight Loss (weekly intervals, sessions_used as truth) */}
            {!isEditing && isWeightLoss && (() => {
              // Sort logs ascending to map injection #1 = oldest, #2 = next, etc.
              const sortedLogsAsc = [...injectionLogs].sort((a, b) => new Date(a.log_date) - new Date(b.log_date));

              // Parse a log date safely
              const parseLogDate = (d) => {
                if (!d) return null;
                return d.length === 10 ? new Date(d + 'T12:00:00') : new Date(d);
              };

              // Get the last actual injection date for computing future dates
              const lastLog = sortedLogsAsc.length > 0 ? sortedLogsAsc[sortedLogsAsc.length - 1] : null;
              const lastActualDate = lastLog ? parseLogDate(lastLog.log_date) : null;

              // Fallback: compute from start_date if no logs exist
              const getStartBasedDate = (injNum) => {
                if (!protocol?.start_date) return null;
                const parts = protocol.start_date.split('-');
                const startD = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                const injDay = protocol.injection_day;
                if (injDay) {
                  const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
                  const targetDay = dayMap[injDay];
                  if (targetDay !== undefined) {
                    const currentDay = startD.getDay();
                    const daysUntil = (targetDay - currentDay + 7) % 7;
                    const firstInjDate = new Date(startD);
                    firstInjDate.setDate(firstInjDate.getDate() + daysUntil);
                    firstInjDate.setDate(firstInjDate.getDate() + (injNum - 1) * 7);
                    return firstInjDate;
                  }
                }
                const d = new Date(startD);
                d.setDate(d.getDate() + (injNum - 1) * 7);
                return d;
              };

              // For future/next dates: compute from last actual injection + 7 days per step
              const getFutureDate = (stepsFromLast) => {
                if (lastActualDate) {
                  const d = new Date(lastActualDate);
                  d.setDate(d.getDate() + stepsFromLast * 7);
                  return d;
                }
                // No logs yet — fall back to start-based
                return getStartBasedDate(wlSessionsUsed + stepsFromLast);
              };

              const nextInjDate = getFutureDate(1);

              return (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Injection Calendar</h2>
                <div style={styles.calendarGrid}>
                  {Array.from({ length: wlTotalInjections }, (_, i) => {
                    const num = i + 1;
                    const isCompleted = num <= wlSessionsUsed;
                    const isNext = num === wlSessionsUsed + 1;
                    const isFuture = num > wlSessionsUsed + 1;

                    // For completed injections, use actual log date and weight
                    const logEntry = isCompleted ? sortedLogsAsc[num - 1] : null;
                    const actualDate = logEntry ? parseLogDate(logEntry.log_date) : null;
                    const logWeight = logEntry?.weight;
                    const isMissed = logEntry?.log_type === 'missed' || (logEntry?.notes || '').includes('MISSED WEEK');
                    // Extract dose from log entry — from dosage field (service_logs) or notes (protocol_logs)
                    const logDose = (() => {
                      if (!logEntry) return null;
                      if (logEntry.dosage) return logEntry.dosage;
                      const m = (logEntry.notes || '').match(/Dose:\s*([^|]+)/);
                      return m ? m[1].trim() : null;
                    })();

                    // Compute display date
                    let displayDate;
                    if (isCompleted && actualDate) {
                      displayDate = actualDate;
                    } else if (isNext || isFuture) {
                      // Steps from last completed injection
                      displayDate = getFutureDate(num - wlSessionsUsed);
                    } else {
                      displayDate = getStartBasedDate(num);
                    }

                    return (
                      <div
                        key={num}
                        onClick={() => isCompleted ? handleEditInjection(num) : (isFuture ? null : handleCalendarDayClick(wlSessionsUsed + 1, nextInjDate))}
                        style={{
                          ...styles.calendarDay,
                          background: isCompleted ? (isMissed ? '#f59e0b' : '#22c55e') : isNext ? '#000' : '#fff',
                          color: isCompleted || isNext ? '#fff' : '#000',
                          borderColor: isCompleted ? (isMissed ? '#f59e0b' : '#22c55e') : isNext ? '#000' : '#e5e5e5',
                          opacity: isFuture ? 0.5 : 1,
                          cursor: isFuture ? 'default' : 'pointer',
                        }}
                      >
                        <div style={styles.dayNumber}>{num}</div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          opacity: isCompleted || isNext ? 0.9 : 0.6,
                          marginTop: '2px',
                          letterSpacing: '-0.2px'
                        }}>
                          {displayDate ? formatShortDate(displayDate) : ''}
                        </div>
                        {isCompleted && isMissed && (
                          <div style={{ fontSize: '10px', fontWeight: '600', opacity: 0.9, marginTop: '2px' }}>✕ no check-in</div>
                        )}
                        {isCompleted && !isMissed && logWeight && (
                          <div style={{ fontSize: '11px', fontWeight: '600', opacity: 0.9, marginTop: '2px' }}>
                            {logWeight} lbs
                          </div>
                        )}
                        {isCompleted && !isMissed && !logWeight && <div style={styles.checkmark}>✓</div>}
                        {isCompleted && !isMissed && logDose && (
                          <div style={{ fontSize: '10px', fontWeight: '500', opacity: 0.85, marginTop: '2px' }}>
                            {logDose}
                          </div>
                        )}
                        {isNext && <div style={styles.todayLabel}>NEXT</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={styles.legend}>
                  <span><span style={styles.legendDot} /> Complete</span>
                  <span><span style={{ ...styles.legendDot, background: '#f59e0b' }} /> No Check-in</span>
                  <span><span style={{ ...styles.legendDot, background: '#000' }} /> Next</span>
                  <span><span style={{ ...styles.legendDot, background: '#e5e5e5' }} /> Upcoming</span>
                </div>
                {/* Quick actions for next injection */}
                {wlSessionsUsed < wlTotalInjections && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e5e5' }}>
                    <button
                      onClick={() => handleQuickComplete(nextInjDate)}
                      disabled={logSaving}
                      style={{
                        flex: 1, padding: '10px 16px', background: '#22c55e', color: '#fff',
                        border: 'none', borderRadius: 0, fontSize: '14px', fontWeight: '600',
                        cursor: logSaving ? 'not-allowed' : 'pointer', opacity: logSaving ? 0.6 : 1,
                      }}
                    >
                      {logSaving ? 'Saving...' : `✓ Mark Injection #${wlSessionsUsed + 1} Complete`}
                    </button>
                    <button
                      onClick={() => handleQuickMissed(nextInjDate)}
                      disabled={logSaving}
                      style={{
                        padding: '10px 16px', background: '#fff', color: '#f59e0b',
                        border: '1px solid #f59e0b', borderRadius: 0, fontSize: '14px', fontWeight: '600',
                        cursor: logSaving ? 'not-allowed' : 'pointer', opacity: logSaving ? 0.6 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ✕ Missed Check-in
                    </button>
                    <button
                      onClick={() => handleCalendarDayClick(wlSessionsUsed + 1, nextInjDate)}
                      style={{
                        padding: '10px 16px', background: '#fff', color: '#374151',
                        border: '1px solid #d1d5db', borderRadius: 0, fontSize: '14px', fontWeight: '600',
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      Log Details
                    </button>
                  </div>
                )}
              </div>
              );
            })()}

            {/* Weight Progress Card (weight loss only) */}
            {!isEditing && isWeightLoss && weightProgress && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>⚖️ Weight Progress</h2>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: '8px 0' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Starting</div>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>{weightProgress.startingWeight}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>lbs</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '24px', color: '#d1d5db' }}>→</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Current</div>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>{weightProgress.currentWeight}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>lbs</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '24px', color: '#d1d5db' }}>=</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Change</div>
                    <div style={{
                      fontSize: '24px', fontWeight: '700',
                      color: weightProgress.isLoss ? '#22c55e' : weightProgress.change === '0.0' ? '#6b7280' : '#ef4444'
                    }}>
                      {weightProgress.isLoss ? '↓' : weightProgress.change === '0.0' ? '' : '↑'} {Math.abs(parseFloat(weightProgress.change))}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>lbs ({weightProgress.changePercent}%)</div>
                  </div>
                  {weightProgress.goalWeight && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '24px', color: '#d1d5db' }}>→</div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Goal</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{weightProgress.goalWeight}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {parseFloat(weightProgress.currentWeight) > weightProgress.goalWeight
                            ? `${(parseFloat(weightProgress.currentWeight) - weightProgress.goalWeight).toFixed(1)} to go`
                            : 'reached!'
                          }
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Injection Log (weight loss only) */}
            {!isEditing && isWeightLoss && injectionLogs.length > 0 && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>💉 Injection Log</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {injectionLogs.map((log, idx) => {
                    const isLast = idx === injectionLogs.length - 1;
                    const isMissedLog = log.log_type === 'missed' || (log.notes || '').includes('MISSED WEEK');
                    // Parse date timezone-safe
                    const rawDate = log.log_date;
                    const logDate = rawDate && rawDate.length === 10
                      ? new Date(rawDate + 'T12:00:00')
                      : new Date(rawDate);
                    const dateStr = logDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                    // Parse notes for structured data
                    const notes = log.notes || '';
                    const doseMatch = notes.match(/Dose:\s*([^|]+)/);
                    const sideEffectsMatch = notes.match(/Side effects:\s*([^|]+)/);
                    const dose = log.dosage || (doseMatch ? doseMatch[1].trim() : null);
                    const sideEffects = sideEffectsMatch ? sideEffectsMatch[1].trim() : null;
                    // Remaining notes after structured fields
                    let freeNotes = notes
                      .replace(/MISSED WEEK\s*\|?\s*/g, '')
                      .replace(/Dose:\s*[^|]+\|?\s*/g, '')
                      .replace(/Side effects:\s*[^|]+\|?\s*/g, '')
                      .replace(/BP:\s*[^|]+\|?\s*/g, '')
                      .replace(/^Injection #\d+$/, '')
                      .trim();

                    return (
                      <div key={log.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                          <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: isMissedLog ? '#f59e0b' : '#22c55e', border: '2px solid #fff',
                            boxShadow: isMissedLog ? '0 0 0 2px #f59e0b' : '0 0 0 2px #22c55e', flexShrink: 0, marginTop: '4px'
                          }}>
                            <span style={{ color: '#fff', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{isMissedLog ? '✕' : '✓'}</span>
                          </div>
                          {!isLast && (
                            <div style={{ width: '2px', flex: 1, background: '#e5e7eb', minHeight: '40px' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, paddingBottom: isLast ? '0' : '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{dateStr}</span>
                            {isMissedLog && (
                              <span style={{
                                fontSize: '10px', fontWeight: '600', padding: '2px 6px',
                                borderRadius: 0, background: '#fef3c7', color: '#92400e',
                                textTransform: 'uppercase',
                              }}>
                                No Check-in
                              </span>
                            )}
                            {!isMissedLog && log.log_type === 'injection' && (
                              <span
                                onClick={() => handleToggleDelivery(log)}
                                title="Click to change to Take Home"
                                style={{
                                  fontSize: '10px', fontWeight: '600', padding: '2px 6px',
                                  borderRadius: 0, background: '#e0e7ff', color: '#3730a3',
                                  textTransform: 'uppercase', cursor: 'pointer',
                                }}
                              >
                                In Clinic
                              </span>
                            )}
                            {!isMissedLog && log.log_type === 'checkin' && (
                              <span
                                onClick={() => handleToggleDelivery(log)}
                                title="Click to change to In Clinic"
                                style={{
                                  fontSize: '10px', fontWeight: '600', padding: '2px 6px',
                                  borderRadius: 0, background: '#f3f4f6', color: '#6b7280',
                                  textTransform: 'uppercase', cursor: 'pointer',
                                }}
                              >
                                Take Home
                              </span>
                            )}
                            {/* View Encounter Note button */}
                            {(() => {
                              const matchedNote = findEncounterNoteForDate(log.log_date);
                              return matchedNote ? (
                                <span
                                  onClick={(e) => { e.stopPropagation(); setEncounterSlideNote(matchedNote); }}
                                  style={{
                                    fontSize: '10px', fontWeight: '600', padding: '2px 6px',
                                    borderRadius: 0, background: '#f0fdf4', color: '#16a34a',
                                    cursor: 'pointer', marginLeft: 'auto',
                                  }}
                                >
                                  View Note
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: '#6b7280' }}>
                            {dose && <span>💊 {dose}</span>}
                            {log.weight && <span>⚖️ {log.weight} lbs</span>}
                            {(() => {
                              const bpMatch = (notes || '').match(/BP:\s*([^|]+)/);
                              return bpMatch ? <span>🩺 {bpMatch[1].trim()}</span> : null;
                            })()}
                            {sideEffects && sideEffects !== 'None' && (
                              <span style={{ color: '#dc2626' }}>⚠️ {sideEffects}</span>
                            )}
                          </div>
                          {freeNotes && (
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', fontStyle: 'italic' }}>
                              {freeNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Calendar Grid for Injection/Day protocols (non-weight-loss, non-ongoing) */}
            {!isEditing && !isSessionBased && !isWeightLoss && !isOngoing && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>
                  {isInjectionProtocol ? 'Injection Tracker' : 'Injection Calendar'}
                </h2>
                <div style={styles.calendarGrid}>
                  {Array.from({ length: isInjectionProtocol ? totalUnits : totalDays }, (_, i) => {
                    const num = i + 1;
                    const isPast = isInjectionProtocol
                      ? currentInjection > num
                      : currentDay > num;
                    const isCurrent = isInjectionProtocol
                      ? currentInjection === num
                      : currentDay === num;
                    const isFuture = isInjectionProtocol
                      ? currentInjection < num
                      : currentDay < num;
                    const cellDate = getDateForDay(protocol?.start_date, num);

                    return (
                      <div
                        key={num}
                        style={{
                          ...styles.calendarDay,
                          background: isCurrent ? '#000' : isPast ? '#22c55e' : '#fff',
                          color: isCurrent || isPast ? '#fff' : '#000',
                          borderColor: isCurrent ? '#000' : isPast ? '#22c55e' : '#e5e5e5',
                          opacity: isFuture ? 0.5 : 1
                        }}
                      >
                        <div style={styles.dayNumber}>{num}</div>
                        <div style={{
                          fontSize: '9px',
                          fontWeight: '500',
                          opacity: isPast || isCurrent ? 0.85 : 0.6,
                          marginTop: '1px',
                          letterSpacing: '-0.2px'
                        }}>
                          {cellDate ? formatShortDate(cellDate) : ''}
                        </div>
                        {isPast && <div style={styles.checkmark}>✓</div>}
                        {isCurrent && <div style={styles.todayLabel}>{isInjectionProtocol ? 'NEXT' : 'TODAY'}</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={styles.legend}>
                  <span><span style={styles.legendDot} /> {isInjectionProtocol ? 'Complete' : 'Past'}</span>
                  <span><span style={{ ...styles.legendDot, background: '#000' }} /> {isInjectionProtocol ? 'Next' : 'Today'}</span>
                  <span><span style={{ ...styles.legendDot, background: '#e5e5e5' }} /> {isInjectionProtocol ? 'Upcoming' : 'Future'}</span>
                </div>
              </div>
            )}

            {/* 90-Day Cycle Progress (Peptide protocols only) */}
            {!isEditing && (protocol?.program_type || '').includes('peptide') && (
              <CycleProgressCard protocol={protocol} />
            )}

            {/* Weekly Check-in Schedule (Take-Home protocols) */}
            {!isEditing && checkinSchedule.length > 0 && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>📱 Weekly Check-in Schedule</h2>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#666' }}>
                  Automated text reminders every 7 days
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {checkinSchedule.map((checkin, idx) => {
                    const isLast = idx === checkinSchedule.length - 1;
                    const statusColor = checkin.status === 'completed' ? '#22c55e'
                      : checkin.status === 'overdue' ? '#dc2626'
                      : checkin.status === 'today' ? '#f59e0b' : '#9ca3af';
                    const statusBg = checkin.status === 'completed' ? '#dcfce7'
                      : checkin.status === 'overdue' ? '#fee2e2'
                      : checkin.status === 'today' ? '#fef3c7' : '#f3f4f6';
                    const statusLabel = checkin.status === 'completed' ? '✓ Responded'
                      : checkin.status === 'overdue' ? 'No Response'
                      : checkin.status === 'today' ? 'Today' : 'Scheduled';

                    return (
                      <div key={checkin.dayNumber} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                          <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: statusColor, border: '2px solid #fff',
                            boxShadow: `0 0 0 2px ${statusColor}`, flexShrink: 0, marginTop: '4px'
                          }}>
                            {checkin.status === 'completed' && (
                              <span style={{ color: '#fff', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>✓</span>
                            )}
                          </div>
                          {!isLast && (
                            <div style={{ width: '2px', flex: 1, background: '#e5e7eb', minHeight: checkin.checkinData ? '80px' : '32px' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, paddingBottom: isLast ? '0' : '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{checkin.label}</span>
                            {checkin.sublabel && (
                              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>({checkin.sublabel})</span>
                            )}
                            <span style={{
                              fontSize: '11px', fontWeight: '600', padding: '2px 8px',
                              borderRadius: 0, background: statusBg, color: statusColor,
                              textTransform: 'uppercase'
                            }}>
                              {statusLabel}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            Day {checkin.dayNumber} · {formatDate(checkin.date)}
                          </div>
                          {/* Show check-in response data */}
                          {checkin.checkinData && (
                            <div style={{
                              marginTop: '8px', padding: '10px 12px',
                              background: '#f9fafb', borderRadius: 0,
                              fontSize: '13px', color: '#374151'
                            }}>
                              {checkin.checkinData.feeling && (
                                <div style={{ marginBottom: '4px' }}>
                                  <span style={{ color: '#6b7280' }}>Feeling:</span>{' '}
                                  <span style={{ fontWeight: '500' }}>{checkin.checkinData.feeling}</span>
                                </div>
                              )}
                              {checkin.checkinData.adherence && (
                                <div style={{ marginBottom: '4px' }}>
                                  <span style={{ color: '#6b7280' }}>On Schedule:</span>{' '}
                                  <span style={{ fontWeight: '500' }}>
                                    {checkin.checkinData.adherence === 'Yes' ? '✅ Yes' : '❌ No'}
                                  </span>
                                </div>
                              )}
                              {checkin.checkinData.sideEffects && checkin.checkinData.sideEffects !== 'None' && (
                                <div style={{ marginBottom: '4px' }}>
                                  <span style={{ color: '#6b7280' }}>Side Effects:</span>{' '}
                                  <span style={{ fontWeight: '500', color: '#dc2626' }}>{checkin.checkinData.sideEffects}</span>
                                </div>
                              )}
                              {checkin.checkinData.patientNotes && (
                                <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#6b7280' }}>
                                  &ldquo;{checkin.checkinData.patientNotes}&rdquo;
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Edit Form */}
            {isEditing && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Edit Protocol</h2>
                
                {/* Patient */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Patient</h3>
                  <div style={styles.grid}>
                    <div style={styles.field}>
                      <label style={styles.label}>Name *</label>
                      <input
                        type="text"
                        value={form.patientName}
                        onChange={e => setForm({ ...form, patientName: e.target.value })}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Phone</label>
                      <input
                        type="tel"
                        value={form.patientPhone}
                        onChange={e => setForm({ ...form, patientPhone: e.target.value })}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </div>

                {/* Protocol Type */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Protocol Type</h3>
                  <div style={styles.typeGrid}>
                    {Object.entries(PROTOCOL_TYPES).map(([key, type]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleTypeChange(key)}
                        style={{
                          ...styles.typeBtn,
                          background: form.protocolType === key ? '#000' : '#fff',
                          color: form.protocolType === key ? '#fff' : '#000'
                        }}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Medication */}
                {selectedType?.medications && (
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Medication</h3>
                    <div style={styles.grid}>
                      <div style={styles.field}>
                        <label style={styles.label}>Medication</label>
                        <select value={form.medication} onChange={e => setForm({ ...form, medication: e.target.value })} style={styles.select}>
                          <option value="">Select...</option>
                          {selectedType.medications.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>Dosage</label>
                        {selectedType.hasDosageNotes ? (
                          <input 
                            type="text" 
                            value={form.dosage} 
                            onChange={e => setForm({ ...form, dosage: e.target.value })} 
                            style={styles.input}
                            placeholder="e.g., 100mg, 1ml"
                          />
                        ) : (
                          <select value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} style={styles.select}>
                            <option value="">Select...</option>
                            {selectedType.dosages?.map(d => {
                              const val = typeof d === 'object' ? d.value : d;
                              const lbl = typeof d === 'object' ? d.label : d;
                              return <option key={val} value={val}>{lbl}</option>;
                            })}
                          </select>
                        )}
                      </div>
                      {/* Secondary Medications for HRT */}
                      {isHRTProtocol(form.protocolType) && (
                        <div style={styles.field}>
                          <label style={styles.label}>Secondary Medications</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                            {HRT_SECONDARY_MEDICATIONS.map(m => {
                              const selected = (form.secondaryMedications || []).includes(m);
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    const current = form.secondaryMedications || [];
                                    const updated = selected ? current.filter(x => x !== m) : [...current, m];
                                    setForm({ ...form, secondaryMedications: updated });
                                  }}
                                  style={{ padding: '6px 14px', borderRadius: 0, border: selected ? '2px solid #7C3AED' : '1px solid #D1D5DB', background: selected ? '#F3E8FF' : '#fff', color: selected ? '#7C3AED' : '#374151', fontSize: '13px', fontWeight: selected ? '600' : '400', cursor: 'pointer' }}
                                >
                                  {selected ? '✓ ' : ''}{m}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Schedule */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Schedule</h3>
                  <div style={styles.grid}>
                    {/* Hide frequency for HRT — scheduled_days is the source of truth */}
                    {!isHRTProtocol(form.protocolType) && (
                      <div style={styles.field}>
                        <label style={styles.label}>Frequency</label>
                        <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} style={styles.select}>
                          {selectedType?.frequencies?.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                      </div>
                    )}
                    <div style={styles.field}>
                      <label style={styles.label}>Delivery</label>
                      <select value={form.deliveryMethod} onChange={e => setForm({ ...form, deliveryMethod: e.target.value })} style={styles.select}>
                        {selectedType?.deliveryMethods ? (
                          selectedType.deliveryMethods.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))
                        ) : (
                          <>
                            <option value="take_home">Take Home</option>
                            <option value="in_clinic">In Clinic</option>
                          </>
                        )}
                      </select>
                    </div>
                    {/* HRT Decision Tree Fields */}
                    {isHRTProtocol(form.protocolType) && form.deliveryMethod === 'take_home' && (
                      <div style={styles.field}>
                        <label style={styles.label}>Injection Method</label>
                        <select value={form.injectionMethod} onChange={e => setForm({ ...form, injectionMethod: e.target.value })} style={styles.select}>
                          <option value="">Select method...</option>
                          {INJECTION_METHODS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {isHRTProtocol(form.protocolType) && form.deliveryMethod === 'take_home' && (
                      <div style={styles.field}>
                        <label style={styles.label}>Supply Type</label>
                        <select value={form.supplyType} onChange={e => setForm({ ...form, supplyType: e.target.value })} style={styles.select}>
                          <option value="">Select supply...</option>
                          {HRT_SUPPLY_TYPES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {isHRTProtocol(form.protocolType) && (
                      <div style={styles.field}>
                        <label style={styles.label}>Scheduled Days</label>
                        <select
                          value={Array.isArray(form.scheduledDays) ? form.scheduledDays.join(',') : ''}
                          onChange={e => setForm({ ...form, scheduledDays: e.target.value ? e.target.value.split(',') : [] })}
                          style={styles.select}
                        >
                          <option value="">Select schedule...</option>
                          <option value="monday,thursday">Mon / Thu</option>
                          <option value="tuesday,friday">Tue / Fri</option>
                          <option value="monday,wednesday,friday">Mon / Wed / Fri</option>
                          <option value="monday,tuesday,wednesday,thursday,friday,saturday,sunday">Daily</option>
                        </select>
                      </div>
                    )}
                    <div style={styles.field}>
                      <label style={styles.label}>Start Date</label>
                      <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={styles.input} />
                    </div>
                    {selectedType?.durations ? (
                      <div style={styles.field}>
                        <label style={styles.label}>
                          Duration (doses)
                          {form.frequency === '2x_daily' && form.duration && (
                            <span style={{ color: '#666', fontWeight: '400' }}>
                              {' '}→ {Math.ceil(parseInt(form.duration) / 2)} actual days
                            </span>
                          )}
                        </label>
                        <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} style={styles.select}>
                          {selectedType.durations.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                    ) : selectedType?.injections ? (
                      <div style={styles.field}>
                        <label style={styles.label}>Injections</label>
                        <select value={form.totalSessions} onChange={e => setForm({ ...form, totalSessions: e.target.value })} style={styles.select}>
                          {selectedType.injections.map(s => {
                            const val = typeof s === 'object' ? s.value : s;
                            const lbl = typeof s === 'object' ? s.label : `${s} injection${s > 1 ? 's' : ''}`;
                            return <option key={val} value={val}>{lbl}</option>;
                          })}
                        </select>
                      </div>
                    ) : selectedType?.sessions ? (
                      <div style={styles.field}>
                        <label style={styles.label}>Sessions</label>
                        <select value={form.totalSessions} onChange={e => setForm({ ...form, totalSessions: e.target.value })} style={styles.select}>
                          {selectedType.sessions.map(s => <option key={s} value={s}>{s} session{s > 1 ? 's' : ''}</option>)}
                        </select>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Status */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Status</h3>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={styles.select}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Notes */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Notes</h3>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    style={{ ...styles.input, minHeight: '80px' }}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
            )}

            {/* Protocol Details (View Mode) */}
            {!isEditing && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Protocol Details</h2>
                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Medication</div>
                    <div style={styles.detailValue}>{protocol?.primary_peptide || '—'}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Dosage</div>
                    <div style={styles.detailValue}>{protocol?.dose_amount || '—'}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Frequency</div>
                    <div style={styles.detailValue}>{formatFrequency(protocol?.dose_frequency)}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Delivery</div>
                    <div style={{ display: 'flex', gap: '0', borderRadius: 0, overflow: 'hidden', border: '1px solid #d1d5db' }}>
                      {[
                        { value: 'in_clinic', label: '🏥 In Clinic' },
                        { value: 'take_home', label: '🏠 Take Home' },
                      ].map(opt => {
                        const isActive = (protocol?.delivery_method || 'take_home') === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={async () => {
                              if (isActive) return;
                              try {
                                const res = await fetch(`/api/admin/protocols/${id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ delivery_method: opt.value }),
                                });
                                if (res.ok) {
                                  setProtocol(prev => ({ ...prev, delivery_method: opt.value }));
                                  setForm(prev => ({ ...prev, deliveryMethod: opt.value }));
                                }
                              } catch (e) { console.error('Failed to update delivery:', e); }
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '13px',
                              fontWeight: isActive ? '600' : '400',
                              background: isActive ? '#000' : '#fff',
                              color: isActive ? '#fff' : '#666',
                              border: 'none',
                              cursor: isActive ? 'default' : 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Start Date</div>
                    <div style={styles.detailValue}>{formatDate(protocol?.start_date)}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>End Date</div>
                    <div style={styles.detailValue}>{formatDate(protocol?.end_date)}</div>
                  </div>
                  {protocolFrequency === '2x_daily' && (
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Supply Duration</div>
                      <div style={styles.detailValue}>
                        {rawDuration} doses → {effectiveCalendarDays} days
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {!isEditing && (
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 8px' }}>
                  <h2 style={{ ...styles.cardTitle, padding: 0, margin: 0 }}>Notes ({clinicalNotes.length})</h2>
                  <button
                    onClick={() => setShowAddClinicalNote(true)}
                    style={{
                      padding: '6px 14px', background: '#000', color: '#fff',
                      border: 'none', borderRadius: 0, fontSize: '13px',
                      fontWeight: '500', cursor: 'pointer'
                    }}
                  >
                    + Add Note
                  </button>
                </div>

                {/* Inline Add Note Form */}
                {showAddClinicalNote && (
                  <div style={{ margin: '8px 20px 16px', padding: 14, background: '#f9fafb', borderRadius: 0, border: '1px solid #e5e7eb' }}>
                    <textarea
                      value={clinicalNoteInput}
                      onChange={e => setClinicalNoteInput(e.target.value)}
                      rows={4}
                      placeholder="Type note..."
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, lineHeight: 1.6, fontFamily: 'inherit', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'space-between' }}>
                      <button
                        onClick={handleFormatClinicalNote}
                        disabled={!clinicalNoteInput.trim() || clinicalNoteFormatting}
                        style={{
                          padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db',
                          borderRadius: 0, fontSize: '13px', cursor: 'pointer',
                          opacity: (!clinicalNoteInput.trim() || clinicalNoteFormatting) ? 0.5 : 1
                        }}
                      >
                        {clinicalNoteFormatting ? 'Formatting...' : '✨ Format with AI'}
                      </button>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => { setShowAddClinicalNote(false); setClinicalNoteInput(''); }}
                          style={{ padding: '6px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 0, fontSize: '13px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveClinicalNote}
                          disabled={!clinicalNoteInput.trim() || clinicalNoteSaving}
                          style={{
                            padding: '6px 14px', background: '#000', color: '#fff',
                            border: 'none', borderRadius: 0, fontSize: '13px',
                            fontWeight: '500', cursor: 'pointer',
                            opacity: (!clinicalNoteInput.trim() || clinicalNoteSaving) ? 0.5 : 1
                          }}
                        >
                          {clinicalNoteSaving ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes List */}
                <div style={{ padding: '0 20px 16px' }}>
                  {clinicalNotes.length === 0 && !showAddClinicalNote ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                      No notes yet
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {clinicalNotes.map(note => (
                        <div key={note.id} style={{ padding: '10px 14px', background: '#f9fafb', borderRadius: 0, border: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                              {formatDate(note.note_date || note.created_at)}
                              {note.created_by && <span style={{ fontWeight: 400, marginLeft: 8 }}>by {note.created_by}</span>}
                            </div>
                            {note.status !== 'signed' && canDeleteNote(note) && (
                              <button
                                onClick={() => handleDeleteClinicalNote(note.id)}
                                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
                                title="Delete note"
                              >×</button>
                            )}
                          </div>
                          <div style={{ fontSize: 14, color: '#1f2937', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {note.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Blood Draw Schedule (HRT only) */}
            {!isEditing && labSchedule.length > 0 && (
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 8px' }}>
                  <h2 style={{ ...styles.cardTitle, padding: 0, margin: 0 }}>Blood Draw Schedule</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>1st follow-up:</span>
                    <button
                      onClick={handleToggleFollowupWeeks}
                      style={{
                        fontSize: '12px', fontWeight: 600, padding: '3px 10px',
                        borderRadius: 0, cursor: 'pointer', transition: 'all 0.15s',
                        border: '1px solid #d1d5db', background: '#fff', color: '#374151'
                      }}
                    >
                      {(protocol?.first_followup_weeks || 8)} wks ⇄
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {labSchedule.map((draw, idx) => {
                    const isLast = idx === labSchedule.length - 1;
                    const statusColor = draw.status === 'completed' ? '#22c55e' : draw.status === 'overdue' ? '#dc2626' : '#9ca3af';
                    const statusBg = draw.status === 'completed' ? '#dcfce7' : draw.status === 'overdue' ? '#fee2e2' : '#f3f4f6';
                    return (
                      <div
                        key={draw.label}
                        onClick={() => handleBloodDrawClick(draw)}
                        style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', padding: '4px 6px', borderRadius: 0, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Timeline line + dot */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                          <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: statusColor, border: '2px solid #fff',
                            boxShadow: `0 0 0 2px ${statusColor}`, flexShrink: 0, marginTop: '4px'
                          }}>
                            {draw.status === 'completed' && (
                              <span style={{ color: '#fff', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>✓</span>
                            )}
                          </div>
                          {!isLast && (
                            <div style={{ width: '2px', flex: 1, background: '#e5e7eb', minHeight: '32px' }} />
                          )}
                        </div>
                        {/* Content */}
                        <div style={{ flex: 1, paddingBottom: isLast ? '0' : '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{draw.label}</span>
                            <span style={{
                              fontSize: '11px', fontWeight: '600', padding: '2px 8px',
                              borderRadius: 0, background: statusBg, color: statusColor,
                              textTransform: 'uppercase'
                            }}>
                              {draw.status === 'completed' ? '✓ Done' : draw.status === 'overdue' ? 'Overdue' : 'Upcoming'}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            {draw.weekLabel}
                            {draw.completedDate && (
                              <span style={{ color: '#22c55e', marginLeft: '8px' }}>
                                — Completed {formatDate(draw.completedDate)}
                              </span>
                            )}
                            {!draw.completedDate && (
                              <span style={{ color: '#3b82f6', marginLeft: '8px', fontSize: '12px' }}>
                                Click to mark complete
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div style={styles.sideCol}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Actions</h2>
              <div style={styles.actionStack}>
                {protocol?.patient_id && (
                  <Link href={`/admin/patients/${protocol.patient_id}`} style={styles.actionBtn}>
                    👁️ View Patient Profile
                  </Link>
                )}
                {protocol?.patient_phone && (
                  <>
                    <a href={`tel:${protocol.patient_phone}`} style={styles.actionBtnSecondary}>📞 Call</a>
                    <a href={`sms:${protocol.patient_phone}`} style={styles.actionBtnSecondary}>💬 Text</a>
                  </>
                )}
                {protocol?.program_type === 'peptide' && protocol?.peptide_reminders_enabled === true && (
                  <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 0, fontSize: '14px', color: '#16A34A', fontWeight: '600', textAlign: 'center' }}>
                    ✅ Weekly Check-ins Active
                  </div>
                )}
                {isRecoveryPeptide(protocol?.medication) && !protocol?.peptide_guide_sent && (
                  <button
                    onClick={async () => {
                      setSendingGuide(true);
                      setError('');
                      try {
                        const res = await fetch(`/api/admin/protocols/${id}/send-guide`, { method: 'POST' });
                        const data = await res.json();
                        if (res.ok) {
                          setSuccess(data.twoStep
                            ? 'Opt-in sent! Guide will be delivered when patient replies.'
                            : 'Peptide guide SMS sent!');
                          setProtocol(prev => ({ ...prev, peptide_guide_sent: true }));
                        } else {
                          setError(data.error || 'Failed to send guide');
                        }
                      } catch (e) {
                        setError('Failed to send peptide guide SMS');
                      }
                      setSendingGuide(false);
                    }}
                    disabled={sendingGuide}
                    style={{ ...styles.actionBtnSecondary, border: 'none', cursor: sendingGuide ? 'not-allowed' : 'pointer', opacity: sendingGuide ? 0.6 : 1 }}
                  >
                    {sendingGuide ? 'Sending...' : '📖 Send Peptide Guide'}
                  </button>
                )}
                {/* HRT Injection Reminders */}
                {isOngoing && (() => {
                  const remindersEnabled = protocol?.hrt_reminders_enabled === true;
                  const currentSchedule = protocol?.hrt_reminder_schedule || 'mon_thu';
                  const scheduleLabel = currentSchedule === 'tue_fri' ? 'Tue & Fri' : currentSchedule === 'daily' ? 'Daily' : 'Mon & Thu';

                  if (remindersEnabled) {
                    return (
                      <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 0, fontSize: '14px', color: '#16A34A', fontWeight: '600', textAlign: 'center' }}>
                        ✅ Injection Reminders On
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                          <select
                            value={currentSchedule}
                            onChange={async (e) => {
                              const newSchedule = e.target.value;
                              try {
                                const res = await fetch(`/api/admin/protocols/${id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ hrt_reminder_schedule: newSchedule })
                                });
                                if (res.ok) {
                                  setProtocol(prev => ({ ...prev, hrt_reminder_schedule: newSchedule }));
                                  const label = newSchedule === 'tue_fri' ? 'Tue & Fri' : newSchedule === 'daily' ? 'Daily' : 'Mon & Thu';
                                  setSuccess(`Reminder schedule changed to ${label}`);
                                }
                              } catch (e) {
                                setError('Failed to update schedule');
                              }
                            }}
                            style={{ padding: '4px 6px', border: '1px solid #BBF7D0', borderRadius: 0, fontSize: '12px', color: '#15803D', background: '#F0FDF4', cursor: 'pointer' }}
                          >
                            <option value="mon_thu">Mon & Thu</option>
                            <option value="tue_fri">Tue & Fri</option>
                          </select>
                          <span style={{ fontSize: '12px', fontWeight: '400', color: '#15803D' }}>at 9:00 AM</span>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/admin/protocols/${id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ hrt_reminders_enabled: false })
                              });
                              if (res.ok) {
                                setProtocol(prev => ({ ...prev, hrt_reminders_enabled: false }));
                                setSuccess('Injection reminders disabled');
                              }
                            } catch (e) {
                              setError('Failed to disable reminders');
                            }
                          }}
                          style={{ fontSize: '11px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px', textDecoration: 'underline' }}
                        >
                          Disable
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>Schedule:</label>
                        <select
                          value={hrtReminderSchedule}
                          onChange={e => setHrtReminderSchedule(e.target.value)}
                          style={{ flex: 1, padding: '6px 8px', border: '1px solid #e5e5e5', borderRadius: 0, fontSize: '13px' }}
                        >
                          <option value="mon_thu">Mon & Thu</option>
                          <option value="tue_fri">Tue & Fri</option>
                        </select>
                      </div>
                      <button
                        onClick={async () => {
                          setEnablingHrtReminders(true);
                          setError('');
                          try {
                            const res = await fetch(`/api/admin/protocols/${id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ hrt_reminders_enabled: true, hrt_reminder_schedule: hrtReminderSchedule })
                            });
                            if (res.ok) {
                              setProtocol(prev => ({ ...prev, hrt_reminders_enabled: true, hrt_reminder_schedule: hrtReminderSchedule }));
                              setSuccess('Injection reminders enabled!');
                            } else {
                              setError('Failed to enable reminders');
                            }
                          } catch (e) {
                            setError('Failed to enable reminders');
                          }
                          setEnablingHrtReminders(false);
                        }}
                        disabled={enablingHrtReminders}
                        style={{ ...styles.actionBtnSecondary, border: 'none', cursor: enablingHrtReminders ? 'not-allowed' : 'pointer', opacity: enablingHrtReminders ? 0.6 : 1 }}
                      >
                        {enablingHrtReminders ? 'Enabling...' : '💉 Enable Injection Reminders'}
                      </button>
                    </div>
                  );
                })()}

                {/* Email Sequence (weight loss) */}
                {isWeightLoss && (() => {
                  const emailSequence = [
                    { num: 1, subject: 'Your Weight Loss Journey Starts Here' },
                    { num: 2, subject: 'Fuel Your Weight Loss: What to Eat' },
                    { num: 3, subject: "Feeling Nauseous? Here's What Helps" },
                    { num: 4, subject: 'The Final Piece: Exercise & Supplements' }
                  ];
                  const hasStarted = dripLogs.length > 0;
                  return (
                    <div style={{ padding: '12px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>📧 Email Sequence</span>
                        {!hasStarted && (
                          <button
                            onClick={async () => {
                              if (!confirm('Start the 4-day email sequence? Email 1 will send immediately.')) return;
                              setStartingDrip(true);
                              try {
                                const resp = await fetch('/api/protocols/start-drip', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ protocolId: id })
                                });
                                const data = await resp.json();
                                if (data.success) {
                                  setSuccess(`Email 1 sent! Emails 2-4 follow over next 3 days.`);
                                  // Refresh drip logs
                                  const dripRes = await fetch(`/api/protocols/${id}`);
                                  const dripData = await dripRes.json();
                                  setDripLogs((dripData.activityLogs || []).filter(l => l.log_type === 'drip_email'));
                                } else {
                                  setError(data.error || 'Failed to start sequence');
                                }
                              } catch (err) {
                                setError(err.message);
                              }
                              setStartingDrip(false);
                            }}
                            disabled={startingDrip}
                            style={{
                              fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                              background: '#000', color: '#fff', border: 'none', borderRadius: 0,
                              cursor: startingDrip ? 'wait' : 'pointer', opacity: startingDrip ? 0.6 : 1
                            }}
                          >
                            {startingDrip ? 'Sending...' : 'Start Sequence'}
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {emailSequence.map(email => {
                          const sent = dripLogs.find(l => l.notes && l.notes.includes(`Drip email ${email.num}:`));
                          return (
                            <div key={email.num} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                              <span style={{
                                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                                background: sent ? '#22c55e' : '#d1d5db'
                              }} />
                              <span style={{ color: sent ? '#374151' : '#9ca3af' }}>
                                Email {email.num}: {email.subject}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* HRT Onboarding Sequence */}
                {isOngoing && isHRTProtocol(programType) && protocol?.status === 'active' && (() => {
                  const onboardingSteps = [
                    { id: 'welcome', label: 'Welcome + Range IV Info' },
                    { id: 'injection_training', label: 'Injection Training / Schedule' },
                    { id: 'week1_checkin', label: 'Week 1 Check-in' },
                    { id: 'month1_iv', label: 'Monthly Range IV Reminder' },
                    { id: 'prelab_headsup', label: 'Pre-Lab Heads Up' },
                    { id: 'book_labs', label: 'Book Follow-Up Labs' }
                  ];
                  const hasStarted = protocol?.onboarding_start_date || onboardingLogs.length > 0;
                  return (
                    <div style={{ padding: '12px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>📧 HRT Onboarding</span>
                        {!hasStarted && (
                          <button
                            onClick={async () => {
                              if (protocol?.delivery_method === 'take_home' && !protocol?.injection_method) {
                                setError('Please set the injection method (IM or SubQ) before starting onboarding.');
                                return;
                              }
                              if (!confirm('Start the HRT onboarding email + SMS sequence? A welcome email will be sent immediately.')) return;
                              setStartingOnboarding(true);
                              try {
                                const resp = await fetch('/api/protocols/start-hrt-onboarding', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ protocolId: id })
                                });
                                const data = await resp.json();
                                if (data.success) {
                                  setSuccess('Welcome email sent! Onboarding sequence started.');
                                  const obRes = await fetch(`/api/protocols/${id}`);
                                  const obData = await obRes.json();
                                  setOnboardingLogs((obData.activityLogs || []).filter(l => l.log_type === 'hrt_onboarding'));
                                  setProtocol(prev => ({ ...prev, onboarding_start_date: data.onboardingStartDate }));
                                } else {
                                  setError(data.error || 'Failed to start onboarding');
                                }
                              } catch (err) {
                                setError(err.message);
                              }
                              setStartingOnboarding(false);
                            }}
                            disabled={startingOnboarding}
                            style={{
                              fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                              background: '#000', color: '#fff', border: 'none', borderRadius: 0,
                              cursor: startingOnboarding ? 'wait' : 'pointer', opacity: startingOnboarding ? 0.6 : 1
                            }}
                          >
                            {startingOnboarding ? 'Sending...' : 'Start Onboarding'}
                          </button>
                        )}
                        {hasStarted && protocol?.onboarding_start_date && (
                          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                            Started {new Date(protocol.onboarding_start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {onboardingSteps.map(step => {
                          const sent = onboardingLogs.find(l => l.notes && l.notes.includes(`step: ${step.id}`));
                          return (
                            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                              <span style={{
                                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                                background: sent ? '#22c55e' : '#d1d5db'
                              }} />
                              <span style={{ color: sent ? '#374151' : '#9ca3af' }}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {/* Show recurring reminders if sequence is complete */}
                      {onboardingLogs.some(l => l.notes?.includes('step: book_labs')) && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>
                            Recurring: Monthly IV + Quarterly Lab reminders active
                          </span>
                        </div>
                      )}
                      {/* Patient Portal Link */}
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>🔗 Patient Portal:</span>
                        {protocol?.access_token ? (
                          <>
                            <button
                              onClick={() => {
                                const url = `https://www.range-medical.com/hrt/${protocol.access_token}`;
                                navigator.clipboard.writeText(url).then(() => setSuccess('Portal link copied!')).catch(() => prompt('Copy this link:', url));
                              }}
                              style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                            >
                              Copy Link
                            </button>
                            <span style={{ color: '#d1d5db' }}>|</span>
                            <button
                              onClick={async () => {
                                if (!confirm('Send portal link to patient via SMS?')) return;
                                try {
                                  const resp = await fetch('/api/protocols/send-portal-link', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ protocolId: id })
                                  });
                                  const data = await resp.json();
                                  if (data.success) {
                                    setSuccess('Portal link sent via SMS!');
                                  } else {
                                    setError(data.error || 'Failed to send');
                                  }
                                } catch (err) {
                                  setError(err.message);
                                }
                              }}
                              style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                            >
                              Send to Patient
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!confirm('Generate and send portal link to patient via SMS?')) return;
                              try {
                                const resp = await fetch('/api/protocols/send-portal-link', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ protocolId: id })
                                });
                                const data = await resp.json();
                                if (data.success) {
                                  setSuccess('Portal link generated and sent!');
                                  setProtocol(prev => ({ ...prev, access_token: data.portalUrl.split('/hrt/')[1] }));
                                } else {
                                  setError(data.error || 'Failed to generate link');
                                }
                              } catch (err) {
                                setError(err.message);
                              }
                            }}
                            style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 0, cursor: 'pointer' }}
                          >
                            Generate + Send Link
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Range IV Perk — HRT membership includes 1 free Range IV per billing cycle */}
                {isOngoing && isHRTProtocol(programType) && protocol?.status === 'active' && (() => {
                  if (!rangeIVStatus) return null;
                  const { used, service_date, cycle_start, cycle_end } = rangeIVStatus;
                  const cycleStartDisplay = cycle_start ? new Date(cycle_start + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
                  const cycleEndDisplay = cycle_end ? new Date(cycle_end + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
                  const usedDateDisplay = service_date ? new Date(service_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

                  return (
                    <div style={{
                      padding: '14px 16px',
                      background: used ? '#f9fafb' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      border: used ? '1px solid #e5e7eb' : '1.5px solid #86efac',
                      borderRadius: 0,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>💧</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: used ? '#6b7280' : '#166534' }}>
                            Monthly Range IV
                          </span>
                        </div>
                        {used ? (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 0 }}>
                            USED {usedDateDisplay}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', background: '#dcfce7', border: '1px solid #86efac', padding: '2px 8px', borderRadius: 0 }}>
                            AVAILABLE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: used ? 0 : '10px' }}>
                        Billing cycle: {cycleStartDisplay} – {cycleEndDisplay}
                      </div>
                      {!used && (
                        <button
                          onClick={async () => {
                            if (redeemingRangeIV) return;
                            setRedeemingRangeIV(true);
                            try {
                              const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
                              const res = await fetch(`/api/protocols/${id}/redeem-range-iv`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ service_date: today })
                              });
                              if (res.ok) {
                                setSuccess('Range IV redeemed!');
                                fetchRangeIVStatus(protocol);
                              } else {
                                const data = await res.json();
                                setError(data.error || 'Failed to redeem');
                              }
                            } catch (err) {
                              setError('Failed to redeem Range IV');
                            }
                            setRedeemingRangeIV(false);
                          }}
                          disabled={redeemingRangeIV}
                          style={{
                            width: '100%', padding: '10px', background: '#16a34a', color: '#fff',
                            border: 'none', borderRadius: 0, fontWeight: 700, fontSize: '14px',
                            cursor: redeemingRangeIV ? 'not-allowed' : 'pointer',
                            opacity: redeemingRangeIV ? 0.6 : 1,
                          }}
                        >
                          {redeemingRangeIV ? 'Redeeming...' : '✓ Use Free Range IV Today'}
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Weekly Check-in Texts (weight loss take-home only — in-clinic patients don't need automated check-ins) */}
                {isWeightLoss && (protocol?.delivery_method || protocol?.injection_location) !== 'in_clinic' && (() => {
                  const checkinEnabled = protocol?.checkin_reminder_enabled === true;
                  const injDay = protocol?.injection_day;

                  if (checkinEnabled) {
                    return (
                      <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 0, fontSize: '14px', color: '#16A34A', fontWeight: '600', textAlign: 'center' }}>
                        ✅ Weekly Check-ins Enabled
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                          <select
                            value={injDay || wlCheckinDay}
                            onChange={async (e) => {
                              const newDay = e.target.value;
                              try {
                                const res = await fetch(`/api/admin/protocols/${id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ injection_day: newDay })
                                });
                                if (res.ok) {
                                  setProtocol(prev => ({ ...prev, injection_day: newDay }));
                                  setSuccess(`Injection day changed to ${newDay}`);
                                }
                              } catch (e) {
                                setError('Failed to update injection day');
                              }
                            }}
                            style={{ padding: '4px 6px', border: '1px solid #BBF7D0', borderRadius: 0, fontSize: '12px', color: '#15803D', background: '#F0FDF4', cursor: 'pointer' }}
                          >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                          <span style={{ fontSize: '12px', fontWeight: '400', color: '#15803D' }}>at 9:00 AM</span>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/admin/protocols/${id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ checkin_reminder_enabled: false })
                              });
                              if (res.ok) {
                                setProtocol(prev => ({ ...prev, checkin_reminder_enabled: false }));
                                setSuccess('Weekly check-ins disabled');
                              }
                            } catch (e) {
                              setError('Failed to disable check-ins');
                            }
                          }}
                          style={{ fontSize: '11px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px', textDecoration: 'underline' }}
                        >
                          Disable
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>Injection Day:</label>
                        <select
                          value={wlCheckinDay}
                          onChange={e => setWlCheckinDay(e.target.value)}
                          style={{ flex: 1, padding: '6px 8px', border: '1px solid #e5e5e5', borderRadius: 0, fontSize: '13px' }}
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={async () => {
                          setEnablingWlCheckin(true);
                          setError('');
                          try {
                            const res = await fetch(`/api/admin/protocols/${id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ checkin_reminder_enabled: true, injection_day: wlCheckinDay })
                            });
                            if (res.ok) {
                              setProtocol(prev => ({ ...prev, checkin_reminder_enabled: true, injection_day: wlCheckinDay }));
                              setSuccess('Weekly check-in texts enabled!');
                            } else {
                              setError('Failed to enable check-ins');
                            }
                          } catch (e) {
                            setError('Failed to enable check-ins');
                          }
                          setEnablingWlCheckin(false);
                        }}
                        disabled={enablingWlCheckin}
                        style={{ ...styles.actionBtnSecondary, border: 'none', cursor: enablingWlCheckin ? 'not-allowed' : 'pointer', opacity: enablingWlCheckin ? 0.6 : 1 }}
                      >
                        {enablingWlCheckin ? 'Enabling...' : '📱 Enable Weekly Check-in Texts'}
                      </button>
                    </div>
                  );
                })()}

                {/* Exchange Protocol */}
                {protocol?.status === 'active' && (
                  <button
                    onClick={() => {
                      setExchangeForm({
                        medication: '', dosage: '', frequency: 'daily', duration: '30',
                        reason: '', reasonNote: '',
                        protocolType: protocol.program_type === 'weight_loss' ? 'peptide' : protocol.program_type
                      });
                      setExchangeModal(true);
                    }}
                    style={{ ...styles.actionBtnSecondary, border: '1px solid #fbbf24', background: '#fffbeb', color: '#92400e', cursor: 'pointer', fontWeight: '600' }}
                  >
                    🔄 Exchange Protocol
                  </button>
                )}

                {/* Exchanged status indicator */}
                {protocol?.status === 'exchanged' && (
                  <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: 0, fontSize: '13px', color: '#92400e', textAlign: 'center' }}>
                    🔄 Exchanged{protocol.exchange_reason ? ` — ${protocol.exchange_reason.replace(/_/g, ' ')}` : ''}
                    {protocol.exchanged_to && (
                      <div style={{ marginTop: '6px' }}>
                        <Link href={`/admin/protocols/${protocol.exchanged_to}`} style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '12px' }}>
                          View new protocol →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Exchanged-from indicator */}
                {protocol?.exchanged_from && (
                  <div style={{ padding: '10px 14px', background: '#f0f9ff', border: '1px solid #93c5fd', borderRadius: 0, fontSize: '13px', color: '#1e40af', textAlign: 'center' }}>
                    ↩️ Created via exchange
                    <div style={{ marginTop: '6px' }}>
                      <Link href={`/admin/protocols/${protocol.exchanged_from}`} style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '12px' }}>
                        View original protocol →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {protocol?.patient_id && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Profile Link</h2>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/admin/patients/${protocol.patient_id}`);
                    setSuccess('Copied!');
                  }}
                  style={styles.copyBtn}
                >
                  📋 Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Injection Modal */}
      {logModal && (
        <>
          <div onClick={() => setLogModal(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 0, padding: 24, zIndex: 10001,
            width: '90%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>
              Log Injection #{logModal.injectionNum}
            </h3>
            <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 14 }}>
              {logModal.date}
            </p>

            {/* Completed / Missed Toggle */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Status</label>
              <div style={{ display: 'flex', gap: 0, borderRadius: 0, overflow: 'hidden', border: '1px solid #d1d5db' }}>
                <button
                  type="button"
                  onClick={() => setLogForm({ ...logForm, missed: false })}
                  style={{
                    flex: 1, padding: '8px 12px', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: !logForm.missed ? '#000' : '#fff',
                    color: !logForm.missed ? '#fff' : '#374151',
                  }}
                >Completed</button>
                <button
                  type="button"
                  onClick={() => setLogForm({ ...logForm, missed: true })}
                  style={{
                    flex: 1, padding: '8px 12px', border: 'none', borderLeft: '1px solid #d1d5db', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: logForm.missed ? '#f59e0b' : '#fff',
                    color: logForm.missed ? '#fff' : '#374151',
                  }}
                >Missed Check-in</button>
              </div>
            </div>

            {/* Delivery Method Toggle — hidden when missed */}
            {!logForm.missed && <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Delivery Method</label>
              <div style={{ display: 'flex', gap: 0, borderRadius: 0, overflow: 'hidden', border: '1px solid #d1d5db' }}>
                <button
                  type="button"
                  onClick={() => setLogForm({ ...logForm, deliveryMethod: 'in_clinic' })}
                  style={{
                    flex: 1, padding: '8px 12px', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: logForm.deliveryMethod === 'in_clinic' ? '#000' : '#fff',
                    color: logForm.deliveryMethod === 'in_clinic' ? '#fff' : '#374151',
                  }}
                >In Clinic</button>
                <button
                  type="button"
                  onClick={() => setLogForm({ ...logForm, deliveryMethod: 'take_home', bloodPressure: '' })}
                  style={{
                    flex: 1, padding: '8px 12px', border: 'none', borderLeft: '1px solid #d1d5db', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: logForm.deliveryMethod === 'take_home' ? '#000' : '#fff',
                    color: logForm.deliveryMethod === 'take_home' ? '#fff' : '#374151',
                  }}
                >Take Home</button>
              </div>
            </div>}

            {/* Weight */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Weight (lbs)</label>
              <input
                type="number"
                step="0.1"
                value={logForm.weight}
                onChange={e => setLogForm({ ...logForm, weight: e.target.value })}
                placeholder="e.g. 185.5"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            {/* Blood Pressure, Dose, Side Effects — hidden when missed */}
            {!logForm.missed && <>
              {/* Blood Pressure — In Clinic only */}
              {logForm.deliveryMethod === 'in_clinic' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Blood Pressure</label>
                  <input
                    type="text"
                    value={logForm.bloodPressure}
                    onChange={e => setLogForm({ ...logForm, bloodPressure: e.target.value })}
                    placeholder="e.g. 120/80"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {/* Dose */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Dose</label>
                <input
                  type="text"
                  value={logForm.dose}
                  onChange={e => setLogForm({ ...logForm, dose: e.target.value })}
                  placeholder="e.g. 2.5mg"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              {/* Side Effects */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Side Effects</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {WL_SIDE_EFFECTS.map(effect => {
                    const isSelected = logForm.sideEffects.includes(effect);
                    return (
                      <button
                        key={effect}
                        type="button"
                        onClick={() => {
                          setLogForm(prev => ({
                            ...prev,
                            sideEffects: isSelected
                              ? prev.sideEffects.filter(e => e !== effect)
                              : [...prev.sideEffects, effect]
                          }));
                        }}
                        style={{
                          padding: '5px 10px', borderRadius: 0, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          border: isSelected ? '1.5px solid #dc2626' : '1px solid #d1d5db',
                          background: isSelected ? '#fef2f2' : '#fff',
                          color: isSelected ? '#dc2626' : '#374151',
                        }}
                      >{effect}</button>
                    );
                  })}
                </div>
              </div>
            </>}

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Notes</label>
              <input
                type="text"
                value={logForm.notes}
                onChange={e => setLogForm({ ...logForm, notes: e.target.value })}
                placeholder="Optional"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setLogModal(null)} style={{
                padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 0,
                background: '#fff', cursor: 'pointer', fontSize: 14
              }}>Cancel</button>
              <button onClick={handleLogInjection} disabled={logSaving} style={{
                padding: '8px 20px', border: 'none', borderRadius: 0,
                background: '#000', color: '#fff', cursor: logSaving ? 'wait' : 'pointer',
                fontSize: 14, fontWeight: 600, opacity: logSaving ? 0.6 : 1
              }}>{logSaving ? 'Saving...' : (logForm.missed ? 'Log Missed Check-in' : 'Log Injection')}</button>
            </div>
          </div>
        </>
      )}

      {/* Secondary Med Pickup Modal */}
      {secMedPickupModal && (
        <>
          <div onClick={() => setSecMedPickupModal(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 0, padding: 24, zIndex: 10001,
            width: '90%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#7c3aed' }}>
              💊 Log {secMedPickupModal.medication} Pickup
            </h3>
            <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 14 }}>
              Track supply for {protocol?.patient_name || 'this patient'}
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Pickup Date</label>
              <input
                type="date"
                value={secMedPickupForm.date}
                onChange={e => setSecMedPickupForm({ ...secMedPickupForm, date: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Number of Vials</label>
              <input
                type="number"
                min="1"
                max="10"
                value={secMedPickupForm.num_vials}
                onChange={e => setSecMedPickupForm({ ...secMedPickupForm, num_vials: parseInt(e.target.value) || 1 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Dosage <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
              <input
                type="text"
                value={secMedPickupForm.dosage}
                onChange={e => setSecMedPickupForm({ ...secMedPickupForm, dosage: e.target.value })}
                placeholder="e.g. 500iu"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Frequency <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
              <input
                type="text"
                value={secMedPickupForm.frequency}
                onChange={e => setSecMedPickupForm({ ...secMedPickupForm, frequency: e.target.value })}
                placeholder="e.g. 2x/week"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setSecMedPickupModal(null)} style={{
                padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 0,
                background: '#fff', cursor: 'pointer', fontSize: 14
              }}>Cancel</button>
              <button
                disabled={secMedPickupSaving || !secMedPickupForm.date}
                onClick={async () => {
                  setSecMedPickupSaving(true);
                  try {
                    const res = await fetch('/api/service-log', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        patient_id: protocol.patient_id,
                        category: 'testosterone',
                        entry_type: 'pickup',
                        entry_date: secMedPickupForm.date,
                        medication: secMedPickupModal.medication,
                        dosage: secMedPickupForm.dosage || null,
                        quantity: secMedPickupForm.num_vials,
                        protocol_id: protocol.id,
                        is_secondary_med: true,
                        secondary_med_details: {
                          num_vials: secMedPickupForm.num_vials,
                          dosage: secMedPickupForm.dosage || null,
                          frequency: secMedPickupForm.frequency || null,
                        },
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to log pickup');
                    setSuccess(`${secMedPickupModal.medication} pickup logged — ${secMedPickupForm.num_vials} vial(s)`);
                    setSecMedPickupModal(null);
                    fetchProtocol();
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setSecMedPickupSaving(false);
                  }
                }}
                style={{
                  padding: '8px 20px', border: 'none', borderRadius: 0,
                  background: '#7c3aed', color: '#fff', cursor: secMedPickupSaving ? 'wait' : 'pointer',
                  fontSize: 14, fontWeight: 600, opacity: secMedPickupSaving ? 0.6 : 1
                }}
              >{secMedPickupSaving ? 'Saving...' : '✓ Log Pickup'}</button>
            </div>
          </div>
        </>
      )}

      {/* Edit Injection Modal */}
      {editDateModal && (
        <>
          <div onClick={() => setEditDateModal(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 0, padding: 24, zIndex: 10001,
            width: '90%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>
              Edit Injection #{editDateModal.injectionNum}
            </h3>
            <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 14 }}>
              Update date, weight, and dose for this injection
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Date</label>
              <input
                type="date"
                value={editDateValue}
                onChange={e => setEditDateValue(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Weight (lbs)</label>
              <input
                type="number"
                step="0.1"
                value={editWeightValue}
                onChange={e => setEditWeightValue(e.target.value)}
                placeholder="Leave empty to clear"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
              />
              {editWeightValue && (
                <button
                  onClick={() => setEditWeightValue('')}
                  style={{ marginTop: 4, fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >✕ Clear weight</button>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Dose</label>
              <input
                type="text"
                value={editDoseValue}
                onChange={e => setEditDoseValue(e.target.value)}
                placeholder="e.g. 2mg, 4mg"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
              />
              {editDoseValue && (
                <button
                  onClick={() => setEditDoseValue('')}
                  style={{ marginTop: 4, fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >✕ Clear dose</button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={handleClearInjection} disabled={editDateSaving} style={{
                padding: '8px 16px', border: '1px solid #dc2626', borderRadius: 0,
                background: '#fff', color: '#dc2626', cursor: editDateSaving ? 'wait' : 'pointer',
                fontSize: 13, fontWeight: 600, marginRight: 'auto'
              }}>Clear Injection</button>
              <button onClick={() => setEditDateModal(null)} style={{
                padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 0,
                background: '#fff', cursor: 'pointer', fontSize: 14
              }}>Cancel</button>
              <button onClick={handleEditLogEntry} disabled={editDateSaving} style={{
                padding: '8px 20px', border: 'none', borderRadius: 0,
                background: '#22c55e', color: '#fff', cursor: editDateSaving ? 'wait' : 'pointer',
                fontSize: 14, fontWeight: 600, opacity: editDateSaving ? 0.6 : 1
              }}>{editDateSaving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </>
      )}

      {/* Blood Draw Modal */}
      {bloodDrawModal && (
        <>
          <div onClick={() => setBloodDrawModal(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 0, padding: 24, zIndex: 10001,
            width: '90%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>
              🩸 {bloodDrawModal.label}
            </h3>
            <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 14 }}>
              Scheduled: {bloodDrawModal.weekLabel}
              {bloodDrawModal.status === 'completed' && (
                <span style={{ color: '#22c55e', fontWeight: 600 }}> — Completed</span>
              )}
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {bloodDrawModal.status === 'completed' ? 'Completed Date' : 'Completion Date'}
              </label>
              <input
                type="date"
                value={bloodDrawDate}
                onChange={e => setBloodDrawDate(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {bloodDrawModal.status === 'completed' && (
                <button onClick={() => handleBloodDrawSave('undo')} disabled={bloodDrawSaving} style={{
                  padding: '8px 16px', border: '1px solid #dc2626', borderRadius: 0,
                  background: '#fff', color: '#dc2626', cursor: bloodDrawSaving ? 'wait' : 'pointer',
                  fontSize: 13, fontWeight: 600, marginRight: 'auto'
                }}>Undo</button>
              )}
              <button onClick={() => setBloodDrawModal(null)} style={{
                padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 0,
                background: '#fff', cursor: 'pointer', fontSize: 14
              }}>Cancel</button>
              <button onClick={() => handleBloodDrawSave('complete')} disabled={bloodDrawSaving} style={{
                padding: '8px 20px', border: 'none', borderRadius: 0,
                background: '#000', color: '#fff', cursor: bloodDrawSaving ? 'wait' : 'pointer',
                fontSize: 14, fontWeight: 600, opacity: bloodDrawSaving ? 0.6 : 1
              }}>{bloodDrawSaving ? 'Saving...' : bloodDrawModal.status === 'completed' ? 'Update Date' : 'Mark Complete'}</button>
            </div>
          </div>
        </>
      )}
      {/* ── Encounter Note Slide-Out Panel ── */}
      {encounterSlideNote && (
        <>
          <div
            onClick={() => setEncounterSlideNote(null)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.3)', zIndex: 999,
            }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '520px', maxWidth: '90vw',
            background: '#fff', zIndex: 1000, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.2s ease-out',
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111' }}>Encounter Note</h3>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  {encounterSlideNote.note_date
                    ? new Date(encounterSlideNote.note_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })
                    : ''}
                </div>
              </div>
              <button
                onClick={() => setEncounterSlideNote(null)}
                style={{
                  background: 'none', border: 'none', fontSize: '24px', color: '#9ca3af',
                  cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
                }}
              >&times;</button>
            </div>
            <div style={{
              padding: '20px 24px', flex: 1, overflowY: 'auto',
            }}>
              {/* Meta info */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                {encounterSlideNote.created_by && (
                  <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: 0, background: '#f3f4f6', color: '#4b5563' }}>
                    By: {encounterSlideNote.created_by}
                  </span>
                )}
                {encounterSlideNote.encounter_service && (
                  <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: 0, background: '#ecfdf5', color: '#059669' }}>
                    {encounterSlideNote.encounter_service}
                  </span>
                )}
                {encounterSlideNote.status === 'signed' && (
                  <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: 0, background: '#eff6ff', color: '#2563eb' }}>
                    Signed{encounterSlideNote.signed_by ? ` by ${encounterSlideNote.signed_by}` : ''}
                  </span>
                )}
              </div>
              {/* Note body */}
              <div style={{
                fontSize: '14px', lineHeight: '1.7', color: '#1f2937',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {encounterSlideNote.body || encounterSlideNote.raw_input || 'No note content.'}
              </div>
            </div>
            {/* Footer with link to patient */}
            {protocol?.patient_id && (
              <div style={{
                padding: '16px 24px', borderTop: '1px solid #e5e7eb',
                display: 'flex', justifyContent: 'flex-end',
              }}>
                <Link href={`/admin/patient/${protocol.patient_id}?tab=notes`} style={{
                  fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '500',
                }}>
                  View all notes →
                </Link>
              </div>
            )}
          </div>
          <style jsx>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}
      {/* Add Sessions Modal */}
      {addSessionsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setAddSessionsModal(false)}>
          <div style={{
            background: '#fff', borderRadius: 0, padding: '28px', width: '400px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Add Sessions</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
              {protocol?.program_name} — Currently {protocol?.total_sessions || 0} total sessions
            </p>

            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Sessions to Add</label>
            <input
              type="number"
              min="1"
              value={addSessionsCount}
              onChange={e => setAddSessionsCount(e.target.value)}
              placeholder="e.g. 4"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 0,
                border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '6px',
                boxSizing: 'border-box'
              }}
            />
            {addSessionsCount && parseInt(addSessionsCount) > 0 && (
              <p style={{ fontSize: '12px', color: '#16a34a', marginBottom: '16px' }}>
                New total: {(protocol?.total_sessions || 0) + parseInt(addSessionsCount)} sessions
              </p>
            )}

            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px', marginTop: '12px' }}>Notes (optional)</label>
            <input
              type="text"
              value={addSessionsNotes}
              onChange={e => setAddSessionsNotes(e.target.value)}
              placeholder="e.g. Catch-up for Dec/Jan billing"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 0,
                border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '20px',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setAddSessionsModal(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 0, border: '1px solid #d1d5db',
                  background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500
                }}
              >Cancel</button>
              <button
                onClick={handleAddSessions}
                disabled={addSessionsSaving || !addSessionsCount || parseInt(addSessionsCount) < 1}
                style={{
                  flex: 1, padding: '10px', borderRadius: 0, border: 'none',
                  background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                  opacity: (!addSessionsCount || parseInt(addSessionsCount) < 1) ? 0.5 : 1
                }}
              >{addSessionsSaving ? 'Adding...' : 'Add Sessions'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Exchange Protocol Modal */}
      {exchangeModal && (
        <>
          <div onClick={() => setExchangeModal(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 0, padding: 24, zIndex: 10001,
            width: '90%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>
              🔄 Exchange Protocol
            </h3>
            <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 13 }}>
              Replacing: <strong>{protocol?.medication || protocol?.program_name}</strong>
            </p>

            {/* Reason */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Reason for Exchange</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { value: 'adverse_reaction', label: 'Adverse Reaction' },
                  { value: 'patient_preference', label: 'Patient Preference' },
                  { value: 'provider_recommendation', label: 'Provider Rec.' },
                  { value: 'other', label: 'Other' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExchangeForm(f => ({ ...f, reason: opt.value }))}
                    style={{
                      padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13,
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      background: exchangeForm.reason === opt.value ? '#000' : '#fff',
                      color: exchangeForm.reason === opt.value ? '#fff' : '#374151'
                    }}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Note (optional)</label>
              <input
                type="text"
                value={exchangeForm.reasonNote}
                onChange={e => setExchangeForm(f => ({ ...f, reasonNote: e.target.value }))}
                placeholder="e.g., nausea after first dose"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {/* Protocol Type */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>New Protocol Type</label>
              <select
                value={exchangeForm.protocolType}
                onChange={e => setExchangeForm(f => ({ ...f, protocolType: e.target.value, medication: '' }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: 14, background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="peptide">Peptide</option>
                <option value="weight_loss">Weight Loss</option>
              </select>
            </div>

            {/* New Medication */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>New Medication</label>
              {exchangeForm.protocolType === 'weight_loss' ? (
                <select
                  value={exchangeForm.medication}
                  onChange={e => setExchangeForm(f => ({ ...f, medication: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: 14, background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">Select medication...</option>
                  {WEIGHT_LOSS_MEDICATIONS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={exchangeForm.medication}
                  onChange={e => {
                    const selected = e.target.value;
                    // Auto-fill dosage from config
                    let dose = '';
                    for (const group of PEPTIDE_OPTIONS) {
                      const opt = group.options.find(o => o.value === selected);
                      if (opt) { dose = opt.startingDose; break; }
                    }
                    setExchangeForm(f => ({ ...f, medication: selected, dosage: dose }));
                  }}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: 14, background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">Select medication...</option>
                  {PEPTIDE_OPTIONS.map(group => (
                    <optgroup key={group.group} label={group.group}>
                      {group.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.startingDose})</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>

            {/* Dosage & Duration row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Dosage</label>
                <input
                  type="text"
                  value={exchangeForm.dosage}
                  onChange={e => setExchangeForm(f => ({ ...f, dosage: e.target.value }))}
                  placeholder="e.g., 500mcg/500mcg"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Duration (days)</label>
                <input
                  type="number"
                  value={exchangeForm.duration}
                  onChange={e => setExchangeForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="30"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Frequency */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Frequency</label>
              <select
                value={exchangeForm.frequency}
                onChange={e => setExchangeForm(f => ({ ...f, frequency: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: 14, background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="daily">Daily</option>
                <option value="2x_daily">2x Daily</option>
                <option value="2x_weekly">2x Weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setExchangeModal(false)} style={{
                padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14,
                cursor: 'pointer', background: '#fff', fontFamily: 'inherit'
              }}>Cancel</button>
              <button
                onClick={async () => {
                  if (!exchangeForm.medication) { setError('Select a new medication'); return; }
                  if (!exchangeForm.reason) { setError('Select a reason for exchange'); return; }
                  setExchangeSaving(true);
                  setError('');
                  try {
                    const resp = await fetch(`/api/admin/protocols/${id}/exchange`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(exchangeForm)
                    });
                    const data = await resp.json();
                    if (data.success) {
                      setExchangeModal(false);
                      router.push(`/admin/protocols/${data.newProtocol.id}`);
                    } else {
                      setError(data.error || 'Exchange failed');
                    }
                  } catch (err) {
                    setError(err.message);
                  }
                  setExchangeSaving(false);
                }}
                disabled={exchangeSaving}
                style={{
                  padding: '10px 24px', border: 'none', borderRadius: 0, fontSize: 14, fontWeight: 600,
                  cursor: exchangeSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  background: '#f59e0b', color: '#fff', opacity: exchangeSaving ? 0.6 : 1
                }}
              >{exchangeSaving ? 'Exchanging...' : 'Confirm Exchange'}</button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFrequency(f) {
  const map = { daily: 'Daily', '2x_daily': 'Twice Daily', '2x_weekly': '2x per week', weekly: 'Weekly', per_session: 'Per session' };
  return map[f] || f || '—';
}

// 90-Day Cycle Progress Card for peptide protocols
function CycleProgressCard({ protocol }) {
  const [cycleData, setCycleData] = useState(null);
  const [loading, setLoading] = useState(true);

  const medication = protocol?.primary_peptide || protocol?.medication || '';
  const cycleType = isRecoveryPeptide(medication) ? 'recovery' : isGHPeptide(medication) ? 'gh' : null;
  const maxDays = cycleType === 'gh' ? GH_CYCLE_MAX_DAYS : RECOVERY_CYCLE_MAX_DAYS;
  const offDays = cycleType === 'gh' ? GH_CYCLE_OFF_DAYS : RECOVERY_CYCLE_OFF_DAYS;
  const offLabel = cycleType === 'gh' ? '4-week' : '2-week';
  const cycleLabel = cycleType === 'gh' ? 'Growth Hormone Peptide Cycle' : 'Recovery Peptide Cycle';

  useEffect(() => {
    if (!protocol?.patient_id || !cycleType) { setLoading(false); return; }
    fetch(`/api/protocols/cycle-info?patientId=${protocol.patient_id}&cycleType=${cycleType}`)
      .then(r => r.json())
      .then(data => { if (data.success) setCycleData(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [protocol?.patient_id, cycleType]);

  if (!cycleType || loading || !cycleData?.hasCycle) return null;

  const { cycleDaysUsed, daysRemaining, cycleExhausted, offPeriodEnds, subProtocols, cycleStartDate } = cycleData;
  const pct = Math.min(100, Math.round((cycleDaysUsed / maxDays) * 100));
  const barColor = pct < 60 ? '#22c55e' : pct < 85 ? '#f59e0b' : '#ef4444';

  // Calculate cycle end date
  const cycleEnd = new Date(cycleStartDate + 'T12:00:00');
  cycleEnd.setDate(cycleEnd.getDate() + maxDays);
  const cycleEndStr = cycleEnd.toISOString().split('T')[0];

  return (
    <div style={cycleStyles.card}>
      <h2 style={cycleStyles.title}>🔄 {cycleLabel}</h2>

      {/* Big day counter */}
      <div style={{ textAlign: 'center', margin: '20px 0 12px' }}>
        <span style={{ fontSize: '56px', fontWeight: '700', color: barColor, lineHeight: 1 }}>{cycleDaysUsed}</span>
        <span style={{ fontSize: '20px', fontWeight: '500', color: '#9ca3af', marginLeft: '4px' }}>/ {maxDays}</span>
        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>days used in cycle</div>
      </div>

      {/* Progress bar */}
      <div style={cycleStyles.barBg}>
        <div style={{ ...cycleStyles.barFill, width: `${pct}%`, background: barColor }} />
      </div>

      {/* Dates row */}
      <div style={cycleStyles.dateRow}>
        <span>Started {formatDate(cycleStartDate)}</span>
        <span>Cycle ends {formatDate(cycleEndStr)}</span>
      </div>

      {/* Remaining */}
      <div style={{ fontSize: '14px', color: '#374151', marginTop: '12px', textAlign: 'center' }}>
        {cycleExhausted ? (
          <span style={{ color: '#ef4444', fontWeight: '600' }}>Cycle complete — {offLabel} off period recommended</span>
        ) : (
          <span><strong>{daysRemaining}</strong> days remaining in cycle</span>
        )}
      </div>

      {/* Off period end date */}
      {cycleExhausted && offPeriodEnds && (
        <div style={cycleStyles.offWarning}>
          Off period ends <strong>{formatDate(offPeriodEnds)}</strong>
        </div>
      )}

      {/* Sub-protocols in this cycle */}
      {subProtocols && subProtocols.length > 1 && (
        <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '16px', paddingTop: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>
            Protocols in this cycle
          </div>
          {subProtocols.map(sp => (
            <div key={sp.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', color: '#374151' }}>
              <span>{sp.medication}</span>
              <span style={{ color: '#6b7280' }}>{sp.days}d · {formatDate(sp.startDate)} — {formatDate(sp.endDate)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const cycleStyles = {
  card: {
    background: '#fff', borderRadius: 0, padding: '24px',
    marginBottom: '20px', border: '1px solid #e5e7eb'
  },
  title: {
    fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 4px'
  },
  barBg: {
    height: '12px', background: '#e5e7eb', borderRadius: 0,
    overflow: 'hidden', margin: '12px 0'
  },
  barFill: {
    height: '100%', borderRadius: 0, transition: 'width 0.3s ease'
  },
  dateRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '12px', color: '#6b7280'
  },
  offWarning: {
    marginTop: '8px', padding: '10px 14px', background: '#fef3c7',
    borderRadius: 0, fontSize: '13px', color: '#92400e', textAlign: 'center'
  }
};

const styles = {
  container: { minHeight: '100vh', background: '#f5f5f5', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
  loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loading: { color: '#666' },
  header: { background: '#000', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backLink: { color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' },
  title: { margin: '4px 0 0', fontSize: '20px', fontWeight: '600', color: '#fff' },
  subtitle: { margin: '2px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)' },
  headerActions: { display: 'flex', gap: '8px' },
  headerBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 0, textDecoration: 'none', fontSize: '13px', cursor: 'pointer' },
  editBtn: { padding: '8px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: 0, fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  saveBtn: { padding: '8px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 0, fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  errorAlert: { margin: '16px 24px 0', padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: 0, fontSize: '14px' },
  successAlert: { margin: '16px 24px 0', padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: 0, fontSize: '14px' },
  content: { padding: '24px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', maxWidth: '1200px' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  
  // Day Display
  dayCard: { background: '#fff', borderRadius: 0, padding: '32px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  dayLabel: { fontSize: '12px', fontWeight: '600', color: '#666', letterSpacing: '1px', marginBottom: '8px' },
  dayDisplay: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' },
  currentDay: { fontSize: '72px', fontWeight: '700', lineHeight: 1 },
  dayDivider: { fontSize: '48px', fontWeight: '300', color: '#ccc' },
  totalDays: { fontSize: '48px', fontWeight: '300', color: '#999' },
  dayStatus: { marginTop: '12px' },
  activeText: { fontSize: '16px', color: '#666' },
  completeText: { fontSize: '16px', color: '#22c55e', fontWeight: '600' },
  notStartedText: { fontSize: '16px', color: '#f59e0b' },
  
  // Calendar
  card: { background: '#fff', borderRadius: 0, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardTitle: { margin: '0 0 16px', fontSize: '15px', fontWeight: '600' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' },
  calendarDay: { minHeight: '90px', border: '2px solid', borderRadius: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '14px', padding: '6px 4px' },
  dayNumber: { fontWeight: '700', fontSize: '22px' },
  checkmark: { fontSize: '14px', marginTop: '2px' },
  todayLabel: { fontSize: '11px', fontWeight: '700', marginTop: '2px', letterSpacing: '0.5px' },
  legend: { display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px', fontSize: '12px', color: '#666' },
  legendDot: { display: 'inline-block', width: '12px', height: '12px', borderRadius: 0, background: '#22c55e', marginRight: '4px', verticalAlign: 'middle' },
  
  // Form
  section: { marginBottom: '20px' },
  sectionTitle: { fontSize: '11px', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '12px', fontWeight: '500', color: '#666', marginBottom: '4px' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: '14px', fontFamily: 'inherit' },
  select: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: '14px', background: '#fff' },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  typeBtn: { padding: '10px', border: '1px solid #ddd', borderRadius: 0, fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  
  // Details
  detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  detailItem: {},
  detailLabel: { fontSize: '11px', color: '#666', marginBottom: '2px' },
  detailValue: { fontSize: '14px', fontWeight: '500' },
  
  // Actions
  actionStack: { display: 'flex', flexDirection: 'column', gap: '8px' },
  actionBtn: { padding: '12px', background: '#000', color: '#fff', borderRadius: 0, textDecoration: 'none', textAlign: 'center', fontSize: '14px', fontWeight: '500' },
  actionBtnSecondary: { padding: '12px', background: '#f5f5f5', borderRadius: 0, textDecoration: 'none', textAlign: 'center', fontSize: '14px' },
  copyBtn: { width: '100%', padding: '12px', background: '#f5f5f5', border: '1px solid #e5e5e5', borderRadius: 0, fontSize: '14px', cursor: 'pointer' }
};
