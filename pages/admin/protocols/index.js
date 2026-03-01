// /pages/admin/protocols/index.js
// Protocols List - Clean UI
// Range Medical

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

function calculateCurrentDay(startDate) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = today - start;
  return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
}

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    fetchProtocols();
  }, []);

  const fetchProtocols = async () => {
    try {
      const res = await fetch('/api/admin/protocols');
      if (res.ok) {
        const data = await res.json();
        setProtocols(data.protocols || data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter protocols
  const filtered = protocols.filter(p => {
    // Status filter
    if (statusFilter === 'active' && p.status !== 'active') return false;
    
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      return (
        (p.patient_name || '').toLowerCase().includes(s) ||
        (p.program_name || '').toLowerCase().includes(s) ||
        (p.medication || '').toLowerCase().includes(s) ||
        (p.primary_peptide || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Sort by start date (newest first)
  const sorted = [...filtered].sort((a, b) => 
    new Date(b.start_date || 0) - new Date(a.start_date || 0)
  );

  const activeCount = protocols.filter(p => p.status === 'active').length;
  const totalCount = protocols.length;

  return (
    <AdminLayout title={`Protocols (${activeCount} active / ${totalCount} total)`}>
          {/* Toolbar */}
          <div style={styles.toolbar}>
            <input
              type="text"
              placeholder="Search by patient or program..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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
          </div>

          {/* Table */}
          <div style={styles.tableCard}>
            {loading ? (
              <div style={styles.loading}>Loading protocols...</div>
            ) : sorted.length === 0 ? (
              <div style={styles.empty}>No protocols found</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Program</th>
                    <th style={styles.th}>Medication</th>
                    <th style={styles.th}>Started</th>
                    <th style={styles.th}>Progress</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(protocol => {
                    const total = protocol.total_sessions || protocol.duration_days || 10;
                    const current = calculateCurrentDay(protocol.start_date);
                    const isEnded = current > total;
                    const isActive = protocol.status === 'active';
                    const progress = Math.min(100, Math.round((current / total) * 100));

                    return (
                      <tr key={protocol.id} style={styles.tr}>
                        <td style={styles.td}>
                          {protocol.patient_id ? (
                            <Link href={`/admin/patients/${protocol.patient_id}`} style={styles.patientLink}>
                              {protocol.patient_name || 'Unknown'}
                            </Link>
                          ) : (
                            <div style={styles.patientName}>{protocol.patient_name || 'Unknown'}</div>
                          )}
                        </td>
                        <td style={styles.td}>{protocol.program_name || protocol.program_type}</td>
                        <td style={styles.td}>{protocol.medication || protocol.primary_peptide || protocol.selected_dose || '—'}</td>
                        <td style={styles.td}>
                          {protocol.start_date ? new Date(protocol.start_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : '—'}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.progressContainer}>
                            <div style={styles.progressBar}>
                              <div style={{ 
                                ...styles.progressFill, 
                                width: `${progress}%`,
                                background: isEnded ? '#22c55e' : '#000'
                              }} />
                            </div>
                            <span style={styles.progressText}>
                              {isEnded ? `✓ ${total}/${total}` : `${current}/${total}`}
                            </span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            background: isActive ? '#dcfce7' : '#f3f4f6',
                            color: isActive ? '#166534' : '#666'
                          }}>
                            {protocol.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <Link href={`/admin/protocols/${protocol.id}`} style={styles.viewBtn}>
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
    </AdminLayout>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px'
  },
  toolbar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    maxWidth: '400px',
    padding: '10px 14px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff'
  },
  filterGroup: {
    display: 'flex',
    gap: '4px',
    background: '#fff',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid #e5e5e5'
  },
  filterBtn: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  tableCard: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa'
  },
  tr: {
    borderBottom: '1px solid #f0f0f0'
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px'
  },
  patientName: {
    fontWeight: '500'
  },
  patientLink: {
    fontWeight: '600',
    color: '#111',
    textDecoration: 'none',
    fontSize: '14px'
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  progressBar: {
    width: '80px',
    height: '6px',
    background: '#e5e5e5',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s'
  },
  progressText: {
    fontSize: '12px',
    color: '#666',
    whiteSpace: 'nowrap'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  viewBtn: {
    padding: '6px 12px',
    background: '#000',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textDecoration: 'none'
  }
};
