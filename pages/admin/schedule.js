// /pages/admin/schedule.js
// Schedule page - Full calendar with booking, today view, and list view
// Range Medical System V2

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Sparkles, Paperclip, X, FileText } from 'lucide-react';
import AdminLayout, { overlayClickProps } from '../../components/AdminLayout';
import TemplateMessages from '../../components/TemplateMessages';
import EncounterModal from '../../components/EncounterModal';
import { useAuth } from '../../components/AuthProvider';
import { formatPhone } from '../../lib/format-utils';
import { getRenewalStatus } from '../../lib/protocol-tracking';
// Dynamic import CalendarView (it uses browser APIs)
const CalendarView = dynamic(() => import('../../components/CalendarView'), { ssr: false });

// Helper: get Pacific date string YYYY-MM-DD from a Date object
function toPacificDateStr(date) {
  const s = date.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const [m, d, y] = s.split('/');
  return `${y}-${m}-${d}`;
}

// Helper: shift a YYYY-MM-DD string by N days
function shiftDate(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toPacificDateStr(dt);
}

export default function SchedulePage() {
  const { session } = useAuth();
  const [tab, setTab] = useState('calendar');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewalMap, setRenewalMap] = useState({}); // patient_id -> [renewals]
  const [encounterAppt, setEncounterAppt] = useState(null);
  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerSmsText, setDrawerSmsText] = useState('');
  const [drawerSmsSending, setDrawerSmsSending] = useState(false);
  const [drawerSmsStatus, setDrawerSmsStatus] = useState(null);
  const [drawerEmailSubject, setDrawerEmailSubject] = useState('');
  const [drawerEmailBody, setDrawerEmailBody] = useState('');
  const [drawerEmailSending, setDrawerEmailSending] = useState(false);
  const [drawerEmailFormatting, setDrawerEmailFormatting] = useState(false);
  const [drawerEmailStatus, setDrawerEmailStatus] = useState(null);
  const [drawerEmailAttachments, setDrawerEmailAttachments] = useState([]);
  const [drawerEmailShowSnippets, setDrawerEmailShowSnippets] = useState(false);
  const drawerEmailFileRef = useRef(null);
  const router = useRouter();

  const today = toPacificDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [serviceFilter, setServiceFilter] = useState('all');

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
      // Fetch a wide range: 30 days back + forward so day nav works without re-fetching
      const start = shiftDate(today, -30);
      const end = shiftDate(today, 60);
      const res = await fetch(`/api/appointments/list?start_date=${start}T00:00:00&end_date=${end}T23:59:59`);
      const data = await res.json();
      setAppointments(data.appointments || data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const openPatientDrawer = (patientId) => {
    if (!patientId) return;
    setDrawerLoading(true);
    setDrawerData(null);
    fetch(`/api/patients/${patientId}`)
      .then(r => r.json())
      .then(data => { setDrawerData(data); setDrawerLoading(false); })
      .catch(() => setDrawerLoading(false));
  };

  const closeDrawer = () => { setDrawerData(null); setDrawerLoading(false); setDrawerSmsText(''); setDrawerSmsStatus(null); resetDrawerEmail(); };

  const sendDrawerSms = async () => {
    const pt = drawerData?.patient;
    if (!pt?.phone || !drawerSmsText.trim()) return;
    setDrawerSmsSending(true);
    setDrawerSmsStatus(null);
    try {
      const res = await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: pt.id,
          patient_name: `${pt.first_name} ${pt.last_name}`,
          to: pt.phone,
          message: drawerSmsText.trim(),
          message_type: 'staff_drawer',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDrawerSmsStatus({ ok: true, msg: 'Sent ✓' });
        setDrawerSmsText('');
      } else {
        setDrawerSmsStatus({ ok: false, msg: data.error || 'Failed to send' });
      }
    } catch (e) {
      setDrawerSmsStatus({ ok: false, msg: e.message });
    } finally {
      setDrawerSmsSending(false);
    }
  };

  const resetDrawerEmail = () => {
    setDrawerEmailSubject('');
    setDrawerEmailBody('');
    setDrawerEmailSending(false);
    setDrawerEmailFormatting(false);
    setDrawerEmailStatus(null);
    setDrawerEmailAttachments([]);
    setDrawerEmailShowSnippets(false);
  };

  const handleDrawerEmailFormat = async () => {
    const pt = drawerData?.patient;
    if (!drawerEmailBody.trim()) return;
    setDrawerEmailFormatting(true);
    setDrawerEmailStatus(null);
    try {
      const res = await fetch('/api/email/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: drawerEmailBody,
          recipientName: pt ? `${pt.first_name} ${pt.last_name}` : null,
          subject: drawerEmailSubject || null,
        }),
      });
      const data = await res.json();
      if (data.formatted) {
        setDrawerEmailBody(data.formatted);
      } else {
        setDrawerEmailStatus({ ok: false, msg: data.error || 'Failed to format' });
      }
    } catch (e) {
      setDrawerEmailStatus({ ok: false, msg: 'Failed to format' });
    } finally {
      setDrawerEmailFormatting(false);
    }
  };

  const handleDrawerEmailFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setDrawerEmailStatus({ ok: false, msg: `"${file.name}" is too large (max 10MB)` });
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        setDrawerEmailAttachments(prev => [...prev, { name: file.name, size: file.size, base64, type: file.type }]);
      };
      reader.readAsDataURL(file);
    }
    if (drawerEmailFileRef.current) drawerEmailFileRef.current.value = '';
  };

  const sendDrawerEmail = async () => {
    const pt = drawerData?.patient;
    if (!pt?.email || !drawerEmailSubject.trim() || !drawerEmailBody.trim()) return;
    setDrawerEmailSending(true);
    setDrawerEmailStatus(null);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: pt.email,
          subject: drawerEmailSubject.trim(),
          body: drawerEmailBody.trim(),
          patientId: pt.id || null,
          patientName: `${pt.first_name} ${pt.last_name}`,
          attachments: drawerEmailAttachments.length > 0 ? drawerEmailAttachments.map(a => ({
            filename: a.name,
            content: a.base64,
            type: a.type,
          })) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDrawerEmailStatus({ ok: true, msg: 'Email sent ✓' });
        setDrawerEmailSubject('');
        setDrawerEmailBody('');
        setDrawerEmailAttachments([]);
      } else {
        setDrawerEmailStatus({ ok: false, msg: data.error || 'Failed to send' });
      }
    } catch (e) {
      setDrawerEmailStatus({ ok: false, msg: e.message });
    } finally {
      setDrawerEmailSending(false);
    }
  };

  const handleDrawerEmailSnippet = (templateText) => {
    const pt = drawerData?.patient;
    const firstName = pt?.first_name || 'there';
    const lastName = pt?.last_name || '';
    const populated = templateText
      .replace(/\{\{name\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{last_name\}\}/g, lastName);
    setDrawerEmailBody(populated);
    setDrawerEmailShowSnippets(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Service filter categories — match against service_name (case-insensitive)
  const SERVICE_FILTERS = [
    { key: 'all', label: 'All Services' },
    { key: 'weight_loss', label: 'Weight Loss' },
    { key: 'hbot', label: 'HBOT' },
    { key: 'new_patient', label: 'New Patient' },
    { key: 'blood_draw', label: 'Blood Draw' },
    { key: 'iv', label: 'IV Therapy' },
    { key: 'rlt', label: 'Red Light' },
    { key: 'hrt', label: 'HRT' },
    { key: 'injection', label: 'Injections' },
    { key: 'peptide', label: 'Peptides' },
  ];

  const matchesServiceFilter = (apt) => {
    if (serviceFilter === 'all') return true;
    const name = (apt.service_name || apt.title || '').toLowerCase();
    const cat = (apt.service_category || '').toLowerCase();
    switch (serviceFilter) {
      case 'weight_loss':
        return cat === 'weight_loss' || name.includes('weight loss') || name.includes('semaglutide') || name.includes('tirzepatide');
      case 'hbot':
        return cat === 'hbot' || name.includes('hyperbaric') || name.includes('hbot');
      case 'new_patient':
        return name.includes('assessment') || name.includes('new patient') || name.includes('consultation') || name.includes('initial lab review');
      case 'blood_draw':
        return name.includes('blood draw') || name.includes('lab draw') || name.includes('follow-up blood') || name.includes('follow up blood');
      case 'iv':
        return cat === 'iv' || name.includes('iv ') || name.includes('iv+') || name.includes('mb +') || name.includes('nad') || name.includes('myers');
      case 'rlt':
        return cat === 'rlt' || name.includes('red light');
      case 'hrt':
        return cat === 'hrt' || name.includes('hrt') || name.includes('testosterone') || name.includes('hormone');
      case 'injection':
        return cat === 'injection' || (name.includes('injection') && !name.includes('weight loss'));
      case 'peptide':
        return cat === 'peptide' || name.includes('peptide');
      default:
        return true;
    }
  };

  // Filter appointments for the selected date
  const dayAppointments = appointments.filter(apt => {
    const aptDate = toPacificDateStr(new Date(apt.start_time || apt.booking_date));
    return aptDate === selectedDate && matchesServiceFilter(apt);
  }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const upcomingAppointments = appointments
    .filter(apt => {
      const aptDate = toPacificDateStr(new Date(apt.start_time || apt.booking_date));
      return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'no_show' && matchesServiceFilter(apt);
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  // Format selected date for display
  const selectedDateDisplay = (() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (selectedDate === today) return 'Today';
    const yesterday = shiftDate(today, -1);
    const tomorrow = shiftDate(today, 1);
    if (selectedDate === yesterday) return 'Yesterday';
    if (selectedDate === tomorrow) return 'Tomorrow';
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  })();

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
                    {(tab === 'upcoming') && (
                      <div style={{ fontSize: '11px', color: '#999' }}>{formatDate(apt.start_time)}</div>
                    )}
                  </td>
                  <td style={styles.td}>
                    {apt.patient_id ? (
                      <span
                        onClick={() => openPatientDrawer(apt.patient_id)}
                        style={{ fontWeight: '500', cursor: 'pointer', color: '#111', borderBottom: '1px dashed #ccc' }}
                      >
                        {apt.patient_name || apt.attendee_name || 'Unknown'}
                      </span>
                    ) : (
                      <span style={{ fontWeight: '500' }}>
                        {apt.patient_name || apt.attendee_name || 'Unknown'}
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>{apt.service_name || apt.title || '-'}</td>
                  <td style={styles.td}>
                    <span style={{ fontSize: '13px', color: '#555' }}>{apt.provider || '—'}</span>
                  </td>
                  <td style={styles.td}>
                    {apt.location && apt.location !== 'Range Medical — Newport Beach' ? (
                      <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: 0, background: '#ede9fe', color: '#6d28d9', fontWeight: '500' }}>
                        📍 {apt.location.split('—')[0]?.trim() || 'Offsite'}
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
                      <Link
                        href={`/admin/appointments/${apt.id}/prep`}
                        style={{
                          background: '#fef3c7',
                          border: '1px solid #fcd34d',
                          borderRadius: 0,
                          cursor: 'pointer',
                          color: '#92400e',
                          fontSize: '12px',
                          fontWeight: '600',
                          padding: '4px 10px',
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                        title="Appointment prep checklist"
                      >
                        Prep
                      </Link>
                      <button
                        onClick={() => setEncounterAppt(apt)}
                        style={{
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: 0,
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
                      {apt.patient_id && (
                        <button
                          onClick={() => {
                            router.push(`/admin/checkout?patient_id=${apt.patient_id}&patient_name=${encodeURIComponent(apt.patient_name || apt.attendee_name)}`);
                          }}
                          style={{
                            background: '#f0fdf4',
                            border: '1px solid #86efac',
                            borderRadius: 0,
                            cursor: 'pointer',
                            color: '#16a34a',
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '4px 10px',
                          }}
                          title="Checkout patient"
                        >
                          📦 Checkout
                        </button>
                      )}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'calendar', label: 'Calendar' },
            { key: 'day', label: `${selectedDateDisplay} (${dayAppointments.length})` },
            { key: 'upcoming', label: `Upcoming (${upcomingAppointments.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                if (t.key === 'day' && selectedDate !== today) {
                  // Keep the selected date as-is
                }
              }}
              style={{
                ...styles.tab,
                ...(tab === t.key ? styles.tabActive : {})
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab !== 'calendar' && (
          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
            style={styles.filterSelect}
          >
            {SERVICE_FILTERS.map(f => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Date navigation for day view */}
      {tab === 'day' && (
        <div style={styles.dateNav}>
          <button
            onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
            style={styles.dateNavBtn}
          >
            ← Prev
          </button>
          <div style={styles.dateNavCenter}>
            <span style={styles.dateNavLabel}>
              {(() => {
                const [y, m, d] = selectedDate.split('-').map(Number);
                return new Date(y, m - 1, d).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                });
              })()}
            </span>
            {selectedDate !== today && (
              <button
                onClick={() => setSelectedDate(today)}
                style={styles.todayBtn}
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
            style={styles.dateNavBtn}
          >
            Next →
          </button>
        </div>
      )}

      {tab === 'calendar' ? (
        <div style={styles.calendarWrap}>
          <CalendarView />
        </div>
      ) : tab === 'day' ? (
        renderAppointmentList(dayAppointments, `No appointments ${selectedDate === today ? 'today' : 'on this day'}`)
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

      {/* Patient slide-out drawer */}
      {(drawerData || drawerLoading) && (() => {
        const pt = drawerData?.patient;
        const activeProtos = drawerData?.activeProtocols || [];
        const completedProtos = drawerData?.completedProtocols || [];
        const logs = drawerData?.serviceLogs || [];
        const drawerAppts = drawerData?.appointments || [];
        const labs = drawerData?.labs || [];
        const docs = drawerData?.medicalDocuments || [];
        const consents = drawerData?.consents || [];
        const notes = drawerData?.notes || [];
        const wlLogs = drawerData?.weightLossLogs || [];
        const purchases = drawerData?.allPurchases || [];
        const upcomingAppts = drawerAppts.filter(a => new Date(a.start_time) >= new Date());
        const pastAppts = drawerAppts.filter(a => new Date(a.start_time) < new Date());

        const sectionHead = { margin: '0 0 10px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' };
        const card = { background: '#f9fafb', borderRadius: '0', padding: '14px 16px', marginBottom: '16px' };

        const STATUS_COLORS = {
          scheduled: { bg: '#dbeafe', text: '#1e40af' },
          confirmed: { bg: '#dcfce7', text: '#166534' },
          checked_in: { bg: '#fef3c7', text: '#92400e' },
          in_progress: { bg: '#e0e7ff', text: '#3730a3' },
          completed: { bg: '#dcfce7', text: '#166534' },
          cancelled: { bg: '#fee2e2', text: '#dc2626' },
          no_show: { bg: '#fee2e2', text: '#dc2626' },
        };

        function stripNoteHtml(html) {
          if (!html) return '';
          return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
            .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
            .trim();
        }

        return (
          <>
            <div {...overlayClickProps(closeDrawer)} style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 9998
            }} />
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '440px', maxWidth: '92vw',
              background: '#fff', zIndex: 9999, boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#000', flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#fff' }}>
                  {pt ? `${pt.first_name} ${pt.last_name}` : 'Patient'}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {pt && (
                    <a href={`/patients/${pt.id}`}
                      style={{ fontSize: '12px', color: '#fff', textDecoration: 'none', padding: '4px 12px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '0' }}>
                      Full Profile →
                    </a>
                  )}
                  <button onClick={closeDrawer}
                    style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#fff', padding: '0 4px', lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {drawerLoading && !pt ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>Loading patient...</div>
                ) : pt ? (
                  <>
                    {/* Demographics */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '13px', color: '#666' }}>
                        {pt.date_of_birth && (
                          <span style={{ background: '#f3f4f6', padding: '3px 8px' }}>
                            DOB: {new Date(pt.date_of_birth + 'T12:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'America/Los_Angeles' })}
                          </span>
                        )}
                        {pt.gender && <span style={{ background: '#f3f4f6', padding: '3px 8px' }}>{pt.gender}</span>}
                        {pt.created_at && (
                          <span style={{ background: '#f3f4f6', padding: '3px 8px' }}>
                            Since {new Date(pt.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'America/Los_Angeles' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact */}
                    <div style={card}>
                      <h4 style={sectionHead}>Contact</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pt.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📱</span>
                            <a href={`tel:${pt.phone}`} style={{ fontSize: '15px', color: '#111', textDecoration: 'none', fontWeight: '500' }}>
                              {formatPhone(pt.phone)}
                            </a>
                          </div>
                        ) : <span style={{ fontSize: '13px', color: '#bbb' }}>No phone</span>}
                        {pt.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>✉️</span>
                            <a href={`mailto:${pt.email}`} style={{ fontSize: '14px', color: '#111', textDecoration: 'none' }}>{pt.email}</a>
                          </div>
                        ) : <span style={{ fontSize: '13px', color: '#bbb' }}>No email</span>}
                        {(pt.address || pt.city) && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '2px' }}>
                            <span>📍</span>
                            <span style={{ fontSize: '13px', color: '#555' }}>
                              {pt.address && <>{pt.address}<br/></>}
                              {[pt.city, pt.state, pt.zip_code].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* SMS composer */}
                      {pt.phone && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: '6px' }}>
                            Send Text Message
                          </div>
                          <textarea
                            value={drawerSmsText}
                            onChange={e => setDrawerSmsText(e.target.value)}
                            placeholder={`Text ${pt.first_name}…`}
                            rows={3}
                            style={{
                              width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                              border: '1px solid #d1d5db', borderRadius: 0, fontSize: '13px',
                              fontFamily: 'inherit', resize: 'vertical', background: '#fff',
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: drawerSmsStatus ? (drawerSmsStatus.ok ? '#16a34a' : '#dc2626') : '#aaa' }}>
                              {drawerSmsStatus ? drawerSmsStatus.msg : `${drawerSmsText.length} chars`}
                            </span>
                            <button
                              onClick={sendDrawerSms}
                              disabled={!drawerSmsText.trim() || drawerSmsSending}
                              style={{
                                padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                                background: !drawerSmsText.trim() || drawerSmsSending ? '#9ca3af' : '#000',
                                color: '#fff', border: 'none', borderRadius: 0,
                                cursor: !drawerSmsText.trim() || drawerSmsSending ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {drawerSmsSending ? 'Sending…' : 'Send Text'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Email composer */}
                      {pt.email && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: '6px' }}>
                            Send Email
                          </div>
                          {drawerEmailStatus && (
                            <div style={{
                              fontSize: '12px', padding: '6px 10px', marginBottom: '8px',
                              background: drawerEmailStatus.ok ? '#dcfce7' : '#fef2f2',
                              color: drawerEmailStatus.ok ? '#16a34a' : '#dc2626',
                            }}>
                              {drawerEmailStatus.msg}
                            </div>
                          )}
                          <input
                            type="text"
                            value={drawerEmailSubject}
                            onChange={e => setDrawerEmailSubject(e.target.value)}
                            placeholder="Subject line"
                            style={{
                              width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                              border: '1px solid #d1d5db', borderRadius: 0, fontSize: '13px',
                              fontFamily: 'inherit', background: '#fff', marginBottom: '6px',
                            }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginBottom: '4px' }}>
                            <button
                              type="button"
                              onClick={() => setDrawerEmailShowSnippets(!drawerEmailShowSnippets)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '3px 8px', fontSize: '11px', fontWeight: 600,
                                color: drawerEmailShowSnippets ? '#1d4ed8' : '#374151',
                                background: drawerEmailShowSnippets ? '#dbeafe' : '#f3f4f6',
                                border: '1px solid', borderColor: drawerEmailShowSnippets ? '#93c5fd' : '#d1d5db',
                                borderRadius: 0, cursor: 'pointer',
                              }}
                            >
                              <FileText size={11} />
                              Snippets
                            </button>
                            <button
                              type="button"
                              onClick={handleDrawerEmailFormat}
                              disabled={drawerEmailFormatting || !drawerEmailBody.trim()}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '3px 8px', fontSize: '11px', fontWeight: 600,
                                color: drawerEmailFormatting ? '#9ca3af' : '#7c3aed',
                                background: drawerEmailFormatting ? '#f3f4f6' : '#f5f3ff',
                                border: '1px solid', borderColor: drawerEmailFormatting ? '#e5e7eb' : '#ddd6fe',
                                borderRadius: 0,
                                cursor: drawerEmailFormatting || !drawerEmailBody.trim() ? 'not-allowed' : 'pointer',
                                opacity: !drawerEmailBody.trim() ? 0.5 : 1,
                              }}
                            >
                              <Sparkles size={11} />
                              {drawerEmailFormatting ? 'Formatting…' : 'AI Format'}
                            </button>
                          </div>
                          {drawerEmailShowSnippets && (
                            <div style={{ marginBottom: '6px', border: '1px solid #e5e7eb', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                              <TemplateMessages
                                onSelect={handleDrawerEmailSnippet}
                                onClose={() => setDrawerEmailShowSnippets(false)}
                              />
                            </div>
                          )}
                          <textarea
                            value={drawerEmailBody}
                            onChange={e => setDrawerEmailBody(e.target.value)}
                            placeholder={`Type or dictate your message, then click AI Format…`}
                            rows={4}
                            style={{
                              width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                              border: '1px solid #d1d5db', borderRadius: 0, fontSize: '13px',
                              fontFamily: 'inherit', resize: 'vertical', background: '#fff',
                              lineHeight: '1.5', minHeight: '80px',
                            }}
                          />
                          {/* Attachments */}
                          <div style={{ marginTop: '6px' }}>
                            <input
                              ref={drawerEmailFileRef}
                              type="file"
                              multiple
                              onChange={handleDrawerEmailFileSelect}
                              style={{ display: 'none' }}
                            />
                            <button
                              type="button"
                              onClick={() => drawerEmailFileRef.current?.click()}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '4px 8px', fontSize: '11px', color: '#374151',
                                background: '#f9fafb', border: '1px solid #d1d5db',
                                borderRadius: 0, cursor: 'pointer',
                              }}
                            >
                              <Paperclip size={11} />
                              Attach File
                            </button>
                            {drawerEmailAttachments.length > 0 && (
                              <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {drawerEmailAttachments.map((file, i) => (
                                  <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '4px 8px', background: '#f3f4f6', fontSize: '11px',
                                  }}>
                                    <Paperclip size={10} style={{ color: '#6b7280', flexShrink: 0 }} />
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                                    <span style={{ color: '#9ca3af', flexShrink: 0 }}>{formatFileSize(file.size)}</span>
                                    <button type="button" onClick={() => setDrawerEmailAttachments(prev => prev.filter((_, idx) => idx !== i))} style={{
                                      background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: '#9ca3af', flexShrink: 0,
                                    }}>
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#aaa' }}>
                              Sent via Range Medical
                            </span>
                            <button
                              onClick={sendDrawerEmail}
                              disabled={!drawerEmailSubject.trim() || !drawerEmailBody.trim() || drawerEmailSending}
                              style={{
                                padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                                background: !drawerEmailSubject.trim() || !drawerEmailBody.trim() || drawerEmailSending ? '#9ca3af' : '#000',
                                color: '#fff', border: 'none', borderRadius: 0,
                                cursor: !drawerEmailSubject.trim() || !drawerEmailBody.trim() || drawerEmailSending ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {drawerEmailSending ? 'Sending…' : 'Send Email'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Active Protocols */}
                    <div style={card}>
                      <h4 style={sectionHead}>Active Protocols ({activeProtos.length})</h4>
                      {activeProtos.length > 0 ? activeProtos.map((proto, i) => {
                        const isWL = proto.category === 'weight_loss' || proto.program_type === 'weight_loss' || ['semaglutide', 'tirzepatide', 'retatrutide'].some(m => (proto.medication || '').toLowerCase().includes(m));
                        const wlActualCount = isWL ? wlLogs.filter(l => l.entry_type !== 'missed' && l.entry_type !== 'pickup').length : 0;
                        const total = proto.total_sessions || proto.sessions_total || proto.duration_days || 0;
                        const used = isWL ? (wlActualCount || proto.sessions_used || 0) : (proto.sessions_used || 0);
                        const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                        const renewal = getRenewalStatus({ ...proto, status: 'active' });
                        return (
                          <div key={proto.id || i} style={{ padding: '10px 0', borderBottom: i < activeProtos.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>{proto.program_name || proto.medication || 'Protocol'}</div>
                                {renewal.renewal_label && (
                                  <span style={{
                                    fontSize: '10px', fontWeight: '600', padding: '2px 6px',
                                    background: renewal.renewal_urgency_color.bg, color: renewal.renewal_urgency_color.text
                                  }}>
                                    {renewal.renewal_label}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '12px', color: '#666' }}>{used}/{total}</span>
                            </div>
                            {proto.medication && proto.medication !== proto.program_name && (
                              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{proto.medication} {proto.dosage ? `· ${proto.dosage}` : ''}</div>
                            )}
                            {total > 0 && (
                              <div style={{ marginTop: '6px', background: '#e5e7eb', height: '6px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#16a34a' : '#1e40af', transition: 'width 0.3s' }} />
                              </div>
                            )}
                            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                              Started {new Date(proto.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}
                              {proto.frequency ? ` · ${proto.frequency}` : ''}
                            </div>
                          </div>
                        );
                      }) : <span style={{ fontSize: '13px', color: '#bbb' }}>No active protocols</span>}
                    </div>

                    {/* Weight Loss Snapshot */}
                    {(() => {
                      const wlProtos = activeProtos.filter(p => p.category === 'weight_loss' || p.program_type === 'weight_loss' || ['semaglutide', 'tirzepatide', 'retatrutide'].some(m => (p.medication || '').toLowerCase().includes(m)));
                      if (wlProtos.length === 0) return null;
                      const wlActualCount = wlLogs.filter(l => l.entry_type !== 'missed' && l.entry_type !== 'pickup').length;
                      const injections = wlLogs.filter(l => l.entry_type === 'injection').sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
                      const weightEntries = wlLogs.filter(l => l.weight).sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
                      const startWeight = weightEntries.length > 0 ? weightEntries[0].weight : null;
                      const currentWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : null;
                      const weightChange = startWeight && currentWeight ? (currentWeight - startWeight).toFixed(1) : null;

                      const doseTimeline = [];
                      injections.forEach(inj => {
                        const dose = inj.dosage || 'Unknown';
                        const last = doseTimeline[doseTimeline.length - 1];
                        if (last && last.dose === dose) {
                          last.count++;
                          last.lastDate = inj.entry_date;
                        } else {
                          doseTimeline.push({ dose, count: 1, firstDate: inj.entry_date, lastDate: inj.entry_date });
                        }
                      });

                      return wlProtos.map(proto => (
                        <div key={`wl-${proto.id}`} style={{ ...card, border: '1px solid #e0e7ff', background: '#f8f9ff' }}>
                          <h4 style={sectionHead}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                              Weight Loss — {proto.medication || 'Protocol'}
                            </span>
                          </h4>
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ flex: 1, background: '#fff', padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', letterSpacing: '0.04em', marginBottom: '2px' }}>Current Dose</div>
                              <div style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>
                                {injections.length > 0 ? injections[injections.length - 1].dosage || '—' : proto.selected_dose || proto.dosage || '—'}
                              </div>
                            </div>
                            {(() => {
                              const sessionsCompleted = wlActualCount || proto.sessions_used || 0;
                              const sessionsTotal = proto.total_sessions || proto.sessions_total;
                              return (
                                <div style={{ flex: 1, background: '#fff', padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', letterSpacing: '0.04em', marginBottom: '2px' }}>Injections</div>
                                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>
                                    {sessionsCompleted}{sessionsTotal ? ` / ${sessionsTotal}` : ''}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          {startWeight && currentWeight && (
                            <div style={{ background: '#fff', padding: '10px 12px', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
                              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', letterSpacing: '0.04em', marginBottom: '4px' }}>Weight</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px', color: '#666' }}>{startWeight} lbs</span>
                                <span style={{ fontSize: '12px', color: '#aaa' }}>→</span>
                                <span style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>{currentWeight} lbs</span>
                                {weightChange && (
                                  <span style={{
                                    fontSize: '13px', fontWeight: '600', marginLeft: 'auto',
                                    color: parseFloat(weightChange) < 0 ? '#16a34a' : parseFloat(weightChange) > 0 ? '#dc2626' : '#666'
                                  }}>
                                    {parseFloat(weightChange) <= 0 ? weightChange : `+${weightChange}`} lbs
                                  </span>
                                )}
                              </div>
                              {weightEntries.length >= 3 && (
                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'flex-end', gap: '2px', height: '32px' }}>
                                  {(() => {
                                    const weights = weightEntries.slice(-12).map(e => parseFloat(e.weight));
                                    const min = Math.min(...weights);
                                    const max = Math.max(...weights);
                                    const range = max - min || 1;
                                    return weights.map((w, i) => (
                                      <div key={i} style={{
                                        flex: 1, minWidth: '4px', maxWidth: '12px',
                                        height: `${Math.max(4, ((w - min) / range) * 28 + 4)}px`,
                                        background: i === weights.length - 1 ? '#6366f1' : '#c7d2fe',
                                        borderRadius: '1px'
                                      }} title={`${w} lbs`} />
                                    ));
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                          {doseTimeline.length > 0 && (
                            <div>
                              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', letterSpacing: '0.04em', marginBottom: '6px' }}>Dose History</div>
                              {doseTimeline.map((step, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                  <div style={{
                                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                                    background: i === doseTimeline.length - 1 ? '#6366f1' : '#d1d5db'
                                  }} />
                                  <span style={{ fontSize: '13px', fontWeight: i === doseTimeline.length - 1 ? '600' : '400', color: i === doseTimeline.length - 1 ? '#111' : '#666', minWidth: '50px' }}>
                                    {step.dose}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#aaa' }}>
                                    {step.count} inj · {new Date(step.firstDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}
                                    {step.count > 1 ? ` – ${new Date(step.lastDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ));
                    })()}

                    {/* Completed Protocols */}
                    {completedProtos.length > 0 && (
                      <div style={card}>
                        <h4 style={sectionHead}>Completed Protocols ({completedProtos.length})</h4>
                        {completedProtos.slice(0, 5).map((proto, i) => (
                          <div key={proto.id || i} style={{ padding: '6px 0', borderBottom: i < Math.min(completedProtos.length, 5) - 1 ? '1px solid #e5e7eb' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', color: '#555' }}>{proto.program_name || proto.medication || 'Protocol'}</span>
                            <span style={{ fontSize: '12px', color: '#16a34a' }}>✓ Done</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upcoming Appointments */}
                    <div style={card}>
                      <h4 style={sectionHead}>Upcoming Appointments ({upcomingAppts.length})</h4>
                      {upcomingAppts.length === 0 ? (
                        <span style={{ fontSize: '13px', color: '#bbb' }}>No upcoming appointments</span>
                      ) : (
                        upcomingAppts.slice(0, 4).map((apt, i) => (
                          <div key={apt.id || i} style={{ padding: '8px 0', borderBottom: i < Math.min(upcomingAppts.length, 4) - 1 ? '1px solid #e5e7eb' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>{apt.calendar_name || apt.service_name || apt.title || 'Appointment'}</span>
                              <span style={{ fontSize: '12px', padding: '1px 6px', background: STATUS_COLORS[apt.status]?.bg || '#f3f4f6', color: STATUS_COLORS[apt.status]?.text || '#333' }}>
                                {(apt.status || 'scheduled').replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                              {new Date(apt.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })} at {new Date(apt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })}
                              {apt.provider ? ` · ${apt.provider}` : ''}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Recent Transactions */}
                    {purchases.length > 0 && (
                      <div style={card}>
                        <h4 style={sectionHead}>Recent Transactions ({purchases.length})</h4>
                        {purchases.slice(0, 6).map((p, i) => {
                          const paid = parseFloat(p.amount_paid);
                          const displayAmt = !isNaN(paid) ? paid : (parseFloat(p.amount) || 0);
                          return (
                            <div key={p.id || i} style={{ padding: '8px 0', borderBottom: i < Math.min(purchases.length, 6) - 1 ? '1px solid #e5e7eb' : 'none' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#111', flex: 1, marginRight: '8px' }}>
                                  {p.item_name || p.service_name || p.description || 'Payment'}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111', whiteSpace: 'nowrap' }}>
                                  ${displayAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{p.payment_method ? p.payment_method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''}</span>
                                <span>{p.purchase_date ? new Date(p.purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' }) : ''}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Recent Visits */}
                    <div style={card}>
                      <h4 style={sectionHead}>Recent Visits ({logs.length})</h4>
                      {logs.length > 0 ? logs.slice(0, 8).map((log, i) => (
                        <div key={log.id || i} style={{ padding: '6px 0', borderBottom: i < Math.min(logs.length, 8) - 1 ? '1px solid #e5e7eb' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '13px', color: '#333' }}>
                              {log.category ? log.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Visit'}
                            </div>
                            {log.medication && <div style={{ fontSize: '11px', color: '#888' }}>{log.medication} {log.dosage || ''}</div>}
                          </div>
                          <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>
                            {new Date(log.entry_date || log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}
                          </span>
                        </div>
                      )) : <span style={{ fontSize: '13px', color: '#bbb' }}>No visits recorded</span>}
                    </div>

                    {/* Labs */}
                    {labs.length > 0 && (
                      <div style={card}>
                        <h4 style={sectionHead}>Labs ({labs.length})</h4>
                        {labs.slice(0, 5).map((lab, i) => (
                          <div key={lab.id || i} style={{ padding: '6px 0', borderBottom: i < Math.min(labs.length, 5) - 1 ? '1px solid #e5e7eb' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', color: '#333' }}>{lab.lab_type || 'Lab'} — {lab.lab_panel || ''}</span>
                            <span style={{ fontSize: '12px', color: lab.status === 'completed' ? '#16a34a' : '#f59e0b' }}>
                              {lab.status === 'completed' ? '✓ Done' : lab.status || 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Past Appointments */}
                    <div style={card}>
                      <h4 style={sectionHead}>Past Appointments ({pastAppts.length})</h4>
                      {pastAppts.length === 0 ? (
                        <span style={{ fontSize: '13px', color: '#bbb' }}>No past appointments</span>
                      ) : (
                        pastAppts.slice(0, 6).map((apt, i) => (
                          <div key={apt.id || i} style={{ padding: '6px 0', borderBottom: i < Math.min(pastAppts.length, 6) - 1 ? '1px solid #e5e7eb' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <span style={{ fontSize: '13px', color: '#555' }}>{apt.calendar_name || apt.service_name || apt.title || 'Appointment'}</span>
                              {apt.provider && <span style={{ fontSize: '11px', color: '#aaa' }}> · {apt.provider}</span>}
                            </div>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                              {new Date(apt.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Documents & Consents */}
                    {(docs.length > 0 || consents.length > 0) && (
                      <div style={card}>
                        <h4 style={sectionHead}>Documents ({docs.length + consents.length})</h4>
                        {consents.slice(0, 4).map((c, i) => (
                          <div key={c.id || i} style={{ padding: '5px 0', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
                            <span style={{ fontSize: '13px', color: '#333' }}>{c.form_type || 'Consent'}</span>
                            <span style={{ fontSize: '11px', color: c.status === 'signed' ? '#16a34a' : '#f59e0b' }}>{c.status || '—'}</span>
                          </div>
                        ))}
                        {docs.slice(0, 4).map((d, i) => (
                          <div key={d.id || i} style={{ padding: '5px 0', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
                            <span style={{ fontSize: '13px', color: '#333' }}>{d.document_name || d.document_type || 'Document'}</span>
                            <span style={{ fontSize: '11px', color: '#888' }}>{d.document_type}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {notes.length > 0 && (
                      <div style={card}>
                        <h4 style={sectionHead}>Notes ({notes.length})</h4>
                        {notes.slice(0, 3).map((note, i) => (
                          <div key={note.id || i} style={{ padding: '8px 0', borderBottom: i < Math.min(notes.length, 3) - 1 ? '1px solid #e5e7eb' : 'none' }}>
                            <div style={{ fontSize: '12px', color: '#888', marginBottom: '3px' }}>
                              {new Date(note.note_date || note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })}
                              {note.source && <> · {note.source}</>}
                            </div>
                            <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.4', maxHeight: '60px', overflow: 'hidden', whiteSpace: 'pre-line' }}>
                              {stripNoteHtml(note.body)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </>
        );
      })()}

    </AdminLayout>
  );
}

const styles = {
  filterSelect: {
    padding: '8px 12px',
    fontSize: '13px',
    border: '1px solid #ddd',
    borderRadius: 0,
    background: '#fff',
    color: '#333',
    cursor: 'pointer',
    fontWeight: '500',
    minWidth: '150px',
  },
  tab: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  dateNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    padding: '10px 16px',
    background: '#fff',
    border: '1px solid #e5e5e5',
  },
  dateNavBtn: {
    background: 'none',
    border: '1px solid #ddd',
    padding: '6px 14px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#333',
    fontWeight: '500',
  },
  dateNavCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dateNavLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#111',
  },
  todayBtn: {
    background: '#000',
    color: '#fff',
    border: 'none',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};
