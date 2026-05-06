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
      employee:employees!inner ( id, name, username, is_active )
    `)
    .eq('service_id', svc.id)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`getServiceProviders(${slug}): ${error.message}`);
  return (data || [])
    .filter(r => r.employee?.is_active !== false)
    .map(r => ({
      employeeId: r.employee.id,
      name: r.employee.name,
      username: r.employee.username || null,
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

  // Three sources can make a provider unavailable on a given date:
  //   1. provider_schedule_overrides (the engine's native overrides table)
  //   2. schedule_blocks (the legacy table the admin "Block Schedule"
  //      button writes to — keyed by the provider's calcom_user_id)
  //   3. (fallthrough) no row in provider_schedules for this day = off
  //
  // Run the override + schedule_blocks queries in parallel.
  const [overridesRes, empRes] = await Promise.all([
    supabase
      .from('provider_schedule_overrides')
      .select('type, start_time, end_time, location_id')
      .eq('employee_id', employeeId)
      .eq('override_date', dateStr),
    supabase
      .from('employees')
      .select('calcom_user_id')
      .eq('id', employeeId)
      .maybeSingle(),
  ]);
  if (overridesRes.error) throw new Error(`overrides: ${overridesRes.error.message}`);

  const matchingOverrides = (overridesRes.data || []).filter(o =>
    o.location_id === null || o.location_id === locationId,
  );

  // 'blocked' override → provider is off
  if (matchingOverrides.some(o => o.type === 'blocked')) return [];

  // schedule_blocks lookup (legacy table). Only employees with a
  // calcom_user_id can have entries (the admin UI was Cal.com-keyed).
  let scheduleBlocks = [];
  if (empRes.data?.calcom_user_id) {
    const { data: sb, error: sbErr } = await supabase
      .from('schedule_blocks')
      .select('block_type, start_time, end_time')
      .eq('provider_id', empRes.data.calcom_user_id)
      .eq('date', dateStr);
    if (sbErr) throw new Error(`schedule_blocks: ${sbErr.message}`);
    scheduleBlocks = sb || [];
  }
  // Full-day schedule_block → provider is off
  if (scheduleBlocks.some(b => b.block_type === 'full_day')) return [];

  // Choose the base windows: 'custom_hours' override REPLACES the weekly
  // schedule for that date; otherwise use the recurring weekly rows.
  let windows;
  const customHours = matchingOverrides.filter(o => o.type === 'custom_hours');
  if (customHours.length > 0) {
    windows = customHours.map(o => ({
      startMin: timeToMinutes(o.start_time),
      endMin: timeToMinutes(o.end_time),
    }));
  } else {
    const { data: schedules, error: sErr } = await supabase
      .from('provider_schedules')
      .select('start_time, end_time, effective_from, effective_until')
      .eq('employee_id', employeeId)
      .eq('location_id', locationId)
      .eq('day_of_week', dow)
      .eq('is_active', true);
    if (sErr) throw new Error(`schedules: ${sErr.message}`);
    windows = (schedules || [])
      .filter(s =>
        (!s.effective_from  || s.effective_from  <= dateStr) &&
        (!s.effective_until || s.effective_until >= dateStr),
      )
      .map(s => ({
        startMin: timeToMinutes(s.start_time),
        endMin: timeToMinutes(s.end_time),
      }));
  }

  // Time-range schedule_blocks SUBTRACT from the base windows (e.g.,
  // "block 1pm–3pm Wednesday" leaves 9–1pm and 3–6pm intact).
  const timeRangeBlocks = scheduleBlocks
    .filter(b => b.block_type === 'time_range' && b.start_time && b.end_time)
    .map(b => ({ startMin: timeToMinutes(b.start_time), endMin: timeToMinutes(b.end_time) }));
  if (timeRangeBlocks.length > 0) {
    windows = subtractBlocks(windows, timeRangeBlocks);
  }

  return windows.sort((a, b) => a.startMin - b.startMin);
}

// Subtract a set of [startMin,endMin) blocks from a set of windows.
// Splits a window if a block falls in the middle of it.
function subtractBlocks(windows, blocks) {
  let result = windows.slice();
  for (const block of blocks) {
    const next = [];
    for (const win of result) {
      if (block.endMin <= win.startMin || block.startMin >= win.endMin) {
        next.push(win); // no overlap
      } else if (block.startMin <= win.startMin && block.endMin >= win.endMin) {
        // block fully covers window → drop
      } else if (block.startMin > win.startMin && block.endMin < win.endMin) {
        next.push({ startMin: win.startMin, endMin: block.startMin });
        next.push({ startMin: block.endMin, endMin: win.endMin });
      } else if (block.startMin <= win.startMin) {
        next.push({ startMin: block.endMin, endMin: win.endMin }); // trim front
      } else {
        next.push({ startMin: win.startMin, endMin: block.startMin }); // trim back
      }
    }
    result = next.filter(w => w.endMin > w.startMin);
  }
  return result;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = String(timeStr).split(':').map(Number);
  return h * 60 + (m || 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Service-wide capacity (shared physical resources like HBOT chambers and
// RLT beds). Most services are provider-bound (one provider = one booking
// at a time), so they're modelled with max_concurrent_bookings = 1 and the
// per-provider conflict check below is sufficient. HBOT (2 chambers) and
// RLT (1 bed at NPB) need a service-wide overlap count regardless of
// provider, so two simultaneous bookings can't slip past via different
// providers running through the same physical machine.
// ─────────────────────────────────────────────────────────────────────────────

async function getServiceAppointmentsOnDate(serviceCategory, dateStr) {
  if (!serviceCategory) return [];
  const dayStartUTC = pacificToUTC(dateStr, 0);
  const dayEndUTC   = pacificToUTC(dateStr, 24 * 60);
  const { data, error } = await supabase
    .from('appointments')
    .select('start_time, end_time, status, service_category')
    .eq('service_category', serviceCategory)
    .gte('start_time', dayStartUTC.toISOString())
    .lt('start_time', dayEndUTC.toISOString())
    .in('status', ACTIVE_APPT_STATUSES);
  if (error) throw new Error(`service appointments: ${error.message}`);
  return (data || []).map(a => ({
    startUTC: new Date(a.start_time),
    endUTC:   new Date(a.end_time),
  }));
}

function countConcurrent(slotStartUTC, slotEndUTC, existing) {
  let count = 0;
  for (const appt of existing) {
    if (slotStartUTC.getTime() < appt.endUTC.getTime() &&
        slotEndUTC.getTime()   > appt.startUTC.getTime()) {
      count += 1;
    }
  }
  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// Existing appointments lookup for conflict detection
//
// Matches on the free-text `provider` field (no employee_id column exists
// yet). Historical data uses inconsistent variants — "Lily" vs "Lily Diaz
// RN" vs "Dr. Burgess" vs "Burgess" — so we build a small set of acceptable
// variants per employee and check membership client-side. Cheap because a
// day's appointments are small.
// ─────────────────────────────────────────────────────────────────────────────

function nameVariants(name, extraAliases = []) {
  if (!name) return new Set();
  const parts = name.trim().split(/\s+/);
  const first = parts[0] || '';
  const last  = parts.length > 1 ? parts[parts.length - 1] : '';
  const variants = new Set([
    name,
    first,
    last,
    first && last ? `${first} ${last}` : null,
    last ? `dr. ${last}` : null,
    last ? `dr ${last}` : null,
    ...extraAliases,
  ].filter(Boolean).map(v => v.toLowerCase().trim()));
  return variants;
}

async function getProviderAppointments(employee, dateStr, aliases = []) {
  const dayStartUTC = pacificToUTC(dateStr, 0);
  const dayEndUTC   = pacificToUTC(dateStr, 24 * 60);

  const { data, error } = await supabase
    .from('appointments')
    .select('start_time, end_time, status, provider')
    .gte('start_time', dayStartUTC.toISOString())
    .lt('start_time', dayEndUTC.toISOString())
    .in('status', ACTIVE_APPT_STATUSES);
  if (error) throw new Error(`appointments: ${error.message}`);

  const empName = typeof employee === 'string' ? employee : employee.name;
  const variants = nameVariants(empName, aliases);
  const matched = (data || []).filter(a => {
    if (!a.provider) return false;
    return variants.has(String(a.provider).trim().toLowerCase());
  });

  return matched.map(a => ({
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

  // Service-wide capacity (HBOT = 2 chambers, RLT = 1 bed, etc).
  // Pulled once per request — every per-slot check then counts overlaps
  // against this pre-fetched list instead of hitting the DB again.
  const capacity = Math.max(1, Number(service.max_concurrent_bookings) || 1);
  const sameServiceAppts = await getServiceAppointmentsOnDate(service.category, date);

  // Per-provider slot computation
  const byProvider = {};
  for (const prov of providers) {
    const windows = await getWorkingWindows(prov.employeeId, locationId, date);
    if (windows.length === 0) {
      byProvider[prov.employeeId] = [];
      continue;
    }
    const existing = await getProviderAppointments(prov, date, [prov.displayLabel]);

    const slots = [];
    for (const win of windows) {
      let cur = win.startMin;
      while (cur + service.duration_minutes <= win.endMin) {
        const slotStart = pacificToUTC(date, cur);
        const slotEnd   = pacificToUTC(date, cur + service.duration_minutes);

        const passesNotice = slotStart.getTime() >= earliestUTC.getTime();
        const passesConflict = !overlapsExisting(slotStart, slotEnd, existing, service.buffer_minutes);
        const passesCapacity = countConcurrent(slotStart, slotEnd, sameServiceAppts) < capacity;

        if (passesNotice && passesConflict && passesCapacity) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            providerId: prov.employeeId,
            providerName: prov.displayLabel,
            // CalendarView matches host.username (from event-types) against
            // providerFirstName here. employees.username is the slug for
            // both, so they line up exactly. Fall back to first-name-of-
            // full-name for any provider that hasn't been backfilled yet.
            providerFirstName: prov.username
              || (prov.name || '').trim().split(/\s+/)[0].toLowerCase(),
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

  // Service-wide capacity check (HBOT = 2 chambers, RLT = 1 bed). If the
  // physical resource is already saturated for this slot, no provider can
  // accept the booking.
  const capacity = Math.max(1, Number(service.max_concurrent_bookings) || 1);
  const sameServiceAppts = await getServiceAppointmentsOnDate(service.category, date);
  if (countConcurrent(startUTC, endUTC, sameServiceAppts) >= capacity) return null;

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

    const existing = await getProviderAppointments(prov, date, [prov.displayLabel]);
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

  // Service-wide capacity (chambers / beds).
  const capacity = Math.max(1, Number(service.max_concurrent_bookings) || 1);
  const sameServiceAppts = await getServiceAppointmentsOnDate(service.category, date);
  if (countConcurrent(startUTC, endUTC, sameServiceAppts) >= capacity) return false;

  // Provider lookup
  const { data: emp } = await supabase
    .from('employees').select('id, name').eq('id', employeeId).single();
  if (!emp) return false;

  const existing = await getProviderAppointments(emp, date);
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
