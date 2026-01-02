// /pages/admin/protocol/[id].js
// Protocol Detail Page - Track injections, sessions, and weight
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ProtocolDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [protocol, setProtocol] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    log_type: 'injection',
    weight: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchProtocol();
      fetchLogs();
    }
  }, [id]);

  const fetchProtocol = async () => {
    try {
      const res = await fetch(`/api/protocols/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProtocol(data);
      }
    } catch (error) {
      console.error('Error fetching protocol:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/protocols/${id}/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleLogSubmit = async () => {
    try {
      const res = await fetch(`/api/protocols/${id}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...logForm,
          patient_id: protocol.patient_id
        })
      });

      if (res.ok) {
        setShowLogModal(false);
        setLogForm({
          log_date: new Date().toISOString().split('T')[0],
          log_type: 'injection',
          weight: '',
          notes: ''
        });
        fetchProtocol(); // Refresh to get updated sessions_used
        fetchLogs();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to log');
      }
    } catch (error) {
      console.error('Error logging:', error);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm('Delete this log entry?')) return;
    
    try {
      const res = await fetch(`/api/protocols/${id}/logs/${logId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchProtocol();
        fetchLogs();
      }
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isWeightLoss = protocol?.program_name?.toLowerCase().includes('weight') ||
                       protocol?.medication?.toLowerCase().includes('semaglutide') ||
                       protocol?.medication?.toLowerCase().includes('tirzepatide') ||
                       protocol?.medication?.toLowerCase().includes('retatrutide');

  const isSessionBased = protocol?.total_sessions && protocol.total_sessions > 0;
  const sessionsUsed = protocol?.sessions_used || 0;
  const sessionsRemaining = isSessionBased ? protocol.total_sessions - sessionsUsed : null;
  
  // Calculate if titration time (4th injection for weight loss)
  const isTitrationTime = isWeightLoss && sessionsUsed === 3;
  const isAtTitration = isWeightLoss && sessionsUsed >= 4;

  // Get injection logs and weigh-in logs separately
  const injectionLogs = logs.filter(l => l.log_type === 'injection' || l.log_type === 'session');
  const weighInLogs = logs.filter(l => l.log_type === 'weigh_in');

  // Calculate weight change if we have weigh-ins
  const latestWeight = weighInLogs[0]?.weight;
  const firstWeight = weighInLogs[weighInLogs.length - 1]?.weight;
  const weightChange = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : null;

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!protocol) {
    return <div style={styles.error}>Protocol not found</div>;
  }

  return (
    <>
      <Head>
        <title>{protocol.medication || protocol.program_name} - Protocol Detail</title>
      </Head>

      <div style={styles.container}>
        {/* Back Link */}
        <Link href={protocol.patient_id ? `/admin/patient/${protocol.patient_id}` : '/admin/pipeline'} style={styles.backLink}>
          ← Back to {protocol.patient_id ? 'Patient' : 'Pipeline'}
        </Link>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{protocol.medication || protocol.program_name}</h1>
            <p style={styles.subtitle}>
              {protocol.patients?.name || protocol.patient_name || 'Unknown Patient'}
              {protocol.selected_dose && ` • ${protocol.selected_dose}`}
              {protocol.frequency && ` • ${protocol.frequency}`}
            </p>
          </div>
          <span style={{
            ...styles.statusBadge,
            background: protocol.status === 'active' ? '#22c55e' : '#9ca3af'
          }}>
            {protocol.status}
          </span>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>
              {isSessionBased ? sessionsUsed : 'N/A'}
            </div>
            <div style={styles.statLabel}>
              {isWeightLoss ? 'Injections Given' : 'Sessions Used'}
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{
              ...styles.statValue,
              color: sessionsRemaining <= 1 ? '#dc2626' : '#000'
            }}>
              {sessionsRemaining !== null ? sessionsRemaining : 'N/A'}
            </div>
            <div style={styles.statLabel}>
              {isWeightLoss ? 'Injections Left' : 'Sessions Left'}
            </div>
          </div>
          {isWeightLoss && (
            <div style={styles.statCard}>
              <div style={{
                ...styles.statValue,
                color: weightChange < 0 ? '#22c55e' : weightChange > 0 ? '#dc2626' : '#000'
              }}>
                {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange} lbs` : '—'}
              </div>
              <div style={styles.statLabel}>Weight Change</div>
            </div>
          )}
          <div style={styles.statCard}>
            <div style={styles.statValue}>{formatDate(protocol.start_date)}</div>
            <div style={styles.statLabel}>Started</div>
          </div>
        </div>

        {/* Titration Alert */}
        {isTitrationTime && (
          <div style={styles.titrationAlert}>
            ⚠️ <strong>Next injection is #4</strong> — Discuss dose titration with patient before administering
          </div>
        )}
        {isAtTitration && (
          <div style={styles.completedAlert}>
            ✓ 4 injections completed at {protocol.selected_dose} — Ready for dose increase or renewal
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.actionBar}>
          <button 
            onClick={() => {
              setLogForm({ ...logForm, log_type: 'injection' });
              setShowLogModal(true);
            }}
            style={styles.primaryButton}
            disabled={sessionsRemaining === 0}
          >
            + Log {isWeightLoss ? 'Injection' : 'Session'}
          </button>
          {isWeightLoss && (
            <button 
              onClick={() => {
                setLogForm({ ...logForm, log_type: 'weigh_in' });
                setShowLogModal(true);
              }}
              style={styles.secondaryButton}
            >
              + Log Weigh-In
            </button>
          )}
        </div>

        {/* Injection/Session History */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            {isWeightLoss ? 'Injection History' : 'Session History'}
          </h2>
          {injectionLogs.length === 0 ? (
            <div style={styles.emptyState}>No {isWeightLoss ? 'injections' : 'sessions'} logged yet</div>
          ) : (
            <div style={styles.logList}>
              {injectionLogs.map((log, index) => (
                <div key={log.id} style={styles.logCard}>
                  <div style={styles.logNumber}>#{injectionLogs.length - index}</div>
                  <div style={styles.logContent}>
                    <div style={styles.logDate}>{formatDate(log.log_date)}</div>
                    {log.notes && <div style={styles.logNotes}>{log.notes}</div>}
                  </div>
                  {(injectionLogs.length - index) === 4 && isWeightLoss && (
                    <span style={styles.titrationBadge}>Titration Point</span>
                  )}
                  <button 
                    onClick={() => handleDeleteLog(log.id)}
                    style={styles.deleteLogBtn}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weight History (for weight loss only) */}
        {isWeightLoss && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Weight History</h2>
            {weighInLogs.length === 0 ? (
              <div style={styles.emptyState}>No weigh-ins logged yet</div>
            ) : (
              <div style={styles.logList}>
                {weighInLogs.map((log) => (
                  <div key={log.id} style={styles.logCard}>
                    <div style={styles.weightValue}>{log.weight} lbs</div>
                    <div style={styles.logContent}>
                      <div style={styles.logDate}>{formatDate(log.log_date)}</div>
                      {log.notes && <div style={styles.logNotes}>{log.notes}</div>}
                    </div>
                    <button 
                      onClick={() => handleDeleteLog(log.id)}
                      style={styles.deleteLogBtn}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Protocol Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Protocol Details</h2>
          <div style={styles.detailsGrid}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Program</span>
              <span style={styles.detailValue}>{protocol.program_name}</span>
            </div>
            {protocol.medication && (
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Medication</span>
                <span style={styles.detailValue}>{protocol.medication}</span>
              </div>
            )}
            {protocol.selected_dose && (
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Dose</span>
                <span style={styles.detailValue}>{protocol.selected_dose}</span>
              </div>
            )}
            {protocol.frequency && (
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Frequency</span>
                <span style={styles.detailValue}>{protocol.frequency}</span>
              </div>
            )}
            {protocol.notes && (
              <div style={{...styles.detailItem, gridColumn: '1 / -1'}}>
                <span style={styles.detailLabel}>Notes</span>
                <span style={styles.detailValue}>{protocol.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Log Modal */}
        {showLogModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  Log {logForm.log_type === 'weigh_in' ? 'Weigh-In' : (isWeightLoss ? 'Injection' : 'Session')}
                </h3>
                <button onClick={() => setShowLogModal(false)} style={styles.closeButton}>×</button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date *</label>
                  <input 
                    type="date"
                    value={logForm.log_date}
                    onChange={e => setLogForm({...logForm, log_date: e.target.value})}
                    style={styles.input}
                  />
                </div>

                {logForm.log_type === 'weigh_in' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Weight (lbs) *</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={logForm.weight}
                      onChange={e => setLogForm({...logForm, weight: e.target.value})}
                      placeholder="Enter weight..."
                      style={styles.input}
                    />
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes</label>
                  <textarea 
                    value={logForm.notes}
                    onChange={e => setLogForm({...logForm, notes: e.target.value})}
                    placeholder="Any notes..."
                    style={styles.textarea}
                    rows={3}
                  />
                </div>

                {/* Show titration warning when logging 4th injection */}
                {logForm.log_type === 'injection' && isWeightLoss && sessionsUsed === 3 && (
                  <div style={styles.titrationWarning}>
                    ⚠️ This will be injection #4 — confirm titration was discussed
                  </div>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button onClick={() => setShowLogModal(false)} style={styles.cancelButton}>Cancel</button>
                <button 
                  onClick={handleLogSubmit}
                  style={styles.submitButton}
                  disabled={logForm.log_type === 'weigh_in' && !logForm.weight}
                >
                  Log {logForm.log_type === 'weigh_in' ? 'Weight' : (isWeightLoss ? 'Injection' : 'Session')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  },
  error: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#dc2626'
  },
  backLink: {
    display: 'inline-block',
    color: '#666',
    textDecoration: 'none',
    marginBottom: '16px',
    fontSize: '14px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: '0 0 4px 0'
  },
  subtitle: {
    color: '#666',
    margin: 0,
    fontSize: '15px'
  },
  statusBadge: {
    padding: '6px 16px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '13px',
    color: '#666'
  },
  titrationAlert: {
    background: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    color: '#92400e',
    fontSize: '14px'
  },
  completedAlert: {
    background: '#dcfce7',
    border: '1px solid #22c55e',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    color: '#166534',
    fontSize: '14px'
  },
  actionBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px'
  },
  primaryButton: {
    background: '#000',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  secondaryButton: {
    background: '#fff',
    color: '#000',
    border: '1px solid #e5e7eb',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  emptyState: {
    padding: '32px',
    textAlign: 'center',
    color: '#9ca3af',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  logCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  logNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px',
    flexShrink: 0
  },
  weightValue: {
    fontSize: '18px',
    fontWeight: '600',
    minWidth: '80px'
  },
  logContent: {
    flex: 1
  },
  logDate: {
    fontWeight: '500',
    marginBottom: '2px'
  },
  logNotes: {
    fontSize: '13px',
    color: '#666'
  },
  titrationBadge: {
    padding: '4px 10px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  deleteLogBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '1px solid #e5e7eb',
    background: '#fff',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  detailLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  detailValue: {
    fontSize: '15px',
    fontWeight: '500'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '450px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e5e7eb'
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#9ca3af'
  },
  modalBody: {
    padding: '20px'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px',
    borderTop: '1px solid #e5e7eb'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  titrationWarning: {
    background: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    padding: '12px',
    color: '#92400e',
    fontSize: '13px'
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    background: '#000',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};
