// /pages/admin/index.js
// Dashboard - appointments, revenue, comms
// Range Medical System V2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import SMSComposeModal from '../../components/SMSComposeModal';
import PipelineBoard from '../../components/pipelines/PipelineBoard';
import PipelineDetailPanel from '../../components/pipelines/PipelineDetailPanel';
import { getPipeline } from '../../lib/pipelines-config';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentComms, setRecentComms] = useState([]);
  const [consentAlerts, setConsentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [smsTarget, setSmsTarget] = useState(null); // { phone, name, patientId }
  const [upcomingLabDraws, setUpcomingLabDraws] = useState([]);
  const [pipelineCards, setPipelineCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard-v3');
      const data = await res.json();

      setStats(data.stats || {});
      setTodayAppointments(data.todayAppointments || []);
      setRecentComms(data.recentComms || []);
      setUpcomingLabDraws(data.upcomingLabDraws || []);

      fetch('/api/pipelines/energy_workup')
        .then(r => r.ok ? r.json() : [])
        .then(c => setPipelineCards(c || []))
        .catch(() => {});
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' });
  };

  const formatApptDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
  };

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : (
        <>
          {/* ═══ MAIN PIPELINE ═══ */}
          <div style={{ marginBottom: 28 }}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={styles.sectionTitle}>Main Pipeline</h2>
                <span style={{ background: '#000', color: '#fff', padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                  {pipelineCards.length} active
                </span>
              </div>
              <Link href="/admin/pipelines/energy_workup" style={styles.viewAllLink}>Full board →</Link>
            </div>
            <PipelineBoard
              pipeline={getPipeline('energy_workup')}
              cards={pipelineCards}
              onCardClick={setSelectedCard}
            />
          </div>

          {/* ═══ UPCOMING LAB DRAWS ═══ */}
          {upcomingLabDraws.length > 0 && (
            <div style={styles.labDrawsSection}>
              <div style={styles.labDrawsHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Upcoming Lab Draws</h2>
                  <span style={{
                    background: upcomingLabDraws.some(d => d.daysUntilDue <= 0) ? '#dc2626' : '#000',
                    color: '#fff', padding: '2px 8px', fontSize: 11, fontWeight: 600,
                  }}>{upcomingLabDraws.length} patient{upcomingLabDraws.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div style={styles.labDrawsHeaderRow}>
                <span style={{ flex: '0 0 180px' }}>Patient</span>
                <span style={{ flex: '0 0 140px' }}>Draw</span>
                <span style={{ flex: '0 0 110px' }}>Due Date</span>
                <span style={{ flex: '0 0 100px' }}>Status</span>
                <span style={{ flex: '0 0 140px' }}>Appointment</span>
                <span style={{ flex: 1 }} />
              </div>
              {upcomingLabDraws.map((draw, i) => {
                const isOverdue = draw.daysUntilDue < 0;
                const isDueToday = draw.daysUntilDue === 0;
                const isDueSoon = draw.daysUntilDue > 0 && draw.daysUntilDue <= 7;
                const borderColor = isOverdue ? '#dc2626' : isDueToday ? '#d97706' : isDueSoon ? '#f59e0b' : 'transparent';
                return (
                  <div key={`${draw.patientId}-${i}`} style={{
                    ...styles.labDrawRow,
                    borderLeft: `3px solid ${borderColor}`,
                  }}>
                    <div style={{ flex: '0 0 180px' }}>
                      <Link href={`/patients/${draw.patientId}`} style={{ fontSize: 13, fontWeight: 600, color: '#000', textDecoration: 'none' }}>
                        {draw.patientName}
                      </Link>
                    </div>
                    <div style={{ flex: '0 0 140px', fontSize: 12, color: '#525252' }}>
                      {draw.drawLabel}
                    </div>
                    <div style={{ flex: '0 0 110px', fontSize: 12 }}>
                      {formatDate(draw.dueDate)}
                    </div>
                    <div style={{ flex: '0 0 100px' }}>
                      {isOverdue ? (
                        <span style={styles.labDrawBadgeOverdue}>
                          {Math.abs(draw.daysUntilDue)}d overdue
                        </span>
                      ) : isDueToday ? (
                        <span style={styles.labDrawBadgeToday}>Due today</span>
                      ) : isDueSoon ? (
                        <span style={styles.labDrawBadgeSoon}>{draw.daysUntilDue}d</span>
                      ) : (
                        <span style={styles.labDrawBadgeOk}>{draw.daysUntilDue}d</span>
                      )}
                    </div>
                    <div style={{ flex: '0 0 140px', fontSize: 12 }}>
                      {draw.hasAppointment ? (
                        <span style={{ color: '#15803d', fontWeight: 600 }}>
                          Booked {formatApptDate(draw.scheduledDate)}
                        </span>
                      ) : (
                        <span style={{ color: '#a3a3a3' }}>Not scheduled</span>
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      {draw.phone && (
                        <button
                          onClick={() => setSmsTarget({ phone: draw.phone, name: draw.patientName, patientId: draw.patientId })}
                          style={{ fontSize: 9, fontWeight: 600, color: '#1d4ed8', background: '#eff6ff', border: 'none', cursor: 'pointer', padding: '1px 6px', whiteSpace: 'nowrap' }}
                        >
                          Text
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ STATS GRID ═══ */}
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
              <div style={styles.statLabel}>Today's Appts</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: '#166534' }}>{formatCents(stats?.monthlyRevenue)}</div>
              <div style={styles.statLabel}>Revenue (30d)</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: stats?.unassignedPurchases > 0 ? '#dc2626' : '#000' }}>
                {stats?.unassignedPurchases || 0}
              </div>
              <div style={styles.statLabel}>Unassigned</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: stats?.pendingInvoices > 0 ? '#92400e' : '#000' }}>
                {stats?.pendingInvoices || 0}
              </div>
              <div style={styles.statLabel}>Pending Invoices</div>
            </div>
          </div>

          {/* ═══ ALERTS ═══ */}
          {consentAlerts.length > 0 && (
            <div style={{
              background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 0,
              padding: '16px 20px', marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <strong style={{ fontSize: 14, color: '#92400E' }}>
                  {consentAlerts.length} Missing Consent{consentAlerts.length !== 1 ? 's' : ''}
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
                        borderRadius: 0, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                      }}>NO {consentType.toUpperCase()} CONSENT</span>
                      <Link href={`/patients/${alert.patient_id}`} style={{ fontWeight: 500, color: '#111', textDecoration: 'none' }}>
                        {patientName}
                      </Link>
                      {medication && <span style={{ color: '#6B7280' }}>— {medication}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ QUICK ACTIONS ═══ */}
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
              <Link href="/admin/pipelines" style={styles.actionCard}>
                <span style={styles.actionIcon}>🗺️</span>
                <span style={styles.actionText}>Pipelines</span>
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

          {/* ═══ TWO-COLUMN: APPOINTMENTS + COMMS ═══ */}
          <div style={styles.twoColumn}>
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

        </>
      )}

      {/* Pipeline Detail Panel */}
      {selectedCard && (
        <PipelineDetailPanel
          card={selectedCard}
          pipeline={getPipeline('energy_workup')}
          onClose={() => setSelectedCard(null)}
          onSaved={(updated) => {
            setPipelineCards(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
            setSelectedCard(prev => prev ? { ...prev, ...updated } : null);
          }}
          onDeleted={(deleted) => {
            setPipelineCards(prev => prev.filter(c => c.id !== deleted.id));
            setSelectedCard(null);
          }}
        />
      )}

      {/* SMS Compose Modal */}
      <SMSComposeModal
        isOpen={!!smsTarget}
        onClose={() => setSmsTarget(null)}
        recipientPhone={smsTarget?.phone || ''}
        recipientName={smsTarget?.name || ''}
        patientId={smsTarget?.patientId || null}
        patientName={smsTarget?.name || ''}
      />
    </AdminLayout>
  );
}

const styles = {
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#666'
  },

  // ═══ Upcoming Lab Draws ═══
  labDrawsSection: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
    marginBottom: 28,
    overflow: 'hidden',
  },
  labDrawsHeader: {
    padding: '14px 20px',
    borderBottom: '1px solid #e5e5e5',
  },
  labDrawsHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 20px',
    background: '#fafafa',
    borderBottom: '1px solid #e5e5e5',
    fontSize: 10,
    fontWeight: 700,
    color: '#737373',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  labDrawRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderBottom: '1px solid #f0f0f0',
  },
  labDrawBadgeOverdue: {
    fontSize: 10,
    fontWeight: 700,
    color: '#dc2626',
    background: '#fef2f2',
    padding: '2px 6px',
    border: '1px solid #fecaca',
  },
  labDrawBadgeToday: {
    fontSize: 10,
    fontWeight: 700,
    color: '#d97706',
    background: '#fffbeb',
    padding: '2px 6px',
    border: '1px solid #fde68a',
  },
  labDrawBadgeSoon: {
    fontSize: 10,
    fontWeight: 700,
    color: '#d97706',
    background: '#fffbeb',
    padding: '2px 6px',
    border: '1px solid #fde68a',
  },
  labDrawBadgeOk: {
    fontSize: 10,
    fontWeight: 600,
    color: '#15803d',
    background: '#f0fdf4',
    padding: '2px 6px',
  },

  // ═══ Stats ═══
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '12px',
    marginBottom: '28px'
  },
  statCard: {
    background: '#fff',
    padding: '16px',
    borderRadius: 0,
    border: '1px solid #e5e5e5',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '2px'
  },
  statLabel: {
    fontSize: '11px',
    color: '#999',
    fontWeight: '500',
  },

  // ═══ Sections ═══
  section: { marginBottom: '28px' },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  sectionTitle: { fontSize: '16px', fontWeight: '600', margin: 0 },
  viewAllLink: { fontSize: '13px', color: '#666', textDecoration: 'none' },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
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
    borderRadius: 0,
    textDecoration: 'none',
    color: '#000',
    border: '1px solid #e5e5e5',
  },
  actionIcon: { fontSize: '28px', marginBottom: '6px' },
  actionText: { fontSize: '13px', fontWeight: '500' },
  actionBadge: {
    marginTop: '6px',
    padding: '3px 8px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: 0,
    fontSize: '11px',
    fontWeight: '500'
  },

  // ═══ Lists ═══
  listItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
  },
  listTime: { fontSize: '13px', fontWeight: '600', color: '#333', minWidth: '70px' },
  listContent: { flex: 1, minWidth: 0 },

  // ═══ Table ═══
  tableCard: {
    background: '#fff', borderRadius: 0, overflow: 'hidden', border: '1px solid #e5e5e5',
  },
  empty: { padding: '32px', textAlign: 'center', color: '#999', fontSize: '14px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600',
    textTransform: 'uppercase', color: '#666', borderBottom: '1px solid #e5e5e5', background: '#fafafa'
  },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px' },
  patientName: { fontWeight: '500' },
  progressContainer: { display: 'flex', alignItems: 'center', gap: '12px' },
  progressBar: { width: '100px', height: '6px', background: '#e5e5e5', borderRadius: 0, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#000', borderRadius: 0 },
  progressText: { fontSize: '12px', color: '#666', whiteSpace: 'nowrap' },
  viewBtn: {
    padding: '6px 12px', background: '#000', color: '#fff', borderRadius: 0,
    fontSize: '12px', fontWeight: '500', textDecoration: 'none'
  },
  badge: {
    padding: '4px 10px', borderRadius: 0, fontSize: '11px',
    fontWeight: '600', textTransform: 'uppercase',
  },
};
