// /pages/api/admin/wl-tracker.js
// Weight Loss take-home tracker dashboard API.
//
// GET  ?week_start=YYYY-MM-DD
//        Returns: roster of all take-home WL patients with status for the
//        requested week, plus completion stats and payment-due summary.
//
// POST { action, protocol_id, ... } supported actions:
//   - send_now:               trigger an immediate check-in SMS
//   - mark_completed:         log a check-in on behalf of patient (weight, side_effects, note)
//   - skip_week:              mark this cycle as intentionally skipped
//   - toggle_reminder:        flip checkin_reminder_enabled (bulk on/off)
//   - set_opt_out:            patient explicitly declined SMS (with reason)
//   - update_injection_day:   set the day-of-week anchor
//
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { requireAuth, logAction } from '../../../lib/auth';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { parseFrequencyDays } from '../../../lib/protocol-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Returns YYYY-MM-DD for a given UTC Date as observed in Pacific time.
// 'en-CA' locale conveniently formats as YYYY-MM-DD.
function formatPacificDate(utcDate) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(utcDate);
}

function todayPacificISO() {
  return formatPacificDate(new Date());
}

function startOfWeek(dateISO) {
  // Returns the Sunday of the week containing dateISO (in ISO YYYY-MM-DD)
  const d = new Date(dateISO + 'T12:00:00');
  const dayOfWeek = d.getDay();
  d.setDate(d.getDate() - dayOfWeek);
  return d.toISOString().split('T')[0];
}

function addDaysISO(dateISO, days) {
  const d = new Date(dateISO + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysBetween(aISO, bISO) {
  const a = new Date(aISO + 'T12:00:00');
  const b = new Date(bISO + 'T12:00:00');
  return Math.round((b - a) / 86400000);
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
}

// Compute the "expected injection date" for a given protocol within the requested week.
// For weekly cadence: returns the date in the week matching injection_day.
// For 10/14-day cadence: walks forward from a known anchor (last reminder OR start_date)
// and returns the first scheduled date that falls within the week (or null).
function computeExpectedDateInWeek(protocol, weekStartISO, weekEndISO, lastOriginalSentISO) {
  const cadenceDays = (Number.isInteger(protocol.checkin_cadence_days) && protocol.checkin_cadence_days > 0)
    ? protocol.checkin_cadence_days
    : parseFrequencyDays(protocol.frequency);

  // Weekly with a named injection_day → trivial lookup
  if (cadenceDays === 7 && protocol.injection_day) {
    const dayIdx = DAY_NAMES.indexOf(protocol.injection_day);
    if (dayIdx >= 0) {
      // weekStartISO is Sunday (day 0). injection day index = offset.
      return addDaysISO(weekStartISO, dayIdx);
    }
  }

  // No anchor at all → can't compute
  const anchor = lastOriginalSentISO || protocol.start_date;
  if (!anchor) return null;

  // Walk forward from the anchor in cadence-day steps until we land in the week
  let candidate = anchor;
  // Snap forward if anchor is before the week start
  if (candidate < weekStartISO) {
    const daysToAdvance = daysBetween(candidate, weekStartISO);
    const steps = Math.ceil(daysToAdvance / cadenceDays);
    candidate = addDaysISO(candidate, steps * cadenceDays);
  }
  if (candidate >= weekStartISO && candidate <= weekEndISO) return candidate;
  return null;
}

function computePaymentStatus(protocol, cadenceDays, lastPurchaseAmountPaid) {
  // total_sessions = injections paid for in the current period
  // sessions_used  = injections logged via service_log
  const total = Number(protocol.total_sessions || 0);
  const used = Number(protocol.sessions_used || 0);
  const remaining = Math.max(0, total - used);

  if (lastPurchaseAmountPaid === 0 && total > 0) {
    return { state: 'comp', label: 'Comp', sessions_remaining: remaining, total, used, days_until_due: null };
  }

  if (total === 0) {
    return { state: 'unknown', label: 'No plan', sessions_remaining: 0, total, used, days_until_due: null };
  }

  if (used >= total) {
    return { state: 'overdue', label: 'Renewal due', sessions_remaining: 0, total, used, days_until_due: 0 };
  }

  const days_until_due = remaining * cadenceDays;
  let state, label;
  if (days_until_due <= 7) {
    state = 'due_now';
    label = `Due in ${days_until_due}d — reach out`;
  } else if (days_until_due <= 14) {
    state = 'due_soon';
    label = `Due in ${days_until_due}d`;
  } else {
    state = 'paid';
    label = `Covered ${days_until_due}d`;
  }
  return { state, label, sessions_remaining: remaining, total, used, days_until_due };
}

// Inspect the current/most-recent cycle and return the per-event sent times
// plus a `today_action` enum that tells the dashboard what the cron did today
// (or what still needs human attention).
//
// today_action values:
//   - 'auto_sent_today'       cron sent the original today
//   - 'auto_nudged_today'     cron sent the 1st nudge today
//   - 'auto_final_today'      cron sent the final nudge today
//   - 'completed_today'       patient logged a check-in today
//   - 'waiting'               sent earlier in cycle, no auto-action today, no response yet
//   - 'will_send_today'       today is the injection day, cron hasn't run yet (before ~10am PT)
//   - 'cron_skipped_today'    today is the injection day, cron should have run, didn't
//   - 'needs_setup'           reminders enabled but no injection_day set
//   - 'reminders_off'         reminders disabled (intentionally or not)
//   - 'opted_out'             patient explicitly declined SMS
//   - 'missed'                cycle expired without a check-in
//   - 'idle'                  upcoming this week, nothing to do today
function computeCycleEvents({ expectedDateISO, todayISO, cadenceDays, reminderLogs, checkinLogs, protocol }) {
  // Current LA hour, formatted directly from the UTC instant to avoid the
  // toLocaleString/new Date roundtrip bug that bit us with sent_time.
  const ptHour = parseInt(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', hour: 'numeric', hour12: false,
  }).format(new Date()), 10);
  const cronShouldHaveRun = ptHour >= 10;

  // Reminder + opt-out gates first — they trump cycle math
  if (protocol.reminder_opt_out) {
    return { today_action: 'opted_out', original: null, nudge1: null, nudge2: null };
  }
  if (!protocol.checkin_reminder_enabled) {
    return { today_action: 'reminders_off', original: null, nudge1: null, nudge2: null };
  }
  if (!protocol.injection_day && !expectedDateISO) {
    return { today_action: 'needs_setup', original: null, nudge1: null, nudge2: null };
  }

  if (!expectedDateISO) {
    return { today_action: 'idle', original: null, nudge1: null, nudge2: null };
  }

  // Logs scoped to current cycle
  const cycleEndISO = addDaysISO(expectedDateISO, cadenceDays - 1);
  const cycleLogs = reminderLogs.filter(r => r.sent_date >= expectedDateISO && r.sent_date <= cycleEndISO);
  const original = cycleLogs.find(l => l.nudge_level === 0) || null;
  const nudge1 = cycleLogs.find(l => l.nudge_level === 1) || null;
  const nudge2 = cycleLogs.find(l => l.nudge_level === 2) || null;
  const cycleCheckin = checkinLogs.find(c => c.entry_date >= expectedDateISO && c.entry_date <= cycleEndISO) || null;

  // Patient logged today → trumps everything
  if (cycleCheckin && cycleCheckin.entry_date === todayISO) {
    return { today_action: 'completed_today', original, nudge1, nudge2, checkin: cycleCheckin };
  }

  // Cron sent something today
  if (nudge2 && nudge2.sent_date === todayISO) {
    return { today_action: 'auto_final_today', original, nudge1, nudge2 };
  }
  if (nudge1 && nudge1.sent_date === todayISO) {
    return { today_action: 'auto_nudged_today', original, nudge1, nudge2 };
  }
  if (original && original.sent_date === todayISO) {
    return { today_action: 'auto_sent_today', original, nudge1, nudge2 };
  }

  // Original was due today but didn't fire
  if (expectedDateISO === todayISO && !original) {
    return {
      today_action: cronShouldHaveRun ? 'cron_skipped_today' : 'will_send_today',
      original, nudge1, nudge2,
    };
  }

  // Past final nudge with no response = missed
  if (todayISO > cycleEndISO && !cycleCheckin) {
    return { today_action: 'missed', original, nudge1, nudge2 };
  }

  // Sent earlier this cycle, in flight, nothing happening today
  if (original) {
    return { today_action: 'waiting', original, nudge1, nudge2, checkin: cycleCheckin };
  }

  return { today_action: 'idle', original, nudge1, nudge2 };
}

// In-clinic patients are tracked off appointments + encounter notes, not SMS.
// Returns { today_action, today_appt, recent_unlogged, no_shows, upcoming, last_visit }.
//
// today_action values (in-clinic):
//   - 'visit_today_logged'    appointment today, encounter note exists
//   - 'visit_today_pending'   appointment today, no note yet (in progress / upcoming)
//   - 'visit_unlogged_recent' visit happened in past 14 days, no encounter note (manual attention)
//   - 'no_show_recent'        no-show in past 14 days needs reschedule
//   - 'upcoming_this_week'    visit scheduled later this week
//   - 'idle'                  no recent or upcoming visits in window
function computeVisitStatus({ appointments, todayISO }) {
  const today = appointments.filter(a => a.date === todayISO);
  const past = appointments.filter(a => a.date < todayISO);
  const future = appointments.filter(a => a.date > todayISO);
  const cutoff14 = (() => {
    const d = new Date(todayISO + 'T12:00:00');
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  })();

  // Most recent visit that DID get a note attached. If it's newer than an
  // unlogged visit, that older gap is stale — the provider is clearly caught
  // up — so we don't keep nagging about it.
  const lastLoggedDate = past
    .filter(a => a.has_note)
    .map(a => a.date)
    .sort()
    .pop() || null;

  const recentUnlogged = past.filter(a =>
    a.date >= cutoff14 &&
    !a.has_note &&
    !['cancelled', 'no_show', 'rescheduled'].includes(a.status) &&
    (!lastLoggedDate || a.date > lastLoggedDate)
  );
  // Same suppression rule for no-shows: if there's a more recent logged visit,
  // the patient already came back, no reschedule needed.
  const recentNoShows = past.filter(a =>
    a.date >= cutoff14 &&
    a.status === 'no_show' &&
    (!lastLoggedDate || a.date > lastLoggedDate)
  );
  const lastVisit = past.find(a => a.has_note) || null;
  const upcomingThisWeek = future.slice(0, 5);
  const todayAppt = today[0] || null;

  let today_action = 'idle';
  if (todayAppt) {
    today_action = todayAppt.has_note ? 'visit_today_logged' : 'visit_today_pending';
  } else if (recentUnlogged.length > 0) {
    today_action = 'visit_unlogged_recent';
  } else if (recentNoShows.length > 0) {
    today_action = 'no_show_recent';
  } else if (upcomingThisWeek.length > 0) {
    today_action = 'upcoming_this_week';
  }

  return {
    today_action,
    today_appt: todayAppt,
    recent_unlogged: recentUnlogged,
    no_shows: recentNoShows,
    upcoming: upcomingThisWeek,
    last_visit: lastVisit,
  };
}

// Walk a list of injection dates (DESC) and count how many consecutive
// injections fall within 2× the cadence of each other. The "2x" tolerance
// allows for normal scheduling slack (1 week off for a holiday, etc.).
function computeStreak(injectionDatesDesc, cadenceDays) {
  if (!injectionDatesDesc || injectionDatesDesc.length === 0) return 0;
  const tolerance = Math.max(cadenceDays * 2, 14);
  let streak = 1;
  for (let i = 1; i < injectionDatesDesc.length; i++) {
    const gap = daysBetween(injectionDatesDesc[i], injectionDatesDesc[i - 1]);
    if (gap <= tolerance) streak++;
    else break;
  }
  return streak;
}

// Compute display status for a given expected date within the week.
function computeCellStatus({
  expectedDateISO, todayISO, cadenceDays, reminderLogs, checkinLogs,
}) {
  if (!expectedDateISO) return { status: 'no_schedule', label: 'No injection day' };

  // Reminder logs scoped to this cycle (expectedDate to expectedDate + cadence - 1)
  const cycleEndISO = addDaysISO(expectedDateISO, cadenceDays - 1);
  const cycleLogs = reminderLogs.filter(r =>
    r.sent_date >= expectedDateISO && r.sent_date <= cycleEndISO
  );
  const cycleCheckins = checkinLogs.filter(c =>
    c.entry_date >= expectedDateISO && c.entry_date <= cycleEndISO
  );

  const original = cycleLogs.find(l => l.nudge_level === 0);
  const nudge1 = cycleLogs.find(l => l.nudge_level === 1);
  const nudge2 = cycleLogs.find(l => l.nudge_level === 2);
  const checkin = cycleCheckins[0]; // earliest in cycle

  // Future
  if (expectedDateISO > todayISO) {
    return {
      status: 'upcoming',
      label: 'Upcoming',
      expected_date: expectedDateISO,
    };
  }

  // Completed
  if (checkin) {
    const lateBy = daysBetween(expectedDateISO, checkin.entry_date);
    return {
      status: lateBy >= 2 ? 'late' : 'completed',
      label: lateBy >= 2 ? `Logged ${lateBy}d late` : 'Completed',
      expected_date: expectedDateISO,
      checkin_date: checkin.entry_date,
      weight: checkin.weight,
      notes: checkin.notes,
      late_by_days: lateBy,
    };
  }

  // Missed (cycle ended without check-in)
  if (todayISO > cycleEndISO) {
    return { status: 'missed', label: 'Missed', expected_date: expectedDateISO };
  }

  // In-flight, ranked by most recent action
  if (nudge2) return { status: 'final_nudged', label: 'Final nudge sent', expected_date: expectedDateISO };
  if (nudge1) return { status: 'nudged', label: 'Nudged', expected_date: expectedDateISO };
  if (original) return { status: 'sent', label: 'Reminder sent', expected_date: expectedDateISO };

  // No original yet — should send today
  if (expectedDateISO === todayISO) {
    return { status: 'due_today', label: 'Send today', expected_date: expectedDateISO };
  }

  // Original was due in the past but never sent (e.g., cron failure or just-enabled)
  return { status: 'overdue_send', label: 'Reminder overdue', expected_date: expectedDateISO };
}

// ───────────────────────── Handler ─────────────────────────

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  if (req.method === 'GET') return handleGet(req, res, employee);
  if (req.method === 'POST') return handlePost(req, res, employee);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res) {
  const todayISO = todayPacificISO();
  const requestedWeekStart = req.query.week_start || startOfWeek(todayISO);
  const weekStart = startOfWeek(requestedWeekStart);
  const weekEnd = addDaysISO(weekStart, 6);

  // mode: 'take_home' (default, SMS reminders) or 'in_clinic' (appointment-based).
  // Hybrid patients show in BOTH tabs since they alternate between flows.
  const mode = req.query.mode === 'in_clinic' ? 'in_clinic' : 'take_home';

  // For 4-week trend
  const fourWeeksAgo = addDaysISO(weekStart, -28);

  try {
    // 1. Pull active WL protocols matching the mode.
    //   take_home: delivery_method != 'in_clinic' (includes hybrid + nulls)
    //   in_clinic: delivery_method in ('in_clinic', 'hybrid')
    let protocolQuery = supabase
      .from('protocols')
      .select(`
        id, patient_id, program_name, program_type, medication, selected_dose,
        frequency, checkin_cadence_days, injection_day, start_date, end_date,
        delivery_method, total_sessions, sessions_used,
        checkin_reminder_enabled, reminder_opt_out, reminder_opt_out_reason,
        patients!inner ( id, name, first_name, last_name, phone, ghl_contact_id )
      `)
      .eq('status', 'active')
      .ilike('program_type', 'weight_loss%')
      .order('start_date', { ascending: false });

    if (mode === 'in_clinic') {
      protocolQuery = protocolQuery.in('delivery_method', ['in_clinic', 'hybrid']);
    } else {
      protocolQuery = protocolQuery.or('delivery_method.neq.in_clinic,delivery_method.is.null');
    }

    const { data: protocols, error: protoErr } = await protocolQuery;

    if (protoErr) throw new Error('Protocols query: ' + protoErr.message);

    const patientIds = protocols.map(p => p.patient_id);

    if (patientIds.length === 0) {
      return res.status(200).json({
        mode,
        week_start: weekStart, week_end: weekEnd, today: todayISO,
        patients: [], stats: emptyStats(), trend: [],
      });
    }

    // 2. Pull reminder logs for all patients (this week + prior weeks for context)
    const { data: reminderLogsRaw } = await supabase
      .from('checkin_reminders_log')
      .select('protocol_id, patient_id, sent_at, nudge_level, status')
      .in('patient_id', patientIds)
      .eq('status', 'sent')
      .gte('sent_at', fourWeeksAgo + 'T00:00:00')
      .order('sent_at', { ascending: false });

    // 3. Pull check-in service logs (4 weeks of context)
    const { data: checkinLogsRaw } = await supabase
      .from('service_logs')
      .select('id, patient_id, entry_date, weight, notes, created_at')
      .in('patient_id', patientIds)
      .eq('category', 'weight_loss')
      .eq('entry_type', 'weight_check')
      .gte('entry_date', fourWeeksAgo)
      .order('entry_date', { ascending: false });

    // 4. Pull most recent WL purchase per patient (for comp detection)
    const { data: purchasesRaw } = await supabase
      .from('purchases')
      .select('patient_id, purchase_date, amount_paid, quantity')
      .in('patient_id', patientIds)
      .eq('category', 'weight_loss')
      .order('purchase_date', { ascending: false });
    const lastPurchaseByPatient = {};
    for (const p of (purchasesRaw || [])) {
      if (!lastPurchaseByPatient[p.patient_id]) lastPurchaseByPatient[p.patient_id] = p;
    }

    // 4b. In-clinic mode: pull WL appointments + their encounter notes for the
    // current week ± a 7-day buffer so we can show "needs encounter logged" and
    // "no-show needs reschedule" for the recent past as well as upcoming.
    let appointmentsByPatient = {};
    let injectionsByPatient = {};   // for streak computation
    if (mode === 'in_clinic') {
      const apptStart = addDaysISO(weekStart, -14);  // 14 days back so we can flag stale unlogged visits
      const apptEnd = addDaysISO(weekEnd, 14);       // 14 days forward for "coming up"

      const { data: appts } = await supabase
        .from('appointments')
        .select('id, patient_id, service_name, service_category, provider, start_time, end_time, status, visit_group_id')
        .in('patient_id', patientIds)
        .gte('start_time', apptStart + 'T00:00:00Z')
        .lte('start_time', apptEnd + 'T23:59:59Z')
        .order('start_time', { ascending: true });

      // Filter to WL-flavored appointments. service_category is canonical;
      // service_name fallback catches older rows where category wasn't set.
      const wlAppts = (appts || []).filter(a =>
        a.service_category === 'weight_loss' ||
        (a.service_name || '').toLowerCase().includes('weight loss')
      );

      // Pull encounter notes for those appointments so we can flag visits that
      // happened but Lily didn't document yet.
      const apptIds = wlAppts.map(a => a.id);
      let notedAppointmentIds = new Set();
      if (apptIds.length > 0) {
        const { data: notes } = await supabase
          .from('patient_notes')
          .select('appointment_id')
          .in('appointment_id', apptIds);
        notedAppointmentIds = new Set((notes || []).map(n => n.appointment_id));
      }

      for (const a of wlAppts) {
        if (!appointmentsByPatient[a.patient_id]) appointmentsByPatient[a.patient_id] = [];
        const utc = new Date(a.start_time);
        appointmentsByPatient[a.patient_id].push({
          id: a.id,
          date: formatPacificDate(utc),
          time: utc.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true,
            timeZone: 'America/Los_Angeles',
          }),
          service_name: a.service_name,
          provider: a.provider,
          status: a.status,
          has_note: notedAppointmentIds.has(a.id),
        });
      }

      // Pull all WL injection service_logs for streak math.
      const { data: injectionRows } = await supabase
        .from('service_logs')
        .select('patient_id, entry_date')
        .in('patient_id', patientIds)
        .eq('category', 'weight_loss')
        .eq('entry_type', 'injection')
        .order('entry_date', { ascending: false });

      for (const row of (injectionRows || [])) {
        if (!injectionsByPatient[row.patient_id]) injectionsByPatient[row.patient_id] = [];
        injectionsByPatient[row.patient_id].push(row.entry_date);
      }
    }

    // Index logs by protocol/patient for fast lookup
    const reminderByProtocol = {};
    for (const r of (reminderLogsRaw || [])) {
      const key = r.protocol_id;
      if (!reminderByProtocol[key]) reminderByProtocol[key] = [];
      // Format the UTC timestamp directly into Pacific date + time. Don't
      // round-trip through new Date(toLocaleString) — on a UTC server (Vercel)
      // that re-parses the LA-formatted string as UTC and shifts everything
      // 7-8 hours, which is how 9:20 AM PT was rendering as 2:20 AM.
      const utc = new Date(r.sent_at);
      const sent_date = formatPacificDate(utc);   // YYYY-MM-DD in LA
      const sent_time = utc.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
        timeZone: 'America/Los_Angeles',
      });
      reminderByProtocol[key].push({ ...r, sent_date, sent_time });
    }
    const checkinByPatient = {};
    for (const c of (checkinLogsRaw || [])) {
      const key = c.patient_id;
      if (!checkinByPatient[key]) checkinByPatient[key] = [];
      checkinByPatient[key].push(c);
    }

    // 5. Build patient rows
    const patients = protocols.map(protocol => {
      const patient = protocol.patients;
      const cadenceDays = (Number.isInteger(protocol.checkin_cadence_days) && protocol.checkin_cadence_days > 0)
        ? protocol.checkin_cadence_days
        : parseFrequencyDays(protocol.frequency);

      const reminderLogs = reminderByProtocol[protocol.id] || [];
      const checkinLogs = checkinByPatient[patient.id] || [];

      // Find the most recent original send before/within the requested week
      const lastOriginalInWeek = reminderLogs.find(r =>
        r.nudge_level === 0 && r.sent_date <= weekEnd
      );

      const expectedDate = computeExpectedDateInWeek(
        protocol, weekStart, weekEnd, lastOriginalInWeek?.sent_date,
      );

      const cellStatus = computeCellStatus({
        expectedDateISO: expectedDate,
        todayISO,
        cadenceDays,
        reminderLogs,
        checkinLogs,
      });

      // Per-cycle send timestamps + what (if anything) the cron is doing today
      const cycleEvents = computeCycleEvents({
        expectedDateISO: expectedDate,
        todayISO,
        cadenceDays,
        reminderLogs,
        checkinLogs,
        protocol,
      });

      // In-clinic specific: appointment-anchored status + streak
      const appointments = appointmentsByPatient[patient.id] || [];
      const visit = mode === 'in_clinic'
        ? computeVisitStatus({ appointments, todayISO })
        : null;
      const streak = mode === 'in_clinic'
        ? computeStreak(injectionsByPatient[patient.id] || [], cadenceDays)
        : null;

      // Last check-in overall (for roster display)
      const mostRecentCheckin = checkinLogs[0];

      // 4-week completion rate (cycles with original sent vs cycles completed)
      const fourWkOriginals = reminderLogs.filter(r => r.nudge_level === 0 && r.sent_date >= fourWeeksAgo);
      const fourWkCompletedCycles = fourWkOriginals.filter(orig => {
        const cycleEnd = addDaysISO(orig.sent_date, cadenceDays - 1);
        return checkinLogs.some(c => c.entry_date >= orig.sent_date && c.entry_date <= cycleEnd);
      }).length;
      const fourWkRate = fourWkOriginals.length > 0
        ? Math.round((fourWkCompletedCycles / fourWkOriginals.length) * 100)
        : null;

      const lastPurchase = lastPurchaseByPatient[patient.id];
      const paymentStatus = computePaymentStatus(
        protocol, cadenceDays,
        lastPurchase ? Number(lastPurchase.amount_paid) : null,
      );

      return {
        protocol_id: protocol.id,
        patient_id: patient.id,
        name: patient.name,
        first_name: patient.first_name,
        initials: getInitials(patient.name),
        phone: patient.phone,
        ghl_contact_id: patient.ghl_contact_id,

        medication: protocol.medication,
        selected_dose: protocol.selected_dose,
        frequency: protocol.frequency,
        cadence_days: cadenceDays,
        injection_day: protocol.injection_day,

        reminder_enabled: protocol.checkin_reminder_enabled,
        reminder_opt_out: protocol.reminder_opt_out,
        reminder_opt_out_reason: protocol.reminder_opt_out_reason,

        expected_date_this_week: expectedDate,
        cell_status: cellStatus,
        cycle: cycleEvents,
        visit,    // in-clinic only: today/recent appointment status
        streak,   // in-clinic only: consecutive injections (no big gaps)

        last_checkin_date: mostRecentCheckin?.entry_date || null,
        last_weight: mostRecentCheckin?.weight || null,
        last_notes: mostRecentCheckin?.notes || null,

        four_week_rate: fourWkRate,
        four_week_originals: fourWkOriginals.length,
        four_week_completed: fourWkCompletedCycles,

        payment: paymentStatus,
        last_purchase_date: lastPurchase?.purchase_date || null,
      };
    });

    // 6. Compute aggregate stats
    const stats = computeWeekStats(patients, weekStart, weekEnd, todayISO);

    // 7. 4-week trend (rolling completion %)
    const trend = compute4WeekTrend(protocols, reminderLogsRaw, checkinLogsRaw, weekStart);

    return res.status(200).json({
      mode,
      week_start: weekStart, week_end: weekEnd, today: todayISO,
      patients, stats, trend,
    });
  } catch (err) {
    console.error('[wl-tracker GET]', err);
    return res.status(500).json({ error: err.message });
  }
}

function emptyStats() {
  return {
    total_patients: 0, sent_this_week: 0, completed_this_week: 0,
    missed_this_week: 0, completion_pct: 0,
    payment_due_now: 0, payment_due_soon: 0,
    reminders_disabled: 0, opt_outs: 0,
  };
}

function computeWeekStats(patients, weekStart, weekEnd, todayISO) {
  let sent = 0, completed = 0, missed = 0;
  let dueNow = 0, dueSoon = 0;
  let disabled = 0, optOuts = 0;

  for (const p of patients) {
    const cs = p.cell_status;
    if (['sent', 'nudged', 'final_nudged', 'completed', 'late', 'missed'].includes(cs.status)) {
      sent++;
    }
    if (cs.status === 'completed' || cs.status === 'late') completed++;
    if (cs.status === 'missed') missed++;

    if (p.payment.state === 'due_now') dueNow++;
    if (p.payment.state === 'due_soon') dueSoon++;

    if (!p.reminder_enabled && !p.reminder_opt_out) disabled++;
    if (p.reminder_opt_out) optOuts++;
  }

  return {
    total_patients: patients.length,
    sent_this_week: sent,
    completed_this_week: completed,
    missed_this_week: missed,
    completion_pct: sent > 0 ? Math.round((completed / sent) * 100) : 0,
    payment_due_now: dueNow,
    payment_due_soon: dueSoon,
    reminders_disabled: disabled,
    opt_outs: optOuts,
  };
}

function compute4WeekTrend(protocols, reminderLogsRaw, checkinLogsRaw, currentWeekStart) {
  const weeks = [];
  for (let w = 3; w >= 0; w--) {
    const wkStart = addDaysISO(currentWeekStart, -7 * w);
    const wkEnd = addDaysISO(wkStart, 6);
    let sent = 0, completed = 0;

    for (const protocol of protocols) {
      const cadenceDays = (Number.isInteger(protocol.checkin_cadence_days) && protocol.checkin_cadence_days > 0)
        ? protocol.checkin_cadence_days
        : parseFrequencyDays(protocol.frequency);
      const originals = (reminderLogsRaw || []).filter(r => {
        if (r.protocol_id !== protocol.id || r.nudge_level !== 0) return false;
        const pstDate = formatPacificDate(new Date(r.sent_at));
        return pstDate >= wkStart && pstDate <= wkEnd;
      });
      sent += originals.length;
      for (const orig of originals) {
        const origDate = formatPacificDate(new Date(orig.sent_at));
        const cycleEnd = addDaysISO(origDate, cadenceDays - 1);
        const hasCheckin = (checkinLogsRaw || []).some(c =>
          c.patient_id === protocol.patient_id &&
          c.entry_date >= origDate && c.entry_date <= cycleEnd
        );
        if (hasCheckin) completed++;
      }
    }
    weeks.push({
      week_start: wkStart,
      sent, completed,
      completion_pct: sent > 0 ? Math.round((completed / sent) * 100) : 0,
    });
  }
  return weeks;
}

// ──────────────────────── POST handlers ────────────────────────

async function handlePost(req, res, employee) {
  const { action, protocol_id } = req.body || {};
  if (!action) return res.status(400).json({ error: 'action required' });
  if (!protocol_id) return res.status(400).json({ error: 'protocol_id required' });

  // Load protocol + patient
  const { data: protocol, error: protoErr } = await supabase
    .from('protocols')
    .select(`
      id, patient_id, frequency, checkin_cadence_days, injection_day,
      checkin_reminder_enabled, reminder_opt_out,
      patients!inner ( id, name, first_name, phone, ghl_contact_id )
    `)
    .eq('id', protocol_id)
    .single();
  if (protoErr || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  try {
    switch (action) {
      case 'send_now':           return await actionSendNow(req, res, protocol, employee);
      case 'mark_completed':     return await actionMarkCompleted(req, res, protocol, employee);
      case 'skip_week':          return await actionSkipWeek(req, res, protocol, employee);
      case 'toggle_reminder':    return await actionToggleReminder(req, res, protocol, employee);
      case 'set_opt_out':        return await actionSetOptOut(req, res, protocol, employee);
      case 'update_injection_day': return await actionUpdateInjectionDay(req, res, protocol, employee);
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('[wl-tracker POST]', action, err);
    return res.status(500).json({ error: err.message });
  }
}

async function actionSendNow(req, res, protocol, employee) {
  const patient = protocol.patients;
  const phone = normalizePhone(patient.phone);
  if (!phone) return res.status(400).json({ error: 'No phone number on file' });

  const cadenceDays = (Number.isInteger(protocol.checkin_cadence_days) && protocol.checkin_cadence_days > 0)
    ? protocol.checkin_cadence_days
    : parseFrequencyDays(protocol.frequency);
  const cadenceWord = cadenceDays === 7 ? 'weekly' : cadenceDays === 14 ? 'biweekly' : `${cadenceDays}-day`;
  const checkinUrl = `https://app.range-medical.com/patient-checkin.html?contact_id=${patient.ghl_contact_id || patient.id}`;
  const firstName = patient.first_name || patient.name?.split(' ')[0] || 'there';
  const message = `Hi ${firstName}! 📊\n\nTime for your ${cadenceWord} weight loss check-in. Takes 30 seconds:\n\n${checkinUrl}\n\n- Range Medical`;

  const smsResult = await sendSMS({ to: phone, message });

  await supabase.from('checkin_reminders_log').insert({
    protocol_id: protocol.id, patient_id: patient.id, ghl_contact_id: patient.ghl_contact_id,
    patient_name: patient.name, status: smsResult.success ? 'sent' : 'error',
    error_message: smsResult.success ? null : smsResult.error,
    message_content: message, nudge_level: 0,
  });

  await logComm({
    channel: 'sms', messageType: 'wl_weekly_checkin', message,
    source: 'admin-wl-tracker', patientId: patient.id, protocolId: protocol.id,
    ghlContactId: patient.ghl_contact_id, patientName: patient.name, recipient: phone,
    twilioMessageSid: smsResult.messageSid,
    status: smsResult.success ? undefined : 'error',
    errorMessage: smsResult.success ? undefined : smsResult.error,
    provider: smsResult.provider || null, direction: 'outbound',
  });

  await logAction({
    employee, action_type: 'wl_tracker_send_now',
    description: `Sent manual check-in SMS to ${patient.name}`,
    target_type: 'protocol', target_id: protocol.id,
  });

  if (!smsResult.success) return res.status(500).json({ error: smsResult.error });
  return res.status(200).json({ success: true, message: 'Sent' });
}

async function actionMarkCompleted(req, res, protocol, employee) {
  const { weight, notes, entry_date } = req.body;
  const patient = protocol.patients;
  const dateISO = entry_date || todayPacificISO();
  const noteText = notes || `Logged by ${employee.first_name || employee.name || 'staff'} via WL tracker`;
  const weightVal = weight != null && weight !== '' ? Number(weight) : null;

  // Match the check-then-insert/update pattern used by /api/patient/weight
  const { data: existing } = await supabase
    .from('service_logs')
    .select('id')
    .eq('protocol_id', protocol.id)
    .eq('entry_date', dateISO)
    .eq('entry_type', 'weight_check')
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('service_logs')
      .update({ weight: weightVal, notes: noteText })
      .eq('id', existing.id);
    if (error) return res.status(500).json({ error: error.message });
  } else {
    const { error } = await supabase
      .from('service_logs')
      .insert({
        patient_id: patient.id,
        protocol_id: protocol.id,
        category: 'weight_loss',
        entry_type: 'weight_check',
        entry_date: dateISO,
        medication: null,
        dosage: null,
        weight: weightVal,
        notes: noteText,
      });
    if (error) return res.status(500).json({ error: error.message });
  }

  await logAction({
    employee, action_type: 'wl_tracker_mark_completed',
    description: `Marked check-in completed for ${patient.name} on ${dateISO}`,
    target_type: 'protocol', target_id: protocol.id,
  });

  return res.status(200).json({ success: true });
}

async function actionSkipWeek(req, res, protocol, employee) {
  const { reason, week_start } = req.body;
  const patient = protocol.patients;
  const dateISO = week_start || todayPacificISO();

  // Mark by inserting a sentinel checkin_reminders_log entry with nudge_level=0 status='skipped'
  await supabase.from('checkin_reminders_log').insert({
    protocol_id: protocol.id, patient_id: patient.id,
    ghl_contact_id: patient.ghl_contact_id, patient_name: patient.name,
    status: 'skipped',
    error_message: reason || 'skipped by staff',
    message_content: `Skipped this cycle. Reason: ${reason || 'not provided'}`,
    nudge_level: 0,
  });

  await logAction({
    employee, action_type: 'wl_tracker_skip_week',
    description: `Skipped week for ${patient.name} (${reason || 'no reason'})`,
    target_type: 'protocol', target_id: protocol.id,
  });

  return res.status(200).json({ success: true });
}

async function actionToggleReminder(req, res, protocol, employee) {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'enabled boolean required' });

  const { error } = await supabase
    .from('protocols')
    .update({ checkin_reminder_enabled: enabled })
    .eq('id', protocol.id);
  if (error) return res.status(500).json({ error: error.message });

  await logAction({
    employee, action_type: 'wl_tracker_toggle_reminder',
    description: `Set reminder ${enabled ? 'ON' : 'OFF'} for ${protocol.patients.name}`,
    target_type: 'protocol', target_id: protocol.id,
  });

  return res.status(200).json({ success: true, checkin_reminder_enabled: enabled });
}

async function actionSetOptOut(req, res, protocol, employee) {
  const { opt_out, reason } = req.body;
  if (typeof opt_out !== 'boolean') return res.status(400).json({ error: 'opt_out boolean required' });

  const update = {
    reminder_opt_out: opt_out,
    reminder_opt_out_reason: opt_out ? (reason || null) : null,
    reminder_opt_out_at: opt_out ? new Date().toISOString() : null,
  };
  // Also flip the simple toggle off when opting out
  if (opt_out) update.checkin_reminder_enabled = false;

  const { error } = await supabase
    .from('protocols')
    .update(update)
    .eq('id', protocol.id);
  if (error) return res.status(500).json({ error: error.message });

  await logAction({
    employee, action_type: 'wl_tracker_set_opt_out',
    description: `${opt_out ? 'Opted out' : 'Cleared opt-out for'} ${protocol.patients.name}${reason ? ` — ${reason}` : ''}`,
    target_type: 'protocol', target_id: protocol.id,
  });

  return res.status(200).json({ success: true });
}

async function actionUpdateInjectionDay(req, res, protocol, employee) {
  const { injection_day } = req.body;
  if (injection_day && !DAY_NAMES.includes(injection_day)) {
    return res.status(400).json({ error: 'Invalid day name' });
  }

  const { error } = await supabase
    .from('protocols')
    .update({ injection_day: injection_day || null })
    .eq('id', protocol.id);
  if (error) return res.status(500).json({ error: error.message });

  await logAction({
    employee, action_type: 'wl_tracker_update_injection_day',
    description: `Set injection day to ${injection_day || 'none'} for ${protocol.patients.name}`,
    target_type: 'protocol', target_id: protocol.id,
  });

  return res.status(200).json({ success: true });
}
