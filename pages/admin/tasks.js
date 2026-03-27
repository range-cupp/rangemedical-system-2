// /pages/admin/tasks.js
// Internal staff task/communication system
// Create, assign, and track tasks between team members
// Range Medical System

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Mic, MicOff, Phone, MessageSquare, Send, Loader2 } from 'lucide-react';
import AdminLayout, { sharedStyles, overlayClickProps } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';
import { NOTE_TYPES, ENCOUNTER_TEMPLATES, getTemplateForService, getTemplatesForCategory } from '../../lib/encounter-templates';
import { ENCOUNTER_FORMS } from '../../lib/encounter-form-config';
import InteractiveEncounterForm from '../../components/InteractiveEncounterForm';

// ── Markdown helpers (shared with EncounterModal) ─────────────────────────────
function mdToHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}
function htmlToMd(html) {
  if (!html) return '';
  return html
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, (_, inner) => `**${inner.replace(/<[^>]*>/g, '')}**`)
    .replace(/<b>([\s\S]*?)<\/b>/gi, (_, inner) => `**${inner.replace(/<[^>]*>/g, '')}**`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div><br\s*\/?><\/div>/gi, '\n')
    .replace(/<div>([\s\S]*?)<\/div>/gi, '\n$1')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
}
function renderFormattedText(text) {
  if (!text) return text;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ── Inline Encounter Editor ───────────────────────────────────────────────────
// Renders inside a "Document encounter" task when expanded
function InlineEncounterEditor({ task, session, currentUser, onTaskComplete }) {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [noteMode, setNoteMode] = useState('choose'); // 'choose' | 'interactive' | 'freetext'
  const [interactiveFormType, setInteractiveFormType] = useState(null);
  const [noteType, setNoteType] = useState('soap');
  const [noteIsEmpty, setNoteIsEmpty] = useState(true);
  const [noteFormatting, setNoteFormatting] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const noteRef = useRef(null);
  const recognitionRef = useRef(null);

  // Edit & sign state
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteInput, setEditNoteInput] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [addendumParentId, setAddendumParentId] = useState(null);
  const [addendumInput, setAddendumInput] = useState('');
  const [addendumSaving, setAddendumSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const canAuthorNotes = ['burgess@range-medical.com', 'lily@range-medical.com', 'evan@range-medical.com', 'chris@range-medical.com']
    .some(email => currentUser?.toLowerCase()?.includes(email));

  const getNoteMarkdown = () => htmlToMd(noteRef.current?.innerHTML || '');

  // Fetch appointment details + resolve patient_id if missing
  useEffect(() => {
    if (!task.appointment_id) { setLoading(false); return; }
    fetch(`/api/appointments/${task.appointment_id}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
      .then(r => r.json())
      .then(async (data) => {
        const appt = data.appointment || data;
        // If appointment has no patient_id, try to resolve from patient_name
        if (!appt.patient_id && (appt.patient_name || task.patient_name)) {
          try {
            const name = appt.patient_name || task.patient_name;
            const lookupRes = await fetch(`/api/patients/search?q=${encodeURIComponent(name)}`);
            const lookupData = await lookupRes.json();
            // Use exact name match if found
            const match = (lookupData.patients || []).find(p => p.name?.toLowerCase() === name.toLowerCase());
            if (match) {
              appt.patient_id = match.id;
            }
          } catch (e) { /* best-effort lookup */ }
        }
        setAppointment(appt);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [task.appointment_id, session]);

  // Fetch existing encounter notes
  useEffect(() => {
    if (!task.appointment_id) { setLoadingNotes(false); return; }
    fetch(`/api/notes/by-appointment?appointment_id=${task.appointment_id}`)
      .then(r => r.json())
      .then(data => { setNotes(data.notes || []); setLoadingNotes(false); })
      .catch(() => setLoadingNotes(false));
  }, [task.appointment_id]);

  // Determine template and interactive forms from service name
  const serviceName = appointment?.service_name || appointment?.appointment_title || '';
  const templateKey = getTemplateForService(serviceName);
  const template = ENCOUNTER_TEMPLATES[templateKey] || ENCOUNTER_TEMPLATES.general;

  const getAvailableForms = () => {
    const name = serviceName.toLowerCase();
    const forms = [];
    if (name.includes('iv') || name.includes('infusion') || name.includes('nad') || name.includes('drip')) forms.push('iv_therapy');
    if (name.includes('hrt') || name.includes('testosterone') || name.includes('hormone') || name.includes('trt')) forms.push('hrt_followup');
    if (name.includes('weight') || name.includes('glp') || name.includes('sema') || name.includes('tirz') || name.includes('ozempic') || name.includes('mounjaro')) forms.push('weight_loss');
    if (name.includes('peptide') || name.includes('bpc') || name.includes('tb-4') || name.includes('tb4')) forms.push('peptide_injection');
    if (name.includes('hbot') || name.includes('hyperbaric')) forms.push('hbot_session');
    if (name.includes('rlt') || name.includes('red light')) forms.push('rlt_session');
    if (name.includes('injection') || name.includes('b12') || name.includes('lipo') || name.includes('phlebotomy') || name.includes('blood draw')) forms.push('injection');
    return [...new Set(forms)];
  };
  const availableForms = getAvailableForms();

  useEffect(() => {
    if (template.defaultNoteType) setNoteType(template.defaultNoteType);
  }, [template.defaultNoteType]);

  // Tab key for ?? placeholders
  const handleNoteKeyDown = (e) => {
    if (e.key === 'Tab' && noteRef.current?.innerText?.includes('??')) {
      e.preventDefault();
      const sel = window.getSelection();
      const el = noteRef.current;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
      let node, passedCurrent = false, firstMatch = null;
      const curNode = sel.anchorNode;
      const selectedText = sel.toString();
      const skipOffset = selectedText === '??' ? sel.anchorOffset + 2 : sel.anchorOffset;
      while ((node = walker.nextNode())) {
        const searchFrom = (node === curNode && !passedCurrent) ? skipOffset : 0;
        const idx = node.textContent.indexOf('??', searchFrom);
        if (idx !== -1 && !firstMatch) firstMatch = { node, idx };
        if (idx !== -1 && passedCurrent) {
          const range = document.createRange();
          range.setStart(node, idx); range.setEnd(node, idx + 2);
          sel.removeAllRanges(); sel.addRange(range);
          return;
        }
        if (node === curNode) passedCurrent = true;
      }
      if (firstMatch) {
        const range = document.createRange();
        range.setStart(firstMatch.node, firstMatch.idx); range.setEnd(firstMatch.node, firstMatch.idx + 2);
        sel.removeAllRanges(); sel.addRange(range);
      }
    }
  };

  const loadTemplate = (body, defaultNoteType) => {
    if (noteRef.current) {
      const existing = noteRef.current.innerHTML.trim();
      const separator = existing ? '<br><br><hr><br>' : '';
      noteRef.current.innerHTML = (existing ? existing + separator : '') + mdToHtml(body);
      setNoteIsEmpty(false);
      if (defaultNoteType && !existing) setNoteType(defaultNoteType);
      noteRef.current.focus();
      setTimeout(() => {
        // Try to select first ?? placeholder
        const walker = document.createTreeWalker(noteRef.current, NodeFilter.SHOW_TEXT, null, false);
        let n;
        while ((n = walker.nextNode())) {
          const idx = n.textContent.indexOf('??');
          if (idx !== -1) {
            const range = document.createRange();
            range.setStart(n, idx); range.setEnd(n, idx + 2);
            const sel = window.getSelection();
            sel.removeAllRanges(); sel.addRange(range);
            return;
          }
        }
      }, 50);
    }
  };

  // Dictation
  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Voice dictation not supported. Use Chrome.'); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' ';
      }
      if (finalTranscript && noteRef.current) {
        noteRef.current.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && noteRef.current.contains(sel.anchorNode)) {
          document.execCommand('insertText', false, ' ' + finalTranscript);
        } else {
          noteRef.current.innerHTML += ' ' + finalTranscript;
        }
        setNoteIsEmpty(false);
      }
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };
  const stopDictation = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setIsRecording(false);
  };
  const toggleDictation = () => { isRecording ? stopDictation() : startDictation(); };

  // AI Format
  const handleFormat = async () => {
    const raw = getNoteMarkdown();
    if (!raw.trim()) return;
    setNoteFormatting(true);
    try {
      const res = await fetch('/api/notes/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: raw, note_type: noteType }),
      });
      const data = await res.json();
      if (data.formatted && noteRef.current) noteRef.current.innerHTML = mdToHtml(data.formatted);
    } catch (err) { console.error('Format error:', err); }
    finally { setNoteFormatting(false); }
  };

  // Save note
  const handleSaveNote = async () => {
    const body = getNoteMarkdown();
    if (!body.trim()) return;
    setSaveError(null);
    const patientId = appointment?.patient_id || task.patient_id;
    if (!patientId) {
      setSaveError('Unable to save — no patient linked to this task. Please link a patient first.');
      return;
    }
    setNoteSaving(true);
    try {
      const res = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          body, raw_input: body,
          created_by: currentUser,
          appointment_id: task.appointment_id,
          encounter_service: serviceName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Failed to save note');
        return;
      }
      if (data.note) {
        setNotes(prev => [...prev, data.note]);
        if (noteRef.current) noteRef.current.innerHTML = '';
        setNoteIsEmpty(true);
        setShowForm(false);
        stopDictation();
      }
    } catch (err) {
      console.error('Save note error:', err);
      setSaveError('Network error — please try again');
    }
    finally { setNoteSaving(false); }
  };

  // Sign note
  const handleSignNote = async (noteId) => {
    if (!confirm('Sign and lock this note? You can add addendums after signing.')) return;
    try {
      const res = await fetch('/api/notes/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId, signed_by: currentUser }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, status: 'signed', signed_by: currentUser, signed_at: new Date().toISOString() } : n));
        // Auto-complete task after signing
        if (onTaskComplete) onTaskComplete();
      } else {
        alert(data.error || 'Failed to sign note');
      }
    } catch (err) { console.error('Sign error:', err); }
  };

  // Edit draft
  const handleEditSave = async () => {
    if (!editNoteInput.trim() || !editingNoteId) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/notes/${editingNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editNoteInput }),
      });
      const data = await res.json();
      if (data.note) {
        setNotes(prev => prev.map(n => n.id === editingNoteId ? { ...n, body: editNoteInput } : n));
        setEditingNoteId(null);
        setEditNoteInput('');
      }
    } catch (err) { console.error('Edit save error:', err); }
    finally { setEditSaving(false); }
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
          body: addendumInput,
          created_by: currentUser,
          appointment_id: task.appointment_id,
        }),
      });
      const data = await res.json();
      if (data.note) {
        setNotes(prev => [...prev, data.note]);
        setAddendumParentId(null);
        setAddendumInput('');
      }
    } catch (err) { console.error('Addendum save error:', err); }
    finally { setAddendumSaving(false); }
  };

  const formatShortDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const s = {
    container: { marginTop: '14px', borderTop: '1px solid #e5e7eb', paddingTop: '14px' },
    sectionLabel: { fontSize: '11px', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' },
    noteCard: { marginBottom: '10px', padding: '14px 16px', border: '1px solid #eee', borderRadius: 0, background: '#fff' },
    noteCardAddendum: { background: '#fffef5', borderColor: '#fde68a' },
    noteHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    noteMeta: { fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' },
    noteBody: { whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: 1.7, color: '#1f2937' },
    noteActions: { display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f5f5f5' },
    badgeSigned: { padding: '2px 8px', borderRadius: 0, fontSize: '10px', fontWeight: 600, background: '#ecfdf5', color: '#059669' },
    badgeDraft: { padding: '2px 8px', borderRadius: 0, fontSize: '10px', fontWeight: 600, background: '#f3f4f6', color: '#6b7280' },
    badgeAddendum: { padding: '2px 8px', borderRadius: 0, fontSize: '10px', fontWeight: 600, background: '#fef3c7', color: '#b45309' },
    btn: { padding: '6px 12px', fontSize: '12px', fontWeight: 600, borderRadius: 0, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' },
    btnPrimary: { background: '#111', color: '#fff' },
    btnSecondary: { background: '#fff', color: '#374151', border: '1px solid #d1d5db' },
    btnSign: { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' },
    btnGhost: { background: 'none', color: '#6b7280', border: '1px solid #e5e7eb' },
    btnAi: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none' },
    formCard: { marginTop: '12px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: 0, background: '#fafbfc' },
    formLabel: { fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    typePills: { display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '4px' },
    typePill: (active) => ({
      padding: '5px 12px', fontSize: '11px', fontWeight: 600, borderRadius: 0,
      border: `1.5px solid ${active ? '#111' : '#e5e7eb'}`,
      background: active ? '#111' : '#fff', color: active ? '#fff' : '#6b7280',
      cursor: 'pointer',
    }),
    templateBtn: {
      display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px',
      fontSize: '12px', fontWeight: 600, borderRadius: 0,
      border: '1.5px dashed #d1d5db', background: '#fafbfc', color: '#374151',
      cursor: 'pointer', width: '100%', textAlign: 'left',
    },
    templateDropdown: {
      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 0,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '280px', overflowY: 'auto',
    },
    templateGroupLabel: { padding: '8px 14px 4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' },
    templateOption: {
      display: 'block', width: '100%', padding: '8px 14px', fontSize: '12px', fontWeight: 500,
      border: 'none', background: 'none', color: '#374151', cursor: 'pointer', textAlign: 'left',
    },
    quickNote: {
      padding: '3px 10px', fontSize: '11px', borderRadius: 0,
      border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer',
    },
    editorWrap: { position: 'relative', marginBottom: '12px' },
    editor: {
      width: '100%', minHeight: '150px', fontFamily: 'inherit', fontSize: '13px',
      lineHeight: 1.7, padding: '12px 44px 12px 14px', borderRadius: 0,
      border: '1.5px solid #e5e7eb', background: '#fff', color: '#111',
      overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxSizing: 'border-box',
    },
    micBtn: (recording) => ({
      position: 'absolute', right: '10px', top: '10px', width: '30px', height: '30px',
      borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '14px', cursor: 'pointer',
      background: recording ? '#dc2626' : '#f3f4f6', color: recording ? '#fff' : '#6b7280',
      ...(recording ? { animation: 'pulse 1.5s infinite' } : {}),
    }),
    actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' },
    actionsRight: { display: 'flex', gap: '8px' },
    // Addendum
    addendumForm: { marginTop: '12px', padding: '12px', background: '#fffef5', borderRadius: 0, border: '1px solid #fde68a' },
    addendumTextarea: {
      width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.6,
      padding: '8px 12px', borderRadius: 0, border: '1.5px solid #fde68a', background: '#fff', minHeight: '70px', boxSizing: 'border-box',
    },
    // Mode chooser
    modeBtn: (highlight) => ({
      flex: 1, maxWidth: '220px', padding: '20px 16px', borderRadius: 0,
      border: `2px solid ${highlight ? '#e9d5ff' : '#e5e7eb'}`,
      background: highlight ? '#faf8ff' : '#fafafa', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    }),
  };

  if (loading) return <div style={{ ...s.container, color: '#9ca3af', fontSize: '13px' }}>Loading encounter...</div>;
  if (!task.appointment_id) return <div style={{ ...s.container, color: '#9ca3af', fontSize: '13px' }}>No appointment linked — open patient profile to document.</div>;

  return (
    <div style={s.container} onClick={e => e.stopPropagation()}>
      <div style={s.sectionLabel}>
        <span>📋</span> Encounter Note {serviceName && <span style={{ fontWeight: 400, textTransform: 'none', color: '#9ca3af' }}>— {serviceName}</span>}
      </div>

      {/* Existing notes */}
      {loadingNotes ? (
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Loading notes...</div>
      ) : (
        <>
          {notes.map(note => (
            <div key={note.id} style={{ ...s.noteCard, ...(note.source === 'addendum' ? s.noteCardAddendum : {}) }}>
              <div style={s.noteHeader}>
                <div style={s.noteMeta}>
                  <span>{formatShortDate(note.note_date || note.created_at)}</span>
                  {note.created_by && <span style={{ color: '#6b7280' }}>by {note.created_by}</span>}
                  {note.source === 'addendum' && <span style={s.badgeAddendum}>Addendum</span>}
                </div>
                <span style={note.status === 'signed' ? s.badgeSigned : s.badgeDraft}>
                  {note.status === 'signed' ? `✓ Signed${note.signed_by ? ` by ${note.signed_by}` : ''}` : 'Draft'}
                </span>
              </div>

              {editingNoteId === note.id ? (
                <div>
                  <textarea
                    value={editNoteInput}
                    onChange={e => setEditNoteInput(e.target.value)}
                    style={{ ...s.addendumTextarea, borderColor: '#e5e7eb', minHeight: '100px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button onClick={handleEditSave} disabled={!editNoteInput.trim() || editSaving} style={{ ...s.btn, ...s.btnPrimary, opacity: (!editNoteInput.trim() || editSaving) ? 0.5 : 1 }}>
                      {editSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => { setEditingNoteId(null); setEditNoteInput(''); }} style={{ ...s.btn, ...s.btnSecondary }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={s.noteBody}>{renderFormattedText(note.body)}</div>
              )}

              {editingNoteId !== note.id && canAuthorNotes && (
                <div style={s.noteActions}>
                  {note.status !== 'signed' && note.created_by === currentUser && (
                    <>
                      <button onClick={() => { setEditingNoteId(note.id); setEditNoteInput(note.body); }} style={{ ...s.btn, ...s.btnSecondary }}>✏️ Edit</button>
                      <button onClick={() => handleSignNote(note.id)} style={{ ...s.btn, ...s.btnSign }}>✍ Sign & Lock</button>
                    </>
                  )}
                  {note.status === 'signed' && (
                    <button onClick={() => setAddendumParentId(note.id)} style={{ ...s.btn, ...s.btnGhost }}>+ Add Addendum</button>
                  )}
                </div>
              )}

              {addendumParentId === note.id && (
                <div style={s.addendumForm}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#b45309', marginBottom: '8px' }}>Addendum to signed note</div>
                  <textarea
                    value={addendumInput}
                    onChange={e => setAddendumInput(e.target.value)}
                    rows={3}
                    placeholder="Type addendum..."
                    style={s.addendumTextarea}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button onClick={handleSaveAddendum} disabled={!addendumInput.trim() || addendumSaving} style={{ ...s.btn, ...s.btnPrimary, opacity: (!addendumInput.trim() || addendumSaving) ? 0.5 : 1 }}>
                      {addendumSaving ? 'Saving...' : 'Save Addendum'}
                    </button>
                    <button onClick={() => { setAddendumParentId(null); setAddendumInput(''); }} style={{ ...s.btn, ...s.btnSecondary }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add note button */}
          {!showForm && canAuthorNotes && (
            <button
              onClick={() => { setShowForm(true); setNoteMode(availableForms.length > 0 ? 'choose' : 'freetext'); }}
              style={{ ...s.btn, ...s.btnPrimary, marginTop: notes.length > 0 ? '6px' : '0' }}
            >
              + {notes.length > 0 ? 'Add Another Note' : 'Start Encounter Note'}
            </button>
          )}

          {/* Mode chooser */}
          {showForm && noteMode === 'choose' && (
            <div style={{ ...s.formCard, textAlign: 'center', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>How would you like to create this note?</span>
                <button onClick={() => { setShowForm(false); setNoteMode('choose'); }} style={{ ...s.btn, background: '#f3f4f6', color: '#6b7280', border: 'none', width: '26px', height: '26px', padding: 0, justifyContent: 'center', borderRadius: 0, fontSize: '14px' }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {availableForms.map(formKey => {
                  const formDef = ENCOUNTER_FORMS[formKey];
                  return (
                    <button
                      key={formKey}
                      onClick={() => { setNoteMode('interactive'); setInteractiveFormType(formKey); }}
                      style={s.modeBtn(true)}
                    >
                      <span style={{ fontSize: '28px' }}>{formDef?.icon || '📋'}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Interactive Form</span>
                      <span style={{ fontSize: '11px', color: '#6d28d9', fontWeight: 600 }}>{formDef?.label || formKey}</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>Guided fields — fastest</span>
                    </button>
                  );
                })}
                <button onClick={() => setNoteMode('freetext')} style={s.modeBtn(false)}>
                  <span style={{ fontSize: '28px' }}>✏️</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Free Text</span>
                  <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Templates & dictation</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Write from scratch</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive form mode */}
          {showForm && noteMode === 'interactive' && interactiveFormType && (
            <div style={s.formCard}>
              <InteractiveEncounterForm
                formType={interactiveFormType}
                vitals={{}}
                currentUser={currentUser}
                onCancel={() => { setNoteMode('choose'); setInteractiveFormType(null); }}
                onSave={async ({ markdown, structured_data, note_type, form_type }) => {
                  setSaveError(null);
                  const patientId = appointment?.patient_id || task.patient_id;
                  if (!patientId) {
                    setSaveError('Unable to save — no patient linked to this task. Please link a patient first.');
                    return;
                  }
                  try {
                    const res = await fetch('/api/notes/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        patient_id: patientId,
                        body: markdown, raw_input: markdown,
                        created_by: currentUser,
                        appointment_id: task.appointment_id,
                        encounter_service: form_type || serviceName,
                        structured_data: { ...structured_data, form_type },
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setSaveError(data.error || 'Failed to save note');
                      return;
                    }
                    if (data.note) {
                      setNotes(prev => [...prev, data.note]);
                      setShowForm(false);
                      setNoteMode('choose');
                      setInteractiveFormType(null);
                    }
                  } catch (err) {
                    console.error('Save interactive note error:', err);
                    setSaveError('Network error — please try again');
                  }
                }}
              />
              {saveError && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px' }}>{saveError}</div>}
            </div>
          )}

          {/* Free text mode */}
          {showForm && noteMode === 'freetext' && (
            <div style={s.formCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>New Encounter Note</span>
                  {availableForms.length > 0 && (
                    <button onClick={() => setNoteMode('choose')} style={{ fontSize: '11px', color: '#6d28d9', background: '#f3e8ff', border: 'none', borderRadius: 0, padding: '3px 10px', cursor: 'pointer', fontWeight: 600 }}>
                      ← Interactive Form
                    </button>
                  )}
                </div>
                <button onClick={() => { setShowForm(false); setNoteMode('choose'); if (noteRef.current) noteRef.current.innerHTML = ''; setNoteIsEmpty(true); stopDictation(); }} style={{ ...s.btn, background: '#f3f4f6', color: '#6b7280', border: 'none', width: '26px', height: '26px', padding: 0, justifyContent: 'center', borderRadius: 0, fontSize: '14px' }}>×</button>
              </div>

              {/* Note type pills */}
              <div style={{ marginBottom: '14px' }}>
                <div style={s.formLabel}>Note Type</div>
                <div style={s.typePills}>
                  {Object.entries(NOTE_TYPES).map(([key, type]) => (
                    <button key={key} onClick={() => setNoteType(key)} style={s.typePill(noteType === key)}>{type.label}</button>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{NOTE_TYPES[noteType]?.description}</div>
              </div>

              {/* Template selector */}
              {(() => {
                const { matched, other } = getTemplatesForCategory(templateKey);
                return (
                  <div style={{ position: 'relative', marginBottom: '14px' }}>
                    <button type="button" onClick={() => setShowTemplateMenu(!showTemplateMenu)} style={s.templateBtn}>
                      <span style={{ fontSize: '14px' }}>📋</span>
                      <span>Use a Note Template</span>
                      <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#9ca3af' }}>{showTemplateMenu ? '▲' : '▼'}</span>
                    </button>
                    {showTemplateMenu && (
                      <div style={s.templateDropdown}>
                        {matched.length > 0 && (
                          <>
                            <div style={s.templateGroupLabel}>Suggested for this visit</div>
                            {matched.map(tmpl => (
                              <button key={tmpl.key} onClick={() => { loadTemplate(tmpl.body, tmpl.defaultNoteType); setShowTemplateMenu(false); }} style={s.templateOption}
                                onMouseEnter={e => e.target.style.background = '#f3f4f6'} onMouseLeave={e => e.target.style.background = 'none'}
                              >{tmpl.label}</button>
                            ))}
                            {other.length > 0 && <div style={{ height: '1px', background: '#f0f0f0', margin: '4px 0' }} />}
                          </>
                        )}
                        {other.length > 0 && (
                          <>
                            <div style={s.templateGroupLabel}>{matched.length > 0 ? 'Other Templates' : 'All Templates'}</div>
                            {other.map(tmpl => (
                              <button key={tmpl.key} onClick={() => { loadTemplate(tmpl.body, tmpl.defaultNoteType); setShowTemplateMenu(false); }} style={s.templateOption}
                                onMouseEnter={e => e.target.style.background = '#f3f4f6'} onMouseLeave={e => e.target.style.background = 'none'}
                              >{tmpl.label}</button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Quick notes */}
              {template.quickNotes && template.quickNotes.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={s.formLabel}>Quick Notes</div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {template.quickNotes.map((qn, i) => (
                      <button key={i} onClick={() => {
                        if (noteRef.current) {
                          const current = noteRef.current.innerHTML;
                          noteRef.current.innerHTML = current.trim() ? current + '<br>' + qn : qn;
                          setNoteIsEmpty(false);
                        }
                      }} style={s.quickNote}
                        onMouseEnter={e => { e.target.style.background = '#f0f0f0'; e.target.style.borderColor = '#d1d5db'; }}
                        onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#e5e7eb'; }}
                      >+ {qn}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bold button */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', alignItems: 'center' }}>
                <button type="button" onClick={() => { noteRef.current?.focus(); document.execCommand('bold', false, null); }}
                  title="Bold selected text" style={{ padding: '3px 9px', fontSize: '12px', fontWeight: 800, border: '1px solid #d1d5db', borderRadius: 0, background: '#f9fafb', color: '#374151', cursor: 'pointer', fontFamily: 'serif' }}
                >B</button>
                <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '4px' }}>Select text → B to bold</span>
              </div>

              {/* Rich text editor */}
              <div style={s.editorWrap}>
                <div
                  ref={noteRef}
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Type your encounter note here, or click the microphone to dictate..."
                  onInput={() => setNoteIsEmpty(!(noteRef.current?.innerText || '').trim())}
                  onKeyDown={handleNoteKeyDown}
                  style={s.editor}
                />
                <button onClick={toggleDictation} type="button" title={isRecording ? 'Stop dictation' : 'Start dictation'} style={s.micBtn(isRecording)}>
                  🎤
                </button>
              </div>
              {isRecording && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', margin: '-8px 0 12px', background: '#fef2f2', borderRadius: 0, fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' }} />
                  Recording — Click microphone to stop
                </div>
              )}

              {/* Action buttons */}
              <div style={s.actions}>
                <button onClick={handleFormat} disabled={noteIsEmpty || noteFormatting} style={{ ...s.btn, ...s.btnAi, opacity: (noteIsEmpty || noteFormatting) ? 0.5 : 1 }}>
                  {noteFormatting ? 'Formatting...' : '✨ Format with AI'}
                </button>
                <div style={s.actionsRight}>
                  {saveError && <span style={{ color: '#dc2626', fontSize: '12px', marginRight: '8px' }}>{saveError}</span>}
                  <button onClick={() => { setShowForm(false); setNoteMode('choose'); if (noteRef.current) noteRef.current.innerHTML = ''; setNoteIsEmpty(true); stopDictation(); setSaveError(null); }} style={{ ...s.btn, ...s.btnSecondary }}>Cancel</button>
                  <button onClick={handleSaveNote} disabled={noteIsEmpty || noteSaving} style={{ ...s.btn, ...s.btnPrimary, opacity: (noteIsEmpty || noteSaving) ? 0.5 : 1 }}>
                    {noteSaving ? 'Saving...' : 'Save as Draft'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No notes and no form — empty state */}
          {notes.length === 0 && !showForm && !canAuthorNotes && (
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>No encounter notes yet.</div>
          )}
        </>
      )}
    </div>
  );
}

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  high: { label: 'High', bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  medium: { label: 'Medium', bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  low: { label: 'Low', bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
};

export default function TasksPage() {
  const { session, employee } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('my'); // my, assigned, all
  const [statusFilter, setStatusFilter] = useState('pending'); // pending, completed, ''
  const [employeeFilter, setEmployeeFilter] = useState(''); // employee ID filter (admin view)
  const [patientSearchFilter, setPatientSearchFilter] = useState(''); // search tasks by patient name
  const [employees, setEmployees] = useState([]);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    patient_name: '',
    priority: 'medium',
    due_date: '',
  });

  // Voice dictation state
  const [listening, setListening] = useState(false);
  const [dictationTarget, setDictationTarget] = useState('title'); // 'title' or 'description'
  const recognitionRef = useRef(null);

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);

  // SMS composer state per task: { [taskId]: { message, loading, sending, sent, error, open } }
  const [smsState, setSmsState] = useState({});

  // Lab review state
  const [labPanel, setLabPanel] = useState(null); // { type: 'results'|'pdf', labId, pdfUrl, patientName }
  const [labReviewOpen, setLabReviewOpen] = useState(null); // task.id that has review panel open
  const [labReviewForms, setLabReviewForms] = useState({}); // { [taskId]: { types, instructions, submitting, done, error } }
  const [labInfoCache, setLabInfoCache] = useState({}); // { [patientId]: { labId, pdfUrl } }

  // Bulk selection state
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkCompleting, setBulkCompleting] = useState(false);

  // Date group collapsed state
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const openSmsComposer = (task) => {
    setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], open: true, sent: false, error: null } }));
  };

  const generateRenewalText = async (task) => {
    setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], open: true, loading: true, error: null } }));
    try {
      const res = await fetch('/api/tasks/generate-renewal-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          patient_name: task.patient_name,
          task_title: task.title,
          task_description: task.description,
          staff_name: task.assigned_to_name,
        }),
      });
      const data = await res.json();
      setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], message: data.message, loading: false } }));
    } catch (err) {
      setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], loading: false, error: 'Failed to generate message' } }));
    }
  };

  const sendTaskSms = async (task) => {
    const state = smsState[task.id];
    if (!state?.message?.trim() || !task.patient_phone) return;
    setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], sending: true, error: null } }));
    try {
      const res = await fetch('/api/tasks/send-renewal-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          patient_id: task.patient_id,
          patient_name: task.patient_name,
          patient_phone: task.patient_phone,
          message: state.message,
          task_id: task.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], sending: false, sent: true, message: '' } }));
      } else {
        setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], sending: false, error: data.error || 'Send failed' } }));
      }
    } catch (err) {
      setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], sending: false, error: 'Send failed' } }));
    }
  };

  // ── Lab review helpers ──────────────────────────────────────────────────────

  const parseLabMeta = (description) => {
    if (!description) return {};
    const marker = '---LAB_META---';
    const idx = description.indexOf(marker);
    if (idx === -1) return {};
    try { return JSON.parse(description.slice(idx + marker.length).trim()); } catch { return {}; }
  };

  const getDisplayDescription = (description) => {
    if (!description) return '';
    const marker = '---LAB_META---';
    const idx = description.indexOf(marker);
    return idx !== -1 ? description.slice(0, idx).trim() : description;
  };

  const fetchLabInfo = async (patientId) => {
    if (labInfoCache[patientId]) return labInfoCache[patientId];
    try {
      const res = await fetch(`/api/admin/patient-lab-info?patient_id=${patientId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setLabInfoCache(prev => ({ ...prev, [patientId]: data }));
        return data;
      }
    } catch (e) { console.error('fetchLabInfo error:', e); }
    return null;
  };

  const openLabPanel = async (type, task) => {
    const info = await fetchLabInfo(task.patient_id);
    setLabPanel({ type, labId: info?.labId, pdfUrl: info?.pdfUrl, patientName: task.patient_name });
  };

  const submitLabReview = async (taskId, patientId) => {
    const form = labReviewForms[taskId] || {};
    const types = form.types || [];
    if (types.length === 0) {
      setLabReviewForms(prev => ({ ...prev, [taskId]: { ...prev[taskId], error: 'Please select at least one consultation type.' } }));
      return;
    }
    setLabReviewForms(prev => ({ ...prev, [taskId]: { ...prev[taskId], submitting: true, error: null } }));
    try {
      const res = await fetch('/api/admin/complete-lab-review', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ task_id: taskId, patient_id: patientId, consultation_types: types, instructions: form.instructions || '' }),
      });
      const data = await res.json();
      if (data.success) {
        setLabReviewForms(prev => ({ ...prev, [taskId]: { ...prev[taskId], submitting: false, done: true } }));
        setLabReviewOpen(null);
        setTimeout(() => fetchTasks(), 800);
      } else {
        setLabReviewForms(prev => ({ ...prev, [taskId]: { ...prev[taskId], submitting: false, error: data.error || 'Submit failed' } }));
      }
    } catch (e) {
      setLabReviewForms(prev => ({ ...prev, [taskId]: { ...prev[taskId], submitting: false, error: 'Submit failed' } }));
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    const num = digits.startsWith('1') ? digits.slice(1) : digits;
    if (num.length === 10) return `(${num.slice(0,3)}) ${num.slice(3,6)}-${num.slice(6)}`;
    return phone;
  };

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }), [session]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ filter });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/tasks?${params}`, { headers: authHeaders() });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, filter, statusFilter]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/employees?basic=true', { headers: authHeaders() });
      if (!res.ok) {
        console.error('Failed to fetch employees:', res.status);
        setEmployees([]);
        return;
      }
      const data = await res.json();
      setEmployees(Array.isArray(data.employees) ? data.employees : Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setEmployees([]);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (session) {
      fetchTasks();
      fetchEmployees();
    }
  }, [session, fetchTasks, fetchEmployees]);

  // Patient search
  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2) {
      setPatientResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}`);
        const data = await res.json();
        setPatientResults(data.patients || data || []);
      } catch (err) {
        setPatientResults([]);
      } finally {
        setSearchingPatients(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Voice dictation — uses browser Web Speech API
  const startListening = (target = 'title') => {
    const SpeechRecognition = typeof window !== 'undefined'
      && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Try Chrome.');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    setDictationTarget(target);

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim = transcript;
        }
      }
      const currentText = (finalTranscript + interim).trim();
      if (target === 'title') {
        setForm(prev => ({ ...prev, title: currentText }));
      } else {
        setForm(prev => ({ ...prev, description: currentText }));
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setError('Microphone error: ' + event.error);
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  // Cleanup recognition when modal closes
  useEffect(() => {
    if (!showCreate && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }, [showCreate]);

  const toggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error('Toggle task error:', err);
    }
  };

  const toggleSelect = (taskId, e) => {
    e.stopPropagation();
    setSelectedTasks(prev => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(t => t.id)));
    }
  };

  const bulkComplete = async () => {
    if (selectedTasks.size === 0) return;
    setBulkCompleting(true);
    try {
      await Promise.all([...selectedTasks].map(id =>
        fetch('/api/admin/tasks', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ id, status: 'completed' }),
        })
      ));
      setSelectedTasks(new Set());
      fetchTasks();
    } catch (err) {
      console.error('Bulk complete error:', err);
    }
    setBulkCompleting(false);
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`/api/admin/tasks?id=${taskId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      fetchTasks();
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  const handleFormat = async () => {
    const text = form.title || form.description;
    if (!text?.trim()) return;
    setFormatting(true);
    try {
      const res = await fetch('/api/tasks/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text }),
      });
      const data = await res.json();
      if (data.formatted) {
        // If only title was filled, put formatted text in title
        // If description was filled, put formatted text in description
        if (form.description?.trim()) {
          setForm(prev => ({ ...prev, description: data.formatted }));
        } else {
          setForm(prev => ({ ...prev, title: data.formatted }));
        }
      }
    } catch (err) {
      console.error('Format error:', err);
    } finally {
      setFormatting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.assigned_to) {
      setError('Title and assignee are required');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description?.trim() || null,
          assigned_to: form.assigned_to,
          patient_id: selectedPatient?.id || null,
          patient_name: selectedPatient?.name || form.patient_name || null,
          priority: form.priority,
          due_date: form.due_date || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setForm({ title: '', description: '', assigned_to: '', patient_name: '', priority: 'medium', due_date: '' });
        setSelectedPatient(null);
        setPatientSearch('');
        fetchTasks();
      } else {
        setError(data.error || 'Failed to create task');
      }
    } catch (err) {
      setError('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date + 'T23:59:59') < new Date();
  };

  const getTimeAgo = (dateStr) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Group tasks by due date sections
  const groupTasksByDate = (taskList) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    const nextWeekEnd = new Date(now);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 14);
    const nextWeekEndStr = nextWeekEnd.toISOString().split('T')[0];

    const groups = {
      overdue: { label: 'Overdue', tasks: [], color: '#dc2626', bg: '#fef2f2', border: '#fecaca', defaultExpanded: true },
      today: { label: 'Today', tasks: [], color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', defaultExpanded: true },
      tomorrow: { label: 'Tomorrow', tasks: [], color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', defaultExpanded: true },
      thisWeek: { label: 'This Week', tasks: [], color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', defaultExpanded: true },
      nextWeek: { label: 'Next Week', tasks: [], color: '#4b5563', bg: '#f9fafb', border: '#e5e7eb', defaultExpanded: false },
      later: { label: 'Later', tasks: [], color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', defaultExpanded: false },
      noDueDate: { label: 'No Due Date', tasks: [], color: '#9ca3af', bg: '#fafafa', border: '#e5e7eb', defaultExpanded: true },
    };

    taskList.forEach(task => {
      if (!task.due_date) {
        groups.noDueDate.tasks.push(task);
      } else if (task.status === 'completed') {
        // Completed tasks go to their original date group
        if (task.due_date < todayStr) groups.overdue.tasks.push(task);
        else if (task.due_date === todayStr) groups.today.tasks.push(task);
        else if (task.due_date === tomorrowStr) groups.tomorrow.tasks.push(task);
        else if (task.due_date <= weekEndStr) groups.thisWeek.tasks.push(task);
        else if (task.due_date <= nextWeekEndStr) groups.nextWeek.tasks.push(task);
        else groups.later.tasks.push(task);
      } else if (task.due_date < todayStr) {
        groups.overdue.tasks.push(task);
      } else if (task.due_date === todayStr) {
        groups.today.tasks.push(task);
      } else if (task.due_date === tomorrowStr) {
        groups.tomorrow.tasks.push(task);
      } else if (task.due_date <= weekEndStr) {
        groups.thisWeek.tasks.push(task);
      } else if (task.due_date <= nextWeekEndStr) {
        groups.nextWeek.tasks.push(task);
      } else {
        groups.later.tasks.push(task);
      }
    });

    // Sort overdue tasks by due date ascending (oldest overdue first)
    groups.overdue.tasks.sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

    return Object.entries(groups).filter(([, g]) => g.tasks.length > 0);
  };

  // Apply employee filter + patient name search
  const filteredTasks = tasks.filter(t => {
    if (employeeFilter && t.assigned_to !== employeeFilter) return false;
    if (patientSearchFilter) {
      const q = patientSearchFilter.toLowerCase();
      const nameMatch = t.patient_name?.toLowerCase().includes(q);
      const titleMatch = t.title?.toLowerCase().includes(q);
      if (!nameMatch && !titleMatch) return false;
    }
    return true;
  });

  // Group tasks (only for pending view — completed tasks show flat)
  const dateGroups = statusFilter === 'pending' ? groupTasksByDate(filteredTasks) : null;

  // Track collapsed groups
  const toggleGroup = (groupKey) => {
    setCollapsedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };
  const isGroupCollapsed = (groupKey, defaultExpanded) => {
    if (collapsedGroups[groupKey] !== undefined) return collapsedGroups[groupKey];
    return !defaultExpanded;
  };

  return (
    <AdminLayout title="Tasks">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #c5c5c5;
          pointer-events: none;
        }
        [contenteditable]:focus {
          outline: none;
          border-color: #111 !important;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
        }
      `}</style>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Tasks</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
              {employeeFilter && employees.find(e => e.id === employeeFilter) && ` · ${employees.find(e => e.id === employeeFilter).name}`}
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} style={sharedStyles.btnPrimary}>
            + New Task
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '2px solid #f0f0f0' }}>
          {[
            { value: 'my', label: 'My Tasks' },
            { value: 'assigned', label: 'Assigned by Me' },
            ...(employee?.is_admin ? [{ value: 'all', label: 'All Tasks' }] : []),
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value); setEmployeeFilter(''); }}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: filter === tab.value ? 700 : 500,
                color: filter === tab.value ? '#1e40af' : '#666',
                background: 'none',
                border: 'none',
                borderBottom: filter === tab.value ? '2px solid #1e40af' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px',
              }}
            >
              {tab.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {/* Patient name search */}
          <div style={{ position: 'relative', marginBottom: '4px', marginRight: '8px' }}>
            <input
              type="text"
              value={patientSearchFilter}
              onChange={e => setPatientSearchFilter(e.target.value)}
              placeholder="Search patient..."
              style={{
                ...sharedStyles.input,
                width: '160px',
                fontSize: '12px',
                padding: '4px 28px 4px 8px',
                margin: 0,
              }}
            />
            {patientSearchFilter && (
              <button
                onClick={() => setPatientSearchFilter('')}
                style={{
                  position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#999',
                  fontSize: '14px', padding: '0 4px', lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>
          {/* Employee filter — shown on "All Tasks" view */}
          {filter === 'all' && (
            <select
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
              style={{ ...sharedStyles.input, width: 'auto', fontSize: '12px', padding: '4px 8px', marginBottom: '4px', marginRight: '8px' }}
            >
              <option value="">All Employees</option>
              {employees
                .filter(e => e.is_active !== false)
                .map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}{e.id === employee?.id ? ' (Me)' : ''}
                  </option>
                ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ ...sharedStyles.input, width: 'auto', fontSize: '12px', padding: '4px 8px', marginBottom: '4px' }}
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="">All</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 12px', borderRadius: 0, fontSize: '13px', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        {/* Bulk action bar — appears when tasks are selected */}
        {selectedTasks.size > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#1a1a1a', color: '#fff',
            padding: '10px 16px', borderRadius: 0,
            marginBottom: '10px', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={bulkComplete}
              disabled={bulkCompleting}
              style={{
                background: '#16a34a', color: '#fff', border: 'none',
                padding: '6px 16px', borderRadius: 0, fontSize: '13px',
                fontWeight: 600, cursor: 'pointer', opacity: bulkCompleting ? 0.6 : 1,
              }}
            >
              {bulkCompleting ? 'Completing…' : `✓ Complete ${selectedTasks.size} task${selectedTasks.size !== 1 ? 's' : ''}`}
            </button>
            <button
              onClick={() => setSelectedTasks(new Set())}
              style={{
                background: 'transparent', color: '#9ca3af', border: '1px solid #374151',
                padding: '6px 12px', borderRadius: 0, fontSize: '13px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={selectAll}
              style={{
                background: 'transparent', color: '#9ca3af', border: 'none',
                fontSize: '12px', cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              {selectedTasks.size === tasks.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
        )}

        {/* Task list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>&#9745;</div>
            <p style={{ color: '#888', fontSize: '14px' }}>
              {statusFilter === 'pending' ? 'No pending tasks' : 'No tasks found'}
              {employeeFilter && ' for this employee'}
            </p>
          </div>
        ) : dateGroups ? (
          /* ── Grouped by date (pending view) ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dateGroups.map(([groupKey, group]) => {
              const collapsed = isGroupCollapsed(groupKey, group.defaultExpanded);
              return (
                <div key={groupKey}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(groupKey)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      width: '100%', padding: '8px 12px', marginBottom: collapsed ? 0 : '8px',
                      background: group.bg, border: `1px solid ${group.border}`,
                      borderRadius: 0, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{
                      fontSize: '11px', color: group.color,
                      transition: 'transform 0.15s',
                      transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                    }}>▶</span>
                    <span style={{
                      fontSize: '13px', fontWeight: 700, color: group.color,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {group.label}
                    </span>
                    <span style={{
                      fontSize: '12px', fontWeight: 600, color: group.color,
                      background: groupKey === 'overdue' ? '#fecaca' : 'rgba(0,0,0,0.06)',
                      padding: '1px 8px', borderRadius: '10px',
                    }}>
                      {group.tasks.length}
                    </span>
                  </button>
                  {/* Group tasks */}
                  {!collapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {group.tasks.map(task => {
                        const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                        const overdue = isOverdue(task);
                        const isExpanded = expandedTask === task.id;
                        const hasDescription = task.description && task.description.trim();
                        return (
                          <div
                            key={task.id}
                            style={{
                              background: task.status === 'completed' ? '#fafafa' : '#fff',
                              border: `1px solid ${overdue ? '#fecaca' : isExpanded ? '#3b82f6' : '#e5e7eb'}`,
                              borderRadius: 0,
                              opacity: task.status === 'completed' ? 0.7 : 1,
                              transition: 'border-color 0.15s',
                            }}
                          >
                  {/* Collapsed row — always visible */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  >
                    {/* Select checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={(e) => toggleSelect(task.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '16px', height: '16px', flexShrink: 0,
                        marginTop: '4px', cursor: 'pointer', accentColor: '#3b82f6',
                      }}
                    />

                    {/* Complete toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleComplete(task); }}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: 0,
                        border: `2px solid ${task.status === 'completed' ? '#16a34a' : '#d1d5db'}`,
                        background: task.status === 'completed' ? '#16a34a' : '#fff',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {task.status === 'completed' ? '✓' : ''}
                    </button>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: task.status === 'completed' ? '#999' : '#1a1a1a',
                          textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                          ...(!isExpanded && hasDescription ? {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '400px',
                          } : {}),
                        }}>
                          {task.title}
                        </span>
                        <span style={{
                          padding: '1px 8px',
                          borderRadius: 0,
                          fontSize: '10px',
                          fontWeight: 600,
                          background: pri.bg,
                          color: pri.text,
                          border: `1px solid ${pri.border}`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          flexShrink: 0,
                        }}>
                          {pri.label}
                        </span>
                        {!isExpanded && hasDescription && (
                          <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>
                            ▸ tap to view
                          </span>
                        )}
                      </div>
                      {!isExpanded && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: '#999', marginTop: '4px' }}>
                          {filter !== 'my' && (
                            <span>To: <strong style={{ color: '#666' }}>{task.assigned_to_name}</strong></span>
                          )}
                          <span>From: {task.assigned_by_name}</span>
                          {task.due_date && (
                            <span style={{ color: overdue ? '#dc2626' : '#999', fontWeight: overdue ? 600 : 400 }}>
                              {overdue ? 'Overdue: ' : 'Due: '}{formatDate(task.due_date)}
                            </span>
                          )}
                          <span>{getTimeAgo(task.created_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Expand indicator + Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span style={{ color: '#ccc', fontSize: '12px', transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        ▶
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ccc',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '2px 4px',
                        }}
                        title="Delete task"
                      >
                        &#10005;
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div style={{
                      padding: '0 16px 16px 50px',
                      borderTop: '1px solid #f0f0f0',
                      marginTop: '-4px',
                      paddingTop: '12px',
                    }}>
                      {/* Full title if it was truncated */}
                      {hasDescription && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                            Task
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', lineHeight: 1.5 }}>
                            {task.title}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {hasDescription && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                            Details
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#374151',
                            lineHeight: 1.7,
                            whiteSpace: 'pre-wrap',
                            background: task.title?.includes('Review labs') ? '#f8f7ff' : '#f9fafb',
                            padding: '10px 14px',
                            borderRadius: 0,
                            border: `1px solid ${task.title?.includes('Review labs') ? '#e0d9ff' : '#f0f0f0'}`,
                          }}>
                            {task.title?.includes('Review labs') ? getDisplayDescription(task.description) : task.description}
                          </div>
                        </div>
                      )}

                      {/* Lab review actions — View Lab, View PDF, Complete Review */}
                      {task.title?.includes('Review labs') && task.patient_id && task.status !== 'completed' && (
                        <div style={{ marginBottom: '14px' }}>
                          {/* View buttons */}
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); openLabPanel('results', task); }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '7px 14px', fontSize: '12px', fontWeight: 600,
                                color: '#4c1d95', background: '#f5f3ff',
                                border: '1px solid #c4b5fd', borderRadius: 0, cursor: 'pointer',
                              }}
                            >
                              🔬 View Lab Results
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openLabPanel('pdf', task); }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '7px 14px', fontSize: '12px', fontWeight: 600,
                                color: '#1e3a5f', background: '#eff6ff',
                                border: '1px solid #bfdbfe', borderRadius: 0, cursor: 'pointer',
                              }}
                            >
                              📄 View PDF
                            </button>
                          </div>

                          {/* Complete Review section */}
                          {!labReviewForms[task.id]?.done ? (
                            <div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setLabReviewOpen(labReviewOpen === task.id ? null : task.id); }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  padding: '8px 18px', fontSize: '13px', fontWeight: 600,
                                  color: '#fff', background: '#111',
                                  border: 'none', borderRadius: 0, cursor: 'pointer',
                                  marginBottom: labReviewOpen === task.id ? '10px' : '0',
                                }}
                              >
                                {labReviewOpen === task.id ? '▲ Close Review' : '✓ Complete Review'}
                              </button>

                              {labReviewOpen === task.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    padding: '14px 16px',
                                    background: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 0,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                  }}
                                >
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Select consultation type(s) for Tara to schedule:
                                  </div>
                                  {['Schedule Telemedicine', 'Schedule In Person', 'Schedule Telephone Call'].map(type => {
                                    const checked = (labReviewForms[task.id]?.types || []).includes(type);
                                    return (
                                      <label
                                        key={type}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: '10px',
                                          padding: '8px 10px', marginBottom: '6px',
                                          background: checked ? '#f0fdf4' : '#f9fafb',
                                          border: `1px solid ${checked ? '#86efac' : '#e5e7eb'}`,
                                          borderRadius: 0, cursor: 'pointer',
                                          fontSize: '13px', fontWeight: checked ? 600 : 400,
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => {
                                            const current = labReviewForms[task.id]?.types || [];
                                            const updated = e.target.checked ? [...current, type] : current.filter(t => t !== type);
                                            setLabReviewForms(prev => ({ ...prev, [task.id]: { ...prev[task.id], types: updated } }));
                                          }}
                                          style={{ width: '16px', height: '16px', accentColor: '#16a34a' }}
                                        />
                                        {type}
                                      </label>
                                    );
                                  })}

                                  <div style={{ marginTop: '12px', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Instructions for Tara (optional):
                                  </div>
                                  <textarea
                                    value={labReviewForms[task.id]?.instructions || ''}
                                    onChange={(e) => setLabReviewForms(prev => ({ ...prev, [task.id]: { ...prev[task.id], instructions: e.target.value } }))}
                                    placeholder="e.g. Patient prefers mornings, needs 60-min slot, follow up on medication question..."
                                    style={{
                                      width: '100%', padding: '10px 12px', fontSize: '13px',
                                      border: '1px solid #d1d5db', borderRadius: 0, outline: 'none',
                                      resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
                                      minHeight: '70px', boxSizing: 'border-box', background: '#fff',
                                    }}
                                  />

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); submitLabReview(task.id, task.patient_id); }}
                                      disabled={labReviewForms[task.id]?.submitting}
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '9px 20px', fontSize: '13px', fontWeight: 700,
                                        color: '#fff',
                                        background: labReviewForms[task.id]?.submitting ? '#9ca3af' : '#16a34a',
                                        border: 'none', borderRadius: 0,
                                        cursor: labReviewForms[task.id]?.submitting ? 'not-allowed' : 'pointer',
                                      }}
                                    >
                                      {labReviewForms[task.id]?.submitting ? '⏳ Sending...' : '📨 Send to Tara & Chris'}
                                    </button>
                                  </div>
                                  {labReviewForms[task.id]?.error && (
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626' }}>
                                      {labReviewForms[task.id].error}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '10px 14px', background: '#f0fdf4',
                              border: '1px solid #86efac', borderRadius: 0,
                              fontSize: '13px', fontWeight: 600, color: '#16a34a',
                            }}>
                              ✓ Review complete — Tara & Chris have been notified
                            </div>
                          )}
                        </div>
                      )}

                      {/* Patient contact — phone + action buttons */}
                      {task.patient_phone && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                            padding: '10px 14px',
                            background: '#f0fdf4', borderRadius: 0,
                            border: '1px solid #bbf7d0',
                            borderBottom: smsState[task.id]?.open ? 'none' : '1px solid #bbf7d0',
                          }}>
                            <Phone size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                            <a
                              href={`tel:${task.patient_phone}`}
                              style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}
                            >
                              {formatPhone(task.patient_phone)}
                            </a>
                            <button
                              onClick={(e) => { e.stopPropagation(); openSmsComposer(task); }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                                color: '#1e40af', background: '#eff6ff',
                                border: '1px solid #bfdbfe', borderRadius: 0,
                                cursor: 'pointer',
                              }}
                            >
                              <MessageSquare size={12} /> Text
                            </button>
                            {task.patient_id && (
                              <button
                                onClick={(e) => { e.stopPropagation(); generateRenewalText(task); }}
                                disabled={smsState[task.id]?.loading}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                                  padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                                  color: '#7c3aed', background: '#f5f3ff',
                                  border: '1px solid #ddd6fe', borderRadius: 0,
                                  cursor: smsState[task.id]?.loading ? 'not-allowed' : 'pointer',
                                  opacity: smsState[task.id]?.loading ? 0.6 : 1,
                                }}
                              >
                                {smsState[task.id]?.loading ? (
                                  <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                                ) : (
                                  <><Sparkles size={12} /> AI Draft Text</>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Inline SMS composer */}
                          {smsState[task.id]?.open && (
                            <div style={{
                              padding: '12px 14px',
                              background: '#f9fafb', borderRadius: 0,
                              border: '1px solid #bbf7d0', borderTop: '1px solid #e5e7eb',
                            }}>
                              {smsState[task.id]?.sent && (
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  padding: '6px 10px', marginBottom: '8px',
                                  background: '#f0fdf4', borderRadius: 0,
                                  fontSize: '13px', fontWeight: 600, color: '#16a34a',
                                }}>
                                  &#10003; Message sent to {task.patient_name?.split(' ')[0]}
                                </div>
                              )}
                              <textarea
                                value={smsState[task.id]?.message || ''}
                                onChange={(e) => setSmsState(prev => ({
                                  ...prev,
                                  [task.id]: { ...prev[task.id], message: e.target.value, sent: false }
                                }))}
                                onClick={(e) => e.stopPropagation()}
                                placeholder={`Type a message to ${task.patient_name?.split(' ')[0] || 'patient'}...`}
                                style={{
                                  width: '100%', padding: '10px 12px', fontSize: '13px',
                                  border: '1px solid #d1d5db', borderRadius: 0, outline: 'none',
                                  resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5',
                                  minHeight: '60px', boxSizing: 'border-box', background: '#fff',
                                }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); sendTaskSms(task); }}
                                  disabled={smsState[task.id]?.sending || !smsState[task.id]?.message?.trim()}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 14px', fontSize: '13px', fontWeight: 600,
                                    color: '#fff', background: (!smsState[task.id]?.message?.trim() || smsState[task.id]?.sending) ? '#9ca3af' : '#1e40af',
                                    border: 'none', borderRadius: 0,
                                    cursor: (!smsState[task.id]?.message?.trim() || smsState[task.id]?.sending) ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {smsState[task.id]?.sending ? (
                                    <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                                  ) : (
                                    <><Send size={13} /> Send</>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], open: false } })); }}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: '12px', color: '#999', fontWeight: 500,
                                  }}
                                >
                                  Close
                                </button>
                                {smsState[task.id]?.error && (
                                  <span style={{ fontSize: '12px', color: '#dc2626' }}>{smsState[task.id].error}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* No phone warning for patient-linked tasks */}
                      {task.patient_id && !task.patient_phone && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          marginBottom: '12px', padding: '8px 14px',
                          background: '#fef3c7', borderRadius: 0, border: '1px solid #fde68a',
                          fontSize: '12px', color: '#92400e',
                        }}>
                          <Phone size={12} /> No phone number on file for {task.patient_name}
                        </div>
                      )}

                      {/* Metadata grid */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px' }}>
                        <div>
                          <span style={{ color: '#9ca3af' }}>Assigned to: </span>
                          <strong style={{ color: '#374151' }}>{task.assigned_to_name}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#9ca3af' }}>Created by: </span>
                          <strong style={{ color: '#374151' }}>{task.assigned_by_name}</strong>
                        </div>
                        {task.patient_name && (
                          <div>
                            <span style={{ color: '#9ca3af' }}>Patient: </span>
                            {task.patient_id ? (
                              <a
                                href={`/admin/patient/${task.patient_id}`}
                                style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}
                                onClick={e => e.stopPropagation()}
                              >
                                {task.patient_name}
                              </a>
                            ) : (
                              <strong style={{ color: '#374151' }}>{task.patient_name}</strong>
                            )}
                          </div>
                        )}
                        {task.due_date && (
                          <div>
                            <span style={{ color: '#9ca3af' }}>Due: </span>
                            <strong style={{ color: overdue ? '#dc2626' : '#374151' }}>
                              {formatDate(task.due_date)}{overdue ? ' (Overdue)' : ''}
                            </strong>
                          </div>
                        )}
                        <div>
                          <span style={{ color: '#9ca3af' }}>Created: </span>
                          <span style={{ color: '#374151' }}>{getTimeAgo(task.created_at)}</span>
                        </div>
                        {task.completed_at && (
                          <div>
                            <span style={{ color: '#9ca3af' }}>Completed: </span>
                            <span style={{ color: '#16a34a' }}>{getTimeAgo(task.completed_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Inline encounter editor for "Document encounter" tasks */}
                      {task.title?.startsWith('Document encounter') && task.status !== 'completed' && (
                        <InlineEncounterEditor
                          task={task}
                          session={session}
                          currentUser={employee?.email || ''}
                          onTaskComplete={() => toggleComplete(task)}
                        />
                      )}
                    </div>
                  )}
                </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Flat list (completed / all status view) ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTasks.map(task => {
              const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const overdue = isOverdue(task);
              const isExpanded = expandedTask === task.id;
              const hasDescription = task.description && task.description.trim();
              return (
                <div
                  key={task.id}
                  style={{
                    background: task.status === 'completed' ? '#fafafa' : '#fff',
                    border: `1px solid ${overdue ? '#fecaca' : isExpanded ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: 0,
                    opacity: task.status === 'completed' ? 0.7 : 1,
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Collapsed row — always visible */}
                  <div
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', cursor: 'pointer' }}
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  >
                    <input type="checkbox" checked={selectedTasks.has(task.id)} onChange={(e) => toggleSelect(task.id, e)} onClick={(e) => e.stopPropagation()} style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '4px', cursor: 'pointer', accentColor: '#3b82f6' }} />
                    <button onClick={(e) => { e.stopPropagation(); toggleComplete(task); }} style={{ width: '22px', height: '22px', borderRadius: 0, border: `2px solid ${task.status === 'completed' ? '#16a34a' : '#d1d5db'}`, background: task.status === 'completed' ? '#16a34a' : '#fff', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>{task.status === 'completed' ? '✓' : ''}</button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: task.status === 'completed' ? '#999' : '#1a1a1a', textDecoration: task.status === 'completed' ? 'line-through' : 'none', ...(!isExpanded && hasDescription ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' } : {}) }}>{task.title}</span>
                        <span style={{ padding: '1px 8px', borderRadius: 0, fontSize: '10px', fontWeight: 600, background: pri.bg, color: pri.text, border: `1px solid ${pri.border}`, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{pri.label}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: '#999', marginTop: '4px' }}>
                        {filter !== 'my' && <span>To: <strong style={{ color: '#666' }}>{task.assigned_to_name}</strong></span>}
                        <span>From: {task.assigned_by_name}</span>
                        {task.due_date && <span style={{ color: overdue ? '#dc2626' : '#999', fontWeight: overdue ? 600 : 400 }}>{overdue ? 'Overdue: ' : 'Due: '}{formatDate(task.due_date)}</span>}
                        <span>{getTimeAgo(task.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span style={{ color: '#ccc', fontSize: '12px', transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '16px', padding: '2px 4px' }} title="Delete task">&#10005;</button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '0 16px 16px 50px', borderTop: '1px solid #f0f0f0', marginTop: '-4px', paddingTop: '12px' }}>
                      {hasDescription && <div style={{ marginBottom: '12px' }}><div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Details</div><div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#f9fafb', padding: '10px 14px', borderRadius: 0, border: '1px solid #f0f0f0' }}>{task.description}</div></div>}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px' }}>
                        <div><span style={{ color: '#9ca3af' }}>Assigned to: </span><strong style={{ color: '#374151' }}>{task.assigned_to_name}</strong></div>
                        <div><span style={{ color: '#9ca3af' }}>Created by: </span><strong style={{ color: '#374151' }}>{task.assigned_by_name}</strong></div>
                        {task.due_date && <div><span style={{ color: '#9ca3af' }}>Due: </span><strong style={{ color: overdue ? '#dc2626' : '#374151' }}>{formatDate(task.due_date)}{overdue ? ' (Overdue)' : ''}</strong></div>}
                        <div><span style={{ color: '#9ca3af' }}>Created: </span><span style={{ color: '#374151' }}>{getTimeAgo(task.created_at)}</span></div>
                        {task.completed_at && <div><span style={{ color: '#9ca3af' }}>Completed: </span><span style={{ color: '#16a34a' }}>{getTimeAgo(task.completed_at)}</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <div style={sharedStyles.modalOverlay} {...overlayClickProps(() => setShowCreate(false))}>
          <div style={{ ...sharedStyles.modal, maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={sharedStyles.modalHeader}>
              <h2 style={sharedStyles.modalTitle}>New Task</h2>
              <button onClick={() => setShowCreate(false)} style={sharedStyles.modalClose}>&#10005;</button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={sharedStyles.modalBody}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Title with Voice + AI Format */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={sharedStyles.label}>Task</label>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <button
                          type="button"
                          onClick={() => listening && dictationTarget === 'title' ? stopListening() : startListening('title')}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                            color: listening && dictationTarget === 'title' ? '#fff' : '#dc2626',
                            background: listening && dictationTarget === 'title' ? '#dc2626' : '#fef2f2',
                            border: '1px solid', borderColor: listening && dictationTarget === 'title' ? '#dc2626' : '#fecaca',
                            borderRadius: 0,
                            cursor: 'pointer',
                            animation: listening && dictationTarget === 'title' ? 'pulse 1.5s infinite' : 'none',
                          }}
                        >
                          {listening && dictationTarget === 'title' ? <MicOff size={13} /> : <Mic size={13} />}
                          {listening && dictationTarget === 'title' ? 'Stop' : 'Dictate'}
                        </button>
                        <button
                          type="button"
                          onClick={handleFormat}
                          disabled={formatting || (!form.title.trim() && !form.description.trim())}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                            color: formatting ? '#9ca3af' : '#7c3aed',
                            background: formatting ? '#f3f4f6' : '#f5f3ff',
                            border: '1px solid', borderColor: formatting ? '#e5e7eb' : '#ddd6fe',
                            borderRadius: 0,
                            cursor: formatting || (!form.title.trim() && !form.description.trim()) ? 'not-allowed' : 'pointer',
                            opacity: (!form.title.trim() && !form.description.trim()) ? 0.5 : 1,
                          }}
                        >
                          <Sparkles size={13} />
                          {formatting ? 'Formatting...' : 'AI Format'}
                        </button>
                      </div>
                    </div>
                    {listening && dictationTarget === 'title' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 10px', marginBottom: '6px',
                        background: '#fef2f2', borderRadius: 0,
                        fontSize: '12px', color: '#dc2626', fontWeight: 500,
                      }}>
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: '#dc2626', animation: 'pulse 1s infinite',
                        }} />
                        Listening... speak now
                      </div>
                    )}
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Type or tap Dictate to speak your task..."
                      style={{
                        ...sharedStyles.input,
                        ...(listening && dictationTarget === 'title' ? { borderColor: '#dc2626', boxShadow: '0 0 0 2px rgba(220,38,38,0.1)' } : {}),
                      }}
                      autoFocus
                      required
                    />
                  </div>

                  {/* Description with Voice */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={sharedStyles.label}>Details (optional)</label>
                      <button
                        type="button"
                        onClick={() => listening && dictationTarget === 'description' ? stopListening() : startListening('description')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '3px 8px', fontSize: '11px', fontWeight: 600,
                          color: listening && dictationTarget === 'description' ? '#fff' : '#dc2626',
                          background: listening && dictationTarget === 'description' ? '#dc2626' : '#fef2f2',
                          border: '1px solid', borderColor: listening && dictationTarget === 'description' ? '#dc2626' : '#fecaca',
                          borderRadius: 0,
                          cursor: 'pointer',
                          marginBottom: '6px',
                        }}
                      >
                        {listening && dictationTarget === 'description' ? <MicOff size={11} /> : <Mic size={11} />}
                        {listening && dictationTarget === 'description' ? 'Stop' : 'Dictate'}
                      </button>
                    </div>
                    {listening && dictationTarget === 'description' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 10px', marginBottom: '6px',
                        background: '#fef2f2', borderRadius: 0,
                        fontSize: '12px', color: '#dc2626', fontWeight: 500,
                      }}>
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: '#dc2626', animation: 'pulse 1s infinite',
                        }} />
                        Listening... speak now
                      </div>
                    )}
                    <textarea
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details..."
                      style={{
                        width: '100%', padding: '10px 12px', fontSize: '14px',
                        border: '1px solid #d1d5db', borderRadius: 0, outline: 'none',
                        resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5',
                        minHeight: '80px', boxSizing: 'border-box',
                        ...(listening && dictationTarget === 'description' ? { borderColor: '#dc2626', boxShadow: '0 0 0 2px rgba(220,38,38,0.1)' } : {}),
                      }}
                    />
                  </div>

                  {/* Assign to */}
                  <div>
                    <label style={sharedStyles.label}>Assign to</label>
                    <select
                      value={form.assigned_to}
                      onChange={e => setForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                      style={sharedStyles.input}
                      required
                    >
                      <option value="">Select team member...</option>
                      {employees
                        .filter(e => e.is_active !== false)
                        .map(e => (
                          <option key={e.id} value={e.id}>
                            {e.name}{e.id === employee?.id ? ' (Me)' : ''}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Priority + Due Date row */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={sharedStyles.label}>Priority</label>
                      <select
                        value={form.priority}
                        onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
                        style={sharedStyles.input}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={sharedStyles.label}>Due Date (optional)</label>
                      <input
                        type="date"
                        value={form.due_date}
                        onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                        style={sharedStyles.input}
                      />
                    </div>
                  </div>

                  {/* Patient link (optional) */}
                  <div>
                    <label style={sharedStyles.label}>Link to Patient (optional)</label>
                    {selectedPatient ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 12px', background: '#f0f9ff', borderRadius: 0,
                        border: '1px solid #bae6fd',
                      }}>
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{selectedPatient.name}</span>
                        <button
                          type="button"
                          onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '16px' }}
                        >
                          &#10005;
                        </button>
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={patientSearch}
                          onChange={e => setPatientSearch(e.target.value)}
                          placeholder="Search patient name..."
                          style={sharedStyles.input}
                        />
                        {patientResults.length > 0 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 0,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto',
                          }}>
                            {patientResults.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPatient(p);
                                  setPatientSearch('');
                                  setPatientResults([]);
                                }}
                                style={{
                                  display: 'block', width: '100%', textAlign: 'left',
                                  padding: '8px 12px', border: 'none', background: 'none',
                                  cursor: 'pointer', fontSize: '13px',
                                }}
                                onMouseEnter={e => e.target.style.background = '#f0f9ff'}
                                onMouseLeave={e => e.target.style.background = 'none'}
                              >
                                {p.name}
                                {p.email && <span style={{ color: '#999', marginLeft: '8px' }}>{p.email}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                        {searchingPatients && (
                          <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '11px', color: '#999' }}>
                            Searching...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={sharedStyles.modalFooter}>
                <button type="button" onClick={() => setShowCreate(false)} style={sharedStyles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={creating} style={{
                  ...sharedStyles.btnPrimary,
                  ...(creating ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                }}>
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Lab results / PDF slide-in panel */}
      {labPanel && (
        <>
          <div
            onClick={() => setLabPanel(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: 'min(62%, 900px)',
            background: '#fff', zIndex: 201,
            boxShadow: '-4px 0 32px rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInPanel 0.2s ease-out',
          }}>
            <style>{`@keyframes slideInPanel { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            {/* Panel header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>
                  {labPanel.type === 'results' ? '🔬 Lab Results' : '📄 Lab Report PDF'}
                </span>
                {labPanel.patientName && (
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>— {labPanel.patientName}</span>
                )}
              </div>
              <button
                onClick={() => setLabPanel(null)}
                style={{
                  background: '#f3f4f6', border: 'none', borderRadius: 0,
                  width: '32px', height: '32px', cursor: 'pointer',
                  fontSize: '16px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Panel content */}
            {labPanel.type === 'results' && labPanel.labId ? (
              <iframe
                src={`/patient/labs?id=${labPanel.labId}`}
                style={{ flex: 1, border: 'none', display: 'block' }}
                title="Lab Results"
              />
            ) : labPanel.type === 'pdf' && labPanel.pdfUrl ? (
              <iframe
                src={labPanel.pdfUrl}
                style={{ flex: 1, border: 'none', display: 'block' }}
                title="Lab PDF"
              />
            ) : (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: '#9ca3af', fontSize: '14px', gap: '12px', padding: '40px',
              }}>
                <span style={{ fontSize: '32px' }}>{labPanel.type === 'results' ? '🔬' : '📄'}</span>
                <div style={{ textAlign: 'center' }}>
                  {labPanel.type === 'results'
                    ? 'Lab results not found for this patient.'
                    : 'No PDF on file for this patient yet.'}
                </div>
                {labPanel.type === 'pdf' && labPanel.labId && (
                  <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', maxWidth: '300px' }}>
                    The individual PDF may not have been split during the original import.
                    Re-importing the Primex batch will generate it.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
