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
  
  // Edit modal state
  const [editingProtocol, setEditingProtocol] = useState(null);
  const [peptideList, setPeptideList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    goal: '',
    primary_peptide: '',
    secondary_peptide: '',
    dose_amount: '',
    dose_frequency: '',
    peptide_route: 'SC',
    special_instructions: '',
    status: 'active',
    duration_days: 30,
    start_date: ''
  });

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
      fetchPeptideList();
      if (contactFilter) {
        fetchProtocolsByContact(contactFilter);
      } else {
        fetchProtocols(activeTab);
      }
    }
  }, [isAuthenticated, activeTab, password, contactFilter]);

  const fetchPeptideList = async () => {
    try {
      const res = await fetch('/api/admin/protocols?view=peptides', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPeptideList(data);
      }
    } catch (err) {
      console.error('Failed to fetch peptides:', err);
    }
  };

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

  // Edit modal handlers
  const openEditModal = (protocol) => {
    setEditingProtocol(protocol);
    setEditForm({
      goal: protocol.goal || '',
      primary_peptide: protocol.primary_peptide || '',
      secondary_peptide: protocol.secondary_peptide || '',
      dose_amount: protocol.dose_amount || '',
      dose_frequency: protocol.dose_frequency || '',
      peptide_route: protocol.peptide_route || 'SC',
      special_instructions: protocol.special_instructions || '',
      status: protocol.status || 'active',
      duration_days: protocol.duration_days || 30,
      start_date: protocol.start_date || ''
    });
  };

  const closeEditModal = () => {
    setEditingProtocol(null);
    setEditForm({
      goal: '',
      primary_peptide: '',
      secondary_peptide: '',
      dose_amount: '',
      dose_frequency: '',
      peptide_route: 'SC',
      special_instructions: '',
      status: 'active',
      duration_days: 30,
      start_date: ''
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-adjust duration based on frequency
      if (field === 'dose_frequency') {
        if (value === '5 days on / 2 days off') {
          // 5 on / 2 off needs 28 days for 20 injections
          updated.duration_days = 28;
        } else if (value.includes('2x weekly') && !value.includes('monthly')) {
          // HRT 2x weekly - suggest 12 weeks (84 days)
          if (prev.duration_days < 70) {
            updated.duration_days = 84;
          }
        } else if (value === '1x monthly') {
          // Monthly IV - suggest 365 days (1 year)
          updated.duration_days = 365;
        } else if (value === '1x daily' || value === '2x daily' || 
                   value === '1x daily (AM)' || value === '1x daily (PM)' || 
                   value === '1x daily (bedtime)') {
          // Daily frequencies use 30 days
          if (prev.duration_days === 28 || prev.duration_days > 90) {
            updated.duration_days = 30;
          }
        }
      }
      
      // Auto-fill goal when primary peptide is selected
      if (field === 'primary_peptide' && value) {
        const selectedPeptide = peptideList.find(p => p.name === value);
        if (selectedPeptide?.suggested_primary_goal && !prev.goal) {
          // Only auto-fill if goal is not already set
          updated.goal = selectedPeptide.suggested_primary_goal;
        }
        // Auto-set route based on peptide
        if (selectedPeptide?.default_route) {
          updated.peptide_route = selectedPeptide.default_route;
        }
        // Auto-set frequency based on peptide
        if (selectedPeptide?.default_frequency && !prev.dose_frequency) {
          updated.dose_frequency = selectedPeptide.default_frequency;
        }
      }
      
      return updated;
    });
  };

  const saveProtocol = async () => {
    if (!editingProtocol) return;
    
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/protocols', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${password}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingProtocol.id,
          ghl_contact_id: editingProtocol.ghl_contact_id,
          ...editForm
        })
      });
      
      if (res.ok) {
        // Refresh data
        if (contactFilter) {
          fetchProtocolsByContact(contactFilter);
        } else {
          fetchProtocols(activeTab);
        }
        fetchStats();
        closeEditModal();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      setError('Network error');
    }
    
    setSaving(false);
  };

  // Group peptides by category for dropdown
  const peptidesByCategory = peptideList.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  // Copy tracker link with welcome message to clipboard
  const copyTrackerLink = (protocol) => {
    const link = `https://rangemedical-system-2.vercel.app/track/${protocol.access_token}`;
    const firstName = protocol.patient_name?.split(' ')[0] || '';
    const peptide = protocol.primary_peptide || 'your peptide';
    
    const message = `Hi ${firstName}! This is Range Medical.

Your ${peptide} is ready. Here is your injection tracker link:

${link}

Open it to see your schedule, dosing instructions, and peptide info. Tap each day when you do your injection.

Questions? Text us anytime.
(949) 997-3988`;

    navigator.clipboard.writeText(message).then(() => {
      alert('Welcome message copied! Paste into your text.');
    }).catch(() => {
      prompt('Copy this message:', message);
    });
  };

  // Copy patient dashboard link (shows all protocols)
  const copyDashboardLink = async (protocol) => {
    try {
      // Get or create patient dashboard token
      const res = await fetch('/api/admin/protocols?view=dashboard_token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${password}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ghl_contact_id: protocol.ghl_contact_id,
          patient_name: protocol.patient_name,
          patient_email: protocol.patient_email,
          patient_phone: protocol.patient_phone
        })
      });
      
      if (!res.ok) {
        alert('Failed to get dashboard link');
        return;
      }
      
      const { token } = await res.json();
      const link = `https://rangemedical-system-2.vercel.app/my/${token}`;
      const firstName = protocol.patient_name?.split(' ')[0] || '';
      
      const message = `Hi ${firstName}! This is Range Medical.

Here is your personal dashboard link:

${link}

You can view all your treatments, track your progress, and see upcoming appointments.

Questions? Text us anytime.
(949) 997-3988`;

      navigator.clipboard.writeText(message).then(() => {
        alert('Dashboard link copied! Paste into your text.');
      }).catch(() => {
        prompt('Copy this message:', message);
      });
    } catch (err) {
      console.error('Dashboard link error:', err);
      alert('Failed to generate dashboard link');
    }
  };

  // Delete protocol
  const deleteProtocol = async (protocolId, patientName) => {
    const confirmed = window.confirm(`Are you sure you want to delete the protocol for ${patientName}?\n\nThis will also delete all injection logs for this protocol. This cannot be undone.`);
    
    if (!confirmed) return;
    
    try {
      const res = await fetch('/api/admin/protocols', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${password}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: protocolId })
      });
      
      if (res.ok) {
        // Refresh data
        if (contactFilter) {
          fetchProtocolsByContact(contactFilter);
        } else {
          fetchProtocols(activeTab);
        }
        fetchStats();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete protocol');
      }
    } catch (err) {
      setError('Network error while deleting');
    }
  };

  // Calculate injection count based on duration and frequency
  const getInjectionCount = (duration, frequency) => {
    if (!duration || !frequency) return 0;
    
    if (frequency === '5 days on / 2 days off') {
      // 5 injections per 7-day cycle
      const fullWeeks = Math.floor(duration / 7);
      const remainingDays = duration % 7;
      return fullWeeks * 5 + Math.min(remainingDays, 5);
    }
    
    if (frequency === '1x weekly') {
      return Math.ceil(duration / 7);
    }
    
    if (frequency.includes('2x weekly')) {
      return Math.ceil(duration / 7) * 2;
    }
    
    if (frequency.includes('3x weekly')) {
      return Math.ceil(duration / 7) * 3;
    }
    
    if (frequency === 'Every other day') {
      return Math.ceil(duration / 2);
    }
    
    if (frequency === '2x daily') {
      return duration * 2;
    }
    
    if (frequency === '1x monthly') {
      return Math.ceil(duration / 30);
    }
    
    if (frequency === 'As needed') {
      return '-';
    }
    
    // Default: 1x daily
    return duration;
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

  const getGoalColor = (goal) => {
    switch (goal) {
      case 'recovery': return '#3b82f6';    // blue
      case 'metabolic': return '#f59e0b';   // amber
      case 'longevity': return '#8b5cf6';   // purple
      case 'aesthetic': return '#ec4899';   // pink
      default: return '#6b7280';
    }
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
                <th style={styles.th}>Goal</th>
                <th style={styles.th}>Peptides</th>
                <th style={styles.th}>Start</th>
                <th style={styles.th}>End</th>
                <th style={styles.th}>Progress</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Paid</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {protocols.length === 0 ? (
                <tr>
                  <td colSpan="10" style={styles.emptyState}>No protocols found</td>
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
                      {p.goal ? (
                        <span style={{
                          ...styles.goalBadge,
                          backgroundColor: getGoalColor(p.goal)
                        }}>
                          {p.goal}
                        </span>
                      ) : (
                        <span style={styles.notSet}>Not set</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div>{p.primary_peptide || <span style={styles.notSet}>Not set</span>}</div>
                      {p.secondary_peptide && (
                        <div style={styles.secondaryPeptide}>{p.secondary_peptide}</div>
                      )}
                    </td>
                    <td style={styles.td}>{formatDate(p.start_date)}</td>
                    <td style={styles.td}>{formatDate(p.end_date)}</td>
                    <td style={styles.td}>
                      {p.status === 'active' ? (
                        <div style={styles.progressCell}>
                          <div style={styles.progressText}>
                            {p.injections_completed || 0}/{p.duration_days}
                          </div>
                          <div style={styles.miniProgressBar}>
                            <div style={{
                              ...styles.miniProgressFill,
                              width: `${Math.min(100, ((p.injections_completed || 0) / p.duration_days) * 100)}%`
                            }} />
                          </div>
                          {p.days_remaining !== null && (
                            <div style={styles.daysLeft}>{p.days_remaining}d left</div>
                          )}
                        </div>
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
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => openEditModal(p)}
                          style={styles.editButton}
                        >
                          Edit
                        </button>
                        {p.access_token && (
                          <>
                            <a
                              href={`/track/${p.access_token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.viewButton}
                              title="View patient tracker"
                            >
                              View
                            </a>
                            <button
                              onClick={() => copyTrackerLink(p)}
                              style={styles.trackerButton}
                              title="Copy welcome text to send to patient"
                            >
                              📋
                            </button>
                            <button
                              onClick={() => copyDashboardLink(p)}
                              style={styles.dashboardButton}
                              title="Copy patient dashboard link (all protocols)"
                            >
                              🏠
                            </button>
                          </>
                        )}
                        {p.ghl_contact_id && (
                          <a
                            href={`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${p.ghl_contact_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.ghlLink}
                          >
                            GHL
                          </a>
                        )}
                        <button
                          onClick={() => deleteProtocol(p.id, p.patient_name)}
                          style={styles.deleteButton}
                          title="Delete protocol"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Protocol Modal */}
      {editingProtocol && (
        <div style={styles.modalOverlay} onClick={closeEditModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Protocol</h2>
              <button onClick={closeEditModal} style={styles.modalClose}>✕</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.modalPatientInfo}>
                <strong>{editingProtocol.patient_name}</strong>
                <span>{editingProtocol.program_name}</span>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Goal *</label>
                <select
                  value={editForm.goal}
                  onChange={(e) => handleEditChange('goal', e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select goal...</option>
                  <option value="recovery">Recovery / Pain / Tissue Repair</option>
                  <option value="weight_metabolic">Weight & Metabolic</option>
                  <option value="brain_focus">Brain, Focus & Mood</option>
                  <option value="longevity_immune">Longevity & Immune Protection</option>
                  <option value="skin_aesthetic">Skin, Hair & Aesthetic</option>
                  <option value="sexual_health">Sexual Health</option>
                  <option value="sleep_stress">Sleep & Stress</option>
                  <option value="hrt">Hormone Optimization (HRT)</option>
                  <option value="iv_therapy">IV Therapy</option>
                  <option value="specialty">Specialty / Other</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Primary Peptide *</label>
                <select
                  value={editForm.primary_peptide}
                  onChange={(e) => handleEditChange('primary_peptide', e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select peptide...</option>
                  {Object.entries(peptidesByCategory).map(([category, peptides]) => (
                    <optgroup key={category} label={category.replace('_', ' ').toUpperCase()}>
                      {peptides.map((p) => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Secondary Peptide (optional)</label>
                <select
                  value={editForm.secondary_peptide}
                  onChange={(e) => handleEditChange('secondary_peptide', e.target.value)}
                  style={styles.select}
                >
                  <option value="">None</option>
                  {Object.entries(peptidesByCategory).map(([category, peptides]) => (
                    <optgroup key={category} label={category.replace('_', ' ').toUpperCase()}>
                      {peptides.map((p) => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Dose</label>
                  <input
                    type="text"
                    value={editForm.dose_amount}
                    onChange={(e) => handleEditChange('dose_amount', e.target.value)}
                    placeholder="e.g., 500mcg"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Frequency</label>
                  <select
                    value={editForm.dose_frequency}
                    onChange={(e) => handleEditChange('dose_frequency', e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Select...</option>
                    <optgroup label="Daily">
                      <option value="1x daily">1x daily</option>
                      <option value="2x daily">2x daily</option>
                      <option value="1x daily (AM)">1x daily (AM)</option>
                      <option value="1x daily (PM)">1x daily (PM)</option>
                      <option value="1x daily (bedtime)">1x daily (bedtime)</option>
                    </optgroup>
                    <optgroup label="Weekly">
                      <option value="2x weekly (Mon/Thu)">2x weekly (Mon/Thu) - HRT</option>
                      <option value="2x weekly (Tue/Fri)">2x weekly (Tue/Fri)</option>
                      <option value="2x weekly">2x weekly (any days)</option>
                      <option value="3x weekly (Mon/Wed/Fri)">3x weekly (Mon/Wed/Fri)</option>
                      <option value="3x weekly">3x weekly (any days)</option>
                      <option value="1x weekly">1x weekly</option>
                    </optgroup>
                    <optgroup label="Other Patterns">
                      <option value="5 days on / 2 days off">5 days on / 2 days off</option>
                      <option value="Every other day">Every other day</option>
                      <option value="1x monthly">1x monthly (IV/In-Clinic)</option>
                      <option value="As needed">As needed</option>
                    </optgroup>
                  </select>
                  {editForm.dose_frequency && (
                    <div style={styles.injectionInfo}>
                      {getInjectionCount(editForm.duration_days, editForm.dose_frequency)} {editForm.dose_frequency.includes('monthly') ? 'sessions' : 'injections'} over {editForm.duration_days} days
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Route</label>
                  <select
                    value={editForm.peptide_route}
                    onChange={(e) => handleEditChange('peptide_route', e.target.value)}
                    style={styles.select}
                  >
                    <option value="SC">SC (Subcutaneous)</option>
                    <option value="IM">IM (Intramuscular)</option>
                    <option value="IV">IV (Intravenous)</option>
                    <option value="Intranasal">Intranasal</option>
                    <option value="Oral">Oral</option>
                    <option value="Topical">Topical</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Duration</label>
                  <select
                    value={editForm.duration_days}
                    onChange={(e) => handleEditChange('duration_days', parseInt(e.target.value))}
                    style={styles.select}
                  >
                    <optgroup label="Short Programs">
                      <option value="10">10 days (Jumpstart)</option>
                      <option value="28">28 days (4 weeks)</option>
                      <option value="30">30 days (Month)</option>
                    </optgroup>
                    <optgroup label="HRT Cycles">
                      <option value="70">70 days (10 weeks)</option>
                      <option value="84">84 days (12 weeks)</option>
                      <option value="90">90 days (3 months)</option>
                    </optgroup>
                    <optgroup label="Extended">
                      <option value="180">180 days (6 months)</option>
                      <option value="365">365 days (1 year)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => handleEditChange('status', e.target.value)}
                    style={styles.select}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="ready_refill">Ready for Refill</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date</label>
                  <input
                    type="date"
                    value={editForm.start_date || ''}
                    onChange={(e) => handleEditChange('start_date', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Special Instructions</label>
                <textarea
                  value={editForm.special_instructions}
                  onChange={(e) => handleEditChange('special_instructions', e.target.value)}
                  placeholder="Any special instructions for this protocol..."
                  style={styles.textarea}
                  rows={3}
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closeEditModal} style={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={saveProtocol} style={styles.saveButton} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
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
  goalBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    color: 'white',
    fontWeight: '500',
    fontSize: '11px',
    textTransform: 'capitalize'
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280'
  },
  viewButton: {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block'
  },
  trackerButton: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
    border: '1px solid #86efac',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  dashboardButton: {
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #93c5fd',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  progressCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  progressText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a365d'
  },
  miniProgressBar: {
    width: '60px',
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: '3px',
    transition: 'width 0.3s ease'
  },
  daysLeft: {
    fontSize: '10px',
    color: '#64748b'
  },
  ghlLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: '500',
    padding: '4px 8px',
    border: '1px solid #3b82f6',
    borderRadius: '4px'
  },
  notSet: {
    color: '#9ca3af',
    fontStyle: 'italic',
    fontSize: '13px'
  },
  doseFrequency: {
    fontSize: '12px',
    color: '#6b7280'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  editButton: {
    backgroundColor: '#1a365d',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  deleteButton: {
    backgroundColor: 'transparent',
    border: '1px solid #e5e7eb',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    opacity: 0.6,
    transition: 'opacity 0.2s'
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb'
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a365d'
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px'
  },
  modalBody: {
    padding: '24px'
  },
  modalPatientInfo: {
    backgroundColor: '#f3f4f6',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  },
  formGroup: {
    marginBottom: '16px',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    backgroundColor: 'white'
  },
  injectionInfo: {
    marginTop: '6px',
    fontSize: '13px',
    color: '#10b981',
    fontWeight: '500'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  saveButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#1a365d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
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
