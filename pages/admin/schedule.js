// /pages/admin/schedule.js
// Schedule page - Full calendar with booking, today view, and list view
// Range Medical System V2

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '../../components/AdminLayout';

// Dynamic import CalendarView (it uses browser APIs)
const CalendarView = dynamic(() => import('../../components/CalendarView'), { ssr: false });

export default function SchedulePage() {
  const [tab, setTab] = useState('calendar');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments/list');
      const data = await res.json();
      setAppointments(data.appointments || data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const todayAppointments = appointments.filter(apt => {
    const aptDate = (apt.start_time || apt.booking_date || '').split('T')[0];
    return aptDate === today;
  }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.start_time || apt.booking_date);
    return aptDate >= new Date();
  }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const statusStyle = (status) => {
    const map = {
      scheduled: { bg: '#dbeafe', color: '#1e40af' },
      confirmed: { bg: '#dcfce7', color: '#166534' },
      checked_in: { bg: '#fef3c7', color: '#92400e' },
      in_progress: { bg: '#e0e7ff', color: '#3730a3' },
      completed: { bg: '#dcfce7', color: '#166534' },
      cancelled: { bg: '#fee2e2', color: '#dc2626' },
      no_show: { bg: '#fee2e2', color: '#dc2626' },
      rescheduled: { bg: '#f3f4f6', color: '#374151' },
    };
    return map[status] || { bg: '#f0f0f0', color: '#333' };
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const renderAppointmentList = (list, emptyMsg) => (
    <div style={styles.card}>
      {loading ? (
        <div style={styles.loading}>Loading schedule...</div>
      ) : list.length === 0 ? (
        <div style={styles.empty}>{emptyMsg}</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Time</th>
              <th style={styles.th}>Patient</th>
              <th style={styles.th}>Service</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map(apt => {
              const ss = statusStyle(apt.status);
              return (
                <tr key={apt.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '500' }}>{formatTime(apt.start_time)}</div>
                    {tab === 'upcoming' && (
                      <div style={{ fontSize: '11px', color: '#999' }}>{formatDate(apt.start_time)}</div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontWeight: '500' }}>
                      {apt.patient_name || apt.attendee_name || 'Unknown'}
                    </span>
                  </td>
                  <td style={styles.td}>{apt.service_name || apt.title || '-'}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: ss.bg,
                      color: ss.color
                    }}>
                      {(apt.status || 'scheduled').replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <AdminLayout title="Schedule">
      {/* Tab bar */}
      <div style={styles.tabBar}>
        {[
          { key: 'calendar', label: 'Calendar' },
          { key: 'today', label: `Today (${todayAppointments.length})` },
          { key: 'upcoming', label: `Upcoming (${upcomingAppointments.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              ...styles.tab,
              ...(tab === t.key ? styles.tabActive : {})
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'calendar' ? (
        <div style={styles.calendarWrap}>
          <CalendarView />
        </div>
      ) : tab === 'today' ? (
        renderAppointmentList(todayAppointments, 'No appointments today')
      ) : (
        renderAppointmentList(upcomingAppointments, 'No upcoming appointments')
      )}
    </AdminLayout>
  );
}

const styles = {
  tabBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px'
  },
  tab: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '400',
    color: '#666'
  },
  tabActive: {
    background: '#000',
    color: '#fff',
    border: '1px solid #000',
    fontWeight: '500'
  },
  calendarWrap: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    overflow: 'hidden',
    minHeight: '600px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#666'
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e5e5'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
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
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  }
};
