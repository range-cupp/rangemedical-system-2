// /pages/admin/schedule.js
// Schedule page - Full calendar with booking, today view, and list view
// Range Medical System V2

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '../../components/AdminLayout';
import EncounterModal from '../../components/EncounterModal';
import { useAuth } from '../../components/AuthProvider';

// Dynamic import CalendarView (it uses browser APIs)
const CalendarView = dynamic(() => import('../../components/CalendarView'), { ssr: false });

export default function SchedulePage() {
  const { session } = useAuth();
  const [tab, setTab] = useState('calendar');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewalMap, setRenewalMap] = useState({}); // patient_id -> [renewals]
  const [encounterAppt, setEncounterAppt] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Fetch renewals for patients with appointments
  useEffect(() => {
    if (appointments.length === 0) return;
    const patientIds = [...new Set(appointments.map(a => a.patient_id).filter(Boolean))];
    if (patientIds.length === 0) return;

    fetch(`/api/protocols/renewals?patient_ids=${patientIds.join(',')}`)
      .then(r => r.json())
      .then(data => {
        const map = {};
        (data.renewals || []).forEach(r => {
          if (!map[r.patient_id]) map[r.patient_id] = [];
          map[r.patient_id].push(r);
        });
        setRenewalMap(map);
      })
      .catch(err => console.error('Renewal fetch error:', err));
  }, [appointments]);

  const fetchAppointments = async () => {
    try {
      // Fetch from start of today (Pacific) onwards so Today/Upcoming tabs work
      const now = new Date();
      const pacificDate = now.toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [m, d, y] = pacificDate.split('/');
      const todayStart = `${y}-${m}-${d}T00:00:00`;
      const res = await fetch(`/api/appointments/list?start_date=${todayStart}`);
      const data = await res.json();
      setAppointments(data.appointments || data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Use Pacific time for date comparisons
  const now = new Date();
  const pacificDateStr = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const [pm, pd, py] = pacificDateStr.split('/');
  const today = `${py}-${pm}-${pd}`;

  const todayAppointments = appointments.filter(apt => {
    // Convert appointment start_time to Pacific date for comparison
    const aptPacific = new Date(apt.start_time || apt.booking_date).toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const [am, ad, ay] = aptPacific.split('/');
    return `${ay}-${am}-${ad}` === today;
  }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const upcomingAppointments = appointments
    .filter(apt => apt.status !== 'cancelled' && apt.status !== 'no_show')
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

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

  const deleteAppointment = async (apptId) => {
    if (!confirm('Delete this appointment? The patient will NOT be notified.')) return;
    try {
      const res = await fetch(`/api/appointments/${apptId}`, { method: 'DELETE' });
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.id !== apptId));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete appointment. Please try again.');
      }
    } catch (err) {
      console.error('Delete appointment error:', err);
      alert('Failed to delete appointment. Please try again.');
    }
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
              <th style={styles.th}>Provider</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Booked By</th>
              <th style={{ ...styles.th, width: '120px' }}></th>
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
                    <span style={{ fontSize: '13px', color: '#555' }}>{apt.provider || '—'}</span>
                  </td>
                  <td style={styles.td}>
                    {apt.location && apt.location !== 'Range Medical — Newport Beach' ? (
                      <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: '#ede9fe', color: '#6d28d9', fontWeight: '500' }}>
                        📍 Placentia
                      </span>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#999' }}>Newport Beach</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        ...styles.badge,
                        background: ss.bg,
                        color: ss.color
                      }}>
                        {(apt.status || 'scheduled').replace(/_/g, ' ')}
                      </span>
                      {renewalMap[apt.patient_id]?.length > 0 && (() => {
                        const patientRenewals = renewalMap[apt.patient_id];
                        const hasDue = patientRenewals.some(r => r.renewal_status === 'renewal_due');
                        return (
                          <span style={{
                            ...styles.badge,
                            background: hasDue ? '#fee2e2' : '#fef3c7',
                            color: hasDue ? '#dc2626' : '#92400e'
                          }}>
                            {hasDue ? 'Renewal Due' : 'Renewal Soon'}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontSize: '13px', color: '#555' }}>
                      {apt.created_by || <span style={{ color: '#ccc' }}>—</span>}
                    </div>
                    {apt.created_at && (
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                        {new Date(apt.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles'
                        })}{' '}
                        {new Date(apt.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
                        })}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => setEncounterAppt(apt)}
                        style={{
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#0369a1',
                          fontSize: '12px',
                          fontWeight: '600',
                          padding: '4px 10px',
                        }}
                        title="Create encounter note"
                      >
                        Encounter Note
                      </button>
                      <button
                        onClick={() => deleteAppointment(apt.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '13px', padding: '4px' }}
                        title="Delete (no notification)"
                      >
                        ✕
                      </button>
                    </div>
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

      {/* Encounter Note Modal */}
      {encounterAppt && (
        <EncounterModal
          appointment={{ ...encounterAppt, patient_id: encounterAppt.patient_id }}
          currentUser={session?.user?.user_metadata?.full_name || session?.user?.email || 'Staff'}
          onClose={() => setEncounterAppt(null)}
          onRefresh={fetchAppointments}
        />
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
