// =====================================================
// STAFF HRT DASHBOARD
// /pages/admin/hrt-dashboard.js
// View all HRT members, IV status, lab schedules
// Range Medical
// =====================================================

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function HRTDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hrt/staff/dashboard');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load dashboard');
      }

      setMembers(data.data.memberships || []);
      setSummary(data.data.summary || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter members based on tab and search
  const filteredMembers = members.filter(m => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        m.patient_name?.toLowerCase().includes(search) ||
        m.patient_email?.toLowerCase().includes(search) ||
        m.patient_phone?.includes(search);
      if (!matchesSearch) return false;
    }

    // Tab filter
    switch (activeTab) {
      case 'iv-urgent':
        return m.iv_status === 'Urgent - Expiring!' || (m.days_left_in_period <= 7 && !m.iv_used);
      case 'iv-available':
        return !m.iv_used && m.iv_available;
      case 'iv-used':
        return m.iv_used;
      case 'labs-due':
        return m.lab_status === 'OVERDUE' || m.lab_status === 'Due this week' || m.lab_status === 'Due soon';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading HRT Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboard} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>HRT Dashboard | Range Medical</title>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>HRT Membership Dashboard</h1>
            <p style={styles.subtitle}>
              {members.length} active members · December 2024
            </p>
          </div>
          <button onClick={fetchDashboard} style={styles.refreshButton}>
            ↻ Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryGrid}>
          <SummaryCard 
            label="Total Active" 
            value={summary.totalActive || 0} 
            color="#3b82f6" 
          />
          <SummaryCard 
            label="IVs Available" 
            value={summary.ivsAvailable || 0} 
            color="#10b981" 
          />
          <SummaryCard 
            label="IVs Urgent (≤7 days)" 
            value={summary.ivsUrgent || 0} 
            color="#f59e0b" 
            alert={summary.ivsUrgent > 0}
          />
          <SummaryCard 
            label="Labs Overdue" 
            value={summary.labsOverdue || 0} 
            color="#ef4444" 
            alert={summary.labsOverdue > 0}
          />
        </div>

        {/* Search & Tabs */}
        <div style={styles.controls}>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.tabs}>
          <TabButton 
            active={activeTab === 'all'} 
            onClick={() => setActiveTab('all')}
            label="All Members"
            count={members.length}
          />
          <TabButton 
            active={activeTab === 'iv-urgent'} 
            onClick={() => setActiveTab('iv-urgent')}
            label="IV Urgent"
            count={members.filter(m => m.days_left_in_period <= 7 && !m.iv_used).length}
            urgent
          />
          <TabButton 
            active={activeTab === 'iv-available'} 
            onClick={() => setActiveTab('iv-available')}
            label="IV Available"
            count={members.filter(m => !m.iv_used && m.iv_available).length}
          />
          <TabButton 
            active={activeTab === 'iv-used'} 
            onClick={() => setActiveTab('iv-used')}
            label="IV Used"
            count={members.filter(m => m.iv_used).length}
          />
          <TabButton 
            active={activeTab === 'labs-due'} 
            onClick={() => setActiveTab('labs-due')}
            label="Labs Due"
            count={members.filter(m => ['OVERDUE', 'Due this week', 'Due soon'].includes(m.lab_status)).length}
            warning
          />
        </div>

        {/* Members Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>IV Status</th>
                <th style={styles.th}>Days Left</th>
                <th style={styles.th}>Lab Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyRow}>
                    No members found
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <MemberRow 
                    key={member.membership_id} 
                    member={member} 
                    onRefresh={fetchDashboard}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}

// =====================================================
// SUMMARY CARD COMPONENT
// =====================================================
function SummaryCard({ label, value, color, alert }) {
  return (
    <div style={{
      ...styles.summaryCard,
      borderColor: color,
      animation: alert ? 'pulse 2s infinite' : 'none'
    }}>
      <div style={{ ...styles.summaryValue, color }}>{value}</div>
      <div style={styles.summaryLabel}>{label}</div>
    </div>
  );
}

// =====================================================
// TAB BUTTON COMPONENT
// =====================================================
function TabButton({ active, onClick, label, count, urgent, warning }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.tabButton,
        backgroundColor: active ? '#374151' : 'transparent',
        color: active ? '#fff' : '#9ca3af'
      }}
    >
      {label}
      <span style={{
        ...styles.tabCount,
        backgroundColor: urgent ? '#ef4444' : warning ? '#f59e0b' : '#4b5563',
        color: '#fff'
      }}>
        {count}
      </span>
    </button>
  );
}

// =====================================================
// MEMBER ROW COMPONENT
// =====================================================
function MemberRow({ member, onRefresh }) {
  const [showActions, setShowActions] = useState(false);

  const getIVStatusStyle = () => {
    if (member.iv_used) return { backgroundColor: '#065f46', color: '#6ee7b7' };
    if (member.days_left_in_period <= 3) return { backgroundColor: '#991b1b', color: '#fca5a5' };
    if (member.days_left_in_period <= 7) return { backgroundColor: '#92400e', color: '#fcd34d' };
    return { backgroundColor: '#1e40af', color: '#93c5fd' };
  };

  const getLabStatusStyle = () => {
    if (member.lab_status === 'OVERDUE') return { backgroundColor: '#991b1b', color: '#fca5a5' };
    if (member.lab_status === 'Due this week' || member.lab_status === 'Due soon') {
      return { backgroundColor: '#92400e', color: '#fcd34d' };
    }
    return { backgroundColor: '#065f46', color: '#6ee7b7' };
  };

  const openInGHL = () => {
    window.open(`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${member.ghl_contact_id}`, '_blank');
  };

  return (
    <tr style={styles.tr}>
      {/* Patient Info */}
      <td style={styles.td}>
        <div style={styles.patientName}>{member.patient_name}</div>
        <div style={styles.patientContact}>
          {member.patient_email}
          {member.patient_phone && ` · ${member.patient_phone}`}
        </div>
      </td>

      {/* Membership Type */}
      <td style={styles.td}>
        <span style={styles.membershipType}>
          {member.membership_type?.replace('_', ' ')}
        </span>
      </td>

      {/* IV Status */}
      <td style={styles.td}>
        <span style={{ ...styles.statusBadge, ...getIVStatusStyle() }}>
          {member.iv_used ? '✓ Used' : 'Available'}
        </span>
      </td>

      {/* Days Left */}
      <td style={styles.td}>
        {member.iv_used ? (
          <span style={styles.daysLeft}>—</span>
        ) : (
          <span style={{
            ...styles.daysLeft,
            color: member.days_left_in_period <= 7 ? '#fbbf24' : '#9ca3af'
          }}>
            {member.days_left_in_period} days
          </span>
        )}
      </td>

      {/* Lab Status */}
      <td style={styles.td}>
        <span style={{ ...styles.statusBadge, ...getLabStatusStyle() }}>
          {member.lab_status || 'On track'}
        </span>
        {member.next_lab_due && (
          <div style={styles.labDate}>
            {new Date(member.next_lab_due).toLocaleDateString()}
          </div>
        )}
      </td>

      {/* Actions */}
      <td style={styles.td}>
        <div style={styles.actions}>
          <button 
            onClick={openInGHL}
            style={styles.actionButton}
            title="Open in GHL"
          >
            GHL ↗
          </button>
        </div>
      </td>
    </tr>
  );
}

// =====================================================
// STYLES
// =====================================================
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    color: '#fff',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    color: '#9ca3af'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #374151',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  error: {
    textAlign: 'center',
    padding: '48px',
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    maxWidth: '400px',
    margin: '48px auto'
  },
  retryButton: {
    marginTop: '16px',
    padding: '8px 24px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#374151',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  summaryCard: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    padding: '20px',
    borderLeft: '4px solid',
    textAlign: 'center'
  },
  summaryValue: {
    fontSize: '36px',
    fontWeight: '700'
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  controls: {
    marginBottom: '16px'
  },
  searchInput: {
    width: '100%',
    maxWidth: '400px',
    padding: '12px 16px',
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    borderBottom: '1px solid #374151',
    paddingBottom: '16px'
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  tabCount: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  tableContainer: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '16px',
    backgroundColor: '#111827',
    color: '#9ca3af',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tr: {
    borderBottom: '1px solid #374151'
  },
  td: {
    padding: '16px',
    verticalAlign: 'top'
  },
  emptyRow: {
    textAlign: 'center',
    padding: '48px',
    color: '#6b7280'
  },
  patientName: {
    fontWeight: '600',
    marginBottom: '4px'
  },
  patientContact: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  membershipType: {
    fontSize: '13px',
    color: '#9ca3af',
    textTransform: 'capitalize'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  daysLeft: {
    fontSize: '14px',
    fontWeight: '500'
  },
  labDate: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#374151',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500'
  }
};
