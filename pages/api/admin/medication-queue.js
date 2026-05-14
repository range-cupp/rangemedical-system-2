// /pages/api/admin/medication-queue.js
// Unified Medication Fulfillment & Payment Queue
// Pulls HRT, Weight Loss, and Peptide protocols into a single prioritized list.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { parseFrequencyDays, isHRTType, isWeightLossType, isPeptideType } from '../../../lib/protocol-config';
import { computePaymentStatus as computeWLPayment, computeDispenseStatus as computeWLDispense } from '../../../lib/wl-dispense';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function todayPacificISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

function daysBetween(aISO, bISO) {
  const a = new Date(aISO + 'T12:00:00');
  const b = new Date(bISO + 'T12:00:00');
  return Math.round((b - a) / 86400000);
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// --- HRT refill interval (mirrors hrt-tracker.js) ---
function getHRTRefillIntervalDays(protocol, supplyTypeOverride, doseOverride, qty) {
  const supply = (supplyTypeOverride || protocol.supply_type || '').toLowerCase();
  const dose = doseOverride || protocol.selected_dose || '';

  if (supply === 'pellet') return 120;
  if (supply === 'oral_30day' || supply.includes('oral')) return 30;
  if (supply === 'in_clinic') return 7 * qty;

  if (supply === 'prefilled' || supply.startsWith('prefilled_')) {
    const prefillDays = { prefilled_1week: 7, prefilled_2week: 14, prefilled_4week: 28 };
    if (prefillDays[supply]) return prefillDays[supply];
    return 28;
  }

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

  const cadenceDays = parseFrequencyDays(protocol.frequency) || 7;
  return qty * cadenceDays;
}

// --- HRT dispense status ---
function computeHRTDispense(protocol, lastPickup, todayISO) {
  // Prefer next_expected_date from the protocol (set on each dispense)
  if (protocol.next_expected_date) {
    const daysRemaining = daysBetween(todayISO, protocol.next_expected_date);
    const base = {
      last_dispensed_date: protocol.last_refill_date || (lastPickup ? lastPickup.entry_date : null),
      next_due_date: protocol.next_expected_date,
      days_until_due: Math.max(0, daysRemaining),
    };
    if (daysRemaining <= 0) return { status: 'overdue', label: 'Refill needed', ...base, days_until_due: 0 };
    if (daysRemaining <= 7) return { status: 'due_now', label: `Refill in ${daysRemaining}d`, ...base };
    if (daysRemaining <= 14) return { status: 'due_soon', label: `Refill in ${daysRemaining}d`, ...base };
    return { status: 'active', label: `${daysRemaining}d supply`, ...base };
  }

  // Fallback: estimate from last pickup
  if (lastPickup) {
    const qty = lastPickup.quantity || 1;
    const intervalDays = getHRTRefillIntervalDays(protocol, lastPickup.supply_type, lastPickup.dosage, qty);
    const daysSince = daysBetween(lastPickup.entry_date, todayISO);
    const daysRemaining = intervalDays - daysSince;
    const nextDue = new Date(lastPickup.entry_date + 'T12:00:00');
    nextDue.setDate(nextDue.getDate() + intervalDays);
    const base = {
      last_dispensed_date: lastPickup.entry_date,
      next_due_date: nextDue.toISOString().split('T')[0],
      days_until_due: Math.max(0, daysRemaining),
    };
    if (daysRemaining <= 0) return { status: 'overdue', label: 'Refill needed', ...base, days_until_due: 0 };
    if (daysRemaining <= 7) return { status: 'due_now', label: `Refill in ${daysRemaining}d`, ...base };
    if (daysRemaining <= 14) return { status: 'due_soon', label: `Refill in ${daysRemaining}d`, ...base };
    return { status: 'active', label: `${daysRemaining}d supply`, ...base };
  }

  return {
    status: 'never', label: 'Never dispensed',
    last_dispensed_date: null, next_due_date: null, days_until_due: null,
  };
}

// --- Peptide dispense status (supply = end_date countdown) ---
function computePeptideDispense(protocol, todayISO) {
  if (!protocol.end_date) {
    return {
      status: 'never', label: 'No end date',
      last_dispensed_date: protocol.start_date, next_due_date: null, days_until_due: null,
    };
  }
  const daysRemaining = daysBetween(todayISO, protocol.end_date);
  const base = {
    last_dispensed_date: protocol.start_date,
    next_due_date: protocol.end_date,
    days_until_due: Math.max(0, daysRemaining),
  };
  if (daysRemaining <= 0) return { status: 'overdue', label: 'Supply ended', ...base, days_until_due: 0 };
  if (daysRemaining <= 7) return { status: 'due_now', label: `Ends in ${daysRemaining}d`, ...base };
  if (daysRemaining <= 14) return { status: 'due_soon', label: `Ends in ${daysRemaining}d`, ...base };
  return { status: 'active', label: `${daysRemaining}d left`, ...base };
}

// --- Unified payment status ---
function computePaymentStatus(lastPurchase, protocolComp) {
  if (protocolComp) {
    return { status: 'comp', label: 'Comp', last_payment_date: lastPurchase?.purchase_date || null, amount_paid: 0, total_spent: 0, purchase_count: 0 };
  }
  if (!lastPurchase) {
    return { status: 'unknown', label: 'No purchases', last_payment_date: null, amount_paid: null, total_spent: 0, purchase_count: 0 };
  }
  const amount = Number(lastPurchase.amount_paid) || 0;
  if (amount === 0) {
    return { status: 'comp', label: 'Comp', last_payment_date: lastPurchase.purchase_date, amount_paid: 0, total_spent: 0, purchase_count: 0 };
  }
  return {
    status: 'paid', label: `$${amount.toFixed(0)}`,
    last_payment_date: lastPurchase.purchase_date, amount_paid: amount, total_spent: 0, purchase_count: 0,
  };
}

// Normalize delivery_method into 'take_home' or 'in_clinic'.
// Peptides are always take-home. HRT self-injection = take-home.
function normalizeFulfillmentType(deliveryMethod, category) {
  if (category === 'peptide') return 'take_home';
  const dm = (deliveryMethod || '').toLowerCase();
  if (dm === 'in_clinic' || dm === 'in-clinic') return 'in_clinic';
  if (dm === 'hybrid') return 'take_home';
  if (dm === 'self_injection' || dm === 'take_home' || dm === 'take-home' || dm === 'overnight') return 'take_home';
  if (!dm) return 'take_home';
  return 'take_home';
}

// Dispense status priority for sorting (lower = more urgent)
const DISPENSE_PRIORITY = { overdue: 0, due_now: 1, due_soon: 2, never: 3, active: 4 };
const PAYMENT_PRIORITY = { unknown: 0, comp: 1, paid: 2 };

export default async function handler(req, res) {
  if (req.method === 'POST') return handlePost(req, res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const todayISO = todayPacificISO();

  const supabase = getSupabase();

  try {
    // 1. All active protocols (HRT, WL, Peptide)
    const { data: allProtocols, error: protoErr } = await supabase
      .from('protocols')
      .select(`
        id, patient_id, program_type, program_name, medication, selected_dose, frequency,
        start_date, end_date, status, delivery_method, total_sessions, sessions_used,
        supply_type, injection_method, injection_frequency, last_refill_date, next_expected_date,
        checkin_cadence_days, injection_day, comp,
        patients!inner(id, name, first_name, last_name, phone, email)
      `)
      .eq('status', 'active');

    if (protoErr) throw protoErr;

    // Filter to the three medication categories, exclude in-clinic patients.
    // In-clinic fulfillment is handled by the appointment schedule — this
    // queue is strictly "who needs medication sent out."
    const protocols = (allProtocols || []).filter(p => {
      const t = (p.program_type || '').toLowerCase();
      if (!(isHRTType(t) || isWeightLossType(t) || isPeptideType(t))) return false;
      const ft = normalizeFulfillmentType(p.delivery_method, isHRTType(t) ? 'hrt' : isWeightLossType(t) ? 'weight_loss' : 'peptide');
      return ft !== 'in_clinic';
    });

    if (protocols.length === 0) {
      return res.status(200).json({ patients: [], stats: { total: 0, overdue: 0, due_this_week: 0, due_next_week: 0, needs_payment: 0, by_category: {} } });
    }

    const patientIds = [...new Set(protocols.map(p => p.patient_id))];

    // 2. Purchases — batched for all patients
    const { data: allPurchases } = await supabase
      .from('purchases')
      .select('patient_id, purchase_date, amount_paid, quantity, item_name, category')
      .in('patient_id', patientIds)
      .order('purchase_date', { ascending: false });

    // 3. Service logs (pickups) — for HRT dispense fallback
    const { data: allPickups } = await supabase
      .from('service_logs')
      .select('patient_id, protocol_id, entry_date, entry_type, quantity, supply_type, dosage, medication, fulfillment_method, category')
      .in('patient_id', patientIds)
      .eq('entry_type', 'pickup')
      .order('entry_date', { ascending: false });

    // 4. Notes — medication_queue + internal (from peptide/other trackers)
    const { data: allNotes } = await supabase
      .from('patient_notes')
      .select('id, patient_id, body, created_by, note_date, note_category, created_at')
      .in('patient_id', patientIds)
      .in('note_category', ['medication_queue', 'internal'])
      .order('created_at', { ascending: false })
      .limit(500);

    const notesByPatient = {};
    for (const n of (allNotes || [])) {
      if (!n.body) continue;
      if (!notesByPatient[n.patient_id]) notesByPatient[n.patient_id] = [];
      notesByPatient[n.patient_id].push(n);
    }

    // Index purchases by patient+category
    const purchasesByPatient = {};
    for (const p of (allPurchases || [])) {
      const key = p.patient_id;
      if (!purchasesByPatient[key]) purchasesByPatient[key] = [];
      purchasesByPatient[key].push(p);
    }

    // Index pickups by protocol
    const pickupsByProtocol = {};
    for (const p of (allPickups || [])) {
      const key = p.protocol_id || p.patient_id;
      if (!pickupsByProtocol[key]) pickupsByProtocol[key] = [];
      pickupsByProtocol[key].push(p);
    }

    // 5. Completed/inactive protocols for drawer context
    const { data: completedProtos } = await supabase
      .from('protocols')
      .select('id, patient_id, program_type, program_name, medication, selected_dose, frequency, start_date, end_date, status')
      .in('patient_id', patientIds)
      .in('status', ['completed', 'inactive', 'cancelled', 'paused']);

    const completedByPatient = {};
    for (const cp of (completedProtos || [])) {
      const t = (cp.program_type || '').toLowerCase();
      if (!(isHRTType(t) || isWeightLossType(t) || isPeptideType(t))) continue;
      if (!completedByPatient[cp.patient_id]) completedByPatient[cp.patient_id] = [];
      let category;
      if (isHRTType(t)) category = 'hrt';
      else if (isWeightLossType(t)) category = 'weight_loss';
      else category = 'peptide';
      completedByPatient[cp.patient_id].push({
        protocol_id: cp.id,
        medication: cp.medication || cp.program_name || 'Unknown',
        dose: cp.selected_dose || '',
        frequency: cp.frequency || '',
        category,
        status: cp.status,
        start_date: cp.start_date,
        end_date: cp.end_date,
      });
    }

    // 6. Build unified rows
    const rows = [];

    for (const proto of protocols) {
      const patient = proto.patients;
      const pType = (proto.program_type || '').toLowerCase();
      const patientPurchases = purchasesByPatient[proto.patient_id] || [];

      let category, categoryLabel;
      if (isHRTType(pType)) { category = 'hrt'; categoryLabel = 'HRT'; }
      else if (isWeightLossType(pType)) { category = 'weight_loss'; categoryLabel = 'Weight Loss'; }
      else { category = 'peptide'; categoryLabel = 'Peptide'; }

      // Filter purchases to this category
      const categoryPurchases = patientPurchases.filter(p => {
        const cat = (p.category || '').toLowerCase();
        if (category === 'hrt') return cat.includes('hrt') || cat.includes('hormone') || cat.includes('testosterone');
        if (category === 'weight_loss') return cat.includes('weight');
        return cat.includes('peptide');
      });
      const lastPurchase = categoryPurchases[0] || null;

      // Payment
      const payment = computePaymentStatus(lastPurchase, proto.comp);
      if (categoryPurchases.length > 0) {
        payment.total_spent = categoryPurchases.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
        payment.purchase_count = categoryPurchases.length;
      }

      // Dispense
      let dispense;
      if (category === 'hrt') {
        const protoPickups = pickupsByProtocol[proto.id] || [];
        const lastPickup = protoPickups[0] || null;
        dispense = computeHRTDispense(proto, lastPickup, todayISO);
      } else if (category === 'weight_loss') {
        const cadenceDays = proto.checkin_cadence_days || parseFrequencyDays(proto.frequency) || 7;
        const wlDispense = computeWLDispense(cadenceDays, lastPurchase, todayISO);
        dispense = {
          status: wlDispense.state === 'send_now' ? 'overdue' : wlDispense.state === 'due_now' ? 'due_now' : wlDispense.state === 'due_soon' ? 'due_soon' : wlDispense.state === 'active' ? 'active' : 'never',
          label: wlDispense.label,
          last_dispensed_date: wlDispense.last_dispensed_date,
          next_due_date: null,
          days_until_due: wlDispense.days_until_due,
          sessions_remaining: wlDispense.sessions_remaining,
          total_sessions: wlDispense.total,
        };
      } else {
        dispense = computePeptideDispense(proto, todayISO);
      }

      rows.push({
        protocol_id: proto.id,
        patient_id: proto.patient_id,
        name: patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        first_name: patient.first_name || (patient.name || '').split(' ')[0],
        initials: getInitials(patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`),
        phone: patient.phone,
        email: patient.email,
        category,
        category_label: categoryLabel,
        program_type: proto.program_type,
        medication: proto.medication || proto.program_name || 'Unknown',
        dose: proto.selected_dose || '',
        frequency: proto.frequency || '',
        delivery_method: proto.delivery_method || '',
        start_date: proto.start_date,
        end_date: proto.end_date,
        days_on_protocol: proto.start_date ? daysBetween(proto.start_date, todayISO) : null,
        dispense,
        payment,
        notes: notesByPatient[proto.patient_id] || [],
        completed_protocols: completedByPatient[proto.patient_id] || [],
      });
    }

    // Sort: overdue first, then due_now, due_soon, never, active
    rows.sort((a, b) => {
      const pa = DISPENSE_PRIORITY[a.dispense.status] ?? 5;
      const pb = DISPENSE_PRIORITY[b.dispense.status] ?? 5;
      if (pa !== pb) return pa - pb;
      // Within same priority, sort by days_until_due ascending (most urgent first)
      const da = a.dispense.days_until_due ?? 9999;
      const db = b.dispense.days_until_due ?? 9999;
      return da - db;
    });

    // Stats
    const stats = {
      total: rows.length,
      overdue: rows.filter(r => r.dispense.status === 'overdue').length,
      due_this_week: rows.filter(r => r.dispense.status === 'due_now').length,
      due_next_week: rows.filter(r => r.dispense.status === 'due_soon').length,
      needs_payment: rows.filter(r => r.payment.status === 'unknown').length,
      by_category: {
        hrt: rows.filter(r => r.category === 'hrt').length,
        weight_loss: rows.filter(r => r.category === 'weight_loss').length,
        peptide: rows.filter(r => r.category === 'peptide').length,
      },
    };

    return res.status(200).json({ patients: rows, stats, today: todayISO });

  } catch (err) {
    console.error('[medication-queue] error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

// --- POST: Save a medication queue note ---
async function handlePost(req, res) {
  const { action, patient_id, body: noteBody, created_by } = req.body;

  if (action !== 'save_note') {
    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  if (!patient_id || !noteBody?.trim()) {
    return res.status(400).json({ error: 'patient_id and body are required' });
  }

  const supabase = getSupabase();

  const nowISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

  const { data, error } = await supabase
    .from('patient_notes')
    .insert({
      patient_id,
      body: noteBody.trim(),
      created_by: created_by || 'Staff',
      note_date: nowISO,
      source: 'manual',
      status: 'draft',
      note_category: 'medication_queue',
    })
    .select('id, patient_id, body, created_by, note_date, created_at')
    .single();

  if (error) {
    console.error('[medication-queue] save note error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, note: data });
}
