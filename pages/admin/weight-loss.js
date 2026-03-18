// /pages/admin/weight-loss.js
// Weight Loss Daily Tracker — single view for Take-Home + In-Clinic tracking
// Range Medical System

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';

const TABS = [
  { id: 'take_home', label: 'Take-Home' },
  { id: 'in_clinic', label: 'In-Clinic' },
];

function getDaysSinceActivity(protocol) {
  // Use the most recent activity (lowest days value) from checkin or injection/pickup
  const c = protocol.days_since_last_checkin;
  const i = protocol.days_since_last_injection;
  if (c !== null && i !== null) return Math.min(c, i);
  return c ?? i ?? null;
}

function getStatus(protocol) {
  if (protocol.status === 'completed' || protocol.injections_remaining <= 0) return 'complete';
  const days = getDaysSinceActivity(protocol);
  if (days === null) return 'new';
  if (days > 10) return 'overdue';
  if (days >= 7) return 'due_soon';
  return 'on_track';
}

const STATUS_CONFIG = {
  overdue:  { label: 'Overdue',  bg: '#fef2f2', color: '#dc2626', dot: '#dc2626' },
  due_soon: { label: 'Due Soon', bg: '#fffbeb', color: '#d97706', dot: '#d97706' },
  on_track: { label: 'On Track', bg: '#f0fdf4', color: '#16a34a', dot: '#16a34a' },
  new:      { label: 'New',      bg: '#eff6ff', color: '#2563eb', dot: '#2563eb' },
  complete: { label: 'Complete', bg: '#f5f5f5', color: '#666',    dot: '#999' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysAgoText(days) {
  if (days === null || days === undefined) return '';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function displayName(protocol) {
  const name = protocol.patient_name || 'Unknown';
  if (protocol.preferred_name && protocol.preferred_name !== protocol.patient_first_name) {
    return <>{name} <span style={{ color: '#888', fontWeight: 400 }}>("{protocol.preferred_name}")</span></>;
  }
  return name;
}

export default function WeightLossTracker() {
  const router = useRouter();
  const [protocols, setProtocols] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('take_home');
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch enriched weight loss protocols
      const res = await fetch('/api/pipelines/weight-loss');
      const data = await res.json();
      if (data.success) {
        setProtocols(data.protocols || []);
      }

      // Fetch today's weight loss service logs
      const today = new Date().toISOString().slice(0, 10);
      const { data: logs } = await supabase
        .from('service_logs')
        .select('id, patient_id, entry_date, medication, dosage, weight, entry_type, notes, patients(name, preferred_name, first_name)')
        .eq('category', 'weight_loss')
        .eq('entry_date', today)
        .order('created_at', { ascending: false });
      setTodayLogs(logs || []);
    } catch (err) {
      console.error('Failed to fetch weight loss data:', err);
    }
    setLoading(false);
  }

  // Filter + categorize
  const filtered = protocols.filter(p => {
    const dm = p.delivery_method || 'take_home';
    if (dm !== activeTab) return false;
    if (!showCompleted && getStatus(p) === 'complete') return false;
    return true;
  });

  // Sort: overdue first, then due_soon, on_track, new, complete
  const statusOrder = { overdue: 0, due_soon: 1, on_track: 2, new: 3, complete: 4 };
  filtered.sort((a, b) => {
    const sa = statusOrder[getStatus(a)] ?? 5;
    const sb = statusOrder[getStatus(b)] ?? 5;
    if (sa !== sb) return sa - sb;
    // Secondary: by days since activity (most overdue first)
    const aDays = getDaysSinceActivity(a);
    const bDays = getDaysSinceActivity(b);
    return (bDays || -1) - (aDays || -1);
  });

  // Summary stats
  const activeProtocols = protocols.filter(p => getStatus(p) !== 'complete');
  const takeHomeActive = activeProtocols.filter(p => (p.delivery_method || 'take_home') === 'take_home').length;
  const inClinicActive = activeProtocols.filter(p => (p.delivery_method || 'take_home') === 'in_clinic').length;
  const overdueCount = activeProtocols.filter(p => getStatus(p) === 'overdue').length;
  const todayCount = todayLogs.length;

  return (
    <AdminLayout title="Weight Loss Tracker">
      {/* Summary Cards */}
      <div style={styles.statsGrid}>
        <div style={{ ...sharedStyles.statCard, borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ ...sharedStyles.statValue, color: '#8b5cf6' }}>{takeHomeActive}</div>
          <div style={sharedStyles.statLabel}>Take-Home Active</div>
        </div>
        <div style={{ ...sharedStyles.statCard, borderLeft: '4px solid #2563eb' }}>
          <div style={{ ...sharedStyles.statValue, color: '#2563eb' }}>{inClinicActive}</div>
          <div style={sharedStyles.statLabel}>In-Clinic Active</div>
        </div>
        <div style={{ ...sharedStyles.statCard, borderLeft: '4px solid #dc2626' }}>
          <div style={{ ...sharedStyles.statValue, color: overdueCount > 0 ? '#dc2626' : '#999' }}>{overdueCount}</div>
          <div style={sharedStyles.statLabel}>Overdue</div>
        </div>
        <div style={{ ...sharedStyles.statCard, borderLeft: '4px solid #16a34a' }}>
          <div style={{ ...sharedStyles.statValue, color: todayCount > 0 ? '#16a34a' : '#999' }}>{todayCount}</div>
          <div style={sharedStyles.statLabel}>Check-ins Today</div>
        </div>
      </div>

      {/* Today's Activity */}
      {todayLogs.length > 0 && (
        <div style={{ ...sharedStyles.card, marginBottom: '24px' }}>
          <div style={{ ...sharedStyles.cardHeader, background: '#f0fdf4' }}>
            <h3 style={{ ...sharedStyles.cardTitle, color: '#16a34a' }}>Today&apos;s Activity</h3>
            <span style={{ fontSize: '12px', color: '#666' }}>{todayLogs.length} entr{todayLogs.length === 1 ? 'y' : 'ies'}</span>
          </div>
          <div style={{ padding: 0 }}>
            <table style={sharedStyles.table}>
              <thead>
                <tr>
                  <th style={sharedStyles.th}>Patient</th>
                  <th style={sharedStyles.th}>Type</th>
                  <th style={sharedStyles.th}>Medication</th>
                  <th style={sharedStyles.th}>Dose</th>
                  <th style={sharedStyles.th}>Weight</th>
                  <th style={sharedStyles.th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {todayLogs.map(log => {
                  const pName = log.patients?.name || 'Unknown';
                  const pref = log.patients?.preferred_name;
                  const firstName = log.patients?.first_name;
                  return (
                    <tr key={log.id}>
                      <td style={{ ...sharedStyles.td, fontWeight: 500 }}>
                        <Link href={`/patients/${log.patient_id}`} style={{ color: '#000', textDecoration: 'none' }}>
                          {pName}
                          {pref && pref !== firstName && <span style={{ color: '#888', fontWeight: 400 }}> ("{pref}")</span>}
                        </Link>
                      </td>
                      <td style={sharedStyles.td}>
                        <span style={styles.typeBadge}>{log.entry_type === 'pickup' ? 'Pickup' : 'Injection'}</span>
                      </td>
                      <td style={sharedStyles.td}>{log.medication || '—'}</td>
                      <td style={sharedStyles.td}>{log.dosage || '—'}</td>
                      <td style={{ ...sharedStyles.td, fontWeight: 600 }}>{log.weight ? `${log.weight} lbs` : '—'}</td>
                      <td style={{ ...sharedStyles.td, color: '#666', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ ...sharedStyles.card }}>
        <div style={styles.tabBar}>
          <div style={{ display: 'flex', gap: '0' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.tabActive : {}),
                }}
              >
                {tab.label}
                <span style={{
                  ...styles.tabCount,
                  background: activeTab === tab.id ? '#000' : '#e5e5e5',
                  color: activeTab === tab.id ? '#fff' : '#666',
                }}>
                  {protocols.filter(p => (p.delivery_method || 'take_home') === tab.id && getStatus(p) !== 'complete').length}
                </span>
              </button>
            ))}
          </div>
          <label style={styles.showCompleted}>
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={e => setShowCompleted(e.target.checked)}
              style={{ marginRight: '6px' }}
            />
            Show Completed
          </label>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>
            No {activeTab === 'take_home' ? 'take-home' : 'in-clinic'} weight loss protocols{showCompleted ? '' : ' (active)'}.
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={sharedStyles.table}>
              <thead>
                <tr>
                  <th style={sharedStyles.th}>Status</th>
                  <th style={sharedStyles.th}>Patient</th>
                  <th style={sharedStyles.th}>Medication / Dose</th>
                  <th style={sharedStyles.th}>Progress</th>
                  <th style={sharedStyles.th}>Start Wt</th>
                  <th style={sharedStyles.th}>Current Wt</th>
                  <th style={sharedStyles.th}>Change</th>
                  <th style={sharedStyles.th}>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const status = getStatus(p);
                  const cfg = STATUS_CONFIG[status];
                  const days = getDaysSinceActivity(p);
                  const weightChange = (p.current_weight && p.starting_weight) ? (p.current_weight - p.starting_weight) : null;
                  const progressPct = p.total_injections > 0 ? Math.round((p.injections_used / p.total_injections) * 100) : 0;

                  return (
                    <tr
                      key={p.id}
                      style={{ opacity: status === 'complete' ? 0.55 : 1, cursor: 'pointer' }}
                      onClick={(e) => {
                        // Don't navigate if clicking a link (patient name)
                        if (e.target.closest('a')) return;
                        router.push(`/patients/${p.patient_id}`);
                      }}
                    >
                      {/* Status */}
                      <td style={sharedStyles.td}>
                        <span style={{ ...styles.statusBadge, background: cfg.bg, color: cfg.color }}>
                          <span style={{ ...styles.statusDot, background: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Patient */}
                      <td style={{ ...sharedStyles.td, fontWeight: 500 }}>
                        <Link href={`/patients/${p.patient_id}`} style={{ color: '#000', textDecoration: 'none' }}>
                          {displayName(p)}
                        </Link>
                        {p.phone && <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{p.phone}</div>}
                      </td>

                      {/* Medication / Dose */}
                      <td style={sharedStyles.td}>
                        <div style={{ fontWeight: 500 }}>{p.medication || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{p.current_dose || '—'}</div>
                      </td>

                      {/* Progress */}
                      <td style={sharedStyles.td}>
                        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                          {p.injections_used} / {p.total_injections}
                        </div>
                        <div style={styles.progressBar}>
                          <div style={{ ...styles.progressFill, width: `${Math.min(progressPct, 100)}%` }} />
                        </div>
                      </td>

                      {/* Start Weight */}
                      <td style={{ ...sharedStyles.td, fontVariantNumeric: 'tabular-nums' }}>
                        {p.starting_weight ? `${p.starting_weight} lbs` : '—'}
                      </td>

                      {/* Current Weight */}
                      <td style={{ ...sharedStyles.td, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {p.current_weight ? `${p.current_weight} lbs` : '—'}
                      </td>

                      {/* Weight Change */}
                      <td style={sharedStyles.td}>
                        {weightChange !== null ? (
                          <span style={{
                            fontWeight: 600,
                            color: weightChange < 0 ? '#16a34a' : weightChange > 0 ? '#dc2626' : '#666',
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {weightChange < 0 ? '' : '+'}{weightChange.toFixed(1)} lbs
                          </span>
                        ) : '—'}
                      </td>

                      {/* Last Activity */}
                      <td style={sharedStyles.td}>
                        <div>{formatDate(p.last_activity)}</div>
                        <div style={{
                          fontSize: '11px',
                          color: status === 'overdue' ? '#dc2626' : status === 'due_soon' ? '#d97706' : '#999',
                          fontWeight: status === 'overdue' ? 600 : 400,
                        }}>
                          {daysAgoText(days)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  tabBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    borderBottom: '1px solid #e5e5e5',
  },
  tab: {
    padding: '14px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '14px',
    fontWeight: 500,
    color: '#666',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tabActive: {
    color: '#000',
    borderBottomColor: '#000',
  },
  tabCount: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
  },
  showCompleted: {
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  typeBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 500,
    background: '#f3f4f6',
    color: '#374151',
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
};
