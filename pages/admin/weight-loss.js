// =====================================================
// WEIGHT LOSS PATIENTS OVERVIEW
// /pages/admin/weight-loss.js
// Comprehensive view of all weight loss patients: status,
// meds, progress, weight tracking, and activity
// Range Medical
// =====================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';

export default function WeightLossTracker() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('status');
  const [sortDir, setSortDir] = useState('asc');
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/pipelines/weight-loss');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load');
      setProtocols(data.protocols || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Derive status for each protocol
  const withStatus = protocols.map(p => ({ ...p, _status: getStatus(p) }));

  // Summary counts
  const activeCount = withStatus.filter(p => p._status !== 'complete').length;
  const takeHomeActive = withStatus.filter(p => (p.delivery_method || 'take_home') === 'take_home' && p._status !== 'complete').length;
  const inClinicActive = withStatus.filter(p => (p.delivery_method || 'take_home') === 'in_clinic' && p._status !== 'complete').length;
  const overdueCount = withStatus.filter(p => p._status === 'overdue').length;
  const dueSoonCount = withStatus.filter(p => p._status === 'due_soon').length;

  // Filter
  const filtered = withStatus.filter(p => {
    if (activeTab === 'active' && p._status === 'complete') return false;
    if (activeTab === 'take-home' && ((p.delivery_method || 'take_home') !== 'take_home' || p._status === 'complete')) return false;
    if (activeTab === 'in-clinic' && ((p.delivery_method || 'take_home') !== 'in_clinic' || p._status === 'complete')) return false;
    if (activeTab === 'overdue' && p._status !== 'overdue') return false;
    if (activeTab === 'due-soon' && p._status !== 'due_soon') return false;
    if (activeTab === 'completed' && p._status !== 'complete') return false;
    if (activeTab === 'all') { /* show all */ }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        p.patient_name?.toLowerCase().includes(s) ||
        p.phone?.includes(s) ||
        p.medication?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Sort
  const statusOrder = { overdue: 0, due_soon: 1, on_track: 2, new: 3, complete: 4 };
  const sorted = [...filtered].sort((a, b) => {
    let aVal, bVal;
    switch (sortField) {
      case 'patient_name':
        aVal = a.patient_name || '';
        bVal = b.patient_name || '';
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      case 'status':
        aVal = statusOrder[a._status] ?? 5;
        bVal = statusOrder[b._status] ?? 5;
        break;
      case 'last_activity':
        aVal = a.last_activity ? new Date(a.last_activity).getTime() : 0;
        bVal = b.last_activity ? new Date(b.last_activity).getTime() : 0;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      case 'weight_change':
        aVal = (a.current_weight && a.starting_weight) ? (a.current_weight - a.starting_weight) : 999;
        bVal = (b.current_weight && b.starting_weight) ? (b.current_weight - b.starting_weight) : 999;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      case 'progress':
        aVal = a.total_injections > 0 ? (a.injections_used / a.total_injections) : 0;
        bVal = b.total_injections > 0 ? (b.injections_used / b.total_injections) : 0;
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

  if (loading) {
    return (
      <AdminLayout title="Weight Loss Patients">
        <div style={sharedStyles.loading}>Loading weight loss patients...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Weight Loss Patients">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>
          <button onClick={fetchData} style={sharedStyles.btnPrimary}>Retry</button>
        </div>
      </AdminLayout>
    );
  }

  const completedCount = withStatus.filter(p => p._status === 'complete').length;

  return (
    <AdminLayout title={`Weight Loss Patients (${activeCount})`} actions={
      <button onClick={fetchData} style={sharedStyles.btnSecondary}>Refresh</button>
    }>
      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#8b5cf6' }}>{takeHomeActive}</div>
          <div style={styles.statLabel}>Take-Home</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#3b82f6' }}>{inClinicActive}</div>
          <div style={styles.statLabel}>In-Clinic</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: overdueCount > 0 ? '#ef4444' : '#22c55e' }}>{overdueCount}</div>
          <div style={styles.statLabel}>Overdue</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: dueSoonCount > 0 ? '#f59e0b' : '#22c55e' }}>{dueSoonCount}</div>
          <div style={styles.statLabel}>Due Soon</div>
        </div>
      </div>

      {/* Search */}
      <div style={sharedStyles.filterBar}>
        <input
          type="text"
          placeholder="Search by name, phone, or medication..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={sharedStyles.searchInput}
        />
      </div>

      {/* Filter Tabs */}
      <div style={styles.tabs}>
        {[
          { key: 'active', label: 'Active', count: activeCount },
          { key: 'take-home', label: 'Take-Home', count: takeHomeActive },
          { key: 'in-clinic', label: 'In-Clinic', count: inClinicActive },
          { key: 'overdue', label: 'Overdue', count: overdueCount, color: '#ef4444' },
          { key: 'due-soon', label: 'Due Soon', count: dueSoonCount, color: '#f59e0b' },
          { key: 'completed', label: 'Completed', count: completedCount },
          { key: 'all', label: 'All', count: protocols.length },
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
                <th style={sharedStyles.th}>Type</th>
                <th style={{ ...sharedStyles.th, cursor: 'pointer' }} onClick={() => handleSort('status')}>
                  Status{sortArrow('status')}
                </th>
                <th style={sharedStyles.th}>Medication / Dose</th>
                <th style={{ ...sharedStyles.th, cursor: 'pointer' }} onClick={() => handleSort('progress')}>
                  Progress{sortArrow('progress')}
                </th>
                <th style={{ ...sharedStyles.th, cursor: 'pointer' }} onClick={() => handleSort('weight_change')}>
                  Weight{sortArrow('weight_change')}
                </th>
                <th style={{ ...sharedStyles.th, cursor: 'pointer' }} onClick={() => handleSort('last_activity')}>
                  Last Activity{sortArrow('last_activity')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ ...sharedStyles.td, textAlign: 'center', padding: '48px', color: '#999' }}>
                    No patients found
                  </td>
                </tr>
              ) : sorted.map(p => (
                <PatientRow
                  key={p.id}
                  patient={p}
                  expanded={expandedRow === p.id}
                  onToggle={() => setExpandedRow(expandedRow === p.id ? null : p.id)}
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
// STATUS HELPERS
// =====================================================
function getDaysSinceActivity(protocol) {
  const c = protocol.days_since_last_checkin;
  const i = protocol.days_since_last_injection;
  if (c !== null && i !== null) return Math.min(c, i);
  return c ?? i ?? null;
}

function getStatus(protocol) {
  if (protocol.status === 'completed' || protocol.injections_remaining <= 0) return 'complete';

  if (protocol.delivery_method === 'take_home' && protocol.next_expected_date) {
    const now = new Date();
    const supplyEnd = new Date(protocol.next_expected_date + 'T00:00:00');
    const daysUntilRefill = Math.ceil((supplyEnd - now) / (1000 * 60 * 60 * 24));
    if (daysUntilRefill > 7) return 'on_track';
    if (daysUntilRefill > 0) return 'due_soon';
    return 'overdue';
  }

  const days = getDaysSinceActivity(protocol);
  if (days === null) return 'new';
  if (days > 10) return 'overdue';
  if (days >= 7) return 'due_soon';
  return 'on_track';
}

const STATUS_CONFIG = {
  overdue:  { label: 'OVERDUE',  bg: '#fee2e2', color: '#991b1b' },
  due_soon: { label: 'DUE SOON', bg: '#fef3c7', color: '#92400e' },
  on_track: { label: 'On Track', bg: '#dcfce7', color: '#166534' },
  new:      { label: 'New',      bg: '#dbeafe', color: '#1e40af' },
  complete: { label: 'Complete', bg: '#e5e5e5', color: '#666' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysAgo(d) {
  if (!d) return null;
  const diff = Math.floor((new Date() - new Date(d + 'T00:00:00')) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

// =====================================================
// PATIENT ROW COMPONENT
// =====================================================
function PatientRow({ patient: p, expanded, onToggle, onNavigate }) {
  const cfg = STATUS_CONFIG[p._status] || STATUS_CONFIG.on_track;
  const days = getDaysSinceActivity(p);
  const weightChange = (p.current_weight && p.starting_weight) ? (p.current_weight - p.starting_weight) : null;
  const progressPct = p.total_injections > 0 ? Math.round((p.injections_used / p.total_injections) * 100) : 0;

  const displayName = () => {
    const name = p.patient_name || 'Unknown';
    if (p.preferred_name && p.preferred_name !== p.patient_first_name) {
      return <>{name} <span style={{ color: '#888', fontWeight: 400 }}>(&ldquo;{p.preferred_name}&rdquo;)</span></>;
    }
    return name;
  };

  return (
    <>
      <tr style={{ ...sharedStyles.trHover, background: expanded ? '#f9fafb' : undefined, opacity: p._status === 'complete' ? 0.55 : 1 }}
          onClick={onToggle}>
        {/* Patient Name */}
        <td style={sharedStyles.td}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{displayName()}</div>
        </td>

        {/* Phone */}
        <td style={sharedStyles.td}>
          <span style={{ fontSize: 13 }}>{p.phone || '—'}</span>
        </td>

        {/* Type */}
        <td style={sharedStyles.td}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            {(p.delivery_method || 'take_home') === 'take_home' ? 'Take-Home' : 'In-Clinic'}
          </span>
        </td>

        {/* Status */}
        <td style={sharedStyles.td}>
          <span style={{ ...sharedStyles.badge, background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
        </td>

        {/* Medication / Dose */}
        <td style={sharedStyles.td}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{p.medication || '—'}</div>
          {p.current_dose && (
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
              {p.current_dose}
            </div>
          )}
        </td>

        {/* Progress */}
        <td style={sharedStyles.td}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            {p.injections_used} / {p.total_injections}
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${Math.min(progressPct, 100)}%` }} />
          </div>
        </td>

        {/* Weight */}
        <td style={sharedStyles.td}>
          {weightChange !== null ? (
            <div>
              <span style={{
                fontWeight: 600,
                color: weightChange < 0 ? '#16a34a' : weightChange > 0 ? '#dc2626' : '#666',
              }}>
                {weightChange < 0 ? '' : '+'}{weightChange.toFixed(1)} lbs
              </span>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                {p.current_weight} lbs
              </div>
            </div>
          ) : (
            <span style={{ color: '#999' }}>—</span>
          )}
        </td>

        {/* Last Activity */}
        <td style={sharedStyles.td}>
          <div style={{ fontSize: 13 }}>{formatDate(p.last_activity)}</div>
          {p.last_activity && (
            <div style={{ fontSize: 11, color: p._status === 'overdue' ? '#ef4444' : '#999', marginTop: 2, fontWeight: p._status === 'overdue' ? 600 : 400 }}>
              {daysAgo(p.last_activity)}
            </div>
          )}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan="8" style={{ padding: 0, borderBottom: '1px solid #e5e5e5' }}>
            <div style={styles.expandedPanel}>
              <div style={styles.expandedGrid}>
                {/* Patient Details */}
                <div>
                  <div style={styles.expandedLabel}>Patient Details</div>
                  <div style={styles.expandedDetail}>Started: {formatDate(p.start_date)}</div>
                  <div style={styles.expandedDetail}>Delivery: {(p.delivery_method || 'take_home').replace(/_/g, ' ')}</div>
                  {p.starting_weight && (
                    <div style={styles.expandedDetail}>Starting Weight: {p.starting_weight} lbs</div>
                  )}
                  {p.current_weight && (
                    <div style={styles.expandedDetail}>Current Weight: {p.current_weight} lbs</div>
                  )}
                  {p.refill_cycle && (
                    <div style={styles.expandedDetail}>Refill Cycle: {p.refill_cycle}</div>
                  )}
                  {p.next_expected_date && (
                    <div style={styles.expandedDetail}>Next Refill: {formatDate(p.next_expected_date)}</div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                    style={{ ...sharedStyles.btnPrimary, ...sharedStyles.btnSmall, marginTop: 8 }}
                  >
                    View Patient
                  </button>
                </div>

                {/* Protocol Progress */}
                <div>
                  <div style={styles.expandedLabel}>Protocol Progress</div>
                  <div style={styles.expandedDetail}>
                    Medication: {p.medication || '—'} {p.current_dose ? `(${p.current_dose})` : ''}
                  </div>
                  <div style={styles.expandedDetail}>
                    Injections: {p.injections_used} of {p.total_injections} ({progressPct}%)
                  </div>
                  <div style={styles.expandedDetail}>
                    Remaining: {p.injections_remaining || 0}
                  </div>
                  {weightChange !== null && (
                    <div style={{ ...styles.expandedDetail, marginTop: 8 }}>
                      <span style={{ fontWeight: 600, color: weightChange < 0 ? '#16a34a' : weightChange > 0 ? '#dc2626' : '#666' }}>
                        Total Change: {weightChange < 0 ? '' : '+'}{weightChange.toFixed(1)} lbs
                      </span>
                      <span style={{ color: '#999', marginLeft: 8 }}>
                        ({p.starting_weight} → {p.current_weight})
                      </span>
                    </div>
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
  progressBar: {
    width: '80px',
    height: '6px',
    background: '#f0f0f0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#8b5cf6',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
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
