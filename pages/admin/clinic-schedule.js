// /pages/admin/clinic-schedule.js
// In-Clinic Visit Tracker - Range Medical
// Shows expected visits, allows logging, tracks schedule compliance

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };

const CATEGORY_COLORS = {
  weight_loss: { bg: '#dbeafe', text: '#1e40af', label: 'Weight Loss' },
  hrt: { bg: '#f3e8ff', text: '#7c3aed', label: 'HRT' },
  peptide: { bg: '#dcfce7', text: '#166534', label: 'Peptide' },
  iv: { bg: '#ffedd5', text: '#c2410c', label: 'IV' },
  hbot: { bg: '#e0e7ff', text: '#3730a3', label: 'HBOT' },
  rlt: { bg: '#fee2e2', text: '#dc2626', label: 'RLT' },
  red_light: { bg: '#fee2e2', text: '#dc2626', label: 'RLT' },
  injection: { bg: '#fef3c7', text: '#92400e', label: 'Injection' },
  other: { bg: '#f3f4f6', text: '#374151', label: 'Other' }
};

export default function ClinicSchedule() {
  const [loading, setLoading] = useState(true);
  const [protocols, setProtocols] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAllDays, setShowAllDays] = useState(false);
  const [loggingId, setLoggingId] = useState(null);

  const today = new Date();
  const todayDayName = DAYS_OF_WEEK[today.getDay()];

  useEffect(() => {
    fetchClinicProtocols();
  }, []);

  const fetchClinicProtocols = async () => {
    try {
      const res = await fetch('/api/admin/clinic-visits');
      const data = await res.json();
      if (data.protocols) {
        setProtocols(data.protocols);
      }
    } catch (error) {
      console.error('Error fetching protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  const logVisit = async (protocolId) => {
    setLoggingId(protocolId);
    try {
      const res = await fetch(`/api/protocols/${protocolId}/log-visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitDate: today.toISOString().split('T')[0] })
      });

      if (res.ok) {
        fetchClinicProtocols(); // Refresh data
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to log visit');
      }
    } catch (error) {
      console.error('Error logging visit:', error);
    } finally {
      setLoggingId(null);
    }
  };

  const getPatientName = (protocol) => {
    const p = protocol.patients;
    if (p?.first_name && p?.last_name) return `${p.first_name} ${p.last_name}`;
    return p?.name || 'Unknown';
  };

  const getCategoryStyle = (type) => CATEGORY_COLORS[type] || CATEGORY_COLORS.other;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getVisitStatus = (protocol) => {
    const lastVisit = protocol.last_visit_date;
    const nextExpected = protocol.next_expected_date;
    const scheduledDays = protocol.scheduled_days || [];
    const frequency = protocol.visit_frequency || protocol.frequency;

    // Check if visited today
    const todayStr = today.toISOString().split('T')[0];
    if (lastVisit === todayStr) {
      return { status: 'completed', label: '✅ Checked In', color: '#059669' };
    }

    // Check if expected today
    const isScheduledToday = scheduledDays.map(d => d.toLowerCase()).includes(todayDayName);

    // Check if overdue
    if (nextExpected && new Date(nextExpected) < today) {
      const daysOverdue = Math.floor((today - new Date(nextExpected)) / (1000 * 60 * 60 * 24));
      return { status: 'overdue', label: `❌ ${daysOverdue}d overdue`, color: '#dc2626' };
    }

    if (isScheduledToday) {
      return { status: 'expected', label: '⏳ Expected Today', color: '#f59e0b' };
    }

    return { status: 'upcoming', label: nextExpected ? `Next: ${formatDate(nextExpected)}` : 'Not scheduled', color: '#6b7280' };
  };

  const getWeeklyProgress = (protocol) => {
    if (protocol.visit_frequency !== '2x_week') return null;

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Count visits this week (would need visits data from API)
    const visitsThisWeek = protocol.visits_this_week || 0;
    const scheduledDays = protocol.scheduled_days || [];

    return {
      completed: visitsThisWeek,
      total: 2,
      days: scheduledDays.map(d => DAY_LABELS[d] || d).join('/')
    };
  };

  // Filter protocols based on selected day
  const filterDay = selectedDay || (showAllDays ? null : todayDayName);

  const filteredProtocols = protocols.filter(p => {
    if (!filterDay) return true;
    const scheduledDays = (p.scheduled_days || []).map(d => d.toLowerCase());
    return scheduledDays.includes(filterDay.toLowerCase()) || scheduledDays.length === 0;
  });

  // Group by category
  const groupedProtocols = {};
  filteredProtocols.forEach(p => {
    const cat = p.program_type || 'other';
    if (!groupedProtocols[cat]) groupedProtocols[cat] = [];
    groupedProtocols[cat].push(p);
  });

  // Sort categories
  const categoryOrder = ['weight_loss', 'hrt', 'peptide', 'iv', 'hbot', 'rlt', 'red_light', 'injection', 'other'];
  const sortedCategories = Object.keys(groupedProtocols).sort((a, b) =>
    categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  // Stats
  const todayExpected = protocols.filter(p => {
    const scheduledDays = (p.scheduled_days || []).map(d => d.toLowerCase());
    return scheduledDays.includes(todayDayName);
  }).length;

  const todayCompleted = protocols.filter(p =>
    p.last_visit_date === today.toISOString().split('T')[0]
  ).length;

  const overdueCount = protocols.filter(p => {
    if (!p.next_expected_date) return false;
    return new Date(p.next_expected_date) < today && p.last_visit_date !== today.toISOString().split('T')[0];
  }).length;

  if (loading) {
    return <div style={styles.loading}>Loading clinic schedule...</div>;
  }

  return (
    <>
      <Head>
        <title>Clinic Schedule | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>In-Clinic Schedule</h1>
            <div style={styles.subtitle}>
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <Link href="/admin/pipeline" style={styles.backLink}>← Pipeline</Link>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{todayExpected}</div>
            <div style={styles.statLabel}>Expected Today</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: '#059669' }}>
            <div style={{ ...styles.statNumber, color: '#059669' }}>{todayCompleted}</div>
            <div style={styles.statLabel}>Checked In</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: overdueCount > 0 ? '#dc2626' : '#e5e7eb' }}>
            <div style={{ ...styles.statNumber, color: overdueCount > 0 ? '#dc2626' : '#6b7280' }}>{overdueCount}</div>
            <div style={styles.statLabel}>Overdue</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{protocols.length}</div>
            <div style={styles.statLabel}>Total In-Clinic</div>
          </div>
        </div>

        {/* Day Filter */}
        <div style={styles.dayFilter}>
          <button
            style={{ ...styles.dayBtn, ...(showAllDays && !selectedDay ? styles.dayBtnActive : {}) }}
            onClick={() => { setShowAllDays(true); setSelectedDay(null); }}
          >
            All
          </button>
          {DAYS_OF_WEEK.slice(1, 6).map(day => (
            <button
              key={day}
              style={{
                ...styles.dayBtn,
                ...(selectedDay === day || (!selectedDay && !showAllDays && day === todayDayName) ? styles.dayBtnActive : {}),
                ...(day === todayDayName ? { fontWeight: '600' } : {})
              }}
              onClick={() => { setSelectedDay(day); setShowAllDays(false); }}
            >
              {DAY_LABELS[day]}
              {day === todayDayName && ' •'}
            </button>
          ))}
        </div>

        {/* Protocol List by Category */}
        {sortedCategories.length === 0 ? (
          <div style={styles.empty}>No in-clinic protocols {filterDay ? `scheduled for ${DAY_LABELS[filterDay] || filterDay}` : ''}</div>
        ) : (
          sortedCategories.map(category => {
            const catStyle = getCategoryStyle(category);
            const catProtocols = groupedProtocols[category];

            return (
              <div key={category} style={styles.categorySection}>
                <div style={styles.categoryHeader}>
                  <span style={{ ...styles.categoryBadge, background: catStyle.bg, color: catStyle.text }}>
                    {catStyle.label}
                  </span>
                  <span style={styles.categoryCount}>{catProtocols.length} patients</span>
                </div>

                <div style={styles.protocolList}>
                  {catProtocols.map(protocol => {
                    const visitStatus = getVisitStatus(protocol);
                    const weeklyProgress = getWeeklyProgress(protocol);

                    return (
                      <div key={protocol.id} style={styles.protocolCard}>
                        <div style={styles.protocolMain}>
                          <Link href={`/patients/${protocol.patient_id}`} style={styles.patientLink}>
                            {getPatientName(protocol)}
                          </Link>
                          <div style={styles.protocolMeta}>
                            {protocol.medication && <span>{protocol.medication}</span>}
                            {protocol.selected_dose && <span> • {protocol.selected_dose}</span>}
                            {protocol.frequency && <span> • {protocol.frequency}</span>}
                          </div>
                          {protocol.scheduled_days?.length > 0 && (
                            <div style={styles.scheduledDays}>
                              Schedule: {protocol.scheduled_days.map(d => DAY_LABELS[d] || d).join(', ')}
                            </div>
                          )}
                          {weeklyProgress && (
                            <div style={styles.weeklyProgress}>
                              {weeklyProgress.completed} of {weeklyProgress.total} visits this week ({weeklyProgress.days})
                            </div>
                          )}
                        </div>
                        <div style={styles.protocolActions}>
                          <span style={{ ...styles.statusBadge, color: visitStatus.color }}>
                            {visitStatus.label}
                          </span>
                          {visitStatus.status !== 'completed' && (
                            <button
                              onClick={() => logVisit(protocol.id)}
                              disabled={loggingId === protocol.id}
                              style={styles.checkInBtn}
                            >
                              {loggingId === protocol.id ? '...' : 'Check In'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#666'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: '0 0 4px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666'
  },
  backLink: {
    color: '#000',
    textDecoration: 'none',
    fontSize: '14px',
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#000'
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
    marginTop: '4px'
  },
  dayFilter: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  dayBtn: {
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  },
  dayBtnActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000'
  },
  empty: {
    textAlign: 'center',
    padding: '48px',
    color: '#9ca3af',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  categorySection: {
    marginBottom: '24px'
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  categoryBadge: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '4px'
  },
  categoryCount: {
    fontSize: '13px',
    color: '#666'
  },
  protocolList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  protocolCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  protocolMain: {
    flex: 1
  },
  patientLink: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#000',
    textDecoration: 'none'
  },
  protocolMeta: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px'
  },
  scheduledDays: {
    fontSize: '13px',
    color: '#2563eb',
    marginTop: '4px'
  },
  weeklyProgress: {
    fontSize: '13px',
    color: '#7c3aed',
    marginTop: '4px',
    fontWeight: '500'
  },
  protocolActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  statusBadge: {
    fontSize: '13px',
    fontWeight: '500'
  },
  checkInBtn: {
    padding: '8px 16px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer'
  }
};
