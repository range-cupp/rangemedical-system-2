// /pages/admin/activity-log.js
// Activity Log - Shows all logged activities across all protocols
// Range Medical - 2026-01-17

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/injection-logs?limit=500');
      const json = await res.json();
      if (json.success) {
        setLogs(json.logs || []);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered logs
  const getFilteredLogs = () => {
    let filtered = logs;
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }
    
    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(log => log.entry_date === dateFilter);
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        (log.patient_name || '').toLowerCase().includes(term) ||
        (log.medication || '').toLowerCase().includes(term) ||
        (log.notes || '').toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  // Get category badge
  const getCategoryBadge = (category) => {
    const badges = {
      peptide: { emoji: '🧬', color: '#ddd6fe', text: 'Peptide' },
      weight_loss: { emoji: '💉', color: '#bbf7d0', text: 'Weight Loss' },
      hrt: { emoji: '💊', color: '#fed7aa', text: 'HRT' },
      testosterone: { emoji: '💊', color: '#fed7aa', text: 'HRT' },
      iv: { emoji: '💧', color: '#bfdbfe', text: 'IV' },
      hbot: { emoji: '🫁', color: '#fecaca', text: 'HBOT' },
      rlt: { emoji: '🔴', color: '#fecdd3', text: 'RLT' },
      injection: { emoji: '💉', color: '#e9d5ff', text: 'Injection' },
      vitamin: { emoji: '💊', color: '#fef3c7', text: 'Vitamin' }
    };
    return badges[category] || { emoji: '📋', color: '#e5e7eb', text: category || 'Other' };
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Format time
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get unique categories from logs
  const categories = [...new Set(logs.map(l => l.category).filter(Boolean))];

  // Get stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = logs.filter(l => l.entry_date === todayStr).length;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split('T')[0];
  const weekCount = logs.filter(l => l.entry_date >= weekStr).length;

  const filteredLogs = getFilteredLogs();

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading activity log...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Activity Log | Range Medical</title>
      </Head>
      
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📋 Activity Log</h1>
            <p style={styles.subtitle}>All logged injections, sessions, and pickups</p>
          </div>
          
          <div style={styles.headerActions}>
            <a href="/admin/pipeline" style={styles.backBtn}>
              ← Back to Pipeline
            </a>
            <button style={styles.refreshBtn} onClick={fetchLogs}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsBar}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>TODAY</div>
            <div style={styles.statValue}>{todayCount}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>THIS WEEK</div>
            <div style={styles.statValue}>{weekCount}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>TOTAL LOGS</div>
            <div style={styles.statValue}>{logs.length}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>SHOWING</div>
            <div style={styles.statValue}>{filteredLogs.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <input
            type="text"
            placeholder="Search patient or medication..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={styles.dateInput}
          />
          {dateFilter && (
            <button 
              style={styles.clearBtn}
              onClick={() => setDateFilter('')}
            >
              ✕
            </button>
          )}
          
          <div style={styles.categoryTabs}>
            <button
              style={{
                ...styles.categoryTab,
                ...(categoryFilter === 'all' ? styles.categoryTabActive : {})
              }}
              onClick={() => setCategoryFilter('all')}
            >
              All
            </button>
            {categories.map(cat => {
              const badge = getCategoryBadge(cat);
              return (
                <button
                  key={cat}
                  style={{
                    ...styles.categoryTab,
                    ...(categoryFilter === cat ? styles.categoryTabActive : {})
                  }}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {badge.emoji} {badge.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {filteredLogs.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <p>No activity logs found</p>
            {(searchTerm || dateFilter || categoryFilter !== 'all') && (
              <button 
                style={styles.clearFiltersBtn}
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                  setCategoryFilter('all');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.headerCell}>DATE</th>
                  <th style={styles.headerCell}>PATIENT</th>
                  <th style={styles.headerCell}>TYPE</th>
                  <th style={styles.headerCell}>MEDICATION</th>
                  <th style={styles.headerCell}>DOSE</th>
                  <th style={styles.headerCell}>ENTRY</th>
                  <th style={styles.headerCell}>NOTES</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const badge = getCategoryBadge(log.category);
                  return (
                    <tr key={log.id} style={styles.row}>
                      <td style={styles.cell}>
                        <div style={{ fontWeight: '500' }}>{formatDate(log.entry_date)}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {formatTime(log.created_at)}
                        </div>
                      </td>
                      <td style={styles.cell}>
                        <a 
                          href={`/admin/patient/${log.patient_id}`}
                          style={styles.patientLink}
                        >
                          {log.patient_name || 'Unknown'}
                        </a>
                      </td>
                      <td style={styles.cell}>
                        <span style={{ ...styles.categoryBadge, background: badge.color }}>
                          {badge.emoji} {badge.text}
                        </span>
                      </td>
                      <td style={styles.cell}>{log.medication || '-'}</td>
                      <td style={styles.cell}>{log.dosage || '-'}</td>
                      <td style={styles.cell}>
                        <span style={{
                          ...styles.entryTypeBadge,
                          background: log.entry_type === 'pickup' ? '#dbeafe' : '#f0fdf4',
                          color: log.entry_type === 'pickup' ? '#1d4ed8' : '#166534'
                        }}>
                          {log.entry_type === 'pickup' 
                            ? '📦 Pickup' 
                            : ['hbot', 'iv', 'rlt'].includes(log.category) 
                              ? '🗓️ Session' 
                              : '💉 Injection'}
                        </span>
                      </td>
                      <td style={styles.cell}>
                        <span style={styles.notes}>
                          {log.notes || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: '#f8f9fa',
    minHeight: '100vh',
    padding: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#6b7280'
  },
  error: {
    textAlign: 'center',
    padding: '60px',
    color: '#dc2626'
  },
  header: {
    maxWidth: '1400px',
    margin: '0 auto 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0 0'
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  backBtn: {
    padding: '8px 16px',
    border: '2px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    textDecoration: 'none',
    cursor: 'pointer'
  },
  refreshBtn: {
    padding: '8px 16px',
    border: '2px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  statsBar: {
    maxWidth: '1400px',
    margin: '0 auto 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px'
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    borderLeft: '4px solid #111'
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: '0.5px'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111'
  },
  filters: {
    maxWidth: '1400px',
    margin: '0 auto 20px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  searchInput: {
    padding: '8px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    width: '250px',
    outline: 'none'
  },
  dateInput: {
    padding: '8px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  },
  clearBtn: {
    padding: '6px 10px',
    border: 'none',
    background: '#f3f4f6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  categoryTabs: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  categoryTab: {
    padding: '6px 12px',
    border: '2px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500'
  },
  categoryTabActive: {
    background: '#111',
    color: 'white',
    borderColor: '#111'
  },
  tableContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  headerRow: {
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb'
  },
  headerCell: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: '0.5px'
  },
  row: {
    borderBottom: '1px solid #f3f4f6'
  },
  cell: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#111'
  },
  patientLink: {
    color: '#111',
    textDecoration: 'none',
    fontWeight: '500'
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500'
  },
  entryTypeBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600'
  },
  notes: {
    fontSize: '13px',
    color: '#6b7280',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    color: '#6b7280',
    maxWidth: '1400px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px'
  },
  clearFiltersBtn: {
    marginTop: '16px',
    padding: '8px 16px',
    border: '2px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};
