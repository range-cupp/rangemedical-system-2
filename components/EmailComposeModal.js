// /components/EmailComposeModal.js
// Reusable email compose modal — sends via /api/email/send
// Uses sharedStyles from AdminLayout for consistent styling
// Range Medical System

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { sharedStyles } from './AdminLayout';

export default function EmailComposeModal({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  patientId,
  patientName,
  ghlContactId,
  session,
}) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill recipient when modal opens
  useEffect(() => {
    if (isOpen) {
      setTo(recipientEmail || '');
      setSubject('');
      setBody('');
      setSending(false);
      setSent(false);
      setError('');
    }
  }, [isOpen, recipientEmail]);

  const handleFormat = async () => {
    if (!body.trim()) {
      setError('Write or dictate your message first, then format');
      return;
    }
    setError('');
    setFormatting(true);

    try {
      const res = await fetch('/api/email/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: body,
          recipientName: recipientName || patientName || null,
          subject: subject || null,
        }),
      });

      const data = await res.json();

      if (data.formatted) {
        setBody(data.formatted);
      } else {
        setError(data.error || 'Failed to format email');
      }
    } catch (err) {
      setError('Failed to format email');
    } finally {
      setFormatting(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');

    if (!to || !subject || !body) {
      setError('All fields are required');
      return;
    }

    setSending(true);

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          body,
          patientId: patientId || null,
          patientName: patientName || null,
          ghlContactId: ghlContactId || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSent(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to send email');
        setSending(false);
      }
    } catch (err) {
      setError('Failed to send email');
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={sharedStyles.modalOverlay} onClick={onClose}>
      <div style={{ ...sharedStyles.modal, maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
        <div style={sharedStyles.modalHeader}>
          <h2 style={sharedStyles.modalTitle}>
            {sent ? 'Email Sent' : `Email ${recipientName || ''}`}
          </h2>
          <button onClick={onClose} style={sharedStyles.modalClose}>&#10005;</button>
        </div>

        {sent ? (
          <div style={sharedStyles.modalBody}>
            <div style={modalStyles.successWrap}>
              <div style={modalStyles.successIcon}>&#10003;</div>
              <p style={modalStyles.successText}>Email sent to {to}</p>
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
                    type="email"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    required
                    style={sharedStyles.input}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label style={sharedStyles.label}>Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                    style={sharedStyles.input}
                    placeholder="Subject line"
                    autoFocus
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={sharedStyles.label}>Message</label>
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
                        borderRadius: '6px',
                        cursor: formatting || !body.trim() ? 'not-allowed' : 'pointer',
                        opacity: !body.trim() ? 0.5 : 1,
                        marginBottom: '6px',
                      }}
                    >
                      <Sparkles size={13} />
                      {formatting ? 'Formatting...' : 'AI Format'}
                    </button>
                  </div>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    required
                    style={modalStyles.textarea}
                    placeholder="Type or dictate your message, then click AI Format to clean it up..."
                    rows={8}
                  />
                </div>
              </div>

              <div style={modalStyles.hint}>
                Sent from your name via Range Medical. Replies go to your email.
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
                {sending ? 'Sending...' : 'Send Email'}
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
    borderRadius: '8px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.6',
    minHeight: '160px',
    boxSizing: 'border-box',
  },
  hint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '12px',
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '10px 12px',
    borderRadius: '8px',
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
