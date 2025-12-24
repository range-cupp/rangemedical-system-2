// /pages/admin/protocols/index.js
// Protocols List - View & navigate to detail
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminProtocols() {
  const router = useRouter();
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState('end_date');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    fetchProtocols();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProtocols(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProtocols = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '500');

      const res = await fetch(`/api/admin/protocols?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch protocols');

      const data = await res.json();
      setProtocols(data.protocols || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sort protocols
  const sortedProtocols = [...protocols].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'end_date' || sortField === 'start_date') {
      aVal = aVal ? new Date(aVal) : new Date('9999-12-31');
      bVal = bVal ? new Date(bVal) : new Date('9999-12-31');
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getDaysLeft = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDaysLeftBadge = (endDate) => {
    const days = getDaysLeft(endDate);
    if (days === null) return { text: '—', bg: '#f5f5f5', color: '#666' };
    if (days < 0) return { text: 'Ended', bg: '#fee2e2', color: '#dc2626' };
    if (days <= 3) return { text: `${days}d`, bg: '#fef3c7', color: '#b45309' };
    if (days <= 7) return { text: `${days}d`, bg: '#dbeafe', color: '#1d4ed8' };
    return { text: `${days}d`, bg: '#f5f5f5', color: '#666' };
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#dcfce7', color: '#166534' },
      completed: { bg: '#f3f4f6', color: '#374151' },
      paused: { bg: '#fef3c7', color: '#92400e' },
      cancelled: { bg: '#fee2e2', color: '#991b1b' }
    };
    return styles[status] || styles.active;
  };

  return (
    <>
      <Head>
        <title>Protocols | Range Medical</title>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Protocols</h1>
            <p style={styles.subtitle}>{protocols.length} protocols</p>
          </div>
          <div style={styles.headerActions}>
            <Link href="/admin/dashboard" style={styles.navLink}>Dashboard</Link>
            <Link href="/admin/purchases" style={styles.navLink}>Purchases</Link>
          </div>
        </header>

        {/* Filters */}
        <div style={styles.filterBar}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by patient or program..."
            style={styles.searchInput}
          />
          
          <div style={styles.filterGroup}>
            <button
              onClick={() => setStatusFilter('active')}
              style={{
                ...styles.filterBtn,
                background: statusFilter === 'active' ? '#000' : '#fff',
                color: statusFilter === 'active' ? '#fff' : '#000'
              }}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                ...styles.filterBtn,
                background: statusFilter === 'all' ? '#000' : '#fff',
                color: statusFilter === 'all' ? '#fff' : '#000'
              }}
            >
              All
            </button>
          </div>

          <button onClick={fetchProtocols} style={styles.refreshBtn}>
            ↻ Refresh
          </button>
        </div>

        {/* Error */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Table */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} onClick={() => handleSort('patient_name')}>
                  Patient {sortField === 'patient_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th} onClick={() => handleSort('program_name')}>
                  Program {sortField === 'program_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th}>Medication</th>
                <th style={styles.th} onClick={() => handleSort('start_date')}>
                  Started {sortField === 'start_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th} onClick={() => handleSort('end_date')}>
                  Days Left {sortField === 'end_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th}>Progress</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={styles.loading}>Loading protocols...</td>
                </tr>
              ) : sortedProtocols.length === 0 ? (
                <tr>
                  <td colSpan="8" style={styles.loading}>No protocols found</td>
                </tr>
              ) : (
                sortedProtocols.map(protocol => {
                  const daysLeftBadge = getDaysLeftBadge(protocol.end_date);
                  const statusBadge = getStatusBadge(protocol.status);
                  const total = protocol.total_sessions || protocol.duration_days || protocol.total_days || 10;
                  const completed = protocol.injections_completed || protocol.sessions_completed || 0;
                  const progress = Math.round((completed / total) * 100);

                  return (
                    <tr key={protocol.id} style={styles.tr}>
                      <td style={styles.td}>
                        <Link 
                          href={`/admin/protocols/${protocol.id}`}
                          style={styles.patientLink}
                        >
                          {protocol.patient_name}
                        </Link>
                        {protocol.patient_phone && (
                          <div style={styles.subText}>{protocol.patient_phone}</div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.programName}>
                          {protocol.program_name || protocol.program_type || '—'}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {protocol.primary_peptide || '—'}
                      </td>
                      <td style={styles.td}>
                        {formatDate(protocol.start_date)}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: daysLeftBadge.bg,
                          color: daysLeftBadge.color
                        }}>
                          {daysLeftBadge.text}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.progressCell}>
                          <div style={styles.progressBar}>
                            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                          </div>
                          <span style={styles.progressText}>{completed}/{total}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: statusBadge.bg,
                          color: statusBadge.color
                        }}>
                          {protocol.status || 'active'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <Link href={`/admin/protocols/${protocol.id}`} style={styles.viewBtn}>
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
  },
  header: {
    background: '#000',
    color: '#fff',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600'
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    opacity: 0.7
  },
  headerActions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  navLink: {
    color: 'rgba(255,255,255,0.8)',
    textDecoration: 'none',
    fontSize: '14px'
  },
  filterBar: {
    background: '#fff',
    borderBottom: '1px solid #e5e5e5',
    padding: '16px 24px',
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  searchInput: {
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    width: '280px'
  },
  filterGroup: {
    display: 'flex',
    border: '1px solid #ddd',
    borderRadius: '6px',
    overflow: 'hidden'
  },
  filterBtn: {
    padding: '10px 16px',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  refreshBtn: {
    padding: '10px 16px',
    background: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    marginLeft: 'auto'
  },
  error: {
    margin: '16px 24px',
    padding: '12px 16px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px'
  },
  tableWrapper: {
    padding: '24px',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    background: '#fff',
    borderRadius: '12px',
    borderCollapse: 'collapse',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '12px',
    textTransform: 'uppercase',
    color: '#666',
    borderBottom: '2px solid #e5e5e5',
    cursor: 'pointer',
    userSelect: 'none'
  },
  tr: {
    borderBottom: '1px solid #f0f0f0'
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  patientLink: {
    fontWeight: '600',
    color: '#000',
    textDecoration: 'none'
  },
  subText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '2px'
  },
  programName: {
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  progressCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  progressBar: {
    width: '60px',
    height: '6px',
    background: '#e5e5e5',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: '#000',
    borderRadius: '3px'
  },
  progressText: {
    fontSize: '12px',
    color: '#666'
  },
  viewBtn: {
    padding: '6px 14px',
    background: '#000',
    color: '#fff',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500'
  }
};
