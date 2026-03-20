// /components/EmailComposeModal.js
// Reusable email compose modal — sends via /api/email/send
// Uses sharedStyles from AdminLayout for consistent styling
// Range Medical System

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Paperclip, X, FileText } from 'lucide-react';
import { sharedStyles, overlayClickProps } from './AdminLayout';
import TemplateMessages from './TemplateMessages';

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
  const [showSnippets, setShowSnippets] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState([]); // [{ name, size, base64, type }]
  const fileInputRef = useRef(null);

  // Pre-fill recipient when modal opens
  useEffect(() => {
    if (isOpen) {
      setTo(recipientEmail || '');
      setSubject('');
      setBody('');
      setSending(false);
      setSent(false);
      setError('');
      setAttachments([]);
      setShowSnippets(false);
    }
  }, [isOpen, recipientEmail]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" is too large (max 10MB)`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:... prefix
        setAttachments(prev => [...prev, { name: file.name, size: file.size, base64, type: file.type }]);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

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
          attachments: attachments.length > 0 ? attachments.map(a => ({
            filename: a.name,
            content: a.base64,
            type: a.type,
          })) : undefined,
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
    <div style={sharedStyles.modalOverlay} {...overlayClickProps(onClose)}>
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
                          borderRadius: '6px',
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
                  </div>
                  {showSnippets && (
                    <div style={{ marginBottom: '8px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
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
                    rows={8}
                  />
                </div>
              </div>

              {/* Attachments */}
              <div style={{ marginTop: '12px' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: '#374151',
                    background: '#f9fafb',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Paperclip size={13} />
                  Attach File
                </button>
                {attachments.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {attachments.map((file, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 10px', background: '#f3f4f6', borderRadius: '6px', fontSize: '12px',
                      }}>
                        <Paperclip size={12} style={{ color: '#6b7280', flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <span style={{ color: '#9ca3af', flexShrink: 0 }}>{formatFileSize(file.size)}</span>
                        <button type="button" onClick={() => removeAttachment(i)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#9ca3af', flexShrink: 0,
                        }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
