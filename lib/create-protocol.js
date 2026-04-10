// lib/create-protocol.js
// Single entry point for all protocol creation in Range Medical CRM.
// Every protocol insert in the system MUST go through this function.
// Labs are the only exception — they use their own pipeline.
//
// What this does:
// 1. Validates required fields
// 2. Runs duplicate prevention (unless force=true)
// 3. Sets defaults (sessions_used, created_at, access_token)
// 4. Records source (which code path created it)
// 5. Inserts into DB
// 6. Returns the created protocol
//
// Range Medical — 2026-04-10

import { createClient } from '@supabase/supabase-js';
import { findDuplicateProtocol, findProtocolForPurchase } from './duplicate-prevention';
import { isWeightLossType, isHRTType, isPeptideType, isRecoveryPeptide, isGHPeptide, getCycleConfig } from './protocol-config';
import { todayPacific } from './date-utils';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ================================================================
// VALID SOURCES — every caller must identify itself
// ================================================================
const VALID_SOURCES = [
  'admin-protocols',       // POST /api/admin/protocols
  'admin-protocols-create', // POST /api/admin/protocols/create
  'protocols-create',       // POST /api/protocols/create
  'protocols-assign',       // POST /api/protocols/assign
  'auto-protocol',          // lib/auto-protocol.js (Stripe/POS)
  'dose-change',            // POST /api/protocols/[id]/dose-change
  'exchange',               // POST /api/admin/protocols/[id]/exchange
  'hrt-membership-perk',    // Stripe webhook (monthly IV perk)
  'add-completed',          // POST /api/protocols/add-completed (historical)
  'service-log',            // service-log fallback (should be rare)
];

// ================================================================
// MAIN: createProtocol()
// ================================================================

/**
 * Create a protocol in the database.
 *
 * @param {Object} data - Protocol fields
 * @param {string} data.patient_id - Required. Patient UUID.
 * @param {string} data.program_type - Required. e.g. 'peptide', 'weight_loss', 'hrt', 'iv', 'hbot', 'rlt'
 * @param {string} [data.program_name] - Display name. Auto-generated if omitted.
 * @param {string} [data.medication] - Medication name
 * @param {string} [data.selected_dose] - Current dose
 * @param {string} [data.starting_dose] - Starting dose (for titration tracking)
 * @param {string} [data.frequency] - Injection/session frequency
 * @param {string} [data.delivery_method] - 'in_clinic', 'take_home', prefilled variants, vial variants
 * @param {string} [data.supply_type] - HRT supply type
 * @param {number} [data.total_sessions] - Total sessions/injections in protocol
 * @param {string} [data.start_date] - Protocol start date (defaults to today Pacific)
 * @param {string} [data.end_date] - Protocol end date
 * @param {string} [data.status] - Protocol status (defaults to 'active')
 * @param {string} [data.notes] - Notes
 * @param {string} [data.hrt_type] - 'male' or 'female' (HRT only)
 * @param {*}      [data.secondary_medications] - HRT secondary meds (string or array)
 * @param {string} [data.access_token] - Auto-generated if omitted
 * @param {Object} opts - Options
 * @param {string} opts.source - Required. Which code path is creating this (see VALID_SOURCES).
 * @param {string} [opts.purchaseId] - If created from a purchase, the purchase UUID (for duplicate check + linking)
 * @param {boolean} [opts.force] - Skip duplicate prevention (default false)
 * @param {boolean} [opts.skipDuplicateCheck] - Alias for force
 * @param {string} [opts.createdBy] - Staff employee ID or 'system'
 * @param {string} [opts.parentProtocolId] - For dose changes / exchanges: the protocol being replaced
 * @returns {{ success: boolean, protocol?: Object, error?: string, duplicate?: Object }}
 */
export async function createProtocol(data, opts = {}) {
  const {
    patient_id,
    program_type,
    status = 'active',
  } = data;

  const {
    source,
    purchaseId,
    force = false,
    skipDuplicateCheck = false,
    createdBy = 'system',
    parentProtocolId,
  } = opts;

  // ── Validate required fields ──────────────────────────────────────────────
  if (!patient_id) {
    return { success: false, error: 'patient_id is required' };
  }
  if (!program_type) {
    return { success: false, error: 'program_type is required' };
  }
  if (!source || !VALID_SOURCES.includes(source)) {
    console.error(`createProtocol: invalid source "${source}". Must be one of: ${VALID_SOURCES.join(', ')}`);
    return { success: false, error: `Invalid source: ${source}` };
  }

  // ── Duplicate prevention ──────────────────────────────────────────────────
  const shouldCheckDuplicates = !force && !skipDuplicateCheck;

  if (shouldCheckDuplicates) {
    // Check if purchase is already linked to a protocol
    if (purchaseId) {
      const existingProtocolId = await findProtocolForPurchase(purchaseId);
      if (existingProtocolId) {
        return {
          success: false,
          error: `Purchase ${purchaseId} already linked to protocol ${existingProtocolId}`,
          duplicate: { type: 'purchase', protocolId: existingProtocolId }
        };
      }
    }

    // Check for active protocol with same type + medication
    const duplicate = await findDuplicateProtocol(patient_id, program_type, data.medication);
    if (duplicate) {
      return {
        success: false,
        error: `Active ${program_type} protocol already exists for this patient (${duplicate.id})`,
        duplicate: { type: 'protocol', protocol: duplicate }
      };
    }
  }

  // ── Build protocol data with defaults ─────────────────────────────────────
  const today = todayPacific();
  const accessToken = data.access_token || crypto.randomUUID();

  // Auto-generate program_name if not provided
  let programName = data.program_name;
  if (!programName) {
    if (isHRTType(program_type)) programName = 'HRT Protocol';
    else if (isWeightLossType(program_type)) programName = 'Weight Loss Protocol';
    else if (isPeptideType(program_type)) programName = data.medication ? `${data.medication} Protocol` : 'Peptide Protocol';
    else programName = data.medication || program_type;
  }

  // Normalize secondary_medications
  let secondaryMeds = data.secondary_medications || null;
  if (secondaryMeds && typeof secondaryMeds !== 'string') {
    secondaryMeds = JSON.stringify(secondaryMeds);
  }

  // Calculate cycle_start_date for recovery/GH peptides
  let cycleStartDate = data.cycle_start_date || null;
  if (!cycleStartDate && data.medication) {
    const cycleConfig = getCycleConfig(data.medication);
    if (cycleConfig) {
      // Check if patient has a recent completed cycle to calculate off-period
      try {
        const { data: recentCycles } = await supabase
          .from('protocols')
          .select('end_date, medication')
          .eq('patient_id', patient_id)
          .in('status', ['completed', 'active'])
          .not('end_date', 'is', null)
          .order('end_date', { ascending: false })
          .limit(5);

        if (recentCycles?.length > 0) {
          const matchingCycle = recentCycles.find(p => {
            if (cycleConfig.type === 'recovery') return isRecoveryPeptide(p.medication);
            if (cycleConfig.type === 'gh') return isGHPeptide(p.medication);
            return false;
          });
          if (matchingCycle?.end_date) {
            const lastEnd = new Date(matchingCycle.end_date);
            const offEnd = new Date(lastEnd);
            offEnd.setDate(offEnd.getDate() + cycleConfig.offDays);
            const startDate = new Date(data.start_date || today);
            // If we're past the off period, start fresh; otherwise carry the cycle date
            cycleStartDate = startDate >= offEnd ? (data.start_date || today) : matchingCycle.end_date;
          }
        }
      } catch (err) {
        console.error('createProtocol: cycle date calculation error:', err.message);
      }
    }
  }

  const protocolData = {
    // Core identity
    patient_id,
    program_type,
    program_name: programName,
    status,
    access_token: accessToken,

    // Medication & dosing
    medication: data.medication || null,
    selected_dose: data.selected_dose || null,
    starting_dose: data.starting_dose || data.selected_dose || null,
    frequency: data.frequency || null,
    current_dose: data.current_dose || data.selected_dose || null,

    // Delivery
    delivery_method: data.delivery_method || null,
    supply_type: data.supply_type || null,

    // Session tracking
    total_sessions: data.total_sessions || null,
    sessions_used: data.sessions_used ?? 0,

    // Timeline
    start_date: data.start_date || today,
    end_date: data.end_date || null,

    // Tracking dates
    last_refill_date: data.last_refill_date || null,
    last_visit_date: data.last_visit_date || null,
    next_expected_date: data.next_expected_date || null,

    // HRT-specific
    hrt_type: isHRTType(program_type) ? (data.hrt_type || 'male') : null,
    secondary_medications: isHRTType(program_type) ? (secondaryMeds || '[]') : null,
    dose_per_injection: data.dose_per_injection || null,
    injections_per_week: data.injections_per_week || null,
    vial_size: data.vial_size || null,
    injection_method: data.injection_method || null,
    first_followup_weeks: data.first_followup_weeks || null,

    // HRT reminders
    hrt_reminders_enabled: data.hrt_reminders_enabled || null,
    hrt_reminder_schedule: data.hrt_reminder_schedule || null,
    hrt_followup_date: data.hrt_followup_date || null,

    // Peptide-specific
    num_vials: data.num_vials || null,
    doses_per_vial: data.doses_per_vial || null,
    peptide_reminders_enabled: data.peptide_reminders_enabled || null,
    cycle_start_date: cycleStartDate,
    continuous_days_started: data.continuous_days_started || null,
    continuous_days_used: data.continuous_days_used || null,

    // Weight loss-specific
    pickup_frequency: data.pickup_frequency || null,
    injection_frequency: data.injection_frequency || null,
    injection_day: data.injection_day || null,
    checkin_reminder_enabled: data.checkin_reminder_enabled || null,

    // Dose change / exchange tracking
    parent_protocol_id: parentProtocolId || data.parent_protocol_id || null,
    dose_change_reason: data.dose_change_reason || null,
    dose_history: data.dose_history || null,
    exchanged_from: data.exchanged_from || null,
    exchange_reason: data.exchange_reason || null,
    exchange_date: data.exchange_date || null,

    // Supply tracking
    starting_supply_ml: data.starting_supply_ml || null,
    supply_dispensed_date: data.supply_dispensed_date || null,
    supply_quantity: data.supply_quantity || null,
    supply_remaining: data.supply_remaining || null,

    // Patient denormalized fields (for queries that don't join)
    patient_name: data.patient_name || null,
    patient_email: data.patient_email || null,
    patient_phone: data.patient_phone || null,
    ghl_contact_id: data.ghl_contact_id || null,

    // Notes
    notes: data.notes || null,

    // Audit
    source,
    created_by: createdBy,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Strip null/undefined values to avoid writing ghost columns
  // Only include fields that have actual values (Supabase ignores unknowns on insert,
  // but this keeps the payload clean)
  const cleanData = {};
  for (const [key, value] of Object.entries(protocolData)) {
    if (value !== null && value !== undefined) {
      cleanData[key] = value;
    }
  }

  // ── Insert ────────────────────────────────────────────────────────────────
  const { data: protocol, error: insertError } = await supabase
    .from('protocols')
    .insert(cleanData)
    .select()
    .single();

  if (insertError) {
    console.error(`createProtocol [${source}]: insert failed:`, insertError.message);
    return { success: false, error: insertError.message };
  }

  console.log(`createProtocol [${source}]: created ${program_type} protocol ${protocol.id} for patient ${patient_id}`);

  // ── Link purchase if provided ─────────────────────────────────────────────
  if (purchaseId) {
    const { error: linkError } = await supabase
      .from('purchases')
      .update({ protocol_id: protocol.id, protocol_created: true })
      .eq('id', purchaseId);

    if (linkError) {
      console.error(`createProtocol [${source}]: failed to link purchase ${purchaseId}:`, linkError.message);
    }
  }

  return { success: true, protocol };
}

// ================================================================
// HELPER: Close a protocol (for dose changes, exchanges)
// ================================================================

/**
 * Close/archive a protocol when it's being replaced.
 *
 * @param {string} protocolId - Protocol to close
 * @param {string} newStatus - 'historic' (dose change) or 'exchanged' (exchange)
 * @param {Object} opts
 * @param {string} [opts.endDate] - End date (defaults to today)
 * @param {string} [opts.notes] - Append to existing notes
 * @param {string} [opts.replacedByProtocolId] - The new protocol ID
 */
export async function closeProtocol(protocolId, newStatus, opts = {}) {
  const today = todayPacific();
  const updateData = {
    status: newStatus,
    end_date: opts.endDate || today,
    updated_at: new Date().toISOString(),
  };

  if (opts.replacedByProtocolId) {
    updateData.exchanged_to = opts.replacedByProtocolId;
  }

  // Append closure note
  if (opts.notes) {
    const { data: current } = await supabase
      .from('protocols')
      .select('notes')
      .eq('id', protocolId)
      .single();

    updateData.notes = [current?.notes, opts.notes].filter(Boolean).join('\n');
  }

  const { error } = await supabase
    .from('protocols')
    .update(updateData)
    .eq('id', protocolId);

  if (error) {
    console.error(`closeProtocol: failed to close ${protocolId}:`, error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
