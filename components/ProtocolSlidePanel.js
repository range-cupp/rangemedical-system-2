// components/ProtocolSlidePanel.js
// Slide-out side panel for quick protocol detail view
// Range Medical System V2

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const statusColors = {
  active: { background: '#dcfce7', color: '#166534' },
  paused: { background: '#fef3c7', color: '#92400e' },
  completed: { background: '#dbeafe', color: '#1e40af' },
  cancelled: { background: '#f3f4f6', color: '#6b7280' }
};

const logTypeLabels = {
  peptide_checkin_optin: 'Opted in to check-ins',
  peptide_checkin_optout: 'Opted out of check-ins',
  peptide_checkin_optin_sent: 'Opt-in SMS sent',
  peptide_checkin_response: 'Check-in response',
  checkin: 'Check-in',
  note: 'Note',
  renewal: 'Renewal',
  dose_change: 'Dose change',
  status_change: 'Status change',
  labs_ordered: 'Labs ordered',
  labs_completed: 'Labs completed'
};

export default function ProtocolSlidePanel({ isOpen, onClose, protocolId, cardData }) {
  const [protocol, setProtocol] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch full protocol data when panel opens
  useEffect(() => {
    if (!isOpen || !protocolId) {
      setProtocol(null);
      setLogs([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/protocols/${protocolId}`)
      .then(res => {
        if (!res.ok) throw new Error('Protocol not found');
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        setProtocol(data.protocol || data);
        setLogs(data.activityLogs || []);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('Error fetching protocol:', err);
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isOpen, protocolId]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use cardData for immediate display, protocol for full details
  const patientName = protocol?.patients
    ? (protocol.patients.first_name && protocol.patients.last_name
        ? `${protocol.patients.first_name} ${protocol.patients.last_name}`
        : protocol.patients.name)
    : cardData?.patientName || 'Loading...';

  const patientId = protocol?.patient_id || cardData?.patientId;
  const status = protocol?.status || cardData?.status || 'active';
  const statusStyle = statusColors[status] || statusColors.active;

  const programName = protocol?.program_name || cardData?.programName || '';
  const medication = protocol?.medication || cardData?.medication || '';
  const dose = protocol?.selected_dose || cardData?.dose || '';
  const frequency = protocol?.frequency || cardData?.frequency || '';
  const deliveryMethod = protocol?.delivery_method || '';
  const startDate = protocol?.start_date || cardData?.startDate || '';
  const endDate = protocol?.end_date || '';
  const totalSessions = protocol?.total_sessions || cardData?.totalSessions;
  const sessionsUsed = protocol?.sessions_used || cardData?.sessionsUsed || 0;
  const currentStage = protocol?.current_journey_stage || cardData?.currentStage;
  const notes = protocol?.notes || '';
  const patientEmail = protocol?.patients?.email || cardData?.patientEmail || '';
  const patientPhone = protocol?.patients?.phone || cardData?.patientPhone || '';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysSince = (dateStr) => {
    if (!dateStr) return null;
    const start = new Date(dateStr + 'T12:00:00');
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  };

  const formatDelivery = (method) => {
    if (!method) return '—';
    const map = {
      take_home: 'Take Home',
      in_clinic: 'In Clinic',
      delivery: 'Delivery (Shipped)',
      injection: 'Injection'
    };
    return map[method] || method;
  };

  const formatFrequency = (freq) => {
    if (!freq) return '—';
    const map = {
      daily: 'Daily',
      '2x_daily': 'Twice Daily',
      weekly: 'Weekly',
      biweekly: 'Every 2 Weeks',
      monthly: 'Monthly',
      as_needed: 'As Needed'
    };
    return map[freq] || freq;
  };

  const formatStage = (key) => {
    if (!key) return 'Unassigned';
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const days = daysSince(startDate);
  const recentLogs = logs.slice(0, 5);

  const sessionProgress = totalSessions
    ? Math.round((sessionsUsed / totalSessions) * 100)
    : null;

  return (
    <>
      <style jsx global>{`
        @keyframes protocolSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes protocolOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Overlay */}
      <div
        style={panelStyles.overlay}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={panelStyles.panel}>
        {/* Header */}
        <div style={panelStyles.header}>
          <div style={panelStyles.headerLeft}>
            <div style={panelStyles.headerNameRow}>
              {patientId ? (
                <Link href={`/patients/${patientId}`} style={panelStyles.patientName}>
                  {patientName}
                </Link>
              ) : (
                <span style={panelStyles.patientName}>{patientName}</span>
              )}
              <span style={{ ...panelStyles.statusBadge, ...statusStyle }}>
                {status}
              </span>
            </div>
            <div style={panelStyles.headerSubtitle}>
              {programName || medication || 'Protocol'}
            </div>
            {(patientEmail || patientPhone) && (
              <div style={panelStyles.headerContact}>
                {patientPhone && <span>{patientPhone}</span>}
                {patientPhone && patientEmail && <span style={{ margin: '0 6px', color: '#d1d5db' }}>·</span>}
                {patientEmail && <span>{patientEmail}</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} style={panelStyles.closeBtn} title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={panelStyles.body}>
          {error && (
            <div style={panelStyles.errorBox}>
              Could not load full protocol details. Showing summary data.
            </div>
          )}

          {/* Overview Grid */}
          <div style={panelStyles.section}>
            <div style={panelStyles.sectionTitle}>Protocol Details</div>
            <div style={panelStyles.grid}>
              <div style={panelStyles.field}>
                <div style={panelStyles.fieldLabel}>Medication</div>
                <div style={panelStyles.fieldValue}>{medication || '—'}</div>
              </div>
              <div style={panelStyles.field}>
                <div style={panelStyles.fieldLabel}>Dose</div>
                <div style={panelStyles.fieldValue}>{dose || '—'}</div>
              </div>
              <div style={panelStyles.field}>
                <div style={panelStyles.fieldLabel}>Frequency</div>
                <div style={panelStyles.fieldValue}>{formatFrequency(frequency)}</div>
              </div>
              <div style={panelStyles.field}>
                <div style={panelStyles.fieldLabel}>Delivery</div>
                <div style={panelStyles.fieldValue}>{formatDelivery(deliveryMethod)}</div>
              </div>
              <div style={panelStyles.field}>
                <div style={panelStyles.fieldLabel}>Start Date</div>
                <div style={panelStyles.fieldValue}>{formatDate(startDate)}</div>
              </div>
              <div style={panelStyles.field}>
                <div style={panelStyles.fieldLabel}>{endDate ? 'End Date' : 'Day Count'}</div>
                <div style={panelStyles.fieldValue}>
                  {endDate ? formatDate(endDate) : (days !== null ? `Day ${days}` : '—')}
                </div>
              </div>
            </div>
          </div>

          {/* Session Progress */}
          {totalSessions && (
            <div style={panelStyles.section}>
              <div style={panelStyles.sectionTitle}>Sessions</div>
              <div style={panelStyles.progressContainer}>
                <div style={panelStyles.progressBar}>
                  <div style={{
                    ...panelStyles.progressFill,
                    width: `${Math.min(sessionProgress, 100)}%`
                  }} />
                </div>
                <div style={panelStyles.progressText}>
                  {sessionsUsed} of {totalSessions} sessions
                  {days !== null && <span style={panelStyles.progressDays}> · Day {days}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Journey Stage */}
          {currentStage && (
            <div style={panelStyles.section}>
              <div style={panelStyles.sectionTitle}>Journey Stage</div>
              <span style={panelStyles.journeyStageBadge}>
                {formatStage(currentStage)}
              </span>
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div style={panelStyles.section}>
              <div style={panelStyles.sectionTitle}>Notes</div>
              <div style={panelStyles.notesText}>{notes}</div>
            </div>
          )}

          {/* Recent Activity */}
          {loading && recentLogs.length === 0 && (
            <div style={panelStyles.section}>
              <div style={panelStyles.sectionTitle}>Recent Activity</div>
              <div style={panelStyles.loadingText}>Loading activity...</div>
            </div>
          )}

          {recentLogs.length > 0 && (
            <div style={panelStyles.section}>
              <div style={panelStyles.sectionTitle}>Recent Activity</div>
              <div style={panelStyles.activityList}>
                {recentLogs.map((log, i) => (
                  <div key={log.id || i} style={panelStyles.activityItem}>
                    <div style={panelStyles.activityDot} />
                    <div style={panelStyles.activityContent}>
                      <div style={panelStyles.activityType}>
                        {logTypeLabels[log.log_type] || log.log_type || 'Activity'}
                      </div>
                      {log.notes && (
                        <div style={panelStyles.activityNotes}>{log.notes}</div>
                      )}
                      <div style={panelStyles.activityDate}>
                        {formatDate(log.log_date)}
                      </div>
                    </div>
                  </div>
                ))}
                {logs.length > 5 && (
                  <div style={panelStyles.activityMore}>
                    +{logs.length - 5} more entries
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={panelStyles.footer}>
          <Link
            href={`/admin/protocols/${protocolId}`}
            style={panelStyles.footerBtnPrimary}
          >
            View Full Details
          </Link>
          {patientId && (
            <Link
              href={`/patients/${patientId}`}
              style={panelStyles.footerBtnSecondary}
            >
              View Patient
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

const panelStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.35)',
    zIndex: 1100,
    animation: 'protocolOverlayFade 0.2s ease-out'
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '480px',
    maxWidth: '90vw',
    background: '#ffffff',
    zIndex: 1101,
    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'protocolSlideIn 0.25s ease-out'
  },
  header: {
    padding: '20px 24px 16px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    flexShrink: 0
  },
  headerLeft: {
    flex: 1,
    minWidth: 0
  },
  headerNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
    flexWrap: 'wrap'
  },
  patientName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111',
    textDecoration: 'none',
    lineHeight: '1.3'
  },
  statusBadge: {
    padding: '3px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    textTransform: 'capitalize'
  },
  headerSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px'
  },
  headerContact: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '2px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: '#9ca3af',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'color 0.15s'
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 24px 24px'
  },
  errorBox: {
    margin: '16px 0 0',
    padding: '10px 14px',
    background: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#92400e'
  },
  section: {
    marginTop: '20px'
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#9ca3af',
    marginBottom: '10px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  fieldLabel: {
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: '500'
  },
  fieldValue: {
    fontSize: '14px',
    color: '#111',
    fontWeight: '500'
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  progressBar: {
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: '#000',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500'
  },
  progressDays: {
    color: '#9ca3af'
  },
  journeyStageBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    background: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151'
  },
  notesText: {
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.6',
    background: '#f9fafb',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #f3f4f6'
  },
  loadingText: {
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0'
  },
  activityItem: {
    display: 'flex',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  activityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#d1d5db',
    marginTop: '5px',
    flexShrink: 0
  },
  activityContent: {
    flex: 1,
    minWidth: 0
  },
  activityType: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151'
  },
  activityNotes: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
    lineHeight: '1.4'
  },
  activityDate: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '2px'
  },
  activityMore: {
    fontSize: '12px',
    color: '#9ca3af',
    padding: '8px 0',
    fontStyle: 'italic'
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '10px',
    flexShrink: 0,
    background: '#fafafa'
  },
  footerBtnPrimary: {
    flex: 1,
    padding: '10px 16px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer'
  },
  footerBtnSecondary: {
    flex: 1,
    padding: '10px 16px',
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer'
  }
};
