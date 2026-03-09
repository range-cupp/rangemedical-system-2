// /components/CalendarView.js
// Native appointment calendar — Range Medical
// Day / Week / Month views with new appointment wizard
// Replaces BookingTab in Command Center

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCategoryStyle } from '../lib/protocol-config';
import { APPOINTMENT_SERVICES, getAllServices, PROVIDERS, LOCATIONS, DEFAULT_LOCATION, LOCATION_ENABLED_CATEGORIES, REQUIRED_FORMS } from '../lib/appointment-services';

// Form display names + consent_type normalization (inlined to avoid importing server-only form-bundles.js)
const FORM_NAMES = {
  'intake': 'Medical Intake', 'hipaa': 'HIPAA', 'blood-draw': 'Blood Draw Consent',
  'hrt': 'HRT Consent', 'peptide': 'Peptide Consent', 'iv': 'IV/Injection Consent',
  'hbot': 'HBOT Consent', 'weight-loss': 'Weight Loss Consent', 'red-light': 'Red Light Consent',
  'prp': 'PRP Consent', 'exosome-iv': 'Exosome IV Consent',
};
const CONSENT_TYPE_TO_FORM_ID = {
  'hipaa': 'hipaa', 'blood_draw': 'blood-draw', 'blood-draw': 'blood-draw',
  'hrt': 'hrt', 'peptide': 'peptide', 'iv': 'iv', 'iv_injection': 'iv',
  'hbot': 'hbot', 'weight_loss': 'weight-loss', 'weight-loss': 'weight-loss',
  'red_light': 'red-light', 'red-light': 'red-light', 'prp': 'prp',
  'exosome_iv': 'exosome-iv', 'exosome-iv': 'exosome-iv',
};
import { getRenewalStatus } from '../lib/protocol-tracking';
import { formatPhone } from '../lib/format-utils';

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

const STATUS_BORDER_COLORS = {
  scheduled: '#3b82f6',
  confirmed: '#22c55e',
  checked_in: '#f59e0b',
  in_progress: '#6366f1',
  completed: '#16a34a',
  cancelled: '#ef4444',
  no_show: '#ef4444',
  rescheduled: '#9ca3af',
};

// Map appointment service_category → service-log category for session logging
const APPT_CATEGORY_TO_SERVICE_LOG = {
  rlt: 'red_light',
  hbot: 'hbot',
  iv: 'iv_therapy',
  injection: 'vitamin',
  hrt: 'testosterone',
  weight_loss: 'weight_loss',
  peptide: 'peptide',
};
// Session-based categories that show "Log Session" in popover
const SESSION_BASED_CATEGORIES = ['rlt', 'hbot', 'iv', 'injection'];

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9 AM to 6 PM

export default function CalendarView({ preselectedPatient = null }) {
  // Calendar state
  const [viewMode, setViewMode] = useState('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const popoverRef = useRef(null);

  // New appointment wizard state
  const [wizardStep, setWizardStep] = useState(0); // 0=patient, 1=service, 2=location(IV only), 3=provider, 4=datetime, 5=confirm
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceGroup, setSelectedServiceGroup] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptNotes, setApptNotes] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [creating, setCreating] = useState(false);
  const [panelType, setPanelType] = useState(null); // 'essential' | 'elite' for New Patient Blood Draw
  const [useCustomTime, setUseCustomTime] = useState(false); // Override Cal.com availability

  // Cal.com availability state
  const [eventTypesMap, setEventTypesMap] = useState({}); // slug → { id, hosts }
  const [providerSchedules, setProviderSchedules] = useState({}); // username → { newport: { monday: [{start,end}], ... }, locations: { placentia: { monday: [{start,end}] } } }
  const [availableSlots, setAvailableSlots] = useState(null); // null = not loaded, [] = no slots, [...] = available
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Reschedule state
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Patient contact info for appointment detail
  const [apptPatientInfo, setApptPatientInfo] = useState(null);
  const [loadingPatientInfo, setLoadingPatientInfo] = useState(false);

  // Session logging from appointment
  const [loggingSession, setLoggingSession] = useState(false);
  const [sessionLogResult, setSessionLogResult] = useState(null);

  // Patient slide-out drawer (stores full API response)
  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Renewal tracking for patients with appointments
  const [renewalMap, setRenewalMap] = useState({}); // patient_id -> [renewals]

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

  // Fetch renewals for patients with appointments
  useEffect(() => {
    if (appointments.length === 0) { setRenewalMap({}); return; }
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

  // Fetch patient contact info when appointment detail opens
  useEffect(() => {
    if (!selectedAppt?.patient_id) {
      setApptPatientInfo(null);
      setSessionLogResult(null);
      return;
    }
    setSessionLogResult(null);
    let cancelled = false;
    setLoadingPatientInfo(true);
    fetch(`/api/patients/${selectedAppt.patient_id}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setApptPatientInfo({
            ...(data.patient || data),
            consents: data.consents || [],
            intakes: data.intakes || [],
            activeProtocols: data.activeProtocols || [],
          });
          setLoadingPatientInfo(false);
        }
      })
      .catch(() => { if (!cancelled) setLoadingPatientInfo(false); });
    return () => { cancelled = true; };
  }, [selectedAppt?.patient_id]);

  // Open patient drawer from appointment detail
  const openPatientDrawer = (patientId) => {
    if (!patientId) return;
    setDrawerLoading(true);
    setDrawerData(null);
    fetch(`/api/patients/${patientId}`)
      .then(r => r.json())
      .then(data => {
        setDrawerData(data);
        setDrawerLoading(false);
      })
      .catch(() => setDrawerLoading(false));
  };

  const closeDrawer = () => { setDrawerData(null); setDrawerLoading(false); };

  // Fetch Cal.com event types + provider schedules once on mount
  useEffect(() => {
    fetch('/api/bookings/event-types')
      .then(r => r.json())
      .then(data => {
        if (data.eventTypes) {
          const map = {};
          data.eventTypes.forEach(et => {
            map[et.slug] = { id: et.id, title: et.title, hosts: et.hosts || [] };
          });
          setEventTypesMap(map);
        }
      })
      .catch(err => console.error('Failed to load Cal.com event types:', err));

    fetch('/api/bookings/provider-schedules')
      .then(r => r.json())
      .then(data => {
        if (data.schedules) setProviderSchedules(data.schedules);
      })
      .catch(err => console.error('Failed to load provider schedules:', err));
  }, []);

  // Resolve the Cal.com event type for the current service + location
  // Placentia has separate event types (e.g., 'range-iv-placentia') so we try the
  // location-specific slug first, then fall back to the base slug.
  const resolveEventType = useCallback((slug) => {
    if (!slug) return null;
    if (selectedLocation?.id === 'placentia') {
      const placentiaSlug = `${slug}-placentia`;
      if (eventTypesMap[placentiaSlug]) return { ...eventTypesMap[placentiaSlug], slug: placentiaSlug };
    }
    return eventTypesMap[slug] ? { ...eventTypesMap[slug], slug } : null;
  }, [eventTypesMap, selectedLocation?.id]);

  // Check if a time slot falls within a provider's schedule hours for a given day
  // Accepts explicit provider username and location for per-provider column rendering
  const isSlotInSchedule = useCallback((timeStr, dayOfWeek, provUsername, locationId) => {
    if (!provUsername || !providerSchedules[provUsername]) {
      return true; // No schedule data → allow all (don't block)
    }

    const schedule = providerSchedules[provUsername];
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];

    // Use location-specific schedule when applicable, fall back to newport (default)
    let dayHours;
    if (locationId === 'placentia' && schedule.locations?.placentia?.[dayName]) {
      dayHours = schedule.locations.placentia[dayName];
    } else {
      dayHours = schedule.newport?.[dayName];
    }

    if (!dayHours || dayHours.length === 0) return false; // Provider is off this day

    // Check if the slot time falls within any of the provider's hour blocks
    const [h, m] = timeStr.split(':').map(Number);
    const slotMinutes = h * 60 + m;

    return dayHours.some(block => {
      const [sh, sm] = block.start.split(':').map(Number);
      const [eh, em] = block.end.split(':').map(Number);
      return slotMinutes >= sh * 60 + sm && slotMinutes < eh * 60 + em;
    });
  }, [providerSchedules]);

  // Get slots for a specific provider from the combined Cal.com slots
  const getSlotsForProvider = useCallback((provUsername, locationId) => {
    if (!availableSlots || !apptDate) return [];
    const dateObj = new Date(apptDate + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    return availableSlots.filter(time => isSlotInSchedule(time, dayOfWeek, provUsername, locationId));
  }, [availableSlots, apptDate, isSlotInSchedule]);

  // Fetch available slots from Cal.com when date/service/location change
  // Stores COMBINED team slots — per-provider filtering happens in the render
  useEffect(() => {
    if (!apptDate || !selectedService?.calcomSlug) {
      setAvailableSlots(null);
      return;
    }

    const eventType = resolveEventType(selectedService.calcomSlug);
    if (!eventType) {
      setAvailableSlots(null);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    setAvailableSlots(null);
    setApptTime(''); // Reset selected time when date changes
    setSelectedProvider(null); // Reset provider when date changes

    const url = `/api/bookings/slots?eventTypeId=${eventType.id}&date=${apptDate}`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        // Parse slot data — Cal.com returns { slots: { "YYYY-MM-DD": [{ start, end }] } }
        // Only use slots for the requested date (Cal.com sometimes returns nearby dates).
        const daySlots = data.slots || {};
        const slotTimes = [];
        const requestedDaySlots = daySlots[apptDate] || [];

        if (Array.isArray(requestedDaySlots)) {
          requestedDaySlots.forEach(slot => {
            const startStr = typeof slot === 'string' ? slot : slot.start;
            if (startStr) {
              const d = new Date(startStr);
              const hours = d.getHours().toString().padStart(2, '0');
              const mins = d.getMinutes().toString().padStart(2, '0');
              slotTimes.push(`${hours}:${mins}`);
            }
          });
        }
        // De-duplicate (Cal.com can return overlapping slots for multiple hosts)
        const unique = [...new Set(slotTimes)].sort();
        setAvailableSlots(unique);
        setLoadingSlots(false);
      })
      .catch(err => {
        if (!cancelled) {
          console.error('Failed to fetch slots:', err);
          setAvailableSlots(null);
          setLoadingSlots(false);
        }
      });

    return () => { cancelled = true; };
  }, [apptDate, selectedService?.calcomSlug, eventTypesMap, resolveEventType]);

  // Pre-fill wizard if patient is preselected
  useEffect(() => {
    if (preselectedPatient) {
      setSelectedPatient(preselectedPatient);
      setWizardStep(1);
    }
  }, [preselectedPatient]);

  // Auto-select provider for single-provider categories (e.g., consultations → Dr. Burgess)
  useEffect(() => {
    if (wizardStep === 4 && selectedService && !selectedProvider) {
      const providers = PROVIDERS[selectedService.category] || PROVIDERS['other'] || [];
      if (providers.length === 1) {
        setSelectedProvider(providers[0]);
      }
    }
  }, [wizardStep, selectedService, selectedProvider]);

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
      const patientName = isWalkIn ? walkInName : selectedPatient?.name;
      const patientPhone = isWalkIn ? walkInPhone : selectedPatient?.phone;

      const calcomSlug = selectedService?.calcomSlug;
      const eventType = resolveEventType(calcomSlug);

      let res;

      if (eventType && selectedPatient?.id && !useCustomTime) {
        // Route through Cal.com for tracked services with a known patient
        // This blocks the slot in Cal.com and the webhook syncs to appointments table
        const hostInfo = eventType.hosts?.find(h => h.username === selectedProvider?.calcomUsername);

        // Build service details (e.g., panel type for blood draws)
        const serviceDetails = {};
        if (panelType) serviceDetails.panelType = panelType;

        const body = {
          eventTypeId: eventType.id,
          start: startDT.toISOString(),
          patientId: selectedPatient.id,
          patientName,
          patientEmail: selectedPatient.email || null,
          patientPhone: patientPhone || null,
          serviceName: selectedService.name,
          serviceSlug: eventType?.slug || calcomSlug,
          durationMinutes: duration,
          notes: apptNotes || null,
          hostUserId: hostInfo?.userId || null,
          hostName: selectedProvider?.label || selectedProvider?.name || null,
          serviceDetails: Object.keys(serviceDetails).length > 0 ? serviceDetails : null,
        };

        res = await fetch('/api/bookings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();

          // Also create in native appointments table for immediate calendar display
          // Webhook will upsert on cal_com_booking_id, so no duplicate
          await fetch('/api/appointments/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_id: selectedPatient.id,
              patient_name: patientName,
              patient_phone: patientPhone,
              service_name: selectedService.name,
              service_category: selectedService.category,
              provider: selectedProvider?.name || null,
              start_time: startDT.toISOString(),
              end_time: endDT.toISOString(),
              duration_minutes: duration,
              location: selectedLocation?.label || DEFAULT_LOCATION.label,
              notes: apptNotes || null,
              created_by: 'command_center',
              send_notification: sendNotification,
              cal_com_booking_id: String(data.calcom?.id || data.booking?.calcom_booking_id || ''),
              source: 'cal_com',
              service_details: Object.keys(serviceDetails).length > 0 ? serviceDetails : null,
            }),
          }).catch(err => console.error('Native appointment write error:', err));
        }
      } else {
        // Fallback: manual booking (no Cal.com event type or walk-in)
        const fallbackDetails = {};
        if (panelType) fallbackDetails.panelType = panelType;

        const body = {
          patient_id: selectedPatient?.id || null,
          patient_name: patientName,
          patient_phone: patientPhone,
          service_name: selectedService.name,
          service_category: selectedService.category,
          provider: selectedProvider?.name || null,
          start_time: startDT.toISOString(),
          end_time: endDT.toISOString(),
          duration_minutes: duration,
          location: selectedLocation?.label || DEFAULT_LOCATION.label,
          notes: apptNotes || null,
          created_by: 'command_center',
          send_notification: sendNotification,
          service_details: Object.keys(fallbackDetails).length > 0 ? fallbackDetails : null,
        };

        res = await fetch('/api/appointments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        resetWizard();
        setCurrentDate(startDT);
        setViewMode('day');
        fetchAppointments();
      } else {
        const err = await res.json();
        alert('Error: ' + (err.error || 'Could not create appointment'));
      }
    } catch (err) {
      console.error('Booking error:', err);
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
    setSelectedProvider(null);
    setSelectedLocation(DEFAULT_LOCATION);
    setApptDate('');
    setApptTime('');
    setApptNotes('');
    setSendNotification(true);
    setAvailableSlots(null);
    setLoadingSlots(false);
    setPanelType(null);
    setUseCustomTime(false);
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

  const deleteAppointment = async (apptId) => {
    if (!confirm('Delete this appointment? The patient will NOT be notified.')) return;
    try {
      const res = await fetch(`/api/appointments/${apptId}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedAppt(null);
        fetchAppointments();
      }
    } catch (err) {
      console.error('Delete appointment error:', err);
    }
  };

  // Log a session from the appointment popover — decrements the patient's protocol package
  const handleLogSessionFromAppt = async (appt, protocol) => {
    if (loggingSession) return;
    setLoggingSession(true);
    setSessionLogResult(null);
    try {
      const serviceLogCategory = APPT_CATEGORY_TO_SERVICE_LOG[appt.service_category];
      if (!serviceLogCategory) throw new Error('Unmapped service category: ' + appt.service_category);

      const logRes = await fetch('/api/service-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: appt.patient_id,
          category: serviceLogCategory,
          entry_type: 'session',
          entry_date: new Date().toISOString().split('T')[0],
          protocol_id: protocol.id,
          notes: `Logged from appointment: ${appt.service_name}`,
        }),
      });
      const logData = await logRes.json();
      if (!logData.success && !logRes.ok) throw new Error(logData.error || 'Failed to log session');

      // Update appointment status to completed
      await fetch(`/api/appointments/${appt.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      const newSessionsUsed = logData.package_update?.sessions_used || (protocol.sessions_used || 0) + 1;
      const totalSessions = protocol.total_sessions || 0;

      setSessionLogResult({
        success: true,
        sessions_used: newSessionsUsed,
        total_sessions: totalSessions,
        remaining: totalSessions - newSessionsUsed,
      });

      // Update protocols in local state
      setApptPatientInfo(prev => prev ? {
        ...prev,
        activeProtocols: (prev.activeProtocols || []).map(p =>
          p.id === protocol.id ? { ...p, sessions_used: newSessionsUsed } : p
        ),
      } : prev);

      // Update appointment status badge locally
      setSelectedAppt(prev => prev ? { ...prev, status: 'completed' } : prev);
      fetchAppointments();
    } catch (err) {
      console.error('Log session error:', err);
      setSessionLogResult({ success: false, error: err.message });
    } finally {
      setLoggingSession(false);
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
    const statusColor = STATUS_BORDER_COLORS[appt.status] || STATUS_BORDER_COLORS.scheduled;
    const isFaded = ['completed', 'cancelled', 'no_show', 'rescheduled'].includes(appt.status);
    return {
      background: cat.bg,
      color: cat.text,
      borderLeft: `4px solid ${statusColor}`,
      opacity: isFaded ? 0.55 : 1,
    };
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

  // Assign columns to overlapping appointments (Google Calendar-style)
  const assignColumns = (appts) => {
    if (!appts.length) return [];

    // Add timing metadata
    const items = appts.map(appt => {
      const start = new Date(appt.start_time);
      const startMin = start.getHours() * 60 + start.getMinutes();
      const endMin = startMin + (appt.duration_minutes || 30);
      return { appt, startMin, endMin };
    }).sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

    // Greedy column assignment: assign each appointment to the first available column
    const columns = []; // columns[col] = endMin of the last appointment in that column
    const result = [];

    for (const item of items) {
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        if (item.startMin >= columns[col]) {
          columns[col] = item.endMin;
          result.push({ ...item, column: col });
          placed = true;
          break;
        }
      }
      if (!placed) {
        result.push({ ...item, column: columns.length });
        columns.push(item.endMin);
      }
    }

    // Find the max columns for each overlap cluster
    // Two appointments are in the same cluster if there's any chain of overlaps connecting them
    const totalCols = columns.length;

    // For better width calculation, find the actual max columns each appointment overlaps with
    // by looking at what's concurrent at each point in time
    for (const item of result) {
      let maxConcurrent = 1;
      for (const other of result) {
        if (other === item) continue;
        // Check if they overlap in time
        if (other.startMin < item.endMin && other.endMin > item.startMin) {
          maxConcurrent++;
        }
      }
      // The total columns for this appointment is the max of its own column+1 and concurrent count
      item.totalColumns = Math.max(item.column + 1, maxConcurrent);
    }

    // Normalize: ensure all overlapping appointments agree on the same totalColumns
    // Do a pass where we set totalColumns to the max of any overlapping appointment
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of result) {
        for (const other of result) {
          if (other === item) continue;
          if (other.startMin < item.endMin && other.endMin > item.startMin) {
            const maxTC = Math.max(item.totalColumns, other.totalColumns);
            if (item.totalColumns !== maxTC) { item.totalColumns = maxTC; changed = true; }
            if (other.totalColumns !== maxTC) { other.totalColumns = maxTC; changed = true; }
          }
        }
      }
    }

    return result;
  };

  const renderDayView = () => {
    const dayAppts = appointments.filter(a =>
      formatDateISO(new Date(a.start_time)) === formatDateISO(currentDate)
    );
    const now = new Date();
    const showTimeLine = isToday(currentDate);

    // Calculate column layout for overlapping appointments
    const columnized = assignColumns(dayAppts);

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
        {columnized.map(({ appt, column, totalColumns }) => {
          const start = new Date(appt.start_time);
          const startHour = start.getHours() + start.getMinutes() / 60;
          const top = (startHour - 9) * 60;
          const height = Math.max(appt.duration_minutes || 30, 20);
          if (top < 0 || startHour > 18) return null;
          const catStyle = getApptStyle(appt);

          // Calculate horizontal position based on column
          const gridLeft = 75; // px after time labels
          const gridRight = 10;
          const colWidthPercent = 100 / totalColumns;
          const leftPercent = column * colWidthPercent;
          // Small gap between columns for visual separation
          const gapPx = totalColumns > 1 ? 2 : 0;

          return (
            <div
              key={appt.id}
              onClick={(e) => { e.stopPropagation(); setSelectedAppt(appt); }}
              style={{
                ...styles.apptBlock,
                ...catStyle,
                top: `${top}px`,
                height: `${height}px`,
                left: `calc(${gridLeft}px + (100% - ${gridLeft + gridRight}px) * ${leftPercent / 100} + ${gapPx}px)`,
                right: 'auto',
                width: `calc((100% - ${gridLeft + gridRight}px) * ${colWidthPercent / 100} - ${gapPx * 2}px)`,
              }}
            >
              <div style={{ ...styles.apptBlockName, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {appt.patient_name}
                {renewalMap[appt.patient_id]?.length > 0 && (
                  <span style={{
                    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: renewalMap[appt.patient_id].some(r => r.renewal_status === 'renewal_due') ? '#dc2626' : '#f59e0b',
                  }} />
                )}
              </div>
              {height >= 35 && <div style={styles.apptBlockService}>{appt.service_name}</div>}
              {height >= 50 && appt.provider && (
                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '1px' }}>{appt.provider}</div>
              )}
              {height >= 50 && appt.location && appt.location !== DEFAULT_LOCATION.label && (
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '1px' }}>📍 {LOCATIONS.find(l => l.label === appt.location)?.short || 'Placentia'}</div>
              )}
              {height >= 65 && (
                <div style={styles.apptBlockTime}>
                  {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                </div>
              )}
            </div>
          );
        })}
        {/* Current time line */}
        {showTimeLine && (() => {
          const nowHour = now.getHours() + now.getMinutes() / 60;
          if (nowHour < 9 || nowHour > 18) return null;
          const top = (nowHour - 9) * 60;
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
                    <div style={{ fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {appt.patient_name}
                      {renewalMap[appt.patient_id]?.length > 0 && (
                        <span style={{
                          display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                          background: renewalMap[appt.patient_id].some(r => r.renewal_status === 'renewal_due') ? '#dc2626' : '#f59e0b',
                        }} />
                      )}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>{appt.service_name}</div>
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>
                      {formatTime(appt.start_time)}
                      {appt.provider ? ` · ${appt.provider}` : ''}
                    </div>
                    {appt.location && appt.location !== DEFAULT_LOCATION.label && (
                      <div style={{ fontSize: '10px', opacity: 0.6 }}>📍 {LOCATIONS.find(l => l.label === appt.location)?.short || 'Placentia'}</div>
                    )}
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
              <span style={styles.popoverValue}>
                {appt.patient_id ? (
                  <button onClick={() => openPatientDrawer(appt.patient_id)}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#1e40af', fontWeight: '600', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                    {appt.patient_name}
                  </button>
                ) : appt.patient_name}
              </span>
            </div>
            {/* Patient contact info */}
            {appt.patient_id && (
              <div style={{ padding: '8px 0 4px', borderBottom: '1px solid #f0f0f0', marginBottom: '4px' }}>
                {loadingPatientInfo ? (
                  <span style={{ fontSize: '12px', color: '#999' }}>Loading contact info...</span>
                ) : apptPatientInfo ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {apptPatientInfo.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#888' }}>📱</span>
                        <a href={`tel:${apptPatientInfo.phone}`} style={{ fontSize: '13px', color: '#374151', textDecoration: 'none' }}>
                          {formatPhone(apptPatientInfo.phone)}
                        </a>
                      </div>
                    )}
                    {apptPatientInfo.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#888' }}>✉️</span>
                        <a href={`mailto:${apptPatientInfo.email}`} style={{ fontSize: '13px', color: '#374151', textDecoration: 'none' }}>
                          {apptPatientInfo.email}
                        </a>
                      </div>
                    )}
                    {!apptPatientInfo.phone && !apptPatientInfo.email && (
                      <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>No contact info on file</span>
                    )}
                  </div>
                ) : null}
              </div>
            )}
            <div style={styles.popoverRow}>
              <span style={styles.popoverLabel}>Service</span>
              <span style={styles.popoverValue}>{appt.service_name}</span>
            </div>
            {appt.provider && (
              <div style={styles.popoverRow}>
                <span style={styles.popoverLabel}>Provider</span>
                <span style={styles.popoverValue}>{appt.provider}</span>
              </div>
            )}
            {appt.location && (
              <div style={styles.popoverRow}>
                <span style={styles.popoverLabel}>Location</span>
                <span style={styles.popoverValue}>📍 {appt.location}</span>
              </div>
            )}
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

            {/* Forms / Consent checklist */}
            {apptPatientInfo && (() => {
              const requiredFormIds = REQUIRED_FORMS[appt.service_category] || REQUIRED_FORMS['other'] || ['intake', 'hipaa'];
              const completedConsentFormIds = new Set(
                (apptPatientInfo.consents || []).map(c => CONSENT_TYPE_TO_FORM_ID[c.consent_type] || c.consent_type)
              );
              const hasIntake = (apptPatientInfo.intakes || []).length > 0;
              const formChecks = requiredFormIds.map(formId => {
                if (formId === 'intake') return { formId, name: 'Medical Intake', done: hasIntake };
                return { formId, name: FORM_NAMES[formId] || formId, done: completedConsentFormIds.has(formId) };
              });
              const allDone = formChecks.every(f => f.done);
              const missingCount = formChecks.filter(f => !f.done).length;
              return (
                <div style={{
                  margin: '12px 0',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: allDone ? '#f0fdf4' : '#fefce8',
                  border: `1px solid ${allDone ? '#bbf7d0' : '#fde68a'}`,
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: allDone ? '#166534' : '#92400e', marginBottom: '6px' }}>
                    {allDone ? 'All forms complete' : `${missingCount} missing form${missingCount > 1 ? 's' : ''}`}
                  </div>
                  {formChecks.map(f => (
                    <div key={f.formId} style={{ fontSize: '12px', color: f.done ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '11px' }}>{f.done ? '✓' : '✗'}</span>
                      <span>{f.name}</span>
                    </div>
                  ))}
                  {!allDone && appt.patient_id && (
                    <a href={`/admin/send-forms?patient_id=${appt.patient_id}`} style={{ fontSize: '11px', color: '#2563eb', marginTop: '6px', display: 'inline-block' }}>
                      Send Missing Forms →
                    </a>
                  )}
                </div>
              );
            })()}

            {/* Renewal alerts */}
            {renewalMap[appt.patient_id]?.length > 0 && (
              <div style={{
                margin: '12px 0',
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#fffbeb',
                border: '1px solid #fef3c7'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Protocol Renewals
                </div>
                {renewalMap[appt.patient_id].map((renewal, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 0',
                    borderTop: i > 0 ? '1px solid #fef3c7' : 'none'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>
                        {renewal.program_name || renewal.medication}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {renewal.tracking?.status_text}
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: renewal.renewal_urgency_color?.bg || '#fef3c7',
                      color: renewal.renewal_urgency_color?.text || '#92400e'
                    }}>
                      {renewal.renewal_label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Package / Session tracking */}
            {apptPatientInfo?.activeProtocols && (() => {
              const matchingProtocol = (apptPatientInfo.activeProtocols || []).find(p => {
                if (p.category === appt.service_category) return true;
                const pt = (p.program_type || '').toLowerCase();
                const slCat = APPT_CATEGORY_TO_SERVICE_LOG[appt.service_category];
                if (slCat === 'red_light' && pt === 'red_light') return true;
                if (slCat === 'hbot' && pt === 'hbot') return true;
                if (slCat === 'iv_therapy' && (pt === 'iv_therapy' || pt === 'iv')) return true;
                if (slCat === 'vitamin' && (pt === 'vitamin' || pt === 'injection')) return true;
                return false;
              });
              if (!matchingProtocol || !matchingProtocol.total_sessions) return null;

              const sessionsUsed = sessionLogResult?.success ? sessionLogResult.sessions_used : (matchingProtocol.sessions_used || 0);
              const totalSessions = matchingProtocol.total_sessions;
              const remaining = totalSessions - sessionsUsed;
              const pct = Math.min(100, Math.round((sessionsUsed / totalSessions) * 100));
              const isExhausted = remaining <= 0;
              const isCompleted = appt.status === 'completed';
              const showLogButton = SESSION_BASED_CATEGORIES.includes(appt.service_category) && !isCompleted && !isExhausted && !sessionLogResult?.success;

              return (
                <div style={{
                  margin: '12px 0', padding: '10px 12px', borderRadius: '8px',
                  background: isExhausted ? '#fef2f2' : '#f0f9ff',
                  border: `1px solid ${isExhausted ? '#fecaca' : '#bae6fd'}`,
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: isExhausted ? '#991b1b' : '#0369a1', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {matchingProtocol.program_name || appt.service_name} Package
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>
                      {sessionsUsed}/{totalSessions} sessions used
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: isExhausted ? '#dc2626' : remaining <= 3 ? '#d97706' : '#059669' }}>
                      {isExhausted ? 'Package exhausted' : `${remaining} remaining`}
                    </span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: isExhausted ? '#dc2626' : pct >= 80 ? '#d97706' : '#0ea5e9', borderRadius: '4px', transition: 'width 0.3s' }} />
                  </div>
                  {sessionLogResult?.success && (
                    <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600, padding: '6px 0' }}>
                      Session logged. {sessionLogResult.remaining} remaining.
                    </div>
                  )}
                  {sessionLogResult && !sessionLogResult.success && (
                    <div style={{ fontSize: '12px', color: '#dc2626', padding: '6px 0' }}>
                      Error: {sessionLogResult.error}
                    </div>
                  )}
                  {showLogButton && (
                    <button
                      onClick={() => handleLogSessionFromAppt(appt, matchingProtocol)}
                      disabled={loggingSession}
                      style={{
                        width: '100%', padding: '8px 0', background: loggingSession ? '#93c5fd' : '#1e40af',
                        color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                        cursor: loggingSession ? 'wait' : 'pointer',
                      }}
                    >
                      {loggingSession ? 'Logging Session...' : `Log Session (${sessionsUsed + 1}/${totalSessions})`}
                    </button>
                  )}
                </div>
              );
            })()}

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

            {/* Delete button — always visible, no notification sent */}
            <div style={{ marginTop: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
              <button onClick={() => deleteAppointment(appt.id)} style={{ ...styles.actionBtn, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '12px' }}>Delete (No Notification)</button>
            </div>
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
        {(() => {
          const needsLocation = selectedService && LOCATION_ENABLED_CATEGORIES.includes(selectedService.category);
          const steps = needsLocation
            ? ['Patient', 'Service', 'Location', 'Provider', 'Date/Time', 'Confirm']
            : ['Patient', 'Service', 'Provider', 'Date/Time', 'Confirm'];
          // Map display index to actual wizard step for highlighting
          return steps.map((label, i) => {
            const activeIdx = needsLocation ? i : (i >= 2 ? i + 1 : i); // skip step 2 for non-IV
            return (
              <div key={label} style={{ ...styles.stepDot, ...(wizardStep >= activeIdx ? styles.stepDotActive : {}) }}>
                <div style={styles.stepDotNum}>{i + 1}</div>
                <div style={styles.stepDotLabel}>{label}</div>
              </div>
            );
          });
        })()}
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
                  onClick={() => {
                    setSelectedService(svc);
                    setSelectedProvider(null);
                    setPanelType(null);
                    // Blood draws need panel selection before advancing
                    if (svc.calcomSlug === 'new-patient-blood-draw') return;
                    // If service supports location selection, go to location step
                    if (LOCATION_ENABLED_CATEGORIES.includes(svc.category)) {
                      setSelectedLocation(DEFAULT_LOCATION);
                      setWizardStep(2);
                    } else {
                      // Skip provider step — go straight to date/time with per-provider columns
                      setSelectedLocation(DEFAULT_LOCATION);
                      setWizardStep(4);
                    }
                  }}
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

          {/* Panel type selector for New Patient Blood Draw */}
          {selectedService?.calcomSlug === 'new-patient-blood-draw' && (
            <div style={{ marginTop: '12px' }}>
              <label style={styles.fieldLabel}>Lab Panel</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { key: 'essential', label: 'Essential Panel', price: '$350' },
                  { key: 'elite', label: 'Elite Panel', price: '$750' },
                ].map(panel => (
                  <button
                    key={panel.key}
                    onClick={() => {
                      setPanelType(panel.key);
                      setSelectedLocation(DEFAULT_LOCATION);
                      setWizardStep(4);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: panelType === panel.key ? '2px solid #000' : '1px solid #e5e5e5',
                      borderRadius: '8px',
                      background: panelType === panel.key ? '#000' : '#fff',
                      color: panelType === panel.key ? '#fff' : '#111',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      fontWeight: '500',
                      textAlign: 'center',
                    }}
                  >
                    <div>{panel.label}</div>
                    <div style={{ fontSize: '12px', fontWeight: '400', marginTop: '2px', opacity: 0.7 }}>{panel.price}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setWizardStep(0)} style={{ ...styles.linkBtn, marginTop: '12px' }}>← Back</button>
        </div>
      )}

      {/* Step 2: Location (IV only) */}
      {wizardStep === 2 && (
        <div>
          <p style={styles.wizardLabel}>
            {selectedService?.name} — {selectedService?.duration} min
          </p>
          <label style={styles.fieldLabel}>Select Location</label>
          <div style={styles.serviceList}>
            {LOCATIONS.map(loc => (
              <div
                key={loc.id}
                onClick={() => {
                  setSelectedLocation(loc);
                  setSelectedProvider(null);
                  setWizardStep(4); // Skip provider step — per-provider columns shown in date/time
                }}
                style={{
                  ...styles.serviceItem,
                  ...(selectedLocation?.id === loc.id ? { background: '#e0e7ff', borderColor: '#3730a3' } : {}),
                }}
              >
                <span style={{ fontWeight: '500' }}>📍 {loc.short}</span>
                <span style={{ fontSize: '12px', color: '#888' }}>{loc.address}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { setWizardStep(1); setSelectedLocation(DEFAULT_LOCATION); }} style={{ ...styles.linkBtn, marginTop: '12px' }}>← Back</button>
        </div>
      )}

      {/* Step 3: Provider */}
      {wizardStep === 3 && (
        <div>
          <p style={styles.wizardLabel}>
            {selectedService?.name} — {selectedService?.duration} min
            {selectedLocation && selectedLocation.id !== 'newport' && (
              <span style={{ fontSize: '12px', color: '#6b7280' }}> · 📍 {selectedLocation.short}</span>
            )}
          </p>
          <label style={styles.fieldLabel}>Select Provider</label>
          <div style={styles.serviceList}>
            {(PROVIDERS[selectedService?.category] || PROVIDERS['other'] || []).map(prov => (
              <div
                key={prov.name}
                onClick={() => { setSelectedProvider(prov); setWizardStep(4); }}
                style={{
                  ...styles.serviceItem,
                  ...(selectedProvider?.name === prov.name ? { background: '#e0e7ff', borderColor: '#3730a3' } : {}),
                }}
              >
                <span style={{ fontWeight: '500' }}>{prov.label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => {
            const needsLocation = LOCATION_ENABLED_CATEGORIES.includes(selectedService?.category);
            setWizardStep(needsLocation ? 2 : 1);
            setSelectedProvider(null);
          }} style={{ ...styles.linkBtn, marginTop: '12px' }}>← Back</button>
        </div>
      )}

      {/* Step 4: Date + Provider Availability */}
      {wizardStep === 4 && (() => {
        const hasCalcom = !!selectedService?.calcomSlug && resolveEventType(selectedService.calcomSlug);
        const providers = PROVIDERS[selectedService?.category] || PROVIDERS['other'] || [];
        const locationId = selectedLocation?.id || 'newport';

        return (
          <div>
            <p style={styles.wizardLabel}>
              {selectedService?.name} — {selectedService?.duration} min
              {selectedLocation && selectedLocation.id !== 'newport' && (
                <span style={{ fontSize: '12px', color: '#6b7280' }}> · 📍 {selectedLocation.short}</span>
              )}
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={styles.fieldLabel}>Date</label>
              <input
                type="date"
                value={apptDate}
                onChange={e => { setApptDate(e.target.value); setApptTime(''); setSelectedProvider(null); }}
                style={styles.input}
              />
            </div>

            {/* Loading state */}
            {loadingSlots && apptDate && hasCalcom && (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                Checking availability...
              </div>
            )}

            {/* Per-provider availability columns (Cal.com services) */}
            {!loadingSlots && hasCalcom && apptDate && availableSlots && !useCustomTime && (
              <div>
                <label style={styles.fieldLabel}>
                  Pick a time
                  <span style={{ fontWeight: 400, color: '#16a34a', marginLeft: '8px', fontSize: '11px' }}>
                    Live availability
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                  {providers.map(prov => {
                    const provSlots = getSlotsForProvider(prov.calcomUsername, locationId);
                    const isSelected = selectedProvider?.name === prov.name;
                    return (
                      <div key={prov.name} style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          padding: '8px',
                          background: isSelected ? '#000' : '#f3f4f6',
                          color: isSelected ? '#fff' : '#111',
                          borderRadius: '8px 8px 0 0',
                          fontSize: '13px',
                          fontWeight: '600',
                          textAlign: 'center',
                        }}>
                          {prov.label}
                          <div style={{ fontSize: '11px', fontWeight: '400', opacity: 0.7, marginTop: '1px' }}>
                            {provSlots.length > 0 ? `${provSlots.length} slot${provSlots.length > 1 ? 's' : ''}` : 'Off'}
                          </div>
                        </div>
                        <div style={{
                          border: isSelected ? '2px solid #000' : '1px solid #e5e5e5',
                          borderTop: 'none',
                          borderRadius: '0 0 8px 8px',
                          padding: '6px',
                          minHeight: '80px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}>
                          {provSlots.length === 0 && (
                            <div style={{ padding: '12px 4px', color: '#aaa', fontSize: '11px', textAlign: 'center' }}>
                              No availability
                            </div>
                          )}
                          {provSlots.map(time => {
                            const active = apptTime === time && selectedProvider?.name === prov.name;
                            return (
                              <button
                                key={time}
                                onClick={() => { setSelectedProvider(prov); setApptTime(time); }}
                                style={{
                                  padding: '7px 4px',
                                  border: active ? '2px solid #000' : '1px solid #e5e5e5',
                                  borderRadius: '6px',
                                  background: active ? '#000' : '#fff',
                                  color: active ? '#fff' : '#111',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  fontWeight: active ? '600' : '400',
                                }}
                              >
                                {formatTimeLabel(time)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Selected summary */}
                {selectedProvider && apptTime && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '8px', fontSize: '13px', color: '#166534' }}>
                    ✓ {formatTimeLabel(apptTime)} with <strong>{selectedProvider.label}</strong>
                  </div>
                )}
              </div>
            )}

            {/* No availability for any provider */}
            {!loadingSlots && hasCalcom && apptDate && availableSlots && availableSlots.length === 0 && !useCustomTime && (
              <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', color: '#92400e', fontSize: '13px', textAlign: 'center' }}>
                No availability on this date. Try a different date or use custom time below.
              </div>
            )}

            {/* Custom time toggle link — always visible for Cal.com services when date is selected */}
            {hasCalcom && apptDate && !useCustomTime && !loadingSlots && (
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <button
                  onClick={() => { setUseCustomTime(true); setApptTime(''); setSelectedProvider(providers.length === 1 ? providers[0] : selectedProvider); }}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', padding: '4px' }}
                >
                  Use custom time (override availability)
                </button>
              </div>
            )}

            {/* Custom time entry (bypasses Cal.com availability) */}
            {hasCalcom && useCustomTime && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={styles.fieldLabel}>Custom Time</label>
                  <button
                    onClick={() => { setUseCustomTime(false); setApptTime(''); }}
                    style={{ background: 'none', border: 'none', color: '#666', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    ← Back to available slots
                  </button>
                </div>
                {providers.length > 1 && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={styles.fieldLabel}>Provider</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {providers.map(prov => (
                        <button
                          key={prov.name}
                          onClick={() => setSelectedProvider(prov)}
                          style={{
                            padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                            border: selectedProvider?.name === prov.name ? '2px solid #000' : '1px solid #e5e5e5',
                            background: selectedProvider?.name === prov.name ? '#000' : '#fff',
                            color: selectedProvider?.name === prov.name ? '#fff' : '#111',
                          }}
                        >
                          {prov.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <input
                  type="time"
                  value={apptTime}
                  onChange={e => setApptTime(e.target.value)}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', width: '160px' }}
                />
                <p style={{ fontSize: '11px', color: '#92400e', marginTop: '6px', marginBottom: 0 }}>
                  This will override availability and may double-book the provider.
                </p>
                {selectedProvider && apptTime && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: '#fefce8', borderRadius: '8px', fontSize: '13px', color: '#854d0e' }}>
                    ✓ {formatTimeLabel(apptTime)} with <strong>{selectedProvider.label}</strong> (custom)
                  </div>
                )}
              </div>
            )}

            {/* Prompt to select date first (Cal.com services) */}
            {hasCalcom && !apptDate && !loadingSlots && (
              <div style={{ padding: '16px 0', color: '#888', fontSize: '13px', textAlign: 'center' }}>
                Select a date to see provider availability
              </div>
            )}

            {/* Static fallback (no Cal.com slug — e.g., telemedicine, phone) */}
            {!hasCalcom && (
              <div>
                {providers.length > 1 && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={styles.fieldLabel}>Provider</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {providers.map(prov => (
                        <button
                          key={prov.name}
                          onClick={() => setSelectedProvider(prov)}
                          style={{
                            padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                            border: selectedProvider?.name === prov.name ? '2px solid #000' : '1px solid #e5e5e5',
                            background: selectedProvider?.name === prov.name ? '#000' : '#fff',
                            color: selectedProvider?.name === prov.name ? '#fff' : '#111',
                          }}
                        >
                          {prov.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
              </div>
            )}

            <div style={{ marginBottom: '12px', marginTop: '12px' }}>
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
                onClick={() => setWizardStep(5)}
                disabled={!apptDate || !apptTime || (hasCalcom && !selectedProvider)}
                style={{ ...styles.primaryBtn, opacity: (apptDate && apptTime && (!hasCalcom || selectedProvider)) ? 1 : 0.5 }}
              >
                Next
              </button>
              <button onClick={() => {
                const needsLocation = LOCATION_ENABLED_CATEGORIES.includes(selectedService?.category);
                setWizardStep(needsLocation ? 2 : 1);
              }} style={styles.linkBtn}>← Back</button>
            </div>
          </div>
        );
      })()}

      {/* Step 5: Confirm */}
      {wizardStep === 5 && (
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
            {panelType && (
              <div style={styles.confirmRow}>
                <span style={styles.confirmLabel}>Lab Panel</span>
                <span>{panelType === 'elite' ? 'Elite Panel ($750)' : 'Essential Panel ($350)'}</span>
              </div>
            )}
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Provider</span>
              <span>{selectedProvider?.label || 'N/A'}</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Duration</span>
              <span>{selectedService?.duration} min</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Location</span>
              <span>📍 {selectedLocation?.short || 'Newport Beach'}</span>
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

          {/* Notification toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', cursor: 'pointer', fontSize: '13px', color: '#555' }}>
            <input
              type="checkbox"
              checked={sendNotification}
              onChange={e => setSendNotification(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#000' }}
            />
            Send confirmation to patient (email & text)
          </label>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={createAppointment}
              disabled={creating}
              style={{ ...styles.primaryBtn, background: '#16A34A', opacity: creating ? 0.7 : 1 }}
            >
              {creating ? 'Creating...' : 'Book Appointment'}
            </button>
            <button onClick={() => setWizardStep(4)} style={styles.linkBtn}>← Back</button>
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
    <div style={styles.container} className="cal-container">
      {/* Left Panel — Wizard */}
      <div style={styles.leftPanel} className="cal-left">
        {renderWizard()}
      </div>

      {/* Right Panel — Calendar */}
      <div style={styles.rightPanel} className="cal-right">
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
        <div style={styles.calBody} className="cal-body">
          {loading && <div style={styles.loadingOverlay}>Loading...</div>}
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
        </div>
      </div>

      {/* Detail popover */}
      {renderDetailPopover()}

      {/* Patient slide-out drawer */}
      {(drawerData || drawerLoading) && (() => {
        const pt = drawerData?.patient;
        const activeProtos = drawerData?.activeProtocols || [];
        const completedProtos = drawerData?.completedProtocols || [];
        const logs = drawerData?.serviceLogs || [];
        const appts = drawerData?.appointments || [];
        const labs = drawerData?.labs || [];
        const docs = drawerData?.medicalDocuments || [];
        const consents = drawerData?.consents || [];
        const notes = drawerData?.notes || [];
        const stats = drawerData?.stats || {};
        const upcomingAppts = appts.filter(a => new Date(a.start_time) >= new Date());
        const pastAppts = appts.filter(a => new Date(a.start_time) < new Date());

        const sectionHead = { margin: '0 0 10px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' };
        const card = { background: '#f9fafb', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' };

        return (
          <>
            <div onClick={closeDrawer} style={{
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
                      style={{ fontSize: '12px', color: '#fff', textDecoration: 'none', padding: '4px 12px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px' }}>
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
                    {/* Demographics row */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '13px', color: '#666' }}>
                        {pt.date_of_birth && (
                          <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px' }}>
                            DOB: {new Date(pt.date_of_birth + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        {pt.gender && <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px' }}>{pt.gender}</span>}
                        {pt.created_at && (
                          <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px' }}>
                            Since {new Date(pt.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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
                    </div>

                    {/* Active Protocols */}
                    <div style={card}>
                      <h4 style={sectionHead}>Active Protocols ({activeProtos.length})</h4>
                      {activeProtos.length > 0 ? activeProtos.map((proto, i) => {
                        const total = proto.total_sessions || proto.duration_days || 0;
                        const used = proto.sessions_used || 0;
                        const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                        const renewal = getRenewalStatus({ ...proto, status: 'active' });
                        return (
                          <div key={proto.id || i} style={{ padding: '10px 0', borderBottom: i < activeProtos.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>{proto.program_name || proto.medication || 'Protocol'}</div>
                                {renewal.renewal_label && (
                                  <span style={{
                                    fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px',
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
                            {/* Progress bar */}
                            {total > 0 && (
                              <div style={{ marginTop: '6px', background: '#e5e7eb', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#16a34a' : '#1e40af', borderRadius: '4px', transition: 'width 0.3s' }} />
                              </div>
                            )}
                            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                              Started {new Date(proto.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {proto.frequency ? ` · ${proto.frequency}` : ''}
                            </div>
                          </div>
                        );
                      }) : <span style={{ fontSize: '13px', color: '#bbb' }}>No active protocols</span>}
                    </div>

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
                    {upcomingAppts.length > 0 && (
                      <div style={card}>
                        <h4 style={sectionHead}>Upcoming Appointments ({upcomingAppts.length})</h4>
                        {upcomingAppts.slice(0, 4).map((apt, i) => (
                          <div key={apt.id || i} style={{ padding: '8px 0', borderBottom: i < Math.min(upcomingAppts.length, 4) - 1 ? '1px solid #e5e7eb' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>{apt.service_name || apt.title || 'Appointment'}</span>
                              <span style={{ fontSize: '12px', padding: '1px 6px', borderRadius: '4px', background: STATUS_LABELS[apt.status]?.bg || '#f3f4f6', color: STATUS_LABELS[apt.status]?.text || '#333' }}>
                                {STATUS_LABELS[apt.status]?.label || apt.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                              {new Date(apt.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(apt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              {apt.provider ? ` · ${apt.provider}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recent Visits / Service Logs */}
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
                            {new Date(log.entry_date || log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                    {pastAppts.length > 0 && (
                      <div style={card}>
                        <h4 style={sectionHead}>Past Appointments ({pastAppts.length})</h4>
                        {pastAppts.slice(0, 6).map((apt, i) => (
                          <div key={apt.id || i} style={{ padding: '6px 0', borderBottom: i < Math.min(pastAppts.length, 6) - 1 ? '1px solid #e5e7eb' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <span style={{ fontSize: '13px', color: '#555' }}>{apt.service_name || apt.title || 'Appointment'}</span>
                              {apt.provider && <span style={{ fontSize: '11px', color: '#aaa' }}> · {apt.provider}</span>}
                            </div>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                              {new Date(apt.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

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
                              {new Date(note.note_date || note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {note.source && <> · {note.source}</>}
                            </div>
                            <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.4', maxHeight: '60px', overflow: 'hidden' }}>
                              {note.body}
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

      <style jsx>{`
        @media (max-width: 768px) {
          .cal-container {
            flex-direction: column !important;
            min-height: auto !important;
          }
          .cal-left {
            width: 100% !important;
            min-width: 0 !important;
            max-height: none !important;
            border-right: none !important;
            border-bottom: 1px solid #e5e5e5 !important;
            padding: 16px !important;
          }
          .cal-right {
            width: 100% !important;
          }
          .cal-body {
            max-height: none !important;
          }
        }
      `}</style>
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
  for (let h = 9; h <= 17; h++) {
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
    minHeight: `${10 * 60}px`,
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
