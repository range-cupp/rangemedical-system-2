// /pages/api/medication-checkout/index.js
// Universal Medication Checkout API
// Orchestrates: service log creation, protocol update, receipt sending
// Handles both covered (membership/protocol) and paid checkouts

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateReceiptHtml } from '../../../lib/receipt-email';
import { todayPacific } from '../../../lib/date-utils';
import { isWeightLossType } from '../../../lib/protocol-config';
import { guardDoseChange } from '../../../lib/dose-change-guard';
import { spawnTakeHomeInjections } from '../../../lib/spawn-takehome-injections';
import { recountProtocolSessions } from '../../../lib/recount-protocol-sessions';
import { createServiceLogEntry } from '../../../lib/service-log-engine';
// Controlled substance staff config — used for logging, not blocking
// Dose approval is enforced via dose-change-requests SMS flow

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function parseInjectionFrequency(...args) {
  for (const val of args) {
    if (!val) continue;
    const n = parseInt(val);
    if (n > 0) return n;
    const s = String(val).toLowerCase().trim();
    if (s === 'daily' || s === '7 days a week') return 7;
    if (s === 'every 3.5 days' || s === 'every_3_5_days') return 2;
    if (s === 'every other day' || s === 'eod') return 4;
    if (s === '3x per week') return 3;
    if (s === '2x per week' || s === 'twice weekly') return 2;
    if (s === 'weekly') return 1;
  }
  return 0;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    patient_id,
    category,          // testosterone, weight_loss, peptide, iv_therapy, hbot, red_light, vitamin, supplement
    entry_type,        // injection, pickup, session, med_pickup
    medication,
    dosage,
    quantity,
    supply_type,       // prefilled_1week..8week, vial_5ml, vial_10ml, etc.
    duration,          // session duration in minutes (HBOT, RLT)
    weight,            // for weight loss weigh-ins
    notes,

    // Protocol linking
    protocol_id,       // link to specific protocol
    coverage_type,     // subscription, protocol, paid, comp
    coverage_source,   // display name: "HRT Membership", "Weight Loss Program", etc.

    // Dispensing details
    administered_by,
    lot_number,
    expiration_date,
    fulfillment_method, // in_clinic, overnight
    tracking_number,

    // Verification (testosterone + weight loss dual-sign-off)
    verified_by,

    // For paid checkouts (when coverage_type === 'paid')
    // Payment is handled by POSChargeModal — this just records the dispensing
    purchase_id,       // if created via POS payment flow

    // Weight loss multi-injection
    injection_method,
    injection_frequency,
    wl_frequency_days,

    // Free-text frequency for secondary HRT meds (HCG, Gonadorelin, Nandrolone)
    // e.g. "2x/week", "Every other day"
    frequency,

    // Date override (for backdating)
    entry_date,

    // Email control
    send_receipt = true,   // default true; front desk can toggle off for multi-checkout visits
  } = req.body;

  if (!patient_id || !category) {
    return res.status(400).json({ error: 'Missing required fields: patient_id, category' });
  }

  // ── Controlled substance logging (testosterone) ──
  // Dose changes require Dr. Burgess approval via SMS (handled by dose-change-requests API).
  // Dispensing is logged with administered_by and verified_by when provided,
  // but does not block the checkout — the approval gate is on the dose change, not here.

  const logDate = entry_date || todayPacific();

  // Determine if this is an in-clinic purchase (not a take-home pickup)
  // For in-clinic: checkout only sets available injections on the protocol.
  // Actual injection tracking comes from encounter notes / service logs only.
  const resolvedEntryType = entry_type || (['hbot', 'iv_therapy', 'red_light'].includes(category) ? 'session' : 'injection');
  const isWLInClinic = isWeightLossType(category) && resolvedEntryType !== 'pickup' && resolvedEntryType !== 'med_pickup';
  const isPeptideInClinic = category === 'peptide' && fulfillment_method === 'in_clinic_injections';
  const isInClinicPurchase = isWLInClinic || isPeptideInClinic;

  try {
    // 1. Get patient info for receipt
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, email, phone')
      .eq('id', patient_id)
      .single();

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientName = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();

    let finalLog = null;

    // 2. For in-clinic purchases (WL or peptide): do NOT create a service log — encounter notes are the sole source
    // For everything else (take-home pickups, other categories): create service log as before
    if (!isInClinicPurchase) {
      const { log: serviceLog, error: engineErr } = await createServiceLogEntry(supabase, {
        patient_id,
        category,
        entry_type: resolvedEntryType,
        entry_date: logDate,
        medication: medication || null,
        dosage: dosage || null,
        weight,
        quantity,
        supply_type: supply_type || null,
        duration,
        notes: notes || null,
        protocol_id: protocol_id || null,
        administered_by: administered_by || null,
        verified_by: verified_by || null,
        lot_number: lot_number || null,
        expiration_date: expiration_date || null,
        fulfillment_method: fulfillment_method || 'in_clinic',
        tracking_number: tracking_number || null,
      }, { skipDuplicateCheck: true });

      if (engineErr) throw new Error(engineErr);
      finalLog = serviceLog;
    }

    // 3. Update protocol if linked
    // Wrapped: protocol update issues must not block the auto-schedule below.
    let protocolUpdate = { updated: false };

    if (protocol_id) {
      try {
        protocolUpdate = await updateProtocol(protocol_id, {
          category,
          entryType: resolvedEntryType,
          logDate,
          medication,
          dosage,
          quantity,
          supply_type,
          injection_method,
          injection_frequency,
          frequency,
          isInClinicPurchase,
        });
      } catch (puErr) {
        console.error('[medication-checkout] updateProtocol threw — continuing to auto-schedule:', puErr.message);
        protocolUpdate = { updated: false, error: puErr.message };
      }
    }

    // 4. Weight-loss take-home pickups: spawn one injection row per dose
    // dispensed, dated for the patient's injection_day. Range's WL programs
    // run weekly without skipped weeks, so dispensing implies a real
    // injection in a known future week. Spawned rows are idempotent (skip
    // if any injection/session log already exists within ±3 days of the
    // target). Encounter notes that arrive later link to the spawned rows
    // via the wl-note-sync date-window match instead of creating duplicates.
    try {
      const isWLTakeHomePickup = finalLog
        && isWeightLossType(category)
        && (resolvedEntryType === 'pickup' || resolvedEntryType === 'med_pickup')
        && (parseInt(quantity || 0) > 0)
        && fulfillment_method !== 'in_clinic_injections'
        && protocol_id;
      if (isWLTakeHomePickup) {
        const { data: protoRow } = await supabase
          .from('protocols')
          .select('id, frequency, injection_day, medication, selected_dose, dose, delivery_method')
          .eq('id', protocol_id)
          .single();
        if (protoRow) {
          await spawnTakeHomeInjections(supabase, finalLog, protoRow);
        }
      }
    } catch (spawnErr) {
      console.error('[medication-checkout] WL spawn error (non-fatal):', spawnErr.message);
    }

    // 4b. For HRT TAKE-HOME pickups, create future injection entries
    // Same logic as service-log: auto-create individual injection entries dated to the
    // patient's injection schedule (2x/week = Mon/Thu alternating 3/4 day gaps)
    // Wrapped in its own try/catch — must NEVER be skipped due to upstream errors.
    // Skip when the dispensed medication is a secondary HRT med (HCG, Gonadorelin, etc.)
    // — the testosterone schedule should not be redrawn from a secondary-med pickup.
    try {
      let secondaryMedSkip = false;
      if (protocol_id && medication) {
        const { data: protoForSecCheck } = await supabase
          .from('protocols')
          .select('secondary_medications')
          .eq('id', protocol_id)
          .single();
        if (protoForSecCheck) {
          secondaryMedSkip = isSecondaryMedicationOnProtocol(protoForSecCheck, medication);
        }
      }
      // Skip auto-schedule for vials — quantity = number of vials, not doses.
      // The patient self-draws doses from the vial; next_expected_date is computed
      // from vial size + dose + frequency in updateProtocol (supplyDays branch).
      const isVialSupply = (supply_type || '').startsWith('vial');
      const isHRTPickup = !isInClinicPurchase && category === 'testosterone' && resolvedEntryType === 'pickup' && quantity && parseInt(quantity) > 0 && !secondaryMedSkip && !isVialSupply;
      if (isHRTPickup) {
        const hrtPickupQty = parseInt(quantity);
        const pickupDosage = dosage || '';
        const atMatch = pickupDosage.match(/@\s*(.+)/);
        const injectionDose = atMatch ? atMatch[1].trim() : pickupDosage;

        // Get injection frequency from request, or look it up from the protocol
        let freq = parseInjectionFrequency(injection_frequency, frequency);
        if (!freq && protocol_id) {
          const { data: proto } = await supabase.from('protocols').select('injection_frequency, frequency').eq('id', protocol_id).single();
          freq = parseInjectionFrequency(proto?.injection_frequency, proto?.frequency) || 2;
        }
        if (!freq) freq = 2; // default 2x/week

        // Skip if injections already auto-scheduled for this exact pickup
        // (idempotency: re-saving the same dispense shouldn't double-schedule)
        const { count: existingFutureCount } = await supabase
          .from('service_logs')
          .select('*', { count: 'exact', head: true })
          .eq('protocol_id', protocol_id)
          .eq('entry_type', 'injection')
          .eq('fulfillment_method', 'take_home')
          .gt('entry_date', logDate)
          .ilike('notes', `%dispensed ${logDate}, ${hrtPickupQty}-syringe pickup%`);

        if (existingFutureCount && existingFutureCount > 0) {
          console.log(`[medication-checkout] HRT auto-schedule: ${existingFutureCount} entries already exist for ${logDate} pickup — skipping`);
        } else {
          let dayOffset = 0;
          let useShortGap = true;
          let createdHrt = 0;

          for (let i = 0; i < hrtPickupQty; i++) {
            if (freq >= 7) {
              dayOffset += 1;
            } else if (freq === 3) {
              const gaps = [2, 2, 3];
              dayOffset += gaps[i % 3];
            } else {
              dayOffset += useShortGap ? 3 : 4;
              useShortGap = !useShortGap;
            }

            const injDate = new Date(logDate + 'T12:00:00');
            injDate.setDate(injDate.getDate() + dayOffset);
            const injDateStr = injDate.toISOString().split('T')[0];

            const { error: hrtInjErr } = await createServiceLogEntry(supabase, {
              patient_id,
              category,
              entry_type: 'injection',
              entry_date: injDateStr,
              medication: medication || null,
              dosage: injectionDose || null,
              quantity: 1,
              notes: `Take-home injection (dispensed ${logDate}, ${hrtPickupQty}-syringe pickup, ${i + 1} of ${hrtPickupQty})`,
              protocol_id: protocol_id || null,
              fulfillment_method: 'take_home',
              status: 'scheduled',
            }, { skipDuplicateCheck: true, skipBillingCheck: true, skipRecount: true });
            if (hrtInjErr) {
              console.error(`[medication-checkout] HRT auto-schedule insert failed for ${injDateStr}:`, hrtInjErr);
            } else {
              createdHrt++;
            }
          }
          console.log(`[medication-checkout] HRT auto-schedule: created ${createdHrt}/${hrtPickupQty} injection entries`);

          // Sync sessions_used + next_expected_date — wrapped so DB blip on one update doesn't kill the other
          if (protocol_id) {
            try {
              const { count: hrtCount } = await supabase
                .from('service_logs')
                .select('*', { count: 'exact', head: true })
                .eq('protocol_id', protocol_id)
                .in('entry_type', ['injection', 'session'])
                .neq('status', 'scheduled');

              const lastInjOffset = dayOffset;
              const nextGapDays = freq >= 7 ? 1 : freq === 3 ? 2 : (hrtPickupQty % 2 === 1 ? 4 : 3);
              const nextAfterLast = new Date(logDate + 'T12:00:00');
              nextAfterLast.setDate(nextAfterLast.getDate() + lastInjOffset + nextGapDays);

              await supabase
                .from('protocols')
                .update({
                  sessions_used: hrtCount || 0,
                  next_expected_date: nextAfterLast.toISOString().split('T')[0],
                  updated_at: new Date().toISOString(),
                })
                .eq('id', protocol_id);
            } catch (syncErr) {
              console.error('[medication-checkout] HRT sessions_used/next_expected sync error:', syncErr.message);
            }
          }
        }
      }
    } catch (hrtErr) {
      console.error('[medication-checkout] HRT auto-schedule block error:', hrtErr.message);
    }

    // 5. Send receipt/confirmation email (if enabled)
    try {
      const isCovered = coverage_type === 'subscription' || coverage_type === 'protocol' || coverage_type === 'comp';
      if (send_receipt) await sendCheckoutReceipt({
        patient,
        patientName,
        medication,
        category,
        quantity,
        supply_type,
        dosage,
        isCovered,
        coverageSource: coverage_source,
        logDate,
      });
    } catch (rcptErr) {
      console.error('[medication-checkout] Receipt send error:', rcptErr.message);
    }

    return res.status(200).json({
      success: true,
      service_log: finalLog,
      protocol_update: protocolUpdate,
      receipt_sent: send_receipt && !!patient.email,
      dose_change_blocked: protocolUpdate?.dose_change_blocked || false,
      dose_change_blocked_reason: protocolUpdate?.dose_change_blocked_reason || null,
    });
  } catch (err) {
    console.error('[medication-checkout] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Parse a frequency string (e.g. "2x/week", "Daily") into doses-per-week.
function parseFrequencyPerWeek(freq) {
  if (!freq) return null;
  const f = freq.toLowerCase().replace(/\s+/g, '');
  if (/daily/.test(f)) return 7;
  if (/everyotherday/.test(f)) return 3.5;
  const m = f.match(/^(\d+)x?\/?week/);
  if (m) return parseInt(m[1]);
  if (/twiceweekly|2timesperweek/.test(f)) return 2;
  if (/threetimesperweek/.test(f)) return 3;
  if (/weekly|1x?\/?week/.test(f)) return 1;
  if (/everyotherweek|biweekly/.test(f)) return 0.5;
  return null;
}

// Fallback doses-per-week when frequency isn't stored on the protocol entry.
const SECONDARY_DEFAULT_FREQ = {
  HCG: 2,
  Gonadorelin: 7,
  Nandrolone: 1,
  Anastrozole: 2,
};

// Detect whether the dispensed `medication` is a secondary med on this protocol.
// Secondary HRT meds (HCG, Gonadorelin, Nandrolone, Anastrozole) are tracked
// inside the parent protocol's `secondary_medication_details` JSON, not as
// their own protocol row. Dispensing them must NOT overwrite the primary
// protocol's medication / dose / supply / next_expected_date.
function isSecondaryMedicationOnProtocol(protocol, medication) {
  if (!medication) return false;
  let secMeds = [];
  try {
    const raw = protocol.secondary_medications;
    secMeds = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
  } catch { secMeds = []; }
  const med = medication.toLowerCase();
  return (secMeds || []).some(s => (s || '').toLowerCase() === med);
}

// Update only the matching entry inside protocol.secondary_medication_details.
// Mirrors syncSecondaryMedPickup in /api/service-log so pickups land on the
// right place regardless of which endpoint logged them.
async function updateSecondaryMedDetails(protocol, { medication, dosage, quantity, supply_type, frequency, logDate }) {
  let existing = [];
  try {
    const raw = protocol.secondary_medication_details;
    existing = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
  } catch { existing = []; }

  const qty = quantity ? parseInt(quantity) : 1;

  const idx = (existing || []).findIndex(d => (d.medication || d.name || '').toLowerCase() === medication.toLowerCase());
  const prev = idx >= 0 ? (existing[idx] || {}) : {};

  // Resolve frequency (request → previously stored → med-specific default)
  const resolvedFrequency = frequency || prev.frequency || null;
  const dosesPerWeek = parseFrequencyPerWeek(resolvedFrequency)
    || SECONDARY_DEFAULT_FREQ[medication]
    || 2;

  // Compute how many doses the dispensed quantity provides.
  // For vial supplies (e.g. HCG vial_5000iu): qty = number of vials, doses = vials × (IU per vial / dose IU).
  // For prefilled syringes / unspecified: qty = number of doses directly.
  let totalDoses = qty;
  if (supply_type && supply_type.startsWith('vial')) {
    const iuPerVial = supply_type === 'vial_5000iu' ? 5000 : null;
    const doseIuMatch = (dosage || '').match(/([\d.]+)\s*iu/i);
    const doseIu = doseIuMatch ? parseFloat(doseIuMatch[1]) : 0;
    if (iuPerVial && doseIu > 0) {
      totalDoses = qty * Math.floor(iuPerVial / doseIu);
    }
  }

  const refillDays = Math.max(1, Math.round(totalDoses / dosesPerWeek * 7));
  const nextDate = new Date(logDate + 'T12:00:00');
  nextDate.setDate(nextDate.getDate() + refillDays);
  const nextExpected = nextDate.toISOString().split('T')[0];

  const merged = {
    ...prev,
    medication,
    dosage: dosage || prev.dosage || null,
    frequency: resolvedFrequency,
    supply_type: supply_type || prev.supply_type || null,
    quantity: qty,
    last_refill_date: logDate,
    next_expected_date: nextExpected,
  };
  if (idx >= 0) existing[idx] = merged; else existing.push(merged);

  const { error: updateErr } = await supabase
    .from('protocols')
    .update({
      secondary_medication_details: existing,
      updated_at: new Date().toISOString(),
    })
    .eq('id', protocol.id);

  if (updateErr) throw updateErr;
  return { last_refill_date: logDate, next_expected_date: nextExpected };
}

// Update protocol based on checkout
async function updateProtocol(protocolId, opts) {
  const { category, entryType, logDate, medication, dosage, quantity, supply_type, injection_method, injection_frequency, frequency, isInClinicPurchase } = opts;

  try {
    const { data: protocol, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', protocolId)
      .single();

    if (error || !protocol) {
      return { updated: false, error: 'Protocol not found' };
    }

    // Secondary HRT med pickup (e.g. HCG against the testosterone protocol):
    // route to secondary_medication_details and short-circuit so we never
    // overwrite the primary medication's refill date / dose / supply.
    if ((entryType === 'pickup' || entryType === 'med_pickup') && isSecondaryMedicationOnProtocol(protocol, medication)) {
      try {
        const secResult = await updateSecondaryMedDetails(protocol, { medication, dosage, quantity, supply_type, frequency, logDate });
        return { updated: true, protocol_id: protocolId, mode: 'secondary_med_pickup', medication, ...secResult };
      } catch (secErr) {
        console.error('[medication-checkout] secondary med update failed:', secErr.message);
        return { updated: false, error: secErr.message, mode: 'secondary_med_pickup' };
      }
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    let doseChangeBlocked = false;
    let doseChangeBlockedReason = null;

    const protocolCategory = protocol.program_type || category;
    const categoryMatchesProtocol = category === protocolCategory || isWeightLossType(category) === isWeightLossType(protocolCategory);

    // ── IN-CLINIC PURCHASE (WL or Peptide) ──
    // Only sets available injections (total_sessions). Does NOT touch sessions_used.
    // Encounter notes / service logs are the sole source of injection tracking for in-clinic protocols.
    if (isInClinicPurchase) {
      const purchaseQty = quantity ? parseInt(quantity) : 1;
      const currentTotal = protocol.total_sessions || 0;

      // Always add to total_sessions — each checkout represents a new injection being made available.
      // The nurse logs the actual injection via encounter notes, which increments sessions_used.
      updates.total_sessions = currentTotal + purchaseQty;

      // Update medication details if provided
      if (categoryMatchesProtocol || category === 'peptide') {
        if (medication) updates.medication = medication;
        if (dosage) {
          const guard = await guardDoseChange(
            supabase,
            protocol,
            { selected_dose: dosage },
            { mode: 'strip' }
          );
          if (guard.blocked && guard.blocked.length > 0) {
            doseChangeBlocked = true;
            doseChangeBlockedReason = guard.reason;
            console.warn(`[dose-guard] medication-checkout in-clinic: stripped dose write on protocol ${protocolId} (${protocol.selected_dose} → ${dosage})`);
          } else {
            updates.selected_dose = dosage;
          }
        }
      }
      if (injection_method) updates.injection_method = injection_method;
      if (injection_frequency) updates.injection_frequency = parseInt(injection_frequency);

      // Set delivery_method so appointment sync knows this is in-clinic
      updates.delivery_method = 'in_clinic';

      const { error: updateError } = await supabase
        .from('protocols')
        .update(updates)
        .eq('id', protocolId);

      if (updateError) throw updateError;
      return { updated: true, protocol_id: protocolId, updates, mode: 'in_clinic_purchase', dose_change_blocked: doseChangeBlocked, dose_change_blocked_reason: doseChangeBlockedReason };
    }

    // ── TAKE-HOME / SINGLE INJECTION PATH (existing behavior) ──
    updates.last_visit_date = logDate;

    // Persist injection method + frequency if provided
    if (injection_method) updates.injection_method = injection_method;
    if (injection_frequency) {
      const parsedFreq = parseInjectionFrequency(injection_frequency, frequency);
      if (parsedFreq) {
        updates.injection_frequency = parsedFreq;
        updates.injections_per_week = parsedFreq;
      }
    } else if (frequency) {
      const parsedFreq = parseInjectionFrequency(frequency);
      if (parsedFreq) {
        updates.injection_frequency = parsedFreq;
        updates.injections_per_week = parsedFreq;
      }
    }

    // For session/injection-based protocols, calculate next expected date
    // sessions_used will be recounted from service_logs after the update
    if ((entryType === 'injection' || entryType === 'session') && protocol.total_sessions && categoryMatchesProtocol) {
      const nextDate = new Date(logDate + 'T12:00:00');
      nextDate.setDate(nextDate.getDate() + 7);
      updates.next_expected_date = nextDate.toISOString().split('T')[0];
    }

    // For pickups (HRT, peptide, WL take-home), update refill tracking
    if (entryType === 'pickup' || entryType === 'med_pickup') {
      updates.last_refill_date = logDate;

      // For WL take-home pickups: extend total_sessions if needed
      // sessions_used is recounted from service_logs after update
      if (isWeightLossType(category) && quantity && parseInt(quantity) > 0) {
        const pickupQty = parseInt(quantity);
        const currentUsed = protocol.sessions_used || 0;
        const currentTotal = protocol.total_sessions || 0;
        const newUsed = currentUsed + pickupQty;

        if (newUsed > currentTotal) {
          updates.total_sessions = newUsed;
        }
      }

      // Calculate next expected date based on supply type + quantity
      if (supply_type) {
        const supplyDays = {
          // Legacy fixed values
          prefilled_1week: 7,
          prefilled_2week: 14,
          prefilled_3week: 21,
          prefilled_4week: 28,
          prefilled_8week: 56,
        };

        // Resolve effective injections-per-week: prefer incoming request, fall back to protocol
        const effectiveIpw = parseInjectionFrequency(injection_frequency, frequency, protocol.injection_frequency) || 2;

        // Vials: calculate from actual dosage + injection frequency
        if (supply_type.startsWith('vial')) {
          const vialMl = supply_type === 'vial_5ml' ? 5 : 10;
          const ipw = effectiveIpw;
          const mlMatch = (dosage || '').match(/([\d.]+)ml/);
          const doseMl = mlMatch ? parseFloat(mlMatch[1]) : 0;
          if (doseMl > 0) {
            const totalInj = Math.floor(vialMl / doseMl);
            const weeks = totalInj / ipw;
            supplyDays[supply_type] = Math.round(weeks * 7);
          } else {
            supplyDays[supply_type] = supply_type === 'vial_5ml' ? 70 : 140;
          }
        }

        // For 'prefilled' (new simplified) or prefilled_N (legacy), calculate from quantity + frequency
        // Walk the injection schedule to find when the NEXT injection falls after the last dispensed syringe
        if ((supply_type === 'prefilled' || supply_type.match(/^prefilled_(\d+)$/)) && quantity && parseInt(quantity) > 0) {
          const injCount = parseInt(quantity);
          const ipw = effectiveIpw;
          let dayOffset = 0;
          let useShortGap = true;
          for (let i = 0; i < injCount + 1; i++) { // +1 to get NEXT injection date
            if (ipw >= 7) { dayOffset += 1; }
            else if (ipw === 3) { dayOffset += [2, 2, 3][i % 3]; }
            else { dayOffset += useShortGap ? 3 : 4; useShortGap = !useShortGap; }
          }
          supplyDays[supply_type] = dayOffset;
        }

        if (supplyDays[supply_type]) {
          const nextDate = new Date(logDate + 'T12:00:00');
          nextDate.setDate(nextDate.getDate() + supplyDays[supply_type]);
          updates.next_expected_date = nextDate.toISOString().split('T')[0];
        }
      } else if (quantity) {
        // For peptide/WL pickups, use quantity × frequency days
        // Check protocol frequency for WL: "Every 14 Days" → 14, "Every 10 Days" → 10, else 7
        let perInjDays = 7;
        if (isWeightLossType(category)) {
          if (wl_frequency_days) {
            perInjDays = parseInt(wl_frequency_days);
          } else if (protocol.frequency) {
            const freqStr = protocol.frequency.toLowerCase();
            if (freqStr.includes('14') || freqStr.includes('biweekly') || freqStr.includes('bi-weekly')) perInjDays = 14;
            else if (freqStr.includes('10')) perInjDays = 10;
          }
        }
        let days = parseInt(quantity) * perInjDays;

        // If there's an in-clinic injection on the same day as the pickup,
        // the take-home supply starts the following interval
        if (isWeightLossType(category)) {
          const { data: sameDayInjection } = await supabase
            .from('service_logs')
            .select('id')
            .eq('patient_id', protocol.patient_id)
            .eq('protocol_id', protocolId)
            .eq('entry_date', logDate)
            .eq('entry_type', 'injection')
            .limit(1);
          if (sameDayInjection && sameDayInjection.length > 0) {
            days += perInjDays;
          }
        }

        const nextDate = new Date(logDate + 'T12:00:00');
        nextDate.setDate(nextDate.getDate() + (days || 30));
        updates.next_expected_date = nextDate.toISOString().split('T')[0];
      }

      // Update medication details only if the checkout item matches the protocol's category
      // AND it's the primary medication (prevents secondary meds like HCG from overwriting
      // the protocol's primary medication, e.g. Testosterone Cypionate)
      if (categoryMatchesProtocol) {
        let isSecondaryMed = false;
        try {
          const secMeds = protocol.secondary_medications
            ? (typeof protocol.secondary_medications === 'string' ? JSON.parse(protocol.secondary_medications) : protocol.secondary_medications)
            : [];
          isSecondaryMed = secMeds.includes(medication);
        } catch {}
        if (!isSecondaryMed) {
          if (medication) updates.medication = medication;
          if (dosage) {
            const guard = await guardDoseChange(
              supabase,
              protocol,
              { selected_dose: dosage },
              { mode: 'strip' }
            );
            if (guard.blocked && guard.blocked.length > 0) {
              doseChangeBlocked = true;
              doseChangeBlockedReason = guard.reason;
              console.warn(`[dose-guard] medication-checkout pickup: stripped dose write on protocol ${protocolId} (${protocol.selected_dose} → ${dosage})`);
            } else {
              updates.selected_dose = dosage;
            }
          }
        }
      }

      // Persist supply tracking fields so the protocol page shows dispensing details
      if (supply_type) updates.supply_type = supply_type;
      if (quantity) updates.supply_quantity = parseInt(quantity);
      if (updates.next_expected_date && logDate) {
        const dispDate = new Date(logDate + 'T12:00:00');
        const nextDate = new Date(updates.next_expected_date + 'T12:00:00');
        updates.supply_days = Math.round((nextDate - dispDate) / (1000 * 60 * 60 * 24));
      }
      updates.supply_dispensed_date = logDate;

      // Extend end_date if protocol is at or past its end_date (e.g., HRT refill a day late)
      if (protocol.end_date && protocol.end_date <= logDate && updates.next_expected_date) {
        updates.end_date = updates.next_expected_date;
      }
    }

    const { error: updateError } = await supabase
      .from('protocols')
      .update(updates)
      .eq('id', protocolId);

    if (updateError) throw updateError;

    // Recount sessions_used from service_logs (single source of truth)
    await recountProtocolSessions(supabase, protocolId);

    return { updated: true, protocol_id: protocolId, updates, dose_change_blocked: doseChangeBlocked, dose_change_blocked_reason: doseChangeBlockedReason };
  } catch (err) {
    console.error('[medication-checkout] Protocol update error:', err);
    return { updated: false, error: err.message };
  }
}

// Send checkout receipt email
async function sendCheckoutReceipt({ patient, patientName, medication, category, quantity, supply_type, dosage, isCovered, coverageSource, logDate }) {
  if (!patient.email) return;

  const firstName = (patientName || '').split(' ')[0] || 'there';

  // Build description
  const categoryLabels = {
    testosterone: 'HRT Medication',
    weight_loss: 'Weight Loss',
    peptide: 'Peptide',
    iv_therapy: 'IV Therapy',
    hbot: 'HBOT Session',
    red_light: 'Red Light Therapy',
    vitamin: 'Vitamin Injection',
    supplement: 'Supplement',
  };

  const catLabel = categoryLabels[category] || category;
  let description = medication ? `${catLabel} — ${medication}` : catLabel;
  if (dosage) description += ` (${dosage})`;
  if (supply_type) {
    const supplyLabels = {
      prefilled: 'Pre-filled',
      vial_5ml: '5ml Vial',
      vial_10ml: '10ml Vial',
      vial: 'Vial',
      // Legacy
      prefilled_1week: '1 Week Supply',
      prefilled_2week: '2 Week Supply',
      prefilled_4week: '4 Week Supply',
    };
    let label = supplyLabels[supply_type] || supply_type;
    // For prefilled + quantity, show "Pre-filled (X injections)"
    if (supply_type === 'prefilled' && quantity && parseInt(quantity) > 0) {
      label = `Pre-filled (${quantity} injections)`;
    }
    description += ` — ${label}`;
  }

  try {
    if (isCovered) {
      // Send covered-by-membership receipt
      const html = generateCoveredReceiptHtml({
        firstName,
        patientName,
        description,
        coverageSource,
        date: logDate,
      });

      await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: patient.email,
        subject: `Checkout Confirmation — ${catLabel}`,
        html,
      });
    } else {
      // For paid items, the POS flow already sends a receipt
      // Only send a dispensing confirmation
      const html = generateCoveredReceiptHtml({
        firstName,
        patientName,
        description,
        coverageSource: 'Paid at checkout',
        date: logDate,
      });

      await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: patient.email,
        subject: `Checkout Confirmation — ${catLabel}`,
        html,
      });
    }
  } catch (err) {
    console.error('[medication-checkout] Receipt email error:', err.message);
  }
}

// Generate HTML for covered/zero-balance receipt
function generateCoveredReceiptHtml({ firstName, patientName, description, coverageSource, date }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e5e5e5;">
  <!-- Header -->
  <tr><td style="background:#000;padding:24px 32px;">
    <table width="100%"><tr>
      <td style="color:#fff;font-size:18px;font-weight:700;letter-spacing:1px;">RANGE MEDICAL</td>
      <td style="color:#999;font-size:12px;text-align:right;">Checkout Confirmation</td>
    </tr></table>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px;">
    <p style="margin:0 0 20px;font-size:16px;color:#111;">Hi ${firstName},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#333;line-height:1.6;">
      Thank you for visiting Range Medical. Here's a summary of your checkout today.
    </p>

    <!-- Service Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;margin:0 0 24px;">
      <tr><td style="padding:16px;border-bottom:1px solid #f0f0f0;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666;margin:0 0 6px;">Service</div>
        <div style="font-size:15px;font-weight:600;color:#111;">${description}</div>
      </td></tr>
      <tr><td style="padding:16px;border-bottom:1px solid #f0f0f0;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666;margin:0 0 6px;">Date</div>
        <div style="font-size:14px;color:#111;">${new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' , timeZone: 'America/Los_Angeles' })}</div>
      </td></tr>
      <tr><td style="padding:16px;border-bottom:1px solid #f0f0f0;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666;margin:0 0 6px;">Coverage</div>
        <div style="font-size:14px;color:#16a34a;font-weight:600;">${coverageSource}</div>
      </td></tr>
      <tr><td style="padding:16px;background:#f8fdf8;">
        <table width="100%"><tr>
          <td style="font-size:13px;color:#666;">Balance Due</td>
          <td style="font-size:20px;font-weight:700;color:#16a34a;text-align:right;">$0.00</td>
        </tr></table>
      </td></tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#666;">
      Questions? Call or text us at <strong>(949) 997-3988</strong>
    </p>
    <p style="margin:0;font-size:12px;color:#999;">
      range-medical.com &bull; 1901 Westcliff Drive, Suite 10, Newport Beach, CA
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// syncWeightToVitals now handled by service-log-engine
