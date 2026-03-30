// components/LabDetailPanel.js
// Slide-out panel for lab pipeline patients
// Shows: overview (lab info, stage), appointments, protocols, lab history
// Range Medical System V2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { overlayClickProps } from './AdminLayout';
import { supabase } from '../lib/supabase';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'protocols', label: 'Protocols' },
  { key: 'labs', label: 'Labs' },
];

const LAB_STAGE_CONFIG = {
  awaiting_results:  { label: 'Awaiting Results',  color: '#f59e0b', bg: '#fffbeb' },
  uploaded:          { label: 'Uploaded',           color: '#8b5cf6', bg: '#f5f3ff' },
  under_review:      { label: 'Under Review',      color: '#3b82f6', bg: '#eff6ff' },
  ready_to_schedule: { label: 'Ready to Schedule',  color: '#f97316', bg: '#fff7ed' },
  consult_scheduled: { label: 'Consult Booked',     color: '#6366f1', bg: '#eef2ff' },
  in_treatment:      { label: 'In Treatment',       color: '#10b981', bg: '#ecfdf5' },
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

export default function LabDetailPanel({ isOpen, onClose, lead }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [labFiles, setLabFiles] = useState([]);

  useEffect(() => {
    if (!isOpen || !lead?.patient_id) {
      setActiveTab('overview');
      setAppointments([]);
      setProtocols([]);
      setLabFiles([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const pid = lead.patient_id;

    // Fetch appointments, protocols, and lab files in parallel
    Promise.all([
      supabase
        .from('appointments')
        .select('id, service_name, service_category, provider, start_time, end_time, status, notes')
        .eq('patient_id', pid)
        .order('start_time', { ascending: false })
        .limit(20),
      supabase
        .from('protocols')
        .select('id, program_name, medication, status, start_date, end_date, sessions_used, total_sessions, category, program_type')
        .eq('patient_id', pid)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('labs')
        .select('id, panel_type, file_name, file_url, draw_date, uploaded_at, status')
        .eq('patient_id', pid)
        .order('draw_date', { ascending: false })
        .limit(20),
    ]).then(([apptRes, protoRes, labRes]) => {
      if (cancelled) return;
      setAppointments(apptRes.data || []);
      setProtocols(protoRes.data || []);
      setLabFiles(labRes.data || []);
    }).catch(err => {
      console.error('Lab detail fetch error:', err);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [isOpen, lead]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !lead) return null;

  const stageConfig = LAB_STAGE_CONFIG[lead.stage] || { label: lead.stage, color: '#6b7280', bg: '#f3f4f6' };
  const panelType = lead.source || 'Essential';
  const isElite = panelType === 'Elite';
  const name = `${lead.first_name} ${lead.last_name}`.trim();

  const now = new Date();
  const upcomingAppts = appointments.filter(a => new Date(a.start_time) >= now && a.status !== 'cancelled');
  const pastAppts = appointments.filter(a => new Date(a.start_time) < now || a.status === 'cancelled');
  const activeProtocols = protocols.filter(p => p.status === 'active' || p.status === 'paused');
  const completedProtocols = protocols.filter(p => p.status === 'completed' || p.status === 'cancelled');

  const apptBadge = appointments.length > 0 ? appointments.length : null;
  const protoBadge = protocols.length > 0 ? protocols.length : null;
  const labBadge = labFiles.length > 0 ? labFiles.length : null;

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

  const daysInStage = lead.updated_at
    ? Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      <style jsx global>{`
        @keyframes labSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes labOverlayFade {
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
              {lead.patient_id ? (
                <Link href={`/admin/patient/${lead.patient_id}`} style={s.patientNameLink}>
                  {name}
                </Link>
              ) : (
                <span style={s.patientName}>{name}</span>
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
              <span style={{
                ...s.panelBadge,
                background: isElite ? '#fdf2f8' : '#f0f9ff',
                color: isElite ? '#9d174d' : '#0369a1',
              }}>
                {panelType}
              </span>
              <span style={s.pathTag}>{lead.path}</span>
              {daysInStage > 0 && (
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  color: daysInStage > 3 ? '#ef4444' : daysInStage > 1 ? '#f59e0b' : '#9ca3af',
                }}>
                  {daysInStage}d in stage
                </span>
              )}
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
            const badge = tab.key === 'appointments' ? apptBadge :
                          tab.key === 'protocols' ? protoBadge :
                          tab.key === 'labs' ? labBadge : null;
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
          {loading && (
            <div style={s.loadingText}>Loading details...</div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div style={s.section}>
                <div style={s.sectionTitle}>Lab Protocol</div>
                <div style={s.infoGrid}>
                  <div style={s.infoItem}>
                    <span style={s.infoLabel}>Panel</span>
                    <span style={{
                      ...s.panelBadge, display: 'inline-block',
                      background: isElite ? '#fdf2f8' : '#f0f9ff',
                      color: isElite ? '#9d174d' : '#0369a1',
                    }}>
                      {panelType}
                    </span>
                  </div>
                  <div style={s.infoItem}>
                    <span style={s.infoLabel}>Type</span>
                    <span style={s.infoValue}>{lead.path}</span>
                  </div>
                  <div style={s.infoItem}>
                    <span style={s.infoLabel}>Stage</span>
                    <span style={{
                      ...s.stageBadge, display: 'inline-block',
                      background: stageConfig.bg, color: stageConfig.color,
                    }}>
                      {stageConfig.label}
                    </span>
                  </div>
                  <div style={s.infoItem}>
                    <span style={s.infoLabel}>Time in Stage</span>
                    <span style={{
                      ...s.infoValue,
                      color: daysInStage > 3 ? '#ef4444' : daysInStage > 1 ? '#f59e0b' : '#111',
                      fontWeight: daysInStage > 1 ? 600 : 500,
                    }}>
                      {daysInStage === 0 ? 'Today' : `${daysInStage} day${daysInStage !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  {lead.start_date && (
                    <div style={s.infoItem}>
                      <span style={s.infoLabel}>Draw Date</span>
                      <span style={s.infoValue}>
                        {new Date(lead.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div style={s.infoItem}>
                    <span style={s.infoLabel}>Created</span>
                    <span style={s.infoValue}>{formatDate(lead.created_at)}</span>
                  </div>
                  {lead.patient_id && (
                    <div style={{ ...s.infoItem, gridColumn: '1 / -1' }}>
                      <span style={s.infoLabel}>Patient Record</span>
                      <Link href={`/admin/patient/${lead.patient_id}`} style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
                        View Full Profile
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {lead.notes && (
                <div style={s.section}>
                  <div style={s.sectionTitle}>Notes</div>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, padding: '10px 14px', background: '#f9fafb', borderRadius: '6px' }}>
                    {lead.notes}
                  </div>
                </div>
              )}

              {/* Quick summary of what's linked */}
              <div style={s.section}>
                <div style={s.sectionTitle}>Summary</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={s.summaryChip}>
                    {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
                  </div>
                  <div style={s.summaryChip}>
                    {protocols.filter(p => p.program_type !== 'labs').length} protocol{protocols.filter(p => p.program_type !== 'labs').length !== 1 ? 's' : ''}
                  </div>
                  <div style={s.summaryChip}>
                    {labFiles.length} lab file{labFiles.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
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
                  <div style={s.emptySubtext}>No appointments found for this patient</div>
                </div>
              ) : (
                <div>
                  {upcomingAppts.length > 0 && (
                    <>
                      <div style={{ ...s.sectionTitle, marginTop: '12px' }}>Upcoming</div>
                      {upcomingAppts.map(appt => {
                        const statusStyle = APPT_STATUS_COLORS[appt.status] || APPT_STATUS_COLORS.scheduled;
                        return (
                          <div key={appt.id} style={s.apptCard}>
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
                      })}
                    </>
                  )}
                  {pastAppts.length > 0 && (
                    <>
                      <div style={{ ...s.sectionTitle, marginTop: upcomingAppts.length > 0 ? '20px' : '12px' }}>Previous</div>
                      {pastAppts.map(appt => {
                        const statusStyle = APPT_STATUS_COLORS[appt.status] || APPT_STATUS_COLORS.scheduled;
                        return (
                          <div key={appt.id} style={{ ...s.apptCard, opacity: 0.7 }}>
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
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Protocols Tab */}
          {activeTab === 'protocols' && (
            <div>
              {protocols.filter(p => p.program_type !== 'labs').length === 0 ? (
                <div style={s.emptyState}>
                  <div style={s.emptyIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div style={s.emptyText}>No protocols</div>
                  <div style={s.emptySubtext}>No treatment protocols found</div>
                </div>
              ) : (
                <div>
                  {activeProtocols.filter(p => p.program_type !== 'labs').length > 0 && (
                    <>
                      <div style={{ ...s.sectionTitle, marginTop: '12px' }}>Active Protocols</div>
                      {activeProtocols.filter(p => p.program_type !== 'labs').map(proto => {
                        const statusStyle = PROTOCOL_STATUS_COLORS[proto.status] || PROTOCOL_STATUS_COLORS.active;
                        const progress = proto.total_sessions
                          ? Math.round((proto.sessions_used / proto.total_sessions) * 100)
                          : null;
                        return (
                          <div key={proto.id} style={s.protoCard}>
                            <div style={s.protoHeader}>
                              <span style={s.protoName}>{proto.program_name || proto.medication}</span>
                              <span style={{ ...s.protoStatus, ...statusStyle, textTransform: 'capitalize' }}>
                                {proto.status}
                              </span>
                            </div>
                            {proto.medication && proto.program_name && (
                              <div style={s.protoMed}>{proto.medication}</div>
                            )}
                            <div style={s.protoDetails}>
                              <span>Started {formatDate(proto.start_date)}</span>
                            </div>
                            {progress !== null && (
                              <div style={s.protoProgress}>
                                <div style={s.progressBar}>
                                  <div style={{ ...s.progressFill, width: `${Math.min(progress, 100)}%` }} />
                                </div>
                                <span style={s.progressText}>
                                  {proto.sessions_used}/{proto.total_sessions} sessions
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                  {completedProtocols.filter(p => p.program_type !== 'labs').length > 0 && (
                    <>
                      <div style={{ ...s.sectionTitle, marginTop: '20px' }}>Completed</div>
                      {completedProtocols.filter(p => p.program_type !== 'labs').map(proto => {
                        const statusStyle = PROTOCOL_STATUS_COLORS[proto.status] || PROTOCOL_STATUS_COLORS.active;
                        return (
                          <div key={proto.id} style={{ ...s.protoCard, opacity: 0.7 }}>
                            <div style={s.protoHeader}>
                              <span style={s.protoName}>{proto.program_name || proto.medication}</span>
                              <span style={{ ...s.protoStatus, ...statusStyle, textTransform: 'capitalize' }}>
                                {proto.status}
                              </span>
                            </div>
                            <div style={s.protoDetails}>
                              <span>Started {formatDate(proto.start_date)}</span>
                              {proto.end_date && (
                                <>
                                  <span style={{ margin: '0 4px', color: '#d1d5db' }}>&middot;</span>
                                  <span>Ended {formatDate(proto.end_date)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Labs Tab */}
          {activeTab === 'labs' && (
            <div>
              {labFiles.length === 0 ? (
                <div style={s.emptyState}>
                  <div style={s.emptyIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 2v6l-2 4v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8l-2-4V2" /><line x1="8" y1="2" x2="16" y2="2" /><line x1="7" y1="12" x2="17" y2="12" />
                    </svg>
                  </div>
                  <div style={s.emptyText}>No lab files</div>
                  <div style={s.emptySubtext}>No lab results uploaded yet</div>
                </div>
              ) : (
                <div style={{ marginTop: '12px' }}>
                  {labFiles.map(lab => (
                    <div key={lab.id} style={s.labCard}>
                      <div style={s.labHeader}>
                        <span style={s.labType}>
                          {lab.panel_type === 'Elite' ? 'Elite Panel' : lab.panel_type === 'Essential' ? 'Essential Panel' : lab.panel_type || 'Lab Result'}
                        </span>
                        {lab.status && (
                          <span style={{
                            fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '3px', textTransform: 'capitalize',
                            background: lab.status === 'reviewed' ? '#dcfce7' : lab.status === 'uploaded' ? '#f5f3ff' : '#f3f4f6',
                            color: lab.status === 'reviewed' ? '#166534' : lab.status === 'uploaded' ? '#7c3aed' : '#6b7280',
                          }}>
                            {lab.status}
                          </span>
                        )}
                      </div>
                      <div style={s.labDetails}>
                        {lab.draw_date && <span>Draw: {formatDate(lab.draw_date)}</span>}
                        {lab.uploaded_at && (
                          <>
                            {lab.draw_date && <span style={{ margin: '0 4px', color: '#d1d5db' }}>&middot;</span>}
                            <span>Uploaded: {timeAgo(lab.uploaded_at)}</span>
                          </>
                        )}
                      </div>
                      {lab.file_name && (
                        <div style={s.labFile}>
                          {lab.file_url ? (
                            <a href={lab.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '12px', textDecoration: 'none' }}>
                              {lab.file_name}
                            </a>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{lab.file_name}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          {lead.patient_id && (
            <Link href={`/admin/patient/${lead.patient_id}`} style={s.viewPatientBtn}>
              View Full Patient Profile
            </Link>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={s.cancelBtn}>Close</button>
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
    animation: 'labOverlayFade 0.2s ease-out',
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
    animation: 'labSlideIn 0.25s ease-out',
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
  panelBadge: {
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
  summaryChip: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '6px 12px',
    background: '#f3f4f6',
    color: '#374151',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
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
  // Appointments
  apptCard: {
    padding: '12px 14px',
    background: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #f3f4f6',
    marginBottom: '8px',
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
  },
  apptNotes: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
    fontStyle: 'italic',
  },
  // Protocols
  protoCard: {
    padding: '12px 14px',
    background: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #f3f4f6',
    marginBottom: '8px',
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
    color: '#6b7280',
  },
  protoProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  progressBar: {
    flex: 1,
    height: '4px',
    background: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#10b981',
    borderRadius: '2px',
    transition: 'width 0.3s',
  },
  progressText: {
    fontSize: '11px',
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },
  // Labs
  labCard: {
    padding: '12px 14px',
    background: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #f3f4f6',
    marginBottom: '8px',
  },
  labHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  labType: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111',
  },
  labDetails: {
    fontSize: '12px',
    color: '#6b7280',
  },
  labFile: {
    marginTop: '4px',
  },
  // Footer
  footer: {
    padding: '14px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
    background: '#fafafa',
  },
  viewPatientBtn: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#2563eb',
    textDecoration: 'none',
    padding: '8px 14px',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    background: '#eff6ff',
  },
  cancelBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
