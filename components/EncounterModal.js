// components/EncounterModal.js
// Encounter view modal — shows appointment details, encounter notes, prescriptions

import { useState, useEffect, useRef } from 'react';
import { NOTE_TYPES, ENCOUNTER_TEMPLATES, getTemplateForService } from '../lib/encounter-templates';

// Users allowed to create/edit/sign encounter notes
const NOTE_AUTHORS = ['burgess@range-medical.com', 'lily@range-medical.com', 'evan@range-medical.com'];

export default function EncounterModal({ appointment, currentUser, onClose, onRefresh }) {
  // Check if current user can author notes
  const canAuthorNotes = NOTE_AUTHORS.some(email => currentUser?.toLowerCase()?.includes(email));

  // Notes state
  const [encounterNotes, setEncounterNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [noteType, setNoteType] = useState('soap');
  const [noteFormatting, setNoteFormatting] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Edit draft state
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteInput, setEditNoteInput] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Addendum state
  const [addendumParentId, setAddendumParentId] = useState(null);
  const [addendumInput, setAddendumInput] = useState('');
  const [addendumSaving, setAddendumSaving] = useState(false);

  // Appointment status
  const [status, setStatus] = useState(appointment?.status || 'scheduled');
  const [savingStatus, setSavingStatus] = useState(false);

  // Prescriptions state (scaffolding)
  const [prescriptions, setPrescriptions] = useState([]);
  const [showRxForm, setShowRxForm] = useState(false);
  const [rxForm, setRxForm] = useState({ medication_name: '', strength: '', form: '', quantity: '', sig: '', refills: 0, days_supply: '', is_controlled: false, schedule: '', category: '' });
  const [rxSaving, setRxSaving] = useState(false);

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Vitals state
  const [vitals, setVitals] = useState({ height_inches: '', weight_lbs: '', bp_systolic: '', bp_diastolic: '', temperature: '', pulse: '', respiratory_rate: '', o2_saturation: '' });
  const [vitalsLoading, setVitalsLoading] = useState(true);
  const [vitalsSaved, setVitalsSaved] = useState(false);
  const [vitalsExpanded, setVitalsExpanded] = useState(false);
  const vitalsTimerRef = useRef(null);

  const handleDeleteAppointment = async () => {
    if (!appointment?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
        onClose();
      }
    } catch (err) {
      console.error('Delete appointment error:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Active section
  const [activeSection, setActiveSection] = useState('notes');

  // Determine template from service name
  const templateKey = getTemplateForService(appointment?.service_name || appointment?.appointment_title || '');
  const template = ENCOUNTER_TEMPLATES[templateKey] || ENCOUNTER_TEMPLATES.general;

  // Set default note type from template
  useEffect(() => {
    if (template.defaultNoteType) {
      setNoteType(template.defaultNoteType);
    }
  }, [template.defaultNoteType]);

  // Fetch encounter notes
  useEffect(() => {
    if (!appointment?.id) return;
    setLoadingNotes(true);
    fetch(`/api/notes/by-appointment?appointment_id=${appointment.id}`)
      .then(r => r.json())
      .then(data => {
        setEncounterNotes(data.notes || []);
        setLoadingNotes(false);
      })
      .catch(() => setLoadingNotes(false));
  }, [appointment?.id]);

  // Fetch prescriptions for this encounter
  useEffect(() => {
    if (!appointment?.id || !appointment?.patient_id) return;
    fetch(`/api/prescriptions?appointment_id=${appointment.id}&patient_id=${appointment.patient_id || ''}`)
      .then(r => r.ok ? r.json() : { prescriptions: [] })
      .then(data => setPrescriptions(data.prescriptions || []))
      .catch(() => {});
  }, [appointment?.id, appointment?.patient_id]);

  // Fetch vitals for this encounter + last known height
  useEffect(() => {
    if (!appointment?.id) { setVitalsLoading(false); return; }
    setVitalsLoading(true);
    fetch(`/api/vitals/by-appointment?appointment_id=${appointment.id}&patient_id=${appointment.patient_id || ''}`)
      .then(r => r.json())
      .then(data => {
        if (data.vitals) {
          setVitals({
            height_inches: data.vitals.height_inches ?? '',
            weight_lbs: data.vitals.weight_lbs ?? '',
            bp_systolic: data.vitals.bp_systolic ?? '',
            bp_diastolic: data.vitals.bp_diastolic ?? '',
            temperature: data.vitals.temperature ?? '',
            pulse: data.vitals.pulse ?? '',
            respiratory_rate: data.vitals.respiratory_rate ?? '',
            o2_saturation: data.vitals.o2_saturation ?? '',
          });
          setVitalsExpanded(true);
        } else if (data.lastHeight) {
          setVitals(v => ({ ...v, height_inches: data.lastHeight }));
        }
        setVitalsLoading(false);
      })
      .catch(() => setVitalsLoading(false));
  }, [appointment?.id, appointment?.patient_id]);

  // Height helpers: parse "5'10" or "70" → inches, inches → display string
  const parseHeight = (input) => {
    if (!input && input !== 0) return null;
    const str = String(input).trim();
    const ftIn = str.match(/^(\d+)[''′]\s*(\d+)?[""″]?$/);
    if (ftIn) return parseInt(ftIn[1]) * 12 + (parseInt(ftIn[2]) || 0);
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  };
  const formatHeight = (inches) => {
    if (!inches) return '';
    const ft = Math.floor(inches / 12);
    const inc = Math.round(inches % 12);
    return `${ft}'${inc}"`;
  };
  const calcBMI = (hIn, wLbs) => {
    const h = parseFloat(hIn);
    const w = parseFloat(wLbs);
    if (!h || !w || h <= 0) return null;
    return Math.round((w / (h * h)) * 703 * 10) / 10;
  };

  // Auto-save vitals (debounced)
  const saveVitals = (updatedVitals) => {
    if (vitalsTimerRef.current) clearTimeout(vitalsTimerRef.current);
    vitalsTimerRef.current = setTimeout(async () => {
      // Only save if at least one field has a value
      const vals = Object.values(updatedVitals);
      const hasData = vals.some(v => v !== '' && v !== null && v !== undefined);
      if (!hasData || !appointment?.patient_id) return;

      try {
        const res = await fetch('/api/vitals/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: appointment.patient_id,
            appointment_id: appointment.id,
            ...updatedVitals,
            recorded_by: currentUser
          })
        });
        if (res.ok) {
          setVitalsSaved(true);
          setTimeout(() => setVitalsSaved(false), 2000);
        }
      } catch (e) {
        console.error('Vitals save error:', e);
      }
    }, 1000);
  };

  const updateVital = (field, value) => {
    const updated = { ...vitals, [field]: value };
    setVitals(updated);
    saveVitals(updated);
  };

  // Dictation handlers
  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is not supported in this browser. Please use Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setNoteInput(prev => prev + finalTranscript);
      }
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleDictation = () => {
    if (isRecording) stopDictation();
    else startDictation();
  };

  // AI format
  const handleFormat = async () => {
    if (!noteInput.trim()) return;
    setNoteFormatting(true);
    try {
      // Include vitals so AI can place them in OBJECTIVE section of SOAP notes
      const vitalsPayload = {};
      if (vitals.height_inches) vitalsPayload.height_inches = vitals.height_inches;
      if (vitals.weight_lbs) vitalsPayload.weight_lbs = vitals.weight_lbs;
      if (vitals.height_inches && vitals.weight_lbs) vitalsPayload.bmi = calcBMI(vitals.height_inches, vitals.weight_lbs);
      if (vitals.bp_systolic) vitalsPayload.bp_systolic = vitals.bp_systolic;
      if (vitals.bp_diastolic) vitalsPayload.bp_diastolic = vitals.bp_diastolic;
      if (vitals.temperature) vitalsPayload.temperature = vitals.temperature;
      if (vitals.pulse) vitalsPayload.pulse = vitals.pulse;
      if (vitals.respiratory_rate) vitalsPayload.respiratory_rate = vitals.respiratory_rate;
      if (vitals.o2_saturation) vitalsPayload.o2_saturation = vitals.o2_saturation;

      const res = await fetch('/api/notes/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: noteInput,
          note_type: noteType,
          vitals: Object.keys(vitalsPayload).length > 0 ? vitalsPayload : undefined
        }),
      });
      const data = await res.json();
      if (data.formatted) {
        setNoteInput(data.formatted);
      }
    } catch (err) {
      console.error('Format error:', err);
    } finally {
      setNoteFormatting(false);
    }
  };

  // Save note
  const handleSaveNote = async () => {
    if (!noteInput.trim()) return;
    setNoteSaving(true);
    try {
      const res = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: appointment.patient_id,
          body: noteInput,
          raw_input: noteInput,
          created_by: currentUser,
          appointment_id: appointment.id,
          encounter_service: appointment.service_name || appointment.appointment_title || '',
        }),
      });
      const data = await res.json();
      if (data.note) {
        setEncounterNotes(prev => [...prev, data.note]);
        setNoteInput('');
        setShowNoteForm(false);
        stopDictation();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Save note error:', err);
    } finally {
      setNoteSaving(false);
    }
  };

  // Sign note
  const handleSignNote = async (noteId) => {
    if (!confirm('Sign and lock this note? It will become read-only. You can add addendums after signing.')) return;
    try {
      const res = await fetch('/api/notes/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId, signed_by: currentUser }),
      });
      const data = await res.json();
      if (data.success) {
        setEncounterNotes(prev => prev.map(n => n.id === noteId ? { ...n, status: 'signed', signed_by: currentUser, signed_at: new Date().toISOString() } : n));
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Failed to sign note');
      }
    } catch (err) {
      console.error('Sign error:', err);
    }
  };

  // Edit draft note
  const handleEditSave = async () => {
    if (!editNoteInput.trim() || !editingNoteId) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/notes/${editingNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editNoteInput, requesting_user: currentUser }),
      });
      const data = await res.json();
      if (data.success) {
        setEncounterNotes(prev => prev.map(n => n.id === editingNoteId ? { ...n, body: editNoteInput } : n));
        setEditingNoteId(null);
        setEditNoteInput('');
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Failed to save edit');
      }
    } catch (err) {
      console.error('Edit save error:', err);
    } finally {
      setEditSaving(false);
    }
  };

  // Save addendum
  const handleSaveAddendum = async () => {
    if (!addendumInput.trim() || !addendumParentId) return;
    setAddendumSaving(true);
    try {
      const res = await fetch('/api/notes/addendum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_note_id: addendumParentId,
          patient_id: appointment.patient_id,
          body: addendumInput,
          raw_input: addendumInput,
          created_by: currentUser,
          appointment_id: appointment.id,
        }),
      });
      const data = await res.json();
      if (data.note) {
        setEncounterNotes(prev => [...prev, data.note]);
        setAddendumInput('');
        setAddendumParentId(null);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Addendum error:', err);
    } finally {
      setAddendumSaving(false);
    }
  };

  // Save prescription (draft)
  const handleSaveRx = async () => {
    if (!rxForm.medication_name.trim()) return;
    setRxSaving(true);
    try {
      const res = await fetch('/api/prescriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rxForm,
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          created_by: currentUser,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.prescription) {
          setPrescriptions(prev => [...prev, data.prescription]);
        }
        setRxForm({ medication_name: '', strength: '', form: '', quantity: '', sig: '', refills: 0, days_supply: '', is_controlled: false, schedule: '', category: '' });
        setShowRxForm(false);
      }
    } catch (err) {
      console.error('Save Rx error:', err);
    } finally {
      setRxSaving(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const formatShortDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusConfig = {
    scheduled: { bg: '#dbeafe', color: '#1e40af', label: 'Scheduled' },
    confirmed: { bg: '#d1fae5', color: '#065f46', label: 'Confirmed' },
    checked_in: { bg: '#fef9c3', color: '#854d0e', label: 'Checked In' },
    in_progress: { bg: '#e0e7ff', color: '#3730a3', label: 'In Progress' },
    completed: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
    no_show: { bg: '#fee2e2', color: '#991b1b', label: 'No Show' },
  };

  const sc = statusConfig[status] || { bg: '#f3f4f6', color: '#374151', label: status };

  return (
    <>
      <style jsx>{`
        .enc-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          animation: encFadeIn 0.2s ease-out;
        }
        @keyframes encFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes encSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes encPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .enc-modal {
          background: #fff; border-radius: 16px; width: 95vw; max-width: 800px;
          max-height: 92vh; display: flex; flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          animation: encSlideUp 0.25s ease-out;
          overflow: hidden;
        }
        .enc-header {
          padding: 20px 24px 16px; display: flex; align-items: flex-start; justify-content: space-between;
          border-bottom: 1px solid #f0f0f0;
        }
        .enc-title { font-size: 20px; font-weight: 700; color: #111; margin: 0; letter-spacing: -0.3px; }
        .enc-subtitle { font-size: 13px; color: #6b7280; margin-top: 3px; }
        .enc-close {
          width: 32px; height: 32px; border-radius: 8px; border: none; background: #f3f4f6;
          font-size: 18px; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .enc-close:hover { background: #e5e7eb; color: #111; }
        .enc-details {
          padding: 12px 24px; background: #fafbfc; border-bottom: 1px solid #f0f0f0;
          display: flex; gap: 20px; align-items: center; flex-wrap: wrap;
        }
        .enc-detail-item { font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 6px; }
        .enc-detail-label { font-weight: 600; color: #374151; }
        .enc-status-badge {
          padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
          letter-spacing: 0.02em; text-transform: capitalize;
        }
        .enc-template-badge {
          padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
          background: #f3f0ff; color: #6d28d9; letter-spacing: 0.02em;
        }
        /* Vitals */
        .enc-vitals {
          padding: 0; border-bottom: 1px solid #f0f0f0; background: #f8fafc;
        }
        .enc-vitals-header {
          display: flex; align-items: center; gap: 10px; padding: 10px 24px;
          cursor: pointer; user-select: none;
        }
        .enc-vitals-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
          color: #374151; flex-shrink: 0;
        }
        .enc-vitals-summary {
          font-size: 12px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .enc-vitals-toggle {
          margin-left: auto; font-size: 11px; color: #16a34a; font-weight: 600; flex-shrink: 0;
        }
        .enc-vitals-form {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
          padding: 0 24px 14px;
        }
        .enc-vitals-field label {
          display: block; font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 3px;
        }
        .enc-vitals-field input {
          width: 100%; padding: 6px 10px; font-size: 13px; border: 1.5px solid #e5e7eb;
          border-radius: 6px; font-family: inherit; background: #fff;
          box-sizing: border-box;
        }
        .enc-vitals-field input:focus {
          outline: none; border-color: #111; box-shadow: 0 0 0 2px rgba(0,0,0,0.06);
        }
        .enc-vitals-bmi {
          font-size: 11px; color: #6b7280; margin-top: 2px;
        }
        @media (max-width: 600px) {
          .enc-vitals-form { grid-template-columns: repeat(2, 1fr); }
        }
        .enc-tabs {
          display: flex; gap: 0; padding: 0 24px; border-bottom: 1px solid #f0f0f0; background: #fff;
        }
        .enc-tab {
          padding: 12px 20px; font-size: 13px; font-weight: 600; border: none; background: none;
          cursor: pointer; position: relative; color: #9ca3af; transition: color 0.15s;
        }
        .enc-tab:hover { color: #6b7280; }
        .enc-tab.active { color: #111; }
        .enc-tab.active::after {
          content: ''; position: absolute; bottom: -1px; left: 12px; right: 12px;
          height: 2px; background: #111; border-radius: 2px 2px 0 0;
        }
        .enc-tab-count {
          margin-left: 6px; font-size: 11px; padding: 1px 7px; border-radius: 10px;
          font-weight: 700; background: #f3f4f6; color: #6b7280;
        }
        .enc-tab.active .enc-tab-count { background: #111; color: #fff; }
        .enc-body { flex: 1; overflow-y: auto; padding: 20px 24px; }

        /* Note cards */
        .enc-note-card {
          margin-bottom: 12px; padding: 16px 18px; border: 1px solid #eee; border-radius: 10px;
          background: #fff; transition: box-shadow 0.15s;
        }
        .enc-note-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .enc-note-card.addendum { background: #fffef5; border-color: #fde68a; }
        .enc-note-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .enc-note-meta { font-size: 12px; color: #9ca3af; display: flex; align-items: center; gap: 8px; }
        .enc-note-body { white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #1f2937; }
        .enc-note-actions { display: flex; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #f5f5f5; }

        /* Badges */
        .badge-signed { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #ecfdf5; color: #059669; }
        .badge-draft { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #f3f4f6; color: #6b7280; }
        .badge-addendum { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #fef3c7; color: #b45309; }

        /* Buttons */
        .enc-btn {
          padding: 7px 14px; font-size: 13px; font-weight: 600; border-radius: 8px;
          border: none; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px;
        }
        .enc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .enc-btn-primary { background: #111; color: #fff; }
        .enc-btn-primary:hover:not(:disabled) { background: #333; }
        .enc-btn-secondary { background: #fff; color: #374151; border: 1px solid #d1d5db; }
        .enc-btn-secondary:hover:not(:disabled) { background: #f9fafb; border-color: #9ca3af; }
        .enc-btn-sign { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .enc-btn-sign:hover { background: #d1fae5; }
        .enc-btn-ghost { background: none; color: #6b7280; border: 1px solid #e5e7eb; }
        .enc-btn-ghost:hover { background: #f9fafb; color: #374151; }
        .enc-btn-ai {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff; border: none;
        }
        .enc-btn-ai:hover:not(:disabled) { opacity: 0.9; }
        .enc-btn-sm { padding: 5px 10px; font-size: 12px; border-radius: 6px; }

        /* Note form */
        .enc-form-card {
          margin-top: 16px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;
          background: #fafbfc;
        }
        .enc-form-title {
          font-size: 15px; font-weight: 700; color: #111; margin: 0 0 16px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .enc-form-label { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }

        /* Note type pills */
        .enc-type-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
        .enc-type-pill {
          padding: 6px 14px; font-size: 12px; font-weight: 600; border-radius: 20px;
          border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280;
          cursor: pointer; transition: all 0.15s;
        }
        .enc-type-pill:hover { border-color: #9ca3af; color: #374151; }
        .enc-type-pill.active {
          background: #111; color: #fff; border-color: #111;
        }

        /* Quick notes */
        .enc-quick-notes { display: flex; gap: 6px; flex-wrap: wrap; }
        .enc-quick-note {
          padding: 4px 12px; font-size: 12px; border-radius: 16px;
          border: 1px solid #e5e7eb; background: #fff; color: #374151;
          cursor: pointer; transition: all 0.15s;
        }
        .enc-quick-note:hover { background: #f0f0f0; border-color: #d1d5db; }

        /* Textarea */
        .enc-textarea-wrap { position: relative; margin-bottom: 14px; }
        .enc-textarea {
          width: 100%; min-height: 180px; resize: vertical; font-family: inherit; font-size: 14px;
          line-height: 1.7; padding: 14px 50px 14px 16px; border-radius: 10px;
          border: 1.5px solid #e5e7eb; background: #fff; color: #111;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .enc-textarea:focus {
          outline: none; border-color: #111; box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
        }
        .enc-textarea::placeholder { color: #c5c5c5; }
        .enc-mic-btn {
          position: absolute; right: 12px; top: 12px; width: 34px; height: 34px;
          border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center;
          font-size: 16px; cursor: pointer; transition: all 0.15s;
        }
        .enc-mic-btn.idle { background: #f3f4f6; color: #6b7280; }
        .enc-mic-btn.idle:hover { background: #e5e7eb; }
        .enc-mic-btn.recording { background: #dc2626; color: #fff; animation: encPulse 1.5s infinite; }
        .enc-recording-bar {
          display: flex; align-items: center; gap: 8px; padding: 8px 14px; margin: -10px 0 14px;
          background: #fef2f2; border-radius: 8px; font-size: 13px; color: #dc2626; font-weight: 500;
        }
        .enc-recording-dot { width: 8px; height: 8px; border-radius: 50%; background: #dc2626; animation: encPulse 1s infinite; }

        /* Action row */
        .enc-actions { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .enc-actions-right { display: flex; gap: 8px; }

        /* Empty state */
        .enc-empty { text-align: center; padding: 40px 20px; }
        .enc-empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.3; }
        .enc-empty-text { font-size: 14px; color: #9ca3af; margin-bottom: 16px; }

        /* Addendum inline */
        .enc-addendum-form {
          margin-top: 14px; padding: 14px; background: #fffef5; border-radius: 8px; border: 1px solid #fde68a;
        }
        .enc-addendum-label { font-size: 12px; font-weight: 600; color: #b45309; margin-bottom: 8px; }
        .enc-addendum-textarea {
          width: 100%; resize: vertical; font-family: inherit; font-size: 14px; line-height: 1.6;
          padding: 10px 14px; border-radius: 8px; border: 1.5px solid #fde68a; background: #fff; min-height: 80px;
        }
        .enc-addendum-textarea:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
        .enc-addendum-actions { display: flex; gap: 8px; margin-top: 10px; }

        /* Rx section */
        .enc-rx-card {
          margin-bottom: 10px; padding: 14px 16px; border: 1px solid #eee; border-radius: 10px;
          background: #fff; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
        }
        .enc-rx-name { font-size: 14px; font-weight: 600; color: #111; }
        .enc-rx-detail { font-size: 13px; color: #6b7280; margin-top: 2px; }
        .enc-rx-meta { font-size: 12px; color: #9ca3af; margin-top: 4px; display: flex; gap: 12px; flex-wrap: wrap; }
        .enc-rx-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .enc-rx-form-grid .form-group label { font-size: 12px; font-weight: 600; color: #6b7280; display: block; margin-bottom: 4px; }
        .enc-rx-form-grid .form-group input,
        .enc-rx-form-grid .form-group select {
          width: 100%; padding: 8px 12px; font-size: 13px; border: 1.5px solid #e5e7eb; border-radius: 8px;
          font-family: inherit; transition: border-color 0.15s;
        }
        .enc-rx-form-grid .form-group input:focus,
        .enc-rx-form-grid .form-group select:focus {
          outline: none; border-color: #111; box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
        }
        .enc-warning-bar {
          display: flex; align-items: center; gap: 8px; padding: 10px 14px;
          background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;
          font-size: 13px; color: #92400e; margin-bottom: 16px;
        }
        .enc-controlled-alert {
          margin-top: 10px; padding: 10px 14px; background: #fef2f2; border-radius: 8px;
          border: 1px solid #fecaca; font-size: 12px; color: #991b1b;
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
      `}</style>

      <div className="enc-overlay" onClick={onClose}>
        <div className="enc-modal" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="enc-header">
            <div>
              <h3 className="enc-title">Encounter</h3>
              <div className="enc-subtitle">
                {appointment?.service_name || appointment?.appointment_title || 'Appointment'} — {formatDate(appointment?.start_time)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Delete appointment"
                  style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 600, border: '1px solid #fca5a5', borderRadius: '6px', background: '#fff', color: '#dc2626', cursor: 'pointer' }}
                >
                  Delete
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>Delete?</span>
                  <button
                    onClick={handleDeleteAppointment}
                    disabled={deleting}
                    style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 600, border: 'none', borderRadius: '6px', background: '#dc2626', color: '#fff', cursor: 'pointer' }}
                  >
                    {deleting ? '...' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 600, border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', color: '#374151', cursor: 'pointer' }}
                  >
                    No
                  </button>
                </div>
              )}
              <button onClick={onClose} className="enc-close">×</button>
            </div>
          </div>

          {/* Appointment Details Bar */}
          <div className="enc-details">
            {appointment?.provider && (
              <div className="enc-detail-item">
                <span className="enc-detail-label">Provider</span>
                <span>{appointment.provider}</span>
              </div>
            )}
            {appointment?.location && (
              <div className="enc-detail-item">
                <span className="enc-detail-label">Location</span>
                <span>{appointment.location}</span>
              </div>
            )}
            <div className="enc-detail-item">
              <span className="enc-status-badge" style={{ background: sc.bg, color: sc.color }}>
                {sc.label}
              </span>
            </div>
            {template.label !== 'General' && (
              <span className="enc-template-badge">{template.label}</span>
            )}
          </div>

          {/* Vitals Section */}
          <div className="enc-vitals">
            <div className="enc-vitals-header" onClick={() => setVitalsExpanded(!vitalsExpanded)}>
              <span className="enc-vitals-label">Vitals</span>
              {!vitalsExpanded && !vitalsLoading && (
                <span className="enc-vitals-summary">
                  {vitals.height_inches ? `Ht ${formatHeight(vitals.height_inches)}` : ''}
                  {vitals.weight_lbs ? `${vitals.height_inches ? ' · ' : ''}Wt ${vitals.weight_lbs} lb` : ''}
                  {(vitals.height_inches && vitals.weight_lbs) ? ` · BMI ${calcBMI(vitals.height_inches, vitals.weight_lbs) || '—'}` : ''}
                  {(vitals.bp_systolic && vitals.bp_diastolic) ? ` · BP ${vitals.bp_systolic}/${vitals.bp_diastolic}` : ''}
                  {vitals.pulse ? ` · HR ${vitals.pulse}` : ''}
                  {vitals.temperature ? ` · ${vitals.temperature}°F` : ''}
                  {vitals.respiratory_rate ? ` · RR ${vitals.respiratory_rate}` : ''}
                  {vitals.o2_saturation ? ` · SpO2 ${vitals.o2_saturation}%` : ''}
                  {!vitals.height_inches && !vitals.weight_lbs && !vitals.bp_systolic && !vitals.pulse ? 'No vitals recorded' : ''}
                </span>
              )}
              <span className="enc-vitals-toggle">{vitalsSaved ? '✓ Saved' : (vitalsExpanded ? '▲' : '▼')}</span>
            </div>
            {vitalsExpanded && !vitalsLoading && (
              <div className="enc-vitals-form">
                <div className="enc-vitals-field">
                  <label>Height</label>
                  <input
                    type="text"
                    placeholder={`5'10"`}
                    value={vitals.height_inches ? formatHeight(vitals.height_inches) : ''}
                    onChange={e => {
                      const parsed = parseHeight(e.target.value);
                      if (parsed !== null) updateVital('height_inches', parsed);
                      else setVitals(v => ({ ...v, height_inches: '' }));
                    }}
                    onBlur={e => {
                      const parsed = parseHeight(e.target.value);
                      if (parsed !== null) updateVital('height_inches', parsed);
                    }}
                  />
                </div>
                <div className="enc-vitals-field">
                  <label>Weight (lbs)</label>
                  <input type="number" step="0.1" placeholder="185" value={vitals.weight_lbs} onChange={e => updateVital('weight_lbs', e.target.value)} />
                  {vitals.height_inches && vitals.weight_lbs && (
                    <div className="enc-vitals-bmi">BMI: {calcBMI(vitals.height_inches, vitals.weight_lbs) || '—'}</div>
                  )}
                </div>
                <div className="enc-vitals-field enc-vitals-bp">
                  <label>BP (mmHg)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="number" placeholder="120" value={vitals.bp_systolic} onChange={e => updateVital('bp_systolic', e.target.value)} style={{ width: '48%' }} />
                    <span style={{ color: '#9ca3af', fontWeight: 600 }}>/</span>
                    <input type="number" placeholder="80" value={vitals.bp_diastolic} onChange={e => updateVital('bp_diastolic', e.target.value)} style={{ width: '48%' }} />
                  </div>
                </div>
                <div className="enc-vitals-field">
                  <label>Temp (°F)</label>
                  <input type="number" step="0.1" placeholder="98.6" value={vitals.temperature} onChange={e => updateVital('temperature', e.target.value)} />
                </div>
                <div className="enc-vitals-field">
                  <label>Pulse (bpm)</label>
                  <input type="number" placeholder="72" value={vitals.pulse} onChange={e => updateVital('pulse', e.target.value)} />
                </div>
                <div className="enc-vitals-field">
                  <label>Resp. Rate</label>
                  <input type="number" placeholder="16" value={vitals.respiratory_rate} onChange={e => updateVital('respiratory_rate', e.target.value)} />
                </div>
                <div className="enc-vitals-field">
                  <label>O2 Sat (%)</label>
                  <input type="number" step="0.1" placeholder="98" value={vitals.o2_saturation} onChange={e => updateVital('o2_saturation', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Section Tabs */}
          <div className="enc-tabs">
            {[
              { key: 'notes', label: 'Encounter Notes', count: encounterNotes.length },
              { key: 'prescriptions', label: 'Prescriptions', count: prescriptions.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`enc-tab${activeSection === tab.key ? ' active' : ''}`}
              >
                {tab.label}
                {tab.count > 0 && <span className="enc-tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* Scrollable Content */}
          <div className="enc-body">
            {/* ===== NOTES SECTION ===== */}
            {activeSection === 'notes' && (
              <>
                {loadingNotes ? (
                  <div className="enc-empty">
                    <div style={{ color: '#9ca3af', fontSize: 14 }}>Loading notes...</div>
                  </div>
                ) : encounterNotes.length === 0 && !showNoteForm ? (
                  <div className="enc-empty">
                    <div className="enc-empty-icon">📋</div>
                    <div className="enc-empty-text">No encounter notes yet</div>
                    {canAuthorNotes && (
                      <button onClick={() => setShowNoteForm(true)} className="enc-btn enc-btn-primary">
                        + Add Encounter Note
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Existing notes */}
                    {encounterNotes.map(note => (
                      <div key={note.id} className={`enc-note-card${note.source === 'addendum' ? ' addendum' : ''}`}>
                        <div className="enc-note-header">
                          <div className="enc-note-meta">
                            <span>{formatShortDate(note.note_date || note.created_at)}</span>
                            {note.created_by && <span style={{ color: '#6b7280' }}>by {note.created_by}</span>}
                            {note.source === 'addendum' && <span className="badge-addendum">Addendum</span>}
                          </div>
                          <span className={note.status === 'signed' ? 'badge-signed' : 'badge-draft'}>
                            {note.status === 'signed'
                              ? `✓ Signed${note.signed_by ? ` by ${note.signed_by}` : ''}`
                              : 'Draft'}
                          </span>
                        </div>

                        {/* Note body — editable if this is the draft being edited */}
                        {editingNoteId === note.id ? (
                          <div>
                            <textarea
                              value={editNoteInput}
                              onChange={e => setEditNoteInput(e.target.value)}
                              className="enc-textarea"
                              style={{ minHeight: 120 }}
                            />
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              <button onClick={handleEditSave} disabled={!editNoteInput.trim() || editSaving} className="enc-btn enc-btn-primary enc-btn-sm">
                                {editSaving ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button onClick={() => { setEditingNoteId(null); setEditNoteInput(''); }} className="enc-btn enc-btn-secondary enc-btn-sm">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="enc-note-body">{note.body}</div>
                        )}

                        {/* Note actions — hide while editing, only for authorized users */}
                        {editingNoteId !== note.id && canAuthorNotes && (
                          <div className="enc-note-actions">
                            {note.status !== 'signed' && note.created_by === currentUser && (
                              <>
                                <button onClick={() => { setEditingNoteId(note.id); setEditNoteInput(note.body); }} className="enc-btn enc-btn-secondary enc-btn-sm">
                                  ✏️ Edit
                                </button>
                                <button onClick={() => handleSignNote(note.id)} className="enc-btn enc-btn-sign enc-btn-sm">
                                  ✍ Sign & Lock
                                </button>
                              </>
                            )}
                            {note.status === 'signed' && (
                              <button onClick={() => setAddendumParentId(note.id)} className="enc-btn enc-btn-ghost enc-btn-sm">
                                + Add Addendum
                              </button>
                            )}
                          </div>
                        )}

                        {/* Addendum form inline */}
                        {addendumParentId === note.id && (
                          <div className="enc-addendum-form">
                            <div className="enc-addendum-label">Addendum to signed note</div>
                            <textarea
                              value={addendumInput}
                              onChange={e => setAddendumInput(e.target.value)}
                              rows={3}
                              placeholder="Type addendum..."
                              className="enc-addendum-textarea"
                            />
                            <div className="enc-addendum-actions">
                              <button onClick={handleSaveAddendum} disabled={!addendumInput.trim() || addendumSaving} className="enc-btn enc-btn-primary enc-btn-sm">
                                {addendumSaving ? 'Saving...' : 'Save Addendum'}
                              </button>
                              <button onClick={() => { setAddendumParentId(null); setAddendumInput(''); }} className="enc-btn enc-btn-secondary enc-btn-sm">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add note button */}
                    {!showNoteForm && canAuthorNotes && (
                      <button onClick={() => setShowNoteForm(true)} className="enc-btn enc-btn-primary" style={{ marginTop: 8 }}>
                        + Add Encounter Note
                      </button>
                    )}
                  </>
                )}

                {/* Note creation form */}
                {showNoteForm && canAuthorNotes && (
                  <div className="enc-form-card">
                    <div className="enc-form-title">
                      <span>New Encounter Note</span>
                      <button onClick={() => { setShowNoteForm(false); setNoteInput(''); stopDictation(); }} className="enc-close" style={{ width: 28, height: 28, fontSize: 16 }}>×</button>
                    </div>

                    {/* Note type selector */}
                    <div style={{ marginBottom: 16 }}>
                      <div className="enc-form-label">Note Type</div>
                      <div className="enc-type-pills">
                        {Object.entries(NOTE_TYPES).map(([key, type]) => (
                          <button
                            key={key}
                            onClick={() => setNoteType(key)}
                            className={`enc-type-pill${noteType === key ? ' active' : ''}`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{NOTE_TYPES[noteType]?.description}</div>
                    </div>

                    {/* Quick notes */}
                    {template.quickNotes && template.quickNotes.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div className="enc-form-label">Quick Notes</div>
                        <div className="enc-quick-notes">
                          {template.quickNotes.map((qn, i) => (
                            <button key={i} onClick={() => setNoteInput(prev => prev + (prev ? '\n' : '') + qn)} className="enc-quick-note">
                              + {qn}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Textarea with dictation */}
                    <div className="enc-textarea-wrap">
                      <textarea
                        value={noteInput}
                        onChange={e => setNoteInput(e.target.value)}
                        placeholder="Type your encounter note here, or click the microphone to dictate..."
                        className="enc-textarea"
                      />
                      <button onClick={toggleDictation} type="button" className={`enc-mic-btn ${isRecording ? 'recording' : 'idle'}`} title={isRecording ? 'Stop dictation' : 'Start dictation'}>
                        🎤
                      </button>
                    </div>
                    {isRecording && (
                      <div className="enc-recording-bar">
                        <span className="enc-recording-dot" />
                        Recording — Click microphone to stop
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="enc-actions">
                      <button onClick={handleFormat} disabled={!noteInput.trim() || noteFormatting} className="enc-btn enc-btn-ai">
                        {noteFormatting ? 'Formatting...' : '✨ Format with AI'}
                      </button>
                      <div className="enc-actions-right">
                        <button onClick={() => { setShowNoteForm(false); setNoteInput(''); stopDictation(); }} className="enc-btn enc-btn-secondary">Cancel</button>
                        <button onClick={handleSaveNote} disabled={!noteInput.trim() || noteSaving} className="enc-btn enc-btn-primary">
                          {noteSaving ? 'Saving...' : 'Save as Draft'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ===== PRESCRIPTIONS SECTION (Scaffolding) ===== */}
            {activeSection === 'prescriptions' && (
              <>
                <div className="enc-warning-bar">
                  <span>⚠️</span>
                  <span>e-Prescribing is not yet active. Prescriptions saved here are drafts only.</span>
                </div>

                {prescriptions.length === 0 && !showRxForm ? (
                  <div className="enc-empty">
                    <div className="enc-empty-icon">💊</div>
                    <div className="enc-empty-text">No prescriptions for this encounter</div>
                    <button onClick={() => setShowRxForm(true)} className="enc-btn enc-btn-primary">
                      + Add Prescription
                    </button>
                  </div>
                ) : (
                  <>
                    {prescriptions.map(rx => (
                      <div key={rx.id} className="enc-rx-card">
                        <div style={{ flex: 1 }}>
                          <div className="enc-rx-name">
                            {rx.medication_name}
                            {rx.strength && <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 6 }}>{rx.strength}</span>}
                            {rx.form && <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>({rx.form})</span>}
                          </div>
                          {rx.sig && <div className="enc-rx-detail">Sig: {rx.sig}</div>}
                          <div className="enc-rx-meta">
                            {rx.quantity && <span>Qty: {rx.quantity}</span>}
                            {rx.refills > 0 && <span>Refills: {rx.refills}</span>}
                            {rx.days_supply && <span>Days: {rx.days_supply}</span>}
                            {rx.is_controlled && <span style={{ color: '#dc2626' }}>Schedule {rx.schedule || 'N/A'}</span>}
                          </div>
                        </div>
                        <span className="badge-draft">Draft</span>
                      </div>
                    ))}
                    {!showRxForm && (
                      <button onClick={() => setShowRxForm(true)} className="enc-btn enc-btn-primary" style={{ marginTop: 8 }}>
                        + Add Prescription
                      </button>
                    )}
                  </>
                )}

                {/* Rx Form */}
                {showRxForm && (
                  <div className="enc-form-card">
                    <div className="enc-form-title">
                      <span>New Prescription (Draft)</span>
                      <button onClick={() => setShowRxForm(false)} className="enc-close" style={{ width: 28, height: 28, fontSize: 16 }}>×</button>
                    </div>
                    <div className="enc-rx-form-grid">
                      <div className="form-group">
                        <label>Medication Name *</label>
                        <input type="text" value={rxForm.medication_name} onChange={e => setRxForm(p => ({ ...p, medication_name: e.target.value }))} placeholder="e.g., Testosterone Cypionate" />
                      </div>
                      <div className="form-group">
                        <label>Strength</label>
                        <input type="text" value={rxForm.strength} onChange={e => setRxForm(p => ({ ...p, strength: e.target.value }))} placeholder="e.g., 200mg/mL" />
                      </div>
                      <div className="form-group">
                        <label>Form</label>
                        <select value={rxForm.form} onChange={e => setRxForm(p => ({ ...p, form: e.target.value }))}>
                          <option value="">Select...</option>
                          <option value="injection">Injection</option>
                          <option value="tablet">Tablet</option>
                          <option value="capsule">Capsule</option>
                          <option value="cream">Cream</option>
                          <option value="patch">Patch</option>
                          <option value="sublingual">Sublingual</option>
                          <option value="nasal">Nasal Spray</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Quantity</label>
                        <input type="text" value={rxForm.quantity} onChange={e => setRxForm(p => ({ ...p, quantity: e.target.value }))} placeholder="e.g., 1 vial, 30 tablets" />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Sig (Directions)</label>
                        <input type="text" value={rxForm.sig} onChange={e => setRxForm(p => ({ ...p, sig: e.target.value }))} placeholder="e.g., Inject 0.5mL IM weekly" />
                      </div>
                      <div className="form-group">
                        <label>Refills</label>
                        <input type="number" value={rxForm.refills} onChange={e => setRxForm(p => ({ ...p, refills: parseInt(e.target.value) || 0 }))} min={0} />
                      </div>
                      <div className="form-group">
                        <label>Days Supply</label>
                        <input type="number" value={rxForm.days_supply} onChange={e => setRxForm(p => ({ ...p, days_supply: e.target.value }))} placeholder="e.g., 30" />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input type="checkbox" checked={rxForm.is_controlled} onChange={e => setRxForm(p => ({ ...p, is_controlled: e.target.checked }))} style={{ width: 16, height: 16 }} />
                          Controlled Substance
                        </label>
                        {rxForm.is_controlled && (
                          <div className="enc-controlled-alert">
                            <span>⚠️ CURES check required before prescribing controlled substances</span>
                            <select value={rxForm.schedule} onChange={e => setRxForm(p => ({ ...p, schedule: e.target.value }))} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca', fontSize: 12 }}>
                              <option value="">Schedule...</option>
                              <option value="II">Schedule II</option>
                              <option value="III">Schedule III</option>
                              <option value="IV">Schedule IV</option>
                              <option value="V">Schedule V</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowRxForm(false)} className="enc-btn enc-btn-secondary">Cancel</button>
                      <button onClick={handleSaveRx} disabled={!rxForm.medication_name.trim() || rxSaving} className="enc-btn enc-btn-primary">
                        {rxSaving ? 'Saving...' : 'Save Draft Rx'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
