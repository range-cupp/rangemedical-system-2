// pages/admin/pipeline.js
// Unified Protocol Pipeline with Correct Tracking per Protocol Type
// Deploy to: pages/admin/pipeline.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Protocol type display configuration
const getProtocolDisplay = (protocol) => {
  const type = (protocol.program_type || protocol.category || '').toLowerCase();
  if (type.includes('weight') || type.includes('wl') || type.includes('glp')) {
    return { icon: '💉', label: 'WL', fullLabel: 'Weight Loss', color: '#f59e0b' };
  }
  if (type.includes('hrt') || type.includes('testosterone') || type.includes('hormone')) {
    return { icon: '💊', label: 'HRT', fullLabel: 'HRT', color: '#8b5cf6' };
  }
  if (type.includes('peptide') || type.includes('bpc') || type.includes('recovery')) {
    return { icon: '🧬', label: 'PEP', fullLabel: 'Peptide', color: '#10b981' };
  }
  if (type.includes('iv')) {
    return { icon: '💧', label: 'IV', fullLabel: 'IV Therapy', color: '#06b6d4' };
  }
  if (type.includes('hbot') || type.includes('hyperbaric')) {
    return { icon: '🫁', label: 'HBOT', fullLabel: 'HBOT', color: '#6366f1' };
  }
  if (type.includes('red') || type.includes('light') || type.includes('rlt')) {
    return { icon: '🔴', label: 'RLT', fullLabel: 'Red Light', color: '#ef4444' };
  }
  if (type.includes('vitamin') || type.includes('b12') || type.includes('injection')) {
    return { icon: '💉', label: 'INJ', fullLabel: 'Injection', color: '#64748b' };
  }
  return { icon: '📋', label: 'OTHER', fullLabel: 'Protocol', color: '#64748b' };
};

// Get urgency indicator based on days or sessions remaining
const getUrgency = (protocol) => {
  const daysLeft = protocol.days_remaining;
  const sessionsLeft = protocol.sessions_remaining;
  
  // For session-based protocols
  if (protocol.tracking_type === 'session_based' && sessionsLeft !== undefined) {
    if (sessionsLeft <= 0) return { bg: '#dcfce7', text: '#166534', label: 'Complete' };
    if (sessionsLeft <= 1) return { bg: '#fef2f2', text: '#dc2626', label: `${sessionsLeft} left!` };
    if (sessionsLeft <= 2) return { bg: '#fffbeb', text: '#d97706', label: `${sessionsLeft} left` };
    return null;
  }
  
  // For day-based protocols
  if (daysLeft === null || daysLeft === undefined) return null;
  if (daysLeft <= 0) return { bg: '#fef2f2', text: '#dc2626', label: 'Ended/Overdue' };
  if (daysLeft <= 3) return { bg: '#fef2f2', text: '#dc2626', label: `${daysLeft}d left!` };
  if (daysLeft <= 7) return { bg: '#fffbeb', text: '#d97706', label: `${daysLeft}d left` };
  if (daysLeft <= 14) return { bg: '#fefce8', text: '#ca8a04', label: `${daysLeft}d left` };
  return null;
};

// Get progress percentage
const getProgress = (protocol) => {
  if (protocol.tracking_type === 'session_based') {
    const total = protocol.total_sessions || 1;
    const used = protocol.sessions_used || 0;
    return Math.min(100, Math.max(0, (used / total) * 100));
  }
  
  const totalDays = protocol.total_days || 30;
  const daysLeft = protocol.days_remaining || 0;
  const daysUsed = totalDays - daysLeft;
  return Math.min(100, Math.max(0, (daysUsed / totalDays) * 100));
};

// Format delivery method for display
const formatDeliveryMethod = (method) => {
  if (!method) return '';
  const m = method.toLowerCase();
  if (m.includes('take') || m.includes('home')) return 'Take Home';
  if (m.includes('clinic')) return 'In Clinic';
  return method;
};

export default function Pipeline() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState('active');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('expiration');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [needsProtocol, setNeedsProtocol] = useState([]);
  const [activeProtocols, setActiveProtocols] = useState([]);
  const [completedProtocols, setCompletedProtocols] = useState([]);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pipeline');
      if (res.ok) {
        const data = await res.json();
        setNeedsProtocol(data.needsProtocol || []);
        setActiveProtocols(data.activeProtocols || []);
        setCompletedProtocols(data.completedProtocols || []);
      }
      
      // Also fetch patients for the patients tab
      const patientsRes = await fetch('/api/patients');
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData.patients || patientsData || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sort protocols
  const sortProtocols = (protocols) => {
    return [...protocols].sort((a, b) => {
      switch (sortBy) {
        case 'expiration':
          const aDays = a.days_remaining ?? a.sessions_remaining ?? 9999;
          const bDays = b.days_remaining ?? b.sessions_remaining ?? 9999;
          return aDays - bDays;
        case 'name':
          return (a.patient_name || '').localeCompare(b.patient_name || '');
        case 'type':
          return (a.program_type || '').localeCompare(b.program_type || '');
        case 'date':
          return new Date(b.start_date || 0) - new Date(a.start_date || 0);
        default:
          return 0;
      }
    });
  };

  // Filter by type
  const filterByType = (protocols) => {
    if (typeFilter === 'all') return protocols;
    return protocols.filter(p => {
      const type = (p.program_type || p.category || '').toLowerCase();
      switch (typeFilter) {
        case 'wl': return type.includes('weight') || type.includes('wl') || type.includes('glp');
        case 'hrt': return type.includes('hrt') || type.includes('testosterone') || type.includes('hormone');
        case 'peptide': return type.includes('peptide') || type.includes('bpc') || type.includes('recovery');
        case 'iv': return type.includes('iv');
        case 'hbot': return type.includes('hbot') || type.includes('hyperbaric');
        case 'rlt': return type.includes('red') || type.includes('light') || type.includes('rlt');
        default: return true;
      }
    });
  };

  // Search filter
  const searchFilter = (items) => {
    if (!search) return items;
    const searchLower = search.toLowerCase();
    return items.filter(item => {
      const name = (item.patient_name || item.name || '').toLowerCase();
      const medication = (item.medication || item.program_name || item.item_name || '').toLowerCase();
      return name.includes(searchLower) || medication.includes(searchLower);
    });
  };

  // Get filtered and sorted protocols
  const getFilteredActive = () => searchFilter(filterByType(sortProtocols(activeProtocols)));
  const getFilteredCompleted = () => searchFilter(filterByType(completedProtocols));
  const getFilteredNeedsProtocol = () => searchFilter(needsProtocol);
  const getFilteredPatients = () => searchFilter(patients);

  // Count by type
  const countByType = (type) => {
    return activeProtocols.filter(p => {
      const pType = (p.program_type || p.category || '').toLowerCase();
      switch (type) {
        case 'wl': return pType.includes('weight') || pType.includes('wl') || pType.includes('glp');
        case 'hrt': return pType.includes('hrt') || pType.includes('testosterone') || pType.includes('hormone');
        case 'peptide': return pType.includes('peptide') || pType.includes('bpc') || pType.includes('recovery');
        case 'iv': return pType.includes('iv');
        case 'hbot': return pType.includes('hbot') || pType.includes('hyperbaric');
        case 'rlt': return pType.includes('red') || pType.includes('light') || pType.includes('rlt');
        default: return true;
      }
    }).length;
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '24px'
    },
    header: {
      maxWidth: '1400px',
      margin: '0 auto 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#0f172a',
      margin: 0
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    },
    select: {
      padding: '10px 14px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      backgroundColor: '#fff',
      fontSize: '14px',
      cursor: 'pointer'
    },
    searchInput: {
      padding: '10px 14px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      width: '200px'
    },
    content: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    mainTabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '16px',
      backgroundColor: '#fff',
      padding: '4px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      width: 'fit-content'
    },
    mainTab: {
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
    mainTabActive: {
      backgroundColor: '#0f172a',
      color: '#fff'
    },
    typeTabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      flexWrap: 'wrap'
    },
    typeTab: {
      padding: '8px 14px',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      backgroundColor: '#fff',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      color: '#64748b',
      transition: 'all 0.15s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    typeTabActive: {
      backgroundColor: '#0f172a',
      color: '#fff',
      borderColor: '#0f172a'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '16px'
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '16px',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '8px'
    },
    typeBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      borderRadius: '8px',
      fontSize: '16px'
    },
    patientName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '4px',
      textDecoration: 'none',
      cursor: 'pointer',
      display: 'block'
    },
    medication: {
      fontSize: '14px',
      color: '#64748b',
      marginBottom: '12px'
    },
    trackingInfo: {
      fontSize: '12px',
      color: '#64748b',
      marginBottom: '8px',
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    trackingBadge: {
      padding: '2px 8px',
      backgroundColor: '#f1f5f9',
      borderRadius: '4px',
      fontSize: '11px'
    },
    progressBar: {
      height: '4px',
      backgroundColor: '#e2e8f0',
      borderRadius: '2px',
      overflow: 'hidden',
      marginBottom: '8px'
    },
    progressFill: {
      height: '100%',
      borderRadius: '2px',
      transition: 'width 0.3s ease'
    },
    cardFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      color: '#64748b'
    },
    urgencyBadge: {
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600'
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
      minHeight: '300px',
      color: '#64748b'
    },
    quickAction: {
      padding: '6px 10px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: '#f1f5f9',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      color: '#475569',
      transition: 'all 0.15s ease'
    },
    statusText: {
      fontWeight: '500',
      color: '#0f172a'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading pipeline...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Protocol Pipeline - Range Medical</title>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Protocol Pipeline</h1>
          <div style={styles.headerRight}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.select}
            >
              <option value="expiration">Sort: Expiring Soon</option>
              <option value="name">Sort: Patient Name</option>
              <option value="type">Sort: Protocol Type</option>
              <option value="date">Sort: Start Date</option>
            </select>
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <Link href="/admin/injection-logs" style={{
              ...styles.select,
              textDecoration: 'none',
              color: '#0f172a',
              fontWeight: '500'
            }}>
              Injection Logs →
            </Link>
          </div>
        </div>

        <div style={styles.content}>
          {/* Main Tabs */}
          <div style={styles.mainTabs}>
            <button
              onClick={() => setMainTab('needs')}
              style={{
                ...styles.mainTab,
                ...(mainTab === 'needs' ? styles.mainTabActive : {})
              }}
            >
              Needs Protocol ({needsProtocol.length})
            </button>
            <button
              onClick={() => setMainTab('active')}
              style={{
                ...styles.mainTab,
                ...(mainTab === 'active' ? styles.mainTabActive : {})
              }}
            >
              Active ({activeProtocols.length})
            </button>
            <button
              onClick={() => setMainTab('completed')}
              style={{
                ...styles.mainTab,
                ...(mainTab === 'completed' ? styles.mainTabActive : {})
              }}
            >
              Completed ({completedProtocols.length})
            </button>
            <button
              onClick={() => setMainTab('patients')}
              style={{
                ...styles.mainTab,
                ...(mainTab === 'patients' ? styles.mainTabActive : {})
              }}
            >
              Patients ({patients.length})
            </button>
          </div>

          {/* Type Filter Tabs (only show for active) */}
          {mainTab === 'active' && (
            <div style={styles.typeTabs}>
              <button
                onClick={() => setTypeFilter('all')}
                style={{
                  ...styles.typeTab,
                  ...(typeFilter === 'all' ? styles.typeTabActive : {})
                }}
              >
                All ({activeProtocols.length})
              </button>
              <button
                onClick={() => setTypeFilter('wl')}
                style={{
                  ...styles.typeTab,
                  ...(typeFilter === 'wl' ? styles.typeTabActive : {})
                }}
              >
                💉 WL ({countByType('wl')})
              </button>
              <button
                onClick={() => setTypeFilter('hrt')}
                style={{
                  ...styles.typeTab,
                  ...(typeFilter === 'hrt' ? styles.typeTabActive : {})
                }}
              >
                💊 HRT ({countByType('hrt')})
              </button>
              <button
                onClick={() => setTypeFilter('peptide')}
                style={{
                  ...styles.typeTab,
                  ...(typeFilter === 'peptide' ? styles.typeTabActive : {})
                }}
              >
                🧬 Peptide ({countByType('peptide')})
              </button>
              <button
                onClick={() => setTypeFilter('iv')}
                style={{
                  ...styles.typeTab,
                  ...(typeFilter === 'iv' ? styles.typeTabActive : {})
                }}
              >
                💧 IV ({countByType('iv')})
              </button>
              <button
                onClick={() => setTypeFilter('hbot')}
                style={{
                  ...styles.typeTab,
                  ...(typeFilter === 'hbot' ? styles.typeTabActive : {})
                }}
              >
                🫁 HBOT ({countByType('hbot')})
              </button>
              <button
                onClick={() => setTypeFilter('rlt')}
                style={{
                  ...styles.typeTab,
                  ...(typeFilter === 'rlt' ? styles.typeTabActive : {})
                }}
              >
                🔴 RLT ({countByType('rlt')})
              </button>
            </div>
          )}

          {/* Needs Protocol Tab */}
          {mainTab === 'needs' && (
            <div style={styles.grid}>
              {getFilteredNeedsProtocol().length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                  <div>All purchases have protocols assigned</div>
                </div>
              ) : (
                getFilteredNeedsProtocol().map(purchase => (
                  <div
                    key={purchase.id}
                    style={styles.card}
                    onClick={() => router.push(`/admin/patient/${purchase.patient_id}`)}
                  >
                    <div style={styles.cardHeader}>
                      <div>
                        <Link
                          href={`/admin/patient/${purchase.patient_id}`}
                          style={styles.patientName}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {purchase.patient_name || 'Unknown'}
                        </Link>
                        <div style={styles.medication}>
                          {purchase.product_name || purchase.item_name}
                        </div>
                      </div>
                    </div>
                    <div style={styles.cardFooter}>
                      <span>Purchased {new Date(purchase.purchase_date).toLocaleDateString()}</span>
                      <button style={styles.quickAction}>Assign Protocol →</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Active Protocols Tab */}
          {mainTab === 'active' && (
            <div style={styles.grid}>
              {getFilteredActive().length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div>No active protocols {typeFilter !== 'all' && 'for this type'}</div>
                </div>
              ) : (
                getFilteredActive().map(protocol => {
                  const display = getProtocolDisplay(protocol);
                  const urgency = getUrgency(protocol);
                  const progressPercent = getProgress(protocol);

                  return (
                    <div
                      key={protocol.id}
                      style={styles.card}
                      onClick={() => router.push(`/admin/protocol/${protocol.id}`)}
                    >
                      <div style={styles.cardHeader}>
                        <div style={{
                          ...styles.typeBadge,
                          backgroundColor: `${display.color}15`
                        }}>
                          {display.icon}
                        </div>
                        {urgency && (
                          <span style={{
                            ...styles.urgencyBadge,
                            backgroundColor: urgency.bg,
                            color: urgency.text
                          }}>
                            {urgency.label}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/admin/patient/${protocol.patient_id}`}
                        style={styles.patientName}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {protocol.patient_name}
                      </Link>
                      <div style={styles.medication}>
                        {protocol.medication || protocol.program_name}
                        {protocol.selected_dose && ` • ${protocol.selected_dose}`}
                      </div>
                      
                      {/* Tracking info badges */}
                      <div style={styles.trackingInfo}>
                        {protocol.delivery_method && (
                          <span style={styles.trackingBadge}>
                            {formatDeliveryMethod(protocol.delivery_method)}
                          </span>
                        )}
                        {protocol.supply_type && (
                          <span style={styles.trackingBadge}>
                            {protocol.supply_type}
                          </span>
                        )}
                        {protocol.tracking_type === 'session_based' && (
                          <span style={styles.trackingBadge}>
                            {protocol.sessions_used || 0}/{protocol.total_sessions} sessions
                          </span>
                        )}
                      </div>
                      
                      <div style={styles.progressBar}>
                        <div style={{
                          ...styles.progressFill,
                          width: `${progressPercent}%`,
                          backgroundColor: display.color
                        }} />
                      </div>
                      <div style={styles.cardFooter}>
                        <span>
                          {protocol.start_date && new Date(protocol.start_date).toLocaleDateString()}
                        </span>
                        <span style={styles.statusText}>
                          {protocol.status_text || 'Active'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Completed Tab */}
          {mainTab === 'completed' && (
            <div style={styles.grid}>
              {getFilteredCompleted().length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div>No completed protocols</div>
                </div>
              ) : (
                getFilteredCompleted().map(protocol => {
                  const display = getProtocolDisplay(protocol);
                  return (
                    <div
                      key={protocol.id}
                      style={{ ...styles.card, opacity: 0.7 }}
                      onClick={() => router.push(`/admin/protocol/${protocol.id}`)}
                    >
                      <div style={styles.cardHeader}>
                        <div style={{
                          ...styles.typeBadge,
                          backgroundColor: '#f1f5f9'
                        }}>
                          {display.icon}
                        </div>
                        <span style={{
                          ...styles.urgencyBadge,
                          backgroundColor: '#dcfce7',
                          color: '#166534'
                        }}>
                          ✓ Completed
                        </span>
                      </div>
                      <Link
                        href={`/admin/patient/${protocol.patient_id}`}
                        style={styles.patientName}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {protocol.patient_name}
                      </Link>
                      <div style={styles.medication}>
                        {protocol.medication || protocol.program_name}
                      </div>
                      <div style={styles.cardFooter}>
                        <span>{new Date(protocol.end_date || protocol.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Patients Tab */}
          {mainTab === 'patients' && (
            <div style={styles.grid}>
              {getFilteredPatients().length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
                  <div>No patients found</div>
                </div>
              ) : (
                getFilteredPatients().map(patient => (
                  <div
                    key={patient.id}
                    style={styles.card}
                    onClick={() => router.push(`/admin/patient/${patient.id}`)}
                  >
                    <div style={styles.patientName}>{patient.name}</div>
                    <div style={styles.medication}>
                      {patient.email || patient.phone || 'No contact info'}
                    </div>
                    <div style={styles.cardFooter}>
                      <span>Added {new Date(patient.created_at).toLocaleDateString()}</span>
                      <span style={{ color: '#0f172a', fontWeight: '500' }}>View Profile →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
