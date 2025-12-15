// =====================================================
// RANGE MEDICAL - STAFF DASHBOARD
// /pages/admin/dashboard.js
// Clean black/white design
// =====================================================

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attention');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState({
    needsAttention: [],
    patients: [],
    summary: {}
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = data.patients?.filter(p => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(search) ||
      p.email?.toLowerCase().includes(search) ||
      p.phone?.includes(search)
    );
  }) || [];

  return (
    <>
      <Head>
        <title>Staff Dashboard | Range Medical</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={styles.page}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.logo}>
            <RangeLogo />
          </div>
          
          <nav style={styles.nav}>
            <NavItem 
              active={activeTab === 'attention'} 
              onClick={() => setActiveTab('attention')}
              label="Needs Attention"
              count={data.needsAttention?.length || 0}
              alert={data.needsAttention?.length > 0}
            />
            <NavItem 
              active={activeTab === 'patients'} 
              onClick={() => setActiveTab('patients')}
              label="All Patients"
              count={data.patients?.length || 0}
            />
            <NavItem 
              active={activeTab === 'hrt'} 
              onClick={() => setActiveTab('hrt')}
              label="HRT Members"
              count={data.patients?.filter(p => p.hrt_status === 'active').length || 0}
            />
            <NavItem 
              active={activeTab === 'weightloss'} 
              onClick={() => setActiveTab('weightloss')}
              label="Weight Loss"
              count={data.patients?.filter(p => p.weight_loss_status === 'active').length || 0}
            />
            <NavItem 
              active={activeTab === 'sessions'} 
              onClick={() => setActiveTab('sessions')}
              label="Session Packs"
            />
            <NavItem 
              active={activeTab === 'protocols'} 
              onClick={() => setActiveTab('protocols')}
              label="Peptide Protocols"
              count={data.patients?.filter(p => p.active_protocols > 0).length || 0}
            />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          {/* Header */}
          <header style={styles.header}>
            <div>
              <h1 style={styles.pageTitle}>
                {activeTab === 'attention' && 'Needs Attention'}
                {activeTab === 'patients' && 'All Patients'}
                {activeTab === 'hrt' && 'HRT Members'}
                {activeTab === 'weightloss' && 'Weight Loss'}
                {activeTab === 'sessions' && 'Session Packs'}
                {activeTab === 'protocols' && 'Peptide Protocols'}
              </h1>
              <p style={styles.pageSubtitle}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div style={styles.headerActions}>
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <button onClick={fetchDashboard} style={styles.refreshBtn}>
                Refresh
              </button>
            </div>
          </header>

          {/* Content */}
          <div style={styles.content}>
            {loading ? (
              <LoadingState />
            ) : activeTab === 'attention' ? (
              <AttentionList items={data.needsAttention} />
            ) : activeTab === 'patients' ? (
              <PatientList patients={filteredPatients} />
            ) : activeTab === 'hrt' ? (
              <PatientList patients={filteredPatients.filter(p => p.hrt_status === 'active')} />
            ) : activeTab === 'protocols' ? (
              <PatientList patients={filteredPatients.filter(p => p.active_protocols > 0)} />
            ) : activeTab === 'weightloss' ? (
              <PatientList patients={filteredPatients.filter(p => p.weight_loss_status === 'active')} />
            ) : (
              <ComingSoon tab={activeTab} />
            )}
          </div>
        </main>
      </div>
    </>
  );
}

// =====================================================
// RANGE LOGO COMPONENT
// =====================================================
function RangeLogo() {
  return (
    <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
      {/* Circle with A */}
      <circle cx="30" cy="24" r="18" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M30 12 L22 32 M30 12 L38 32 M24 26 L36 26" stroke="black" strokeWidth="2" fill="none"/>
      {/* RANGE text */}
      <text x="0" y="52" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="600" fill="black">
        RANGE
      </text>
    </svg>
  );
}

// =====================================================
// NAV ITEM
// =====================================================
function NavItem({ active, onClick, label, count, alert }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navItem,
        backgroundColor: active ? '#000' : 'transparent',
        color: active ? '#fff' : '#000'
      }}
    >
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span style={{
          ...styles.navCount,
          backgroundColor: alert ? '#000' : '#e5e5e5',
          color: alert ? '#fff' : '#666'
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

// =====================================================
// ATTENTION LIST
// =====================================================
function AttentionList({ items }) {
  if (!items || items.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>✓</div>
        <h3 style={styles.emptyTitle}>All caught up!</h3>
        <p style={styles.emptyText}>No items need attention right now.</p>
      </div>
    );
  }

  const getAttentionStyle = (type) => {
    switch (type) {
      case 'hrt_iv': return { bg: '#fef3c7', border: '#f59e0b', label: 'IV Expiring' };
      case 'lab': return { bg: '#fee2e2', border: '#ef4444', label: 'Lab Overdue' };
      case 'protocol': return { bg: '#e0e7ff', border: '#6366f1', label: 'Protocol Ending' };
      default: return { bg: '#f3f4f6', border: '#9ca3af', label: type };
    }
  };

  return (
    <div style={styles.attentionList}>
      {items.map((item, i) => {
        const style = getAttentionStyle(item.attention_type);
        return (
          <div key={i} style={{
            ...styles.attentionCard,
            borderLeftColor: style.border
          }}>
            <div style={styles.attentionHeader}>
              <span style={{
                ...styles.attentionBadge,
                backgroundColor: style.bg,
                color: style.border
              }}>
                {item.attention_label}
              </span>
              <span style={styles.attentionDays}>
                {item.days_remaining < 0 
                  ? `${Math.abs(item.days_remaining)} days overdue`
                  : `${item.days_remaining} days left`
                }
              </span>
            </div>
            
            <div style={styles.attentionBody}>
              <h4 style={styles.attentionName}>{item.patient_name}</h4>
              <p style={styles.attentionDetail}>{item.detail}</p>
              <p style={styles.attentionContact}>
                {item.patient_email} · {item.patient_phone}
              </p>
            </div>
            
            <div style={styles.attentionActions}>
              <button 
                onClick={() => window.open(`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${item.ghl_contact_id}`, '_blank')}
                style={styles.actionBtn}
              >
                Open in GHL
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// PATIENT LIST
// =====================================================
function PatientList({ patients }) {
  if (!patients || patients.length === 0) {
    return (
      <div style={styles.emptyState}>
        <h3 style={styles.emptyTitle}>No patients found</h3>
      </div>
    );
  }

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Patient</th>
          <th style={styles.th}>Services</th>
          <th style={styles.th}>Status</th>
          <th style={styles.th}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {patients.map((patient) => (
          <tr key={patient.id} style={styles.tr}>
            <td style={styles.td}>
              <div style={styles.patientName}>{patient.full_name}</div>
              <div style={styles.patientContact}>
                {patient.email}
                {patient.phone && ` · ${patient.phone}`}
              </div>
            </td>
            <td style={styles.td}>
              <div style={styles.serviceTags}>
                {patient.hrt_status === 'active' && (
                  <span style={styles.serviceTag}>HRT</span>
                )}
                {patient.weight_loss_status === 'active' && (
                  <span style={styles.serviceTag}>Weight Loss</span>
                )}
                {patient.active_protocols > 0 && (
                  <span style={styles.serviceTag}>Peptides ({patient.active_protocols})</span>
                )}
              </div>
            </td>
            <td style={styles.td}>
              {patient.hrt_status === 'active' && (
                <div style={styles.statusItem}>
                  IV: {patient.hrt_iv_used ? '✓ Used' : `${patient.hrt_iv_days_left}d left`}
                </div>
              )}
            </td>
            <td style={styles.td}>
              <div style={styles.actionBtns}>
                <button 
                  onClick={() => window.location.href = `/admin/patient/${patient.ghl_contact_id || patient.id}`}
                  style={styles.viewBtn}
                >
                  View
                </button>
                {patient.ghl_contact_id && (
                  <button 
                    onClick={() => window.open(`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${patient.ghl_contact_id}`, '_blank')}
                    style={styles.ghlBtnSmall}
                  >
                    GHL
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// =====================================================
// LOADING & COMING SOON
// =====================================================
function LoadingState() {
  return (
    <div style={styles.emptyState}>
      <div style={styles.spinner}></div>
      <p>Loading...</p>
    </div>
  );
}

function ComingSoon({ tab }) {
  return (
    <div style={styles.emptyState}>
      <h3 style={styles.emptyTitle}>{tab} view</h3>
      <p style={styles.emptyText}>Coming soon</p>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================
const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'Inter, -apple-system, sans-serif',
    backgroundColor: '#fff'
  },
  
  // Sidebar
  sidebar: {
    width: '240px',
    borderRight: '1px solid #e5e5e5',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column'
  },
  logo: {
    marginBottom: '32px',
    paddingLeft: '8px'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'all 0.15s'
  },
  navCount: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  
  // Main
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '24px 32px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
    color: '#000'
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '4px 0 0 0'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  searchInput: {
    padding: '10px 16px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '14px',
    width: '280px',
    outline: 'none'
  },
  refreshBtn: {
    padding: '10px 20px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  
  // Content
  content: {
    flex: 1,
    padding: '24px 32px',
    backgroundColor: '#fafafa'
  },
  
  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: '64px',
    color: '#666'
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#000',
    color: '#fff',
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#000'
  },
  emptyText: {
    fontSize: '14px',
    margin: 0
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e5e5',
    borderTopColor: '#000',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px'
  },
  
  // Attention list
  attentionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  attentionCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    borderLeft: '4px solid',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  attentionHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '120px'
  },
  attentionBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block'
  },
  attentionDays: {
    fontSize: '12px',
    color: '#666'
  },
  attentionBody: {
    flex: 1
  },
  attentionName: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    color: '#000'
  },
  attentionDetail: {
    fontSize: '14px',
    margin: '0 0 4px 0',
    color: '#333'
  },
  attentionContact: {
    fontSize: '12px',
    margin: 0,
    color: '#666'
  },
  attentionActions: {
    display: 'flex',
    gap: '8px'
  },
  actionBtn: {
    padding: '8px 16px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  
  // Table
  table: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #e5e5e5'
  },
  tr: {
    borderBottom: '1px solid #f0f0f0'
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'middle'
  },
  patientName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#000'
  },
  patientContact: {
    fontSize: '12px',
    color: '#666',
    marginTop: '2px'
  },
  serviceTags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  serviceTag: {
    padding: '4px 10px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#374151'
  },
  statusItem: {
    fontSize: '13px',
    color: '#374151'
  },
  viewBtn: {
    padding: '6px 14px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  ghlBtnSmall: {
    padding: '6px 10px',
    backgroundColor: '#fff',
    color: '#666',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  actionBtns: {
    display: 'flex',
    gap: '6px'
  }
};
