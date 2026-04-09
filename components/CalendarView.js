// /components/CalendarView.js
// Native appointment calendar — Range Medical
// Day / Week / Month views with new appointment wizard
// Replaces BookingTab in Command Center

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getCategoryStyle, CATEGORY_COLORS } from '../lib/protocol-config';
import { overlayClickProps } from './AdminLayout';
import { APPOINTMENT_SERVICES, getAllServices, PROVIDERS, LOCATIONS, DEFAULT_LOCATION, LOCATION_ENABLED_CATEGORIES, REQUIRED_FORMS } from '../lib/appointment-services';
import EncounterModal from './EncounterModal';
import MedicationCheckoutModal from './MedicationCheckoutModal';
import { useAuth } from './AuthProvider';

// Form display names + consent_type normalization (inlined to avoid importing server-only form-bundles.js)
const FORM_NAMES = {
  'intake': 'Medical Intake', 'hipaa': 'HIPAA', 'blood-draw': 'Blood Draw Consent',
  'hrt': 'HRT Consent', 'peptide': 'Peptide Consent', 'iv': 'IV/Injection Consent',
  'hbot': 'HBOT Consent', 'weight-loss': 'Weight Loss Consent', 'red-light': 'Red Light Consent',
  'prp': 'PRP Consent', 'exosome-iv': 'Exosome IV Consent',
};
const CONSENT_TYPE_TO_FORM_ID = {
  'hipaa': 'hipaa', 'blood_draw': 'blood-draw', 'blood-draw': 'blood-draw',
  'hrt': 'hrt', 'peptide': 'peptide', 'iv': 'iv', 'iv_injection': 'iv', 'iv-injection': 'iv',
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

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM
const HOUR_HEIGHT = 80; // pixels per hour in day view

export default function CalendarView({ preselectedPatient = null, wizardOnly = false }) {
  const { session, employee } = useAuth();
  const [encounterAppt, setEncounterAppt] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutPatient, setCheckoutPatient] = useState(null);

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
  const [selectedService, setSelectedService] = useState(null);     // primary service (drives Cal.com/location/provider)
  const [selectedServices, setSelectedServices] = useState([]);      // all selected services for multi-service appointments
  const [selectedServiceGroup, setSelectedServiceGroup] = useState(null);
  const [serviceSearch, setServiceSearch] = useState('');            // search filter for Step 1
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProviders, setSelectedProviders] = useState({});   // multi-service: { serviceName → providerObj }
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptNotes, setApptNotes] = useState('');
  const [visitReason, setVisitReason] = useState('');
  const [modality, setModality] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [creating, setCreating] = useState(false);
  const [panelType, setPanelType] = useState(null); // 'essential' | 'elite' for New Patient Blood Draw
  const [useCustomTime, setUseCustomTime] = useState(false); // Override Cal.com availability
  const [bookingConfirmed, setBookingConfirmed] = useState(null); // { patientName, services, provider, date, time, location } after success

  // Cal.com availability state
  const [eventTypesMap, setEventTypesMap] = useState({}); // slug → { id, hosts }
  const [providerSchedules, setProviderSchedules] = useState({}); // username → { newport: { monday: [{start,end}], ... }, locations: { placentia: { monday: [{start,end}] } } }
  const [availableSlots, setAvailableSlots] = useState(null); // null = not loaded, [] = no slots, [...] = available
  const [loadingSlots, setLoadingSlots] = useState(false);
  // Multi-service availability: fetched per-service slots (null = no cal.com, [] = none available, [...] = slots)
  const [multiServiceSlots, setMultiServiceSlots] = useState({}); // { svcName: string[] | null }
  const [loadingMultiSlots, setLoadingMultiSlots] = useState(false);

  // Reschedule state
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Appointment notes editing
  const [editingApptNotes, setEditingApptNotes] = useState(null); // appt id being edited
  const [apptNotesValue, setApptNotesValue] = useState('');
  const [savingApptNotes, setSavingApptNotes] = useState(false);

  // Change service type
  const [changingServiceAppt, setChangingServiceAppt] = useState(null);
  const [savingServiceChange, setSavingServiceChange] = useState(false);

  // Patient contact info for appointment detail
  const [apptPatientInfo, setApptPatientInfo] = useState(null);
  const [loadingPatientInfo, setLoadingPatientInfo] = useState(false);

  // Session logging from appointment
  const [loggingSession, setLoggingSession] = useState(false);
  const [sessionLogResult, setSessionLogResult] = useState(null);

  // Patient slide-out drawer (stores full API response)
  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerSmsText, setDrawerSmsText] = useState('');
  const [drawerSmsSending, setDrawerSmsSending] = useState(false);
  const [drawerSmsStatus, setDrawerSmsStatus] = useState(null);

  // Prep checklist state (inline in appointment card)
  const [prepSaving, setPrepSaving] = useState({});
  const [prepNotes, setPrepNotes] = useState('');
  const [sendingForms, setSendingForms] = useState(false);
  const [sendFormsStatus, setSendFormsStatus] = useState(null);

  const sendMissingFormsInline = async (appt, missingFormIds) => {
    if (!appt?.patient_id || !missingFormIds?.length) return;
    const phone = apptPatientInfo?.phone || appt.attendee_phone;
    if (!phone) {
      setSendFormsStatus({ ok: false, msg: 'No phone number on file' });
      return;
    }
    const digits = String(phone).replace(/\D/g, '');
    const normalizedPhone = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    const firstName = (appt.patient_name || appt.attendee_name || '').trim().split(/\s+/)[0] || null;
    setSendingForms(true);
    setSendFormsStatus(null);
    try {
      const res = await fetch('/api/send-forms-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          firstName,
          formIds: missingFormIds,
          patientId: appt.patient_id,
          patientName: appt.patient_name || appt.attendee_name || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setSendFormsStatus({ ok: true, msg: data.twoStep ? 'Opt-in sent — forms deliver on reply' : `${missingFormIds.length} form${missingFormIds.length > 1 ? 's' : ''} sent via SMS` });
    } catch (err) {
      setSendFormsStatus({ ok: false, msg: err.message });
    } finally {
      setSendingForms(false);
    }
  };

  // Medical intake panel toggle
  const [showIntakePanel, setShowIntakePanel] = useState(false);
  const [prepNotesSaved, setPrepNotesSaved] = useState(false);
  const [prepNotesTimer, setPrepNotesTimer] = useState(null);

  // Provider Briefing side panel
  const [showPrepPanel, setShowPrepPanel] = useState(false);
  const [prepBriefing, setPrepBriefing] = useState(null);
  const [loadingPrepBriefing, setLoadingPrepBriefing] = useState(false);

  // Photo ID viewer state
  const [photoIdViewer, setPhotoIdViewer] = useState(null); // { url, title }

  // Lab documents for print
  const [labDocs, setLabDocs] = useState(null); // null = not loaded, [] = none
  const [loadingLabDocs, setLoadingLabDocs] = useState(false);

  // Renewal tracking for patients with appointments
  const [renewalMap, setRenewalMap] = useState({}); // patient_id -> [renewals]

  // Schedule blocks for calendar overlay
  const [calendarBlocks, setCalendarBlocks] = useState([]);

  // Employee calendar view toggle
  const [calendarMode, setCalendarMode] = useState('service'); // 'service' or 'employee'
  const [employees, setEmployees] = useState([]);

  // Encounter note status for appointment badges
  const [noteStatusMap, setNoteStatusMap] = useState({}); // appointment_id -> { hasNote, status }

  // Collapsible wizard panel
  const [wizardCollapsed, setWizardCollapsed] = useState(true);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let startDate, endDate;
      // Get Pacific timezone offset for correct UTC comparison
      const tzOffset = getPacificOffset(currentDate);
      if (viewMode === 'day') {
        startDate = formatDateISO(currentDate) + 'T00:00:00' + tzOffset;
        endDate = formatDateISO(currentDate) + 'T23:59:59' + tzOffset;
      } else if (viewMode === 'week') {
        const weekStart = getWeekStart(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        startDate = formatDateISO(weekStart) + 'T00:00:00' + tzOffset;
        endDate = formatDateISO(weekEnd) + 'T23:59:59' + tzOffset;
      } else {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        startDate = formatDateISO(monthStart) + 'T00:00:00' + tzOffset;
        endDate = formatDateISO(monthEnd) + 'T23:59:59' + tzOffset;
      }

      const res = await fetch(`/api/appointments/list?start_date=${startDate}&end_date=${endDate}`);
      const data = await res.json();
      const active = (data.appointments || []).filter(a => a.status !== 'cancelled' && a.status !== 'rescheduled' && a.status !== 'no_show');
      setAppointments(active);
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

  // Fetch encounter note status for all visible appointments
  useEffect(() => {
    if (appointments.length === 0) { setNoteStatusMap({}); return; }
    const apptIds = appointments.map(a => a.id).filter(Boolean);
    if (apptIds.length === 0) return;

    fetch(`/api/notes/status-batch?appointment_ids=${apptIds.join(',')}`)
      .then(r => r.json())
      .then(data => setNoteStatusMap(data.noteStatus || {}))
      .catch(err => console.error('Note status fetch error:', err));
  }, [appointments]);

  // Fetch schedule blocks for calendar overlays
  useEffect(() => {
    let startDate, endDate;
    if (viewMode === 'day') {
      startDate = formatDateISO(currentDate);
      endDate = startDate;
    } else if (viewMode === 'week') {
      const ws = getWeekStart(currentDate);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      startDate = formatDateISO(ws);
      endDate = formatDateISO(we);
    } else {
      const ms = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const me = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      startDate = formatDateISO(ms);
      endDate = formatDateISO(me);
    }
    fetch(`/api/schedule-blocks?start_date=${startDate}&end_date=${endDate}`)
      .then(r => r.json())
      .then(d => setCalendarBlocks(d.blocks || []))
      .catch(() => setCalendarBlocks([]));
  }, [viewMode, currentDate]);

  // Fetch employees for employee calendar view
  useEffect(() => {
    if (calendarMode !== 'employee') return;
    fetch('/api/admin/employees?basic=true')
      .then(r => r.json())
      .then(data => {
        // Filter to employees with calcom_user_id (active providers)
        const active = (data.employees || [])
          .filter(e => e.calcom_user_id && e.is_active !== false)
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setEmployees(active);
      })
      .catch(() => setEmployees([]));
  }, [calendarMode]);

  // Close popover on outside click — but ignore clicks while a stacked modal
  // (photo ID viewer, lab docs picker, patient drawer) is open above it.
  useEffect(() => {
    function handleClick(e) {
      // If a higher-level modal is open, let it handle its own dismissal.
      if (photoIdViewer || labDocs || drawerData || drawerLoading) return;
      // Ignore clicks that originate inside any stacked overlay element.
      if (e.target.closest && e.target.closest('[data-stacked-overlay="1"]')) return;
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setSelectedAppt(null);
        setRescheduleAppt(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [photoIdViewer, labDocs, drawerData, drawerLoading]);

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

  // Initialize prep notes when appointment selected
  useEffect(() => {
    if (selectedAppt) {
      setPrepNotes(selectedAppt.prep_notes || '');
      setPrepNotesSaved(false);
      setPrepSaving({});
      setShowIntakePanel(false);
      setShowPrepPanel(false);
      setPrepBriefing(null);
    }
  }, [selectedAppt?.id]);

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

  const closeDrawer = () => { setDrawerData(null); setDrawerLoading(false); setDrawerSmsText(''); setDrawerSmsStatus(null); };

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

  // Prep checklist functions (inline in appointment card)
  const togglePrepField = async (field) => {
    if (!selectedAppt) return;
    const newValue = !selectedAppt[field];
    setPrepSaving(prev => ({ ...prev, [field]: true }));
    try {
      const res = await fetch(`/api/appointments/${selectedAppt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update selectedAppt and the appointments list
        setSelectedAppt(prev => ({ ...prev, ...data.appointment }));
        setAppointments(prev => prev.map(a => a.id === selectedAppt.id ? { ...a, ...data.appointment } : a));
      }
    } catch (err) {
      console.error('Prep toggle error:', err);
    } finally {
      setPrepSaving(prev => ({ ...prev, [field]: false }));
    }
  };

  const savePrepNotes = async (text) => {
    if (!selectedAppt) return;
    try {
      const res = await fetch(`/api/appointments/${selectedAppt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prep_notes: text }),
      });
      if (res.ok) {
        setPrepNotesSaved(true);
        setTimeout(() => setPrepNotesSaved(false), 2000);
      }
    } catch (err) {
      console.error('Prep notes save error:', err);
    }
  };

  const handlePrepNotesChange = (e) => {
    const text = e.target.value;
    setPrepNotes(text);
    setPrepNotesSaved(false);
    if (prepNotesTimer) clearTimeout(prepNotesTimer);
    setPrepNotesTimer(setTimeout(() => savePrepNotes(text), 1000));
  };

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

  // Fetch per-service availability for multi-service bookings when date or step changes
  useEffect(() => {
    if (wizardStep !== 4 || selectedServices.length <= 1 || !apptDate) {
      setMultiServiceSlots({});
      return;
    }
    let cancelled = false;
    setLoadingMultiSlots(true);
    setApptTime('');

    const fetches = selectedServices.map(async svc => {
      if (!svc.calcomSlug) return [svc.name, null]; // null = no Cal.com constraint, any time OK
      const et = resolveEventType(svc.calcomSlug);
      if (!et) return [svc.name, null];
      try {
        const r = await fetch(`/api/bookings/slots?eventTypeId=${et.id}&date=${apptDate}`);
        const data = await r.json();
        const daySlots = data.slots?.[apptDate] || [];
        const times = [...new Set(
          (Array.isArray(daySlots) ? daySlots : []).map(slot => {
            const d = new Date(typeof slot === 'string' ? slot : slot.start);
            return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
          })
        )].sort();
        return [svc.name, times];
      } catch { return [svc.name, []]; }
    });

    Promise.all(fetches).then(results => {
      if (cancelled) return;
      setMultiServiceSlots(Object.fromEntries(results));
      setLoadingMultiSlots(false);
    });
    return () => { cancelled = true; };
  }, [wizardStep, apptDate, eventTypesMap, resolveEventType,
      // stringify service names so the effect re-runs if services change
      // eslint-disable-next-line react-hooks/exhaustive-deps
      selectedServices.map(s => s.name).join(',')]); // intentional non-standard dep

  // Compute valid start times for multi-service: times where every service's provider is available
  // at its staggered start (T + sum of preceding durations). Services without calcomSlug are unconstrained.
  const getValidMultiServiceTimes = useCallback(() => {
    if (selectedServices.length <= 1 || Object.keys(multiServiceSlots).length === 0) return [];
    const firstSvc = selectedServices[0];
    const firstSlots = multiServiceSlots[firstSvc.name];
    if (!firstSlots) return []; // still loading
    const candidates = firstSlots.length > 0 ? firstSlots : [];
    return candidates.filter(startTime => {
      const [sh, sm] = startTime.split(':').map(Number);
      let offsetMins = firstSvc.duration || 0;
      for (let i = 1; i < selectedServices.length; i++) {
        const svc = selectedServices[i];
        const svcSlots = multiServiceSlots[svc.name];
        if (svcSlots === undefined) return false; // still loading
        if (svcSlots !== null && svcSlots.length >= 0) { // has Cal.com constraint
          const totalMins = sh * 60 + sm + offsetMins;
          const svcTime = `${String(Math.floor(totalMins / 60)).padStart(2,'0')}:${String(totalMins % 60).padStart(2,'0')}`;
          if (svcSlots.length > 0 && !svcSlots.includes(svcTime)) return false;
          if (svcSlots.length === 0) return false; // provider has no slots at all
        }
        offsetMins += svc.duration || 0;
      }
      return true;
    });
  }, [selectedServices, multiServiceSlots]);

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
    // Multi-service: auto-assign providers where there's only one option
    if (wizardStep === 3 && selectedServices.length > 1) {
      setSelectedProviders(prev => {
        const next = { ...prev };
        let changed = false;
        selectedServices.forEach(svc => {
          if (!next[svc.name]) {
            const opts = PROVIDERS[svc.category] || PROVIDERS['other'] || [];
            if (opts.length === 1) { next[svc.name] = opts[0]; changed = true; }
          }
        });
        return changed ? next : prev;
      });
    }
  }, [wizardStep, selectedService, selectedProvider, selectedServices]);

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
      // Multi-service: sum durations; single-service: use service duration
      const allServices = selectedServices.length > 0 ? selectedServices : (selectedService ? [selectedService] : []);
      const duration = allServices.reduce((sum, s) => sum + (s.duration || 0), 0) || selectedService?.duration || 30;
      const endDT = new Date(startDT.getTime() + duration * 60000);
      const patientName = isWalkIn ? walkInName : selectedPatient?.name;
      const patientPhone = isWalkIn ? walkInPhone : selectedPatient?.phone;
      // Multi-service: display name is joined; single: use service name
      const displayServiceName = allServices.length > 1
        ? allServices.map(s => s.name).join(' + ')
        : (selectedService?.name || '');
      const servicesPayload = allServices.length > 1
        ? allServices.map(s => ({
            name: s.name,
            category: s.category,
            duration: s.duration,
            provider: selectedProviders[s.name]?.label || selectedProviders[s.name]?.name || null,
          }))
        : null;
      // For multi-service, the primary provider (for calendar display) is the first service's provider
      const primaryProviderName = allServices.length > 1
        ? (selectedProviders[allServices[0].name]?.label || selectedProviders[allServices[0].name]?.name || null)
        : (selectedProvider?.name || null);

      let res;

      if (allServices.length > 1 && selectedPatient?.id && !useCustomTime) {
        // ── Multi-service: book each service in Cal.com at its staggered start time ──
        // Each provider's calendar gets blocked separately; one DB record ties them together.
        const detailedServices = [];
        let offsetMins = 0;
        for (const svc of allServices) {
          const svcStart = new Date(startDT.getTime() + offsetMins * 60000);
          const svcProvider = selectedProviders[svc.name];
          let calcomBookingId = null;

          if (svc.calcomSlug) {
            const et = resolveEventType(svc.calcomSlug);
            if (et) {
              const hostInfo = et.hosts?.find(h => h.username === svcProvider?.calcomUsername);
              try {
                const calRes = await fetch('/api/bookings/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    eventTypeId: et.id,
                    start: svcStart.toISOString(),
                    patientId: selectedPatient.id,
                    patientName,
                    patientEmail: selectedPatient.email || null,
                    patientPhone: patientPhone || null,
                    serviceName: svc.name,
                    serviceSlug: et.slug || svc.calcomSlug,
                    durationMinutes: svc.duration,
                    notes: apptNotes || null,
                    hostUserId: hostInfo?.userId || null,
                    hostName: svcProvider?.label || svcProvider?.name || null,
                  }),
                });
                if (calRes.ok) {
                  const calData = await calRes.json();
                  calcomBookingId = String(calData.calcom?.id || calData.booking?.calcom_booking_id || '');
                } else {
                  console.error(`Cal.com booking failed for ${svc.name}:`, await calRes.text());
                }
              } catch (err) {
                console.error(`Cal.com booking error for ${svc.name}:`, err);
              }
            }
          }

          detailedServices.push({
            name: svc.name,
            category: svc.category,
            duration: svc.duration,
            provider: svcProvider?.label || svcProvider?.name || null,
            start_time: svcStart.toISOString(),
            calcom_booking_id: calcomBookingId,
          });
          offsetMins += svc.duration || 0;
        }

        // One DB appointment record covering the full multi-service block
        res = await fetch('/api/appointments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: selectedPatient.id,
            patient_name: patientName,
            patient_phone: patientPhone,
            service_name: displayServiceName,
            service_category: allServices[0].category,
            provider: primaryProviderName,
            start_time: startDT.toISOString(),
            end_time: endDT.toISOString(),
            duration_minutes: duration,
            location: selectedLocation?.label || DEFAULT_LOCATION.label,
            notes: apptNotes || null,
            created_by: employee?.name || session?.user?.email || 'Staff',
            visit_reason: visitReason.trim(),
            modality,
            send_notification: sendNotification,
            source: 'cal_com',
            services: detailedServices,
          }),
        });

      } else if (allServices.length === 1) {
        // ── Single-service: original Cal.com or manual path ──
        const calcomSlug = selectedService?.calcomSlug || null;
        const eventType = calcomSlug ? resolveEventType(calcomSlug) : null;

        if (eventType && selectedPatient?.id && !useCustomTime) {
          const hostInfo = eventType.hosts?.find(h => h.username === selectedProvider?.calcomUsername);
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
            await fetch('/api/appointments/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                patient_id: selectedPatient.id,
                patient_name: patientName,
                patient_phone: patientPhone,
                service_name: displayServiceName,
                service_category: selectedService.category,
                provider: primaryProviderName,
                start_time: startDT.toISOString(),
                end_time: endDT.toISOString(),
                duration_minutes: duration,
                location: selectedLocation?.label || DEFAULT_LOCATION.label,
                notes: apptNotes || null,
                created_by: employee?.name || session?.user?.email || 'Staff',
                visit_reason: visitReason.trim(),
                modality,
                send_notification: sendNotification,
                cal_com_booking_id: String(data.calcom?.id || data.booking?.calcom_booking_id || ''),
                source: 'cal_com',
                service_details: Object.keys(serviceDetails).length > 0 ? serviceDetails : null,
                services: servicesPayload,
              }),
            }).catch(err => console.error('Native appointment write error:', err));
          }
        } else {
          // Fallback: manual booking (no Cal.com, walk-in, or custom time)
          const fallbackDetails = {};
          if (panelType) fallbackDetails.panelType = panelType;
          res = await fetch('/api/appointments/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_id: selectedPatient?.id || null,
              patient_name: patientName,
              patient_phone: patientPhone,
              service_name: displayServiceName,
              service_category: selectedService.category,
              service_slug: selectedService.calcomSlug || null,
              provider: primaryProviderName,
              start_time: startDT.toISOString(),
              end_time: endDT.toISOString(),
              duration_minutes: duration,
              location: selectedLocation?.label || DEFAULT_LOCATION.label,
              notes: apptNotes || null,
              created_by: employee?.name || session?.user?.email || 'Staff',
              visit_reason: visitReason.trim(),
              modality,
              send_notification: sendNotification,
              service_details: Object.keys(fallbackDetails).length > 0 ? fallbackDetails : null,
              services: servicesPayload,
            }),
          });
        }
      } else {
        // Walk-in or no services edge case — manual fallback
        res = await fetch('/api/appointments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: selectedPatient?.id || null,
            patient_name: patientName,
            patient_phone: patientPhone,
            service_name: displayServiceName,
            service_category: selectedService?.category || 'other',
            service_slug: selectedService?.calcomSlug || null,
            provider: primaryProviderName,
            start_time: startDT.toISOString(),
            end_time: endDT.toISOString(),
            duration_minutes: duration,
            location: selectedLocation?.label || DEFAULT_LOCATION.label,
            notes: apptNotes || null,
            created_by: employee?.name || session?.user?.email || 'Staff',
            visit_reason: visitReason.trim(),
            modality,
            send_notification: sendNotification,
          }),
        });
      }

      if (res.ok) {
        // Snapshot details for the confirmation screen BEFORE resetting
        const allSvcs = selectedServices.length > 0 ? selectedServices : (selectedService ? [selectedService] : []);
        setBookingConfirmed({
          patientName: isWalkIn ? walkInName : selectedPatient?.name,
          services: allSvcs,
          providers: selectedServices.length > 1 ? selectedProviders : { [selectedService?.name]: selectedProvider },
          location: selectedLocation?.short || 'Newport Beach',
          date: new Date(apptDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' }),
          time: formatTimeLabel(apptTime),
          duration: allSvcs.reduce((s, x) => s + (x.duration || 0), 0) || selectedService?.duration,
          notificationSent: sendNotification,
        });
        if (!wizardOnly) {
          setCurrentDate(startDT);
          setViewMode('day');
        }
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
    setBookingConfirmed(null);
    setWizardStep(preselectedPatient ? 1 : 0);
    setSelectedPatient(preselectedPatient || null);
    setPatientSearch('');
    setPatientResults([]);
    setIsWalkIn(false);
    setWalkInName('');
    setWalkInPhone('');
    setSelectedService(null);
    setSelectedServices([]);
    setSelectedServiceGroup(null);
    setSelectedProvider(null);
    setSelectedProviders({});
    setServiceSearch('');
    setSelectedLocation(DEFAULT_LOCATION);
    setApptDate('');
    setApptTime('');
    setApptNotes('');
    setVisitReason('');
    setModality('');
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
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete appointment. Please try again.');
      }
    } catch (err) {
      console.error('Delete appointment error:', err);
      alert('Failed to delete appointment. Please try again.');
    }
  };

  const saveApptNotes = async (apptId) => {
    setSavingApptNotes(true);
    try {
      const res = await fetch('/api/appointments/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: apptId, table: 'appointments', notes: apptNotesValue }),
      });
      if (res.ok) {
        setEditingApptNotes(null);
        fetchAppointments();
      }
    } catch (err) {
      console.error('Save appointment notes error:', err);
    } finally {
      setSavingApptNotes(false);
    }
  };

  // Change appointment service type (no patient notification)
  const handleChangeServiceType = async (apptId, service) => {
    setSavingServiceChange(true);
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: service.name,
          service_category: service.category,
          duration_minutes: service.duration,
        }),
      });
      if (res.ok) {
        setChangingServiceAppt(null);
        fetchAppointments();
      }
    } catch (err) {
      console.error('Change service type error:', err);
    } finally {
      setSavingServiceChange(false);
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
      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '0', fontSize: '11px', fontWeight: '600', background: s.bg, color: s.text }}>
        {s.label}
      </span>
    );
  };

  // Smart name display — truncate to "First L." when card is narrow
  const displayName = (name, isNarrow) => {
    if (!name) return 'Unknown';
    if (!isNarrow) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 1) return name;
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };

  // Hovered appointment for expand-on-hover
  const [hoveredApptId, setHoveredApptId] = useState(null);

  // Note badge component
  const noteBadge = (apptId, size = 'small') => {
    const ns = noteStatusMap[apptId];
    const isSmall = size === 'small';
    if (ns?.hasNote) {
      // Note exists
      const isSigned = ns.status === 'signed';
      return (
        <span title={isSigned ? 'Note signed' : 'Note draft'} style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: isSmall ? '16px' : '20px', height: isSmall ? '16px' : '20px',
          borderRadius: '50%', flexShrink: 0, fontSize: isSmall ? '10px' : '12px',
          background: isSigned ? '#dcfce7' : '#fef3c7',
          color: isSigned ? '#16a34a' : '#92400e',
          fontWeight: '700', lineHeight: 1,
        }}>
          {isSigned ? '✓' : '●'}
        </span>
      );
    }
    // No note — show needs-note indicator
    return (
      <span title="Note needed" style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: isSmall ? '16px' : '20px', height: isSmall ? '16px' : '20px',
        borderRadius: '50%', flexShrink: 0, fontSize: isSmall ? '9px' : '11px',
        background: '#fee2e2', color: '#dc2626',
        fontWeight: '700', lineHeight: 1, border: '1.5px solid #fca5a5',
      }}>
        !
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
          const top = (startHour - 6) * HOUR_HEIGHT;
          const height = Math.max((appt.duration_minutes || 30) * (HOUR_HEIGHT / 60), 28);
          if (top < 0 || startHour > 20) return null;
          const catStyle = getApptStyle(appt);
          const isHovered = hoveredApptId === appt.id;

          // Calculate horizontal position based on column
          const gridLeft = 75; // px after time labels
          const gridRight = 10;
          const isNarrow = totalColumns >= 3;
          const colWidthPercent = 100 / totalColumns;
          const leftPercent = column * colWidthPercent;
          const gapPx = totalColumns > 1 ? 2 : 0;

          return (
            <div
              key={appt.id}
              onClick={(e) => { e.stopPropagation(); setSelectedAppt(appt); }}
              onMouseEnter={() => setHoveredApptId(appt.id)}
              onMouseLeave={() => setHoveredApptId(null)}
              style={{
                ...styles.apptBlock,
                ...catStyle,
                top: `${top}px`,
                height: isHovered ? 'auto' : `${height}px`,
                minHeight: `${height}px`,
                left: `calc(${gridLeft}px + (100% - ${gridLeft + gridRight}px) * ${leftPercent / 100} + ${gapPx}px)`,
                right: 'auto',
                width: isHovered && totalColumns > 1
                  ? `calc((100% - ${gridLeft + gridRight}px) * ${Math.min(colWidthPercent * 2, 60) / 100})`
                  : `calc((100% - ${gridLeft + gridRight}px) * ${colWidthPercent / 100} - ${gapPx * 2}px)`,
                zIndex: isHovered ? 100 : 5,
                boxShadow: isHovered ? '0 10px 40px rgba(0,0,0,0.7), 0 0 0 3px rgba(0,0,0,0.5)' : 'none',
                transition: 'box-shadow 0.15s, width 0.15s',
                ...(isHovered ? { opacity: 1, filter: 'none' } : {}),
              }}
            >
              <div style={{ ...styles.apptBlockName, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isHovered ? appt.patient_name : displayName(appt.patient_name, isNarrow)}
                </span>
                {noteBadge(appt.id)}
                {renewalMap[appt.patient_id]?.length > 0 && (
                  <span style={{
                    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: renewalMap[appt.patient_id].some(r => r.renewal_status === 'renewal_due') ? '#dc2626' : '#f59e0b',
                  }} />
                )}
              </div>
              {(height >= 40 || isHovered) && (
                <div style={styles.apptBlockService}>
                  {appt.service_name}
                  {appt.modality && appt.modality !== 'in_clinic' && (
                    <span style={{ marginLeft: '4px', opacity: 0.8 }}>
                      {appt.modality === 'phone' ? '📞' : '💻'}
                    </span>
                  )}
                </div>
              )}
              {(height >= 56 || isHovered) && appt.provider && (
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>{appt.provider}</div>
              )}
              {(height >= 56 || isHovered) && appt.location && appt.location !== DEFAULT_LOCATION.label && (
                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>📍 {LOCATIONS.find(l => l.label === appt.location)?.short || 'Placentia'}</div>
              )}
              {(height >= 72 || isHovered) && (
                <div style={styles.apptBlockTime}>
                  {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                </div>
              )}
            </div>
          );
        })}
        {/* Schedule block overlays */}
        {calendarBlocks
          .filter(b => b.date === formatDateISO(currentDate))
          .map(block => {
            if (block.block_type === 'full_day') {
              // Full day: overlay entire grid
              return (
                <div
                  key={block.id}
                  style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: '75px', right: '10px',
                    background: 'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(220,38,38,0.06) 10px, rgba(220,38,38,0.06) 20px)',
                    borderLeft: '3px solid #dc2626',
                    pointerEvents: 'none', zIndex: 1,
                  }}
                >
                  <div style={{
                    position: 'sticky', top: 8, fontSize: 11, fontWeight: 600,
                    color: '#dc2626', background: '#fee2e2', padding: '3px 8px',
                    borderRadius: 0, display: 'inline-block', marginLeft: 8, marginTop: 8,
                  }}>
                    {block.provider_name} — {block.reason || 'Day Off'}
                    {block.reason_note ? ` (${block.reason_note})` : ''}
                  </div>
                </div>
              );
            }
            // Time-range block
            if (block.start_time && block.end_time) {
              const [sh, sm] = block.start_time.split(':').map(Number);
              const [eh, em] = block.end_time.split(':').map(Number);
              const startH = sh + sm / 60;
              const endH = eh + em / 60;
              const bTop = (startH - 6) * HOUR_HEIGHT;
              const bHeight = (endH - startH) * HOUR_HEIGHT;
              if (bTop < 0 || startH > 20) return null;
              return (
                <div
                  key={block.id}
                  style={{
                    position: 'absolute',
                    top: `${bTop}px`, height: `${bHeight}px`,
                    left: '75px', right: '10px',
                    background: 'repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(220,38,38,0.08) 8px, rgba(220,38,38,0.08) 16px)',
                    borderLeft: '3px solid #dc2626',
                    pointerEvents: 'none', zIndex: 1,
                    borderRadius: 0,
                  }}
                >
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: '#dc2626',
                    background: '#fee2e2', padding: '2px 6px',
                    borderRadius: 0, display: 'inline-block', marginLeft: 6, marginTop: 2,
                  }}>
                    {block.provider_name} — {block.reason || 'Blocked'}
                  </div>
                </div>
              );
            }
            return null;
          })}
        {/* Current time line */}
        {showTimeLine && (() => {
          const nowHour = now.getHours() + now.getMinutes() / 60;
          if (nowHour < 6 || nowHour > 20) return null;
          const top = (nowHour - 6) * HOUR_HEIGHT;
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
                <span style={styles.weekDayName}>{day.toLocaleDateString('en-US', { weekday: 'short' , timeZone: 'America/Los_Angeles' })}</span>
                <span style={styles.weekDayNum}>{day.getDate()}</span>
              </div>
              <div style={styles.weekDayBody}>
                {/* Block indicators */}
                {calendarBlocks.filter(b => b.date === dayStr).length > 0 && (
                  <div style={{
                    fontSize: '10px', fontWeight: 600, color: '#dc2626',
                    background: '#fee2e2', padding: '2px 6px', borderRadius: 0,
                    marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                    {calendarBlocks.filter(b => b.date === dayStr).map(b => b.provider_name).filter((v, i, a) => a.indexOf(v) === i).join(', ')} blocked
                  </div>
                )}
                {dayAppts.map(appt => (
                  <div
                    key={appt.id}
                    onClick={() => { setSelectedAppt(appt); setCurrentDate(day); }}
                    style={{ ...styles.weekApptCard, ...getApptStyle(appt) }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {appt.patient_name}
                      {noteBadge(appt.id)}
                      {renewalMap[appt.patient_id]?.length > 0 && (
                        <span style={{
                          display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                          background: renewalMap[appt.patient_id].some(r => r.renewal_status === 'renewal_due') ? '#dc2626' : '#f59e0b',
                        }} />
                      )}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {appt.service_name}
                      {appt.modality && appt.modality !== 'in_clinic' && (
                        <span style={{ marginLeft: '3px' }}>
                          {appt.modality === 'phone' ? '📞' : '💻'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>
                      {formatTime(appt.start_time)}
                      {appt.provider ? ` · ${appt.provider}` : ''}
                    </div>
                    {appt.location && appt.location !== DEFAULT_LOCATION.label && (
                      <div style={{ fontSize: '11px', opacity: 0.6 }}>📍 {LOCATIONS.find(l => l.label === appt.location)?.short || 'Placentia'}</div>
                    )}
                  </div>
                ))}
                {dayAppts.length === 0 && calendarBlocks.filter(b => b.date === dayStr).length === 0 && (
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

            // Sort by start time for display
            const sortedAppts = [...dayAppts].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            const maxVisible = 3;
            const visibleAppts = sortedAppts.slice(0, maxVisible);
            const remaining = sortedAppts.length - maxVisible;

            return (
              <div
                key={dayStr}
                onClick={() => goToDate(day)}
                style={{ ...styles.monthCell, ...(today ? styles.monthCellToday : {}), cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ ...styles.monthCellNum, ...(today ? { color: '#fff', background: '#000', borderRadius: '50%', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } : {}), textAlign: 'center', marginBottom: '2px' }}>
                  {day.getDate()}
                </div>
                {visibleAppts.map(appt => {
                  const cs = getCategoryStyle(appt.service_category);
                  return (
                    <div
                      key={appt.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedAppt(appt); setCurrentDate(day); }}
                      style={{
                        fontSize: '11px',
                        padding: '1px 4px',
                        marginBottom: '1px',
                        borderRadius: '0',
                        background: cs.bg,
                        color: cs.text,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                        lineHeight: '1.4',
                      }}
                    >
                      <span style={{ fontWeight: '600' }}>{appt.patient_name?.split(' ')[0]}</span>
                      {noteBadge(appt.id)}
                      <span style={{ opacity: 0.7 }}> {formatTime(appt.start_time)}</span>
                    </div>
                  );
                })}
                {remaining > 0 && (
                  <div style={{ fontSize: '10px', color: '#888', paddingLeft: '4px', marginTop: '1px' }}>+{remaining} more</div>
                )}
                {calendarBlocks.filter(b => b.date === dayStr).length > 0 && (
                  <div style={{
                    fontSize: '10px', color: '#dc2626', fontWeight: 600,
                    padding: '0 4px', display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                    Blocked
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ===================== EMPLOYEE DAY VIEW =====================
  const renderEmployeeDayView = () => {
    const dayStr = formatDateISO(currentDate);
    const dayAppts = appointments.filter(a =>
      formatDateISO(new Date(a.start_time)) === dayStr
    );
    const dayBlocks = calendarBlocks.filter(b => b.date === dayStr);
    const now = new Date();
    const showTimeLine = isToday(currentDate);

    // Build columns — one per employee with calcom_user_id
    const cols = employees.length > 0 ? employees : [];

    if (cols.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
          No employees with Cal.com integration found.
        </div>
      );
    }

    const colWidth = `${100 / cols.length}%`;

    return (
      <div style={{ position: 'relative', minHeight: `${HOURS.length * HOUR_HEIGHT}px` }}>
        {/* Employee column headers */}
        <div style={{
          display: 'flex', borderBottom: '2px solid #e5e7eb',
          position: 'sticky', top: 0, background: '#fff', zIndex: 10,
          marginLeft: '75px',
        }}>
          {cols.map(emp => (
            <div key={emp.id} style={{
              width: colWidth, textAlign: 'center', padding: '10px 4px',
              fontWeight: 700, fontSize: 13, color: '#1a1a1a',
              borderRight: '1px solid #f3f4f6',
            }}>
              {emp.name?.split(' ')[0] || emp.name}
            </div>
          ))}
        </div>

        {/* Hour rows */}
        <div style={{ position: 'relative', minHeight: `${HOURS.length * HOUR_HEIGHT}px` }}>
          {HOURS.map(hour => (
            <div key={hour} style={styles.hourRow}>
              <div style={styles.hourLabel}>
                {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
              </div>
              <div style={{ ...styles.hourCell, display: 'flex' }}>
                {cols.map(emp => (
                  <div key={emp.id} style={{
                    width: colWidth, borderRight: '1px solid #f3f4f6', minHeight: `${HOUR_HEIGHT}px`,
                  }} />
                ))}
              </div>
            </div>
          ))}

          {/* Appointments per employee column */}
          {cols.map((emp, colIdx) => {
            const empName = emp.name?.toLowerCase();
            const empAppts = dayAppts.filter(a =>
              a.provider?.toLowerCase().includes(empName) ||
              a.provider?.toLowerCase().includes(emp.name?.split(' ')[0]?.toLowerCase())
            );
            const empBlocks = dayBlocks.filter(b =>
              b.provider_name?.toLowerCase().includes(empName) ||
              b.provider_id === emp.calcom_user_id
            );

            const colLeft = 75 + (colIdx * ((window?.innerWidth || 1200) - 75 - 10) / cols.length);

            return (
              <div key={emp.id}>
                {/* Block overlays for this employee */}
                {empBlocks.map(block => {
                  if (block.block_type === 'full_day') {
                    return (
                      <div key={`block-${block.id}`} style={{
                        position: 'absolute', top: 0, bottom: 0,
                        left: `calc(75px + (100% - 85px) * ${colIdx / cols.length})`,
                        width: `calc((100% - 85px) * ${1 / cols.length})`,
                        background: 'repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(220,38,38,0.07) 8px, rgba(220,38,38,0.07) 16px)',
                        borderLeft: '2px solid #dc2626',
                        pointerEvents: 'none', zIndex: 1,
                      }}>
                        <div style={{
                          fontSize: 10, fontWeight: 600, color: '#dc2626',
                          background: '#fee2e2', padding: '2px 6px', borderRadius: 0,
                          display: 'inline-block', marginLeft: 4, marginTop: 4,
                        }}>
                          {block.reason || 'Off'}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Appointments */}
                {empAppts.map(appt => {
                  const start = new Date(appt.start_time);
                  const startHour = start.getHours() + start.getMinutes() / 60;
                  const top = (startHour - 6) * HOUR_HEIGHT;
                  const height = Math.max((appt.duration_minutes || 30) * (HOUR_HEIGHT / 60), 28);
                  if (top < 0 || startHour > 20) return null;
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
                        left: `calc(75px + (100% - 85px) * ${colIdx / cols.length} + 3px)`,
                        width: `calc((100% - 85px) * ${1 / cols.length} - 6px)`,
                        right: 'auto',
                      }}
                    >
                      <div style={{ ...styles.apptBlockName, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {appt.patient_name}
                        {noteBadge(appt.id)}
                      </div>
                      {height >= 35 && (
                        <div style={styles.apptBlockService}>
                          {appt.service_name}
                          {appt.modality && appt.modality !== 'in_clinic' && (
                            <span style={{ marginLeft: '4px', opacity: 0.8 }}>
                              {appt.modality === 'phone' ? '📞' : '💻'}
                            </span>
                          )}
                        </div>
                      )}
                      {height >= 50 && (
                        <div style={styles.apptBlockTime}>
                          {formatTime(appt.start_time)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Current time line */}
          {showTimeLine && (() => {
            const nowHour = now.getHours() + now.getMinutes() / 60;
            if (nowHour < 6 || nowHour > 20) return null;
            const top = (nowHour - 6) * HOUR_HEIGHT;
            return <div style={{ ...styles.timeLine, top: `${top}px` }} />;
          })()}
        </div>
      </div>
    );
  };

  // ===================== APPOINTMENT DETAIL POPOVER =====================
  const renderDetailPopover = () => {
    if (!selectedAppt) return null;
    const appt = selectedAppt;

    return (
      <div style={styles.popoverOverlay} {...overlayClickProps(() => { setSelectedAppt(null); setRescheduleAppt(null); setPhotoIdViewer(null); setLabDocs(null); })}>
        <div ref={popoverRef} style={{ ...styles.popover, ...((showIntakePanel || showPrepPanel) ? { width: '820px', display: 'flex' } : {}) }} onClick={e => e.stopPropagation()}>
          {/* Main appointment column */}
          <div style={(showIntakePanel || showPrepPanel) ? { width: '420px', flexShrink: 0, overflow: 'auto', maxHeight: '80vh' } : {}}>
          <div style={styles.popoverHeader}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Appointment Details</h3>
            <button onClick={() => { setSelectedAppt(null); setRescheduleAppt(null); setPhotoIdViewer(null); setLabDocs(null); }} style={styles.closeBtn}>&times;</button>
          </div>
          <div style={styles.popoverBody}>
            <div style={styles.popoverRow}>
              <span style={styles.popoverLabel}>Patient</span>
              <span style={{ ...styles.popoverValue, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {appt.patient_id ? (
                  <button onClick={() => openPatientDrawer(appt.patient_id)}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#1e40af', fontWeight: '600', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                    {appt.patient_name}
                  </button>
                ) : appt.patient_name}
                {/* Photo ID badge */}
                {apptPatientInfo && (() => {
                  const photoUrl = (apptPatientInfo.intakes || []).find(i => i.photo_id_url)?.photo_id_url;
                  return photoUrl ? (
                    <button
                      onClick={() => setPhotoIdViewer({ url: photoUrl, title: `${appt.patient_name} — Photo ID` })}
                      title="View Photo ID"
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #e5e5e5',
                        background: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '14px', flexShrink: 0, padding: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.borderColor = '#ccc'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e5e5'; }}
                    >🪪</button>
                  ) : (
                    <span
                      title="No photo ID on file"
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', border: '1px dashed #d1d5db',
                        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', color: '#ccc', flexShrink: 0, fontWeight: '600',
                      }}
                    >{(appt.patient_name?.[0] || '?').toUpperCase()}</span>
                  );
                })()}
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
              <span style={styles.popoverLabel}>Service{appt.services?.length > 1 ? 's' : ''}</span>
              <span style={{ ...styles.popoverValue, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {appt.services?.length > 1 ? (
                  <span style={{ flex: 1 }}>
                    {appt.services.map((s, i) => (
                      <span key={s.name} style={{ display: 'block', fontSize: i === 0 ? '13px' : '12px', color: i === 0 ? '#111' : '#555' }}>
                        {s.name}
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {' '}({s.duration} min{s.provider ? ` · ${s.provider}` : ''})
                        </span>
                      </span>
                    ))}
                  </span>
                ) : <span style={{ flex: 1 }}>{appt.service_name}</span>}
                {appt.status !== 'cancelled' && (
                  <button
                    onClick={() => setChangingServiceAppt(changingServiceAppt === appt.id ? null : appt.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#6b7280', flexShrink: 0, padding: '0 2px', textDecoration: 'underline' }}
                  >
                    {changingServiceAppt === appt.id ? 'Cancel' : 'Change'}
                  </button>
                )}
              </span>
            </div>
            {changingServiceAppt === appt.id && (
              <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <select
                  disabled={savingServiceChange}
                  onChange={(e) => {
                    const svc = getAllServices().find(s => s.name === e.target.value);
                    if (svc) handleChangeServiceType(appt.id, svc);
                  }}
                  defaultValue=""
                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', border: '1px solid #d1d5db', background: '#fff', cursor: savingServiceChange ? 'wait' : 'pointer' }}
                >
                  <option value="" disabled>{savingServiceChange ? 'Saving...' : 'Select new service type...'}</option>
                  {Object.entries(APPOINTMENT_SERVICES).map(([group, items]) => (
                    <optgroup key={group} label={group}>
                      {items.map(svc => (
                        <option key={svc.name} value={svc.name} disabled={svc.name === appt.service_name}>
                          {svc.name} ({svc.duration} min)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
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
                {new Date(appt.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' , timeZone: 'America/Los_Angeles' })}
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
            {appt.modality && (
              <div style={styles.popoverRow}>
                <span style={styles.popoverLabel}>Modality</span>
                <span style={styles.popoverValue}>
                  {appt.modality === 'in_clinic' ? '🏥 In Clinic' : appt.modality === 'phone' ? '📞 Telephone' : '💻 Telemedicine'}
                </span>
              </div>
            )}

            {/* Forms / Consent checklist — compute live status for use in prep checklist too */}
            {(() => {
              // Compute live form completion (used by both form display and prep checklist)
              const requiredFormIds = apptPatientInfo ? (REQUIRED_FORMS[appt.service_category] || REQUIRED_FORMS['other'] || ['intake', 'hipaa']) : [];
              const completedConsentFormIds = new Set(
                (apptPatientInfo?.consents || []).map(c => CONSENT_TYPE_TO_FORM_ID[c.consent_type] || c.consent_type)
              );
              const hasIntake = (apptPatientInfo?.intakes || []).length > 0;
              const formChecks = requiredFormIds.map(formId => {
                if (formId === 'intake') return { formId, name: 'Medical Intake', done: hasIntake };
                return { formId, name: FORM_NAMES[formId] || formId, done: completedConsentFormIds.has(formId) };
              });
              const allDone = requiredFormIds.length === 0 || formChecks.every(f => f.done);
              // Store on appt for prep checklist to use
              appt._liveFormsComplete = allDone;
              const missingCount = formChecks.filter(f => !f.done).length;
              if (!apptPatientInfo) return null;
              return (
                <div style={{
                  margin: '12px 0',
                  padding: '10px 12px',
                  borderRadius: '0',
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
                    <div style={{ marginTop: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const missing = formChecks.filter(f => !f.done).map(f => f.formId);
                          sendMissingFormsInline(appt, missing);
                        }}
                        disabled={sendingForms}
                        style={{
                          fontSize: '11px', fontWeight: 600, padding: '5px 10px',
                          background: sendingForms ? '#e5e7eb' : '#2563eb', color: '#fff',
                          border: 'none', cursor: sendingForms ? 'wait' : 'pointer',
                        }}
                      >
                        {sendingForms ? 'Sending…' : `Send ${missingCount} Missing Form${missingCount > 1 ? 's' : ''} via SMS`}
                      </button>
                      {sendFormsStatus && (
                        <div style={{ fontSize: '11px', marginTop: '5px', color: sendFormsStatus.ok ? '#166534' : '#991b1b' }}>
                          {sendFormsStatus.ok ? '✓ ' : '✗ '}{sendFormsStatus.msg}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Medical Intake toggle button */}
            {appt.patient_id && apptPatientInfo && (apptPatientInfo.intakes || []).length > 0 && (
              <button
                onClick={() => { setShowIntakePanel(!showIntakePanel); if (!showIntakePanel) setShowPrepPanel(false); }}
                style={{
                  width: '100%', margin: '10px 0 0', padding: '8px 12px',
                  background: showIntakePanel ? '#f0f9ff' : '#fff',
                  border: `1px solid ${showIntakePanel ? '#bae6fd' : '#e5e5e5'}`,
                  fontSize: '12px', fontWeight: '600', color: showIntakePanel ? '#0369a1' : '#374151',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span>Medical Intake</span>
                <span style={{ fontSize: '11px', color: '#999' }}>{showIntakePanel ? '← Hide' : 'View →'}</span>
              </button>
            )}

            {/* Prep / Provider Briefing panel toggle */}
            {appt.patient_id && (
              <button
                onClick={() => {
                  const opening = !showPrepPanel;
                  setShowPrepPanel(opening);
                  if (opening) {
                    setShowIntakePanel(false);
                    // Fetch briefing if not already loaded
                    if (!prepBriefing && !loadingPrepBriefing) {
                      setLoadingPrepBriefing(true);
                      fetch(`/api/appointments/${appt.id}/briefing`)
                        .then(r => r.json())
                        .then(data => { setPrepBriefing(data.briefing); setLoadingPrepBriefing(false); })
                        .catch(() => setLoadingPrepBriefing(false));
                    }
                  }
                }}
                style={{
                  width: '100%', margin: '10px 0 0', padding: '8px 12px',
                  background: showPrepPanel ? '#fefce8' : '#fff',
                  border: `1px solid ${showPrepPanel ? '#fde68a' : '#e5e5e5'}`,
                  fontSize: '12px', fontWeight: '600', color: showPrepPanel ? '#92400e' : '#374151',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span>Prep / Provider Briefing</span>
                <span style={{ fontSize: '11px', color: '#999' }}>{showPrepPanel ? '← Hide' : 'View →'}</span>
              </button>
            )}

            {/* Renewal alerts */}
            {renewalMap[appt.patient_id]?.length > 0 && (
              <div style={{
                margin: '12px 0',
                padding: '10px 12px',
                borderRadius: '0',
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
                      borderRadius: '0',
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
                  margin: '12px 0', padding: '10px 12px', borderRadius: '0',
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
                  <div style={{ background: '#e5e7eb', borderRadius: '0', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: isExhausted ? '#dc2626' : pct >= 80 ? '#d97706' : '#0ea5e9', borderRadius: '0', transition: 'width 0.3s' }} />
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
                        color: '#fff', border: 'none', borderRadius: '0', fontSize: '13px', fontWeight: 600,
                        cursor: loggingSession ? 'wait' : 'pointer',
                      }}
                    >
                      {loggingSession ? 'Logging Session...' : `Log Session (${sessionsUsed + 1}/${totalSessions})`}
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Appointment Notes — editable */}
            <div style={styles.popoverRow}>
              <span style={styles.popoverLabel}>Notes</span>
              {editingApptNotes === appt.id ? (
                <div style={{ flex: 1 }}>
                  <textarea
                    value={apptNotesValue}
                    onChange={e => setApptNotesValue(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '0', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button
                      onClick={() => saveApptNotes(appt.id)}
                      disabled={savingApptNotes}
                      style={{ ...styles.actionBtn, background: '#000', color: '#fff', fontSize: '12px', padding: '4px 12px' }}
                    >
                      {savingApptNotes ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingApptNotes(null)}
                      style={{ ...styles.actionBtn, fontSize: '12px', padding: '4px 12px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ ...styles.popoverValue, flex: 1 }}>{appt.notes || <span style={{ color: '#aaa', fontStyle: 'italic' }}>No notes</span>}</span>
                  <button
                    onClick={() => { setEditingApptNotes(appt.id); setApptNotesValue(appt.notes || ''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '0 2px', color: '#999', flexShrink: 0 }}
                    title="Edit notes"
                  >✏️</button>
                </div>
              )}
            </div>
            {appt.cancellation_reason && (
              <div style={styles.popoverRow}>
                <span style={styles.popoverLabel}>Reason</span>
                <span style={{ ...styles.popoverValue, color: '#dc2626' }}>{appt.cancellation_reason}</span>
              </div>
            )}

            {/* Reschedule form */}
            {rescheduleAppt?.id === appt.id && (
              <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '0' }}>
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
                {['scheduled', 'confirmed', 'checked_in', 'in_progress'].includes(appt.status) && (
                  <button onClick={() => updateStatus(appt.id, 'completed')} style={{ ...styles.actionBtn, background: '#dcfce7', color: '#166634' }}>Complete</button>
                )}
                <button onClick={() => { setRescheduleAppt(appt); setRescheduleDate(''); setRescheduleTime(''); }} style={{ ...styles.actionBtn, background: '#fff7ed', color: '#c2410c' }}>Reschedule</button>
                {['scheduled', 'confirmed'].includes(appt.status) && (
                  <button onClick={() => updateStatus(appt.id, 'no_show')} style={{ ...styles.actionBtn, background: '#fee2e2', color: '#dc2626' }}>No Show</button>
                )}
                <button onClick={() => { const reason = prompt('Cancellation reason (optional):'); updateStatus(appt.id, 'cancelled', reason); }} style={{ ...styles.actionBtn, background: '#fee2e2', color: '#dc2626' }}>Cancel</button>
              </div>
            )}

            {/* Encounter Note button with status badge */}
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={() => { setSelectedAppt(null); setEncounterAppt(appt); }}
                style={{ ...styles.actionBtn, width: '100%', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {noteBadge(appt.id, 'medium')}
                {noteStatusMap[appt.id]?.hasNote
                  ? (noteStatusMap[appt.id].status === 'signed' ? 'Note Signed' : 'Edit Note')
                  : 'Write Encounter Note'
                }
              </button>
              {appt.patient_id && (
                <button
                  onClick={() => {
                    setCheckoutPatient({
                      id: appt.patient_id,
                      name: appt.patient_name || appt.attendee_name,
                      email: appt.attendee_email || null,
                      phone: appt.attendee_phone || null,
                    });
                    setShowCheckout(true);
                  }}
                  style={{ ...styles.actionBtn, width: '100%', marginTop: '6px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  📦 Checkout
                </button>
              )}
            </div>

            {/* Inline Prep Checklist */}
            {(() => {
              const sn = (appt.service_name || '').toLowerCase();
              const isPrereqSvc = sn.includes('vitamin c') || sn.includes('methylene blue') || sn.includes('mb +') || sn.includes('mb combo');
              const isLabAppt = sn.includes('lab review') || sn.includes('lab assessment') || sn.includes('lab follow') || sn.includes('initial lab');
              // Provider briefing is only required for appointments where Dr. Burgess
              // needs context ahead of time: lab reviews, initial consults, PRP, and
              // procedures. Routine WL/T injections, IVs, HBOT, RLT, peptide pickups
              // do NOT need a provider brief.
              const isInitialConsult = sn.includes('initial consult') || sn.includes('new patient consult') || (sn.includes('consult') && sn.includes('initial'));
              const isPRP = sn.includes('prp');
              const isProcedure = sn.includes('procedure') || sn.includes('aspiration') || sn.includes('injection therapy') || sn.includes('trigger point') || sn.includes('joint injection');
              const requiresProviderBrief = isLabAppt || isInitialConsult || isPRP || isProcedure;
              const labDeliveryLabel = appt.modality === 'telemedicine' ? 'Labs emailed to patient' : 'Labs printed';
              const prepItems = [
                { label: 'Instructions sent', ok: appt.instructions_sent, auto: true },
                { label: 'Forms complete', ok: appt._liveFormsComplete ?? appt.forms_complete, auto: true },
                ...(isPrereqSvc ? [{ label: 'Blood work prereq', ok: appt.prereqs_met, auto: true }] : []),
                ...(isLabAppt ? [{ label: labDeliveryLabel, ok: appt.labs_delivered, field: 'labs_delivered' }] : []),
                { label: 'ID verified', ok: appt.id_verified, field: 'id_verified' },
                ...(requiresProviderBrief ? [{ label: 'Provider briefed', ok: appt.provider_briefed, field: 'provider_briefed' }] : []),
              ];
              const allReady = prepItems.every(i => i.ok);
              return (
                <div style={{ marginTop: '12px', borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666' }}>Prep Checklist</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', background: allReady ? '#dcfce7' : '#fef3c7', color: allReady ? '#166534' : '#92400e' }}>
                      {allReady ? '✓ Ready' : '⚠ Action Needed'}
                    </span>
                  </div>
                  {prepItems.map(item => (
                    <div
                      key={item.label}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: item.field ? 'pointer' : 'default', opacity: prepSaving[item.field] ? 0.6 : 1 }}
                      onClick={item.field && !prepSaving[item.field] ? () => togglePrepField(item.field) : undefined}
                    >
                      <div style={{
                        width: '16px', height: '16px', border: `2px solid ${item.ok ? '#22c55e' : '#d1d5db'}`,
                        background: item.ok ? '#22c55e' : '#fff', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0,
                      }}>
                        {item.ok && <span style={{ color: '#fff', fontSize: '10px', fontWeight: '700' }}>✓</span>}
                      </div>
                      <span style={{ fontSize: '12px', flex: 1, color: item.ok ? '#999' : '#111', textDecoration: item.ok ? 'line-through' : 'none' }}>
                        {item.label}
                      </span>
                      {item.auto && <span style={{ fontSize: '8px', fontWeight: '600', textTransform: 'uppercase', color: '#bbb', background: '#f5f5f5', padding: '1px 4px' }}>auto</span>}
                    </div>
                  ))}
                  {/* Print Labs button — for lab appointments */}
                  {isLabAppt && appt.patient_id && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLoadingLabDocs(true);
                        try {
                          const resp = await fetch(`/api/patients/${appt.patient_id}/lab-documents`);
                          const data = await resp.json();
                          const docs = data.documents || [];
                          if (docs.length === 0) {
                            alert('No lab documents found for this patient.');
                          } else if (docs.length === 1) {
                            window.open(docs[0].url, '_blank');
                          } else {
                            setLabDocs(docs);
                          }
                        } catch (err) {
                          console.error('Error fetching lab docs:', err);
                          alert('Failed to load lab documents.');
                        } finally {
                          setLoadingLabDocs(false);
                        }
                      }}
                      disabled={loadingLabDocs}
                      style={{
                        width: '100%', margin: '8px 0 0', padding: '7px 0', background: '#fff',
                        border: '1px solid #d1d5db', fontSize: '12px', fontWeight: '600',
                        color: '#374151', cursor: loadingLabDocs ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      }}
                    >
                      <span>🖨️</span>
                      {loadingLabDocs ? 'Loading Labs...' : 'Print Labs'}
                    </button>
                  )}
                  {/* Prep notes */}
                  <div style={{ marginTop: '8px' }}>
                    <textarea
                      value={prepNotes}
                      onChange={handlePrepNotesChange}
                      placeholder="Prep notes..."
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #e5e5e5', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.4', boxSizing: 'border-box' }}
                      rows={2}
                      onClick={e => e.stopPropagation()}
                    />
                    {prepNotesSaved && <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: '600' }}>Saved</span>}
                  </div>
                </div>
              );
            })()}

            {/* Delete button — always visible, no notification sent */}
            <div style={{ marginTop: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
              <button onClick={() => deleteAppointment(appt.id)} style={{ ...styles.actionBtn, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '12px' }}>Delete (No Notification)</button>
            </div>
          </div>
          </div>{/* end main appointment column */}

          {/* ── Medical Intake Side Panel ── */}
          {showIntakePanel && (() => {
            const intake = (apptPatientInfo?.intakes || [])[0];
            if (!intake) return (
              <div style={{ width: '400px', borderLeft: '1px solid #e5e5e5', padding: '16px 20px', overflow: 'auto', maxHeight: '80vh', background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Medical Intake</h3>
                  <button onClick={() => setShowIntakePanel(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>&times;</button>
                </div>
                <p style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>No intake form on file for this patient.</p>
              </div>
            );

            const sectionStyle = { marginBottom: '14px' };
            const sectionLabelStyle = { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: '6px' };
            const valueStyle = { fontSize: '13px', color: '#1a1a1a', lineHeight: '1.5' };
            const chipStyle = { display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', fontSize: '12px', color: '#374151', marginRight: '4px', marginBottom: '4px' };
            const alertChipStyle = { ...chipStyle, background: '#fef2f2', color: '#991b1b' };

            // Parse medications
            const meds = intake.current_medications || [];
            const medsText = intake.medication_notes || (typeof intake.current_medications === 'string' ? intake.current_medications : '');
            const hasMeds = intake.on_medications || meds.length > 0 || medsText;

            // Parse allergies
            const allergies = intake.allergies || [];
            const allergyReactions = intake.allergy_reactions || '';
            const hasAllergies = intake.has_allergies || allergies.length > 0;

            // Medical conditions
            const conditions = intake.medical_conditions || [];
            const hasConditions = conditions.length > 0;

            // Detailed medical history from individual boolean fields
            const medHistoryItems = [
              { label: 'High Blood Pressure', has: intake.high_blood_pressure, year: intake.high_blood_pressure_year },
              { label: 'High Cholesterol', has: intake.high_cholesterol, year: intake.high_cholesterol_year },
              { label: 'Heart Disease', has: intake.heart_disease, year: intake.heart_disease_year, detail: intake.heart_disease_type },
              { label: 'Diabetes', has: intake.diabetes, year: intake.diabetes_year, detail: intake.diabetes_type },
              { label: 'Thyroid Disorder', has: intake.thyroid_disorder, year: intake.thyroid_disorder_year, detail: intake.thyroid_disorder_type },
              { label: 'Depression / Anxiety', has: intake.depression_anxiety, year: intake.depression_anxiety_year },
              { label: 'Kidney Disease', has: intake.kidney_disease, year: intake.kidney_disease_year, detail: intake.kidney_disease_type },
              { label: 'Liver Disease', has: intake.liver_disease, year: intake.liver_disease_year, detail: intake.liver_disease_type },
              { label: 'Autoimmune Disorder', has: intake.autoimmune_disorder, year: intake.autoimmune_disorder_year, detail: intake.autoimmune_disorder_type },
              { label: 'Cancer', has: intake.cancer, year: intake.cancer_year, detail: intake.cancer_type },
            ].filter(item => item.has);

            // HRT info
            const onHrt = intake.on_hrt;
            const hrtDetails = intake.hrt_details || '';

            // Supplements
            const supplements = intake.supplements || [];
            const hasSupplements = Array.isArray(supplements) ? supplements.length > 0 : !!supplements;

            // Injury info
            const hasInjury = intake.injured || intake.currently_injured;

            // Goals
            const goals = intake.goals;

            return (
              <div style={{ width: '400px', borderLeft: '1px solid #e5e5e5', overflow: 'auto', maxHeight: '80vh', background: '#fafafa' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fafafa', zIndex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Medical Intake</h3>
                  <button onClick={() => setShowIntakePanel(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>&times;</button>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  {/* Submitted date */}
                  {intake.submitted_at && (
                    <div style={{ fontSize: '11px', color: '#999', marginBottom: '14px' }}>
                      Submitted {new Date(intake.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' })}
                    </div>
                  )}

                  {/* Demographics from intake — moved to top */}
                  <div style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {intake.date_of_birth && (
                      <div>
                        <div style={sectionLabelStyle}>DOB</div>
                        <div style={{ fontSize: '13px', color: '#1a1a1a' }}>{new Date(intake.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' })}</div>
                      </div>
                    )}
                    {intake.gender && (
                      <div>
                        <div style={sectionLabelStyle}>Gender</div>
                        <div style={{ fontSize: '13px', color: '#1a1a1a', textTransform: 'capitalize' }}>{intake.gender}</div>
                      </div>
                    )}
                  </div>

                  {/* How heard */}
                  {(intake.how_heard || intake.how_heard_other) && (
                    <div style={sectionStyle}>
                      <div style={sectionLabelStyle}>How Heard About Us</div>
                      <div style={{ ...valueStyle, fontSize: '12px' }}>{intake.how_heard}{intake.how_heard_other ? ` — ${intake.how_heard_other}` : ''}</div>
                    </div>
                  )}

                  {/* Goals */}
                  {goals && (
                    <div style={sectionStyle}>
                      <div style={sectionLabelStyle}>Goals</div>
                      <div style={{ ...valueStyle, fontSize: '12px' }}>{typeof goals === 'string' ? goals : (Array.isArray(goals) ? goals.join(', ') : JSON.stringify(goals))}</div>
                    </div>
                  )}

                  {/* Allergies — prominent if present */}
                  <div style={{ ...sectionStyle, borderTop: '1px solid #e5e5e5', paddingTop: '12px' }}>
                    <div style={sectionLabelStyle}>Allergies</div>
                    {hasAllergies ? (
                      <div>
                        {(Array.isArray(allergies) ? allergies : [allergies]).map((a, i) => (
                          <span key={i} style={alertChipStyle}>{typeof a === 'object' ? (a.name || a.allergen || JSON.stringify(a)) : a}</span>
                        ))}
                        {allergyReactions && <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>Reactions: {allergyReactions}</div>}
                      </div>
                    ) : (
                      <div style={{ ...valueStyle, color: '#22c55e', fontSize: '12px' }}>No known allergies</div>
                    )}
                  </div>

                  {/* Medications */}
                  <div style={sectionStyle}>
                    <div style={sectionLabelStyle}>Current Medications</div>
                    {hasMeds ? (
                      <div>
                        {Array.isArray(meds) && meds.length > 0 ? meds.map((m, i) => (
                          <span key={i} style={chipStyle}>{typeof m === 'object' ? (m.name || JSON.stringify(m)) : m}</span>
                        )) : null}
                        {medsText && <div style={{ ...valueStyle, fontSize: '12px' }}>{medsText}</div>}
                      </div>
                    ) : (
                      <div style={{ ...valueStyle, color: '#999', fontSize: '12px', fontStyle: 'italic' }}>None reported</div>
                    )}
                  </div>

                  {/* Supplements */}
                  {hasSupplements && (
                    <div style={sectionStyle}>
                      <div style={sectionLabelStyle}>Supplements</div>
                      <div>
                        {(Array.isArray(supplements) ? supplements : [supplements]).map((s, i) => (
                          <span key={i} style={chipStyle}>{typeof s === 'object' ? (s.name || JSON.stringify(s)) : s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medical conditions — JSONB array */}
                  <div style={sectionStyle}>
                    <div style={sectionLabelStyle}>Medical Conditions</div>
                    {hasConditions ? (
                      <div>
                        {(Array.isArray(conditions) ? conditions : [conditions]).map((c, i) => (
                          <span key={i} style={chipStyle}>{typeof c === 'object' ? (c.name || JSON.stringify(c)) : c}</span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ ...valueStyle, color: '#999', fontSize: '12px', fontStyle: 'italic' }}>None reported</div>
                    )}
                  </div>

                  {/* Detailed medical history — individual boolean fields */}
                  {medHistoryItems.length > 0 && (
                    <div style={sectionStyle}>
                      <div style={sectionLabelStyle}>Medical History</div>
                      {medHistoryItems.map((item, i) => (
                        <div key={i} style={{ fontSize: '12px', color: '#1a1a1a', padding: '3px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={alertChipStyle}>
                            {item.label}
                            {item.detail ? ` (${item.detail})` : ''}
                            {item.year ? ` — ${item.year}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* HRT status */}
                  {onHrt && (
                    <div style={sectionStyle}>
                      <div style={sectionLabelStyle}>Current HRT</div>
                      <div style={{ ...valueStyle, fontSize: '12px' }}>{hrtDetails || 'Yes (no details provided)'}</div>
                    </div>
                  )}

                  {/* Previous therapy */}
                  {intake.previous_therapy && (
                    <div style={sectionStyle}>
                      <div style={sectionLabelStyle}>Previous Therapy</div>
                      <div style={{ ...valueStyle, fontSize: '12px' }}>{intake.previous_therapy_details || 'Yes (no details provided)'}</div>
                    </div>
                  )}

                  {/* Injury info */}
                  {hasInjury && (
                    <div style={{ ...sectionStyle, background: '#fef2f2', padding: '10px 12px', border: '1px solid #fecaca' }}>
                      <div style={sectionLabelStyle}>Injury / Recovery</div>
                      {intake.injury_description && <div style={{ fontSize: '12px', color: '#1a1a1a', marginBottom: '4px' }}>{intake.injury_description}</div>}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {intake.injury_location && <div style={{ fontSize: '11px', color: '#666' }}>Location: {intake.injury_location}</div>}
                        {(intake.injury_date || intake.injury_when_occurred) && <div style={{ fontSize: '11px', color: '#666' }}>Date: {intake.injury_date || intake.injury_when_occurred}</div>}
                        {intake.pain_severity && <div style={{ fontSize: '11px', color: '#666' }}>Pain: {intake.pain_severity}/10</div>}
                        {intake.functional_limitation && <div style={{ fontSize: '11px', color: '#666' }}>Functional limitation: {intake.functional_limitation}/10</div>}
                        {intake.injury_trajectory && <div style={{ fontSize: '11px', color: '#666' }}>Trajectory: {intake.injury_trajectory}</div>}
                      </div>
                    </div>
                  )}

                  {/* Symptoms */}
                  {intake.symptoms && (
                    <div style={sectionStyle}>
                      <div style={sectionLabelStyle}>Reported Symptoms</div>
                      <div style={{ ...valueStyle, fontSize: '12px' }}>
                        {Array.isArray(intake.symptoms) ? intake.symptoms.map((s, i) => (
                          <span key={i} style={chipStyle}>{s}</span>
                        )) : intake.symptoms}
                      </div>
                      {intake.symptom_duration && (
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Duration: {intake.symptom_duration}</div>
                      )}
                    </div>
                  )}

                  {/* Recent hospitalization */}
                  {intake.recent_hospitalization && (
                    <div style={sectionStyle}>
                      <div style={sectionLabelStyle}>Recent Hospitalization</div>
                      <div style={{ ...valueStyle, fontSize: '12px' }}>{intake.hospitalization_reason || 'Yes (no details provided)'}</div>
                    </div>
                  )}

                  {/* Primary care physician */}
                  {intake.has_pcp && intake.pcp_name && (
                    <div style={sectionStyle}>
                      <div style={sectionLabelStyle}>Primary Care Physician</div>
                      <div style={{ ...valueStyle, fontSize: '12px' }}>{intake.pcp_name}</div>
                    </div>
                  )}

                  {/* Additional notes from intake */}
                  {intake.additional_notes && (
                    <div style={sectionStyle}>
                      <div style={sectionLabelStyle}>Additional Notes</div>
                      <div style={{ ...valueStyle, fontSize: '12px' }}>{intake.additional_notes}</div>
                    </div>
                  )}

                  {/* What brings you in (legacy) */}
                  {(intake.what_brings_you || intake.what_brings_you_in) && (
                    <div style={sectionStyle}>
                      <div style={sectionLabelStyle}>What Brings You In</div>
                      <div style={{ ...valueStyle, fontSize: '12px' }}>{intake.what_brings_you || intake.what_brings_you_in}</div>
                    </div>
                  )}

                  {/* View full profile link */}
                  {appt.patient_id && (
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e5e5e5' }}>
                      <button
                        onClick={() => openPatientDrawer(appt.patient_id)}
                        style={{ width: '100%', padding: '8px', background: '#f9fafb', border: '1px solid #e5e5e5', fontSize: '12px', color: '#374151', cursor: 'pointer', fontWeight: '500' }}
                      >
                        View Full Patient Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── Provider Briefing Side Panel ── */}
          {showPrepPanel && (() => {
            const sectionLabelStyle = { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: '6px' };
            const rowStyle = { display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '8px 0' };
            const labelStyle = { width: '120px', flexShrink: 0, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#888' };
            const valueStyle = { fontSize: '13px', color: '#1a1a1a', lineHeight: '1.5', flex: 1 };

            if (loadingPrepBriefing || !prepBriefing) {
              return (
                <div style={{ width: '400px', borderLeft: '1px solid #e5e5e5', padding: '16px 20px', overflow: 'auto', maxHeight: '80vh', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Provider Briefing</h3>
                    <button onClick={() => setShowPrepPanel(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>&times;</button>
                  </div>
                  <div style={{ fontSize: '13px', color: '#999' }}>{loadingPrepBriefing ? 'Loading briefing…' : 'No briefing data available.'}</div>
                </div>
              );
            }

            const b = prepBriefing;
            const isInPerson = b.modality !== 'telemedicine' && b.modality !== 'phone';
            const fmtDate = (iso) => {
              if (!iso) return '—';
              try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' }); }
              catch { return iso; }
            };
            const fmtDateOnly = (iso) => {
              if (!iso) return '—';
              const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
              if (!m) return fmtDate(iso);
              const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
            };

            const dobLine = b.patient?.dob
              ? `${fmtDateOnly(b.patient.dob)}${b.patient.age != null ? ` (age ${b.patient.age})` : ''}`
              : '—';
            const reasonParts = [];
            if (b.reason_for_visit) reasonParts.push(b.reason_for_visit);
            if (b.patient_goals) reasonParts.push(`Goals: ${b.patient_goals}`);
            const reasonText = reasonParts.length ? reasonParts.join(' · ') : '—';
            const lastVisitText = b.last_visit
              ? `${fmtDate(b.last_visit.date)} — ${b.last_visit.service || 'Visit'}${b.last_visit.provider ? ` (${b.last_visit.provider})` : ''}`
              : 'No prior visit on record';
            const diagnosesText = b.diagnoses?.length ? b.diagnoses.join('; ') : (b.has_intake ? 'None reported on intake' : '—');

            const rows = [
              ['Name', b.patient?.name || '—'],
              ['DOB', dobLine],
              ['Reason / Goals', reasonText],
              ['Last Visit', lastVisitText],
              ['Diagnoses', diagnosesText],
              ['Medications', b.medications || (b.has_intake ? '—' : 'No intake on file')],
              ['Allergies', b.allergies || (b.has_intake ? '—' : 'No intake on file')],
              ['How Heard', b.how_heard || '—'],
            ];
            if (isInPerson) {
              const v = b.latest_vitals;
              let vitalsText = 'No vitals on file';
              if (v) {
                const parts = [];
                if (v.blood_pressure_systolic && v.blood_pressure_diastolic) parts.push(`BP ${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}`);
                if (v.heart_rate) parts.push(`HR ${v.heart_rate}`);
                if (v.weight_lbs || v.weight) parts.push(`Wt ${v.weight_lbs || v.weight} lbs`);
                if (v.temperature) parts.push(`Temp ${v.temperature}`);
                if (v.oxygen_saturation) parts.push(`SpO₂ ${v.oxygen_saturation}%`);
                if (parts.length) vitalsText = `${parts.join(' · ')} (${fmtDate(v.recorded_at)})`;
              }
              rows.push(['Latest Vitals', vitalsText]);
              rows.push(['Mood', 'Assess at check-in']);
              rows.push(['Previous Plan', b.last_visit?.visit_reason || b.last_visit?.service || '—']);
            }

            return (
              <div style={{ width: '400px', borderLeft: '1px solid #e5e5e5', overflow: 'auto', maxHeight: '80vh', background: '#fafafa' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fafafa', zIndex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Provider Briefing</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {isInPerson ? 'In-Person' : 'Telemedicine'}
                    </span>
                    <button onClick={() => setShowPrepPanel(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>&times;</button>
                  </div>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  {rows.map(([label, value]) => (
                    <div key={label} style={rowStyle}>
                      <div style={labelStyle}>{label}</div>
                      <div style={valueStyle}>{value}</div>
                    </div>
                  ))}
                  {!b.has_intake && (
                    <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: '600', color: '#92400e', background: '#fef3c7', padding: '6px 10px' }}>
                      No medical intake on file
                    </div>
                  )}
                  {/* Print for Provider button */}
                  <button
                    onClick={async () => {
                      // Mark provider_briefed and open full prep page in new tab for printing
                      try {
                        await fetch(`/api/appointments/${appt.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ provider_briefed: true }),
                        });
                        setSelectedAppt(prev => prev ? { ...prev, provider_briefed: true } : prev);
                        setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, provider_briefed: true } : a));
                      } catch {}
                      window.open(`/admin/appointments/${appt.id}/prep`, '_blank');
                    }}
                    style={{
                      width: '100%', marginTop: '16px', padding: '8px 0',
                      background: '#111', color: '#fff', border: 'none',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}
                  >
                    Print for Provider
                  </button>
                  {/* Link to full prep page */}
                  <button
                    onClick={() => window.open(`/admin/appointments/${appt.id}/prep`, '_blank')}
                    style={{
                      width: '100%', marginTop: '8px', padding: '8px',
                      background: '#f9fafb', border: '1px solid #e5e5e5',
                      fontSize: '12px', color: '#374151', cursor: 'pointer', fontWeight: '500',
                    }}
                  >
                    Open Full Prep Page
                  </button>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    );
  };

  // ===================== NEW APPOINTMENT WIZARD =====================
  const renderWizard = () => (
    <div style={styles.wizardContainer}>

      {/* ── Booking Confirmed screen ── */}
      {bookingConfirmed ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#166534', margin: '0 0 4px' }}>Appointment Confirmed</h3>
          <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>
            {bookingConfirmed.notificationSent ? 'Confirmation sent to patient.' : 'No notification sent.'}
          </p>

          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #dcfce7' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Patient</span>
              <span style={{ fontSize: '13px', color: '#111', fontWeight: '600' }}>{bookingConfirmed.patientName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #dcfce7' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Service{bookingConfirmed.services.length > 1 ? 's' : ''}</span>
              <span style={{ fontSize: '13px', color: '#111', textAlign: 'right' }}>
                {bookingConfirmed.services.map(s => (
                  <span key={s.name} style={{ display: 'block' }}>
                    {s.name}
                    {bookingConfirmed.providers[s.name] && (
                      <span style={{ fontSize: '11px', color: '#6b7280' }}> · {bookingConfirmed.providers[s.name]?.label}</span>
                    )}
                  </span>
                ))}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #dcfce7' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</span>
              <span style={{ fontSize: '13px', color: '#111' }}>{bookingConfirmed.date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #dcfce7' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time</span>
              <span style={{ fontSize: '13px', color: '#111' }}>{bookingConfirmed.time}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Location</span>
              <span style={{ fontSize: '13px', color: '#111' }}>📍 {bookingConfirmed.location}</span>
            </div>
          </div>

          <button
            onClick={resetWizard}
            style={{ ...styles.primaryBtn, width: '100%', background: '#111' }}
          >
            + Book Another Appointment
          </button>
        </div>
      ) : (
      <>
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

          {/* Service search */}
          <input
            type="text"
            placeholder="Search services..."
            value={serviceSearch}
            onChange={e => { setServiceSearch(e.target.value); setSelectedServiceGroup(null); }}
            style={{
              ...styles.input,
              marginBottom: '10px',
              background: '#f9fafb',
            }}
            autoComplete="off"
          />

          {/* Flat search results */}
          {serviceSearch.trim() && (() => {
            const q = serviceSearch.trim().toLowerCase();
            const matches = getAllServices().filter(s => s.name.toLowerCase().includes(q));
            if (matches.length === 0) return (
              <div style={{ fontSize: '13px', color: '#9ca3af', padding: '8px 0' }}>No services match "{serviceSearch}"</div>
            );
            return (
              <div style={styles.serviceList}>
                {matches.map(svc => {
                  const isSelected = selectedServices.some(s => s.name === svc.name);
                  return (
                    <div
                      key={svc.name}
                      onClick={() => {
                        setSelectedServices(prev =>
                          prev.some(s => s.name === svc.name)
                            ? prev.filter(s => s.name !== svc.name)
                            : [...prev, svc]
                        );
                        setPanelType(null);
                      }}
                      style={{
                        ...styles.serviceItem,
                        ...(isSelected ? { background: '#e0e7ff', borderColor: '#3730a3' } : {}),
                        cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '0', flexShrink: 0,
                          border: isSelected ? '2px solid #3730a3' : '2px solid #d1d5db',
                          background: isSelected ? '#3730a3' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isSelected && <span style={{ color: '#fff', fontSize: '11px', lineHeight: 1 }}>✓</span>}
                        </div>
                        <div>
                          <span style={{ fontWeight: '500' }}>{svc.name}</span>
                          <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '6px' }}>{svc.group}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#888' }}>{svc.duration} min</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Service category groups (hidden when searching) */}
          {!serviceSearch.trim() && <>
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
              {APPOINTMENT_SERVICES[selectedServiceGroup].map(svc => {
                const isSelected = selectedServices.some(s => s.name === svc.name);
                return (
                  <div
                    key={svc.name}
                    onClick={() => {
                      setSelectedServices(prev => {
                        if (prev.some(s => s.name === svc.name)) {
                          const next = prev.filter(s => s.name !== svc.name);
                          // Reset modality if no remaining services need it
                          if (!next.some(s => s.hasModality)) setModality('');
                          return next;
                        }
                        // When adding a service with restricted modalities, reset if current modality isn't allowed
                        if (svc.hasModality && svc.allowedModalities && modality && !svc.allowedModalities.includes(modality)) {
                          setModality('');
                        }
                        return [...prev, svc];
                      });
                      setPanelType(null);
                    }}
                    style={{
                      ...styles.serviceItem,
                      ...(isSelected ? { background: '#e0e7ff', borderColor: '#3730a3' } : {}),
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '0', flexShrink: 0,
                        border: isSelected ? '2px solid #3730a3' : '2px solid #d1d5db',
                        background: isSelected ? '#3730a3' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <span style={{ color: '#fff', fontSize: '11px', lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontWeight: '500' }}>{svc.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#888' }}>{svc.duration} min</span>
                  </div>
                );
              })}
            </div>
          )}
          </>}

          {/* Modality selector for consultation services (hasModality) */}
          {selectedServices.some(s => s.hasModality) && (() => {
            const modalitySvc = selectedServices.find(s => s.hasModality);
            const allowed = modalitySvc?.allowedModalities || ['in_clinic', 'phone', 'telemedicine'];
            const allOptions = [
              { value: 'in_clinic', label: 'In Clinic', icon: '🏥' },
              { value: 'phone', label: 'Telephone', icon: '📞' },
              { value: 'telemedicine', label: 'Telemedicine', icon: '💻' },
            ];
            const options = allOptions.filter(o => allowed.includes(o.value));
            return (
            <div style={{ marginTop: '12px' }}>
              <label style={styles.fieldLabel}>Appointment Type <span style={{ color: '#dc2626' }}>*</span></label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setModality(opt.value)}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      border: modality === opt.value ? '2px solid #000' : '1px solid #d1d5db',
                      borderRadius: 0,
                      background: modality === opt.value ? '#f9fafb' : '#fff',
                      color: '#111',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      fontWeight: '500',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{opt.icon}</div>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            );
          })()}

          {/* Panel type selector for New Patient Blood Draw */}
          {selectedServices.some(s => s.calcomSlug === 'new-patient-blood-draw') && (
            <div style={{ marginTop: '12px' }}>
              <label style={styles.fieldLabel}>Lab Panel</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { key: 'essential', label: 'Essential Panel', price: '$350' },
                  { key: 'elite', label: 'Elite Panel', price: '$750' },
                ].map(panel => (
                  <button
                    key={panel.key}
                    onClick={() => setPanelType(panel.key)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: panelType === panel.key ? '2px solid #000' : '1px solid #e5e5e5',
                      borderRadius: '0',
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

          {/* Selected services summary + Continue button */}
          {selectedServices.length > 0 && (
            <div style={{ marginTop: '14px', padding: '12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#166534', marginBottom: '6px' }}>
                {selectedServices.length === 1 ? '1 service selected' : `${selectedServices.length} services selected`}
                {' · '}
                {selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0)} min total
              </div>
              <div style={{ fontSize: '12px', color: '#166534', marginBottom: '10px' }}>
                {selectedServices.map(s => s.name).join(' + ')}
                {selectedServices.some(s => s.hasModality) && modality && (
                  <span style={{ fontWeight: '600' }}>{' · '}{{ in_clinic: 'In Clinic', phone: 'Telephone', telemedicine: 'Telemedicine' }[modality]}</span>
                )}
              </div>
              {selectedServices.some(s => s.hasModality) && !modality && (
                <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '8px' }}>Select an appointment type above to continue.</div>
              )}
              <button
                onClick={() => {
                  const primary = selectedServices[0];
                  setSelectedService(primary);
                  setSelectedProvider(null);
                  // If consultation service needs modality and none set, stay on step
                  if (selectedServices.some(s => s.hasModality) && !modality) return;
                  // If ANY service needs blood-draw panel and panel not yet set, stay on step
                  if (selectedServices.some(s => s.calcomSlug === 'new-patient-blood-draw') && !panelType) return;
                  if (selectedServices.length > 1) {
                    // Multi-service: location first (if IV), then per-service provider assignment
                    if (selectedServices.some(s => LOCATION_ENABLED_CATEGORIES.includes(s.category))) {
                      setSelectedLocation(DEFAULT_LOCATION);
                      setWizardStep(2);
                    } else {
                      setSelectedLocation(DEFAULT_LOCATION);
                      setWizardStep(3); // per-service provider assignment
                    }
                  } else {
                    // Single-service: existing flow (skip provider step, go to date/time)
                    if (LOCATION_ENABLED_CATEGORIES.includes(primary.category)) {
                      setSelectedLocation(DEFAULT_LOCATION);
                      setWizardStep(2);
                    } else {
                      setSelectedLocation(DEFAULT_LOCATION);
                      setWizardStep(4);
                    }
                  }
                }}
                style={{ ...styles.primaryBtn, width: '100%', background: '#16a34a' }}
              >
                Continue →
              </button>
            </div>
          )}

          <button onClick={() => setWizardStep(0)} style={{ ...styles.linkBtn, marginTop: '12px' }}>← Back</button>
        </div>
      )}

      {/* Step 2: Location (IV only) */}
      {wizardStep === 2 && (
        <div>
          <p style={styles.wizardLabel}>
            {selectedServices.length > 1
              ? `${selectedServices.map(s => s.name).join(' + ')} — ${selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0)} min total`
              : `${selectedService?.name} — ${selectedService?.duration} min`}
          </p>
          <label style={styles.fieldLabel}>Select Location</label>
          <div style={styles.serviceList}>
            {LOCATIONS.map(loc => (
              <div
                key={loc.id}
                onClick={() => {
                  setSelectedLocation(loc);
                  setSelectedProvider(null);
                  // Multi-service: go to per-service provider assignment; single: go to date/time
                  setWizardStep(selectedServices.length > 1 ? 3 : 4);
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

      {/* Step 3: Per-Service Provider Assignment (multi-service only) */}
      {wizardStep === 3 && (
        <div>
          <p style={styles.wizardLabel}>
            Assign a provider for each service
            {selectedLocation && selectedLocation.id !== 'newport' && (
              <span style={{ fontSize: '12px', color: '#6b7280' }}> · 📍 {selectedLocation.short}</span>
            )}
          </p>

          {selectedServices.map(svc => {
            const svcProviders = PROVIDERS[svc.category] || PROVIDERS['other'] || [];
            const assigned = selectedProviders[svc.name];
            return (
              <div key={svc.name} style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111', marginBottom: '7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{svc.name}</span>
                  <span style={{ fontSize: '11px', color: '#888', fontWeight: '400' }}>{svc.duration} min</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {svcProviders.map(prov => (
                    <button
                      key={prov.name}
                      onClick={() => setSelectedProviders(prev => ({ ...prev, [svc.name]: prov }))}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '0',
                        border: assigned?.name === prov.name ? '2px solid #3730a3' : '1px solid #e5e5e5',
                        background: assigned?.name === prov.name ? '#e0e7ff' : '#fff',
                        color: assigned?.name === prov.name ? '#3730a3' : '#374151',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '13px',
                        fontWeight: assigned?.name === prov.name ? '600' : '400',
                      }}
                    >
                      {prov.label}
                    </button>
                  ))}
                </div>
                {assigned && (
                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>✓ {assigned.label}</div>
                )}
              </div>
            );
          })}

          {/* Continue once all services have a provider */}
          {selectedServices.every(s => selectedProviders[s.name]) ? (
            <button
              onClick={() => {
                setSelectedProvider(selectedProviders[selectedServices[0].name]);
                setWizardStep(4);
              }}
              style={{ ...styles.primaryBtn, width: '100%', marginTop: '4px', background: '#16a34a' }}
            >
              Continue →
            </button>
          ) : (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', textAlign: 'center' }}>
              Assign a provider for each service to continue
            </div>
          )}

          <button onClick={() => {
            const needsLocation = selectedServices.some(s => LOCATION_ENABLED_CATEGORIES.includes(s.category));
            setWizardStep(needsLocation ? 2 : 1);
          }} style={{ ...styles.linkBtn, marginTop: '12px' }}>← Back</button>
        </div>
      )}

      {/* Step 4: Date + Provider Availability */}
      {wizardStep === 4 && (() => {

        // ── Multi-service path ──────────────────────────────────────────────
        if (selectedServices.length > 1) {
          const validTimes = getValidMultiServiceTimes();
          const allLoaded = !loadingMultiSlots && selectedServices.every(s => s.name in multiServiceSlots);

          // Helper: given a 'HH:MM' base time + offset in minutes → 'HH:MM'
          const addMins = (base, mins) => {
            const [h, m] = base.split(':').map(Number);
            const total = h * 60 + m + mins;
            return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
          };

          return (
            <div>
              <p style={styles.wizardLabel}>
                {selectedServices.map(s => s.name).join(' + ')} &nbsp;·&nbsp;
                {selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0)} min total
              </p>

              {/* Date */}
              <div style={{ marginBottom: '12px' }}>
                <label style={styles.fieldLabel}>Date</label>
                <input
                  type="date"
                  value={apptDate}
                  onChange={e => { setApptDate(e.target.value); setApptTime(''); setUseCustomTime(false); }}
                  style={styles.input}
                />
              </div>

              {/* Loading */}
              {loadingMultiSlots && apptDate && (
                <div style={{ padding: '20px 0', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                  Checking availability for all providers…
                </div>
              )}

              {/* Valid start-time grid */}
              {allLoaded && apptDate && !useCustomTime && (
                <div>
                  <label style={styles.fieldLabel}>
                    Pick a start time
                    <span style={{ fontWeight: 400, color: '#16a34a', marginLeft: '8px', fontSize: '11px' }}>Live availability</span>
                  </label>
                  {validTimes.length === 0 ? (
                    <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '0', color: '#92400e', fontSize: '13px', textAlign: 'center', marginTop: '6px' }}>
                      No times where all providers are free on this date. Try another date or use custom time.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {validTimes.map(t => {
                        const active = apptTime === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setApptTime(t)}
                            style={{
                              padding: '7px 12px', borderRadius: '0', fontSize: '13px', cursor: 'pointer',
                              border: active ? '2px solid #16a34a' : '1px solid #e5e5e5',
                              background: active ? '#f0fdf4' : '#fff',
                              color: active ? '#166534' : '#111',
                              fontWeight: active ? '700' : '400',
                            }}
                          >
                            {formatTimeLabel(t)}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Staggered schedule breakdown */}
                  {apptTime && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0', padding: '12px', marginTop: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#166534', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Appointment Schedule
                      </div>
                      {selectedServices.map((svc, idx) => {
                        const offset = selectedServices.slice(0, idx).reduce((s, x) => s + (x.duration || 0), 0);
                        const svcTime = addMins(apptTime, offset);
                        const prov = selectedProviders[svc.name];
                        return (
                          <div key={svc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: idx < selectedServices.length - 1 ? '1px solid #dcfce7' : 'none' }}>
                            <div>
                              <span style={{ fontSize: '13px', color: '#111', fontWeight: '500' }}>{svc.name}</span>
                              <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '8px' }}>{svc.duration} min · {prov?.label || '—'}</span>
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>{formatTimeLabel(svcTime)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <button
                      onClick={() => { setUseCustomTime(true); setApptTime(''); }}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Use custom time (override availability)
                    </button>
                  </div>
                </div>
              )}

              {/* Custom time entry */}
              {useCustomTime && apptDate && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={styles.fieldLabel}>Start Time (first service)</label>
                    <button
                      onClick={() => { setUseCustomTime(false); setApptTime(''); }}
                      style={{ background: 'none', border: 'none', color: '#666', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      ← Back to available slots
                    </button>
                  </div>
                  <input
                    type="time"
                    value={apptTime}
                    onChange={e => setApptTime(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '0', fontSize: '14px', width: '160px' }}
                  />
                  {apptTime && (
                    <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: '0', padding: '12px', marginTop: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#854d0e', fontWeight: '600', marginBottom: '8px' }}>⚠ Custom time — availability not verified</div>
                      {selectedServices.map((svc, idx) => {
                        const offset = selectedServices.slice(0, idx).reduce((s, x) => s + (x.duration || 0), 0);
                        const svcTime = addMins(apptTime, offset);
                        return (
                          <div key={svc.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0' }}>
                            <span>{svc.name} <span style={{ fontSize: '11px', color: '#92400e' }}>({selectedProviders[svc.name]?.label || '—'})</span></span>
                            <span style={{ fontWeight: '600' }}>{formatTimeLabel(svcTime)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!apptDate && (
                <div style={{ padding: '16px 0', color: '#888', fontSize: '13px', textAlign: 'center' }}>
                  Select a date to see provider availability
                </div>
              )}

              {/* Visit reason — required */}
              <div style={{ marginTop: '12px' }}>
                <label style={styles.fieldLabel}>Visit reason — why is this patient coming in? <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="text"
                  value={visitReason}
                  onChange={e => setVisitReason(e.target.value)}
                  placeholder="e.g. Initial lab review, HRT follow-up, first NAD+ IV session"
                  style={styles.input}
                />
                {visitReason.trim() === '' && apptDate && apptTime && (
                  <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Visit reason is required. Providers need to know why this patient is coming in.</div>
                )}
              </div>

              {/* Modality — required (hidden if already picked at service selection) */}
              {!selectedServices.some(s => s.hasModality) && (
              <div style={{ marginTop: '12px' }}>
                <label style={styles.fieldLabel}>Modality <span style={{ color: '#dc2626' }}>*</span></label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { value: 'in_clinic', label: 'In-Clinic' },
                    { value: 'telemedicine', label: 'Telemedicine' },
                    { value: 'phone', label: 'Phone' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setModality(opt.value)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: '500',
                        border: modality === opt.value ? '2px solid #000' : '1px solid #d1d5db',
                        background: modality === opt.value ? '#f9fafb' : '#fff',
                        color: '#111',
                        cursor: 'pointer',
                        borderRadius: 0,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {!modality && apptDate && apptTime && (
                  <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Modality is required.</div>
                )}
              </div>
              )}

              {/* Notes */}
              <div style={{ marginTop: '12px' }}>
                <label style={styles.fieldLabel}>Notes (optional)</label>
                <textarea
                  value={apptNotes}
                  onChange={e => setApptNotes(e.target.value)}
                  style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
                  placeholder="Any notes for this appointment…"
                />
              </div>

              {/* Nav */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => setWizardStep(5)}
                  disabled={!apptDate || !apptTime || !visitReason.trim() || !modality}
                  style={{ ...styles.primaryBtn, opacity: (apptDate && apptTime && visitReason.trim() && modality) ? 1 : 0.5 }}
                >
                  Next →
                </button>
                <button onClick={() => setWizardStep(3)} style={styles.linkBtn}>← Back</button>
              </div>
            </div>
          );
        }

        // ── Single-service path (unchanged below) ───────────────────────────
        const hasCalcom = !!selectedService?.calcomSlug && resolveEventType(selectedService.calcomSlug);
        const providers = PROVIDERS[selectedService?.category] || PROVIDERS['other'] || [];
        const locationId = selectedLocation?.id || 'newport';

        return (
          <div>
            <p style={styles.wizardLabel}>
              {selectedServices.length > 1
                ? `${selectedServices.map(s => s.name).join(' + ')} — ${selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0)} min total`
                : `${selectedService?.name} — ${selectedService?.duration} min`}
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
                          borderRadius: '0',
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
                          borderRadius: '0',
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
                                  borderRadius: '0',
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
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '0', fontSize: '13px', color: '#166534' }}>
                    ✓ {formatTimeLabel(apptTime)} with <strong>{selectedProvider.label}</strong>
                  </div>
                )}
              </div>
            )}

            {/* No availability for any provider */}
            {!loadingSlots && hasCalcom && apptDate && availableSlots && availableSlots.length === 0 && !useCustomTime && (
              <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '0', color: '#92400e', fontSize: '13px', textAlign: 'center' }}>
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
                            padding: '6px 14px', borderRadius: '0', fontSize: '12px', cursor: 'pointer',
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
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '0', fontSize: '14px', width: '160px' }}
                />
                <p style={{ fontSize: '11px', color: '#92400e', marginTop: '6px', marginBottom: 0 }}>
                  This will override availability and may double-book the provider.
                </p>
                {selectedProvider && apptTime && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: '#fefce8', borderRadius: '0', fontSize: '13px', color: '#854d0e' }}>
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
                            padding: '6px 14px', borderRadius: '0', fontSize: '12px', cursor: 'pointer',
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

            {/* Visit reason — required */}
            <div style={{ marginBottom: '12px', marginTop: '12px' }}>
              <label style={styles.fieldLabel}>Visit reason — why is this patient coming in? <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="text"
                value={visitReason}
                onChange={e => setVisitReason(e.target.value)}
                placeholder="e.g. Initial lab review, HRT follow-up, first NAD+ IV session"
                style={styles.input}
              />
              {visitReason.trim() === '' && apptDate && apptTime && (
                <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Visit reason is required. Providers need to know why this patient is coming in.</div>
              )}
            </div>

            {/* Modality — required (hidden if already picked at service selection) */}
            {!selectedServices.some(s => s.hasModality) && (
            <div style={{ marginBottom: '12px' }}>
              <label style={styles.fieldLabel}>Modality <span style={{ color: '#dc2626' }}>*</span></label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'in_clinic', label: 'In-Clinic' },
                  { value: 'telemedicine', label: 'Telemedicine' },
                  { value: 'phone', label: 'Phone' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setModality(opt.value)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: modality === opt.value ? '2px solid #000' : '1px solid #d1d5db',
                      background: modality === opt.value ? '#f9fafb' : '#fff',
                      color: '#111',
                      cursor: 'pointer',
                      borderRadius: 0,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {!modality && apptDate && apptTime && (
                <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Modality is required.</div>
              )}
            </div>
            )}

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
                onClick={() => setWizardStep(5)}
                disabled={!apptDate || !apptTime || !visitReason.trim() || !modality || (hasCalcom && !selectedProvider)}
                style={{ ...styles.primaryBtn, opacity: (apptDate && apptTime && visitReason.trim() && modality && (!hasCalcom || selectedProvider)) ? 1 : 0.5 }}
              >
                Next
              </button>
              <button onClick={() => {
                if (selectedServices.length > 1) {
                  setWizardStep(3); // back to per-service provider assignment
                } else {
                  const needsLocation = LOCATION_ENABLED_CATEGORIES.includes(selectedService?.category);
                  setWizardStep(needsLocation ? 2 : 1);
                }
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
              <span style={styles.confirmLabel}>Service{selectedServices.length > 1 ? 's' : ''}</span>
              <span>
                {selectedServices.length > 1 ? (
                  <span>
                    {selectedServices.map((s, i) => (
                      <span key={s.name} style={{ display: 'block', fontSize: i === 0 ? '14px' : '13px', color: i === 0 ? '#111' : '#555' }}>
                        {s.name}
                        <span style={{ fontSize: '11px', color: '#888' }}> ({s.duration} min
                          {selectedProviders[s.name] ? ` · ${selectedProviders[s.name].label}` : ''}
                        )</span>
                      </span>
                    ))}
                  </span>
                ) : selectedService?.name}
              </span>
            </div>
            {panelType && (
              <div style={styles.confirmRow}>
                <span style={styles.confirmLabel}>Lab Panel</span>
                <span>{panelType === 'elite' ? 'Elite Panel ($750)' : 'Essential Panel ($350)'}</span>
              </div>
            )}
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Provider{selectedServices.length > 1 ? 's' : ''}</span>
              <span>
                {selectedServices.length > 1 ? (
                  <span>
                    {selectedServices.map(s => (
                      <span key={s.name} style={{ display: 'block', fontSize: '13px' }}>
                        {selectedProviders[s.name]?.label || '—'} <span style={{ fontSize: '11px', color: '#888' }}>({s.name})</span>
                      </span>
                    ))}
                  </span>
                ) : (selectedProvider?.label || 'N/A')}
              </span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Duration</span>
              <span>{selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0) || selectedService?.duration} min
                {selectedServices.length > 1 && <span style={{ fontSize: '11px', color: '#888', marginLeft: '4px' }}>(combined)</span>}
              </span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Location</span>
              <span>📍 {selectedLocation?.short || 'Newport Beach'}</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Date</span>
              <span>{new Date(apptDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' })}</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Time</span>
              <span>{formatTimeLabel(apptTime)}</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Visit Reason</span>
              <span>{visitReason}</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Modality</span>
              <span>{{ in_clinic: 'In-Clinic', telemedicine: 'Telemedicine', phone: 'Phone' }[modality] || modality}</span>
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
      </>
      )}
    </div>
  );

  // ===================== MAIN RENDER =====================

  // Color legend categories (only show ones that appear in appointments)
  const LEGEND_CATEGORIES = ['hrt', 'weight_loss', 'peptide', 'iv', 'hbot', 'rlt', 'injection', 'labs', 'other'];

  return (
    <div style={wizardOnly ? { ...styles.container, minHeight: 'unset' } : { ...styles.container, flexDirection: 'column' }} className="cal-container">
      {/* Collapsible New Appointment panel */}
      {!wizardOnly && (
        <div style={{
          borderBottom: wizardCollapsed ? 'none' : '1px solid #e5e5e5',
          background: '#fafafa',
        }}>
          <button
            onClick={() => setWizardCollapsed(!wizardCollapsed)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px', background: 'none', border: 'none', borderBottom: '1px solid #e5e5e5',
              cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#1a1a1a',
            }}
          >
            <span>+ New Appointment</span>
            <span style={{ fontSize: '12px', color: '#888', fontWeight: '400' }}>
              {wizardCollapsed ? 'Click to expand' : 'Click to collapse'}
            </span>
          </button>
          {!wizardCollapsed && (
            <div style={{ padding: '20px', maxWidth: '500px' }}>
              {renderWizard()}
            </div>
          )}
        </div>
      )}

      {/* Wizard-only mode (used when embedded elsewhere) */}
      {wizardOnly && (
        <div style={{ ...styles.leftPanel, width: '100%', minWidth: 'unset', borderRight: 'none', maxHeight: 'unset' }} className="cal-left">
          {renderWizard()}
        </div>
      )}

      {/* Calendar Panel — now takes full width */}
      {!wizardOnly && <div style={styles.rightPanel} className="cal-right">
        {/* View toggle + navigation + legend */}
        <div style={styles.calHeader}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
            {viewMode === 'day' && (
              <div style={{
                display: 'flex', borderRadius: 0, overflow: 'hidden',
                border: '1px solid #d1d5db',
              }}>
                <button
                  onClick={() => setCalendarMode('service')}
                  style={{
                    padding: '5px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: calendarMode === 'service' ? '#111' : '#fff',
                    color: calendarMode === 'service' ? '#fff' : '#374151',
                  }}
                >
                  By Service
                </button>
                <button
                  onClick={() => setCalendarMode('employee')}
                  style={{
                    padding: '5px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                    borderLeft: '1px solid #d1d5db',
                    background: calendarMode === 'employee' ? '#111' : '#fff',
                    color: calendarMode === 'employee' ? '#fff' : '#374151',
                  }}
                >
                  By Employee
                </button>
              </div>
            )}
          </div>
          <div style={styles.navRow}>
            <button onClick={() => navigate(-1)} style={styles.navBtn}>&lt;</button>
            <button onClick={goToday} style={styles.todayBtn}>Today</button>
            <button onClick={() => navigate(1)} style={styles.navBtn}>&gt;</button>
            <span style={styles.dateLabel}>
              {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' })}
              {viewMode === 'week' && (() => {
                const ws = getWeekStart(currentDate);
                const we = new Date(ws); we.setDate(we.getDate() + 6);
                return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' })}`;
              })()}
              {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' , timeZone: 'America/Los_Angeles' })}
            </span>
          </div>

          {/* Legend row — service colors + note status */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Service category colors */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {LEGEND_CATEGORIES.map(cat => {
                const cs = CATEGORY_COLORS[cat];
                if (!cs) return null;
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      display: 'inline-block', width: '10px', height: '10px',
                      background: cs.bg, border: `1px solid ${cs.text}40`,
                    }} />
                    <span style={{ fontSize: '11px', color: '#666' }}>{cs.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '16px', background: '#e5e5e5' }} />

            {/* Note status legend */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '14px', height: '14px', borderRadius: '50%', fontSize: '9px',
                  background: '#dcfce7', color: '#16a34a', fontWeight: '700',
                }}>✓</span>
                <span style={{ fontSize: '11px', color: '#666' }}>Signed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '14px', height: '14px', borderRadius: '50%', fontSize: '9px',
                  background: '#fef3c7', color: '#92400e', fontWeight: '700',
                }}>●</span>
                <span style={{ fontSize: '11px', color: '#666' }}>Draft</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '14px', height: '14px', borderRadius: '50%', fontSize: '9px',
                  background: '#fee2e2', color: '#dc2626', fontWeight: '700',
                  border: '1.5px solid #fca5a5',
                }}>!</span>
                <span style={{ fontSize: '11px', color: '#666' }}>Note needed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar content */}
        <div style={styles.calBody} className="cal-body">
          {loading && <div style={styles.loadingOverlay}>Loading...</div>}
          {viewMode === 'day' && calendarMode === 'service' && renderDayView()}
          {viewMode === 'day' && calendarMode === 'employee' && renderEmployeeDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
        </div>
      </div>}

      {/* Detail popover */}
      {renderDetailPopover()}

      {/* Photo ID Viewer overlay */}
      {photoIdViewer && (
        <div onClick={() => setPhotoIdViewer(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', padding: '16px', maxWidth: '500px', maxHeight: '90vh',
            overflow: 'auto', position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{photoIdViewer.title}</span>
              <button onClick={() => setPhotoIdViewer(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#666', padding: '0 4px' }}>&times;</button>
            </div>
            {photoIdViewer.url.match(/\.pdf/i) ? (
              <iframe src={photoIdViewer.url} style={{ width: '100%', height: '60vh', border: '1px solid #e5e5e5' }} />
            ) : (
              <img src={photoIdViewer.url} alt="Photo ID" style={{ width: '100%', height: 'auto', border: '1px solid #e5e5e5' }} />
            )}
          </div>
        </div>
      )}

      {/* Lab Documents picker overlay */}
      {labDocs && (
        <div onClick={() => setLabDocs(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', padding: '20px', width: '400px', maxHeight: '70vh', overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '15px', fontWeight: '600' }}>Lab Documents</span>
              <button onClick={() => setLabDocs(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>&times;</button>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
              {labDocs.length} document{labDocs.length !== 1 ? 's' : ''} on file. Click to open for printing.
            </div>
            {labDocs.map((doc, i) => (
              <button
                key={doc.id || i}
                onClick={() => window.open(doc.url, '_blank')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', marginBottom: '6px', background: '#f9fafb',
                  border: '1px solid #e5e5e5', cursor: 'pointer', fontSize: '13px', textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; }}
              >
                <div>
                  <div style={{ fontWeight: '500', color: '#111' }}>{doc.file_name || doc.lab_type || 'Lab Document'}</div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                    {doc.collection_date ? new Date(doc.collection_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' }) : ''}
                    {doc.panel_type ? ` · ${doc.panel_type}` : ''}
                    {doc.source === 'labs' ? ' · Primex' : ''}
                  </div>
                </div>
                <span style={{ fontSize: '16px', color: '#888' }}>↗</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
        const wlLogs = drawerData?.weightLossLogs || [];
        const purchases = drawerData?.allPurchases || [];
        const upcomingAppts = appts.filter(a => new Date(a.start_time) >= new Date());
        const pastAppts = appts.filter(a => new Date(a.start_time) < new Date());

        const sectionHead = { margin: '0 0 10px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' };
        const card = { background: '#f9fafb', borderRadius: '0', padding: '14px 16px', marginBottom: '16px' };

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
                    {/* Demographics row */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '13px', color: '#666' }}>
                        {pt.date_of_birth && (
                          <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '0' }}>
                            DOB: {new Date(pt.date_of_birth + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' })}
                          </span>
                        )}
                        {pt.gender && <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '0' }}>{pt.gender}</span>}
                        {pt.created_at && (
                          <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '0' }}>
                            Since {new Date(pt.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' , timeZone: 'America/Los_Angeles' })}
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

                      {/* Send SMS composer */}
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
                                    fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '0',
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
                              <div style={{ marginTop: '6px', background: '#e5e7eb', borderRadius: '0', height: '6px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#16a34a' : '#1e40af', borderRadius: '0', transition: 'width 0.3s' }} />
                              </div>
                            )}
                            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                              Started {new Date(proto.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' })}
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

                      // Get injection logs sorted by date
                      const injections = wlLogs.filter(l => l.entry_type === 'injection').sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
                      const weightEntries = wlLogs.filter(l => l.weight).sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
                      const startWeight = weightEntries.length > 0 ? weightEntries[0].weight : null;
                      const currentWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : null;
                      const weightChange = startWeight && currentWeight ? (currentWeight - startWeight).toFixed(1) : null;

                      // Build dose timeline (group consecutive same-dose injections)
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

                          {/* Current dose + injection count */}
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ flex: 1, background: '#fff', padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', letterSpacing: '0.04em', marginBottom: '2px' }}>Current Dose</div>
                              <div style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>
                                {injections.length > 0 ? injections[injections.length - 1].dosage || '—' : proto.selected_dose || proto.dosage || '—'}
                              </div>
                            </div>
                            <div style={{ flex: 1, background: '#fff', padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', letterSpacing: '0.04em', marginBottom: '2px' }}>Injections</div>
                              <div style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>
                                {injections.length}{proto.total_sessions ? ` / ${proto.total_sessions}` : ''}
                              </div>
                            </div>
                          </div>

                          {/* Weight progress */}
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
                              {/* Mini weight sparkline */}
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

                          {/* Dose titration timeline */}
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
                                    {step.count} inj · {new Date(step.firstDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' })}
                                    {step.count > 1 ? ` – ${new Date(step.lastDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' })}` : ''}
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
                              <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>{apt.service_name || apt.title || 'Appointment'}</span>
                              <span style={{ fontSize: '12px', padding: '1px 6px', borderRadius: '0', background: STATUS_LABELS[apt.status]?.bg || '#f3f4f6', color: STATUS_LABELS[apt.status]?.text || '#333' }}>
                                {STATUS_LABELS[apt.status]?.label || apt.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                              {new Date(apt.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' })} at {new Date(apt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' , timeZone: 'America/Los_Angeles' })}
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
                          const amt = parseFloat(p.amount) || 0;
                          const paid = parseFloat(p.amount_paid);
                          const displayAmt = (!isNaN(paid) && paid > 0 && paid < amt) ? paid : amt;
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
                                <span>{p.purchase_date ? new Date(p.purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' }) : ''}</span>
                              </div>
                            </div>
                          );
                        })}
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
                            {new Date(log.entry_date || log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' })}
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
                              <span style={{ fontSize: '13px', color: '#555' }}>{apt.service_name || apt.title || 'Appointment'}</span>
                              {apt.provider && <span style={{ fontSize: '11px', color: '#aaa' }}> · {apt.provider}</span>}
                            </div>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                              {new Date(apt.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' })}
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
                              {new Date(note.note_date || note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' })}
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

      {/* Encounter Note Modal */}
      {encounterAppt && (
        <EncounterModal
          appointment={{ ...encounterAppt, patient_id: encounterAppt.patient_id }}
          currentUser={session?.user?.user_metadata?.full_name || session?.user?.email || 'Staff'}
          onClose={() => setEncounterAppt(null)}
          onRefresh={() => fetchAppointments()}
        />
      )}

      {/* Medication Checkout Modal */}
      <MedicationCheckoutModal
        isOpen={showCheckout}
        onClose={() => { setShowCheckout(false); setCheckoutPatient(null); }}
        preselectedPatient={checkoutPatient}
        onCheckoutComplete={() => {}}
      />
    </div>
  );
}

// ===================== Utility Functions =====================
function formatDateISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getPacificOffset(date) {
  // Determine if date is in PDT or PST by checking the timezone offset
  // Create a date formatter that uses America/Los_Angeles
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'short' });
  const parts = fmt.formatToParts(date);
  const tzName = parts.find(p => p.type === 'timeZoneName')?.value;
  return tzName === 'PDT' ? '-07:00' : '-08:00';
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' , timeZone: 'America/Los_Angeles' });
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
  for (let h = 6; h <= 19; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  slots.push('20:00');
  return slots;
}

// ===================== Styles =====================
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    minHeight: '700px',
    background: '#fff',
    borderRadius: '0',
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
    borderRadius: '0',
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
    borderRadius: '0',
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
    borderRadius: '0',
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
    minHeight: `${15 * 80}px`,
    paddingLeft: '70px',
  },
  hourRow: {
    height: '80px',
    display: 'flex',
    borderBottom: '1px solid #f0f0f0',
  },
  hourLabel: {
    position: 'absolute',
    left: '0',
    width: '65px',
    textAlign: 'right',
    paddingRight: '8px',
    fontSize: '13px',
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
    padding: '8px 12px',
    borderRadius: '0',
    fontSize: '13px',
    cursor: 'pointer',
    overflow: 'hidden',
    zIndex: 5,
    transition: 'box-shadow 0.15s',
  },
  apptBlockName: {
    fontWeight: '600',
    fontSize: '14px',
    lineHeight: '1.3',
  },
  apptBlockService: {
    fontSize: '12px',
    opacity: 0.8,
    marginTop: '2px',
  },
  apptBlockTime: {
    fontSize: '12px',
    opacity: 0.7,
    marginTop: '2px',
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
    minHeight: '600px',
  },
  weekDay: {
    borderRight: '1px solid #f0f0f0',
    minHeight: '500px',
  },
  weekDayToday: {
    background: '#fafafa',
  },
  weekDayHeader: {
    padding: '12px 10px',
    textAlign: 'center',
    borderBottom: '1px solid #f0f0f0',
    background: '#fff',
  },
  weekDayHeaderToday: {
    background: '#000',
    color: '#fff',
  },
  weekDayName: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    display: 'block',
  },
  weekDayNum: {
    fontSize: '20px',
    fontWeight: '600',
    display: 'block',
    marginTop: '2px',
  },
  weekDayBody: {
    padding: '6px',
  },
  weekApptCard: {
    padding: '8px 10px',
    borderRadius: '0',
    marginBottom: '6px',
    cursor: 'pointer',
  },
  // Month view
  monthHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid #e5e5e5',
  },
  monthDayHeader: {
    padding: '10px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '600',
    color: '#888',
  },
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
  },
  monthCell: {
    minHeight: '110px',
    borderRight: '1px solid #f5f5f5',
    borderBottom: '1px solid #f5f5f5',
    padding: '6px',
    textAlign: 'center',
  },
  monthCellToday: {
    background: '#fafafa',
  },
  monthCellNum: {
    fontSize: '14px',
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
    borderRadius: '0',
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
    borderRadius: '0',
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
    borderRadius: '0',
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
    borderRadius: '0',
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
    borderRadius: '0',
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
    borderRadius: '0',
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
    borderRadius: '0',
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
    borderRadius: '0',
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
    borderRadius: '0',
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
