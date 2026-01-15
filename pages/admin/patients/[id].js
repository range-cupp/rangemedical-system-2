// pages/admin/patients/[id].js
// Patient Profile Page - Single view of all patient data
// Deploy to: pages/admin/patients/[id].js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function PatientProfile() {
  const router = useRouter();
  const { id } = router.query;
  
  const [patient, setPatient] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [injections, setInjections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('protocols');

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // Fetch patient details
      const patientRes = await fetch(`/api/patients/${id}`);
      if (patientRes.ok) {
        const patientData = await patientRes.json();
        setPatient(patientData.patient || patientData);
        setProtocols(patientData.protocols || []);
      }

      // Fetch injection logs for this patient
      const injectionsRes = await fetch(`/api/injection-logs?patient_id=${id}`);
      if (injectionsRes.ok) {
        const injectionsData = await injectionsRes.json();
        setInjections(injectionsData.logs || []);
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate days remaining for a protocol
  const getDaysRemaining = (protocol) => {
    if (!protocol.start_date || !protocol.duration_days) return null;
    const start = new Date(protocol.start_date);
    const end = new Date(start);
    end.setDate(end.getDate() + protocol.duration_days);
    const today = new Date();
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Get protocol type display info
  const getProtocolDisplay = (protocol) => {
    const type = (protocol.program_type || protocol.category || '').toLowerCase();
    if (type.includes('weight') || type.includes('wl') || type.includes('glp')) {
      return { icon: '💉', label: 'Weight Loss', color: '#f59e0b' };
    }
    if (type.includes('hrt') || type.includes('testosterone') || type.includes('hormone')) {
      return { icon: '💊', label: 'HRT', color: '#8b5cf6' };
    }
    if (type.includes('peptide') || type.includes('bpc') || type.includes('recovery')) {
      return { icon: '🧬', label: 'Peptide', color: '#10b981' };
    }
    if (type.includes('iv')) {
      return { icon: '💧', label: 'IV Therapy', color: '#06b6d4' };
    }
    if (type.includes('hbot') || type.includes('hyperbaric')) {
      return { icon: '🫁', label: 'HBOT', color: '#6366f1' };
    }
    if (type.includes('red') || type.includes('light') || type.includes('rlt')) {
      return { icon: '🔴', label: 'Red Light', color: '#ef4444' };
    }
    if (type.includes('vitamin') || type.includes('b12') || type.includes('injection')) {
      return { icon: '💉', label: 'Injection', color: '#64748b' };
    }
    return { icon: '📋', label: 'Protocol', color: '#64748b' };
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate labs due date (8 weeks from HRT start)
  const getLabsDueDate = (protocol) => {
    if (!protocol.start_date) return null;
    const type = (protocol.program_type || '').toLowerCase();
    if (!type.includes('hrt') && !type.includes('testosterone')) return null;
    
    const start = new Date(protocol.start_date);
    const labsDue = new Date(start);
    labsDue.setDate(labsDue.getDate() + 56); // 8 weeks
    return labsDue;
  };

  // Check if labs are due soon (within 2 weeks)
  const isLabsDueSoon = (protocol) => {
    const labsDue = getLabsDueDate(protocol);
    if (!labsDue) return false;
    const today = new Date();
    const diff = Math.ceil((labsDue - today) / (1000 * 60 * 60 * 24));
    return diff <= 14 && diff >= 0;
  };

  // Check if labs are overdue
  const isLabsOverdue = (protocol) => {
    const labsDue = getLabsDueDate(protocol);
    if (!labsDue) return false;
    const today = new Date();
    return labsDue < today;
  };

  const activeProtocols = protocols.filter(p => p.status === 'active');
  const completedProtocols = protocols.filter(p => p.status === 'completed');

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '24px'
    },
    header: {
      maxWidth: '1200px',
      margin: '0 auto 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: '16px'
    },
    backLink: {
      color: '#64748b',
      textDecoration: 'none',
      fontSize: '14px',
      marginBottom: '8px',
      display: 'inline-block'
    },
    patientName: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#0f172a',
      margin: '0 0 4px 0'
    },
    patientMeta: {
      color: '#64748b',
      fontSize: '14px'
    },
    headerActions: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    actionButton: {
      padding: '10px 16px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      backgroundColor: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.15s ease'
    },
    primaryButton: {
      padding: '10px 16px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#0f172a',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
      backgroundColor: '#fff',
      padding: '4px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      width: 'fit-content'
    },
    tab: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#64748b',
      transition: 'all 0.15s ease'
    },
    tabActive: {
      backgroundColor: '#0f172a',
      color: '#fff'
    },
    section: {
      marginBottom: '32px'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '16px'
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '20px',
      transition: 'all 0.15s ease'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px'
    },
    typeBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600'
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase'
    },
    medication: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '4px'
    },
    dose: {
      fontSize: '14px',
      color: '#64748b',
      marginBottom: '12px'
    },
    progressContainer: {
      marginBottom: '12px'
    },
    progressBar: {
      height: '6px',
      backgroundColor: '#e2e8f0',
      borderRadius: '3px',
      overflow: 'hidden',
      marginBottom: '6px'
    },
    progressFill: {
      height: '100%',
      borderRadius: '3px',
      transition: 'width 0.3s ease'
    },
    progressText: {
      fontSize: '12px',
      color: '#64748b'
    },
    cardFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '12px',
      borderTop: '1px solid #f1f5f9'
    },
    labsAlert: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      marginTop: '12px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #e2e8f0'
    },
    th: {
      textAlign: 'left',
      padding: '12px 16px',
      backgroundColor: '#f8fafc',
      fontSize: '12px',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      borderBottom: '1px solid #e2e8f0'
    },
    td: {
      padding: '12px 16px',
      fontSize: '14px',
      color: '#0f172a',
      borderBottom: '1px solid #f1f5f9'
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
      color: '#64748b',
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      fontSize: '16px',
      color: '#64748b'
    },
    summaryCards: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px',
      marginBottom: '24px'
    },
    summaryCard: {
      backgroundColor: '#fff',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      padding: '16px',
      textAlign: 'center'
    },
    summaryNumber: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#0f172a'
    },
    summaryLabel: {
      fontSize: '12px',
      color: '#64748b',
      marginTop: '4px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading patient data...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div>Patient not found</div>
          <Link href="/admin/pipeline" style={{ color: '#0f172a', marginTop: '16px', display: 'inline-block' }}>
            ← Back to Pipeline
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{patient.name || 'Patient'} - Range Medical</title>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <Link href="/admin/pipeline" style={styles.backLink}>← Back to Pipeline</Link>
            <h1 style={styles.patientName}>{patient.name}</h1>
            <div style={styles.patientMeta}>
              {patient.email && <span>{patient.email}</span>}
              {patient.email && patient.phone && <span> • </span>}
              {patient.phone && <span>{patient.phone}</span>}
            </div>
          </div>
          <div style={styles.headerActions}>
            <Link 
              href={`/admin/injection-logs?patient_id=${id}`}
              style={styles.primaryButton}
            >
              + Log Injection
            </Link>
            {patient.ghl_contact_id && (
              <a
                href={`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${patient.ghl_contact_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.actionButton}
              >
                Open in GHL ↗
              </a>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Summary Cards */}
          <div style={styles.summaryCards}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryNumber}>{activeProtocols.length}</div>
              <div style={styles.summaryLabel}>Active Protocols</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryNumber}>{completedProtocols.length}</div>
              <div style={styles.summaryLabel}>Completed</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryNumber}>{injections.length}</div>
              <div style={styles.summaryLabel}>Injections Logged</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={{
                ...styles.summaryNumber,
                color: activeProtocols.some(p => isLabsOverdue(p)) ? '#ef4444' :
                       activeProtocols.some(p => isLabsDueSoon(p)) ? '#f59e0b' : '#10b981'
              }}>
                {activeProtocols.some(p => isLabsOverdue(p)) ? '⚠️' :
                 activeProtocols.some(p => isLabsDueSoon(p)) ? '🔔' : '✓'}
              </div>
              <div style={styles.summaryLabel}>Labs Status</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              onClick={() => setActiveTab('protocols')}
              style={{
                ...styles.tab,
                ...(activeTab === 'protocols' ? styles.tabActive : {})
              }}
            >
              Protocols ({protocols.length})
            </button>
            <button
              onClick={() => setActiveTab('injections')}
              style={{
                ...styles.tab,
                ...(activeTab === 'injections' ? styles.tabActive : {})
              }}
            >
              Injection History ({injections.length})
            </button>
          </div>

          {/* Protocols Tab */}
          {activeTab === 'protocols' && (
            <>
              {/* Active Protocols */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <span style={{ color: '#10b981' }}>●</span> Active Protocols
                </div>
                {activeProtocols.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div>No active protocols</div>
                  </div>
                ) : (
                  <div style={styles.grid}>
                    {activeProtocols.map(protocol => {
                      const display = getProtocolDisplay(protocol);
                      const daysRemaining = getDaysRemaining(protocol);
                      const totalDays = protocol.duration_days || 30;
                      const daysUsed = totalDays - (daysRemaining || 0);
                      const progressPercent = Math.min(100, Math.max(0, (daysUsed / totalDays) * 100));
                      const labsDue = getLabsDueDate(protocol);
                      const labsOverdue = isLabsOverdue(protocol);
                      const labsDueSoon = isLabsDueSoon(protocol);

                      return (
                        <div key={protocol.id} style={styles.card}>
                          <div style={styles.cardHeader}>
                            <span style={{
                              ...styles.typeBadge,
                              backgroundColor: `${display.color}15`,
                              color: display.color
                            }}>
                              {display.icon} {display.label}
                            </span>
                            <span style={{
                              ...styles.statusBadge,
                              backgroundColor: '#dcfce7',
                              color: '#166534'
                            }}>
                              Active
                            </span>
                          </div>
                          
                          <div style={styles.medication}>
                            {protocol.medication || protocol.program_name || 'Protocol'}
                          </div>
                          <div style={styles.dose}>
                            {protocol.selected_dose || protocol.dose || '-'}
                            {protocol.delivery_method && ` • ${protocol.delivery_method}`}
                          </div>

                          <div style={styles.progressContainer}>
                            <div style={styles.progressBar}>
                              <div style={{
                                ...styles.progressFill,
                                width: `${progressPercent}%`,
                                backgroundColor: display.color
                              }} />
                            </div>
                            <div style={styles.progressText}>
                              {daysRemaining !== null ? (
                                daysRemaining > 0 
                                  ? `${daysRemaining} days remaining`
                                  : 'Protocol ended'
                              ) : (
                                protocol.sessions_remaining !== undefined
                                  ? `${protocol.sessions_remaining} sessions remaining`
                                  : 'Ongoing'
                              )}
                            </div>
                          </div>

                          {labsDue && (
                            <div style={{
                              ...styles.labsAlert,
                              backgroundColor: labsOverdue ? '#fef2f2' : labsDueSoon ? '#fffbeb' : '#f0fdf4',
                              color: labsOverdue ? '#dc2626' : labsDueSoon ? '#d97706' : '#16a34a'
                            }}>
                              {labsOverdue ? '⚠️' : labsDueSoon ? '🔔' : '✓'}
                              Labs {labsOverdue ? 'overdue' : labsDueSoon ? 'due soon' : 'due'}: {formatDate(labsDue)}
                            </div>
                          )}

                          <div style={styles.cardFooter}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Started {formatDate(protocol.start_date)}
                            </span>
                            <Link
                              href={`/admin/protocol/${protocol.id}`}
                              style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500' }}
                            >
                              View Details →
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Completed Protocols */}
              {completedProtocols.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>
                    <span style={{ color: '#64748b' }}>●</span> Completed Protocols
                  </div>
                  <div style={styles.grid}>
                    {completedProtocols.map(protocol => {
                      const display = getProtocolDisplay(protocol);
                      return (
                        <div key={protocol.id} style={{ ...styles.card, opacity: 0.7 }}>
                          <div style={styles.cardHeader}>
                            <span style={{
                              ...styles.typeBadge,
                              backgroundColor: '#f1f5f9',
                              color: '#64748b'
                            }}>
                              {display.icon} {display.label}
                            </span>
                            <span style={{
                              ...styles.statusBadge,
                              backgroundColor: '#f1f5f9',
                              color: '#64748b'
                            }}>
                              Completed
                            </span>
                          </div>
                          <div style={styles.medication}>
                            {protocol.medication || protocol.program_name || 'Protocol'}
                          </div>
                          <div style={styles.dose}>
                            {protocol.selected_dose || protocol.dose || '-'}
                          </div>
                          <div style={styles.cardFooter}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              {formatDate(protocol.start_date)} - {formatDate(protocol.end_date)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Injections Tab */}
          {activeTab === 'injections' && (
            <div style={styles.section}>
              {injections.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💉</div>
                  <div>No injections logged yet</div>
                  <Link
                    href={`/admin/injection-logs?patient_id=${id}`}
                    style={{ color: '#0f172a', marginTop: '16px', display: 'inline-block' }}
                  >
                    + Log First Injection
                  </Link>
                </div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Medication</th>
                      <th style={styles.th}>Dose</th>
                      <th style={styles.th}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {injections.map(inj => (
                      <tr key={inj.id}>
                        <td style={styles.td}>{formatDate(inj.logged_at || inj.created_at)}</td>
                        <td style={styles.td}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: 
                              inj.category === 'testosterone' ? '#ede9fe' :
                              inj.category === 'weight_loss' ? '#fef3c7' :
                              '#f1f5f9',
                            color:
                              inj.category === 'testosterone' ? '#5b21b6' :
                              inj.category === 'weight_loss' ? '#92400e' :
                              '#475569'
                          }}>
                            {inj.log_type === 'pickup' ? '📦 Pickup' : '💉 Injection'}
                          </span>
                        </td>
                        <td style={styles.td}>{inj.medication || '-'}</td>
                        <td style={styles.td}>{inj.dose || '-'}</td>
                        <td style={{ ...styles.td, color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {inj.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
