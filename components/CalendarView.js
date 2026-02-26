// /components/CalendarView.js
// Native appointment calendar — Range Medical
// Day / Week / Month views with new appointment wizard
// Replaces BookingTab in Command Center

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCategoryStyle } from '../lib/protocol-config';
import { APPOINTMENT_SERVICES, getAllServices } from '../lib/appointment-services';

const STATUS_LABELS = {
  scheduled: { label: 'Scheduled', bg: '#dbeafe', text: '#1e40af' },
  confirmed: { label: 'Confirmed', bg: '#dcfce7', text: '#166534' },
  checked_in: { label: 'Checked In', bg: '#fef3c7', text: '#92400e' },
  in_progress: { label: 'In Progress', bg: '#e0e7ff', text: '#3730a3' },
  completed: { label: 'Completed', bg: '#dcfce7', text: '#166534' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', text: '#dc2626' },
  no_show: { label: 'No Show', bg: '#fee2e2', text: '#dc2626' },
  rescheduled: { label: 'Rescheduled', bg: '#f3f4f6', text: '#374151' },
};

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM

export default function CalendarView({ preselectedPatient = null }) {
  // Calendar state
  const [viewMode, setViewMode] = useState('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const popoverRef = useRef(null);

  // New appointment wizard state
  const [wizardStep, setWizardStep] = useState(0); // 0=patient, 1=service, 2=datetime, 3=confirm
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceGroup, setSelectedServiceGroup] = useState(null);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptNotes, setApptNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Reschedule state
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let startDate, endDate;
      if (viewMode === 'day') {
        startDate = formatDateISO(currentDate) + 'T00:00:00';
        endDate = formatDateISO(currentDate) + 'T23:59:59';
      } else if (viewMode === 'week') {
        const weekStart = getWeekStart(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        startDate = formatDateISO(weekStart) + 'T00:00:00';
        endDate = formatDateISO(weekEnd) + 'T23:59:59';
      } else {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        startDate = formatDateISO(monthStart) + 'T00:00:00';
        endDate = formatDateISO(monthEnd) + 'T23:59:59';
      }

      const res = await fetch(`/api/appointments/list?start_date=${startDate}&end_date=${endDate}`);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('Fetch appointments error:', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, currentDate]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setSelectedAppt(null);
        setRescheduleAppt(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Pre-fill wizard if patient is preselected
  useEffect(() => {
    if (preselectedPatient) {
      setSelectedPatient(preselectedPatient);
      setWizardStep(1);
    }
  }, [preselectedPatient]);

  // ===================== Patient Search =====================
  const searchPatients = async (q) => {
    setPatientSearch(q);
    if (q.length < 2) { setPatientResults([]); return; }
    setSearchingPatients(true);
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setPatientResults(data.patients || data || []);
    } catch (err) {
      console.error('Patient search error:', err);
    } finally {
      setSearchingPatients(false);
    }
  };

  // ===================== Create Appointment =====================
  const createAppointment = async () => {
    setCreating(true);
    try {
      const startDT = new Date(`${apptDate}T${apptTime}`);
      const duration = selectedService?.duration || 30;
      const endDT = new Date(startDT.getTime() + duration * 60000);

      const body = {
        patient_id: selectedPatient?.id || null,
        patient_name: isWalkIn ? walkInName : selectedPatient?.name,
        patient_phone: isWalkIn ? walkInPhone : selectedPatient?.phone,
        service_name: selectedService.name,
        service_category: selectedService.category,
        start_time: startDT.toISOString(),
        end_time: endDT.toISOString(),
        duration_minutes: duration,
        notes: apptNotes || null,
        created_by: 'command_center',
      };

      const res = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Reset wizard
        resetWizard();
        // Set date to the new appointment's date and refresh
        setCurrentDate(startDT);
        setViewMode('day');
        fetchAppointments();
      } else {
        const err = await res.json();
        alert('Error: ' + (err.error || 'Could not create appointment'));
      }
    } catch (err) {
      alert('Error creating appointment');
    } finally {
      setCreating(false);
    }
  };

  const resetWizard = () => {
    setWizardStep(preselectedPatient ? 1 : 0);
    setSelectedPatient(preselectedPatient || null);
    setPatientSearch('');
    setPatientResults([]);
    setIsWalkIn(false);
    setWalkInName('');
    setWalkInPhone('');
    setSelectedService(null);
    setSelectedServiceGroup(null);
    setApptDate('');
    setApptTime('');
    setApptNotes('');
  };

  // ===================== Status Changes =====================
  const updateStatus = async (apptId, newStatus, reason) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, cancellation_reason: reason }),
      });
      if (res.ok) {
        setSelectedAppt(null);
        fetchAppointments();
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime || !rescheduleAppt) return;
    try {
      const newStart = new Date(`${rescheduleDate}T${rescheduleTime}`);
      const newEnd = new Date(newStart.getTime() + rescheduleAppt.duration_minutes * 60000);

      const res = await fetch(`/api/appointments/${rescheduleAppt.id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_start_time: newStart.toISOString(),
          new_end_time: newEnd.toISOString(),
        }),
      });
      if (res.ok) {
        setRescheduleAppt(null);
        setSelectedAppt(null);
        fetchAppointments();
      }
    } catch (err) {
      console.error('Reschedule error:', err);
    }
  };

  // ===================== Navigation =====================
  const navigate = (dir) => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + dir);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7 * dir);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const goToDate = (date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  // ===================== Render Helpers =====================
  const isToday = (d) => formatDateISO(d) === formatDateISO(new Date());

  const getApptStyle = (appt) => {
    const cat = getCategoryStyle(appt.service_category || 'other');
    return { background: cat.bg, color: cat.text, borderLeft: `3px solid ${cat.text}` };
  };

  const getStatusBadge = (status) => {
    const s = STATUS_LABELS[status] || STATUS_LABELS.scheduled;
    return (
      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: s.bg, color: s.text }}>
        {s.label}
      </span>
    );
  };

  // ===================== DAY VIEW =====================
  const renderDayView = () => {
    const dayAppts = appointments.filter(a =>
      formatDateISO(new Date(a.start_time)) === formatDateISO(currentDate)
    );
    const now = new Date();
    const showTimeLine = isToday(currentDate);

    return (
      <div style={styles.dayGrid}>
        {HOURS.map(hour => (
          <div key={hour} style={styles.hourRow}>
            <div style={styles.hourLabel}>
              {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
            </div>
            <div style={styles.hourCell} />
          </div>
        ))}
        {/* Appointment blocks */}
        {dayAppts.map(appt => {
          const start = new Date(appt.start_time);
          const startHour = start.getHours() + start.getMinutes() / 60;
          const top = (startHour - 8) * 60;
          const height = Math.max(appt.duration_minutes || 30, 20);
          if (top < 0 || startHour > 18) return null;
          const catStyle = getApptStyle(appt);

          return (
            <div
              key={appt.id}
              onClick={(e) => { e.stopPropagation(); setSelectedAppt(appt); }}
              style={{
                ...styles.apptBlock,
                ...catStyle,
                top: `${top}px`,
                height: `${height}px`,
              }}
            >
              <div style={styles.apptBlockName}>{appt.patient_name}</div>
              <div style={styles.apptBlockService}>{appt.service_name}</div>
              <div style={styles.apptBlockTime}>
                {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
              </div>
              {getStatusBadge(appt.status)}
            </div>
          );
        })}
        {/* Current time line */}
        {showTimeLine && (() => {
          const nowHour = now.getHours() + now.getMinutes() / 60;
          if (nowHour < 8 || nowHour > 18) return null;
          const top = (nowHour - 8) * 60;
          return <div style={{ ...styles.timeLine, top: `${top}px` }} />;
        })()}
      </div>
    );
  };

  // ===================== WEEK VIEW =====================
  const renderWeekView = () => {
    const weekStart = getWeekStart(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div style={styles.weekGrid}>
        {days.map(day => {
          const dayStr = formatDateISO(day);
          const dayAppts = appointments.filter(a =>
            formatDateISO(new Date(a.start_time)) === dayStr
          );
          const today = isToday(day);

          return (
            <div key={dayStr} style={{ ...styles.weekDay, ...(today ? styles.weekDayToday : {}) }}>
              <div
                onClick={() => goToDate(day)}
                style={{ ...styles.weekDayHeader, ...(today ? styles.weekDayHeaderToday : {}), cursor: 'pointer' }}
              >
                <span style={styles.weekDayName}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span style={styles.weekDayNum}>{day.getDate()}</span>
              </div>
              <div style={styles.weekDayBody}>
                {dayAppts.map(appt => (
                  <div
                    key={appt.id}
                    onClick={() => { setSelectedAppt(appt); setCurrentDate(day); }}
                    style={{ ...styles.weekApptCard, ...getApptStyle(appt) }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: '600' }}>{appt.patient_name}</div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>{appt.service_name}</div>
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>{formatTime(appt.start_time)}</div>
                  </div>
                ))}
                {dayAppts.length === 0 && (
                  <div style={{ fontSize: '11px', color: '#ccc', padding: '8px 4px' }}>No appts</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ===================== MONTH VIEW =====================
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const cells = [];

    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Padding
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));

    return (
      <div>
        <div style={styles.monthHeader}>
          {dayHeaders.map(d => (
            <div key={d} style={styles.monthDayHeader}>{d}</div>
          ))}
        </div>
        <div style={styles.monthGrid}>
          {cells.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} style={styles.monthCell} />;
            const dayStr = formatDateISO(day);
            const dayAppts = appointments.filter(a =>
              formatDateISO(new Date(a.start_time)) === dayStr
            );
            const today = isToday(day);

            // Category dots
            const categories = [...new Set(dayAppts.map(a => a.service_category || 'other'))];

            return (
              <div
                key={dayStr}
                onClick={() => goToDate(day)}
                style={{ ...styles.monthCell, ...(today ? styles.monthCellToday : {}), cursor: 'pointer' }}
              >
                <div style={{ ...styles.monthCellNum, ...(today ? { color: '#fff', background: '#000', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}) }}>
                  {day.getDate()}
                </div>
                {dayAppts.length > 0 && (
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {categories.slice(0, 4).map(cat => {
                      const cs = getCategoryStyle(cat);
                      return <div key={cat} style={{ width: '6px', height: '6px', borderRadius: '50%', background: cs.text }} />;
                    })}
                  </div>
                )}
                {dayAppts.length > 0 && (
                  <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{dayAppts.length}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ===================== APPOINTMENT DETAIL POPOVER =====================
  const renderDetailPopover = () => {
    if (!selectedAppt) return null;
    const appt = selectedAppt;

    return (
      <div style={styles.popoverOverlay} onClick={() => { setSelectedAppt(null); setRescheduleAppt(null); }}>
        <div ref={popoverRef} style={styles.popover} onClick={e => e.stopPropagation()}>
          <div style={styles.popoverHeader}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Appointment Details</h3>
            <button onClick={() => { setSelectedAppt(null); setRescheduleAppt(null); }} style={styles.closeBtn}>&times;</button>
          </div>
          <div style={styles.popoverBody}>
            <div style={styles.popoverRow}>
              <span style={styles.popoverLabel}>Patient</span>
              <span style={styles.popoverValue}>{appt.patient_name}</span>
            </div>
            <div style={styles.popoverRow}>
              <span style={styles.popoverLabel}>Service</span>
              <span style={styles.popoverValue}>{appt.service_name}</span>
            </div>
            <div style={styles.popoverRow}>
              <span style={styles.popoverLabel}>Date</span>
              <span style={styles.popoverValue}>
                {new Date(appt.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div style={styles.popoverRow}>
              <span style={styles.popoverLabel}>Time</span>
              <span style={styles.popoverValue}>{formatTime(appt.start_time)} – {formatTime(appt.end_time)}</span>
            </div>
            <div style={styles.popoverRow}>
              <span style={styles.popoverLabel}>Duration</span>
              <span style={styles.popoverValue}>{appt.duration_minutes} min</span>
            </div>
            <div style={styles.popoverRow}>
              <span style={styles.popoverLabel}>Status</span>
              <span>{getStatusBadge(appt.status)}</span>
            </div>
            {appt.notes && (
              <div style={styles.popoverRow}>
                <span style={styles.popoverLabel}>Notes</span>
                <span style={styles.popoverValue}>{appt.notes}</span>
              </div>
            )}
            {appt.cancellation_reason && (
              <div style={styles.popoverRow}>
                <span style={styles.popoverLabel}>Reason</span>
                <span style={{ ...styles.popoverValue, color: '#dc2626' }}>{appt.cancellation_reason}</span>
              </div>
            )}

            {/* Reschedule form */}
            {rescheduleAppt?.id === appt.id && (
              <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Reschedule to:</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} style={styles.input} />
                  <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} style={styles.input} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleReschedule} disabled={!rescheduleDate || !rescheduleTime} style={{ ...styles.actionBtn, background: '#1e40af', color: '#fff', opacity: (!rescheduleDate || !rescheduleTime) ? 0.5 : 1 }}>
                    Confirm Reschedule
                  </button>
                  <button onClick={() => setRescheduleAppt(null)} style={styles.actionBtn}>Cancel</button>
                </div>
              </div>
            )}

            {/* Status action buttons */}
            {!['completed', 'cancelled', 'rescheduled', 'no_show'].includes(appt.status) && (
              <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {appt.status === 'scheduled' && (
                  <button onClick={() => updateStatus(appt.id, 'confirmed')} style={{ ...styles.actionBtn, background: '#dcfce7', color: '#166534' }}>Confirm</button>
                )}
                {['scheduled', 'confirmed'].includes(appt.status) && (
                  <button onClick={() => updateStatus(appt.id, 'checked_in')} style={{ ...styles.actionBtn, background: '#dbeafe', color: '#1e40af' }}>Check In</button>
                )}
                {appt.status === 'checked_in' && (
                  <button onClick={() => updateStatus(appt.id, 'in_progress')} style={{ ...styles.actionBtn, background: '#e0e7ff', color: '#3730a3' }}>Start</button>
                )}
                {['checked_in', 'in_progress'].includes(appt.status) && (
                  <button onClick={() => updateStatus(appt.id, 'completed')} style={{ ...styles.actionBtn, background: '#dcfce7', color: '#166534' }}>Complete</button>
                )}
                <button onClick={() => { setRescheduleAppt(appt); setRescheduleDate(''); setRescheduleTime(''); }} style={{ ...styles.actionBtn, background: '#fff7ed', color: '#c2410c' }}>Reschedule</button>
                {['scheduled', 'confirmed'].includes(appt.status) && (
                  <button onClick={() => updateStatus(appt.id, 'no_show')} style={{ ...styles.actionBtn, background: '#fee2e2', color: '#dc2626' }}>No Show</button>
                )}
                <button onClick={() => { const reason = prompt('Cancellation reason (optional):'); updateStatus(appt.id, 'cancelled', reason); }} style={{ ...styles.actionBtn, background: '#fee2e2', color: '#dc2626' }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ===================== NEW APPOINTMENT WIZARD =====================
  const renderWizard = () => (
    <div style={styles.wizardContainer}>
      <h3 style={styles.wizardTitle}>New Appointment</h3>

      {/* Step indicators */}
      <div style={styles.stepIndicators}>
        {['Patient', 'Service', 'Date/Time', 'Confirm'].map((label, i) => (
          <div key={label} style={{ ...styles.stepDot, ...(wizardStep >= i ? styles.stepDotActive : {}) }}>
            <div style={styles.stepDotNum}>{i + 1}</div>
            <div style={styles.stepDotLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Step 0: Patient */}
      {wizardStep === 0 && (
        <div>
          {!isWalkIn ? (
            <>
              <input
                type="text"
                placeholder="Search patient name..."
                value={patientSearch}
                onChange={e => searchPatients(e.target.value)}
                style={styles.input}
              />
              {searchingPatients && <p style={styles.searchHint}>Searching...</p>}
              {patientResults.length > 0 && (
                <div style={styles.searchResults}>
                  {patientResults.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedPatient(p); setWizardStep(1); setPatientResults([]); }}
                      style={styles.searchResult}
                    >
                      <span style={{ fontWeight: '500' }}>{p.name}</span>
                      {p.phone && <span style={{ fontSize: '12px', color: '#888' }}> — {p.phone}</span>}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setIsWalkIn(true)} style={{ ...styles.linkBtn, marginTop: '12px' }}>
                + Walk-in (new patient)
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Patient name"
                value={walkInName}
                onChange={e => setWalkInName(e.target.value)}
                style={{ ...styles.input, marginBottom: '8px' }}
              />
              <input
                type="tel"
                placeholder="Phone number (optional)"
                value={walkInPhone}
                onChange={e => setWalkInPhone(e.target.value)}
                style={styles.input}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => { if (walkInName.trim()) setWizardStep(1); }}
                  disabled={!walkInName.trim()}
                  style={{ ...styles.primaryBtn, opacity: walkInName.trim() ? 1 : 0.5 }}
                >
                  Next
                </button>
                <button onClick={() => { setIsWalkIn(false); setWalkInName(''); setWalkInPhone(''); }} style={styles.linkBtn}>
                  Back to search
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 1: Service */}
      {wizardStep === 1 && (
        <div>
          <p style={styles.wizardLabel}>
            Patient: <strong>{isWalkIn ? walkInName : selectedPatient?.name}</strong>
          </p>

          {/* Service category groups */}
          <div style={styles.serviceGroups}>
            {Object.keys(APPOINTMENT_SERVICES).map(group => (
              <button
                key={group}
                onClick={() => setSelectedServiceGroup(selectedServiceGroup === group ? null : group)}
                style={{
                  ...styles.serviceGroupBtn,
                  ...(selectedServiceGroup === group ? styles.serviceGroupBtnActive : {}),
                }}
              >
                {group}
              </button>
            ))}
          </div>

          {selectedServiceGroup && (
            <div style={styles.serviceList}>
              {APPOINTMENT_SERVICES[selectedServiceGroup].map(svc => (
                <div
                  key={svc.name}
                  onClick={() => { setSelectedService(svc); setWizardStep(2); }}
                  style={{
                    ...styles.serviceItem,
                    ...(selectedService?.name === svc.name ? { background: '#e0e7ff', borderColor: '#3730a3' } : {}),
                  }}
                >
                  <span style={{ fontWeight: '500' }}>{svc.name}</span>
                  <span style={{ fontSize: '12px', color: '#888' }}>{svc.duration} min</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setWizardStep(0)} style={{ ...styles.linkBtn, marginTop: '12px' }}>← Back</button>
        </div>
      )}

      {/* Step 2: Date/Time */}
      {wizardStep === 2 && (
        <div>
          <p style={styles.wizardLabel}>
            {selectedService?.name} — {selectedService?.duration} min
          </p>
          <div style={{ marginBottom: '12px' }}>
            <label style={styles.fieldLabel}>Date</label>
            <input
              type="date"
              value={apptDate}
              onChange={e => setApptDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={styles.fieldLabel}>Time</label>
            <div style={styles.timeGrid}>
              {generateTimeSlots().map(time => (
                <button
                  key={time}
                  onClick={() => setApptTime(time)}
                  style={{
                    ...styles.timeSlot,
                    ...(apptTime === time ? styles.timeSlotActive : {}),
                  }}
                >
                  {formatTimeLabel(time)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={styles.fieldLabel}>Notes (optional)</label>
            <textarea
              value={apptNotes}
              onChange={e => setApptNotes(e.target.value)}
              placeholder="Any notes..."
              style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setWizardStep(3)}
              disabled={!apptDate || !apptTime}
              style={{ ...styles.primaryBtn, opacity: (apptDate && apptTime) ? 1 : 0.5 }}
            >
              Next
            </button>
            <button onClick={() => setWizardStep(1)} style={styles.linkBtn}>← Back</button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {wizardStep === 3 && (
        <div>
          <div style={styles.confirmCard}>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Patient</span>
              <span>{isWalkIn ? walkInName : selectedPatient?.name}</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Service</span>
              <span>{selectedService?.name}</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Duration</span>
              <span>{selectedService?.duration} min</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Date</span>
              <span>{new Date(apptDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Time</span>
              <span>{formatTimeLabel(apptTime)}</span>
            </div>
            {apptNotes && (
              <div style={styles.confirmRow}>
                <span style={styles.confirmLabel}>Notes</span>
                <span>{apptNotes}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={createAppointment}
              disabled={creating}
              style={{ ...styles.primaryBtn, background: '#16A34A', opacity: creating ? 0.7 : 1 }}
            >
              {creating ? 'Creating...' : 'Book Appointment'}
            </button>
            <button onClick={() => setWizardStep(2)} style={styles.linkBtn}>← Back</button>
          </div>
        </div>
      )}

      {/* Reset link */}
      {wizardStep > 0 && !preselectedPatient && (
        <button onClick={resetWizard} style={{ ...styles.linkBtn, marginTop: '16px', fontSize: '12px', color: '#888' }}>
          Start over
        </button>
      )}
    </div>
  );

  // ===================== MAIN RENDER =====================
  return (
    <div style={styles.container}>
      {/* Left Panel — Wizard */}
      <div style={styles.leftPanel}>
        {renderWizard()}
      </div>

      {/* Right Panel — Calendar */}
      <div style={styles.rightPanel}>
        {/* View toggle + navigation */}
        <div style={styles.calHeader}>
          <div style={styles.viewToggle}>
            {['day', 'week', 'month'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  ...styles.viewBtn,
                  ...(viewMode === mode ? styles.viewBtnActive : {}),
                }}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <div style={styles.navRow}>
            <button onClick={() => navigate(-1)} style={styles.navBtn}>&lt;</button>
            <button onClick={goToday} style={styles.todayBtn}>Today</button>
            <button onClick={() => navigate(1)} style={styles.navBtn}>&gt;</button>
            <span style={styles.dateLabel}>
              {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {viewMode === 'week' && (() => {
                const ws = getWeekStart(currentDate);
                const we = new Date(ws); we.setDate(we.getDate() + 6);
                return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
              })()}
              {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Calendar content */}
        <div style={styles.calBody}>
          {loading && <div style={styles.loadingOverlay}>Loading...</div>}
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
        </div>
      </div>

      {/* Detail popover */}
      {renderDetailPopover()}
    </div>
  );
}

// ===================== Utility Functions =====================
function formatDateISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatTimeLabel(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getWeekStart(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function generateTimeSlots() {
  const slots = [];
  for (let h = 8; h <= 17; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  slots.push('18:00');
  return slots;
}

// ===================== Styles =====================
const styles = {
  container: {
    display: 'flex',
    gap: '0',
    minHeight: '700px',
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e5e5',
  },
  leftPanel: {
    width: '38%',
    minWidth: '320px',
    borderRight: '1px solid #e5e5e5',
    padding: '20px',
    overflowY: 'auto',
    maxHeight: '800px',
    background: '#fafafa',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  calHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e5e5',
    background: '#fff',
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
    marginBottom: '12px',
  },
  viewBtn: {
    padding: '6px 16px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '500',
    color: '#666',
  },
  viewBtnActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000',
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navBtn: {
    width: '32px',
    height: '32px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtn: {
    padding: '6px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  dateLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: '8px',
  },
  calBody: {
    flex: 1,
    overflow: 'auto',
    position: 'relative',
    maxHeight: '680px',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255,255,255,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#888',
    zIndex: 10,
  },
  // Day view
  dayGrid: {
    position: 'relative',
    minHeight: `${11 * 60}px`,
    paddingLeft: '70px',
  },
  hourRow: {
    height: '60px',
    display: 'flex',
    borderBottom: '1px solid #f0f0f0',
  },
  hourLabel: {
    position: 'absolute',
    left: '0',
    width: '65px',
    textAlign: 'right',
    paddingRight: '8px',
    fontSize: '12px',
    color: '#888',
    transform: 'translateY(-8px)',
  },
  hourCell: {
    flex: 1,
  },
  apptBlock: {
    position: 'absolute',
    left: '75px',
    right: '10px',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    overflow: 'hidden',
    zIndex: 5,
    transition: 'box-shadow 0.15s',
  },
  apptBlockName: {
    fontWeight: '600',
    fontSize: '13px',
    lineHeight: '1.2',
  },
  apptBlockService: {
    fontSize: '11px',
    opacity: 0.8,
    marginTop: '1px',
  },
  apptBlockTime: {
    fontSize: '11px',
    opacity: 0.7,
    marginTop: '1px',
  },
  timeLine: {
    position: 'absolute',
    left: '70px',
    right: '0',
    height: '2px',
    background: '#dc2626',
    zIndex: 8,
  },
  // Week view
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    minHeight: '500px',
  },
  weekDay: {
    borderRight: '1px solid #f0f0f0',
    minHeight: '400px',
  },
  weekDayToday: {
    background: '#fafafa',
  },
  weekDayHeader: {
    padding: '10px 8px',
    textAlign: 'center',
    borderBottom: '1px solid #f0f0f0',
    background: '#fff',
  },
  weekDayHeaderToday: {
    background: '#000',
    color: '#fff',
  },
  weekDayName: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    display: 'block',
  },
  weekDayNum: {
    fontSize: '18px',
    fontWeight: '600',
    display: 'block',
    marginTop: '2px',
  },
  weekDayBody: {
    padding: '4px',
  },
  weekApptCard: {
    padding: '6px 8px',
    borderRadius: '4px',
    marginBottom: '4px',
    cursor: 'pointer',
  },
  // Month view
  monthHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid #e5e5e5',
  },
  monthDayHeader: {
    padding: '8px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#888',
  },
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
  },
  monthCell: {
    minHeight: '80px',
    borderRight: '1px solid #f5f5f5',
    borderBottom: '1px solid #f5f5f5',
    padding: '4px',
    textAlign: 'center',
  },
  monthCellToday: {
    background: '#fafafa',
  },
  monthCellNum: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '4px',
  },
  // Popover
  popoverOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  popover: {
    background: '#fff',
    borderRadius: '12px',
    width: '420px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
  },
  popoverHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e5e5',
  },
  closeBtn: {
    border: 'none',
    background: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#888',
    padding: '0 4px',
  },
  popoverBody: {
    padding: '16px 20px',
  },
  popoverRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '14px',
    borderBottom: '1px solid #f5f5f5',
  },
  popoverLabel: {
    color: '#888',
    fontSize: '13px',
  },
  popoverValue: {
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'right',
  },
  actionBtn: {
    padding: '6px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    background: '#fff',
  },
  // Wizard
  wizardContainer: {
    padding: '0',
  },
  wizardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#1a1a1a',
  },
  stepIndicators: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  stepDot: {
    flex: 1,
    textAlign: 'center',
    opacity: 0.4,
  },
  stepDotActive: {
    opacity: 1,
  },
  stepDotNum: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#e5e5e5',
    color: '#666',
    fontSize: '12px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  stepDotLabel: {
    fontSize: '10px',
    color: '#666',
    fontWeight: '500',
  },
  wizardLabel: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '12px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  searchHint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  },
  searchResults: {
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    marginTop: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  searchResult: {
    padding: '10px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #f5f5f5',
    fontSize: '14px',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#1e40af',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '0',
    fontWeight: '500',
  },
  primaryBtn: {
    padding: '10px 20px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '6px',
  },
  serviceGroups: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '12px',
  },
  serviceGroupBtn: {
    padding: '6px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '16px',
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '500',
    color: '#555',
  },
  serviceGroupBtnActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000',
  },
  serviceList: {
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  serviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid #f5f5f5',
    cursor: 'pointer',
    fontSize: '13px',
  },
  timeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '6px',
  },
  timeSlot: {
    padding: '8px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  timeSlotActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000',
  },
  confirmCard: {
    background: '#f9fafb',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #e5e5e5',
  },
  confirmRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '14px',
    borderBottom: '1px solid #f0f0f0',
  },
  confirmLabel: {
    color: '#888',
    fontSize: '13px',
  },
};
