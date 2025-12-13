// /pages/admin/protocols.js
// Protocol Tracking Dashboard for Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function ProtocolDashboard() {
  const router = useRouter();
  const { contact } = router.query; // Get contact ID from URL if present
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [protocols, setProtocols] = useState([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, readyForRefill: 0, totalRevenue: 0 });
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [contactFilter, setContactFilter] = useState(null);

  // Check localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('range_admin_auth');
    if (storedAuth) {
      setPassword(storedAuth);
      setIsAuthenticated(true);
    }
    setAuthChecked(true);
  }, []);

  // Set contact filter from URL
  useEffect(() => {
    if (contact) {
      setContactFilter(contact);
      setActiveTab('contact');
    }
  }, [contact]);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated && password) {
      fetchStats();
      fetchMilestones();
      if (contactFilter) {
        fetchProtocolsByContact(contactFilter);
      } else {
        fetchProtocols(activeTab);
      }
    }
  }, [isAuthenticated, activeTab, password, contactFilter]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Test the password against the API
    try {
      const res = await fetch('/api/admin/protocols?view=stats', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (res.ok) {
        localStorage.setItem('range_admin_auth', password);
        setIsAuthenticated(true);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Connection error');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('range_admin_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

  const fetchProtocols = async (view, search = '') => {
    setLoading(true);
    setError('');
    try {
      const url = search 
        ? `/api/admin/protocols?view=search&search=${encodeURIComponent(search)}`
        : `/api/admin/protocols?view=${view}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (res.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('range_admin_auth');
        return;
      }
      
      const data = await res.json();
      if (res.ok) {
        setProtocols(data);
      } else {
        setError(data.error || 'Failed to fetch');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/protocols?view=stats', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchMilestones = async () => {
    try {
      const res = await fetch('/api/admin/protocols?view=milestones', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMilestones(data);
      }
    } catch (err) {
      console.error('Failed to fetch milestones:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setContactFilter(null);
      setActiveTab('search');
      fetchProtocols('search', searchQuery);
    }
  };

  const fetchProtocolsByContact = async (contactId) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/protocols?view=contact&contactId=${encodeURIComponent(contactId)}`, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (res.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('range_admin_auth');
        return;
      }
      
      const data = await res.json();
      if (res.ok) {
        setProtocols(data);
      } else {
        setError(data.error || 'Failed to fetch');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const clearContactFilter = () => {
    setContactFilter(null);
    setActiveTab('active');
    router.push('/admin/protocols', undefined, { shallow: true });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      case 'ready_refill': return '#f59e0b';
      case 'pending': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDaysRemainingColor = (days) => {
    if (days <= 3) return '#ef4444';
    if (days <= 7) return '#f59e0b';
    return '#10b981';
  };

  // Loading state while checking auth
  if (!authChecked) {
    return (
      <div style={styles.loginContainer}>
        <Head>
          <title>Protocol Dashboard - Range Medical</title>
        </Head>
        <div style={styles.loginBox}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div style={styles.loginContainer}>
        <Head>
          <title>Protocol Dashboard - Range Medical</title>
        </Head>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>Range Medical</h1>
          <p style={styles.loginSubtitle}>Protocol Dashboard</p>
          {error && <p style={styles.loginError}>{error}</p>}
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.loginInput}
              disabled={loading}
            />
            <button type="submit" style={styles.loginButton} disabled={loading}>
              {loading ? 'Checking...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div style={styles.container}>
      <Head>
        <title>Protocol Dashboard - Range Medical</title>
      </Head>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Protocol Dashboard</h1>
          <span style={styles.subtitle}>Range Medical</span>
        </div>
        <div style={styles.headerRight}>
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <input
              type="text"
              placeholder="Search patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchButton}>Search</button>
          </form>
          <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
        </div>
      </header>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.active}</div>
          <div style={styles.statLabel}>Active Protocols</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: '#f59e0b'}}>{stats.readyForRefill}</div>
          <div style={styles.statLabel}>Ready for Refill</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.completed}</div>
          <div style={styles.statLabel}>Completed</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: '#10b981'}}>{formatCurrency(stats.totalRevenue)}</div>
          <div style={styles.statLabel}>Total Revenue</div>
        </div>
      </div>

      {/* Today's Milestones - hide when viewing specific contact */}
      {!contactFilter && milestones.length > 0 && (
        <div style={styles.milestonesSection}>
          <h2 style={styles.sectionTitle}>📋 Today's Tasks ({milestones.length})</h2>
          <div style={styles.milestonesList}>
            {milestones.map((m) => (
              <div key={m.id} style={styles.milestoneItem}>
                <strong>{m.protocol?.patient_name}</strong> — {m.milestone_name}
                <span style={styles.milestoneMeta}>{m.protocol?.program_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Filter Banner */}
      {contactFilter && protocols.length > 0 && (
        <div style={styles.contactBanner}>
          <span>Viewing protocols for: <strong>{protocols[0]?.patient_name || 'Contact'}</strong></span>
          <button onClick={clearContactFilter} style={styles.clearFilterButton}>
            ✕ Clear Filter
          </button>
        </div>
      )}

      {/* Tabs - hide when viewing specific contact */}
      {!contactFilter && (
        <div style={styles.tabs}>
          {[
            { id: 'active', label: 'Active', count: stats.active },
            { id: 'ending-soon', label: 'Ending Soon' },
            { id: 'refill', label: 'Ready for Refill', count: stats.readyForRefill },
            { id: 'completed', label: 'Completed' },
            { id: 'all', label: 'All' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {})
              }}
            >
              {tab.label}
              {tab.count > 0 && <span style={styles.tabBadge}>{tab.count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Loading */}
      {loading && <div style={styles.loading}>Loading...</div>}

      {/* Protocols Table */}
      {!loading && (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>Program</th>
                <th style={styles.th}>Peptides</th>
                <th style={styles.th}>Start</th>
                <th style={styles.th}>End</th>
                <th style={styles.th}>Days Left</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Paid</th>
                <th style={styles.th}>GHL</th>
              </tr>
            </thead>
            <tbody>
              {protocols.length === 0 ? (
                <tr>
                  <td colSpan="9" style={styles.emptyState}>No protocols found</td>
                </tr>
              ) : (
                protocols.map((p) => (
                  <tr key={p.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.patientName}>{p.patient_name}</div>
                      <div style={styles.patientEmail}>{p.patient_email}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.programName}>{p.program_name}</div>
                      <div style={styles.programType}>{p.duration_days} days</div>
                    </td>
                    <td style={styles.td}>
                      <div>{p.primary_peptide || '-'}</div>
                      {p.secondary_peptide && (
                        <div style={styles.secondaryPeptide}>{p.secondary_peptide}</div>
                      )}
                    </td>
                    <td style={styles.td}>{formatDate(p.start_date)}</td>
                    <td style={styles.td}>{formatDate(p.end_date)}</td>
                    <td style={styles.td}>
                      {p.status === 'active' && p.days_remaining !== null ? (
                        <span style={{
                          ...styles.daysRemaining,
                          backgroundColor: getDaysRemainingColor(p.days_remaining)
                        }}>
                          {p.days_remaining}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(p.status)
                      }}>
                        {p.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={styles.td}>{formatCurrency(p.amount_paid)}</td>
                    <td style={styles.td}>
                      {p.ghl_contact_id && (
                        <a
                          href={`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${p.ghl_contact_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.ghlLink}
                        >
                          Open →
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  // Login
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loginBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '360px'
  },
  loginTitle: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    color: '#1a365d'
  },
  loginSubtitle: {
    margin: '0 0 24px 0',
    color: '#6b7280',
    fontSize: '14px'
  },
  loginInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    marginBottom: '16px',
    boxSizing: 'border-box'
  },
  loginButton: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#1a365d',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  loginError: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  },

  // Main container
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '24px'
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  title: {
    margin: 0,
    fontSize: '28px',
    color: '#1a365d'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '14px'
  },
  searchForm: {
    display: 'flex',
    gap: '8px'
  },
  searchInput: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    width: '200px'
  },
  searchButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#1a365d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer'
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a365d',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },

  // Milestones
  milestonesSection: {
    backgroundColor: '#fef3c7',
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: '24px'
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    color: '#92400e'
  },
  milestonesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  milestoneItem: {
    fontSize: '14px',
    color: '#78350f'
  },
  milestoneMeta: {
    marginLeft: '8px',
    color: '#a16207',
    fontSize: '12px'
  },

  // Tabs
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  contactBanner: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  clearFilterButton: {
    backgroundColor: 'transparent',
    color: '#1e40af',
    border: '1px solid #1e40af',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  tab: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: 'white',
    color: '#4b5563',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  tabActive: {
    backgroundColor: '#1a365d',
    color: 'white',
    borderColor: '#1a365d'
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px'
  },

  // Table
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    borderBottom: '2px solid #e5e7eb',
    color: '#6b7280',
    fontWeight: '600',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tr: {
    borderBottom: '1px solid #f3f4f6'
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'top'
  },
  patientName: {
    fontWeight: '600',
    color: '#111827'
  },
  patientEmail: {
    fontSize: '12px',
    color: '#6b7280'
  },
  programName: {
    color: '#111827'
  },
  programType: {
    fontSize: '12px',
    color: '#6b7280'
  },
  secondaryPeptide: {
    fontSize: '12px',
    color: '#6b7280'
  },
  daysRemaining: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    color: 'white',
    fontWeight: '600',
    fontSize: '13px'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    color: 'white',
    fontWeight: '500',
    fontSize: '12px',
    textTransform: 'capitalize'
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280'
  },
  ghlLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500'
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280'
  }
};
