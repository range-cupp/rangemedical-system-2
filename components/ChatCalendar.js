// components/ChatCalendar.js
// Mobile-first calendar day view for the Range Chat PWA.
// Shows today's (or selected day's) appointments with quick actions.

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  scheduled:  { bg: '#eff6ff', color: '#2563eb', label: 'Scheduled' },
  confirmed:  { bg: '#f0fdf4', color: '#16a34a', label: 'Confirmed' },
  checked_in: { bg: '#fffbeb', color: '#d97706', label: 'Checked In' },
  showed:     { bg: '#f0fdf4', color: '#16a34a', label: 'Showed' },
  completed:  { bg: '#f1f5f9', color: '#64748b', label: 'Completed' },
  no_show:    { bg: '#fef2f2', color: '#dc2626', label: 'No Show' },
  cancelled:  { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' },
};

const NEXT_STATUS = {
  scheduled: 'confirmed',
  confirmed: 'checked_in',
  checked_in: 'completed',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function pacificDateString(date) {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

function todayPacific() {
  return pacificDateString(new Date());
}

function shiftDate(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return dateStr.length === 10 ? d.toISOString().split('T')[0] : pacificDateString(d);
}

function formatDateHeader(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = todayPacific();
  const tomorrow = shiftDate(today, 1);
  const yesterday = shiftDate(today, -1);
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  if (dateStr === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles',
  });
}

function formatDuration(mins) {
  if (!mins) return '';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function ChevronLeft({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRight({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function XIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function PlusIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function CalendarPlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="12" y1="14" x2="12" y2="20" /><line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function ArrowLeft({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#0f172a', '#1e293b', '#334155', '#1f2937', '#111827'];

function Avatar({ name, size = 36 }) {
  const initials = getInitials(name);
  const idx = (name || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[idx],
      color: '#fff', fontSize: size * 0.38, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{initials}</div>
  );
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}


// ── Main component ──────────────────────────────────────────────────────────

export default function ChatCalendar({ employee, onDial }) {
  const [selectedDate, setSelectedDate] = useState(todayPacific);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);

  // New appointment state
  const [showNew, setShowNew] = useState(false);
  const [newStep, setNewStep] = useState(1); // 1=service, 2=date/slot, 3=patient, 4=reason, 5=confirm
  const [eventTypes, setEventTypes] = useState([]);
  const [loadingEventTypes, setLoadingEventTypes] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [newDate, setNewDate] = useState(todayPacific);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visitReason, setVisitReason] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const patientSearchTimeout = useRef(null);

  // Reschedule state
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(todayPacific);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);

  // Cancel state
  const [cancelAppt, setCancelAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // ── Fetch appointments ──────────────────────────────────────────────────

  const fetchAppointments = useCallback(async (date) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/list?date=${date}&range=day`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.bookings || []);
      }
    } catch (e) {
      console.error('Failed to fetch appointments:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [selectedDate, fetchAppointments]);

  // ── Advance status ────────────────────────────────────────────────────

  const handleStatusAdvance = useCallback(async (appt) => {
    const next = NEXT_STATUS[appt.status];
    if (!next) return;
    setStatusUpdating(appt.id);
    try {
      const res = await fetch(`/api/appointments/${appt.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: next } : a));
      }
    } catch (e) {
      console.error('Status update failed:', e);
    } finally {
      setStatusUpdating(null);
    }
  }, []);

  // ── Cancel ────────────────────────────────────────────────────────────

  const handleCancel = useCallback(async () => {
    if (!cancelAppt) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: cancelAppt.id, reason: cancelReason }),
      });
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.id !== cancelAppt.id));
        setCancelAppt(null);
        setCancelReason('');
      }
    } catch (e) {
      console.error('Cancel failed:', e);
    } finally {
      setCancelling(false);
    }
  }, [cancelAppt, cancelReason]);

  // ── Reschedule ────────────────────────────────────────────────────────

  const startReschedule = useCallback((appt) => {
    setRescheduleAppt(appt);
    setRescheduleDate(todayPacific());
    setRescheduleSlots([]);
    setSelectedRescheduleSlot(null);
    setExpandedId(null);
  }, []);

  const fetchRescheduleSlots = useCallback(async (date) => {
    if (!rescheduleAppt) return;
    setLoadingRescheduleSlots(true);
    setSelectedRescheduleSlot(null);
    try {
      const slug = rescheduleAppt.service_slug || '';
      const name = rescheduleAppt.service_name || '';
      let url = `/api/bookings/slots?date=${date}`;
      if (slug) url += `&serviceSlug=${encodeURIComponent(slug)}`;
      else url += `&serviceSlug=${encodeURIComponent(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const daySlots = data.slots?.[date] || [];
        setRescheduleSlots(daySlots);
      }
    } catch (e) {
      console.error('Reschedule slots error:', e);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  }, [rescheduleAppt]);

  useEffect(() => {
    if (rescheduleAppt) fetchRescheduleSlots(rescheduleDate);
  }, [rescheduleDate, rescheduleAppt, fetchRescheduleSlots]);

  const handleReschedule = useCallback(async () => {
    if (!rescheduleAppt || !selectedRescheduleSlot) return;
    setRescheduling(true);
    try {
      const res = await fetch('/api/bookings/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: rescheduleAppt.id, newStart: selectedRescheduleSlot.start }),
      });
      if (res.ok) {
        setRescheduleAppt(null);
        fetchAppointments(selectedDate);
      }
    } catch (e) {
      console.error('Reschedule failed:', e);
    } finally {
      setRescheduling(false);
    }
  }, [rescheduleAppt, selectedRescheduleSlot, selectedDate, fetchAppointments]);

  // ── New appointment: fetch event types ────────────────────────────────

  const openNewAppointment = useCallback(async () => {
    setShowNew(true);
    setNewStep(1);
    setSelectedService(null);
    setSelectedSlot(null);
    setSelectedPatient(null);
    setVisitReason('');
    setCreateError('');
    if (eventTypes.length === 0) {
      setLoadingEventTypes(true);
      try {
        const res = await fetch('/api/bookings/event-types');
        if (res.ok) {
          const data = await res.json();
          setEventTypes(data.eventTypes || []);
        }
      } catch (e) {
        console.error('Event types error:', e);
      } finally {
        setLoadingEventTypes(false);
      }
    }
  }, [eventTypes.length]);

  // ── New appointment: fetch slots ──────────────────────────────────────

  const fetchNewSlots = useCallback(async (date) => {
    if (!selectedService) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/bookings/slots?serviceSlug=${encodeURIComponent(selectedService.slug)}&date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots?.[date] || []);
      }
    } catch (e) {
      console.error('Slots error:', e);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedService]);

  useEffect(() => {
    if (showNew && newStep === 2 && selectedService) fetchNewSlots(newDate);
  }, [showNew, newStep, newDate, selectedService, fetchNewSlots]);

  // ── New appointment: patient search ───────────────────────────────────

  const handlePatientSearch = useCallback((q) => {
    setPatientSearch(q);
    if (patientSearchTimeout.current) clearTimeout(patientSearchTimeout.current);
    if (!q || q.trim().length < 2) { setPatientResults([]); return; }
    setSearchingPatients(true);
    patientSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setPatientResults(data.patients || []);
        }
      } catch (e) {
        console.error('Patient search error:', e);
      } finally {
        setSearchingPatients(false);
      }
    }, 300);
  }, []);

  // ── New appointment: create ───────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    if (!selectedService || !selectedSlot || !selectedPatient) return;
    setCreating(true);
    setCreateError('');
    try {
      const patientName = selectedPatient.name ||
        [selectedPatient.first_name, selectedPatient.last_name].filter(Boolean).join(' ').trim();
      const end = new Date(new Date(selectedSlot.start).getTime() + selectedService.length * 60000);
      const res = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          patient_name: patientName,
          patient_phone: selectedPatient.phone || '',
          service_name: selectedService.title,
          service_slug: selectedService.slug,
          service_category: selectedService.category || '',
          start_time: selectedSlot.start,
          end_time: end.toISOString(),
          duration_minutes: selectedService.length,
          visit_reason: visitReason || selectedService.title,
          source: 'staff',
          created_by: employee?.name || 'Staff',
          send_notification: true,
        }),
      });
      if (res.ok) {
        setShowNew(false);
        fetchAppointments(selectedDate);
      } else {
        const data = await res.json();
        setCreateError(data.error || 'Failed to create appointment');
      }
    } catch (e) {
      setCreateError('Network error');
    } finally {
      setCreating(false);
    }
  }, [selectedService, selectedSlot, selectedPatient, visitReason, employee, selectedDate, fetchAppointments]);

  // ── Generate 14 dates for slot picker ─────────────────────────────────

  const datePicker = useCallback((baseDate, onSelect) => {
    const dates = [];
    const today = todayPacific();
    for (let i = 0; i < 14; i++) {
      dates.push(shiftDate(today, i));
    }
    return (
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 0 8px', WebkitOverflowScrolling: 'touch' }}>
        {dates.map(d => {
          const dt = new Date(d + 'T12:00:00');
          const isSelected = d === baseDate;
          return (
            <button
              key={d}
              onClick={() => onSelect(d)}
              style={{
                flexShrink: 0, width: 52, padding: '8px 0',
                borderRadius: 12, border: 'none', cursor: 'pointer',
                background: isSelected ? '#0f172a' : '#f1f5f9',
                color: isSelected ? '#fff' : '#0f172a',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', opacity: 0.7 }}>
                {dt.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{dt.getDate()}</span>
            </button>
          );
        })}
      </div>
    );
  }, []);

  // ── Slot grid ─────────────────────────────────────────────────────────

  const slotGrid = useCallback((slotsArr, selected, onSelect, isLoading) => {
    if (isLoading) {
      return <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading slots...</div>;
    }
    if (slotsArr.length === 0) {
      return <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No available slots this day</div>;
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {slotsArr.map(s => {
          const isSelected = selected?.start === s.start;
          return (
            <button
              key={s.start}
              onClick={() => onSelect(s)}
              style={{
                padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: isSelected ? '#0f172a' : '#f8fafc',
                color: isSelected ? '#fff' : '#0f172a',
                fontSize: 14, fontWeight: 600,
                border: isSelected ? 'none' : '1px solid #e2e8f0',
              }}
            >
              {formatTime(s.start)}
            </button>
          );
        })}
      </div>
    );
  }, []);

  // ── Cancel modal ──────────────────────────────────────────────────────

  if (cancelAppt) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          padding: '10px 12px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <button onClick={() => { setCancelAppt(null); setCancelReason(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
            <ArrowLeft />
          </button>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Cancel Appointment</div>
        </div>

        <div style={{ flex: 1, padding: 16 }}>
          <div style={{ background: '#fef2f2', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{cancelAppt.patient_name}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{cancelAppt.service_name}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{formatTime(cancelAppt.start_time)}</div>
          </div>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
            Reason (optional)
          </label>
          <textarea
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Why is this being cancelled?"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0',
              borderRadius: 10, padding: '10px 14px', fontSize: 15,
              background: '#f8fafc', resize: 'none', fontFamily: 'inherit',
            }}
          />

          <button
            onClick={handleCancel}
            disabled={cancelling}
            style={{
              width: '100%', padding: '14px 0', marginTop: 16,
              background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              opacity: cancelling ? 0.6 : 1,
            }}
          >{cancelling ? 'Cancelling...' : 'Cancel Appointment'}</button>
        </div>
      </div>
    );
  }

  // ── Reschedule view ───────────────────────────────────────────────────

  if (rescheduleAppt) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          padding: '10px 12px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <button onClick={() => setRescheduleAppt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
            <ArrowLeft />
          </button>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Reschedule</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{rescheduleAppt.patient_name}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{rescheduleAppt.service_name}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Currently: {formatTime(rescheduleAppt.start_time)} on {new Date(rescheduleAppt.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}
            </div>
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Pick a new date</div>
          {datePicker(rescheduleDate, setRescheduleDate)}

          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '16px 0 10px' }}>Pick a new time</div>
          {slotGrid(rescheduleSlots, selectedRescheduleSlot, setSelectedRescheduleSlot, loadingRescheduleSlots)}
        </div>

        <div style={{ padding: '12px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <button
            onClick={handleReschedule}
            disabled={!selectedRescheduleSlot || rescheduling}
            style={{
              width: '100%', padding: '14px 0',
              background: selectedRescheduleSlot && !rescheduling ? '#0f172a' : '#e2e8f0',
              color: selectedRescheduleSlot && !rescheduling ? '#fff' : '#94a3b8',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >{rescheduling ? 'Rescheduling...' : (selectedRescheduleSlot ? `Move to ${formatTime(selectedRescheduleSlot.start)}` : 'Select a time slot')}</button>
        </div>
      </div>
    );
  }

  // ── New appointment flow ──────────────────────────────────────────────

  if (showNew) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          padding: '10px 12px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <button
            onClick={() => {
              if (newStep > 1) setNewStep(newStep - 1);
              else setShowNew(false);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}
          ><ArrowLeft /></button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>New Appointment</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Step {newStep} of 4</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, WebkitOverflowScrolling: 'touch' }}>
          {/* Step 1: Pick service */}
          {newStep === 1 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>What type of appointment?</div>
              {loadingEventTypes ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {eventTypes.map(et => (
                    <button
                      key={et.slug}
                      onClick={() => { setSelectedService(et); setNewStep(2); setNewDate(todayPacific()); }}
                      style={{
                        padding: '14px 16px', background: '#fff',
                        border: '1.5px solid #e2e8f0', borderRadius: 12,
                        cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{et.title}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{et.length} min</div>
                      </div>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 2: Pick date and time */}
          {newStep === 2 && selectedService && (
            <>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarPlusIcon />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{selectedService.title}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{selectedService.length}m</span>
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Pick a date</div>
              {datePicker(newDate, setNewDate)}

              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '16px 0 10px' }}>Pick a time</div>
              {slotGrid(slots, selectedSlot, setSelectedSlot, loadingSlots)}
            </>
          )}

          {/* Step 3: Pick patient */}
          {newStep === 3 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Which patient?</div>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <SearchIcon />
                </div>
                <input
                  value={patientSearch}
                  onChange={e => handlePatientSearch(e.target.value)}
                  placeholder="Search patient name..."
                  autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1.5px solid #e2e8f0', borderRadius: 10,
                    padding: '10px 12px 10px 36px', fontSize: 15,
                    background: '#f8fafc', outline: 'none',
                  }}
                />
              </div>
              {searchingPatients && (
                <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Searching...</div>
              )}
              {patientSearch.trim().length >= 2 && !searchingPatients && patientResults.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No patients found</div>
              )}
              {patientResults.map(p => {
                const name = p.name || [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
                return (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPatient({ ...p, name }); setNewStep(4); }}
                    style={{
                      width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                      border: 'none', borderBottom: '1px solid #f1f5f9', background: '#fff',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    }}
                  >
                    <Avatar name={name} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{p.phone || 'No phone'}</div>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Step 4: Reason + Confirm */}
          {newStep === 4 && selectedService && selectedSlot && selectedPatient && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Confirm details</div>

              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Avatar name={selectedPatient.name} size={36} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{selectedPatient.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{selectedPatient.phone || 'No phone'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarPlusIcon />
                    <span style={{ fontWeight: 600 }}>{selectedService.title}</span>
                    <span style={{ color: '#94a3b8' }}>{selectedService.length}m</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ClockIcon />
                    <span>{formatTime(selectedSlot.start)} on {new Date(selectedSlot.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}</span>
                  </div>
                </div>
              </div>

              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Visit reason
              </label>
              <input
                value={visitReason}
                onChange={e => setVisitReason(e.target.value)}
                placeholder={selectedService.title}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: '1.5px solid #e2e8f0', borderRadius: 10,
                  padding: '10px 14px', fontSize: 15,
                  background: '#f8fafc', outline: 'none',
                }}
              />

              {createError && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', background: '#fef2f2',
                  border: '1px solid #fecaca', borderRadius: 10,
                  fontSize: 13, color: '#dc2626',
                }}>{createError}</div>
              )}
            </>
          )}
        </div>

        {/* Bottom action buttons */}
        {newStep === 2 && selectedSlot && (
          <div style={{ padding: '12px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
            <button
              onClick={() => { setNewStep(3); setPatientSearch(''); setPatientResults([]); setSelectedPatient(null); }}
              style={{
                width: '100%', padding: '14px 0', background: '#0f172a', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >Next: Pick Patient</button>
          </div>
        )}
        {newStep === 4 && (
          <div style={{ padding: '12px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                width: '100%', padding: '14px 0',
                background: creating ? '#e2e8f0' : '#0f172a',
                color: creating ? '#94a3b8' : '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >{creating ? 'Booking...' : 'Book Appointment'}</button>
          </div>
        )}
      </div>
    );
  }

  // ── Main day view ─────────────────────────────────────────────────────

  const isToday = selectedDate === todayPacific();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Date navigation header */}
      <div style={{
        padding: '12px 16px 10px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button
            onClick={() => setSelectedDate(d => shiftDate(d, -1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#0f172a', display: 'flex' }}
          ><ChevronLeft /></button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              {formatDateHeader(selectedDate)}
            </div>
            {!isToday && (
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedDate(d => shiftDate(d, 1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#0f172a', display: 'flex' }}
          ><ChevronRight /></button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayPacific())}
              style={{
                padding: '6px 14px', background: '#f1f5f9', border: 'none',
                borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer',
              }}
            >Today</button>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
            {loading ? '...' : `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* Appointment list */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading && appointments.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading...</div>
        )}
        {!loading && appointments.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>No appointments</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>Tap + to book one</div>
          </div>
        )}

        {appointments.map(appt => {
          const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled;
          const isExpanded = expandedId === appt.id;
          const nextStatus = NEXT_STATUS[appt.status];

          return (
            <div key={appt.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : appt.id)}
                style={{
                  width: '100%', padding: '12px 16px',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  border: 'none', borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                  background: isExpanded ? '#f8fafc' : '#fff',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                {/* Time column */}
                <div style={{ width: 56, flexShrink: 0, paddingTop: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    {formatTime(appt.start_time)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {formatDuration(appt.duration_minutes)}
                  </div>
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {appt.patient_name}
                    </span>
                    <span style={{
                      flexShrink: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.3px', padding: '2px 7px', borderRadius: 6,
                      background: sc.bg, color: sc.color,
                    }}>{sc.label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {appt.service_name}
                  </div>
                </div>

                {/* Expand indicator */}
                <div style={{ flexShrink: 0, color: '#cbd5e1', paddingTop: 4, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                  <ChevronRight size={16} />
                </div>
              </button>

              {/* Expanded action panel */}
              {isExpanded && (
                <div style={{
                  padding: '0 16px 14px', borderBottom: '1px solid #e2e8f0',
                  background: '#f8fafc',
                }}>
                  {/* Info row */}
                  {appt.notes && (
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10, padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      {appt.notes}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {/* Advance status */}
                    {nextStatus && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusAdvance(appt); }}
                        disabled={statusUpdating === appt.id}
                        style={{
                          flex: 1, minWidth: 'calc(50% - 4px)', padding: '10px 0',
                          background: '#0f172a', color: '#fff', border: 'none',
                          borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          opacity: statusUpdating === appt.id ? 0.6 : 1,
                        }}
                      >
                        <CheckIcon />
                        {statusUpdating === appt.id ? 'Updating...' : STATUS_COLORS[nextStatus]?.label || nextStatus}
                      </button>
                    )}

                    {/* Call patient */}
                    {appt.patient_phone && onDial && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDial(appt.patient_phone, appt.patient_name); }}
                        style={{
                          flex: 1, minWidth: 'calc(50% - 4px)', padding: '10px 0',
                          background: '#22c55e', color: '#fff', border: 'none',
                          borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <PhoneIcon /> Call
                      </button>
                    )}

                    {/* Reschedule */}
                    {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); startReschedule(appt); }}
                        style={{
                          flex: 1, minWidth: 'calc(50% - 4px)', padding: '10px 0',
                          background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0',
                          borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <ClockIcon /> Reschedule
                      </button>
                    )}

                    {/* Cancel */}
                    {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCancelAppt(appt); }}
                        style={{
                          flex: 1, minWidth: 'calc(50% - 4px)', padding: '10px 0',
                          background: '#fff', color: '#dc2626', border: '1.5px solid #fecaca',
                          borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <XIcon size={14} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAB to create new appointment */}
      <button
        onClick={openNewAppointment}
        aria-label="New appointment"
        style={{
          position: 'absolute', right: 20, bottom: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: '#0f172a', color: '#fff', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 16px rgba(0,0,0,0.18)', cursor: 'pointer',
          zIndex: 10,
        }}
      ><PlusIcon size={26} /></button>
    </div>
  );
}
