// /components/SMSComposeModal.js
// Reusable SMS compose modal — sends via /api/twilio/send-sms
// AI Format button cleans up rough/dictated text before sending
// Range Medical System

import { useState, useEffect } from 'react';
import { Sparkles, FileText } from 'lucide-react';
import { sharedStyles, overlayClickProps } from './AdminLayout';
import TemplateMessages from './TemplateMessages';

export default function SMSComposeModal({
  isOpen,
  onClose,
  recipientPhone,
  recipientName,
  patientId,
  patientName,
}) {
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTo(recipientPhone || '');
      setBody('');
      setSending(false);
      setSent(false);
      setError('');
      setShowSnippets(false);
    }
  }, [isOpen, recipientPhone]);

  const handleSnippetSelect = (templateText) => {
    const fullName = recipientName || patientName || '';
    const firstName = fullName.split(' ')[0] || 'there';
    const lastName = fullName.split(' ').slice(1).join(' ') || '';
    const populated = templateText
      .replace(/\{\{name\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{last_name\}\}/g, lastName);
    setBody(populated);
    setShowSnippets(false);
  };

  const handleFormat = async () => {
    if (!body.trim()) {
      setError('Write or dictate your message first, then format');
      return;
    }
    setError('');
    setFormatting(true);

    try {
      const res = await fetch('/api/sms/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: body,
          recipientName: recipientName || patientName || null,
        }),
      });

      const data = await res.json();

      if (data.formatted) {
        setBody(data.formatted);
      } else {
        setError(data.error || 'Failed to format message');
      }
    } catch (err) {
      setError('Failed to format message');
    } finally {
      setFormatting(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');

    if (!to || !body) {
      setError('Phone number and message are required');
      return;
    }

    setSending(true);

    try {
      const res = await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          message: body,
          patient_id: patientId || null,
          patient_name: patientName || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const details = data.details ? ` (${data.details})` : '';
        setError((data.error || 'Failed to send SMS') + details);
        setSending(false);
      }
    } catch (err) {
      setError('Failed to send SMS');
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const charCount = body.length;

  return (
    <div style={sharedStyles.modalOverlay} {...overlayClickProps(onClose)}>
      <div style={{ ...sharedStyles.modal, maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <div style={sharedStyles.modalHeader}>
          <h2 style={sharedStyles.modalTitle}>
            {sent ? 'SMS Sent' : `Text ${recipientName || ''}`}
          </h2>
          <button onClick={onClose} style={sharedStyles.modalClose}>&#10005;</button>
        </div>

        {sent ? (
          <div style={sharedStyles.modalBody}>
            <div style={modalStyles.successWrap}>
              <div style={modalStyles.successIcon}>&#10003;</div>
              <p style={modalStyles.successText}>SMS sent to {to}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            <div style={sharedStyles.modalBody}>
              {error && (
                <div style={modalStyles.error}>{error}</div>
              )}

              <div style={modalStyles.fields}>
                <div>
                  <label style={sharedStyles.label}>To</label>
                  <input
                    type="tel"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    required
                    style={sharedStyles.input}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={sharedStyles.label}>Message</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setShowSnippets(!showSnippets)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: showSnippets ? '#1d4ed8' : '#374151',
                          background: showSnippets ? '#dbeafe' : '#f3f4f6',
                          border: '1px solid',
                          borderColor: showSnippets ? '#93c5fd' : '#d1d5db',
                          borderRadius: '0',
                          cursor: 'pointer',
                          marginBottom: '6px',
                        }}
                      >
                        <FileText size={13} />
                        Snippets
                      </button>
                      <button
                        type="button"
                        onClick={handleFormat}
                        disabled={formatting || !body.trim()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: formatting ? '#9ca3af' : '#7c3aed',
                          background: formatting ? '#f3f4f6' : '#f5f3ff',
                          border: '1px solid',
                          borderColor: formatting ? '#e5e7eb' : '#ddd6fe',
                          borderRadius: '0',
                          cursor: formatting || !body.trim() ? 'not-allowed' : 'pointer',
                          opacity: !body.trim() ? 0.5 : 1,
                          marginBottom: '6px',
                        }}
                      >
                        <Sparkles size={13} />
                        {formatting ? 'Formatting...' : 'AI Format'}
                      </button>
                    </div>
                  </div>
                  {showSnippets && (
                    <div style={{ marginBottom: '8px', border: '1px solid #e5e7eb', borderRadius: '0', overflow: 'hidden' }}>
                      <TemplateMessages
                        onSelect={handleSnippetSelect}
                        onClose={() => setShowSnippets(false)}
                      />
                    </div>
                  )}
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    required
                    style={modalStyles.textarea}
                    placeholder="Type or dictate your message, then click AI Format to clean it up..."
                    rows={5}
                    autoFocus
                  />
                  <div style={{ fontSize: '11px', color: charCount > 160 ? '#f59e0b' : '#aaa', marginTop: '4px', textAlign: 'right' }}>
                    {charCount} characters{charCount > 160 ? ` (${Math.ceil(charCount / 160)} segments)` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div style={sharedStyles.modalFooter}>
              <button type="button" onClick={onClose} style={sharedStyles.btnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={sending} style={{
                ...sharedStyles.btnPrimary,
                ...(sending ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
              }}>
                {sending ? 'Sending...' : 'Send SMS'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const modalStyles = {
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '0',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.6',
    minHeight: '120px',
    boxSizing: 'border-box',
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '10px 12px',
    borderRadius: '0',
    fontSize: '13px',
    marginBottom: '12px',
  },
  successWrap: {
    textAlign: 'center',
    padding: '30px 0',
  },
  successIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#dcfce7',
    color: '#16a34a',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '16px',
  },
  successText: {
    color: '#16a34a',
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
  },
};
