// lib/scheduling.js
// Range Medical — native scheduling engine (Cal.com replacement)
//
// All scheduling logic is data-driven from the new tables created in
// migrations/05032026-create-scheduling-tables.sql:
//   services, service_providers, provider_schedules,
//   provider_schedule_overrides, locations, appointments
//
// Public API (matches lib/calcom.js shape where possible to ease cutover):
//   getServiceBySlug(slug)
//   getServiceProviders(slug)
//   getAvailableSlots({ serviceSlug, date, locationId, providerId, slotIntervalMinutes })
//       → { slots: { [date]: [{ start, end }] }, byProvider: { [empId]: [...] } }
//   pickProviderForSlot({ serviceSlug, startISO, locationId })
//       → least-busy eligible provider for round-robin assignment
//   isSlotAvailable({ serviceSlug, employeeId, startISO })

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PT = 'America/Los_Angeles';
const ACTIVE_APPT_STATUSES = ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed'];

// ─────────────────────────────────────────────────────────────────────────────
// Time-zone helpers (Pacific is the clinic's wall-clock)
// ─────────────────────────────────────────────────────────────────────────────

// Returns the UTC offset of Pacific time (in minutes) for the given UTC
// moment, using the standard signed convention. PST = -480, PDT = -420.
function pacificOffsetMinutes(utcDate) {
  const ptStr = utcDate.toLocaleString('sv-SE', { timeZone: PT }); // "YYYY-MM-DD HH:MM:SS"
  const ptAsUtc = new Date(ptStr.replace(' ', 'T') + 'Z').getTime();
  return Math.round((ptAsUtc - utcDate.getTime()) / 60_000);
}

// Convert a Pacific wall-clock date + minutes-since-midnight to a real UTC Date.
function pacificToUTC(dateStr, minutesSinceMidnight) {
  const hh = String(Math.floor(minutesSinceMidnight / 60)).padStart(2, '0');
  const mm = String(minutesSinceMidnight % 60).padStart(2, '0');
  // Pretend the wall clock is UTC, then subtract Pacific's offset to get real UTC
  const naive = new Date(`${dateStr}T${hh}:${mm}:00Z`);
  const offset = pacificOffsetMinutes(naive);
  return new Date(naive.getTime() - offset * 60_000);
}

// Convert a real UTC moment to (Pacific date, minutes-since-midnight).
function utcToPacific(utcDate) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: PT,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const parts = Object.fromEntries(f.formatToParts(utcDate).map(p => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10),
  };
}

function todayPacificDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: PT });
}

function dayOfWeekPacific(dateStr) {
  // Day of week for the Pacific wall-clock date (0=Sun, 6=Sat).
  // Use noon Pacific to avoid DST edge cases at midnight.
  const noonPT = pacificToUTC(dateStr, 12 * 60);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: PT, weekday: 'short' })
    .format(noonPT)
    .toLowerCase()
    .slice(0, 3);
  const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  return map[weekday] ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service + provider lookups
// ─────────────────────────────────────────────────────────────────────────────

export async function getServiceBySlug(slug) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new Error(`getServiceBySlug(${slug}): ${error.message}`);
  return data;
}

export async function getServiceProviders(slug) {
  const svc = await getServiceBySlug(slug);
  if (!svc) return [];
  const { data, error } = await supabase
    .from('service_providers')
    .select(`
      sort_order, display_label,
      employee:employees!inner ( id, name, is_active )
    `)
    .eq('service_id', svc.id)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`getServiceProviders(${slug}): ${error.message}`);
  return (data || [])
    .filter(r => r.employee?.is_active !== false)
    .map(r => ({
      employeeId: r.employee.id,
      name: r.employee.name,
      displayLabel: r.display_label || r.employee.name,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Schedule resolution: working windows for an employee on a given Pacific date
// Returns array of { startMin, endMin } in minutes-since-midnight Pacific.
// Empty array = provider is off this day at this location.
// ─────────────────────────────────────────────────────────────────────────────

async function getWorkingWindows(employeeId, locationId, dateStr) {
  const dow = dayOfWeekPacific(dateStr);

  // Check overrides first — they trump the weekly schedule.
  const { data: overrides, error: oErr } = await supabase
    .from('provider_schedule_overrides')
    .select('type, start_time, end_time, location_id')
    .eq('employee_id', employeeId)
    .eq('override_date', dateStr);
  if (oErr) throw new Error(`overrides: ${oErr.message}`);

  const matchingOverrides = (overrides || []).filter(o =>
    o.location_id === null || o.location_id === locationId
  );

  // 'blocked' override → provider is off, regardless of weekly schedule
  if (matchingOverrides.some(o => o.type === 'blocked')) return [];

  // 'custom_hours' override → use those instead of weekly schedule
  const customHours = matchingOverrides.filter(o => o.type === 'custom_hours');
  if (customHours.length > 0) {
    return customHours.map(o => ({
      startMin: timeToMinutes(o.start_time),
      endMin: timeToMinutes(o.end_time),
    }));
  }

  // Otherwise read the weekly schedule
  const { data: schedules, error: sErr } = await supabase
    .from('provider_schedules')
    .select('start_time, end_time, effective_from, effective_until')
    .eq('employee_id', employeeId)
    .eq('location_id', locationId)
    .eq('day_of_week', dow)
    .eq('is_active', true);
  if (sErr) throw new Error(`schedules: ${sErr.message}`);

  return (schedules || [])
    .filter(s =>
      (!s.effective_from  || s.effective_from  <= dateStr) &&
      (!s.effective_until || s.effective_until >= dateStr)
    )
    .map(s => ({
      startMin: timeToMinutes(s.start_time),
      endMin: timeToMinutes(s.end_time),
    }))
    .sort((a, b) => a.startMin - b.startMin);
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = String(timeStr).split(':').map(Number);
  return h * 60 + (m || 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Existing appointments lookup for conflict detection
// Match by provider name (text) since appointments.employee_id doesn't exist yet.
// Returns: array of { startUTC, endUTC } for the date.
// ─────────────────────────────────────────────────────────────────────────────

async function getProviderAppointments(employeeName, dateStr) {
  // Window: Pacific midnight that day → Pacific midnight next day
  const dayStartUTC = pacificToUTC(dateStr, 0);
  const dayEndUTC   = pacificToUTC(dateStr, 24 * 60);

  const { data, error } = await supabase
    .from('appointments')
    .select('start_time, end_time, status, provider')
    .gte('start_time', dayStartUTC.toISOString())
    .lt('start_time', dayEndUTC.toISOString())
    .in('status', ACTIVE_APPT_STATUSES)
    .ilike('provider', employeeName);  // case-insensitive exact match
  if (error) throw new Error(`appointments: ${error.message}`);

  return (data || []).map(a => ({
    startUTC: new Date(a.start_time),
    endUTC:   new Date(a.end_time),
  }));
}

function overlapsExisting(slotStartUTC, slotEndUTC, existing, bufferMinutes) {
  const bufferMs = bufferMinutes * 60_000;
  for (const appt of existing) {
    const apptStart = appt.startUTC.getTime() - bufferMs;
    const apptEnd   = appt.endUTC.getTime() + bufferMs;
    if (slotStartUTC.getTime() < apptEnd && slotEndUTC.getTime() > apptStart) {
      return true;
    }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main: getAvailableSlots
// ─────────────────────────────────────────────────────────────────────────────

export async function getAvailableSlots({
  serviceSlug,
  date,                       // YYYY-MM-DD (Pacific)
  locationId = 'newport',
  providerId = null,          // restrict to one provider (employee.id) if set
  slotIntervalMinutes = null, // defaults to service.duration_minutes
}) {
  if (!serviceSlug || !date) {
    throw new Error('serviceSlug and date required');
  }

  const service = await getServiceBySlug(serviceSlug);
  if (!service) {
    return { slots: { [date]: [] }, byProvider: {}, error: 'service_not_found' };
  }

  // Validate date is within booking window + not in the past
  const today = todayPacificDate();
  if (date < today) {
    return { slots: { [date]: [] }, byProvider: {}, reason: 'date_in_past' };
  }
  const maxDate = addDaysPacific(today, service.booking_window_days);
  if (date > maxDate) {
    return { slots: { [date]: [] }, byProvider: {}, reason: 'outside_booking_window' };
  }

  // Eligible providers (filter to one if requested)
  let providers = await getServiceProviders(serviceSlug);
  if (providerId) providers = providers.filter(p => p.employeeId === providerId);
  if (providers.length === 0) {
    return { slots: { [date]: [] }, byProvider: {}, reason: 'no_providers' };
  }

  // Slot interval defaults to min(30, duration). This matches Cal.com's
  // default event-type frequency, so a 60-min HBOT offers starts at :00
  // and :30 (overlapping windows; only one can be booked), while a 15-min
  // injection offers starts every 15 min.
  const interval = slotIntervalMinutes
    || Math.min(30, service.duration_minutes);
  const minNoticeMs = (service.min_notice_hours || 0) * 3600 * 1000;
  const earliestUTC = new Date(Date.now() + minNoticeMs);

  // Per-provider slot computation
  const byProvider = {};
  for (const prov of providers) {
    const windows = await getWorkingWindows(prov.employeeId, locationId, date);
    if (windows.length === 0) {
      byProvider[prov.employeeId] = [];
      continue;
    }
    const existing = await getProviderAppointments(prov.name, date);

    const slots = [];
    for (const win of windows) {
      let cur = win.startMin;
      while (cur + service.duration_minutes <= win.endMin) {
        const slotStart = pacificToUTC(date, cur);
        const slotEnd   = pacificToUTC(date, cur + service.duration_minutes);

        const passesNotice = slotStart.getTime() >= earliestUTC.getTime();
        const passesConflict = !overlapsExisting(slotStart, slotEnd, existing, service.buffer_minutes);

        if (passesNotice && passesConflict) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            providerId: prov.employeeId,
            providerName: prov.displayLabel,
          });
        }
        cur += interval;
      }
    }
    byProvider[prov.employeeId] = slots;
  }

  // Combined view: union of all providers' slots (dedupe by start time)
  const seen = new Set();
  const combined = [];
  for (const slots of Object.values(byProvider)) {
    for (const s of slots) {
      if (seen.has(s.start)) continue;
      seen.add(s.start);
      combined.push({ start: s.start, end: s.end });
    }
  }
  combined.sort((a, b) => a.start.localeCompare(b.start));

  return {
    slots: { [date]: combined },
    byProvider,
    service: { slug: service.slug, name: service.name, duration: service.duration_minutes },
  };
}

function addDaysPacific(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// pickProviderForSlot — round-robin host assignment (replaces Cal.com's
// auto-assign). Picks the eligible provider with the fewest appointments
// that day at the requested location.
// ─────────────────────────────────────────────────────────────────────────────

export async function pickProviderForSlot({ serviceSlug, startISO, locationId = 'newport' }) {
  const service = await getServiceBySlug(serviceSlug);
  if (!service) return null;

  const startUTC = new Date(startISO);
  const { date } = utcToPacific(startUTC);
  const endUTC = new Date(startUTC.getTime() + service.duration_minutes * 60_000);

  const providers = await getServiceProviders(serviceSlug);
  if (providers.length === 0) return null;

  const candidates = [];
  for (const prov of providers) {
    const windows = await getWorkingWindows(prov.employeeId, locationId, date);
    if (windows.length === 0) continue;

    // Slot must fall fully within one of the windows
    const startMin = utcToPacific(startUTC).minutes;
    const endMin   = startMin + service.duration_minutes;
    const inWindow = windows.some(w => startMin >= w.startMin && endMin <= w.endMin);
    if (!inWindow) continue;

    const existing = await getProviderAppointments(prov.name, date);
    if (overlapsExisting(startUTC, endUTC, existing, service.buffer_minutes)) continue;

    candidates.push({ ...prov, dayLoad: existing.length });
  }
  if (candidates.length === 0) return null;

  // Least-busy first; ties broken by service_providers.sort_order
  candidates.sort((a, b) => a.dayLoad - b.dayLoad);
  return {
    employeeId: candidates[0].employeeId,
    name: candidates[0].name,
    displayLabel: candidates[0].displayLabel,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// isSlotAvailable — final-check before creating a booking (race-safe)
// ─────────────────────────────────────────────────────────────────────────────

export async function isSlotAvailable({ serviceSlug, employeeId, startISO, locationId = 'newport' }) {
  const service = await getServiceBySlug(serviceSlug);
  if (!service) return false;

  const startUTC = new Date(startISO);
  const endUTC = new Date(startUTC.getTime() + service.duration_minutes * 60_000);
  const { date } = utcToPacific(startUTC);

  const windows = await getWorkingWindows(employeeId, locationId, date);
  if (windows.length === 0) return false;

  const startMin = utcToPacific(startUTC).minutes;
  const endMin   = startMin + service.duration_minutes;
  const inWindow = windows.some(w => startMin >= w.startMin && endMin <= w.endMin);
  if (!inWindow) return false;

  // Provider name lookup
  const { data: emp } = await supabase
    .from('employees').select('name').eq('id', employeeId).single();
  if (!emp) return false;

  const existing = await getProviderAppointments(emp.name, date);
  return !overlapsExisting(startUTC, endUTC, existing, service.buffer_minutes);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test export (exposed for tooling/scripts)
// ─────────────────────────────────────────────────────────────────────────────
export const _internals = {
  pacificToUTC,
  utcToPacific,
  dayOfWeekPacific,
  timeToMinutes,
  overlapsExisting,
  getWorkingWindows,
  getProviderAppointments,
};
