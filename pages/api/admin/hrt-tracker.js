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

// Medication dispense status — when does the patient need their next shipment?
// HRT meds are typically dispensed in 10-week or 12-week supplies. We look at the
// last HRT purchase and protocol frequency to estimate coverage.
function computeDispenseStatus(protocol, purchases, todayISO) {
  if (!purchases || purchases.length === 0) {
    return {
      state: 'never', label: 'Never dispensed',
      days_until_due: null, last_dispensed_date: null, coverage_days: 0,
    };
  }

  const last = purchases[0]; // most recent
  // HRT supply typically covers 10 weeks (70 days). Adjust based on item_name if possible.
  const itemName = String(last.item_name || '').toLowerCase();
  let coverageDays = 70; // 10-week default
  const weekMatch = itemName.match(/(\d+)\s*week/);
  if (weekMatch) {
    coverageDays = parseInt(weekMatch[1], 10) * 7;
  } else if (/month|monthly/.test(itemName)) {
    coverageDays = 30;
  } else if (/12.*week|3.*month|quarter/.test(itemName)) {
    coverageDays = 84;
  }

  const daysSincePurchase = Math.max(0, daysBetween(last.purchase_date, todayISO));
  const daysRemaining = coverageDays - daysSincePurchase;

  const base = {
    last_dispensed_date: last.purchase_date,
    coverage_days: coverageDays,
    days_until_due: Math.max(0, daysRemaining),
  };

  if (daysRemaining <= 0) {
    return { state: 'send_now', label: 'Send next supply', ...base, days_until_due: 0 };
  }
  if (daysRemaining <= 7) {
    return { state: 'due_now', label: `Refill in ${daysRemaining}d`, ...base };
  }
  if (daysRemaining <= 14) {
    return { state: 'due_soon', label: `Refill in ${daysRemaining}d`, ...base };
  }
  return { state: 'active', label: `${daysRemaining}d supply`, ...base };
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

    // 6. Pull recent service logs (HRT-related: pickups, injections)
    const fourWeeksAgo = addDaysISO(todayISO, -28);
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
      const dispenseStatus = computeDispenseStatus(protocol, purchases, todayISO);

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
      id, patient_id, program_type, start_date, first_followup_weeks,
      patients!inner ( id, name, first_name, phone, ghl_contact_id )
    `)
    .eq('id', protocol_id)
    .single();
  if (protoErr || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  try {
    switch (action) {
      case 'mark_lab_drawn':   return await actionMarkLabDrawn(req, res, protocol, employee);
      case 'send_lab_reminder': return await actionSendLabReminder(req, res, protocol, employee);
      case 'send_booking_sms': return await actionSendBookingSMS(req, res, protocol, employee);
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
    `Hi ${firstName}! It's time to schedule your follow-up blood draw for your HRT protocol. ` +
    `Please call us at (949) 997-3988 or reply to this text to get your labs scheduled.\n\n` +
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
