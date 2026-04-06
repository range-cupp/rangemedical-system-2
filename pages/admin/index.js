// /pages/admin/index.js
// Dashboard - Labs Pipeline hero + appointments, revenue, comms
// Range Medical System V2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

const LAB_STAGES = [
  { id: 'awaiting_results', label: 'Awaiting Results', shortLabel: 'Awaiting' },
  { id: 'uploaded', label: 'Uploaded', shortLabel: 'Uploaded' },
  { id: 'under_review', label: 'Under Review', shortLabel: 'Review' },
  { id: 'ready_to_schedule', label: 'Ready to Schedule', shortLabel: 'Schedule' },
  { id: 'consult_scheduled', label: 'Consult Booked', shortLabel: 'Consult' },
  { id: 'in_treatment', label: 'In Treatment', shortLabel: 'Treatment' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [labPipeline, setLabPipeline] = useState(null);
  const [wlSchedule, setWlSchedule] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentComms, setRecentComms] = useState([]);
  const [consentAlerts, setConsentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard-v3');
      const data = await res.json();

      setStats(data.stats || {});
      setLabPipeline(data.labPipeline || null);
      setWlSchedule(data.wlSchedule || []);
      setTodayAppointments(data.todayAppointments || []);
      setRecentComms(data.recentComms || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const advanceLab = async (labId, currentStage) => {
    const currentIndex = LAB_STAGES.findIndex(s => s.id === currentStage);
    if (currentIndex < 0 || currentIndex >= LAB_STAGES.length - 1) return;
    const nextStage = LAB_STAGES[currentIndex + 1].id;
    setAdvancing(labId);
    try {
      await fetch('/api/admin/labs-pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: labId, newStage: nextStage })
      });
      await fetchDashboard();
    } catch (err) {
      console.error('Advance error:', err);
    } finally {
      setAdvancing(null);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysInStage = (updatedAt) => {
    if (!updatedAt) return 0;
    const updated = new Date(updatedAt);
    const now = new Date();
    return Math.floor((now - updated) / (1000 * 60 * 60 * 24));
  };

  // Active stages = everything except consult_complete
  const activeStages = LAB_STAGES.filter(s => s.id !== 'consult_complete');

  // Weight loss schedule — group patients by their scheduled day
  const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };

  const today = new Date();
  const todayDow = today.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Los_Angeles' }).toLowerCase();

  const wlByDay = {};
  WEEK_DAYS.forEach(d => { wlByDay[d] = []; });
  wlSchedule.forEach(p => {
    if (p.scheduled_days && p.scheduled_days.length > 0) {
      p.scheduled_days.forEach(day => {
        if (wlByDay[day]) wlByDay[day].push(p);
      });
    } else {
      // No scheduled day set — show in an "unscheduled" bucket
      if (!wlByDay._unscheduled) wlByDay._unscheduled = [];
      wlByDay._unscheduled.push(p);
    }
  });

  const getMedShort = (med) => {
    if (!med) return '';
    const m = med.toLowerCase();
    if (m.includes('semaglutide')) return 'Sema';
    if (m.includes('tirzepatide')) return 'Tirz';
    if (m.includes('retatrutide')) return 'Retat';
    return med;
  };

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : (
        <>
          {/* ═══ WEIGHT LOSS WEEKLY SCHEDULE ═══ */}
          {wlSchedule.length > 0 && (
            <div style={styles.wlSection}>
              <div style={styles.pipelineHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h2 style={styles.pipelineTitle}>Weight Loss — This Week</h2>
                  <span style={styles.totalBadge}>{wlSchedule.length} in-clinic</span>
                </div>
              </div>

              <div style={styles.wlGrid}>
                {WEEK_DAYS.map(day => {
                  const patients = wlByDay[day] || [];
                  const isToday = day === todayDow;
                  return (
                    <div key={day} style={{
                      ...styles.wlDayColumn,
                      ...(isToday ? styles.wlDayColumnToday : {}),
                    }}>
                      <div style={{
                        ...styles.wlDayHeader,
                        ...(isToday ? styles.wlDayHeaderToday : {}),
                      }}>
                        <span style={{ ...styles.wlDayLabel, ...(isToday ? { color: '#fff' } : {}) }}>{DAY_LABELS[day]}</span>
                        {patients.length > 0 && (
                          <span style={{
                            ...styles.wlDayCount,
                            ...(isToday ? { background: '#000', color: '#fff' } : {}),
                          }}>{patients.length}</span>
                        )}
                      </div>
                      <div style={styles.wlDayBody}>
                        {patients.length === 0 ? (
                          <div style={styles.wlEmpty}>—</div>
                        ) : (
                          patients.map(p => (
                            <Link key={p.id} href={`/patients/${p.patient_id}`} style={styles.wlCard}>
                              <div style={styles.wlPatientName}>{p.patient_name}</div>
                              <div style={styles.wlCardMeta}>
                                <span style={styles.wlMedBadge}>{getMedShort(p.medication)}</span>
                                {p.current_dose && <span style={styles.wlDose}>{p.current_dose}</span>}
                              </div>
                              {p.last_visit_date && (
                                <div style={styles.wlLastVisit}>Last: {formatDate(p.last_visit_date)}</div>
                              )}
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {wlByDay._unscheduled && wlByDay._unscheduled.length > 0 && (
                <div style={styles.wlUnscheduled}>
                  <span style={styles.wlUnscheduledLabel}>No day set:</span>
                  {wlByDay._unscheduled.map(p => (
                    <Link key={p.id} href={`/patients/${p.patient_id}`} style={styles.wlUnscheduledPatient}>
                      {p.patient_name}
                      <span style={styles.wlMedBadge}>{getMedShort(p.medication)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ LABS PIPELINE HERO ═══ */}
          <div style={styles.pipelineSection}>
            <div style={styles.pipelineHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={styles.pipelineTitle}>Labs Pipeline</h2>
                {labPipeline?.total > 0 && (
                  <span style={styles.totalBadge}>{labPipeline.total} active</span>
                )}
              </div>
              <Link href="/admin/command-center" style={styles.viewAllLink}>
                Full Pipeline →
              </Link>
            </div>

            {/* Stage counts bar */}
            <div style={styles.stageCountsBar}>
              {LAB_STAGES.map((stage, i) => {
                const count = labPipeline?.counts?.[stage.id] || 0;
                const isLast = i === LAB_STAGES.length - 1;
                return (
                  <div key={stage.id} style={styles.stageCountItem}>
                    <div style={{
                      ...styles.stageCountDot,
                      background: count > 0 ? '#000' : '#d4d4d4',
                    }} />
                    <span style={{
                      ...styles.stageCountNumber,
                      color: count > 0 ? '#000' : '#a3a3a3',
                    }}>{count}</span>
                    <span style={styles.stageCountLabel}>{stage.shortLabel}</span>
                    {!isLast && <div style={styles.stageCountLine} />}
                  </div>
                );
              })}
            </div>

            {/* Pipeline Kanban columns — only active (non-complete) stages */}
            {labPipeline?.total > 0 && (
              <div style={styles.kanbanGrid}>
                {activeStages.map(stage => {
                  const cards = labPipeline?.cards?.[stage.id] || [];
                  const count = labPipeline?.counts?.[stage.id] || 0;
                  return (
                    <div key={stage.id} style={styles.kanbanColumn}>
                      <div style={styles.kanbanColumnHeader}>
                        <span style={styles.kanbanColumnTitle}>{stage.label}</span>
                        {count > 0 && <span style={styles.kanbanColumnCount}>{count}</span>}
                      </div>
                      <div style={styles.kanbanColumnBody}>
                        {cards.length === 0 ? (
                          <div style={styles.kanbanEmpty}>—</div>
                        ) : (
                          cards.map(lab => {
                            const daysIn = getDaysInStage(lab.updated_at);
                            const isElite = (lab.medication || '').toLowerCase() === 'elite';
                            return (
                              <div key={lab.id} style={styles.kanbanCard}>
                                <div style={styles.kanbanCardTop}>
                                  <Link href={`/patients/${lab.patient_id}`} style={styles.kanbanPatientName}>
                                    {lab.patient_name || 'Unknown'}
                                  </Link>
                                  {daysIn > 0 && (
                                    <span style={{
                                      ...styles.kanbanDays,
                                      color: daysIn >= 7 ? '#dc2626' : daysIn >= 3 ? '#d97706' : '#737373',
                                    }}>{daysIn}d</span>
                                  )}
                                </div>
                                <div style={styles.kanbanCardMeta}>
                                  <span style={{
                                    ...styles.kanbanBadge,
                                    background: isElite ? '#f0fdf4' : '#f5f5f5',
                                    color: isElite ? '#15803d' : '#525252',
                                  }}>
                                    {isElite ? 'Elite' : 'Essential'}
                                  </span>
                                  {lab.delivery_method === 'follow_up' && (
                                    <span style={{ ...styles.kanbanBadge, background: '#eff6ff', color: '#1d4ed8' }}>
                                      Follow-up
                                    </span>
                                  )}
                                  {lab.start_date && (
                                    <span style={styles.kanbanDate}>{formatDate(lab.start_date)}</span>
                                  )}
                                </div>
                                {stage.id !== 'consult_complete' && (
                                  <button
                                    onClick={() => advanceLab(lab.id, stage.id)}
                                    disabled={advancing === lab.id}
                                    style={styles.kanbanAdvanceBtn}
                                  >
                                    {advancing === lab.id ? '...' : `→ ${LAB_STAGES[LAB_STAGES.findIndex(s => s.id === stage.id) + 1]?.shortLabel || 'Next'}`}
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                        {count > cards.length && (
                          <div style={styles.kanbanMore}>+{count - cards.length} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!labPipeline?.total && (
              <div style={styles.pipelineEmpty}>No active lab orders</div>
            )}
          </div>

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
    </AdminLayout>
  );
}

const styles = {
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#666'
  },

  // ═══ Weight Loss Schedule ═══
  wlSection: {
    background: '#fff',
    borderRadius: 0,
    border: '1px solid #e5e5e5',
    padding: '20px 24px',
    marginBottom: 28,
  },
  wlGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 8,
  },
  wlDayColumn: {
    background: '#fafafa',
    borderRadius: 0,
    overflow: 'hidden',
    minHeight: 60,
  },
  wlDayColumnToday: {
    border: '2px solid #000',
  },
  wlDayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    borderBottom: '1px solid #e5e5e5',
  },
  wlDayHeaderToday: {
    background: '#000',
  },
  wlDayLabel: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'inherit',
  },
  wlDayCount: {
    fontSize: 11,
    fontWeight: 600,
    background: '#e5e5e5',
    color: '#525252',
    padding: '1px 6px',
    borderRadius: 0,
  },
  wlDayBody: {
    padding: 6,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  wlEmpty: {
    textAlign: 'center',
    color: '#d4d4d4',
    fontSize: 13,
    padding: '8px 0',
  },
  wlCard: {
    background: '#fff',
    borderRadius: 0,
    padding: '8px 10px',
    border: '1px solid #e5e5e5',
    textDecoration: 'none',
    color: '#000',
    display: 'block',
  },
  wlPatientName: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 3,
  },
  wlCardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  wlMedBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '1px 6px',
    background: '#f0fdf4',
    color: '#15803d',
    borderRadius: 0,
  },
  wlDose: {
    fontSize: 11,
    color: '#737373',
  },
  wlLastVisit: {
    fontSize: 10,
    color: '#a3a3a3',
    marginTop: 3,
  },
  wlUnscheduled: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 12,
    padding: '10px 12px',
    background: '#fffbeb',
    border: '1px solid #fde68a',
  },
  wlUnscheduledLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#92400e',
  },
  wlUnscheduledPatient: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
    color: '#111',
    textDecoration: 'none',
  },

  // ═══ Labs Pipeline ═══
  pipelineSection: {
    background: '#fff',
    borderRadius: 0,
    border: '1px solid #e5e5e5',
    padding: '20px 24px',
    marginBottom: 28,
  },
  pipelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pipelineTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
  },
  totalBadge: {
    background: '#000',
    color: '#fff',
    padding: '3px 10px',
    borderRadius: 0,
    fontSize: 12,
    fontWeight: 600,
  },
  pipelineEmpty: {
    padding: '24px 0',
    textAlign: 'center',
    color: '#a3a3a3',
    fontSize: 14,
  },

  // Stage counts bar
  stageCountsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginBottom: 20,
    padding: '12px 0',
    background: '#fafafa',
    borderRadius: 0,
  },
  stageCountItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  stageCountDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    marginBottom: 4,
  },
  stageCountNumber: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
  },
  stageCountLabel: {
    fontSize: 10,
    color: '#737373',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    marginTop: 2,
  },
  stageCountLine: {
    position: 'absolute',
    top: 4,
    right: 0,
    width: 'calc(50%)',
    height: 1,
    background: '#d4d4d4',
  },

  // Kanban
  kanbanGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 12,
  },
  kanbanColumn: {
    background: '#fafafa',
    borderRadius: 0,
    overflow: 'hidden',
    minHeight: 80,
  },
  kanbanColumnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    borderBottom: '1px solid #e5e5e5',
  },
  kanbanColumnTitle: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#525252',
    letterSpacing: '0.03em',
  },
  kanbanColumnCount: {
    fontSize: 11,
    fontWeight: 600,
    color: '#000',
    background: '#e5e5e5',
    padding: '1px 6px',
    borderRadius: 0,
  },
  kanbanColumnBody: {
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 320,
    overflowY: 'auto',
  },
  kanbanEmpty: {
    textAlign: 'center',
    color: '#d4d4d4',
    fontSize: 13,
    padding: '12px 0',
  },
  kanbanCard: {
    background: '#fff',
    borderRadius: 0,
    padding: '10px 12px',
    border: '1px solid #e5e5e5',
  },
  kanbanCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kanbanPatientName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#000',
    textDecoration: 'none',
  },
  kanbanDays: {
    fontSize: 11,
    fontWeight: 600,
  },
  kanbanCardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  kanbanBadge: {
    padding: '1px 6px',
    borderRadius: 0,
    fontSize: 10,
    fontWeight: 600,
  },
  kanbanDate: {
    fontSize: 11,
    color: '#737373',
  },
  kanbanAdvanceBtn: {
    width: '100%',
    padding: '4px 0',
    fontSize: 11,
    fontWeight: 600,
    color: '#000',
    background: '#f5f5f5',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
    cursor: 'pointer',
    textAlign: 'center',
  },
  kanbanMore: {
    textAlign: 'center',
    fontSize: 11,
    color: '#737373',
    padding: '4px 0',
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
