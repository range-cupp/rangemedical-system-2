// /components/DailyTipForm.js
// Shared editor for new + existing daily tips.

import { useState } from 'react';
import { sharedStyles } from './AdminLayout';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved (will send on scheduled date)' },
  { value: 'archived', label: 'Archived' },
];

export default function DailyTipForm({ initial = null, onSave, onDelete, saving, deleting }) {
  const [subject, setSubject] = useState(initial?.subject || '');
  const [body, setBody] = useState(initial?.body || '');
  const [status, setStatus] = useState(initial?.status || 'draft');
  const [scheduledFor, setScheduledFor] = useState(initial?.scheduled_for || '');
  const [topicTagsRaw, setTopicTagsRaw] = useState((initial?.topic_tags || []).join(', '));
  const [notes, setNotes] = useState(initial?.notes || '');
  const [error, setError] = useState('');

  const isReadOnly = initial?.status === 'sent';

  const submit = (e) => {
    e?.preventDefault();
    setError('');

    if (!subject.trim()) return setError('Subject is required.');
    if (!body.trim()) return setError('Body is required.');
    if (status === 'approved' && !scheduledFor) {
      return setError('Approved tips need a scheduled date.');
    }

    const payload = {
      subject: subject.trim(),
      body,
      status,
      scheduled_for: scheduledFor || null,
      topic_tags: topicTagsRaw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      notes: notes.trim() || null,
    };

    onSave(payload);
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;

  return (
    <form onSubmit={submit}>
      {isReadOnly && (
        <div style={{ padding: 12, background: '#fef9c3', border: '1px solid #fde047', color: '#713f12', marginBottom: 16, fontSize: 14 }}>
          This tip has already been sent. View only.
        </div>
      )}

      {error && (
        <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={{ ...sharedStyles.card, marginBottom: 16 }}>
        <div style={sharedStyles.cardBody}>
          <Field label="Subject">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Punchy. 4-7 words. Sarcasm OK."
              maxLength={140}
              disabled={isReadOnly}
              style={{ ...sharedStyles.input, width: '100%', fontSize: 16, fontWeight: 600 }}
            />
            <Hint>{subject.length}/140</Hint>
          </Field>

          <Field label="Body">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`[1 sentence opener — names the pain or sets up the tip]\n\n[1-2 sentences middle — the actual tip. Action over mechanism.]\n\n[1 sentence action line — what to do today, specifically.]\n\n— Chris\n"Head Janitor," Range Medical\n\nP.S. If you're in OC, 40+, and tired of [SPECIFIC PAIN] —\nbook the Range Assessment: https://range-medical.com/book`}
              rows={18}
              disabled={isReadOnly}
              style={{ ...sharedStyles.input, width: '100%', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 14, lineHeight: 1.6, resize: 'vertical' }}
            />
            <Hint>~120 word target · {wordCount} words · {charCount} chars</Hint>
          </Field>
        </div>
      </div>

      <div style={{ ...sharedStyles.card, marginBottom: 16 }}>
        <div style={sharedStyles.cardBody}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isReadOnly}
                style={{ ...sharedStyles.input, width: '100%' }}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
                {/* If somehow editing a 'scheduled' or 'sent' row, keep that option visible */}
                {initial?.status === 'scheduled' && <option value="scheduled">Scheduled (legacy)</option>}
                {initial?.status === 'sent' && <option value="sent">Sent</option>}
              </select>
            </Field>

            <Field label={`Scheduled for ${status === 'approved' ? '(required)' : '(optional)'}`}>
              <input
                type="date"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                disabled={isReadOnly}
                style={{ ...sharedStyles.input, width: '100%' }}
              />
              <Hint>Pacific time. Send fires 6am PT on this date.</Hint>
            </Field>
          </div>

          <Field label="Topic tags">
            <input
              type="text"
              value={topicTagsRaw}
              onChange={(e) => setTopicTagsRaw(e.target.value)}
              placeholder="sleep, cortisol, recovery"
              disabled={isReadOnly}
              style={{ ...sharedStyles.input, width: '100%' }}
            />
            <Hint>Comma-separated. So you can avoid repeats next month.</Hint>
          </Field>

          <Field label="Internal notes (not shown to subscribers)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Source, follow-up ideas, why you wrote it, etc."
              rows={3}
              disabled={isReadOnly}
              style={{ ...sharedStyles.input, width: '100%', resize: 'vertical' }}
            />
          </Field>
        </div>
      </div>

      {!isReadOnly && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="submit" disabled={saving} style={{ ...sharedStyles.btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : (initial ? 'Save changes' : 'Create tip')}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Delete this tip? Cannot be undone.')) onDelete();
              }}
              disabled={deleting}
              style={{ ...sharedStyles.btnSecondary, color: '#b91c1c', borderColor: '#fecaca', marginLeft: 'auto' }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      )}
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Hint({ children }) {
  return <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{children}</div>;
}
