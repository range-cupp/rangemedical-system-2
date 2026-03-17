// components/StandaloneEncounterModal.js
// Create an encounter note for a patient that has no linked appointment
// Used for walk-ins, unscheduled visits, or retroactive documentation
// Range Medical System

import { useState, useRef, useEffect } from 'react';
import { ENCOUNTER_TEMPLATES, getTemplatesForCategory } from '../lib/encounter-templates';
import { ENCOUNTER_FORMS } from '../lib/encounter-form-config';
import InteractiveEncounterForm from './InteractiveEncounterForm';

const SERVICE_OPTIONS = Object.entries(ENCOUNTER_TEMPLATES).map(([key, val]) => ({
  value: key,
  label: val.label,
}));

// ── Markdown ↔ HTML helpers ───────────────────────────────────────────────────

// Convert **bold** markdown + newlines → HTML for contentEditable display
function mdToHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// Convert contentEditable HTML back to **bold** markdown for storage
function htmlToMd(html) {
  if (!html) return '';
  return html
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, (_, inner) => `**${inner.replace(/<[^>]*>/g, '')}**`)
    .replace(/<b>([\s\S]*?)<\/b>/gi, (_, inner) => `**${inner.replace(/<[^>]*>/g, '')}**`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div><br\s*\/?><\/div>/gi, '\n')
    .replace(/<div>([\s\S]*?)<\/div>/gi, '\n$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StandaloneEncounterModal({ patient, currentUser, onClose, onRefresh }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    visitDate: today,
    serviceType: 'general',
    provider: currentUser || '',
  });
  const [step, setStep] = useState('form'); // 'form' | 'preview'
  const [noteFormatted, setNoteFormatted] = useState('');
  const [noteIsEmpty, setNoteIsEmpty] = useState(true);
  const [formatting, setFormatting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [error, setError] = useState('');
  const [noteMode, setNoteMode] = useState('freetext'); // 'freetext' | 'interactive'

  const noteRef = useRef(null);
  const recognitionRef = useRef(null);

  // Focus the editor when stepping back from preview
  useEffect(() => {
    if (step === 'form' && noteRef.current) {
      noteRef.current.focus();
    }
  }, [step]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getNoteMarkdown = () => htmlToMd(noteRef.current?.innerHTML || '');

  // Select the next ?? placeholder in a contentEditable element
  const selectNextPlaceholder = (el, fromStart = false) => {
    if (!el) return false;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    let node;
    let firstMatch = null;
    while ((node = walker.nextNode())) {
      const idx = node.textContent.indexOf('??');
      if (idx !== -1) {
        if (!firstMatch) firstMatch = { node, idx };
        if (fromStart) break; // Just grab the first one
      }
    }
    if (firstMatch) {
      const range = document.createRange();
      range.setStart(firstMatch.node, firstMatch.idx);
      range.setEnd(firstMatch.node, firstMatch.idx + 2);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    }
    return false;
  };

  const loadTemplate = (body) => {
    if (noteRef.current) {
      const existing = noteRef.current.innerHTML.trim();
      const separator = existing ? '<br><br><hr><br>' : '';
      noteRef.current.innerHTML = (existing ? existing + separator : '') + mdToHtml(body);
      setNoteIsEmpty(false);
      noteRef.current.focus();
      // Jump to first ?? placeholder in the newly appended template, or move cursor to end
      setTimeout(() => {
        // Find ?? placeholders — selectNextPlaceholder scans from start,
        // but we want the first one in the appended section
        const el = noteRef.current;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        let node;
        let lastMatch = null;
        let foundInNew = false;
        // Walk all text nodes and find the first ?? that appears in the new content
        // We track all ?? and use the ones after the separator
        const allMatches = [];
        while ((node = walker.nextNode())) {
          let searchFrom = 0;
          while (true) {
            const idx = node.textContent.indexOf('??', searchFrom);
            if (idx === -1) break;
            allMatches.push({ node, idx });
            searchFrom = idx + 2;
          }
        }
        // If we appended, jump to first ?? in the new body text
        // Otherwise jump to first ?? overall
        const bodyHasPlaceholder = body.includes('??');
        if (allMatches.length > 0 && bodyHasPlaceholder) {
          // Jump to first ?? (selectNextPlaceholder from start works fine)
          if (!selectNextPlaceholder(el, true)) {
            // fallback: cursor to end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(el);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        } else {
          // No ??, move cursor to end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(el);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }, 50);
    }
  };

  // ── Dictation ────────────────────────────────────────────────────────────

  const toggleDictation = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .slice(e.resultIndex)
        .map(r => r[0].transcript)
        .join(' ');
      if (noteRef.current) {
        noteRef.current.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && noteRef.current.contains(sel.anchorNode)) {
          document.execCommand('insertText', false, ' ' + transcript);
        } else {
          noteRef.current.innerHTML += ' ' + transcript;
        }
        setNoteIsEmpty(false);
      }
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  // ── Format with AI ───────────────────────────────────────────────────────

  const handleFormatWithAI = async () => {
    const rawMarkdown = getNoteMarkdown();
    if (!rawMarkdown.trim()) return;
    setFormatting(true);
    try {
      const res = await fetch('/api/notes/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_input: rawMarkdown,
          note_type: ENCOUNTER_TEMPLATES[form.serviceType]?.defaultNoteType || 'progress',
        }),
      });
      const data = await res.json();
      if (data.formatted) {
        setNoteFormatted(data.formatted);
        setStep('preview');
      }
    } catch (err) {
      console.error('Format error:', err);
    } finally {
      setFormatting(false);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const rawMarkdown = getNoteMarkdown();
    const bodyToSave = step === 'preview' ? noteFormatted : null;
    if (!rawMarkdown.trim() && !bodyToSave?.trim()) return;

    setSaving(true);
    setError('');

    const visitDateTime = new Date(form.visitDate + 'T12:00:00').toISOString();

    try {
      const res = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          raw_input: rawMarkdown || bodyToSave,
          body: bodyToSave || null,
          created_by: form.provider || currentUser || 'Staff',
          source: 'encounter',
          encounter_service: form.serviceType,
          appointment_id: null,
          note_date: visitDateTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save note');
        return;
      }
      onRefresh?.();
      onClose();
    } catch (err) {
      setError('Failed to save encounter note');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const canSave = step === 'preview' ? !!noteFormatted.trim() : !noteIsEmpty;

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10000 }} />

      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff', borderRadius: 12,
          width: '95%', maxWidth: noteMode === 'interactive' ? 780 : 620,
          maxHeight: '90vh', overflowY: 'auto',
          zIndex: 10001,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Scoped styles for the contentEditable note field */}
        <style>{`
          .sem-note-editor:empty::before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          .sem-note-editor:focus {
            outline: none;
            border-color: #2563eb !important;
            box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
          }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>Log Encounter</h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{patient?.name} — no appointment required</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: '#9ca3af', cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>

          {/* Row: date + service type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Visit Date
              </label>
              <input
                type="date"
                value={form.visitDate}
                onChange={e => setForm(prev => ({ ...prev, visitDate: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Service Type
              </label>
              <select
                value={form.serviceType}
                onChange={e => { setForm(prev => ({ ...prev, serviceType: e.target.value })); setShowTemplateMenu(false); }}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }}
              >
                {SERVICE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Provider */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Provider / Author
            </label>
            <input
              type="text"
              value={form.provider}
              onChange={e => setForm(prev => ({ ...prev, provider: e.target.value }))}
              placeholder="Dr. Burgess"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          {/* Interactive form mode toggle — show when service type has an interactive form */}
          {ENCOUNTER_FORMS[form.serviceType] && step === 'form' && (
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setNoteMode('interactive')}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                  border: noteMode === 'interactive' ? '2px solid #6d28d9' : '2px solid #e5e7eb',
                  background: noteMode === 'interactive' ? '#faf8ff' : '#fff',
                  display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 20 }}>{ENCOUNTER_FORMS[form.serviceType].icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Interactive Form</div>
                  <div style={{ fontSize: 11, color: '#6d28d9' }}>Guided fields — fastest</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setNoteMode('freetext')}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                  border: noteMode === 'freetext' ? '2px solid #111' : '2px solid #e5e7eb',
                  background: noteMode === 'freetext' ? '#f9fafb' : '#fff',
                  display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 20 }}>✏️</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Free Text</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Templates & dictation</div>
                </div>
              </button>
            </div>
          )}

          {/* Interactive form — replaces template/note/footer when active */}
          {noteMode === 'interactive' && ENCOUNTER_FORMS[form.serviceType] && (
            <div style={{ margin: '0 -24px -20px' }}>
              <InteractiveEncounterForm
                formType={form.serviceType}
                vitals={{}}
                currentUser={form.provider || currentUser}
                onCancel={() => setNoteMode('freetext')}
                onSave={async ({ markdown, structured_data }) => {
                  setSaving(true);
                  setError('');
                  const visitDateTime = new Date(form.visitDate + 'T12:00:00').toISOString();
                  try {
                    const res = await fetch('/api/notes/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        patient_id: patient.id,
                        raw_input: markdown,
                        body: markdown,
                        created_by: form.provider || currentUser || 'Staff',
                        source: 'encounter',
                        encounter_service: form.serviceType,
                        appointment_id: null,
                        note_date: visitDateTime,
                        structured_data: structured_data,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setError(data.error || 'Failed to save note');
                      return;
                    }
                    onRefresh?.();
                    onClose();
                  } catch (err) {
                    setError('Failed to save encounter note');
                    console.error('Save error:', err);
                  } finally {
                    setSaving(false);
                  }
                }}
              />
              {error && <p style={{ padding: '0 24px 12px', color: '#dc2626', fontSize: 13 }}>{error}</p>}
            </div>
          )}

          {/* Template selector — only in form step + freetext mode */}
          {step === 'form' && noteMode === 'freetext' && (() => {
            const { matched, other } = getTemplatesForCategory(form.serviceType);
            const allTemplates = [...matched, ...other];
            if (allTemplates.length === 0) return null;
            return (
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowTemplateMenu(prev => !prev)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6,
                    background: '#f9fafb', color: '#374151', fontSize: 13.5,
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 15 }}>📋</span>
                  <span style={{ fontWeight: 500 }}>Use a Note Template</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>{showTemplateMenu ? '▲' : '▼'}</span>
                </button>
                {showTemplateMenu && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4,
                    maxHeight: 320, overflowY: 'auto',
                  }}>
                    {matched.length > 0 && (
                      <>
                        <div style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #f3f4f6' }}>
                          Suggested for this visit
                        </div>
                        {matched.map(tmpl => (
                          <button key={tmpl.key} type="button"
                            onClick={() => { loadTemplate(tmpl.body); setShowTemplateMenu(false); }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'none', fontSize: 13.5, color: '#111827', cursor: 'pointer', fontFamily: 'inherit', borderBottom: '1px solid #f9fafb' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >{tmpl.label}</button>
                        ))}
                        {other.length > 0 && <div style={{ borderTop: '1px solid #e5e7eb', margin: '4px 0' }} />}
                      </>
                    )}
                    {other.length > 0 && (
                      <>
                        <div style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #f3f4f6' }}>
                          {matched.length > 0 ? 'Other Templates' : 'All Templates'}
                        </div>
                        {other.map(tmpl => (
                          <button key={tmpl.key} type="button"
                            onClick={() => { loadTemplate(tmpl.body); setShowTemplateMenu(false); }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'none', fontSize: 13.5, color: '#111827', cursor: 'pointer', fontFamily: 'inherit', borderBottom: '1px solid #f9fafb' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >{tmpl.label}</button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Note field — freetext mode only */}
          {noteMode !== 'freetext' ? null : step === 'form' ? (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Encounter Note
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  ref={noteRef}
                  className="sem-note-editor"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Type your clinical note, or click the microphone to dictate..."
                  onInput={() => {
                    const text = noteRef.current?.innerText || '';
                    setNoteIsEmpty(!text.trim());
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && noteRef.current?.innerText?.includes('??')) {
                      e.preventDefault();
                      // Find next ?? from current cursor position
                      const sel = window.getSelection();
                      const el = noteRef.current;
                      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
                      let node;
                      let passedCurrent = false;
                      let firstMatch = null;
                      const curNode = sel.anchorNode;
                      const curOff = sel.anchorOffset;
                      // If current selection is ??, skip past it
                      const selectedText = sel.toString();
                      const skipOffset = selectedText === '??' ? curOff + 2 : curOff;
                      while ((node = walker.nextNode())) {
                        const searchFrom = (node === curNode && !passedCurrent) ? skipOffset : 0;
                        const idx = node.textContent.indexOf('??', searchFrom);
                        if (idx !== -1 && !firstMatch) firstMatch = { node, idx };
                        if (idx !== -1 && passedCurrent) {
                          const range = document.createRange();
                          range.setStart(node, idx);
                          range.setEnd(node, idx + 2);
                          sel.removeAllRanges();
                          sel.addRange(range);
                          return;
                        }
                        if (node === curNode) passedCurrent = true;
                      }
                      // Wrap around
                      if (firstMatch) {
                        const range = document.createRange();
                        range.setStart(firstMatch.node, firstMatch.idx);
                        range.setEnd(firstMatch.node, firstMatch.idx + 2);
                        sel.removeAllRanges();
                        sel.addRange(range);
                      }
                    }
                  }}
                  style={{
                    minHeight: 180,
                    padding: '10px 48px 10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    lineHeight: 1.7,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />
                <button
                  onClick={toggleDictation}
                  type="button"
                  title={isRecording ? 'Stop dictation' : 'Start voice dictation'}
                  style={{
                    position: 'absolute', right: 10, top: 10,
                    width: 34, height: 34, borderRadius: '50%',
                    border: 'none', cursor: 'pointer',
                    background: isRecording ? '#dc2626' : '#f3f4f6',
                    color: isRecording ? '#fff' : '#374151',
                    fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                >🎤</button>
              </div>
              {isRecording && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626', fontWeight: 500 }}>
                  ● Recording... click microphone to stop
                </p>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Formatted Note (AI)
                </label>
                <button
                  onClick={() => setStep('form')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13 }}
                >
                  ← Edit
                </button>
              </div>
              <textarea
                value={noteFormatted}
                onChange={e => setNoteFormatted(e.target.value)}
                rows={10}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #d1d5db', borderRadius: 6,
                  fontSize: 13.5, fontFamily: 'inherit', lineHeight: 1.6,
                  resize: 'vertical', boxSizing: 'border-box',
                  background: '#f9fafb',
                }}
              />
            </div>
          )}

          {/* Quick notes chips */}
          {noteMode === 'freetext' && ENCOUNTER_TEMPLATES[form.serviceType]?.quickNotes?.length > 0 && step === 'form' && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 6px', fontWeight: 500 }}>Quick notes:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ENCOUNTER_TEMPLATES[form.serviceType].quickNotes.map(qn => (
                  <button
                    key={qn}
                    type="button"
                    onClick={() => {
                      if (noteRef.current) {
                        noteRef.current.focus();
                        const sel = window.getSelection();
                        if (sel && sel.rangeCount > 0 && noteRef.current.contains(sel.anchorNode)) {
                          document.execCommand('insertText', false, (noteRef.current.innerText.trim() ? '. ' : '') + qn);
                        } else {
                          const current = noteRef.current.innerHTML;
                          noteRef.current.innerHTML = current.trim() ? current + '. ' + qn : qn;
                        }
                        setNoteIsEmpty(false);
                      }
                    }}
                    style={{ padding: '3px 10px', fontSize: 12, borderRadius: 20, border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', cursor: 'pointer' }}
                  >
                    + {qn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p style={{ marginTop: 12, color: '#dc2626', fontSize: 13 }}>{error}</p>}
        </div>

        {/* Footer — freetext mode only (interactive form has its own save button) */}
        {noteMode === 'freetext' && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: '1px solid #e5e7eb', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step === 'form' && (
              <button
                onClick={handleFormatWithAI}
                disabled={noteIsEmpty || formatting}
                style={{
                  padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db',
                  background: '#fff', color: '#374151', fontSize: 14,
                  cursor: (noteIsEmpty || formatting) ? 'not-allowed' : 'pointer',
                  opacity: (noteIsEmpty || formatting) ? 0.5 : 1,
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {formatting ? 'Formatting...' : '✨ Format with AI'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              style={{
                padding: '8px 20px', borderRadius: 6, border: 'none',
                background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: (!canSave || saving) ? 'not-allowed' : 'pointer',
                opacity: (!canSave || saving) ? 0.5 : 1,
                fontFamily: 'inherit',
              }}
            >
              {saving ? 'Saving...' : 'Save Encounter'}
            </button>
          </div>
        </div>}
      </div>
    </>
  );
}
