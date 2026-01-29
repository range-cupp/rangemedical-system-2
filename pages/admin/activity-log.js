// /pages/admin/activity-log.js
// View and edit all injection logs with weight tracking
// Range Medical - 2026-01-28

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchLogs();
  }, [dateRange]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/injection-logs?days=${dateRange}`);
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = dateStr.length === 10 ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
  };

  const getCategoryBadge = (category) => {
    const badges = {
      weight_loss: { emoji: '💉', color: '#bbf7d0', text: 'Weight Loss' },
      hrt: { emoji: '💊', color: '#fed7aa', text: 'HRT' },
      peptide: { emoji: '🧬', color: '#ddd6fe', text: 'Peptide' },
      iv: { emoji: '💧', color: '#bfdbfe', text: 'IV' },
      hbot: { emoji: '🫁', color: '#fecaca', text: 'HBOT' },
      rlt: { emoji: '🔴', color: '#fecdd3', text: 'RLT' },
    };
    return badges[category] || { emoji: '📋', color: '#e5e7eb', text: category || 'Other' };
  };

  const openEditModal = (log) => {
    setEditModal(log);
    setEditForm({
      weight: log.weight || '',
      dosage: log.dosage || '',
      entry_date: log.entry_date ? log.entry_date.split('T')[0] : '',
      notes: log.notes || '',
      site: log.site || ''
    });
  };

  const closeEditModal = () => {
    setEditModal(null);
    setEditForm({});
  };

  const submitEdit = async () => {
    if (!editModal) return;
    setSubmitting(true);

    try {
      const payload = {
        weight: editForm.weight ? parseFloat(editForm.weight) : null,
        dosage: editForm.dosage || null,
        entry_date: editForm.entry_date || null,
        notes: editForm.notes || null,
        site: editForm.site || null
      };

      const res = await fetch(`/api/injection-logs/${editModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        showToast('Log updated!');
        closeEditModal();
        fetchLogs();
      } else {
        showToast(result.error || 'Failed to update', 'error');
      }
    } catch (err) {
      showToast('Error updating log', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLog = async (log) => {
    if (!confirm(`Delete this log entry?\n\n${log.patient_name || 'Unknown'} - ${log.medication || log.category}\n${formatDate(log.entry_date)}`)) return;

    try {
      const res = await fetch(`/api/injection-logs/${log.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast('Log deleted');
        fetchLogs();
      } else {
        showToast(result.error || 'Failed to delete', 'error');
      }
    } catch (err) {
      showToast('Error deleting log', 'error');
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.category !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (log.patient_name || '').toLowerCase().includes(term) ||
             (log.medication || '').toLowerCase().includes(term);
    }
    return true;
  });

  if (loading) return <div style={styles.container}><div style={styles.loading}>Loading activity logs...</div></div>;
  if (error) return <div style={styles.container}><div style={styles.error}>Error: {error}</div></div>;

  return (
    <>
      <Head><title>Activity Log | Range Medical</title></Head>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📋 Activity Log</h1>
            <p style={styles.subtitle}>View and edit all logged injections and activities</p>
          </div>
          <div style={styles.headerActions}>
            <input
              type="text"
              placeholder="Search patient or medication..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={styles.select}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <button style={styles.refreshBtn} onClick={fetchLogs}>↻ Refresh</button>
            <a href="/admin/pipeline" style={styles.backBtn}>← Back to Pipeline</a>
          </div>
        </div>

        <div style={styles.filters}>
          {[
            { value: 'all', label: 'All' },
            { value: 'weight_loss', label: '💉 Weight Loss' },
            { value: 'hrt', label: '💊 HRT' },
            { value: 'peptide', label: '🧬 Peptide' },
            { value: 'iv', label: '💧 IV' },
          ].map(f => (
            <button
              key={f.value}
              style={{ ...styles.filterBtn, ...(filter === f.value ? styles.filterBtnActive : {}) }}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{filteredLogs.length}</div>
            <div style={styles.statLabel}>Total Logs</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{filteredLogs.filter(l => l.category === 'weight_loss').length}</div>
            <div style={styles.statLabel}>Weight Loss</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{filteredLogs.filter(l => l.weight).length}</div>
            <div style={styles.statLabel}>With Weight</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{filteredLogs.filter(l => l.category === 'weight_loss' && !l.weight).length}</div>
            <div style={styles.statLabel}>Missing Weight</div>
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.headerCell}>DATE</th>
                <th style={styles.headerCell}>PATIENT</th>
                <th style={styles.headerCell}>TYPE</th>
                <th style={styles.headerCell}>MEDICATION</th>
                <th style={styles.headerCell}>DOSE</th>
                <th style={styles.headerCell}>WEIGHT</th>
                <th style={styles.headerCell}>NOTES</th>
                <th style={styles.headerCell}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr><td colSpan="8" style={{ ...styles.cell, textAlign: 'center', padding: '40px', color: '#6b7280' }}>No logs found</td></tr>
              ) : (
                filteredLogs.map(log => {
                  const badge = getCategoryBadge(log.category);
                  const needsWeight = log.category === 'weight_loss' && !log.weight;
                  return (
                    <tr key={log.id} style={{ ...styles.row, ...(needsWeight ? { background: '#fffbeb' } : {}) }}>
                      <td style={styles.cell}>{formatDate(log.entry_date)}</td>
                      <td style={styles.cell}>
                        <a href={`/admin/patient/${log.patient_id}`} style={styles.patientLink}>
                          {log.patient_name || 'Unknown'}
                        </a>
                      </td>
                      <td style={styles.cell}>
                        <span style={{ ...styles.badge, background: badge.color }}>
                          {badge.emoji} {badge.text}
                        </span>
                      </td>
                      <td style={styles.cell}>{log.medication || '-'}</td>
                      <td style={styles.cell}>{log.dosage || '-'}</td>
                      <td style={styles.cell}>
                        {log.weight ? (
                          <span style={styles.weightValue}>{log.weight} lbs</span>
                        ) : log.category === 'weight_loss' ? (
                          <span style={styles.missingWeight}>⚠️ Missing</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={styles.cell}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{log.notes || '-'}</span>
                      </td>
                      <td style={styles.cellActions}>
                        <button style={{ ...styles.actionBtn, ...styles.editBtn }} onClick={() => openEditModal(log)}>✏️ Edit</button>
                        <button style={{ ...styles.actionBtn, ...styles.deleteBtn }} onClick={() => deleteLog(log)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {editModal && (
          <div style={styles.modalOverlay} onClick={closeEditModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>✏️ Edit Log Entry</h2>
              <div style={styles.patientBadge}>
                <div style={{ fontWeight: '600' }}>{editModal.patient_name || 'Unknown'}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {getCategoryBadge(editModal.category).emoji} {editModal.medication || editModal.category} • {formatDate(editModal.entry_date)}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Date</label>
                <input
                  type="date"
                  value={editForm.entry_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, entry_date: e.target.value })}
                  style={styles.formInput}
                />
              </div>

              {(editModal.category === 'weight_loss' || editModal.weight) && (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Weight (lbs) {editModal.category === 'weight_loss' && <span style={{ color: '#dc2626' }}>*</span>}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.weight || ''}
                    onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                    placeholder="e.g. 215.5"
                    style={styles.formInput}
                  />
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Dose</label>
                <input
                  type="text"
                  value={editForm.dosage || ''}
                  onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                  placeholder="e.g. 2.5mg"
                  style={styles.formInput}
                />
              </div>

              {editModal.category === 'hrt' && (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Injection Site</label>
                  <select
                    value={editForm.site || ''}
                    onChange={(e) => setEditForm({ ...editForm, site: e.target.value })}
                    style={styles.formSelect}
                  >
                    <option value="">Select site...</option>
                    <option value="Deltoid - Left">Deltoid - Left</option>
                    <option value="Deltoid - Right">Deltoid - Right</option>
                    <option value="Glute - Left">Glute - Left</option>
                    <option value="Glute - Right">Glute - Right</option>
                    <option value="Thigh - Left">Thigh - Left</option>
                    <option value="Thigh - Right">Thigh - Right</option>
                  </select>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Notes</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Any observations..."
                  style={styles.formTextarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button style={styles.modalCancelBtn} onClick={closeEditModal}>Cancel</button>
                <button style={styles.modalConfirmBtn} onClick={submitEdit} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div style={{ ...styles.toast, background: toast.type === 'error' ? '#dc2626' : '#22c55e' }}>
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: '#f8f9fa', minHeight: '100vh', padding: '20px' },
  loading: { textAlign: 'center', padding: '60px', color: '#6b7280' },
  error: { textAlign: 'center', padding: '60px', color: '#dc2626' },
  header: { maxWidth: '1400px', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#111', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: 0 },
  headerActions: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  searchInput: { padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', width: '220px', outline: 'none' },
  select: { padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: 'white', outline: 'none' },
  refreshBtn: { padding: '8px 16px', border: '2px solid #e5e7eb', background: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  backBtn: { padding: '8px 16px', border: '2px solid #111', background: '#111', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', textDecoration: 'none' },
  filters: { maxWidth: '1400px', margin: '0 auto 20px', display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterBtn: { padding: '8px 16px', border: '2px solid #e5e7eb', background: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#374151' },
  filterBtnActive: { background: '#111', color: 'white', borderColor: '#111' },
  stats: { maxWidth: '1400px', margin: '0 auto 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' },
  statCard: { background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  statValue: { fontSize: '28px', fontWeight: '700', color: '#111' },
  statLabel: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  tableContainer: { maxWidth: '1400px', margin: '0 auto', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  headerRow: { background: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  headerCell: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', letterSpacing: '0.5px' },
  row: { borderBottom: '1px solid #f3f4f6' },
  cell: { padding: '12px 16px', fontSize: '14px', color: '#111' },
  cellActions: { padding: '12px 16px', display: 'flex', gap: '6px' },
  patientLink: { color: '#111', textDecoration: 'none', fontWeight: '500' },
  badge: { display: 'inline-block', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' },
  weightValue: { fontWeight: '600', color: '#059669' },
  missingWeight: { color: '#f59e0b', fontWeight: '500', fontSize: '12px' },
  actionBtn: { padding: '6px 10px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' },
  editBtn: { background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' },
  deleteBtn: { background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '450px', maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111' },
  patientBadge: { background: '#f3f4f6', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' },
  modalCancelBtn: { padding: '10px 20px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  modalConfirmBtn: { padding: '10px 20px', border: 'none', background: '#111', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  formGroup: { marginBottom: '16px' },
  formLabel: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' },
  formInput: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  formSelect: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' },
  formTextarea: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' },
  toast: { position: 'fixed', bottom: '20px', right: '20px', padding: '12px 20px', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 1001, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
};
