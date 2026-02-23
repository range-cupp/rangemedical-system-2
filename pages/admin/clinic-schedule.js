// /pages/admin/clinic-schedule.js
// In-Clinic Schedule - Pulls appointments directly from GoHighLevel
// Range Medical

import { useState, useEffect } from 'react';
import { formatPhone } from '../../lib/format-utils';
import Head from 'next/head';
import Link from 'next/link';

const STATUS_COLORS = {
  scheduled: { bg: '#fef3c7', text: '#92400e', label: 'Scheduled' },
  confirmed: { bg: '#dbeafe', text: '#1e40af', label: 'Confirmed' },
  showed: { bg: '#dcfce7', text: '#166534', label: 'Showed' },
  completed: { bg: '#dcfce7', text: '#166534', label: 'Completed' },
  no_show: { bg: '#fee2e2', text: '#dc2626', label: 'No Show' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280', label: 'Cancelled' }
};

export default function ClinicSchedule() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ scheduled: 0, showed: 0, noShow: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);
  const [syncMessage, setSyncMessage] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/ghl-appointments?date=${selectedDate}`);
      const data = await res.json();

      if (data.success) {
        setAppointments(data.appointments || []);
        setStats(data.byStatus || { scheduled: 0, showed: 0, noShow: 0 });
      } else {
        setError(data.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const syncFromGHL = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      setError(null);

      setSyncMessage('Syncing from GHL...');

      const res = await fetch('/api/admin/sync-ghl-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      });
      const data = await res.json();

      if (data.success) {
        setSyncMessage(`Synced ${data.synced} appointments from GHL`);
        // Now fetch the updated appointments from database
        await fetchAppointments();
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError('Failed to sync from GHL');
    } finally {
      setSyncing(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // Display in Pacific Time (clinic timezone)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    });
  };

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStatusStyle = (status) => {
    const normalized = (status || '').toLowerCase().replace('-', '_');
    return STATUS_COLORS[normalized] || STATUS_COLORS.scheduled;
  };

  const goToDate = (offset) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + offset);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Group appointments by calendar type
  const groupedByCalendar = {};
  appointments.forEach(apt => {
    const key = apt.calendarName || 'Other';
    if (!groupedByCalendar[key]) {
      groupedByCalendar[key] = { color: apt.calendarColor || '#6b7280', appointments: [] };
    }
    groupedByCalendar[key].appointments.push(apt);
  });

  return (
    <>
      <Head>
        <title>Clinic Schedule | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Clinic Schedule</h1>
            <div style={styles.subtitle}>Appointments from GoHighLevel</div>
          </div>
          <Link href="/admin/pipeline" style={styles.backLink}>← Pipeline</Link>
        </div>

        {/* Date Navigation */}
        <div style={styles.dateNav}>
          <button onClick={() => goToDate(-1)} style={styles.navBtn}>← Prev</button>
          <div style={styles.dateDisplay}>
            <span style={styles.dateText}>{formatDateHeader(selectedDate)}</span>
            {!isToday && (
              <button onClick={goToToday} style={styles.todayBtn}>Today</button>
            )}
          </div>
          <button onClick={() => goToDate(1)} style={styles.navBtn}>Next →</button>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsRow}>
          <div style={{ ...styles.statCard, borderColor: '#f59e0b' }}>
            <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{stats.scheduled}</div>
            <div style={styles.statLabel}>Scheduled</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: '#059669' }}>
            <div style={{ ...styles.statNumber, color: '#059669' }}>{stats.showed}</div>
            <div style={styles.statLabel}>Showed</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: '#dc2626' }}>
            <div style={{ ...styles.statNumber, color: '#dc2626' }}>{stats.noShow}</div>
            <div style={styles.statLabel}>No Show</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{appointments.length}</div>
            <div style={styles.statLabel}>Total</div>
          </div>
        </div>

        {/* Loading / Error / Content */}
        {loading ? (
          <div style={styles.loading}>Loading appointments...</div>
        ) : error ? (
          <div style={styles.error}>{error}</div>
        ) : appointments.length === 0 ? (
          <div style={styles.empty}>No appointments scheduled for this day</div>
        ) : (
          <>
            {/* Timeline View */}
            <div style={styles.timeline}>
              {appointments.map(apt => {
                const statusStyle = getStatusStyle(apt.status);
                return (
                  <div key={apt.id} style={styles.appointmentCard}>
                    <div style={styles.timeColumn}>
                      <div style={styles.time}>{formatTime(apt.startTime)}</div>
                      {apt.endTime && (
                        <div style={styles.timeDuration}>to {formatTime(apt.endTime)}</div>
                      )}
                    </div>
                    <div style={{ ...styles.calendarIndicator, backgroundColor: apt.calendarColor || '#6b7280' }} />
                    <div style={styles.appointmentContent}>
                      <div style={styles.appointmentHeader}>
                        <span style={styles.patientName}>
                          {apt.patient ? (
                            <Link href={`/patients/${apt.patient.id}`} style={styles.patientLink}>
                              {apt.patientName}
                            </Link>
                          ) : (
                            apt.patientName
                          )}
                        </span>
                        <span style={{ ...styles.statusBadge, background: statusStyle.bg, color: statusStyle.text }}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <div style={styles.appointmentDetails}>
                        <span style={styles.calendarName}>{apt.calendarName}</span>
                        {apt.title !== apt.calendarName && <span> • {apt.title}</span>}
                      </div>
                      {apt.patient?.phone && (
                        <div style={styles.contactInfo}>{formatPhone(apt.patient.phone)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grouped by Service */}
            <div style={styles.groupedSection}>
              <h3 style={styles.sectionTitle}>By Service</h3>
              {Object.entries(groupedByCalendar).map(([calendarName, data]) => (
                <div key={calendarName} style={styles.calendarGroup}>
                  <div style={styles.calendarHeader}>
                    <span style={{ ...styles.calendarBadge, backgroundColor: data.color }}>
                      {calendarName}
                    </span>
                    <span style={styles.calendarCount}>{data.appointments.length} appointments</span>
                  </div>
                  <div style={styles.calendarAppointments}>
                    {data.appointments.map(apt => (
                      <div key={apt.id} style={styles.miniCard}>
                        <span style={styles.miniTime}>{formatTime(apt.startTime)}</span>
                        <span style={styles.miniName}>
                          {apt.patient ? (
                            <Link href={`/patients/${apt.patient.id}`} style={styles.patientLink}>
                              {apt.patientName}
                            </Link>
                          ) : (
                            apt.patientName
                          )}
                        </span>
                        <span style={{ ...styles.miniStatus, color: getStatusStyle(apt.status).text }}>
                          {getStatusStyle(apt.status).label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Sync Message */}
        {syncMessage && (
          <div style={styles.syncMessage}>{syncMessage}</div>
        )}

        {/* Refresh Button */}
        <button onClick={syncFromGHL} disabled={syncing} style={styles.refreshBtn}>
          {syncing ? 'Syncing...' : '↻ Sync from GHL'}
        </button>
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
  dateNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    padding: '12px 16px',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  navBtn: {
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  },
  dateDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  dateText: {
    fontSize: '18px',
    fontWeight: '600'
  },
  todayBtn: {
    padding: '4px 12px',
    border: '1px solid #2563eb',
    borderRadius: '4px',
    background: '#fff',
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: '13px'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#000'
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
    marginTop: '4px'
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#666'
  },
  error: {
    textAlign: 'center',
    padding: '48px',
    color: '#dc2626',
    background: '#fef2f2',
    borderRadius: '8px'
  },
  empty: {
    textAlign: 'center',
    padding: '48px',
    color: '#9ca3af',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '32px'
  },
  appointmentCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  timeColumn: {
    width: '80px',
    flexShrink: 0
  },
  time: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#000'
  },
  timeDuration: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  calendarIndicator: {
    width: '4px',
    alignSelf: 'stretch',
    borderRadius: '2px',
    minHeight: '40px'
  },
  appointmentContent: {
    flex: 1
  },
  appointmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  patientName: {
    fontSize: '16px',
    fontWeight: '600'
  },
  patientLink: {
    color: '#000',
    textDecoration: 'none'
  },
  statusBadge: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '4px 10px',
    borderRadius: '4px'
  },
  appointmentDetails: {
    fontSize: '14px',
    color: '#666'
  },
  calendarName: {
    fontWeight: '500'
  },
  contactInfo: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  groupedSection: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  calendarGroup: {
    marginBottom: '20px'
  },
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  },
  calendarBadge: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '4px'
  },
  calendarCount: {
    fontSize: '13px',
    color: '#666'
  },
  calendarAppointments: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingLeft: '8px'
  },
  miniCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    background: '#f9fafb',
    borderRadius: '6px'
  },
  miniTime: {
    fontSize: '13px',
    fontWeight: '500',
    width: '70px',
    color: '#374151'
  },
  miniName: {
    flex: 1,
    fontSize: '14px'
  },
  miniStatus: {
    fontSize: '12px',
    fontWeight: '500'
  },
  refreshBtn: {
    display: 'block',
    width: '100%',
    padding: '12px',
    marginTop: '24px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151'
  },
  syncMessage: {
    textAlign: 'center',
    padding: '12px',
    marginTop: '16px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: '8px',
    fontSize: '14px'
  }
};
