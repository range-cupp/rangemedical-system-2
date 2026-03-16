// components/StandaloneEncounterModal.js
// Create an encounter note for a patient that has no linked appointment
// Used for walk-ins, unscheduled visits, or retroactive documentation
// Range Medical System

import { useState, useRef } from 'react';
import { ENCOUNTER_TEMPLATES } from '../lib/encounter-templates';

const SERVICE_OPTIONS = Object.entries(ENCOUNTER_TEMPLATES).map(([key, val]) => ({
  value: key,
  label: val.label,
}));

export default function StandaloneEncounterModal({ patient, currentUser, onClose, onRefresh }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    visitDate: today,
    serviceType: 'general',
    provider: currentUser || '',
    noteInput: '',
    noteFormatted: '',
  });
  const [step, setStep] = useState('form'); // 'form' | 'preview'
  const [formatting, setFormatting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

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
      setForm(prev => ({ ...prev, noteInput: prev.noteInput + (prev.noteInput ? ' ' : '') + transcript }));
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleFormatWithAI = async () => {
    if (!form.noteInput.trim()) return;
    setFormatting(true);
    try {
      const res = await fetch('/api/notes/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_input: form.noteInput,
          note_type: ENCOUNTER_TEMPLATES[form.serviceType]?.defaultNoteType || 'progress',
        }),
      });
      const data = await res.json();
      if (data.formatted) {
        setForm(prev => ({ ...prev, noteFormatted: data.formatted }));
        setStep('preview');
      }
    } catch (err) {
      console.error('Format error:', err);
    } finally {
      setFormatting(false);
    }
  };

  const handleSave = async () => {
    if (!form.noteInput.trim()) return;
    setSaving(true);
    setError('');

    // Parse the visit date back to ISO
    const visitDateTime = new Date(form.visitDate + 'T12:00:00').toISOString();

    try {
      const res = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          raw_input: form.noteInput,
          body: form.noteFormatted || null,
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

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 10000,
        }}
      />

      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff', borderRadius: 12,
          width: '95%', maxWidth: 600,
          maxHeight: '90vh', overflowY: 'auto',
          zIndex: 10001,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 24px', borderBottom: '1px solid #e5e7eb',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
              Log Encounter
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>
              {patient?.name} — no appointment required
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: 22,
              color: '#9ca3af', cursor: 'pointer', lineHeight: 1, padding: 4,
            }}
          >×</button>
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
                style={{
                  width: '100%', padding: '8px 10px', border: '1px solid #d1d5db',
                  borderRadius: 6, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Service Type
              </label>
              <select
                value={form.serviceType}
                onChange={e => setForm(prev => ({ ...prev, serviceType: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 10px', border: '1px solid #d1d5db',
                  borderRadius: 6, fontSize: 14, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
                }}
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
              style={{
                width: '100%', padding: '8px 10px', border: '1px solid #d1d5db',
                borderRadius: 6, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Note */}
          {step === 'form' ? (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Encounter Note
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={form.noteInput}
                  onChange={e => setForm(prev => ({ ...prev, noteInput: e.target.value }))}
                  rows={7}
                  placeholder="Type your clinical note, or click the microphone to dictate..."
                  style={{
                    width: '100%', padding: '10px 48px 10px 12px',
                    border: '1px solid #d1d5db', borderRadius: 6,
                    fontSize: 14, fontFamily: 'inherit', lineHeight: 1.6,
                    resize: 'vertical', boxSizing: 'border-box',
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
                    animation: isRecording ? 'pulse 1.5s infinite' : 'none',
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
                  ← Edit raw
                </button>
              </div>
              <textarea
                value={form.noteFormatted}
                onChange={e => setForm(prev => ({ ...prev, noteFormatted: e.target.value }))}
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
          {ENCOUNTER_TEMPLATES[form.serviceType]?.quickNotes?.length > 0 && step === 'form' && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 6px', fontWeight: 500 }}>Quick notes:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ENCOUNTER_TEMPLATES[form.serviceType].quickNotes.map(qn => (
                  <button
                    key={qn}
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      noteInput: prev.noteInput ? prev.noteInput + '. ' + qn : qn,
                    }))}
                    style={{
                      padding: '3px 10px', fontSize: 12, borderRadius: 20,
                      border: '1px solid #d1d5db', background: '#f9fafb',
                      color: '#374151', cursor: 'pointer',
                    }}
                  >
                    + {qn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p style={{ marginTop: 12, color: '#dc2626', fontSize: 13 }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 24px', borderTop: '1px solid #e5e7eb', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: 6,
              background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step === 'form' && (
              <button
                onClick={handleFormatWithAI}
                disabled={!form.noteInput.trim() || formatting}
                style={{
                  padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db',
                  background: '#fff', color: '#374151', fontSize: 14,
                  cursor: (!form.noteInput.trim() || formatting) ? 'not-allowed' : 'pointer',
                  opacity: (!form.noteInput.trim() || formatting) ? 0.5 : 1,
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {formatting ? 'Formatting...' : '✨ Format with AI'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!form.noteInput.trim() || saving}
              style={{
                padding: '8px 20px', borderRadius: 6, border: 'none',
                background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: (!form.noteInput.trim() || saving) ? 'not-allowed' : 'pointer',
                opacity: (!form.noteInput.trim() || saving) ? 0.5 : 1,
                fontFamily: 'inherit',
              }}
            >
              {saving ? 'Saving...' : 'Save Encounter'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
