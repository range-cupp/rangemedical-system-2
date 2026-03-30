// components/PeptideDetailPanel.js
// Slide-out panel for peptide protocol details on the sales pipeline
// Shows: protocol info, quick-text SMS, message history
// Range Medical System V2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { overlayClickProps } from './AdminLayout';
import { supabase } from '../lib/supabase';

const PEPTIDE_CATEGORY_CONFIG = {
  recovery: { label: 'Recovery', color: '#16a34a', bg: '#f0fdf4' },
  gh:       { label: 'Growth Hormone', color: '#7c3aed', bg: '#f5f3ff' },
  skin:     { label: 'Skin', color: '#ec4899', bg: '#fdf2f8' },
  mito:     { label: 'Mitochondrial', color: '#0891b2', bg: '#ecfeff' },
  other:    { label: 'Other', color: '#6b7280', bg: '#f3f4f6' },
};

const STAGE_COLORS = {
  just_started:  { label: 'Just Started',  color: '#3b82f6', bg: '#eff6ff' },
  active:        { label: 'Active',        color: '#10b981', bg: '#ecfdf5' },
  check_in_due:  { label: 'Check-In Due',  color: '#f59e0b', bg: '#fffbeb' },
  expiring_soon: { label: 'Expiring Soon', color: '#f97316', bg: '#fff7ed' },
  expired:       { label: 'Expired',       color: '#ef4444', bg: '#fef2f2' },
  paused:        { label: 'Paused',        color: '#6b7280', bg: '#f3f4f6' },
};

export default function PeptideDetailPanel({ isOpen, onClose, lead }) {
  const [smsText, setSmsText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [comms, setComms] = useState([]);
  const [loadingComms, setLoadingComms] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Fetch comms when panel opens
  useEffect(() => {
    if (!isOpen || !lead) {
      setComms([]);
      setSmsText('');
      setSendError('');
      setNotesSaved(false);
      return;
    }

    setNotes(lead.notes || '');
    fetchComms();
  }, [isOpen, lead]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const fetchComms = async () => {
    if (!lead?.patient_id) return;
    setLoadingComms(true);
    try {
      const { data } = await supabase
        .from('comms_log')
        .select('id, direction, channel, message, subject, status, created_at, message_type')
        .eq('patient_id', lead.patient_id)
        .order('created_at', { ascending: false })
        .limit(50);
      setComms(data || []);
    } catch (err) {
      console.error('Fetch comms error:', err);
    }
    setLoadingComms(false);
  };

  const handleSendSms = async () => {
    const msg = smsText.trim();
    if (!msg || !lead.phone) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.phone,
          message: msg,
          message_type: 'direct_sms',
          patient_id: lead.patient_id || null,
          patient_name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSmsText('');
        fetchComms();
      } else {
        setSendError(data.error || 'Failed to send');
      }
    } catch (err) {
      setSendError('Network error');
    }
    setSending(false);
  };

  const handleSaveNotes = async () => {
    if (!lead?.id) return;
    setSavingNotes(true);
    try {
      await supabase
        .from('protocols')
        .update({ notes })
        .eq('id', lead.id);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      console.error('Save notes error:', err);
    }
    setSavingNotes(false);
  };

  if (!isOpen || !lead) return null;

  const stageConfig = STAGE_COLORS[lead.stage] || STAGE_COLORS.active;
  const category = PEPTIDE_CATEGORY_CONFIG[lead._peptideCategory] || PEPTIDE_CATEGORY_CONFIG.other;

  // Days display
  let daysLabel = '';
  let daysColor = '#9ca3af';
  if (lead.days_remaining !== null && lead.days_remaining !== undefined) {
    if (lead.days_remaining < 0) {
      daysLabel = `${Math.abs(lead.days_remaining)}d overdue`;
      daysColor = '#ef4444';
    } else if (lead.days_remaining <= 5) {
      daysLabel = `${lead.days_remaining}d left`;
      daysColor = '#f97316';
    } else {
      daysLabel = `${lead.days_remaining}d left`;
      daysColor = '#10b981';
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '\u2014';
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
  };

  // Progress bar
  const progressPct = lead.total_days && lead.days_since_start != null
    ? Math.min(100, Math.max(0, (lead.days_since_start / lead.total_days) * 100))
    : 0;

  return (
    <>
      <style jsx global>{`
        @keyframes peptideSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes peptideOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Overlay */}
      <div style={s.overlay} {...overlayClickProps(onClose)} />

      {/* Panel */}
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.headerNameRow}>
              <Link href={`/admin/patient/${lead.patient_id}`} style={s.patientNameLink}>
                {lead.first_name} {lead.last_name}
              </Link>
              <span style={{ ...s.stageBadge, background: stageConfig.bg, color: stageConfig.color }}>
                {stageConfig.label}
              </span>
            </div>
            <div style={s.headerContact}>
              {lead.phone && <span>{lead.phone}</span>}
              {lead.phone && lead.email && <span style={{ margin: '0 6px', color: '#d1d5db' }}>&middot;</span>}
              {lead.email && <span>{lead.email}</span>}
            </div>
          </div>
          <button onClick={onClose} style={s.closeBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={s.body}>
          {/* Protocol Card */}
          <div style={s.protocolCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <span style={{ ...s.categoryBadge, background: category.bg, color: category.color }}>
                  {lead.medication || 'Peptide'}
                </span>
                {lead.program_name && lead.program_name !== lead.medication && (
                  <span style={s.programName}>{lead.program_name}</span>
                )}
              </div>
              {daysLabel && (
                <span style={{ fontSize: '13px', fontWeight: 700, color: daysColor }}>{daysLabel}</span>
              )}
            </div>

            {/* Progress bar */}
            {lead.total_days > 0 && (
              <div style={s.progressTrack}>
                <div style={{ ...s.progressBar, width: `${progressPct}%` }} />
              </div>
            )}

            <div style={s.infoGrid}>
              <div style={s.infoItem}>
                <span style={s.infoLabel}>Start</span>
                <span style={s.infoValue}>{formatDate(lead.start_date)}</span>
              </div>
              <div style={s.infoItem}>
                <span style={s.infoLabel}>End</span>
                <span style={s.infoValue}>{formatDate(lead.end_date)}</span>
              </div>
              <div style={s.infoItem}>
                <span style={s.infoLabel}>Duration</span>
                <span style={s.infoValue}>{lead.total_days ? `${lead.total_days} days` : '\u2014'}</span>
              </div>
              <div style={s.infoItem}>
                <span style={s.infoLabel}>Frequency</span>
                <span style={s.infoValue}>{lead.frequency || '\u2014'}</span>
              </div>
              {lead.delivery_method && (
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>Delivery</span>
                  <span style={s.infoValue}>{lead.delivery_method === 'in_clinic' ? 'In Clinic' : lead.delivery_method === 'take_home' ? 'Take Home' : lead.delivery_method}</span>
                </div>
              )}
              {lead.last_checkin && (
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>Last Check-In</span>
                  <span style={s.infoValue}>{formatDate(lead.last_checkin)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div style={s.section}>
            <div style={s.sectionTitle}>Notes</div>
            <textarea
              value={notes}
              onChange={e => { setNotes(e.target.value); setNotesSaved(false); }}
              placeholder="Add notes about this protocol..."
              style={s.textarea}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', gap: '8px', alignItems: 'center' }}>
              {notesSaved && <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 500 }}>Saved</span>}
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes || notes === (lead.notes || '')}
                style={{
                  ...s.saveNotesBtn,
                  opacity: savingNotes || notes === (lead.notes || '') ? 0.4 : 1,
                }}
              >
                {savingNotes ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* SMS Section */}
          <div style={s.section}>
            <div style={s.sectionTitle}>Text Message</div>
            {lead.phone ? (
              <div>
                <div style={s.smsInputRow}>
                  <textarea
                    value={smsText}
                    onChange={e => setSmsText(e.target.value)}
                    placeholder={`Text ${lead.first_name || 'patient'}...`}
                    rows={2}
                    style={s.smsInput}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendSms();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendSms}
                    disabled={sending || !smsText.trim()}
                    style={{
                      ...s.smsSendBtn,
                      opacity: sending || !smsText.trim() ? 0.5 : 1,
                    }}
                  >
                    {sending ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    )}
                  </button>
                </div>
                {sendError && <div style={s.smsError}>{sendError}</div>}
              </div>
            ) : (
              <div style={s.smsNoPhone}>No phone number on file</div>
            )}
          </div>

          {/* Message History */}
          <div style={s.section}>
            <div style={s.sectionTitle}>
              Message History
              {comms.length > 0 && (
                <span style={s.commsBadge}>{comms.length}</span>
              )}
            </div>
            {loadingComms ? (
              <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>Loading...</div>
            ) : comms.length === 0 ? (
              <div style={s.emptyState}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>
                  {lead.phone ? 'No messages yet' : 'No phone number on file'}
                </div>
              </div>
            ) : (
              <div style={s.chatList}>
                {comms.map(comm => {
                  const isOutbound = comm.direction !== 'inbound';
                  const isEmail = comm.channel === 'email';
                  return (
                    <div key={comm.id} style={{
                      ...s.chatBubbleRow,
                      justifyContent: isOutbound ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        ...s.chatBubble,
                        background: isEmail ? '#f0f4ff' : isOutbound ? '#111' : '#f3f4f6',
                        color: isEmail ? '#1e40af' : isOutbound ? '#fff' : '#111',
                        borderBottomRightRadius: isOutbound ? '4px' : '16px',
                        borderBottomLeftRadius: isOutbound ? '16px' : '4px',
                      }}>
                        {isEmail && comm.subject && (
                          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.8 }}>
                            {comm.subject}
                          </div>
                        )}
                        <div style={s.chatMessage}>
                          {comm.message || '(no content)'}
                        </div>
                        <div style={{
                          ...s.chatMeta,
                          color: isOutbound ? 'rgba(255,255,255,0.5)' : '#9ca3af',
                        }}>
                          {isEmail ? 'Email' : 'SMS'}
                          {' \u00b7 '}
                          {timeAgo(comm.created_at)}
                          {comm.status === 'failed' && (
                            <span style={{ color: '#ef4444', marginLeft: 4 }}> Failed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const s = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.35)',
    zIndex: 1100,
    animation: 'peptideOverlayFade 0.2s ease-out',
  },
  panel: {
    position: 'fixed',
    top: 0, right: 0, bottom: 0,
    width: '480px',
    maxWidth: '92vw',
    background: '#ffffff',
    zIndex: 1101,
    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'peptideSlideIn 0.25s ease-out',
  },
  header: {
    padding: '20px 24px 14px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    flexShrink: 0,
  },
  headerNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
    flexWrap: 'wrap',
  },
  patientNameLink: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111',
    lineHeight: '1.3',
    textDecoration: 'none',
    borderBottom: '1px dashed #9ca3af',
  },
  stageBadge: {
    padding: '3px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  headerContact: {
    fontSize: '13px',
    color: '#6b7280',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 24px 24px',
  },
  // Protocol card
  protocolCard: {
    marginTop: '16px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  categoryBadge: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
  programName: {
    fontSize: '12px',
    color: '#6b7280',
    marginLeft: '8px',
  },
  progressTrack: {
    height: '4px',
    background: '#e5e7eb',
    borderRadius: '2px',
    marginBottom: '14px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: '#111',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  infoLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  infoValue: {
    fontSize: '13px',
    color: '#111',
    fontWeight: '500',
  },
  // Sections
  section: {
    marginTop: '20px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#9ca3af',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  commsBadge: {
    fontSize: '10px',
    fontWeight: '700',
    background: '#e5e7eb',
    color: '#374151',
    padding: '1px 6px',
    borderRadius: '8px',
    lineHeight: '1.4',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
    height: '70px',
    lineHeight: '1.5',
  },
  saveNotesBtn: {
    padding: '5px 14px',
    fontSize: '12px',
    fontWeight: '600',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  // SMS
  smsInputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
  },
  smsInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'none',
    lineHeight: '1.4',
    boxSizing: 'border-box',
    minHeight: '38px',
    maxHeight: '100px',
  },
  smsSendBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    background: '#111',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  smsError: {
    fontSize: '11px',
    color: '#dc2626',
    marginTop: '6px',
  },
  smsNoPhone: {
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  // Chat
  emptyState: {
    textAlign: 'center',
    padding: '24px 20px',
  },
  chatList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingBottom: '8px',
  },
  chatBubbleRow: {
    display: 'flex',
  },
  chatBubble: {
    maxWidth: '85%',
    padding: '8px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    lineHeight: '1.45',
  },
  chatMessage: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  chatMeta: {
    fontSize: '10px',
    marginTop: '4px',
  },
};
