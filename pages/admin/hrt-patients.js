// =====================================================
// HRT PATIENTS OVERVIEW
// /pages/admin/hrt-patients.js
// Comprehensive view of all HRT patients: status, meds,
// labs, follow-up schedule, and medication pickups
// Range Medical
// =====================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';

export default function HRTPatients() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState({});
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('lab_status');
  const [sortDir, setSortDir] = useState('asc');
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hrt/patients-overview');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load');
      setPatients(data.data.patients || []);
      setSummary(data.data.summary || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter
  const filtered = patients.filter(p => {
    // Tab filter
    if (activeTab === 'active' && p.status !== 'active') return false;
    if (activeTab === 'inactive' && p.status === 'active') return false;
    if (activeTab === 'labs-overdue' && (p.lab_status !== 'overdue' || p.status !== 'active')) return false;
    if (activeTab === 'labs-due-soon' && (p.lab_status !== 'due_soon' || p.status !== 'active')) return false;
    if (activeTab === 'meds-overdue' && (p.med_status !== 'overdue' || p.status !== 'active')) return false;

    // Search
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        p.patient_name?.toLowerCase().includes(s) ||
        p.patient_email?.toLowerCase().includes(s) ||
        p.patient_phone?.includes(s) ||
        p.medication?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const labOrder = { overdue: 0, due_soon: 1, on_track: 2, no_data: 3, 'n/a': 4 };
    const medOrder = { overdue: 0, due_soon: 1, on_track: 2, no_data: 3, 'n/a': 4 };
    let aVal, bVal;

    switch (sortField) {
      case 'patient_name':
        aVal = a.patient_name || '';
        bVal = b.patient_name || '';
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      case 'lab_status':
        aVal = labOrder[a.lab_status] ?? 9;
        bVal = labOrder[b.lab_status] ?? 9;
        break;
      case 'med_status':
        aVal = medOrder[a.med_status] ?? 9;
        bVal = medOrder[b.med_status] ?? 9;
        break;
      case 'last_lab_date':
        aVal = a.last_lab_date ? new Date(a.last_lab_date).getTime() : 0;
        bVal = b.last_lab_date ? new Date(b.last_lab_date).getTime() : 0;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      case 'last_pickup_date':
        aVal = a.last_pickup_date ? new Date(a.last_pickup_date).getTime() : 0;
        bVal = b.last_pickup_date ? new Date(b.last_pickup_date).getTime() : 0;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      case 'start_date':
        aVal = a.start_date ? new Date(a.start_date).getTime() : 0;
        bVal = b.start_date ? new Date(b.start_date).getTime() : 0;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      default:
        return 0;
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortArrow = (field) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysAgo = (d) => {
    if (!d) return null;
    const diff = Math.floor((new Date() - new Date(d + 'T00:00:00')) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day ago';
    return `${diff} days ago`;
  };

  const daysUntil = (d) => {
    if (!d) return null;
    const diff = Math.floor((new Date(d + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  if (loading) {
    return (
      <AdminLayout title="HRT Patients">
        <div style={sharedStyles.loading}>Loading HRT patients...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="HRT Patients">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>
          <button onClick={fetchData} style={sharedStyles.btnPrimary}>Retry</button>
        </div>
      </AdminLayout>
    );
  }

  const activeCount = patients.filter(p => p.status === 'active').length;

  return (
    <AdminLayout title={`HRT Patients (${activeCount})`} actions={
      <button onClick={fetchData} style={sharedStyles.btnSecondary}>Refresh</button>
    }>
      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#3b82f6' }}>{summary.active || 0}</div>
          <div style={styles.statLabel}>Active</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: summary.overdueLabs > 0 ? '#ef4444' : '#22c55e' }}>{summary.overdueLabs || 0}</div>
          <div style={styles.statLabel}>Labs Overdue</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: summary.dueSoonLabs > 0 ? '#f59e0b' : '#22c55e' }}>{summary.dueSoonLabs || 0}</div>
          <div style={styles.statLabel}>Labs Due Soon</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: summary.overdueMeds > 0 ? '#ef4444' : '#22c55e' }}>{summary.overdueMeds || 0}</div>
          <div style={styles.statLabel}>Meds Overdue</div>
        </div>
      </div>

      {/* Search + Tabs */}
      <div style={sharedStyles.filterBar}>
        <input
          type="text"
          placeholder="Search by name, email, phone, or medication..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={sharedStyles.searchInput}
        />
      </div>

      <div style={styles.tabs}>
        {[
          { key: 'active', label: 'Active', count: summary.active || 0 },
          { key: 'labs-overdue', label: 'Labs Overdue', count: summary.overdueLabs || 0, color: '#ef4444' },
          { key: 'labs-due-soon', label: 'Labs Due Soon', count: summary.dueSoonLabs || 0, color: '#f59e0b' },
          { key: 'meds-overdue', label: 'Meds Overdue', count: summary.overdueMeds || 0, color: '#ef4444' },
          { key: 'inactive', label: 'Inactive', count: (summary.completed || 0) + (summary.cancelled || 0) + (summary.paused || 0) },
          { key: 'all', label: 'All', count: summary.total || 0 },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tabBtn,
              background: activeTab === tab.key ? '#000' : '#fff',
              color: activeTab === tab.key ? '#fff' : '#333',
              border: activeTab === tab.key ? '1px solid #000' : '1px solid #ddd',
            }}
          >
            {tab.label}
            <span style={{
              ...styles.tabCount,
              background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : (tab.color || '#e5e5e5'),
              color: activeTab === tab.key ? '#fff' : (tab.color ? '#fff' : '#666'),
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={sharedStyles.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={sharedStyles.table}>
            <thead>
              <tr>
                <th style={{ ...sharedStyles.th, cursor: 'pointer' }} onClick={() => handleSort('patient_name')}>
                  Patient{sortArrow('patient_name')}
                </th>
                <th style={sharedStyles.th}>Phone</th>
                <th style={sharedStyles.th}>Program</th>
                <th style={sharedStyles.th}>Status</th>
                <th style={sharedStyles.th}>Medication / Dosage</th>
                <th style={{ ...sharedStyles.th, cursor: 'pointer' }} onClick={() => handleSort('last_pickup_date')}>
                  Last Pickup{sortArrow('last_pickup_date')}
                </th>
                <th style={{ ...sharedStyles.th, cursor: 'pointer' }} onClick={() => handleSort('med_status')}>
                  Med Status{sortArrow('med_status')}
                </th>
                <th style={{ ...sharedStyles.th, cursor: 'pointer' }} onClick={() => handleSort('last_lab_date')}>
                  Last Lab{sortArrow('last_lab_date')}
                </th>
                <th style={{ ...sharedStyles.th, cursor: 'pointer' }} onClick={() => handleSort('lab_status')}>
                  Next Lab Due{sortArrow('lab_status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ ...sharedStyles.td, textAlign: 'center', padding: '48px', color: '#999' }}>
                    No patients found
                  </td>
                </tr>
              ) : sorted.map(p => (
                <PatientRow
                  key={p.protocol_id}
                  patient={p}
                  formatDate={formatDate}
                  daysAgo={daysAgo}
                  daysUntil={daysUntil}
                  expanded={expandedRow === p.protocol_id}
                  onToggle={() => setExpandedRow(expandedRow === p.protocol_id ? null : p.protocol_id)}
                  onNavigate={() => router.push(`/admin/patient/${p.patient_id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

// =====================================================
// PATIENT ROW COMPONENT
// =====================================================
function PatientRow({ patient: p, formatDate, daysAgo, daysUntil, expanded, onToggle, onNavigate }) {
  const getStatusBadge = (status) => {
    const map = {
      active: { bg: '#dcfce7', color: '#166534' },
      completed: { bg: '#e5e5e5', color: '#666' },
      cancelled: { bg: '#fee2e2', color: '#991b1b' },
      paused: { bg: '#fef3c7', color: '#92400e' },
    };
    const s = map[status] || map.completed;
    return (
      <span style={{ ...sharedStyles.badge, background: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  const getLabBadge = () => {
    if (p.lab_status === 'n/a') return <span style={{ color: '#999', fontSize: 12 }}>N/A</span>;
    const map = {
      overdue: { bg: '#fee2e2', color: '#991b1b', label: 'OVERDUE' },
      due_soon: { bg: '#fef3c7', color: '#92400e', label: 'DUE SOON' },
      on_track: { bg: '#dcfce7', color: '#166534', label: 'On Track' },
      no_data: { bg: '#f3f4f6', color: '#666', label: 'No Data' },
    };
    const s = map[p.lab_status] || map.no_data;
    return (
      <div>
        <span style={{ ...sharedStyles.badge, background: s.bg, color: s.color }}>{s.label}</span>
        {p.next_draw_target && (
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            {p.next_draw_label}: {formatDate(p.next_draw_target)}
            <br />
            <span style={{ color: p.lab_status === 'overdue' ? '#ef4444' : '#999' }}>
              {daysUntil(p.next_draw_target)}
            </span>
          </div>
        )}
      </div>
    );
  };

  const getMedBadge = () => {
    if (p.med_status === 'n/a') return <span style={{ color: '#999', fontSize: 12 }}>N/A</span>;
    const map = {
      overdue: { bg: '#fee2e2', color: '#991b1b', label: 'OVERDUE' },
      due_soon: { bg: '#fef3c7', color: '#92400e', label: 'DUE SOON' },
      on_track: { bg: '#dcfce7', color: '#166534', label: 'On Track' },
      no_data: { bg: '#f3f4f6', color: '#666', label: 'No Data' },
    };
    const s = map[p.med_status] || map.no_data;
    return (
      <div>
        <span style={{ ...sharedStyles.badge, background: s.bg, color: s.color }}>{s.label}</span>
        {p.next_expected_date && (
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            Next: {formatDate(p.next_expected_date)}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <tr style={{ ...sharedStyles.trHover, background: expanded ? '#f9fafb' : undefined }}
          onClick={onToggle}>
        {/* Patient Name */}
        <td style={sharedStyles.td}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.patient_name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{p.patient_email}</div>
        </td>

        {/* Phone */}
        <td style={sharedStyles.td}>
          <span style={{ fontSize: 13 }}>{p.patient_phone || '—'}</span>
        </td>

        {/* Program */}
        <td style={sharedStyles.td}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            HRT ({p.hrt_type === 'female' ? 'Female' : 'Male'})
          </span>
          {p.program_week != null && p.status === 'active' && (
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              Week {p.program_week}
            </div>
          )}
          {p.range_iv && (
            <div style={{
              fontSize: 10,
              marginTop: 3,
              padding: '1px 6px',
              borderRadius: 4,
              display: 'inline-block',
              background: p.range_iv === 'available' ? '#dcfce7' : p.range_iv === 'used' ? '#f3f4f6' : '#fef3c7',
              color: p.range_iv === 'available' ? '#166534' : p.range_iv === 'used' ? '#6b7280' : '#92400e',
            }}>
              IV {p.range_iv === 'available' ? 'available' : p.range_iv === 'used' ? 'used' : 'expired'}
            </div>
          )}
        </td>

        {/* Status */}
        <td style={sharedStyles.td}>
          {getStatusBadge(p.status)}
        </td>

        {/* Medication / Dosage */}
        <td style={sharedStyles.td}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{p.medication || '—'}</div>
          {p.current_dose && (
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
              {p.current_dose}
            </div>
          )}
          {p.secondary_medications && p.secondary_medications.length > 0 && (
            <div style={{ fontSize: 11, color: '#7C3AED', marginTop: 3 }}>
              + {p.secondary_medications.join(', ')}
            </div>
          )}
        </td>

        {/* Last Pickup */}
        <td style={sharedStyles.td}>
          <div style={{ fontSize: 13 }}>{formatDate(p.last_pickup_date)}</div>
          {p.last_pickup_date && (
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              {daysAgo(p.last_pickup_date)}
            </div>
          )}
        </td>

        {/* Med Status */}
        <td style={sharedStyles.td}>
          {getMedBadge()}
        </td>

        {/* Last Lab */}
        <td style={sharedStyles.td}>
          <div style={{ fontSize: 13 }}>{formatDate(p.last_lab_date)}</div>
          {p.last_lab_date && (
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              {daysAgo(p.last_lab_date)}
            </div>
          )}
        </td>

        {/* Next Lab Due */}
        <td style={sharedStyles.td}>
          {getLabBadge()}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan="9" style={{ padding: 0, borderBottom: '1px solid #e5e5e5' }}>
            <div style={styles.expandedPanel}>
              <div style={styles.expandedGrid}>
                {/* Patient Details */}
                <div>
                  <div style={styles.expandedLabel}>Patient Details</div>
                  <div style={styles.expandedDetail}>DOB: {formatDate(p.patient_dob)}</div>
                  <div style={styles.expandedDetail}>Gender: {p.gender || '—'}</div>
                  <div style={styles.expandedDetail}>Started: {formatDate(p.start_date)}</div>
                  {p.delivery_method && (
                    <div style={styles.expandedDetail}>Delivery: {p.delivery_method.replace(/_/g, ' ')}</div>
                  )}
                  {p.supply_type && (
                    <div style={styles.expandedDetail}>Supply: {p.supply_type.replace(/_/g, ' ')}</div>
                  )}
                  {p.secondary_medications && p.secondary_medications.length > 0 && (
                    <div style={styles.expandedDetail}>Secondary Meds: {p.secondary_medications.join(', ')}</div>
                  )}
                  {p.total_injections > 0 && (
                    <div style={styles.expandedDetail}>Total Injections: {p.total_injections}</div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                    style={{ ...sharedStyles.btnPrimary, ...sharedStyles.btnSmall, marginTop: 8 }}
                  >
                    View Patient
                  </button>
                </div>

                {/* Lab Schedule */}
                <div>
                  <div style={styles.expandedLabel}>Lab Schedule</div>
                  {p.schedule && p.schedule.length > 0 ? (
                    p.schedule.map((draw, i) => (
                      <div key={i} style={{ ...styles.expandedDetail, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: draw.status === 'completed' ? '#22c55e' : draw.status === 'overdue' ? '#ef4444' : '#ddd',
                          flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 13 }}>
                          {draw.label} — {formatDate(draw.targetDate)}
                          {draw.status === 'completed' && draw.completedDate && (
                            <span style={{ color: '#22c55e', marginLeft: 4 }}>Done {formatDate(draw.completedDate)}</span>
                          )}
                          {draw.status === 'overdue' && (
                            <span style={{ color: '#ef4444', marginLeft: 4 }}>OVERDUE</span>
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={styles.expandedDetail}>No schedule available</div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// =====================================================
// STYLES
// =====================================================
const styles = {
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    ...sharedStyles.statCard,
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabCount: {
    padding: '2px 7px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
  },
  expandedPanel: {
    padding: '20px 24px',
    background: '#fafafa',
    borderTop: '1px solid #e5e5e5',
  },
  expandedGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '24px',
  },
  expandedLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#666',
    marginBottom: '8px',
  },
  expandedDetail: {
    fontSize: '13px',
    color: '#333',
    marginBottom: '4px',
  },
};
