// components/TreatmentPlanModal.js
// Create + preview + send a patient-facing treatment plan PDF from the
// SUMMARY/RECOMMENDATIONS section of an encounter note.

import { useEffect, useMemo, useRef, useState } from 'react';

// Grab everything from the PLAN section to the end of the note. Falls back
// to SUMMARY/RECOMMENDATIONS if PLAN isn't present. Section headers match
// the `| HEADER` style James uses, as well as plain `HEADER` or `HEADER:`.
function extractPlanSection(noteBody) {
  if (!noteBody) return '';
  const text = String(noteBody);
  const planRe = /(?:^|\n)\s*\|?\s*plan\s*[:\n]/i;
  const summaryRe = /(?:^|\n)\s*\|?\s*summary[\s\/&]+recommendations?\s*[:\n]/i;
  const match = text.match(planRe) || text.match(summaryRe);
  if (!match) return '';

  let rest = text.slice(match.index + match[0].length);
  // Strip HTML if the note body is rich text
  rest = rest.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '');
  rest = rest
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  // Normalize inline bullets so each item sits on its own line.
  const normalized = rest
    .replace(/\r/g, '')
    .replace(/([.!?;:])\s*[-•*\u2013\u2014]\s+/g, '$1\n- ')
    .replace(/\s{2,}[-•*\u2013\u2014]\s+/g, '\n- ');

  // Drop standalone section-header lines (e.g. "| SUMMARY/RECOMMENDATIONS",
  // "PLAN:", "ASSESSMENT") so they don't show up as stray bullets.
  const isSectionHeader = (line) => {
    const t = line.trim().replace(/^\|\s*/, '').replace(/:$/, '').trim();
    return t.length > 0 && t.length <= 60 && /^[A-Z][A-Z0-9\s\/&\-]+$/.test(t);
  };

  return normalized
    .split('\n')
    .filter(line => !isSectionHeader(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function TreatmentPlanModal({
  patientId,
  patientName,
  patientEmail,
  noteBody,
  noteId,
  provider,
  onClose,
}) {
  const initialText = useMemo(() => extractPlanSection(noteBody || ''), [noteBody]);
  const [summaryText, setSummaryText] = useState(initialText);
  const [nextStepsText, setNextStepsText] = useState('');
  const [step, setStep] = useState('edit'); // 'edit' | 'preview'
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null); // { kind: 'ok'|'err', msg }
  const objectUrlRef = useRef(null);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const hasContent = summaryText.trim().length > 0;

  const requestPreview = async () => {
    if (!hasContent || !patientId) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/treatment-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          summary_text: summaryText,
          next_steps_text: nextStepsText,
          note_id: noteId || null,
          provider: provider || null,
          mode: 'preview',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Preview failed');
      }
      const blob = await res.blob();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      setPdfUrl(url);
      setStep('preview');
    } catch (err) {
      setStatus({ kind: 'err', msg: err.message || 'Could not generate preview.' });
    } finally {
      setLoading(false);
    }
  };

  const sendToPatient = async () => {
    if (!patientId) return;
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch('/api/treatment-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          summary_text: summaryText,
          next_steps_text: nextStepsText,
          note_id: noteId || null,
          provider: provider || null,
          mode: 'send',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setStatus({ kind: 'ok', msg: patientEmail ? `Treatment plan emailed to ${patientEmail}.` : 'Treatment plan emailed to the patient.' });
    } catch (err) {
      setStatus({ kind: 'err', msg: err.message || 'Could not send treatment plan.' });
    } finally {
      setSending(false);
    }
  };

  const backToEdit = () => {
    setStep('edit');
    setStatus(null);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 20000 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(860px, 95vw)',
          height: 'min(820px, 92vh)',
          background: '#fff',
          zIndex: 20001,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          border: '1px solid #e5e7eb',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>
              {step === 'edit' ? 'Create Treatment Plan' : 'Preview Treatment Plan'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {patientName || 'Patient'} {patientEmail ? `• ${patientEmail}` : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: 22,
              color: '#9ca3af', cursor: 'pointer', lineHeight: 1, padding: 4,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {step === 'edit' ? (
            <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 55%', minHeight: 180 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  Recommendations (one per line)
                </label>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {initialText
                    ? 'Pre-filled from the PLAN section of this note through the end. Edit freely before previewing.'
                    : 'Paste the PLAN section from the encounter note. One bullet per line.'}
                </div>
                <textarea
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  placeholder={'- Lower testosterone dose to reduce side effects\n- Start 200 mg DIM daily\n- ...'}
                  style={textareaStyle}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 35%', minHeight: 140 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  Next Steps <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
                </label>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  Patient-specific action items — supplements to pick up, blood draws to schedule, follow-ups to book. One per line. Leave blank for the default "call us with questions" line.
                </div>
                <textarea
                  value={nextStepsText}
                  onChange={(e) => setNextStepsText(e.target.value)}
                  placeholder={'- We can provide DIM, Nattokinase, and DHEA in clinic — team will reach out on pricing\n- Schedule next blood draw in 8 weeks'}
                  style={textareaStyle}
                />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, background: '#525252' }}>
              {pdfUrl && (
                <iframe
                  src={pdfUrl}
                  title="Treatment plan preview"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          )}

          {/* Status line */}
          {status && (
            <div style={{
              padding: '10px 20px',
              fontSize: 13,
              background: status.kind === 'ok' ? '#ecfdf5' : '#fef2f2',
              color: status.kind === 'ok' ? '#065f46' : '#991b1b',
              borderTop: '1px solid #e5e7eb',
            }}>
              {status.msg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f9fafb',
          gap: 10,
        }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {step === 'edit'
              ? 'Preview generates the PDF. Send emails it to the patient and archives it to their profile.'
              : 'This is exactly what the patient will receive by email.'}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {step === 'preview' && (
              <button
                onClick={backToEdit}
                disabled={sending}
                style={btnSecondary}
              >
                ← Back to Edit
              </button>
            )}
            {step === 'edit' && (
              <button
                onClick={requestPreview}
                disabled={!hasContent || loading}
                style={{ ...btnPrimary, opacity: (!hasContent || loading) ? 0.5 : 1 }}
              >
                {loading ? 'Generating…' : 'Preview'}
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={sendToPatient}
                disabled={sending || status?.kind === 'ok'}
                style={{ ...btnPrimary, opacity: (sending || status?.kind === 'ok') ? 0.5 : 1 }}
              >
                {sending ? 'Sending…' : status?.kind === 'ok' ? 'Sent ✓' : 'Send to Patient'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const textareaStyle = {
  flex: 1,
  width: '100%',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 13,
  lineHeight: 1.6,
  padding: 12,
  border: '1.5px solid #e5e7eb',
  resize: 'none',
  color: '#111',
  background: '#fafafa',
  boxSizing: 'border-box',
  minHeight: 100,
};

const btnBase = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  border: '1px solid transparent',
  cursor: 'pointer',
  lineHeight: 1.2,
};

const btnPrimary = {
  ...btnBase,
  background: '#111',
  color: '#fff',
  borderColor: '#111',
};

const btnSecondary = {
  ...btnBase,
  background: '#fff',
  color: '#374151',
  borderColor: '#d1d5db',
};
