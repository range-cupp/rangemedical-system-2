// components/EncounterModal.js
// Encounter view modal — shows appointment details, encounter notes, prescriptions

import { useState, useEffect, useRef } from 'react';
import { NOTE_TYPES, ENCOUNTER_TEMPLATES, getTemplateForService } from '../lib/encounter-templates';

export default function EncounterModal({ appointment, currentUser, onClose, onRefresh }) {
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
      const res = await fetch('/api/notes/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: noteInput, note_type: noteType }),
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

  const statusColors = {
    scheduled: { bg: '#dbeafe', color: '#1e40af' },
    confirmed: { bg: '#d1fae5', color: '#065f46' },
    checked_in: { bg: '#fef9c3', color: '#854d0e' },
    in_progress: { bg: '#e0e7ff', color: '#3730a3' },
    completed: { bg: '#d1fae5', color: '#065f46' },
    cancelled: { bg: '#fee2e2', color: '#991b1b' },
    no_show: { bg: '#fee2e2', color: '#991b1b' },
    draft: { bg: '#f3f4f6', color: '#374151' },
    signed: { bg: '#d1fae5', color: '#065f46' },
  };

  const s = statusColors;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 780, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h3 style={{ margin: 0 }}>Encounter</h3>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
              {appointment?.service_name || appointment?.appointment_title || 'Appointment'} — {formatDate(appointment?.start_time)}
            </div>
          </div>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {/* Appointment Details Bar */}
        <div style={{ padding: '12px 24px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
          {appointment?.provider && <span><strong>Provider:</strong> {appointment.provider}</span>}
          {appointment?.location && <span><strong>Location:</strong> {appointment.location}</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <strong>Status:</strong>
            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: s[status]?.bg || '#f3f4f6', color: s[status]?.color || '#374151' }}>
              {status}
            </span>
          </span>
          {template.label !== 'General' && (
            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#ede9fe', color: '#5b21b6' }}>
              {template.label}
            </span>
          )}
        </div>

        {/* Section Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
          {[
            { key: 'notes', label: 'Encounter Notes', count: encounterNotes.length },
            { key: 'prescriptions', label: 'Prescriptions', count: prescriptions.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              style={{
                padding: '10px 16px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: activeSection === tab.key ? '2px solid #111' : '2px solid transparent',
                color: activeSection === tab.key ? '#111' : '#6b7280',
              }}
            >
              {tab.label}{tab.count > 0 && <span style={{ marginLeft: 6, fontSize: 11, padding: '1px 6px', borderRadius: 10, background: '#e5e7eb', color: '#374151' }}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* ===== NOTES SECTION ===== */}
          {activeSection === 'notes' && (
            <>
              {loadingNotes ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Loading notes...</div>
              ) : encounterNotes.length === 0 && !showNoteForm ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                  <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>📝</div>
                  <div>No encounter notes yet</div>
                  <button onClick={() => setShowNoteForm(true)} className="btn-primary" style={{ marginTop: 12 }}>
                    + Add Encounter Note
                  </button>
                </div>
              ) : (
                <>
                  {/* Existing notes */}
                  {encounterNotes.map(note => (
                    <div key={note.id} style={{ marginBottom: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: note.source === 'addendum' ? '#fefce8' : '#fff' }}>
                      {/* Note header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {formatShortDate(note.note_date || note.created_at)}
                          {note.created_by && ` — ${note.created_by}`}
                          {note.source === 'addendum' && <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#92400e' }}>Addendum</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            background: note.status === 'signed' ? '#d1fae5' : '#f3f4f6',
                            color: note.status === 'signed' ? '#065f46' : '#6b7280',
                          }}>
                            {note.status === 'signed' ? `✓ Signed${note.signed_by ? ` by ${note.signed_by}` : ''}` : 'Draft'}
                          </span>
                        </div>
                      </div>

                      {/* Note body */}
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, color: '#111' }}>
                        {note.body}
                      </div>

                      {/* Note actions */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
                        {note.status !== 'signed' && note.created_by === currentUser && (
                          <button onClick={() => handleSignNote(note.id)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #10b981', borderRadius: 4, background: '#ecfdf5', color: '#065f46', cursor: 'pointer', fontWeight: 600 }}>
                            ✍ Sign & Lock
                          </button>
                        )}
                        {note.status === 'signed' && (
                          <button onClick={() => { setAddendumParentId(note.id); }} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', color: '#374151', cursor: 'pointer' }}>
                            + Add Addendum
                          </button>
                        )}
                      </div>

                      {/* Addendum form inline */}
                      {addendumParentId === note.id && (
                        <div style={{ marginTop: 12, padding: 12, background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#92400e' }}>Addendum to signed note:</div>
                          <textarea
                            value={addendumInput}
                            onChange={e => setAddendumInput(e.target.value)}
                            rows={3}
                            placeholder="Type addendum..."
                            style={{ width: '100%', resize: 'vertical', fontSize: 14, lineHeight: 1.6, fontFamily: 'inherit', padding: 8, borderRadius: 4, border: '1px solid #e5e7eb' }}
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button onClick={handleSaveAddendum} disabled={!addendumInput.trim() || addendumSaving} className="btn-primary" style={{ fontSize: 12, padding: '4px 12px', opacity: (!addendumInput.trim() || addendumSaving) ? 0.5 : 1 }}>
                              {addendumSaving ? 'Saving...' : 'Save Addendum'}
                            </button>
                            <button onClick={() => { setAddendumParentId(null); setAddendumInput(''); }} className="btn-secondary" style={{ fontSize: 12, padding: '4px 12px' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add note button */}
                  {!showNoteForm && (
                    <button onClick={() => setShowNoteForm(true)} className="btn-primary" style={{ marginTop: 8 }}>
                      + Add Encounter Note
                    </button>
                  )}
                </>
              )}

              {/* Note creation form */}
              {showNoteForm && (
                <div style={{ marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: 14 }}>New Encounter Note</h4>
                    <button onClick={() => { setShowNoteForm(false); setNoteInput(''); stopDictation(); }} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>×</button>
                  </div>

                  {/* Note type selector */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: '#374151' }}>Note Type</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {Object.entries(NOTE_TYPES).map(([key, type]) => (
                        <button
                          key={key}
                          onClick={() => setNoteType(key)}
                          style={{
                            padding: '4px 10px', fontSize: 12, borderRadius: 4, cursor: 'pointer', border: '1px solid',
                            background: noteType === key ? '#111' : '#fff',
                            color: noteType === key ? '#fff' : '#374151',
                            borderColor: noteType === key ? '#111' : '#d1d5db',
                            fontWeight: noteType === key ? 600 : 400,
                          }}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{NOTE_TYPES[noteType]?.description}</div>
                  </div>

                  {/* Quick notes */}
                  {template.quickNotes && template.quickNotes.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: '#374151' }}>Quick Notes</label>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {template.quickNotes.map((qn, i) => (
                          <button
                            key={i}
                            onClick={() => setNoteInput(prev => prev + (prev ? '\n' : '') + qn)}
                            style={{ padding: '3px 8px', fontSize: 11, borderRadius: 12, border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}
                          >
                            {qn}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Textarea with dictation */}
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <textarea
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      rows={8}
                      placeholder="Type your encounter note here, or click the microphone to dictate..."
                      style={{ width: '100%', resize: 'vertical', paddingRight: 50, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6, padding: '10px 50px 10px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}
                    />
                    <button
                      onClick={toggleDictation}
                      type="button"
                      style={{
                        position: 'absolute', right: 10, top: 10,
                        background: isRecording ? '#dc2626' : '#f3f4f6',
                        color: isRecording ? '#fff' : '#374151',
                        border: 'none', borderRadius: '50%',
                        width: 36, height: 36, fontSize: 18,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                      }}
                      title={isRecording ? 'Stop dictation' : 'Start dictation'}
                    >
                      🎤
                    </button>
                  </div>
                  {isRecording && (
                    <div style={{ fontSize: 13, color: '#dc2626', marginTop: -8, marginBottom: 8, fontWeight: 500 }}>
                      ● Recording... Click microphone to stop
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                    <button onClick={handleFormat} disabled={!noteInput.trim() || noteFormatting} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: (!noteInput.trim() || noteFormatting) ? 0.5 : 1 }}>
                      {noteFormatting ? 'Formatting...' : '✨ Format with AI'}
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setShowNoteForm(false); setNoteInput(''); stopDictation(); }} className="btn-secondary">Cancel</button>
                      <button onClick={handleSaveNote} disabled={!noteInput.trim() || noteSaving} className="btn-primary" style={{ opacity: (!noteInput.trim() || noteSaving) ? 0.5 : 1 }}>
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
              <div style={{ padding: '8px 12px', marginBottom: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 12, color: '#92400e' }}>
                ⚠️ e-Prescribing is not yet active. Prescriptions saved here are drafts only.
              </div>

              {prescriptions.length === 0 && !showRxForm ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                  <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>💊</div>
                  <div>No prescriptions for this encounter</div>
                  <button onClick={() => setShowRxForm(true)} className="btn-primary" style={{ marginTop: 12 }}>
                    + Add Prescription
                  </button>
                </div>
              ) : (
                <>
                  {prescriptions.map(rx => (
                    <div key={rx.id} style={{ marginBottom: 12, padding: 14, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: 14 }}>{rx.medication_name}</strong>
                          {rx.strength && <span style={{ color: '#6b7280', marginLeft: 6 }}>{rx.strength}</span>}
                          {rx.form && <span style={{ color: '#6b7280', marginLeft: 6 }}>({rx.form})</span>}
                        </div>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#f3f4f6', color: '#6b7280' }}>
                          Draft
                        </span>
                      </div>
                      {rx.sig && <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>Sig: {rx.sig}</div>}
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                        {rx.quantity && `Qty: ${rx.quantity}`}
                        {rx.refills > 0 && ` • Refills: ${rx.refills}`}
                        {rx.days_supply && ` • Days: ${rx.days_supply}`}
                        {rx.is_controlled && ` • Schedule ${rx.schedule || 'N/A'}`}
                      </div>
                    </div>
                  ))}
                  {!showRxForm && (
                    <button onClick={() => setShowRxForm(true)} className="btn-primary" style={{ marginTop: 8 }}>
                      + Add Prescription
                    </button>
                  )}
                </>
              )}

              {/* Rx Form */}
              {showRxForm && (
                <div style={{ marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>New Prescription (Draft)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                        <input type="checkbox" checked={rxForm.is_controlled} onChange={e => setRxForm(p => ({ ...p, is_controlled: e.target.checked }))} />
                        Controlled Substance
                      </label>
                      {rxForm.is_controlled && (
                        <div style={{ marginTop: 8, padding: 8, background: '#fef2f2', borderRadius: 4, border: '1px solid #fecaca', fontSize: 12, color: '#991b1b' }}>
                          ⚠️ CURES check required before prescribing controlled substances
                          <select value={rxForm.schedule} onChange={e => setRxForm(p => ({ ...p, schedule: e.target.value }))} style={{ marginLeft: 8 }}>
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
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowRxForm(false)} className="btn-secondary">Cancel</button>
                    <button onClick={handleSaveRx} disabled={!rxForm.medication_name.trim() || rxSaving} className="btn-primary" style={{ opacity: (!rxForm.medication_name.trim() || rxSaving) ? 0.5 : 1 }}>
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
  );
}
