// components/WLDetailPanel.js
// Slide-out panel for weight loss protocol details on the sales pipeline
// Shows: protocol info, weight progress, quick-text SMS, message history, notes
// Range Medical System V2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { overlayClickProps } from './AdminLayout';
import { supabase } from '../lib/supabase';

const WL_STAGE_COLORS = {
  new_start:     { label: 'New Start',     color: '#8b5cf6', bg: '#f5f3ff' },
  active:        { label: 'Active',        color: '#10b981', bg: '#ecfdf5' },
  needs_refill:  { label: 'Needs Refill',  color: '#f59e0b', bg: '#fffbeb' },
  lapsed:        { label: 'Lapsed',        color: '#ef4444', bg: '#fef2f2' },
  renewal_due:   { label: 'Renewal Due',   color: '#3b82f6', bg: '#eff6ff' },
  completed:     { label: 'Completed',     color: '#6b7280', bg: '#f3f4f6' },
};

const MED_COLORS = {
  semaglutide:  { color: '#1e40af', bg: '#dbeafe' },
  tirzepatide:  { color: '#9d174d', bg: '#fce7f3' },
  retatrutide:  { color: '#4338ca', bg: '#e0e7ff' },
  default:      { color: '#374151', bg: '#f3f4f6' },
};

function getMedColor(medication) {
  const m = (medication || '').toLowerCase();
  if (m.includes('semaglutide')) return MED_COLORS.semaglutide;
  if (m.includes('tirzepatide')) return MED_COLORS.tirzepatide;
  if (m.includes('retatrutide')) return MED_COLORS.retatrutide;
  return MED_COLORS.default;
}

export default function WLDetailPanel({ isOpen, onClose, lead }) {
  const [smsText, setSmsText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [comms, setComms] = useState([]);
  const [loadingComms, setLoadingComms] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

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

  const stageConfig = WL_STAGE_COLORS[lead.stage] || WL_STAGE_COLORS.active;
  const mc = getMedColor(lead.medication);

  const formatDate = (dateStr) => {
    if (!dateStr) return '\u2014';
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' });
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

  // Progress bar based on injections
  const progressPct = lead.total_injections > 0
    ? Math.min(100, Math.max(0, (lead.injections_used / lead.total_injections) * 100))
    : 0;

  const weightLost = lead.starting_weight && lead.current_weight
    ? (lead.starting_weight - lead.current_weight).toFixed(1)
    : null;

  return (
    <>
      <style jsx global>{`
        @keyframes wlSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes wlOverlayFade {
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ ...s.medBadge, background: mc.bg, color: mc.color }}>
                  {lead.medication || 'GLP-1'}
                </span>
                <span style={s.monthBadge}>Month {lead.month}</span>
              </div>
              <span style={{
                ...s.deliveryBadge,
                background: lead.delivery_method === 'in_clinic' ? '#f0fdf4' : '#faf5ff',
                color: lead.delivery_method === 'in_clinic' ? '#166534' : '#7c3aed',
                borderColor: lead.delivery_method === 'in_clinic' ? '#bbf7d0' : '#ddd6fe',
              }}>
                {lead.delivery_method === 'in_clinic' ? 'In-Clinic' : 'Take Home'}
              </span>
            </div>

            {/* Injection Progress */}
            {lead.total_injections > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>Injections</span>
                  <span style={{ fontSize: '12px', color: '#111', fontWeight: 600 }}>{lead.injections_used}/{lead.total_injections}</span>
                </div>
                <div style={s.progressTrack}>
                  <div style={{ ...s.progressBar, width: `${progressPct}%` }} />
                </div>
              </div>
            )}

            {/* Weight Progress */}
            {(lead.starting_weight || lead.current_weight) && (
              <div style={s.weightCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, marginBottom: '2px' }}>Weight</div>
                    <div style={{ fontSize: '14px', color: '#111', fontWeight: 600 }}>
                      {lead.starting_weight || '?'} {'→'} {lead.current_weight || '?'} lbs
                    </div>
                  </div>
                  {weightLost && Number(weightLost) !== 0 && (
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: Number(weightLost) > 0 ? '#16a34a' : '#dc2626',
                    }}>
                      {Number(weightLost) > 0 ? '↓' : '↑'}{Math.abs(Number(weightLost))} lbs
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={s.infoGrid}>
              <div style={s.infoItem}>
                <span style={s.infoLabel}>Dose</span>
                <span style={s.infoValue}>{lead.current_dose || '\u2014'}</span>
              </div>
              <div style={s.infoItem}>
                <span style={s.infoLabel}>Start</span>
                <span style={s.infoValue}>{formatDate(lead.start_date)}</span>
              </div>
              <div style={s.infoItem}>
                <span style={s.infoLabel}>End</span>
                <span style={s.infoValue}>{formatDate(lead.end_date)}</span>
              </div>
              <div style={s.infoItem}>
                <span style={s.infoLabel}>Last Activity</span>
                <span style={{
                  ...s.infoValue,
                  color: (lead.days_since_last_injection ?? 999) > 10 ? '#ef4444' : '#111',
                }}>
                  {lead.last_activity ? formatDate(lead.last_activity) : '\u2014'}
                  {lead.days_since_last_injection != null && (
                    <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '4px' }}>
                      ({lead.days_since_last_injection}d ago)
                    </span>
                  )}
                </span>
              </div>
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
    animation: 'wlOverlayFade 0.2s ease-out',
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
    animation: 'wlSlideIn 0.25s ease-out',
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
  protocolCard: {
    marginTop: '16px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  medBadge: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
  monthBadge: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '3px 8px',
    borderRadius: '4px',
    background: '#f3f4f6',
    color: '#6b7280',
  },
  deliveryBadge: {
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '4px',
    border: '1px solid transparent',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  weightCard: {
    padding: '12px',
    background: '#fff',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    marginBottom: '14px',
  },
  progressTrack: {
    height: '4px',
    background: '#e5e7eb',
    borderRadius: '2px',
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
