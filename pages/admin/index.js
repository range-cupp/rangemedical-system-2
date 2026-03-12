// /pages/admin/index.js
// Dashboard - Enhanced with appointments, revenue, comms, journey stats
// Range Medical System V2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentProtocols, setRecentProtocols] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentComms, setRecentComms] = useState([]);
  const [consentAlerts, setConsentAlerts] = useState([]);
  const [renewalAlerts, setRenewalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      // Single API call replaces 6 concurrent calls (avoids browser connection limit)
      const res = await fetch('/api/admin/dashboard-v3');
      const data = await res.json();

      setStats(data.stats || {});
      setRecentProtocols(data.recentProtocols || []);
      setTodayAppointments(data.todayAppointments || []);
      setRecentComms(data.recentComms || []);

      // Renewal alerts — enrich with display labels
      const todayDate = new Date();
      const renewals = (data.renewalAlerts || []).map(p => {
        const sessionsUsed = p.sessions_used || 0;
        const sessionsRemaining = p.total_sessions ? (p.total_sessions - sessionsUsed) : null;
        const daysLeft = p.end_date ? Math.ceil((new Date(p.end_date + 'T23:59:59') - todayDate) / (1000 * 60 * 60 * 24)) : null;
        const isDue = sessionsRemaining !== null ? sessionsRemaining <= 0 : (daysLeft !== null && daysLeft <= 0);
        return { ...p, sessionsUsed, sessionsRemaining, isDue, statusLabel: p.total_sessions ? `${sessionsUsed} of ${p.total_sessions} sessions` : `${daysLeft}d left` };
      });
      setRenewalAlerts(renewals);

    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCents = (cents) => {
    if (!cents) return '$0';
    return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });
  };

  const formatRelative = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : (
        <>
          {/* Stats Grid — 2 rows of 4 */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats?.activeProtocols || 0}</div>
              <div style={styles.statLabel}>Active Protocols</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats?.uniquePatients || 0}</div>
              <div style={styles.statLabel}>Active Patients</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats?.todayAppointments || 0}</div>
              <div style={styles.statLabel}>Today's Appointments</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: '#166534' }}>{formatCents(stats?.monthlyRevenue)}</div>
              <div style={styles.statLabel}>Revenue (30 days)</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats?.completedProtocols || 0}</div>
              <div style={styles.statLabel}>Completed Protocols</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: stats?.unassignedPurchases > 0 ? '#dc2626' : '#000' }}>
                {stats?.unassignedPurchases || 0}
              </div>
              <div style={styles.statLabel}>Unassigned Purchases</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: stats?.pendingInvoices > 0 ? '#92400e' : '#000' }}>
                {stats?.pendingInvoices || 0}
              </div>
              <div style={styles.statLabel}>Pending Invoices</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{recentComms.length}</div>
              <div style={styles.statLabel}>Recent Messages</div>
            </div>
          </div>

          {/* Missing Consent Alerts */}
          {consentAlerts.length > 0 && (
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #F59E0B',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>📋</span>
                <strong style={{ fontSize: 14, color: '#92400E' }}>
                  {consentAlerts.length} Missing Consent{consentAlerts.length !== 1 ? 's' : ''} — Signature Required
                </strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {consentAlerts.slice(0, 8).map((alert) => {
                  const patientName = alert.patients?.name ||
                    `${alert.patients?.first_name || ''} ${alert.patients?.last_name || ''}`.trim() || 'Patient';
                  const medication = alert.trigger_data?.medication || '';
                  const consentType = alert.trigger_data?.consent_type || 'peptide';
                  return (
                    <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span style={{
                        background: '#FDE68A', color: '#92400E', padding: '1px 8px',
                        borderRadius: 8, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                      }}>NO {consentType.toUpperCase()} CONSENT</span>
                      <Link href={`/patients/${alert.patient_id}`} style={{ fontWeight: 500, color: '#111', textDecoration: 'none' }}>
                        {patientName}
                      </Link>
                      {medication && <span style={{ color: '#6B7280' }}>— {medication}</span>}
                    </div>
                  );
                })}
                {consentAlerts.length > 8 && (
                  <span style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>
                    + {consentAlerts.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Renewals */}
          {renewalAlerts.length > 0 && (
            <div style={{
              background: '#FFF7ED',
              border: '1px solid #FB923C',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>💰</span>
                <strong style={{ fontSize: 14, color: '#9A3412' }}>
                  {renewalAlerts.length} Protocol{renewalAlerts.length !== 1 ? 's' : ''} Nearing Renewal
                </strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {renewalAlerts.slice(0, 10).map((alert) => (
                  <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{
                      background: alert.isDue ? '#FEE2E2' : '#FEF3C7',
                      color: alert.isDue ? '#DC2626' : '#92400E',
                      padding: '1px 8px',
                      borderRadius: 8, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                    }}>{alert.isDue ? 'RENEWAL DUE' : 'RENEWAL SOON'}</span>
                    <Link href={`/patients/${alert.patient_id}`} style={{ fontWeight: 500, color: '#111', textDecoration: 'none' }}>
                      {alert.patient_name || 'Patient'}
                    </Link>
                    <span style={{ color: '#6B7280' }}>— {alert.program_name}</span>
                    <span style={{ color: alert.isDue ? '#DC2626' : '#92400E', fontWeight: 500 }}>
                      ({alert.statusLabel})
                    </span>
                  </div>
                ))}
                {renewalAlerts.length > 10 && (
                  <span style={{ fontSize: 12, color: '#9A3412', marginTop: 4 }}>
                    + {renewalAlerts.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Quick Actions</h2>
            <div style={styles.actionsGrid}>
              <Link href="/admin/patients" style={styles.actionCard}>
                <span style={styles.actionIcon}>👥</span>
                <span style={styles.actionText}>Patients</span>
              </Link>
              <Link href="/admin/schedule" style={styles.actionCard}>
                <span style={styles.actionIcon}>📅</span>
                <span style={styles.actionText}>Schedule</span>
              </Link>
              <Link href="/admin/service-log" style={styles.actionCard}>
                <span style={styles.actionIcon}>📝</span>
                <span style={styles.actionText}>Service Log</span>
              </Link>
              <Link href="/admin/payments" style={styles.actionCard}>
                <span style={styles.actionIcon}>💳</span>
                <span style={styles.actionText}>Payments</span>
                {stats?.pendingInvoices > 0 && (
                  <span style={styles.actionBadge}>{stats.pendingInvoices} pending</span>
                )}
              </Link>
              <Link href="/admin/journeys" style={styles.actionCard}>
                <span style={styles.actionIcon}>🗺️</span>
                <span style={styles.actionText}>Journeys</span>
              </Link>
              <Link href="/admin/purchases" style={styles.actionCard}>
                <span style={styles.actionIcon}>📦</span>
                <span style={styles.actionText}>Purchases</span>
                {stats?.unassignedPurchases > 0 && (
                  <span style={styles.actionBadge}>{stats.unassignedPurchases} unassigned</span>
                )}
              </Link>
            </div>
          </div>

          {/* Two-column layout: Appointments + Comms */}
          <div style={styles.twoColumn}>
            {/* Today's Appointments */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Today's Appointments</h2>
                <Link href="/admin/schedule" style={styles.viewAllLink}>View all →</Link>
              </div>
              <div style={styles.tableCard}>
                {todayAppointments.length === 0 ? (
                  <div style={styles.empty}>No appointments today</div>
                ) : (
                  <div>
                    {todayAppointments.map(apt => (
                      <div key={apt.id} style={styles.listItem}>
                        <div style={styles.listTime}>{formatTime(apt.start_time)}</div>
                        <div style={styles.listContent}>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>
                            {apt.patient_name || apt.attendee_name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            {apt.service_name || apt.title || '-'}
                          </div>
                        </div>
                        <span style={{
                          ...styles.badge,
                          background: apt.status === 'completed' ? '#dcfce7' : '#f0f0f0',
                          color: apt.status === 'completed' ? '#166534' : '#333',
                        }}>
                          {(apt.status || 'scheduled').replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Communications */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Recent Messages</h2>
                <Link href="/admin/communications" style={styles.viewAllLink}>View all →</Link>
              </div>
              <div style={styles.tableCard}>
                {recentComms.length === 0 ? (
                  <div style={styles.empty}>No recent messages</div>
                ) : (
                  <div>
                    {recentComms.map(comm => (
                      <div key={comm.id} style={styles.listItem}>
                        <div style={styles.listContent}>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>
                            {comm.patient_name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            {(comm.message || '').substring(0, 50)}{(comm.message || '').length > 50 ? '...' : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            ...styles.badge,
                            background: comm.channel === 'sms' ? '#dbeafe' : '#e0e7ff',
                            color: comm.channel === 'sms' ? '#1e40af' : '#4338ca',
                          }}>
                            {comm.channel}
                          </span>
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                            {formatRelative(comm.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Protocols */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Active Protocols</h2>
              <Link href="/admin/protocols" style={styles.viewAllLink}>View all →</Link>
            </div>
            <div style={styles.tableCard}>
              {recentProtocols.length === 0 ? (
                <div style={styles.empty}>No active protocols</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Patient</th>
                      <th style={styles.th}>Program</th>
                      <th style={styles.th}>Progress</th>
                      <th style={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProtocols.map(p => {
                      const total = p.total_sessions || p.duration_days || 10;
                      const current = calculateCurrentDay(p.start_date);
                      const progress = Math.min(100, Math.round((current / total) * 100));

                      return (
                        <tr key={p.id} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={styles.patientName}>{p.patient_name}</div>
                          </td>
                          <td style={styles.td}>{p.program_name || p.program_type}</td>
                          <td style={styles.td}>
                            <div style={styles.progressContainer}>
                              <div style={styles.progressBar}>
                                <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                              </div>
                              <span style={styles.progressText}>Day {current}/{total}</span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <Link href={`/patients/${p.patient_id}`} style={styles.viewBtn}>
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function calculateCurrentDay(startDate) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = today - start;
  return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
}

const styles = {
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#666'
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '28px'
  },
  statCard: {
    background: '#fff',
    padding: '18px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '2px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#999',
    fontWeight: '500',
  },

  // Sections
  section: {
    marginBottom: '28px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0
  },
  viewAllLink: {
    fontSize: '13px',
    color: '#666',
    textDecoration: 'none'
  },

  // Two column
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },

  // Actions
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '12px'
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 12px',
    background: '#fff',
    borderRadius: '12px',
    textDecoration: 'none',
    color: '#000',
    border: '1px solid #e5e5e5',
  },
  actionIcon: {
    fontSize: '28px',
    marginBottom: '6px'
  },
  actionText: {
    fontSize: '13px',
    fontWeight: '500'
  },
  actionBadge: {
    marginTop: '6px',
    padding: '3px 8px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '500'
  },

  // List items (appointments, comms)
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
  },
  listTime: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    minWidth: '70px',
  },
  listContent: {
    flex: 1,
    minWidth: 0,
  },

  // Table
  tableCard: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e5e5',
  },
  empty: {
    padding: '32px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
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
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  progressBar: {
    width: '100px',
    height: '6px',
    background: '#e5e5e5',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: '#000',
    borderRadius: '3px'
  },
  progressText: {
    fontSize: '12px',
    color: '#666',
    whiteSpace: 'nowrap'
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
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
};
