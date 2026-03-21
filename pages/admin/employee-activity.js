// /pages/admin/employee-activity.js
// Employee Activity Log — see what staff members are doing in the system
// Range Medical System

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

const ACTION_LABELS = {
  book_appointment: 'Booked Appointment',
  cancel_appointment: 'Cancelled Appointment',
  reschedule_appointment: 'Rescheduled Appointment',
  update_appointment_checked_in: 'Checked In Patient',
  update_appointment_confirmed: 'Confirmed Appointment',
  update_appointment_completed: 'Completed Appointment',
  update_appointment_no_show: 'Marked No Show',
  update_appointment_showed: 'Marked Showed',
  create_employee: 'Created Employee',
};

const ACTION_COLORS = {
  book_appointment: { bg: '#dcfce7', color: '#166534' },
  cancel_appointment: { bg: '#fee2e2', color: '#dc2626' },
  reschedule_appointment: { bg: '#fef3c7', color: '#92400e' },
  update_appointment_checked_in: { bg: '#dbeafe', color: '#1e40af' },
  update_appointment_confirmed: { bg: '#dcfce7', color: '#166534' },
  update_appointment_completed: { bg: '#dcfce7', color: '#166534' },
  update_appointment_no_show: { bg: '#fee2e2', color: '#dc2626' },
  update_appointment_showed: { bg: '#dbeafe', color: '#1e40af' },
  create_employee: { bg: '#e0e7ff', color: '#3730a3' },
};

export default function EmployeeActivityPage() {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const limit = 50;

  useEffect(() => {
    fetchEntries();
  }, [page, filterEmployee, filterAction]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (filterEmployee) params.set('employee_name', filterEmployee);
      if (filterAction) params.set('action', filterAction);

      const res = await fetch(`/api/admin/activity-log?${params}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Activity log fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      timeZone: 'America/Los_Angeles',
    }) + ' at ' + d.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });
  };

  const getActionLabel = (action) => ACTION_LABELS[action] || action.replace(/_/g, ' ');
  const getActionColor = (action) => ACTION_COLORS[action] || { bg: '#f3f4f6', color: '#374151' };

  const renderDetails = (entry) => {
    const d = entry.details;
    if (!d) return null;

    const parts = [];
    if (d.patient_name) parts.push(d.patient_name);
    if (d.service_name) parts.push(d.service_name);
    if (d.start_time) {
      parts.push(new Date(d.start_time).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
        timeZone: 'America/Los_Angeles',
      }) + ' ' + new Date(d.start_time).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
        timeZone: 'America/Los_Angeles',
      }));
    }
    if (d.provider) parts.push(`Provider: ${d.provider}`);
    if (d.cancellation_reason) parts.push(`Reason: ${d.cancellation_reason}`);
    if (d.new_time) {
      parts.push('Moved to ' + new Date(d.new_time).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
        timeZone: 'America/Los_Angeles',
      }) + ' ' + new Date(d.new_time).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
        timeZone: 'America/Los_Angeles',
      }));
    }
    if (d.source && d.source !== 'manual') parts.push(`via ${d.source}`);
    if (d.name && d.email) parts.push(`${d.name} (${d.email})`);

    return parts.length > 0 ? (
      <span style={{ color: '#666', fontSize: '13px' }}>
        {parts.join(' \u2022 ')}
      </span>
    ) : null;
  };

  return (
    <AdminLayout title="Employee Activity">
      {/* Filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Filter by employee name..."
          value={filterEmployee}
          onChange={(e) => { setFilterEmployee(e.target.value); setPage(0); }}
          style={styles.filterInput}
        />
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
          style={styles.filterSelect}
        >
          <option value="">All Actions</option>
          <option value="book_appointment">Booked Appointment</option>
          <option value="cancel_appointment">Cancelled Appointment</option>
          <option value="reschedule_appointment">Rescheduled Appointment</option>
          <option value="update_appointment_checked_in">Checked In</option>
          <option value="update_appointment_confirmed">Confirmed</option>
          <option value="update_appointment_completed">Completed</option>
          <option value="update_appointment_no_show">No Show</option>
          <option value="create_employee">Created Employee</option>
        </select>
        <button onClick={() => { fetchEntries(); }} style={styles.refreshBtn}>
          Refresh
        </button>
        <span style={{ color: '#999', fontSize: '13px', marginLeft: '4px' }}>
          {total} total entries
        </span>
      </div>

      {/* Table */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.loading}>Loading activity log...</div>
        ) : entries.length === 0 ? (
          <div style={styles.empty}>
            No activity log entries yet.
            {filterEmployee || filterAction ? ' Try adjusting your filters.' : ' Actions will appear here as employees use the system.'}
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>When</th>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Action</th>
                <th style={styles.th}>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => {
                const ac = getActionColor(entry.action);
                return (
                  <tr key={entry.id} style={styles.tr}>
                    <td style={{ ...styles.td, whiteSpace: 'nowrap', width: '200px' }}>
                      <div style={{ fontSize: '13px', color: '#333' }}>
                        {formatTime(entry.created_at)}
                      </div>
                    </td>
                    <td style={{ ...styles.td, width: '160px' }}>
                      <span style={{ fontWeight: '500' }}>
                        {entry.employee_name || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, width: '200px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: ac.bg,
                        color: ac.color,
                      }}>
                        {getActionLabel(entry.action)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {renderDetails(entry)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div style={styles.pagination}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ ...styles.pageBtn, opacity: page === 0 ? 0.4 : 1 }}
          >
            Previous
          </button>
          <span style={{ fontSize: '13px', color: '#666' }}>
            Page {page + 1} of {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * limit >= total}
            style={{ ...styles.pageBtn, opacity: (page + 1) * limit >= total ? 0.4 : 1 }}
          >
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
}

const styles = {
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  filterInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    width: '220px',
    outline: 'none',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  refreshBtn: {
    padding: '8px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e5e5',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#666',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
  },
  pagination: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '16px',
  },
  pageBtn: {
    padding: '6px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
  },
};
