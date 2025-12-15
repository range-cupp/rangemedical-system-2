// =====================================================
// RANGE MEDICAL - PROTOCOL DETAIL PAGE
// /pages/admin/protocol/[id].js
// Full protocol view with injection tracking
// =====================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ProtocolDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [protocol, setProtocol] = useState(null);
  const [patient, setPatient] = useState(null);
  const [injections, setInjections] = useState([]);
  const [error, setError] = useState(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    injection_date: new Date().toISOString().split('T')[0],
    injection_site: 'abdomen',
    location: 'in_clinic',
    dose: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchProtocol(id);
    }
  }, [id]);

  const fetchProtocol = async (protocolId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/protocol/${protocolId}`);
      const result = await response.json();
      
      if (result.success) {
        setProtocol(result.data.protocol);
        setPatient(result.data.patient);
        setInjections(result.data.injections || []);
      } else {
        setError(result.error || 'Protocol not found');
      }
    } catch (err) {
      setError('Failed to load protocol');
    } finally {
      setLoading(false);
    }
  };

  const handleLogInjection = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/log-injection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          injection_type: `peptide_${protocol.id}`,
          ...formData
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowLogForm(false);
        setFormData({
          ...formData,
          injection_date: new Date().toISOString().split('T')[0],
          notes: '',
          dose: ''
        });
        fetchProtocol(id);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (err) {
      alert('Error logging injection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`Are you sure you want to mark this protocol as ${newStatus}?`)) return;
    
    try {
      const response = await fetch(`/api/admin/protocol/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      if (result.success) {
        fetchProtocol(id);
      } else {
        alert('Error updating status');
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading protocol...</p>
        </div>
      </PageWrapper>
    );
  }

  if (error || !protocol) {
    return (
      <PageWrapper>
        <div style={styles.errorState}>
          <h2>Protocol Not Found</h2>
          <p>{error}</p>
          <button onClick={() => router.back()} style={styles.backBtn}>
            ← Go Back
          </button>
        </div>
      </PageWrapper>
    );
  }

  const isActive = protocol.status === 'active';
  const today = new Date();
  const endDate = protocol.end_date ? new Date(protocol.end_date) : null;
  const startDate = protocol.start_date ? new Date(protocol.start_date) : null;
  const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;
  const totalDays = protocol.duration_days || 30;
  const daysElapsed = startDate ? Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) : 0;
  const progressPercent = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

  return (
    <PageWrapper>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => router.back()} style={styles.backLink}>
            ← Back to Patient
          </button>
          <h1 style={styles.protocolTitle}>{protocol.program_name}</h1>
          <div style={styles.patientLink}>
            Patient: <a href={`/admin/patient/${patient?.ghl_contact_id || patient?.id}`} style={styles.patientLinkText}>
              {patient?.full_name || patient?.name}
            </a>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={{
            ...styles.statusBadge,
            backgroundColor: isActive ? '#dcfce7' : protocol.status === 'completed' ? '#f3f4f6' : '#fee2e2',
            color: isActive ? '#166534' : protocol.status === 'completed' ? '#666' : '#991b1b'
          }}>
            {protocol.status}
          </span>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.contentGrid}>
          {/* Left Column - Protocol Info */}
          <div style={styles.leftColumn}>
            {/* Progress Card */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Protocol Progress</h3>
              <div style={styles.progressSection}>
                <div style={styles.progressBar}>
                  <div style={{...styles.progressFill, width: `${progressPercent}%`}} />
                </div>
                <div style={styles.progressLabels}>
                  <span>Day {Math.max(0, daysElapsed)} of {totalDays}</span>
                  {daysLeft !== null && daysLeft > 0 && <span>{daysLeft} days remaining</span>}
                  {daysLeft !== null && daysLeft <= 0 && <span style={{color: '#ef4444'}}>Protocol ended</span>}
                </div>
              </div>
              
              <div style={styles.statsGrid}>
                <div style={styles.statBox}>
                  <div style={styles.statNumber}>{protocol.injections_completed || 0}</div>
                  <div style={styles.statLabel}>Injections Logged</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statNumber}>{totalDays}</div>
                  <div style={styles.statLabel}>Total Days</div>
                </div>
              </div>
            </div>

            {/* Protocol Details Card */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Protocol Details</h3>
              
              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>Program</div>
                <div style={styles.detailValue}>{protocol.program_name}</div>
              </div>

              {protocol.program_type && (
                <div style={styles.detailSection}>
                  <div style={styles.detailLabel}>Type</div>
                  <div style={styles.detailValue}>{protocol.program_type}</div>
                </div>
              )}

              {(protocol.primary_peptide || protocol.secondary_peptide) && (
                <div style={styles.detailSection}>
                  <div style={styles.detailLabel}>Peptides</div>
                  <div style={styles.detailValue}>
                    {protocol.primary_peptide}
                    {protocol.secondary_peptide && ` + ${protocol.secondary_peptide}`}
                  </div>
                </div>
              )}

              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>Dose</div>
                <div style={styles.detailValue}>{protocol.dose_amount || '-'}</div>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>Frequency</div>
                <div style={styles.detailValue}>{protocol.dose_frequency || '-'}</div>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>Start Date</div>
                <div style={styles.detailValue}>{formatDate(protocol.start_date)}</div>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>End Date</div>
                <div style={styles.detailValue}>{formatDate(protocol.end_date)}</div>
              </div>

              {protocol.goal && (
                <div style={styles.detailSection}>
                  <div style={styles.detailLabel}>Goal</div>
                  <div style={styles.detailValue}>{protocol.goal}</div>
                </div>
              )}

              {protocol.special_instructions && (
                <div style={styles.detailSection}>
                  <div style={styles.detailLabel}>Instructions</div>
                  <div style={styles.instructionsBox}>{protocol.special_instructions}</div>
                </div>
              )}
            </div>

            {/* Actions Card */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Actions</h3>
              <div style={styles.actionsGrid}>
                {isActive && (
                  <button onClick={() => handleStatusChange('completed')} style={styles.completeBtn}>
                    Mark as Completed
                  </button>
                )}
                {protocol.status === 'completed' && (
                  <button onClick={() => handleStatusChange('active')} style={styles.reactivateBtn}>
                    Reactivate Protocol
                  </button>
                )}
                {isActive && (
                  <button onClick={() => handleStatusChange('cancelled')} style={styles.cancelBtn}>
                    Cancel Protocol
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Injection Log */}
          <div style={styles.rightColumn}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Injection Log</h3>
                {isActive && (
                  <button onClick={() => setShowLogForm(!showLogForm)} style={styles.logBtn}>
                    {showLogForm ? 'Cancel' : '+ Log Injection'}
                  </button>
                )}
              </div>

              {/* Log Form */}
              {showLogForm && (
                <form onSubmit={handleLogInjection} style={styles.logForm}>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Date</label>
                      <input
                        type="date"
                        value={formData.injection_date}
                        onChange={e => setFormData({...formData, injection_date: e.target.value})}
                        style={styles.input}
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Location</label>
                      <select
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        style={styles.select}
                      >
                        <option value="in_clinic">In Clinic</option>
                        <option value="take_home">Take Home</option>
                      </select>
                    </div>
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Injection Site</label>
                      <select
                        value={formData.injection_site}
                        onChange={e => setFormData({...formData, injection_site: e.target.value})}
                        style={styles.select}
                      >
                        <option value="abdomen">Abdomen</option>
                        <option value="thigh">Thigh</option>
                        <option value="glute">Glute</option>
                        <option value="deltoid">Deltoid</option>
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Dose (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., 0.5ml"
                        value={formData.dose}
                        onChange={e => setFormData({...formData, dose: e.target.value})}
                        style={styles.input}
                      />
                    </div>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Notes (optional)</label>
                    <input
                      type="text"
                      placeholder="Any notes..."
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                  <button type="submit" style={styles.submitBtn} disabled={submitting}>
                    {submitting ? 'Saving...' : 'Log Injection'}
                  </button>
                </form>
              )}

              {/* Injection History */}
              {injections.length > 0 ? (
                <div style={styles.injectionList}>
                  {injections.map((log, i) => (
                    <div key={i} style={styles.injectionItem}>
                      <div style={styles.injectionDate}>
                        {formatDate(log.injection_date)}
                      </div>
                      <div style={styles.injectionDetails}>
                        <span style={styles.injectionSite}>{log.injection_site}</span>
                        <span style={{
                          ...styles.locationBadge,
                          backgroundColor: log.location === 'in_clinic' ? '#dcfce7' : '#e0e7ff',
                          color: log.location === 'in_clinic' ? '#166534' : '#4338ca'
                        }}>
                          {log.location === 'in_clinic' ? 'In Clinic' : 'Take Home'}
                        </span>
                        {log.dose && <span style={styles.injectionDose}>{log.dose}</span>}
                      </div>
                      {log.notes && <div style={styles.injectionNotes}>{log.notes}</div>}
                      <div style={styles.injectionMeta}>
                        Logged by {log.logged_by || 'unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyInjections}>
                  <p>No injections logged yet</p>
                  {isActive && <p style={styles.emptyHint}>Click "Log Injection" to record the first one</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </PageWrapper>
  );
}

// =====================================================
// PAGE WRAPPER
// =====================================================
function PageWrapper({ children }) {
  return (
    <>
      <Head>
        <title>Protocol Detail | Range Medical</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={styles.page}>
        {children}
      </div>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        body { margin: 0; padding: 0; }
      `}</style>
    </>
  );
}

// =====================================================
// UTILITIES
// =====================================================
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// =====================================================
// STYLES
// =====================================================
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fafafa',
    fontFamily: 'Inter, -apple-system, sans-serif'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: '#666'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e5e5',
    borderTopColor: '#000',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  errorState: {
    textAlign: 'center',
    padding: '64px',
    color: '#666'
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '16px'
  },
  
  // Header
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e5e5',
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerLeft: {},
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '8px',
    display: 'block'
  },
  protocolTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
    color: '#000'
  },
  patientLink: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px'
  },
  patientLinkText: {
    color: '#000',
    fontWeight: '500',
    textDecoration: 'none'
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  
  // Main Content
  main: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  rightColumn: {},
  
  // Cards
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '24px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 20px 0',
    color: '#000'
  },
  
  // Progress Section
  progressSection: {
    marginBottom: '24px'
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#666'
  },
  
  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  statBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#000'
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px'
  },
  
  // Detail Sections
  detailSection: {
    marginBottom: '16px'
  },
  detailLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
    marginBottom: '4px',
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: '14px',
    color: '#000'
  },
  instructionsBox: {
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#f9f9f9',
    padding: '12px',
    borderRadius: '6px'
  },
  
  // Actions
  actionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  completeBtn: {
    padding: '10px 16px',
    backgroundColor: '#166534',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  reactivateBtn: {
    padding: '10px 16px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  cancelBtn: {
    padding: '10px 16px',
    backgroundColor: '#fff',
    color: '#991b1b',
    border: '1px solid #fee2e2',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  
  // Log Button
  logBtn: {
    padding: '8px 16px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  
  // Log Form
  logForm: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '12px'
  },
  formGroup: {
    marginBottom: '12px'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff'
  },
  submitBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  
  // Injection List
  injectionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  injectionItem: {
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
  },
  injectionDate: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '6px'
  },
  injectionDetails: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  injectionSite: {
    fontSize: '13px',
    color: '#374151',
    textTransform: 'capitalize'
  },
  locationBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600'
  },
  injectionDose: {
    fontSize: '13px',
    color: '#666'
  },
  injectionNotes: {
    fontSize: '13px',
    color: '#666',
    marginTop: '6px',
    fontStyle: 'italic'
  },
  injectionMeta: {
    fontSize: '11px',
    color: '#999',
    marginTop: '6px'
  },
  
  // Empty State
  emptyInjections: {
    textAlign: 'center',
    padding: '32px',
    color: '#666'
  },
  emptyHint: {
    fontSize: '13px',
    color: '#999',
    marginTop: '8px'
  }
};
