// /pages/admin/protocols/index.js
// Protocols List - Clean UI
// Range Medical

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

function calculateCurrentDay(startDate) {
  if (!startDate) return 0;
  // Parse date string without timezone shift (new Date("2026-03-06") creates UTC midnight
  // which setHours(0,0,0,0) then shifts to previous day in west-of-UTC timezones)
  const parts = startDate.split('-');
  const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today - start;
  return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
}

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [deleteTarget, setDeleteTarget] = useState(null); // protocol to delete
  const [deleting, setDeleting] = useState(false);
  const [renewals, setRenewals] = useState([]);
  const [renewalsLoading, setRenewalsLoading] = useState(false);

  useEffect(() => {
    fetchProtocols();
    fetchRenewals();
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

  const fetchRenewals = async () => {
    setRenewalsLoading(true);
    try {
      const res = await fetch('/api/protocols/renewals');
      if (res.ok) {
        const data = await res.json();
        setRenewals(data.renewals || []);
      }
    } catch (err) {
      console.error('Error fetching renewals:', err);
    } finally {
      setRenewalsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/protocols?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      // Remove from local state
      setProtocols(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Error deleting protocol: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Build a map of protocol_id -> renewal info for badge display
  const renewalMap = {};
  renewals.forEach(r => { renewalMap[r.protocol_id] = r; });

  // Filter protocols
  const filtered = statusFilter === 'renewals'
    ? [] // renewals view uses its own data
    : protocols.filter(p => {
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

  // For renewals view, filter renewals by search
  const filteredRenewals = renewals.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (r.patient_name || '').toLowerCase().includes(s) ||
      (r.program_name || '').toLowerCase().includes(s) ||
      (r.medication || '').toLowerCase().includes(s)
    );
  });

  // Sort by start date (newest first) for normal view
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
              <button
                onClick={() => setStatusFilter('renewals')}
                style={{
                  ...styles.filterBtn,
                  background: statusFilter === 'renewals' ? '#92400e' : '#fff',
                  color: statusFilter === 'renewals' ? '#fff' : '#92400e',
                  border: statusFilter === 'renewals' ? 'none' : '1px solid #fef3c7'
                }}
              >
                Renewals{renewals.length > 0 ? ` (${renewals.length})` : ''}
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={styles.tableCard}>
            {(statusFilter === 'renewals' ? renewalsLoading : loading) ? (
              <div style={styles.loading}>{statusFilter === 'renewals' ? 'Loading renewals...' : 'Loading protocols...'}</div>
            ) : statusFilter === 'renewals' ? (
              filteredRenewals.length === 0 ? (
                <div style={styles.empty}>No protocols need renewal</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Patient</th>
                      <th style={styles.th}>Program</th>
                      <th style={styles.th}>Medication</th>
                      <th style={styles.th}>Progress</th>
                      <th style={styles.th}>Status</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRenewals.map(r => (
                      <tr key={r.protocol_id} style={styles.tr}>
                        <td style={styles.td}>
                          {r.patient_id ? (
                            <Link href={`/admin/patients/${r.patient_id}`} style={styles.patientLink}>
                              {r.patient_name || 'Unknown'}
                            </Link>
                          ) : (
                            <div style={styles.patientName}>{r.patient_name || 'Unknown'}</div>
                          )}
                        </td>
                        <td style={styles.td}>{r.program_name || r.program_type}</td>
                        <td style={styles.td}>{r.medication || '—'}</td>
                        <td style={styles.td}>
                          <span style={{ fontSize: '13px', color: '#555' }}>
                            {r.tracking?.status_text || '—'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            background: r.renewal_urgency_color?.bg || '#fef3c7',
                            color: r.renewal_urgency_color?.text || '#92400e'
                          }}>
                            {r.renewal_label}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <Link href={`/admin/protocols/${r.protocol_id}`} style={styles.viewBtn}>
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
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
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(protocol => {
                    // Detect protocol category
                    const programType = (protocol.program_type || '').toLowerCase();
                    const programName = (protocol.program_name || '').toLowerCase();

                    // HRT / ongoing protocols
                    const isOngoing = programType.includes('hrt') ||
                      programName.includes('hrt') || programName.includes('testosterone');

                    // Weight loss protocols — track by injection count (sessions_used)
                    const isWeightLoss = !isOngoing && (programType.includes('weight_loss') ||
                      ['semaglutide', 'tirzepatide', 'retatrutide'].some(m => programName.includes(m) || (protocol.medication || '').toLowerCase().includes(m)));

                    // Calculate total: for weight loss use total_sessions (injection count),
                    // otherwise parse from program name first (source of truth for X-Day protocols)
                    let total;
                    if (isWeightLoss) {
                      total = protocol.total_sessions || 4;
                    } else {
                      // 1. Parse from program name (e.g., "10-Day Recovery Protocol" → 10)
                      const dayMatch = (protocol.program_name || '').match(/(\d+)[- ]?Day/i);
                      if (dayMatch) total = parseInt(dayMatch[1]);
                      // 2. duration_days from DB
                      if (!total) total = protocol.duration_days;
                      // 3. total_sessions from DB
                      if (!total) total = protocol.total_sessions;
                      // 4. Compute from date range as last resort
                      if (!total && protocol.start_date && protocol.end_date) {
                        const sp = protocol.start_date.split('-');
                        const ep = protocol.end_date.split('-');
                        const s = new Date(parseInt(sp[0]), parseInt(sp[1]) - 1, parseInt(sp[2]));
                        const e = new Date(parseInt(ep[0]), parseInt(ep[1]) - 1, parseInt(ep[2]));
                        total = Math.round((e - s) / (1000 * 60 * 60 * 24));
                      }
                      if (!total) total = 10;
                    }
                    const current = isWeightLoss
                      ? (protocol.sessions_used || 0)
                      : calculateCurrentDay(protocol.start_date);
                    const isEnded = isOngoing ? false : (isWeightLoss
                      ? current >= total
                      : current > total);
                    const isActive = protocol.status === 'active';
                    const progress = isOngoing ? 100 : Math.min(100, Math.round((current / total) * 100));
                    const renewal = renewalMap[protocol.id];

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
                          {protocol.start_date ? new Date(protocol.start_date + 'T12:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : '—'}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.progressContainer}>
                            {isOngoing ? (
                              <span style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: isActive ? '#166534' : '#666',
                                background: isActive ? '#dcfce7' : '#f3f4f6',
                                padding: '3px 10px',
                                borderRadius: '10px'
                              }}>
                                Ongoing
                              </span>
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{
                              ...styles.statusBadge,
                              background: isActive ? '#dcfce7' : '#f3f4f6',
                              color: isActive ? '#166534' : '#666'
                            }}>
                              {protocol.status}
                            </span>
                            {renewal && (
                              <span style={{
                                ...styles.statusBadge,
                                background: renewal.renewal_urgency_color?.bg || '#fef3c7',
                                color: renewal.renewal_urgency_color?.text || '#92400e'
                              }}>
                                {renewal.renewal_label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <div style={styles.actionGroup}>
                            <Link href={`/admin/protocols/${protocol.id}`} style={styles.viewBtn}>
                              View
                            </Link>
                            <Link href={`/admin/protocols/${protocol.id}?edit=true`} style={styles.editBtn}>
                              Edit
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(protocol)}
                              style={styles.deleteBtn}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {deleteTarget && (
            <>
              <div onClick={() => !deleting && setDeleteTarget(null)} style={styles.overlay} />
              <div style={styles.modal}>
                <h3 style={styles.modalTitle}>Delete Protocol</h3>
                <p style={styles.modalText}>
                  Are you sure you want to delete the protocol for <strong>{deleteTarget.patient_name || 'Unknown'}</strong>?
                </p>
                <p style={styles.modalDetail}>
                  {deleteTarget.program_name || deleteTarget.program_type} · Started {deleteTarget.start_date ? new Date(deleteTarget.start_date + 'T12:00:00').toLocaleDateString() : 'N/A'}
                </p>
                <p style={styles.modalWarning}>
                  This will also delete all injection logs and unlink any purchases. This cannot be undone.
                </p>
                <div style={styles.modalActions}>
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={styles.confirmDeleteBtn}
                  >
                    {deleting ? 'Deleting...' : 'Delete Protocol'}
                  </button>
                </div>
              </div>
            </>
          )}
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
  actionGroup: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  viewBtn: {
    padding: '6px 12px',
    background: '#000',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textDecoration: 'none'
  },
  editBtn: {
    padding: '6px 12px',
    background: '#f5f5f5',
    color: '#000',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textDecoration: 'none',
    border: '1px solid #e5e5e5'
  },
  deleteBtn: {
    padding: '4px 8px',
    background: 'transparent',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    lineHeight: 1
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 10000
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    zIndex: 10001,
    width: '90%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  modalTitle: {
    margin: '0 0 12px',
    fontSize: '18px',
    fontWeight: '700'
  },
  modalText: {
    margin: '0 0 8px',
    fontSize: '14px',
    color: '#374151'
  },
  modalDetail: {
    margin: '0 0 12px',
    fontSize: '13px',
    color: '#6b7280'
  },
  modalWarning: {
    margin: '0 0 20px',
    fontSize: '13px',
    color: '#dc2626',
    background: '#fee2e2',
    padding: '10px 12px',
    borderRadius: '8px'
  },
  modalActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
    padding: '8px 20px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  },
  confirmDeleteBtn: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '6px',
    background: '#dc2626',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  }
};
