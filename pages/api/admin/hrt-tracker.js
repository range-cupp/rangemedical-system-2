// /pages/api/admin/hrt-tracker.js
// HRT Tracker dashboard API.
//
// GET  ?view_date=YYYY-MM-DD
//        Returns: roster of all active HRT patients with lab status,
//        payment status, medication dispatch status, and computed buckets.
//
// POST { action, protocol_id, ... } supported actions:
//   - mark_lab_drawn:       log a blood draw for a patient
//   - update_next_lab:      manually set the next lab due date
//   - send_lab_reminder:    send a lab reminder SMS
//   - send_booking_sms:     send a booking outreach SMS
//
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { requireAuth, logAction } from '../../../lib/auth';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { isHRTType, parseFrequencyDays } from '../../../lib/protocol-config';
import { buildAdaptiveHRTSchedule, getLabStatusSummary, isHRTProtocol } from '../../../lib/hrt-lab-schedule';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function formatPacificDate(utcDate) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(utcDate);
}

function todayPacificISO() {
  return formatPacificDate(new Date());
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

// Payment status — same logic as WL tracker
function computePaymentStatus(purchases) {
  if (!purchases || purchases.length === 0) {
    return { state: 'unknown', label: 'No purchases', last_purchase_date: null, amount_paid: null };
  }
  const last = purchases[0]; // sorted desc
  const amount = Number(last.amount_paid) || 0;
  const totalSpent = purchases.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
  if (amount === 0) {
    return { state: 'comp', label: 'Comp', last_purchase_date: last.purchase_date, amount_paid: 0 };
  }
  return {
    state: 'paid',
    label: `Paid $${amount.toFixed(0)}`,
    last_purchase_date: last.purchase_date,
    amount_paid: amount,
    total_spent: totalSpent,
    purchase_count: purchases.length,
  };
}

// Medication dispense status — single source of truth is service_logs (pickup events)
// + protocol's next_expected_date (kept in sync by every dispense via /api/medication-checkout).
// Falls back to purchase data when no pickups have been logged yet (e.g., legacy patients).
function computeDispenseStatus(protocol, pickupLogs, purchases, todayISO) {
  // Prefer the canonical fields the medication-checkout endpoint maintains
  const lastDispensedDate = protocol.last_refill_date
    || pickupLogs[0]?.entry_date
    || purchases[0]?.purchase_date
    || null;

  const nextDueDate = protocol.next_expected_date || null;

  if (!lastDispensedDate && !nextDueDate) {
    return {
      state: 'never', label: 'Never dispensed',
      days_until_due: null, last_dispensed_date: null,
      last_pickup_qty: null, last_pickup_dose: null,
    };
  }

  const lastQty = pickupLogs[0]?.quantity || null;
  const lastDose = pickupLogs[0]?.dosage || null;
  const lastFulfillment = pickupLogs[0]?.fulfillment_method || null;
  const pickupCount = pickupLogs.length;

  const base = {
    last_dispensed_date: lastDispensedDate,
    next_due_date: nextDueDate,
    last_pickup_qty: lastQty,
    last_pickup_dose: lastDose,
    last_fulfillment: lastFulfillment,
    pickup_count: pickupCount,
  };

  // If we have a next_expected_date, that's the most accurate signal
  if (nextDueDate) {
    const daysRemaining = daysBetween(todayISO, nextDueDate);
    base.days_until_due = Math.max(0, daysRemaining);

    if (daysRemaining < 0) {
      return { state: 'send_now', label: `Refill overdue (${Math.abs(daysRemaining)}d)`, ...base, days_until_due: 0 };
    }
    if (daysRemaining === 0) {
      return { state: 'send_now', label: 'Refill due today', ...base };
    }
    if (daysRemaining <= 7) {
      return { state: 'due_now', label: `Refill in ${daysRemaining}d`, ...base };
    }
    if (daysRemaining <= 14) {
      return { state: 'due_soon', label: `Refill in ${daysRemaining}d`, ...base };
    }
    return { state: 'active', label: `${daysRemaining}d supply`, ...base };
  }

  // Fallback: estimate coverage from the last pickup quantity + protocol frequency
  if (pickupLogs[0]) {
    const qty = pickupLogs[0].quantity || 1;
    const cadenceDays = parseFrequencyDays(protocol.frequency) || 7;
    const coverageDays = qty * cadenceDays;
    const daysSince = Math.max(0, daysBetween(pickupLogs[0].entry_date, todayISO));
    const daysRemaining = coverageDays - daysSince;
    base.days_until_due = Math.max(0, daysRemaining);

    if (daysRemaining <= 0) return { state: 'send_now', label: 'Refill needed', ...base, days_until_due: 0 };
    if (daysRemaining <= 7) return { state: 'due_now', label: `Refill in ${daysRemaining}d`, ...base };
    if (daysRemaining <= 14) return { state: 'due_soon', label: `Refill in ${daysRemaining}d`, ...base };
    return { state: 'active', label: `${daysRemaining}d supply`, ...base };
  }

  // Have a purchase but no pickup logged yet — flag it so staff knows to log the dispense
  if (purchases[0]) {
    return { state: 'send_now', label: 'Pickup not logged', ...base, days_until_due: 0 };
  }

  return { state: 'never', label: 'Never dispensed', ...base, days_until_due: null };
}

// Lab status — determines if a patient needs labs, is overdue, or is on track
function computeLabStatus(labSchedule, todayISO) {
  if (!labSchedule || labSchedule.length === 0) {
    return { state: 'no_schedule', label: 'No lab schedule', next_lab: null, completed_count: 0, total_count: 0 };
  }

  const summary = getLabStatusSummary(labSchedule);
  const nextDraw = summary.nextDraw;

  if (summary.status === 'complete') {
    return {
      state: 'complete', label: 'All labs complete',
      next_lab: null,
      completed_count: summary.completedCount,
      total_count: summary.totalCount,
    };
  }

  if (summary.status === 'overdue' && nextDraw) {
    const daysOverdue = daysBetween(nextDraw.targetDate, todayISO);
    return {
      state: 'overdue', label: `${nextDraw.label} overdue (${daysOverdue}d)`,
      next_lab: nextDraw,
      days_overdue: daysOverdue,
      completed_count: summary.completedCount,
      total_count: summary.totalCount,
    };
  }

  if (nextDraw) {
    const daysUntil = daysBetween(todayISO, nextDraw.targetDate);
    let state = 'on_track';
    let label = `${nextDraw.label} in ${daysUntil}d`;
    if (daysUntil <= 7) {
      state = 'due_soon';
      label = `${nextDraw.label} due this week`;
    } else if (daysUntil <= 14) {
      state = 'due_soon';
      label = `${nextDraw.label} in ${daysUntil}d`;
    }
    return {
      state, label, next_lab: nextDraw, days_until: daysUntil,
      completed_count: summary.completedCount,
      total_count: summary.totalCount,
    };
  }

  return {
    state: 'on_track', label: 'On track',
    next_lab: null,
    completed_count: summary.completedCount,
    total_count: summary.totalCount,
  };
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
  const realTodayISO = todayPacificISO();
  const requestedView = req.query.view_date;
  const todayISO = (typeof requestedView === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(requestedView))
    ? requestedView
    : realTodayISO;

  try {
    // 1. Pull active HRT protocols
    const { data: protocols, error: protoErr } = await supabase
      .from('protocols')
      .select(`
        id, patient_id, program_name, program_type, medication, selected_dose,
        frequency, start_date, end_date, status, delivery_method,
        total_sessions, sessions_used, first_followup_weeks,
        supply_type, injection_method, injection_frequency,
        last_refill_date, next_expected_date, pickup_frequency,
        patients!inner ( id, name, first_name, last_name, phone, ghl_contact_id )
      `)
      .eq('status', 'active')
      .order('start_date', { ascending: false });

    if (protoErr) throw new Error('Protocols query: ' + protoErr.message);

    // Filter to HRT types in JS — more flexible than SQL pattern matching
    const hrtProtocols = protocols.filter(p => isHRTType(p.program_type));

    const patientIds = hrtProtocols.map(p => p.patient_id);

    if (patientIds.length === 0) {
      return res.status(200).json({
        today: todayISO, real_today: realTodayISO,
        patients: [], stats: emptyStats(),
      });
    }

    // 2. Pull HRT purchases per patient
    const { data: purchasesRaw } = await supabase
      .from('purchases')
      .select('patient_id, purchase_date, amount_paid, quantity, item_name, category')
      .in('patient_id', patientIds)
      .or('category.eq.hrt,category.eq.HRT,category.ilike.%hrt%,category.ilike.%hormone%,category.ilike.%testosterone%')
      .order('purchase_date', { ascending: false });
    const purchasesByPatient = {};
    for (const p of (purchasesRaw || [])) {
      (purchasesByPatient[p.patient_id] ||= []).push(p);
    }

    // 3. Pull blood draw logs for lab schedule computation
    const protocolIds = hrtProtocols.map(p => p.id);
    let bloodDrawMap = {};
    if (protocolIds.length > 0) {
      const { data: logs } = await supabase
        .from('protocol_logs')
        .select('id, protocol_id, log_type, log_date, notes')
        .in('protocol_id', protocolIds)
        .eq('log_type', 'blood_draw');
      for (const log of (logs || [])) {
        (bloodDrawMap[log.protocol_id] ||= []).push(log);
      }
    }

    // 4. Pull labs for these patients
    let labsMap = {};
    const { data: labs } = await supabase
      .from('labs')
      .select('id, patient_id, test_date, completed_date, panel_type, status')
      .in('patient_id', patientIds);
    for (const lab of (labs || [])) {
      (labsMap[lab.patient_id] ||= []).push(lab);
    }

    // 5. Pull lab protocols (auto-scheduled)
    let labProtocolMap = {};
    const { data: labProtos } = await supabase
      .from('protocols')
      .select('id, patient_id, program_type, start_date, status')
      .in('patient_id', patientIds)
      .eq('program_type', 'labs');
    for (const lp of (labProtos || [])) {
      (labProtocolMap[lp.patient_id] ||= []).push(lp);
    }

    // 6. Pull HRT service logs — pickups (canonical dispense source of truth)
    // and recent injections. Pickups go back further (1 year) so we can see
    // the full dispense history; injections only need the last 4 weeks.
    const oneYearAgo = addDaysISO(todayISO, -365);
    const fourWeeksAgo = addDaysISO(todayISO, -28);

    const { data: pickupLogsRaw } = await supabase
      .from('service_logs')
      .select('id, patient_id, protocol_id, entry_date, entry_type, medication, dosage, quantity, supply_type, fulfillment_method, notes, category')
      .in('patient_id', patientIds)
      .eq('entry_type', 'pickup')
      .or('category.eq.testosterone,category.eq.hrt,category.ilike.%hrt%')
      .gte('entry_date', oneYearAgo)
      .order('entry_date', { ascending: false });

    // Pickups indexed by protocol_id (so we attribute each pickup to the right
    // protocol — important when patients have multiple HRT protocols).
    const pickupLogsByProtocol = {};
    const pickupLogsByPatient = {};
    for (const log of (pickupLogsRaw || [])) {
      if (log.protocol_id) {
        (pickupLogsByProtocol[log.protocol_id] ||= []).push(log);
      }
      (pickupLogsByPatient[log.patient_id] ||= []).push(log);
    }

    const { data: serviceLogsRaw } = await supabase
      .from('service_logs')
      .select('id, patient_id, entry_date, entry_type, medication, dosage, notes, category')
      .in('patient_id', patientIds)
      .or('category.eq.hrt,category.eq.testosterone,category.ilike.%hrt%')
      .gte('entry_date', fourWeeksAgo)
      .order('entry_date', { ascending: false });
    const serviceLogsByPatient = {};
    for (const sl of (serviceLogsRaw || [])) {
      (serviceLogsByPatient[sl.patient_id] ||= []).push(sl);
    }

    // 7. Pull last encounter note per patient
    const { data: encounterRows } = await supabase
      .from('patient_notes')
      .select('patient_id, note_date, encounter_service, status')
      .in('patient_id', patientIds)
      .order('note_date', { ascending: false });
    const lastEncounterByPatient = {};
    for (const n of (encounterRows || [])) {
      if (!lastEncounterByPatient[n.patient_id]) {
        const utc = new Date(n.note_date);
        lastEncounterByPatient[n.patient_id] = {
          date: formatPacificDate(utc),
          service: n.encounter_service || 'Encounter',
        };
      }
    }

    // 8. Pull upcoming appointments
    const apptStart = addDaysISO(todayISO, -14);
    const apptEnd = addDaysISO(todayISO, 30);
    const { data: appts } = await supabase
      .from('appointments')
      .select('id, patient_id, service_name, service_category, provider, start_time, status')
      .in('patient_id', patientIds)
      .gte('start_time', apptStart + 'T00:00:00Z')
      .lte('start_time', apptEnd + 'T23:59:59Z')
      .order('start_time', { ascending: true });

    const appointmentsByPatient = {};
    for (const a of (appts || [])) {
      (appointmentsByPatient[a.patient_id] ||= []).push({
        id: a.id,
        date: formatPacificDate(new Date(a.start_time)),
        time: new Date(a.start_time).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true,
          timeZone: 'America/Los_Angeles',
        }),
        service_name: a.service_name,
        provider: a.provider,
        status: a.status,
      });
    }

    // 9. Build patient rows
    const patients = hrtProtocols.map(protocol => {
      const patient = protocol.patients;
      const purchases = purchasesByPatient[patient.id] || [];
      const bloodDrawLogs = bloodDrawMap[protocol.id] || [];
      const patientLabs = labsMap[patient.id] || [];
      const patientLabProtos = labProtocolMap[patient.id] || [];
      const serviceLogs = serviceLogsByPatient[patient.id] || [];
      const lastEncounter = lastEncounterByPatient[patient.id] || null;
      const appointments = appointmentsByPatient[patient.id] || [];

      // Compute lab schedule using the adaptive algorithm
      const labSchedule = buildAdaptiveHRTSchedule(
        protocol.start_date,
        protocol.first_followup_weeks || 8,
        bloodDrawLogs,
        patientLabs,
        patientLabProtos
      );

      const labStatus = computeLabStatus(labSchedule, todayISO);
      const paymentStatus = computePaymentStatus(purchases);

      // Pickup logs scoped to this protocol (preferred); fall back to all
      // patient pickups if the protocol_id link wasn't set on older rows.
      const pickupLogs = pickupLogsByProtocol[protocol.id]
        || pickupLogsByPatient[patient.id]
        || [];
      const dispenseStatus = computeDispenseStatus(protocol, pickupLogs, purchases, todayISO);

      // Days on protocol
      const daysOnProtocol = protocol.start_date
        ? daysBetween(protocol.start_date, todayISO)
        : null;

      // Most recent service log
      const lastServiceLog = serviceLogs[0] || null;

      // Upcoming appointments (future only)
      const futureAppts = appointments.filter(a => a.date >= todayISO);
      const nextAppt = futureAppts[0] || null;

      // Today action bucket classification
      let today_action = 'active';
      if (labStatus.state === 'overdue') {
        today_action = 'labs_overdue';
      } else if (labStatus.state === 'due_soon') {
        today_action = 'labs_due_soon';
      } else if (dispenseStatus.state === 'send_now' || dispenseStatus.state === 'due_now') {
        today_action = 'meds_dispatch';
      } else if (dispenseStatus.state === 'due_soon') {
        today_action = 'meds_due_soon';
      } else if (paymentStatus.state === 'unknown') {
        today_action = 'needs_attention';
      }

      return {
        protocol_id: protocol.id,
        patient_id: patient.id,
        name: patient.name,
        first_name: patient.first_name,
        initials: getInitials(patient.name),
        phone: patient.phone,

        medication: protocol.medication,
        selected_dose: protocol.selected_dose,
        frequency: protocol.frequency,
        program_type: protocol.program_type,
        start_date: protocol.start_date,
        days_on_protocol: daysOnProtocol,

        today_action,
        lab_status: labStatus,
        lab_schedule: labSchedule,
        payment: paymentStatus,
        dispense: dispenseStatus,

        last_encounter: lastEncounter,
        last_service_log: lastServiceLog,
        next_appointment: nextAppt,

        protocol_summary: {
          name: protocol.program_name,
          medication: protocol.medication,
          dose: protocol.selected_dose,
          frequency: protocol.frequency,
          start_date: protocol.start_date,
          end_date: protocol.end_date,
          delivery_method: protocol.delivery_method,
          program_type: protocol.program_type,
        },
        purchase_summary: purchases.length > 0 ? {
          total_spent: purchases.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0),
          count: purchases.length,
          first_purchase: purchases[purchases.length - 1]?.purchase_date,
        } : null,
      };
    });

    // 10. Compute stats
    const stats = {
      total_patients: patients.length,
      labs_overdue: patients.filter(p => p.lab_status.state === 'overdue').length,
      labs_due_soon: patients.filter(p => p.lab_status.state === 'due_soon').length,
      dispatch_due_now: patients.filter(p => ['send_now', 'due_now'].includes(p.dispense.state)).length,
      dispatch_due_soon: patients.filter(p => p.dispense.state === 'due_soon').length,
      no_purchases: patients.filter(p => p.payment.state === 'unknown').length,
    };

    return res.status(200).json({
      today: todayISO, real_today: realTodayISO,
      patients, stats,
    });
  } catch (err) {
    console.error('[hrt-tracker GET]', err);
    return res.status(500).json({ error: err.message });
  }
}

function emptyStats() {
  return {
    total_patients: 0, labs_overdue: 0, labs_due_soon: 0,
    dispatch_due_now: 0, dispatch_due_soon: 0, no_purchases: 0,
  };
}

// ──────────────────────── POST handlers ────────────────────────

async function handlePost(req, res, employee) {
  const { action, protocol_id } = req.body || {};
  if (!action) return res.status(400).json({ error: 'action required' });
  if (!protocol_id) return res.status(400).json({ error: 'protocol_id required' });

  const { data: protocol, error: protoErr } = await supabase
    .from('protocols')
    .select(`
      id, patient_id, program_type, program_name, start_date, first_followup_weeks,
      medication, selected_dose, frequency, supply_type,
      injection_method, injection_frequency, pickup_frequency,
      sessions_used, last_refill_date, next_expected_date,
      patients!inner ( id, name, first_name, phone, email, ghl_contact_id )
    `)
    .eq('id', protocol_id)
    .single();
  if (protoErr || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  try {
    switch (action) {
      case 'mark_lab_drawn':      return await actionMarkLabDrawn(req, res, protocol, employee);
      case 'send_lab_reminder':   return await actionSendLabReminder(req, res, protocol, employee);
      case 'send_booking_sms':    return await actionSendBookingSMS(req, res, protocol, employee);
      case 'dispense_medication': return await actionDispenseMedication(req, res, protocol, employee);
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('[hrt-tracker POST]', action, err);
    return res.status(500).json({ error: err.message });
  }
}

async function actionMarkLabDrawn(req, res, protocol, employee) {
  const { draw_label, draw_date } = req.body;
  const patient = protocol.patients;
  const dateISO = draw_date || todayPacificISO();

  const { error } = await supabase.from('protocol_logs').insert({
    protocol_id: protocol.id,
    log_type: 'blood_draw',
    log_date: dateISO,
    notes: draw_label || 'Blood draw logged via HRT tracker',
  });
  if (error) return res.status(500).json({ error: error.message });

  await logAction({
    employee, action_type: 'hrt_tracker_mark_lab_drawn',
    description: `Logged blood draw for ${patient.name} on ${dateISO} (${draw_label || 'manual'})`,
    target_type: 'protocol', target_id: protocol.id,
  });

  return res.status(200).json({ success: true });
}

async function actionSendLabReminder(req, res, protocol, employee) {
  const patient = protocol.patients;
  const phone = normalizePhone(patient.phone);
  if (!phone) return res.status(400).json({ error: 'No phone number on file' });

  const firstName = patient.first_name || patient.name?.split(' ')[0] || 'there';
  const message =
    `Hey ${firstName}! You're due for your next blood draw. ` +
    `When would be a good day for you to come in fasted? ` +
    `Just reply to this text or call us at (949) 997-3988.\n\n` +
    `- Range Medical`;

  const smsResult = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms', messageType: 'hrt_lab_reminder', message,
    source: 'admin-hrt-tracker', patientId: patient.id, protocolId: protocol.id,
    ghlContactId: patient.ghl_contact_id, patientName: patient.name, recipient: phone,
    twilioMessageSid: smsResult.messageSid,
    status: smsResult.success ? undefined : 'error',
    errorMessage: smsResult.success ? undefined : smsResult.error,
    provider: smsResult.provider || null, direction: 'outbound',
  });

  await logAction({
    employee, action_type: 'hrt_tracker_send_lab_reminder',
    description: `Sent lab reminder SMS to ${patient.name}`,
    target_type: 'protocol', target_id: protocol.id,
  });

  if (!smsResult.success) return res.status(500).json({ error: smsResult.error });
  return res.status(200).json({ success: true, message: 'Lab reminder sent' });
}

async function actionSendBookingSMS(req, res, protocol, employee) {
  const patient = protocol.patients;
  const phone = normalizePhone(patient.phone);
  if (!phone) return res.status(400).json({ error: 'No phone number on file' });

  const firstName = patient.first_name || patient.name?.split(' ')[0] || 'there';
  const message =
    `Hi ${firstName}! It's time to get your next HRT visit on the calendar. ` +
    `Reply with a few times that work for you, or call us at (949) 997-3988 and we'll get you booked.\n\n` +
    `- Range Medical`;

  const smsResult = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms', messageType: 'hrt_booking_outreach', message,
    source: 'admin-hrt-tracker', patientId: patient.id, protocolId: protocol.id,
    ghlContactId: patient.ghl_contact_id, patientName: patient.name, recipient: phone,
    twilioMessageSid: smsResult.messageSid,
    status: smsResult.success ? undefined : 'error',
    errorMessage: smsResult.success ? undefined : smsResult.error,
    provider: smsResult.provider || null, direction: 'outbound',
  });

  await logAction({
    employee, action_type: 'hrt_tracker_send_booking_sms',
    description: `Sent booking outreach SMS to ${patient.name}`,
    target_type: 'protocol', target_id: protocol.id,
  });

  if (!smsResult.success) return res.status(500).json({ error: smsResult.error });
  return res.status(200).json({ success: true, message: 'Booking SMS sent' });
}

// Dispense HRT medication. Goes through the canonical medication-checkout pipeline
// internally so the dispense is recorded in service_logs (single source of truth) AND
// the protocol's last_refill_date / next_expected_date / sessions_used stay in sync.
// Supports backdating via dispense_date.
async function actionDispenseMedication(req, res, protocol, employee) {
  const {
    quantity,
    dosage_override,
    dispense_date,    // YYYY-MM-DD — defaults to today, allows backdating
    fulfillment_method = 'in_clinic',
    medication_override,
    supply_type_override,
    notes,
  } = req.body;

  const patient = protocol.patients;
  if (!patient) return res.status(404).json({ error: 'Patient not found on protocol' });

  const qty = quantity ? parseInt(quantity) : 1;
  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: 'quantity must be a positive integer' });
  }

  const entryDate = dispense_date && /^\d{4}-\d{2}-\d{2}$/.test(dispense_date)
    ? dispense_date
    : todayPacificISO();

  // Map HRT program_types to the testosterone service_log category — same mapping
  // the canonical /api/admin/dispense and /api/medication-checkout endpoints use.
  const category = 'testosterone';

  // Duplicate guard — same date + same protocol = already logged
  const { data: existing } = await supabase
    .from('service_logs')
    .select('id')
    .eq('patient_id', patient.id)
    .eq('protocol_id', protocol.id)
    .eq('entry_date', entryDate)
    .eq('entry_type', 'pickup')
    .limit(1);

  if (existing && existing.length > 0) {
    return res.status(409).json({
      error: `Already dispensed on ${entryDate} — pick a different date or open the patient chart to edit.`,
      existing_id: existing[0].id,
    });
  }

  const dosage = dosage_override || protocol.selected_dose || null;
  const medication = medication_override || protocol.medication || null;
  const supplyType = supply_type_override || protocol.supply_type || null;

  // 1. Insert the pickup row in service_logs (the source of truth)
  const { data: pickupLog, error: insertErr } = await supabase
    .from('service_logs')
    .insert({
      patient_id: patient.id,
      protocol_id: protocol.id,
      category,
      entry_type: 'pickup',
      entry_date: entryDate,
      medication,
      dosage,
      quantity: qty,
      supply_type: supplyType,
      fulfillment_method: fulfillment_method || 'in_clinic',
      notes: notes || `Dispensed via HRT tracker by ${employee.first_name || employee.name || 'staff'}`,
    })
    .select('id')
    .single();

  if (insertErr) {
    console.error('[hrt-tracker dispense] insert error:', insertErr);
    return res.status(500).json({ error: insertErr.message });
  }

  // 2. Calculate next_expected_date based on supply + frequency. Same logic as
  // /api/admin/dispense::getRefillIntervalDays — duplicated here intentionally
  // to keep this endpoint self-contained.
  const intervalDays = getHRTRefillIntervalDays(protocol, supplyType, dosage, qty);
  const nextDate = new Date(entryDate + 'T12:00:00');
  nextDate.setDate(nextDate.getDate() + intervalDays);
  const nextExpectedDate = nextDate.toISOString().split('T')[0];

  // 3. Update protocol with canonical fields
  const { error: protoUpdateErr } = await supabase
    .from('protocols')
    .update({
      last_refill_date: entryDate,
      next_expected_date: nextExpectedDate,
      sessions_used: (protocol.sessions_used || 0) + qty,
      ...(supply_type_override ? { supply_type: supply_type_override } : {}),
    })
    .eq('id', protocol.id);

  if (protoUpdateErr) {
    console.error('[hrt-tracker dispense] protocol update error:', protoUpdateErr);
    // Don't fail the request — the pickup log is the source of truth, the
    // protocol fields are derived. Log the error but report success.
  }

  await logAction({
    employee, action_type: 'hrt_tracker_dispense',
    description: `Dispensed ${qty}× ${medication || 'HRT'}${dosage ? ' ' + dosage : ''} for ${patient.name} on ${entryDate}`,
    target_type: 'protocol', target_id: protocol.id,
  });

  return res.status(200).json({
    success: true,
    service_log_id: pickupLog.id,
    dispense_date: entryDate,
    next_expected_date: nextExpectedDate,
    interval_days: intervalDays,
  });
}

// Mirrors the HRT branch of /api/admin/dispense::getRefillIntervalDays.
// Keeps this endpoint self-contained so the tracker can compute coverage
// without importing from the deprecated dispense API.
function getHRTRefillIntervalDays(protocol, supplyTypeOverride, doseOverride, qty) {
  const supply = (supplyTypeOverride || protocol.supply_type || '').toLowerCase();
  const dose = doseOverride || protocol.selected_dose || '';

  if (supply === 'pellet') return 120;
  if (supply === 'oral_30day' || supply.includes('oral')) return 30;
  if (supply === 'in_clinic') return 7 * qty;

  // Prefilled syringes — fixed interval per syringe count
  if (supply === 'prefilled' || supply.startsWith('prefilled_')) {
    const prefillDays = { prefilled_1week: 7, prefilled_2week: 14, prefilled_4week: 28 };
    if (prefillDays[supply]) return prefillDays[supply];
    return 28;
  }

  // Vials — figure out coverage from ml-per-injection × frequency
  if (supply.includes('vial')) {
    const vialMl = supply === 'vial_5ml' ? 5 : 10;
    const mlMatch = (dose || '').match(/(\d+\.?\d*)\s*ml/i);
    const ml = mlMatch ? parseFloat(mlMatch[1]) : null;
    if (ml && ml < 2) {
      const isSubQ = (protocol.injection_method || '').toLowerCase() === 'subq';
      const injectionsPerWeek = isSubQ ? 7 : (protocol.injection_frequency || 2);
      const mlPerWeek = ml * injectionsPerWeek;
      const weeks = vialMl / mlPerWeek;
      return Math.round(weeks * 7);
    }
    return supply === 'vial_5ml' ? 42 : 84;
  }

  // Fallback: estimate from quantity × cadence (e.g. 3 syringes × every 3-5 days)
  const cadenceDays = parseFrequencyDays(protocol.frequency) || 7;
  return qty * cadenceDays;
}
