// /pages/admin/employees.js
// Employee management page — add, edit, toggle permissions
// Range Medical System

import { useState, useEffect, useCallback } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

const PERMISSIONS = {
  can_manage_patients: 'Manage Patients',
  can_manage_protocols: 'Manage Protocols',
  can_manage_schedules: 'Manage Schedules',
  can_view_financials: 'View Financials',
  can_manage_communications: 'Manage Communications',
  can_log_services: 'Log Services',
  can_manage_employees: 'Manage Employees',
};

export default function EmployeesPage() {
  const { session } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal state
  const [editModal, setEditModal] = useState(null); // employee object or null
  const [addModal, setAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add form state
  const [addForm, setAddForm] = useState({ name: '', email: '', title: 'Staff', password: '' });

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }), [session]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/employees', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
      } else {
        setError(data.error || 'Failed to fetch employees');
      }
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (session) fetchEmployees();
  }, [session, fetchEmployees]);

  // Show success message briefly
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Toggle admin status
  const toggleAdmin = async (emp) => {
    try {
      const res = await fetch(`/api/admin/employees/${emp.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_admin: !emp.is_admin }),
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(prev => prev.map(e => e.id === emp.id ? data.employee : e));
        showSuccess(`${emp.name} ${!emp.is_admin ? 'granted' : 'removed'} admin access`);
      }
    } catch (err) {
      setError('Failed to update');
    }
  };

  // Toggle individual permission
  const togglePermission = async (emp, permission) => {
    const newPerms = { ...(emp.permissions || {}) };
    newPerms[permission] = !newPerms[permission];

    try {
      const res = await fetch(`/api/admin/employees/${emp.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ permissions: newPerms }),
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(prev => prev.map(e => e.id === emp.id ? data.employee : e));
      }
    } catch (err) {
      setError('Failed to update permission');
    }
  };

  // Toggle active status
  const toggleActive = async (emp) => {
    if (!window.confirm(`${emp.is_active ? 'Deactivate' : 'Reactivate'} ${emp.name}?`)) return;
    try {
      const res = await fetch(`/api/admin/employees/${emp.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !emp.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(prev => prev.map(e => e.id === emp.id ? data.employee : e));
        showSuccess(`${emp.name} ${!emp.is_active ? 'reactivated' : 'deactivated'}`);
      }
    } catch (err) {
      setError('Failed to update');
    }
  };

  // Add new employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        setAddModal(false);
        setAddForm({ name: '', email: '', title: 'Staff', password: '' });
        fetchEmployees();
        const tempPwMsg = data.tempPassword
          ? ` Temporary password: ${data.tempPassword}`
          : '';
        showSuccess(`${addForm.name} added!${tempPwMsg}`);
      } else {
        setError(data.error || 'Failed to create employee');
      }
    } catch (err) {
      setError('Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  // Save edit modal changes
  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/employees/${editModal.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          name: editModal.name,
          title: editModal.title,
          calcom_user_id: editModal.calcom_user_id || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(prev => prev.map(e => e.id === editModal.id ? data.employee : e));
        setEditModal(null);
        showSuccess('Employee updated');
      }
    } catch (err) {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Send password reset email
  const handleSendReset = async (emp) => {
    if (!window.confirm(`Send a password reset email to ${emp.name} at ${emp.email}?`)) return;
    try {
      const res = await fetch(`/api/admin/employees/${emp.id}/reset-password`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Password reset email sent to ${emp.email}`);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Failed to send reset email');
    }
  };

  const activeEmployees = employees.filter(e => e.is_active);
  const inactiveEmployees = employees.filter(e => !e.is_active);

  return (
    <AdminLayout
      title="Employees"
      actions={
        <button style={sharedStyles.btnPrimary} onClick={() => setAddModal(true)}>
          + Add Employee
        </button>
      }
    >
      {successMsg && (
        <div style={{ ...pageStyles.alert, background: '#dcfce7', color: '#166534' }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{ ...pageStyles.alert, background: '#fef2f2', color: '#dc2626' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>Loading employees...</div>
      ) : (
        <>
          {/* Active Employees */}
          <div style={pageStyles.grid}>
            {activeEmployees.map(emp => (
              <div key={emp.id} style={pageStyles.card}>
                <div style={pageStyles.cardHeader}>
                  <div style={pageStyles.avatar}>{(emp.name || '?')[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={pageStyles.empName}>{emp.name}</div>
                    <div style={pageStyles.empTitle}>{emp.title} · {emp.email}</div>
                  </div>
                  <button
                    onClick={() => setEditModal({ ...emp })}
                    style={pageStyles.editBtn}
                  >
                    Edit
                  </button>
                </div>

                {/* Admin toggle */}
                <div style={pageStyles.adminRow}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Full Admin Access</span>
                  <button
                    onClick={() => toggleAdmin(emp)}
                    style={{
                      ...pageStyles.toggle,
                      background: emp.is_admin ? '#111' : '#d1d5db',
                    }}
                  >
                    <div style={{
                      ...pageStyles.toggleKnob,
                      transform: emp.is_admin ? 'translateX(20px)' : 'translateX(0)',
                    }} />
                  </button>
                </div>

                {/* Individual permissions (disabled if admin) */}
                {!emp.is_admin && (
                  <div style={pageStyles.permGrid}>
                    {Object.entries(PERMISSIONS).map(([key, label]) => (
                      <label key={key} style={pageStyles.permLabel}>
                        <input
                          type="checkbox"
                          checked={emp.permissions?.[key] || false}
                          onChange={() => togglePermission(emp, key)}
                          style={{ marginRight: '8px' }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}

                {emp.is_admin && (
                  <div style={{ fontSize: '13px', color: '#6b7280', padding: '8px 0', fontStyle: 'italic' }}>
                    Admin has all permissions
                  </div>
                )}

                <div style={pageStyles.cardFooter}>
                  <button onClick={() => handleSendReset(emp)} style={pageStyles.resetBtn}>
                    Send Password Reset
                  </button>
                  <button onClick={() => toggleActive(emp)} style={pageStyles.deactivateBtn}>
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Inactive Employees */}
          {inactiveEmployees.length > 0 && (
            <>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '32px 0 16px', color: '#999' }}>
                Inactive ({inactiveEmployees.length})
              </h3>
              <div style={pageStyles.grid}>
                {inactiveEmployees.map(emp => (
                  <div key={emp.id} style={{ ...pageStyles.card, opacity: 0.6 }}>
                    <div style={pageStyles.cardHeader}>
                      <div style={{ ...pageStyles.avatar, background: '#d1d5db' }}>{(emp.name || '?')[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={pageStyles.empName}>{emp.name}</div>
                        <div style={pageStyles.empTitle}>{emp.title} · Inactive</div>
                      </div>
                      <button onClick={() => toggleActive(emp)} style={pageStyles.editBtn}>
                        Reactivate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Add Employee Modal */}
      {addModal && (
        <div style={sharedStyles.modalOverlay} onClick={() => setAddModal(false)}>
          <div style={sharedStyles.modal} onClick={e => e.stopPropagation()}>
            <div style={sharedStyles.modalHeader}>
              <h2 style={sharedStyles.modalTitle}>Add Employee</h2>
              <button onClick={() => setAddModal(false)} style={sharedStyles.modalClose}>✕</button>
            </div>
            <form onSubmit={handleAddEmployee}>
              <div style={sharedStyles.modalBody}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={sharedStyles.label}>Full Name *</label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      style={sharedStyles.input}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label style={sharedStyles.label}>Email *</label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      style={sharedStyles.input}
                      placeholder="jane@range-medical.com"
                    />
                  </div>
                  <div>
                    <label style={sharedStyles.label}>Title</label>
                    <select
                      value={addForm.title}
                      onChange={e => setAddForm(prev => ({ ...prev, title: e.target.value }))}
                      style={sharedStyles.select}
                    >
                      <option value="Staff">Staff</option>
                      <option value="Provider">Provider</option>
                      <option value="RN">RN</option>
                      <option value="Partner/Owner">Partner/Owner</option>
                    </select>
                  </div>
                  <div>
                    <label style={sharedStyles.label}>Password</label>
                    <input
                      type="text"
                      value={addForm.password}
                      onChange={e => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                      style={sharedStyles.input}
                      placeholder="Leave blank for auto-generated"
                    />
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      If blank, a temporary password will be generated. Share it with the employee.
                    </div>
                  </div>
                </div>
              </div>
              <div style={sharedStyles.modalFooter}>
                <button type="button" onClick={() => setAddModal(false)} style={sharedStyles.btnSecondary}>Cancel</button>
                <button type="submit" disabled={saving} style={sharedStyles.btnPrimary}>
                  {saving ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editModal && (
        <div style={sharedStyles.modalOverlay} onClick={() => setEditModal(null)}>
          <div style={sharedStyles.modal} onClick={e => e.stopPropagation()}>
            <div style={sharedStyles.modalHeader}>
              <h2 style={sharedStyles.modalTitle}>Edit {editModal.name}</h2>
              <button onClick={() => setEditModal(null)} style={sharedStyles.modalClose}>✕</button>
            </div>
            <div style={sharedStyles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={sharedStyles.label}>Full Name</label>
                  <input
                    type="text"
                    value={editModal.name}
                    onChange={e => setEditModal(prev => ({ ...prev, name: e.target.value }))}
                    style={sharedStyles.input}
                  />
                </div>
                <div>
                  <label style={sharedStyles.label}>Title</label>
                  <select
                    value={editModal.title}
                    onChange={e => setEditModal(prev => ({ ...prev, title: e.target.value }))}
                    style={sharedStyles.select}
                  >
                    <option value="Staff">Staff</option>
                    <option value="Provider">Provider</option>
                    <option value="RN">RN</option>
                    <option value="Partner/Owner">Partner/Owner</option>
                  </select>
                </div>
                <div>
                  <label style={sharedStyles.label}>Cal.com User ID</label>
                  <input
                    type="number"
                    value={editModal.calcom_user_id || ''}
                    onChange={e => setEditModal(prev => ({ ...prev, calcom_user_id: e.target.value ? parseInt(e.target.value) : null }))}
                    style={sharedStyles.input}
                    placeholder="e.g., 2197567"
                  />
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Links this employee to their Cal.com account for schedule management
                  </div>
                </div>
              </div>
            </div>
            <div style={sharedStyles.modalFooter}>
              <button onClick={() => setEditModal(null)} style={sharedStyles.btnSecondary}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} style={sharedStyles.btnPrimary}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const pageStyles = {
  alert: {
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '16px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '16px',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#111',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 700,
    flexShrink: 0,
  },
  empName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111',
  },
  empTitle: {
    fontSize: '13px',
    color: '#6b7280',
  },
  editBtn: {
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#374151',
  },
  adminRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderTop: '1px solid #f3f4f6',
    borderBottom: '1px solid #f3f4f6',
  },
  toggle: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
    padding: 0,
  },
  toggleKnob: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute',
    top: '2px',
    left: '2px',
    transition: 'transform 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  permGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px 0',
  },
  permLabel: {
    fontSize: '13px',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  cardFooter: {
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px 0',
  },
  deactivateBtn: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px 0',
  },
};
