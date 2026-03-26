// components/LeadDetailPanel.js
// Slide-out panel for lead details on the sales pipeline
// Shows: overview, communications, appointments, protocols
// Range Medical System V2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { overlayClickProps } from './AdminLayout';

const BASE_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'comms', label: 'Communications' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'protocols', label: 'Protocols' },
];

const TRIAL_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'trial', label: 'Trial' },
  { key: 'comms', label: 'Communications' },
  { key: 'appointments', label: 'Appointments' },
];

const STAGE_CONFIG = {
  new_lead:   { label: 'New Lead',   color: '#3b82f6', bg: '#eff6ff' },
  contacted:  { label: 'Contacted',  color: '#8b5cf6', bg: '#f5f3ff' },
  follow_up:  { label: 'Follow-Up',  color: '#f59e0b', bg: '#fffbeb' },
  booked:     { label: 'Booked',     color: '#10b981', bg: '#ecfdf5' },
  showed:     { label: 'Showed',     color: '#06b6d4', bg: '#ecfeff' },
  started:    { label: 'Started',    color: '#111',    bg: '#f3f4f6' },
  lost:       { label: 'Lost',       color: '#ef4444', bg: '#fef2f2' },
};

const SOURCE_CONFIG = {
  assessment:     { label: 'Assessment',    color: '#7c3aed', bg: '#f5f3ff' },
  energy_check:   { label: 'Energy Check',  color: '#059669', bg: '#ecfdf5' },
  start_funnel:   { label: 'Start Funnel',  color: '#2563eb', bg: '#eff6ff' },
  research:       { label: 'Research',       color: '#0891b2', bg: '#ecfeff' },
  cellular_reset: { label: 'Cellular Reset', color: '#7c3aed', bg: '#faf5ff' },
  rlt_trial:      { label: 'RLT Trial',     color: '#dc2626', bg: '#fef2f2' },
  hbot_trial:     { label: 'HBOT Trial',    color: '#0891b2', bg: '#ecfeff' },
  manychat:       { label: 'ManyChat',       color: '#c026d3', bg: '#fdf4ff' },
  manual:         { label: 'Manual',         color: '#6b7280', bg: '#f3f4f6' },
  referral:       { label: 'Referral',       color: '#d97706', bg: '#fffbeb' },
  walk_in:        { label: 'Walk-In',        color: '#ea580c', bg: '#fff7ed' },
  instagram:      { label: 'Instagram',      color: '#c026d3', bg: '#fdf4ff' },
  google:         { label: 'Google',         color: '#2563eb', bg: '#eff6ff' },
  website:        { label: 'Website',        color: '#4f46e5', bg: '#eef2ff' },
  facebook:       { label: 'Facebook',       color: '#2563eb', bg: '#eff6ff' },
  tiktok:         { label: 'TikTok',         color: '#111',    bg: '#f3f4f6' },
  yelp:           { label: 'Yelp',           color: '#dc2626', bg: '#fef2f2' },
  friend:         { label: 'Friend',         color: '#d97706', bg: '#fffbeb' },
  other:          { label: 'Other',          color: '#6b7280', bg: '#f3f4f6' },
};

const PROTOCOL_STATUS_COLORS = {
  active:    { background: '#dcfce7', color: '#166534' },
  paused:    { background: '#fef3c7', color: '#92400e' },
  completed: { background: '#dbeafe', color: '#1e40af' },
  cancelled: { background: '#f3f4f6', color: '#6b7280' },
};

const APPT_STATUS_COLORS = {
  scheduled:  { background: '#eff6ff', color: '#2563eb' },
  confirmed:  { background: '#dcfce7', color: '#166534' },
  completed:  { background: '#f3f4f6', color: '#374151' },
  cancelled:  { background: '#fef2f2', color: '#dc2626' },
  no_show:    { background: '#fef3c7', color: '#92400e' },
};

export default function LeadDetailPanel({
  isOpen,
  onClose,
  lead,
  employees,
  onUpdate,
  onDelete,
  onMoveStage,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editAssigned, setEditAssigned] = useState('');
  const [editLostReason, setEditLostReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [trialData, setTrialData] = useState(null);
  const [trialSurveys, setTrialSurveys] = useState([]);

  // Fetch details when panel opens
  useEffect(() => {
    if (!isOpen || !lead) {
      setDetails(null);
      setActiveTab('overview');
      return;
    }

    setEditNotes(lead.notes || '');
    setEditAssigned(lead.assigned_to || '');
    setEditLostReason(lead.lost_reason || '');

    let cancelled = false;
    setLoading(true);

    fetch(`/api/admin/lead-details?lead_id=${lead.id}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setDetails(data);
      })
      .catch(err => console.error('Lead details error:', err))
      .finally(() => { if (!cancelled) setLoading(false); });

    // Fetch trial data if this is an RLT trial lead
    if (lead.lead_type === 'rlt_trial' || lead.lead_type === 'hbot_trial' || lead.trial_data) {
      const trialEndpoint = lead.lead_type === 'hbot_trial'
        ? `/api/hbot-trial/get-trial-details?pipeline_id=${lead.id}`
        : `/api/trial/get-trial-details?pipeline_id=${lead.id}`;
      fetch(trialEndpoint)
        .then(r => r.json())
        .then(data => {
          if (!cancelled) {
            setTrialData(data.trial || lead.trial_data || null);
            setTrialSurveys(data.surveys || []);
          }
        })
        .catch(() => {});
    } else {
      setTrialData(null);
      setTrialSurveys([]);
    }

    return () => { cancelled = true; };
  }, [isOpen, lead]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !lead) return null;

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({
      id: lead.id,
      stage: lead.stage,
      notes: editNotes,
      assigned_to: editAssigned,
      lost_reason: editLostReason,
    });
    setSaving(false);
  };

  const handleStageChange = (newStage) => {
    onMoveStage(lead.id, newStage);
  };

  const isTrialLead = lead.lead_type === 'rlt_trial' || lead.lead_type === 'hbot_trial' || !!trialData;
  const TABS = isTrialLead ? TRIAL_TABS : BASE_TABS;
  const sourceConfig = SOURCE_CONFIG[lead.source || lead.lead_type] || SOURCE_CONFIG.other;
  const stageConfig = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.new_lead;
  const comms = details?.comms || [];
  const appointments = details?.appointments || [];
  const protocols = details?.protocols || [];
  const patientId = details?.patientId;

  const now = new Date();
  const upcomingAppts = appointments.filter(a => new Date(a.start_time) >= now && a.status !== 'cancelled');
  const pastAppts = appointments.filter(a => new Date(a.start_time) < now || a.status === 'cancelled');
  const activeProtocols = protocols.filter(p => p.status === 'active' || p.status === 'paused');
  const completedProtocols = protocols.filter(p => p.status === 'completed' || p.status === 'cancelled');

  // Tab counts
  const commsBadge = comms.length > 0 ? comms.length : null;
  const apptBadge = appointments.length > 0 ? appointments.length : null;
  const protoBadge = protocols.length > 0 ? protocols.length : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '\u2014';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '\u2014';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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

  return (
    <>
      <style jsx global>{`
        @keyframes leadSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes leadOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Overlay */}
      <div style={s.overlay} {...overlayClickProps(onClose)} />

      {/* Panel */}
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.headerNameRow}>
              {patientId ? (
                <Link href={`/admin/patient/${patientId}`} style={s.patientNameLink}>
                  {lead.first_name} {lead.last_name}
                </Link>
              ) : (
                <span style={s.patientName}>{lead.first_name} {lead.last_name}</span>
              )}
              <span style={{ ...s.stageBadge, background: stageConfig.bg, color: stageConfig.color }}>
                {stageConfig.label}
              </span>
            </div>
            <div style={s.headerContact}>
              {lead.phone && <span>{lead.phone}</span>}
              {lead.phone && lead.email && <span style={{ margin: '0 6px', color: '#d1d5db' }}>&middot;</span>}
              {lead.email && <span>{lead.email}</span>}
            </div>
            <div style={s.headerMeta}>
              <span style={{ ...s.sourceBadge, background: sourceConfig.bg, color: sourceConfig.color }}>
                {sourceConfig.label}
              </span>
              {lead.path && (
                <span style={s.pathTag}>
                  {lead.path === 'injury' ? 'Injury' : lead.path === 'energy' ? 'Energy' : lead.path === 'labs' ? 'Labs' : lead.path}
                </span>
              )}
              <span style={s.headerTime}>{timeAgo(lead.created_at)}</span>
            </div>
          </div>
          <button onClick={onClose} style={s.closeBtn} title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={s.tabBar}>
          {TABS.map(tab => {
            const badge = tab.key === 'comms' ? commsBadge :
                          tab.key === 'appointments' ? apptBadge :
                          tab.key === 'protocols' ? protoBadge : null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  ...s.tab,
                  ...(activeTab === tab.key ? s.tabActive : {}),
                }}
              >
                {tab.label}
                {badge && <span style={s.tabBadge}>{badge}</span>}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={s.body}>
          {loading && !details && (
            <div style={s.loadingText}>Loading details...</div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {/* Stage selector */}
              <div style={s.section}>
                <div style={s.sectionTitle}>Stage</div>
                <div style={s.stageGrid}>
                  {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleStageChange(key)}
                      style={{
                        ...s.stageBtn,
                        ...(lead.stage === key ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color, fontWeight: '700' } : {}),
                      }}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assigned */}
              <div style={s.section}>
                <div style={s.sectionTitle}>Assigned To</div>
                <select
                  style={s.input}
                  value={editAssigned}
                  onChange={e => setEditAssigned(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {(employees || []).map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {/* Info */}
              <div style={s.section}>
                <div style={s.sectionTitle}>Lead Info</div>
                <div style={s.infoGrid}>
                  <div style={s.infoItem}>
                    <span style={s.infoLabel}>Source</span>
                    <span style={{ ...s.sourceBadge, background: sourceConfig.bg, color: sourceConfig.color }}>
                      {sourceConfig.label}
                    </span>
                  </div>
                  {lead.path && (
                    <div style={s.infoItem}>
                      <span style={s.infoLabel}>Interest</span>
                      <span style={s.infoValue}>{lead.path === 'injury' ? 'Injury Recovery' : lead.path === 'energy' ? 'Energy / Optimization' : 'Lab Work'}</span>
                    </div>
                  )}
                  {lead.urgency && (
                    <div style={s.infoItem}>
                      <span style={s.infoLabel}>Urgency</span>
                      <span style={s.infoValue}>{lead.urgency}/10</span>
                    </div>
                  )}
                  <div style={s.infoItem}>
                    <span style={s.infoLabel}>Created</span>
                    <span style={s.infoValue}>{formatDate(lead.created_at)}</span>
                  </div>
                  {patientId && (
                    <div style={s.infoItem}>
                      <span style={s.infoLabel}>Patient Record</span>
                      <Link href={`/admin/patient/${patientId}`} style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
                        View Profile
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div style={s.section}>
                <div style={s.sectionTitle}>Notes</div>
                <textarea
                  style={s.textarea}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                />
              </div>

              {/* Lost reason */}
              {(lead.stage === 'lost' || editLostReason) && (
                <div style={s.section}>
                  <div style={s.sectionTitle}>Lost Reason</div>
                  <select
                    style={s.input}
                    value={editLostReason}
                    onChange={e => setEditLostReason(e.target.value)}
                  >
                    <option value="">Select reason...</option>
                    <option value="no_response">No Response</option>
                    <option value="price">Price</option>
                    <option value="went_elsewhere">Went Elsewhere</option>
                    <option value="not_ready">Not Ready</option>
                    <option value="wrong_fit">Wrong Fit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Communications Tab */}
          {activeTab === 'comms' && (
            <div>
              {comms.length === 0 ? (
                <div style={s.emptyState}>
                  <div style={s.emptyIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div style={s.emptyText}>No communications yet</div>
                  <div style={s.emptySubtext}>
                    {!patientId ? 'This lead is not linked to a patient record' : 'No SMS or email logs found'}
                  </div>
                </div>
              ) : (
                <div style={s.commsList}>
                  {comms.map(comm => (
                    <div key={comm.id} style={s.commItem}>
                      <div style={s.commHeader}>
                        <span style={{
                          ...s.commChannel,
                          background: comm.channel === 'sms' ? '#dcfce7' : '#dbeafe',
                          color: comm.channel === 'sms' ? '#166534' : '#1e40af',
                        }}>
                          {comm.channel === 'sms' ? 'SMS' : 'Email'}
                        </span>
                        <span style={s.commType}>
                          {(comm.message_type || '').replace(/_/g, ' ')}
                        </span>
                        <span style={s.commTime}>{timeAgo(comm.created_at)}</span>
                      </div>
                      {comm.subject && (
                        <div style={s.commSubject}>{comm.subject}</div>
                      )}
                      <div style={s.commMessage}>
                        {(comm.message || '').substring(0, 200)}
                        {(comm.message || '').length > 200 ? '...' : ''}
                      </div>
                      <div style={s.commFooter}>
                        <span style={s.commRecipient}>{comm.recipient}</span>
                        <span style={{
                          ...s.commStatus,
                          color: comm.status === 'sent' ? '#166534' : comm.status === 'failed' ? '#dc2626' : '#6b7280',
                        }}>
                          {comm.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Trial Tab */}
          {activeTab === 'trial' && isTrialLead && (
            <div>
              {!trialData ? (
                <div style={s.loadingText}>Loading trial data...</div>
              ) : (
                <>
                  {/* Trial Status */}
                  <div style={s.section}>
                    <div style={s.sectionTitle}>Trial Pass</div>
                    <div style={{ ...s.infoGrid, gridTemplateColumns: '1fr 1fr' }}>
                      <div style={s.infoItem}>
                        <span style={s.infoLabel}>Status</span>
                        <span style={{
                          display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 3,
                          background: trialData.status === 'active' ? '#dcfce7' : trialData.status === 'converted' ? '#dbeafe' : trialData.status === 'expired' ? '#fef2f2' : '#f3f4f6',
                          color: trialData.status === 'active' ? '#166534' : trialData.status === 'converted' ? '#1e40af' : trialData.status === 'expired' ? '#dc2626' : '#374151',
                        }}>
                          {trialData.status}
                        </span>
                      </div>
                      <div style={s.infoItem}>
                        <span style={s.infoLabel}>Sessions</span>
                        <span style={s.infoValue}>{trialData.sessions_used || 0} used</span>
                      </div>
                      <div style={s.infoItem}>
                        <span style={s.infoLabel}>Purchased</span>
                        <span style={s.infoValue}>{trialData.purchased_at ? formatDate(trialData.purchased_at) : '\u2014'}</span>
                      </div>
                      <div style={s.infoItem}>
                        <span style={s.infoLabel}>Expires</span>
                        <span style={s.infoValue}>{trialData.expires_at || '\u2014'}</span>
                      </div>
                      {trialData.main_problem && (
                        <div style={s.infoItem}>
                          <span style={s.infoLabel}>Main Problem</span>
                          <span style={s.infoValue}>{trialData.main_problem}</span>
                        </div>
                      )}
                      {trialData.importance_1_10 && (
                        <div style={s.infoItem}>
                          <span style={s.infoLabel}>Importance</span>
                          <span style={s.infoValue}>{trialData.importance_1_10}/10</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Surveys */}
                  {trialSurveys.length > 0 && (
                    <div style={s.section}>
                      <div style={s.sectionTitle}>Survey Responses</div>
                      {trialSurveys.map(survey => {
                        const isHbot = lead.lead_type === 'hbot_trial' || trialData?.trial_type === 'hbot';
                        const scales = isHbot
                          ? ['brain_fog', 'headaches', 'recovery', 'sleep', 'mood']
                          : ['energy', 'brain_fog', 'recovery', 'sleep', 'stress'];
                        return (
                          <div key={survey.id} style={{ padding: 12, background: '#f9fafb', borderRadius: 6, border: '1px solid #f3f4f6', marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: survey.survey_type === 'pre' ? '#2563eb' : '#16a34a', textTransform: 'uppercase' }}>
                                {survey.survey_type === 'pre' ? 'Pre-Trial' : 'Post-Trial'}
                              </span>
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(survey.created_at)}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                              {scales.map(scale => (
                                <div key={scale} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', padding: '2px 0' }}>
                                  <span>{scale.replace(/_/g, ' ')}</span>
                                  <span style={{ fontWeight: 600, color: '#111' }}>{survey[scale] ?? '\u2014'}</span>
                                </div>
                              ))}
                            </div>
                            {survey.noticed_notes && (
                              <div style={{ marginTop: 8, fontSize: 12, color: '#374151', fontStyle: 'italic', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                                &ldquo;{survey.noticed_notes}&rdquo;
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Show deltas if both pre and post exist */}
                      {trialSurveys.filter(s => s.survey_type === 'pre').length > 0 && trialSurveys.filter(s => s.survey_type === 'post').length > 0 && (() => {
                        const pre = trialSurveys.find(s => s.survey_type === 'pre');
                        const post = trialSurveys.find(s => s.survey_type === 'post');
                        const isHbot = lead.lead_type === 'hbot_trial' || trialData?.trial_type === 'hbot';
                        const scales = isHbot
                          ? ['brain_fog', 'headaches', 'recovery', 'sleep', 'mood']
                          : ['energy', 'recovery', 'sleep', 'brain_fog', 'stress'];
                        return (
                          <div style={{ padding: 12, background: '#fffbeb', borderRadius: 6, border: '1px solid #fef3c7' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 6, textTransform: 'uppercase' }}>Changes</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                              {scales.map(scale => {
                                const preVal = pre[scale] ?? 0;
                                const postVal = post[scale] ?? 0;
                                const isReduction = scale === 'brain_fog' || scale === 'stress' || scale === 'headaches';
                                const delta = isReduction ? preVal - postVal : postVal - preVal;
                                const color = delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#6b7280';
                                return (
                                  <div key={scale} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
                                    <span style={{ color: '#6b7280' }}>{scale.replace(/_/g, ' ')}</span>
                                    <span style={{ fontWeight: 600, color }}>{delta > 0 ? '+' : ''}{delta}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Check-In Recommendation */}
                  {trialData.checkin_recommendation && (
                    <div style={s.section}>
                      <div style={s.sectionTitle}>Recommendation</div>
                      <div style={{
                        padding: 12, borderRadius: 6,
                        background: trialData.checkin_recommendation === 'assessment_program' ? '#f0fdf4' : trialData.checkin_recommendation === 'membership' ? '#eff6ff' : '#f3f4f6',
                        border: `1px solid ${trialData.checkin_recommendation === 'assessment_program' ? '#bbf7d0' : trialData.checkin_recommendation === 'membership' ? '#bfdbfe' : '#e5e7eb'}`,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 4 }}>
                          {trialData.checkin_recommendation === 'assessment_program' ? 'Offer Assessment + Program' :
                           trialData.checkin_recommendation === 'membership' ? 'Offer RLT Membership or 10-Pack' :
                           trialData.checkin_recommendation === 'nurture' ? 'Add to Nurture List' : trialData.checkin_recommendation}
                        </div>
                        {trialData.checkin_notes && (
                          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{trialData.checkin_notes}</div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div>
              {appointments.length === 0 ? (
                <div style={s.emptyState}>
                  <div style={s.emptyIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div style={s.emptyText}>No appointments</div>
                  <div style={s.emptySubtext}>
                    {!patientId ? 'This lead is not linked to a patient record' : 'No appointments found'}
                  </div>
                </div>
              ) : (
                <div>
                  {upcomingAppts.length > 0 && (
                    <>
                      <div style={s.sectionTitle}>Upcoming</div>
                      {upcomingAppts.map(appt => (
                        <AppointmentCard key={appt.id} appt={appt} formatDate={formatDate} formatTime={formatTime} />
                      ))}
                    </>
                  )}
                  {pastAppts.length > 0 && (
                    <>
                      <div style={{ ...s.sectionTitle, marginTop: upcomingAppts.length > 0 ? '20px' : '0' }}>Previous</div>
                      {pastAppts.map(appt => (
                        <AppointmentCard key={appt.id} appt={appt} formatDate={formatDate} formatTime={formatTime} past />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Protocols Tab */}
          {activeTab === 'protocols' && (
            <div>
              {protocols.length === 0 ? (
                <div style={s.emptyState}>
                  <div style={s.emptyIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div style={s.emptyText}>No protocols</div>
                  <div style={s.emptySubtext}>
                    {!patientId ? 'This lead is not linked to a patient record' : 'No protocols found'}
                  </div>
                </div>
              ) : (
                <div>
                  {activeProtocols.length > 0 && (
                    <>
                      <div style={s.sectionTitle}>Active Protocols</div>
                      {activeProtocols.map(proto => (
                        <ProtocolCard key={proto.id} protocol={proto} formatDate={formatDate} patientId={patientId} />
                      ))}
                    </>
                  )}
                  {completedProtocols.length > 0 && (
                    <>
                      <div style={{ ...s.sectionTitle, marginTop: activeProtocols.length > 0 ? '20px' : '0' }}>Completed</div>
                      {completedProtocols.map(proto => (
                        <ProtocolCard key={proto.id} protocol={proto} formatDate={formatDate} patientId={patientId} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          {activeTab === 'overview' ? (
            <>
              <button onClick={() => setShowDeleteConfirm(true)} style={s.deleteBtn}>Delete</button>
              <div style={{ flex: 1 }} />
              <button onClick={onClose} style={s.cancelBtn}>Close</button>
              <button onClick={handleSave} disabled={saving} style={s.saveBtn}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              {patientId && (
                <Link href={`/admin/patient/${patientId}`} style={s.viewPatientBtn}>
                  View Full Patient Profile
                </Link>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={onClose} style={s.cancelBtn}>Close</button>
            </>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div style={s.confirmOverlay}>
            <div style={s.confirmBox}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '8px' }}>Delete Lead?</div>
              <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
                Remove <strong>{lead.first_name} {lead.last_name}</strong> from the pipeline? This cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDeleteConfirm(false)} style={s.cancelBtn}>Cancel</button>
                <button
                  onClick={() => { onDelete(lead.id); setShowDeleteConfirm(false); }}
                  style={{ ...s.saveBtn, background: '#dc2626', borderColor: '#dc2626' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function AppointmentCard({ appt, formatDate, formatTime, past }) {
  const statusStyle = APPT_STATUS_COLORS[appt.status] || APPT_STATUS_COLORS.scheduled;
  return (
    <div style={{ ...s.apptCard, ...(past ? { opacity: 0.7 } : {}) }}>
      <div style={s.apptHeader}>
        <span style={s.apptService}>{appt.service_name || 'Appointment'}</span>
        <span style={{ ...s.apptStatus, background: statusStyle.background, color: statusStyle.color }}>
          {(appt.status || 'scheduled').replace(/_/g, ' ')}
        </span>
      </div>
      <div style={s.apptDetails}>
        <span>{formatDate(appt.start_time)}</span>
        {appt.start_time && <span style={{ margin: '0 4px', color: '#d1d5db' }}>&middot;</span>}
        <span>{formatTime(appt.start_time)}</span>
        {appt.provider && (
          <>
            <span style={{ margin: '0 4px', color: '#d1d5db' }}>&middot;</span>
            <span>{appt.provider}</span>
          </>
        )}
      </div>
      {appt.notes && <div style={s.apptNotes}>{appt.notes}</div>}
    </div>
  );
}

function ProtocolCard({ protocol, formatDate, patientId }) {
  const statusStyle = PROTOCOL_STATUS_COLORS[protocol.status] || PROTOCOL_STATUS_COLORS.active;
  const progress = protocol.total_sessions
    ? Math.round((protocol.sessions_used / protocol.total_sessions) * 100)
    : null;

  return (
    <div style={s.protoCard}>
      <div style={s.protoHeader}>
        <span style={s.protoName}>{protocol.program_name || protocol.medication}</span>
        <span style={{ ...s.protoStatus, ...statusStyle, textTransform: 'capitalize' }}>
          {protocol.status}
        </span>
      </div>
      {protocol.medication && protocol.program_name && (
        <div style={s.protoMed}>{protocol.medication}</div>
      )}
      <div style={s.protoDetails}>
        <span>Started {formatDate(protocol.start_date)}</span>
        {protocol.end_date && (
          <>
            <span style={{ margin: '0 4px', color: '#d1d5db' }}>&middot;</span>
            <span>Ended {formatDate(protocol.end_date)}</span>
          </>
        )}
      </div>
      {progress !== null && (
        <div style={s.protoProgress}>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${Math.min(progress, 100)}%` }} />
          </div>
          <span style={s.progressText}>
            {protocol.sessions_used}/{protocol.total_sessions} sessions
          </span>
        </div>
      )}
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.35)',
    zIndex: 1100,
    animation: 'leadOverlayFade 0.2s ease-out',
  },
  panel: {
    position: 'fixed',
    top: 0, right: 0, bottom: 0,
    width: '520px',
    maxWidth: '92vw',
    background: '#ffffff',
    zIndex: 1101,
    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'leadSlideIn 0.25s ease-out',
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
  headerLeft: { flex: 1, minWidth: 0 },
  headerNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
    flexWrap: 'wrap',
  },
  patientName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111',
    lineHeight: '1.3',
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
    marginBottom: '6px',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  sourceBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '3px',
    whiteSpace: 'nowrap',
  },
  pathTag: {
    fontSize: '11px',
    padding: '2px 8px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '3px',
    fontWeight: '500',
  },
  headerTime: {
    fontSize: '11px',
    color: '#9ca3af',
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
  // Tabs
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    padding: '0 24px',
    flexShrink: 0,
    background: '#fafafa',
  },
  tab: {
    padding: '10px 14px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  tabActive: {
    color: '#111',
    borderBottomColor: '#111',
  },
  tabBadge: {
    fontSize: '10px',
    fontWeight: '700',
    background: '#e5e7eb',
    color: '#374151',
    padding: '1px 6px',
    borderRadius: '8px',
    lineHeight: '1.4',
  },
  // Body
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 24px 24px',
  },
  loadingText: {
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
    padding: '20px 0',
  },
  section: { marginTop: '18px' },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#9ca3af',
    marginBottom: '8px',
  },
  // Overview
  stageGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  stageBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    background: '#fff',
    color: '#6b7280',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    padding: '14px',
    background: '#f9fafb',
    borderRadius: '6px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
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
  input: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff',
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
    height: '90px',
    lineHeight: '1.5',
  },
  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyIcon: { marginBottom: '12px' },
  emptyText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '4px',
  },
  emptySubtext: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  // Communications
  commsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    marginTop: '8px',
  },
  commItem: {
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  commHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  commChannel: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '3px',
    textTransform: 'uppercase',
  },
  commType: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  commTime: {
    fontSize: '11px',
    color: '#9ca3af',
    marginLeft: 'auto',
  },
  commSubject: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111',
    marginBottom: '4px',
  },
  commMessage: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.5',
  },
  commFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
  },
  commRecipient: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  commStatus: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  // Appointments
  apptCard: {
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '6px',
    marginBottom: '8px',
    border: '1px solid #f3f4f6',
  },
  apptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  apptService: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111',
  },
  apptStatus: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '3px',
    textTransform: 'capitalize',
  },
  apptDetails: {
    fontSize: '12px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  apptNotes: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
    fontStyle: 'italic',
  },
  // Protocols
  protoCard: {
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '6px',
    marginBottom: '8px',
    border: '1px solid #f3f4f6',
  },
  protoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  protoName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111',
  },
  protoStatus: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '3px',
  },
  protoMed: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  protoDetails: {
    fontSize: '12px',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  protoProgress: {
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  progressBar: {
    flex: 1,
    height: '6px',
    background: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#111',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  // Footer
  footer: {
    padding: '14px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexShrink: 0,
    background: '#fafafa',
  },
  deleteBtn: {
    padding: '9px 16px',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'inherit',
    cursor: 'pointer',
    color: '#dc2626',
  },
  cancelBtn: {
    padding: '9px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'inherit',
    cursor: 'pointer',
    color: '#374151',
  },
  saveBtn: {
    padding: '9px 16px',
    border: '1px solid #111',
    borderRadius: '6px',
    background: '#111',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  viewPatientBtn: {
    padding: '9px 16px',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center',
  },
  // Delete confirmation
  confirmOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  confirmBox: {
    background: '#fff',
    padding: '20px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    maxWidth: '340px',
    width: '100%',
  },
};
