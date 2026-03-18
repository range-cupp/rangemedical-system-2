// /pages/admin/protocols/index.js
// Protocols List - Unified view with category filters
// Range Medical

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import { CATEGORY_COLORS, getCategoryStyle } from '../../../lib/protocol-config';

function calculateCurrentDay(startDate) {
  if (!startDate) return 0;
  const parts = startDate.split('-');
  const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today - start;
  return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
}

// Category tabs config — grouped for simplicity
const CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'weight_loss', label: 'Weight Loss' },
  { key: 'hrt', label: 'HRT' },
  { key: 'peptide', label: 'Peptide' },
  { key: 'iv', label: 'IV / NAD' },
  { key: 'hbot', label: 'HBOT' },
  { key: 'rlt', label: 'RLT' },
  { key: 'injection', label: 'Injection' },
  { key: 'other', label: 'Other' },
];

// Normalize program_type to match our tab keys
function getCategoryKey(protocol) {
  const pt = (protocol.program_type || '').toLowerCase();
  // Direct matches
  if (['hrt', 'weight_loss', 'peptide', 'iv', 'hbot', 'rlt', 'injection'].includes(pt)) return pt;
  // Combo/membership → other
  if (pt === 'combo_membership' || pt === 'labs' || pt === 'phlebotomy' || pt === 'medication_pickup') return 'other';
  // Fallback detection from program name / medication
  const name = (protocol.program_name || '').toLowerCase();
  const med = (protocol.medication || '').toLowerCase();
  if (name.includes('hrt') || name.includes('testosterone') || name.includes('trt')) return 'hrt';
  if (['semaglutide', 'tirzepatide', 'retatrutide'].some(m => med.includes(m) || name.includes(m))) return 'weight_loss';
  if (name.includes('nad') || name.includes('iv ') || name.includes('vitamin c') || name.includes('glutathione')) return 'iv';
  if (name.includes('hbot') || name.includes('hyperbaric')) return 'hbot';
  if (name.includes('rlt') || name.includes('red light')) return 'rlt';
  if (name.includes('bpc') || name.includes('tb500') || name.includes('peptide') || name.includes('ipamorelin') || name.includes('sermorelin') || name.includes('tesamorelin')) return 'peptide';
  return 'other';
}

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
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
      setProtocols(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Error deleting protocol: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Build renewal map
  const renewalMap = {};
  renewals.forEach(r => { renewalMap[r.protocol_id] = r; });

  // Count by category (active only for badges)
  const categoryCounts = {};
  protocols.forEach(p => {
    if (p.status === 'active') {
      const cat = getCategoryKey(p);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  });

  // Filter protocols
  const filtered = statusFilter === 'renewals'
    ? []
    : protocols.filter(p => {
        // Status filter
        if (statusFilter === 'active' && p.status !== 'active') return false;

        // Category filter
        if (categoryFilter !== 'all') {
          const cat = getCategoryKey(p);
          if (cat !== categoryFilter) return false;
        }

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

  // Filter renewals by search + category
  const filteredRenewals = renewals.filter(r => {
    if (categoryFilter !== 'all') {
      const cat = getCategoryKey(r);
      if (cat !== categoryFilter) return false;
    }
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (r.patient_name || '').toLowerCase().includes(s) ||
      (r.program_name || '').toLowerCase().includes(s) ||
      (r.medication || '').toLowerCase().includes(s)
    );
  });

  // Sort by start date (newest first)
  const sorted = [...filtered].sort((a, b) =>
    new Date(b.start_date || 0) - new Date(a.start_date || 0)
  );

  const activeCount = protocols.filter(p => p.status === 'active').length;
  const totalCount = protocols.length;

  return (
    <AdminLayout title={`Protocols (${activeCount} active / ${totalCount} total)`}>
          {/* Category Tabs */}
          <div style={styles.categoryBar}>
            {CATEGORY_TABS.map(tab => {
              const isActive = categoryFilter === tab.key;
              const count = tab.key === 'all' ? activeCount : (categoryCounts[tab.key] || 0);
              const catStyle = tab.key !== 'all' ? getCategoryStyle(tab.key) : null;
              return (
                <button
                  key={tab.key}
                  onClick={() => setCategoryFilter(tab.key)}
                  style={{
                    ...styles.categoryTab,
                    background: isActive
                      ? (catStyle ? catStyle.bg : '#000')
                      : '#fff',
                    color: isActive
                      ? (catStyle ? catStyle.text : '#fff')
                      : '#666',
                    border: isActive
                      ? `1px solid ${catStyle ? catStyle.text : '#000'}`
                      : '1px solid #e5e5e5',
                    fontWeight: isActive ? '600' : '500',
                  }}
                >
                  {tab.label}
                  {count > 0 && (
                    <span style={{
                      marginLeft: '6px',
                      fontSize: '11px',
                      opacity: isActive ? 1 : 0.6,
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

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
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Program</th>
                      <th style={styles.th}>Medication</th>
                      <th style={styles.th}>Progress</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.thAction}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRenewals.map(r => {
                      const cat = getCategoryKey(r);
                      const catStyle = getCategoryStyle(cat);
                      return (
                        <tr key={r.protocol_id} style={styles.tr}>
                          <td style={styles.td}>
                            {r.patient_id ? (
                              <Link href={`/admin/patients/${r.patient_id}`} style={styles.patientLink}>
                                {r.patient_name || 'Unknown'}
                              </Link>
                            ) : (
                              <span style={styles.patientName}>{r.patient_name || 'Unknown'}</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.categoryBadge,
                              background: catStyle.bg,
                              color: catStyle.text,
                            }}>
                              {catStyle.label}
                            </span>
                          </td>
                          <td style={styles.td}>{r.program_name || r.program_type}</td>
                          <td style={styles.td}>{r.medication || '\u2014'}</td>
                          <td style={styles.td}>
                            <span style={{ fontSize: '13px', color: '#555' }}>
                              {r.tracking?.status_text || '\u2014'}
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
                          <td style={styles.tdAction}>
                            <Link href={`/admin/patients/${r.patient_id}`} style={styles.viewBtn}>
                              View Patient
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
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
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Program</th>
                    <th style={styles.th}>Medication</th>
                    <th style={styles.th}>Started</th>
                    <th style={styles.th}>Progress</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.thAction}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(protocol => {
                    const cat = getCategoryKey(protocol);
                    const catStyle = getCategoryStyle(cat);

                    // HRT / ongoing protocols
                    const isOngoing = cat === 'hrt';

                    // Weight loss protocols — track by injection count
                    const isWeightLoss = cat === 'weight_loss';

                    // Calculate total
                    let total;
                    if (isWeightLoss) {
                      total = protocol.total_sessions || 4;
                    } else {
                      const dayMatch = (protocol.program_name || '').match(/(\d+)[- ]?Day/i);
                      if (dayMatch) total = parseInt(dayMatch[1]);
                      if (!total) total = protocol.duration_days;
                      if (!total) total = protocol.total_sessions;
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
                            <span style={styles.patientName}>{protocol.patient_name || 'Unknown'}</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.categoryBadge,
                            background: catStyle.bg,
                            color: catStyle.text,
                          }}>
                            {catStyle.label}
                          </span>
                        </td>
                        <td style={styles.td}>{protocol.program_name || protocol.program_type}</td>
                        <td style={styles.td}>{protocol.medication || protocol.primary_peptide || protocol.selected_dose || '\u2014'}</td>
                        <td style={styles.td}>
                          {protocol.start_date ? new Date(protocol.start_date + 'T12:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : '\u2014'}
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
                                  {isEnded ? `\u2713 ${total}/${total}` : `${current}/${total}`}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{
                              ...styles.statusBadge,
                              background: isActive ? '#dcfce7' : protocol.status === 'exchanged' ? '#fef3c7' : '#f3f4f6',
                              color: isActive ? '#166534' : protocol.status === 'exchanged' ? '#92400e' : '#666'
                            }}>
                              {protocol.status === 'exchanged' ? '\ud83d\udd04 exchanged' : protocol.status}
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
                        <td style={styles.tdAction}>
                          <div style={styles.actionGroup}>
                            <Link href={`/admin/patients/${protocol.patient_id}`} style={styles.viewBtn}>
                              View Patient
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(protocol)}
                              style={styles.deleteBtn}
                            >
                              \ud83d\uddd1\ufe0f
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
  categoryBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  categoryTab: {
    padding: '7px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
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
  thAction: {
    textAlign: 'right',
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa',
    width: '160px',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0'
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  tdAction: {
    padding: '12px 16px',
    fontSize: '14px',
    textAlign: 'right',
    verticalAlign: 'middle',
    width: '160px',
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
  categoryBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
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
    display: 'inline-block',
    padding: '6px 14px',
    background: '#000',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    lineHeight: '1.4',
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
