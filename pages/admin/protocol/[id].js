// /pages/admin/protocol/[id].js
// Protocol Detail Page - View and edit individual protocols
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ProtocolDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [protocol, setProtocol] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) fetchProtocol();
  }, [id]);

  async function fetchProtocol() {
    setLoading(true);
    try {
      const res = await fetch(`/api/protocols/${id}`);
      if (!res.ok) throw new Error('Protocol not found');
      const data = await res.json();
      setProtocol(data.protocol);
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal() {
    setEditForm({
      medication: protocol.medication || '',
      selected_dose: protocol.selected_dose || '',
      frequency: protocol.frequency || '',
      delivery_method: protocol.delivery_method || '',
      start_date: protocol.start_date ? protocol.start_date.split('T')[0] : '',
      end_date: protocol.end_date ? protocol.end_date.split('T')[0] : '',
      total_sessions: protocol.total_sessions || '',
      sessions_used: protocol.sessions_used || 0,
      status: protocol.status || 'active',
      notes: protocol.notes || ''
    });
    setShowEditModal(true);
  }

  async function submitEdit() {
    setSaving(true);
    try {
      const res = await fetch(`/api/protocols/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchProtocol();
      } else {
        alert('Failed to update');
      }
    } catch (err) {
      alert('Error updating protocol');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProtocol() {
    if (!confirm('Are you sure you want to delete this protocol? This cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/protocols/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.push('/admin/pipeline?tab=active');
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      alert('Error deleting protocol');
    }
  }

  // Format delivery method for display
  function formatDelivery(method) {
    if (!method) return '-';
    if (method === 'take_home') return 'Take Home';
    if (method === 'in_clinic') return 'In Clinic';
    return method;
  }

  // Get status badge color
  function getStatusColor(status) {
    switch (status) {
      case 'active': return { bg: '#ecfdf5', color: '#059669' };
      case 'completed': return { bg: '#f0fdf4', color: '#16a34a' };
      case 'paused': return { bg: '#fef3c7', color: '#d97706' };
      case 'cancelled': return { bg: '#fef2f2', color: '#dc2626' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '24px'
    },
    content: {
      maxWidth: '800px',
      margin: '0 auto'
    },
    backLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      color: '#64748b',
      textDecoration: 'none',
      fontSize: '14px',
      marginBottom: '24px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '32px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#111',
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '15px',
      color: '#64748b'
    },
    patientLink: {
      color: '#2563eb',
      textDecoration: 'none'
    },
    headerActions: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    btn: {
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      border: '1px solid #e2e8f0',
      background: '#fff'
    },
    btnDelete: {
      color: '#dc2626',
      borderColor: '#fecaca'
    },
    statusBadge: (status) => {
      const colors = getStatusColor(status);
      return {
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        background: colors.bg,
        color: colors.color,
        textTransform: 'capitalize'
      };
    },
    card: {
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '20px',
      color: '#111'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px'
    },
    field: {
      marginBottom: '4px'
    },
    fieldLabel: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '4px'
    },
    fieldValue: {
      fontSize: '15px',
      color: '#111'
    },
    logsEmpty: {
      textAlign: 'center',
      padding: '40px',
      color: '#94a3b8'
    },
    logItem: {
      padding: '12px 0',
      borderBottom: '1px solid #f1f5f9',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    // Modal styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      background: '#fff',
      borderRadius: '16px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto'
    },
    modalHeader: {
      padding: '20px 24px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: '600'
    },
    modalClose: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#94a3b8'
    },
    modalBody: {
      padding: '24px'
    },
    modalFooter: {
      padding: '16px 24px',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '500',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      background: '#fff'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>
      </div>
    );
  }

  if (error || !protocol) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <h2>Protocol not found</h2>
          <Link href="/admin/pipeline">← Back to Pipeline</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{protocol.program_name || 'Protocol'} | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <div style={styles.content}>
          {/* Back Link */}
          <Link href="/admin/pipeline?tab=active" style={styles.backLink}>
            ← Back
          </Link>

          {/* Header */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>
                {protocol.program_name || protocol.medication || 'Protocol'}
              </h1>
              <div style={styles.subtitle}>
                {protocol.patient_id ? (
                  <Link href={`/patients/${protocol.patient_id}`} style={styles.patientLink}>
                    {protocol.patient_name || 'Unknown Patient'}
                  </Link>
                ) : (
                  protocol.patient_name || 'Unknown Patient'
                )}
                {protocol.delivery_method && ` • ${formatDelivery(protocol.delivery_method)}`}
              </div>
            </div>
            <div style={styles.headerActions}>
              <button style={styles.btn} onClick={openEditModal}>Edit</button>
              <button style={{...styles.btn, ...styles.btnDelete}} onClick={deleteProtocol}>Delete</button>
              <span style={styles.statusBadge(protocol.status)}>
                {protocol.status || 'Active'}
              </span>
            </div>
          </div>

          {/* Protocol Details Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Protocol Details</h3>
            <div style={styles.grid}>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Program</div>
                <div style={styles.fieldValue}>{protocol.program_name || '-'}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Medication</div>
                <div style={styles.fieldValue}>{protocol.medication || '-'}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Frequency</div>
                <div style={styles.fieldValue}>{protocol.frequency || '-'}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Delivery</div>
                <div style={styles.fieldValue}>{formatDelivery(protocol.delivery_method)}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Dose</div>
                <div style={styles.fieldValue}>{protocol.selected_dose || '-'}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Duration</div>
                <div style={styles.fieldValue}>
                  {protocol.duration_days ? `${protocol.duration_days} days` : '-'}
                </div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Start Date</div>
                <div style={styles.fieldValue}>
                  {protocol.start_date ? new Date(protocol.start_date).toLocaleDateString() : '-'}
                </div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>End Date</div>
                <div style={styles.fieldValue}>
                  {protocol.end_date ? new Date(protocol.end_date).toLocaleDateString() : '-'}
                </div>
              </div>
              {protocol.total_sessions && (
                <>
                  <div style={styles.field}>
                    <div style={styles.fieldLabel}>Sessions Used</div>
                    <div style={styles.fieldValue}>{protocol.sessions_used || 0}</div>
                  </div>
                  <div style={styles.field}>
                    <div style={styles.fieldLabel}>Total Sessions</div>
                    <div style={styles.fieldValue}>{protocol.total_sessions}</div>
                  </div>
                </>
              )}
            </div>
            {protocol.notes && (
              <div style={{ marginTop: '20px' }}>
                <div style={styles.fieldLabel}>Notes</div>
                <div style={{ ...styles.fieldValue, whiteSpace: 'pre-wrap' }}>{protocol.notes}</div>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Activity Log</h3>
            {logs.length === 0 ? (
              <div style={styles.logsEmpty}>No activity logged yet</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} style={styles.logItem}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{log.log_type || 'Session'}</div>
                    {log.notes && <div style={{ fontSize: '13px', color: '#64748b' }}>{log.notes}</div>}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {new Date(log.log_date).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Protocol</h3>
              <button style={styles.modalClose} onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Medication</label>
                <input
                  type="text"
                  style={styles.input}
                  value={editForm.medication}
                  onChange={(e) => setEditForm({...editForm, medication: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Dose</label>
                <input
                  type="text"
                  style={styles.input}
                  value={editForm.selected_dose}
                  onChange={(e) => setEditForm({...editForm, selected_dose: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Frequency</label>
                <input
                  type="text"
                  style={styles.input}
                  value={editForm.frequency}
                  onChange={(e) => setEditForm({...editForm, frequency: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Delivery Method</label>
                <select
                  style={styles.select}
                  value={editForm.delivery_method}
                  onChange={(e) => setEditForm({...editForm, delivery_method: e.target.value})}
                >
                  <option value="">Select...</option>
                  <option value="in_clinic">In Clinic</option>
                  <option value="take_home">Take Home</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>End Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Sessions Used</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={editForm.sessions_used}
                    onChange={(e) => setEditForm({...editForm, sessions_used: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Total Sessions</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={editForm.total_sessions}
                    onChange={(e) => setEditForm({...editForm, total_sessions: parseInt(e.target.value) || ''})}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.select}
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  style={{ ...styles.input, minHeight: '80px' }}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.btn, background: '#f1f5f9' }}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.btn, background: '#111', color: '#fff', border: 'none' }}
                onClick={submitEdit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
