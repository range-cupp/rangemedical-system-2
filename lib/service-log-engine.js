// lib/service-log-engine.js
// Central engine for all service log creation.
// Every code path that inserts into service_logs MUST go through this function.
// Handles: duplicate checking, billing flags, session recount, weight sync.

import { recountProtocolSessions } from './recount-protocol-sessions';
import { todayPacific } from './date-utils';

async function syncWeightToVitals(supabase, patient_id, weight, entry_date, recorded_by) {
  if (!patient_id || !weight) return;
  try {
    const logDate = entry_date || todayPacific();
    const dayStart = logDate + 'T00:00:00Z';
    const dayEnd = logDate + 'T23:59:59Z';
    const { data: existing } = await supabase
      .from('patient_vitals')
      .select('id')
      .eq('patient_id', patient_id)
      .gte('recorded_at', dayStart)
      .lte('recorded_at', dayEnd)
      .order('recorded_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('patient_vitals')
        .update({ weight_lbs: parseFloat(weight), recorded_by: recorded_by || 'Service Log' })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('patient_vitals')
        .insert({
          patient_id,
          weight_lbs: parseFloat(weight),
          recorded_by: recorded_by || 'Service Log',
          recorded_at: new Date(logDate + 'T12:00:00Z').toISOString(),
        });
    }
  } catch (err) {
    console.error('syncWeightToVitals error (non-fatal):', err.message);
  }
}

async function checkBillingCoverage(supabase, patient_id, category, protocol_id) {
  if (!patient_id || !category) return false;
  if (category === 'supplement') return true;

  try {
    let query;
    if (protocol_id) {
      query = supabase
        .from('protocols')
        .select('id, total_sessions, sessions_used, status')
        .eq('id', protocol_id)
        .limit(1);
    } else {
      const CATEGORY_TO_PROGRAM_TYPE = {
        testosterone: 'hrt', weight_loss: 'weight_loss', vitamin: 'vitamin',
        peptide: 'peptide', iv_therapy: 'iv_therapy', hbot: 'hbot',
        red_light: 'red_light', supplement: 'supplement',
      };
      const programType = CATEGORY_TO_PROGRAM_TYPE[category];
      if (!programType) return false;
      query = supabase
        .from('protocols')
        .select('id, total_sessions, sessions_used, status')
        .eq('patient_id', patient_id)
        .eq('program_type', programType)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);
    }
    const { data: protocols } = await query;
    if (!protocols || protocols.length === 0) return false;
    const p = protocols[0];
    if (p.total_sessions && (p.sessions_used || 0) >= p.total_sessions) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a service log entry — the ONE function all insert paths must use.
 *
 * @param {object} supabase - Supabase client (service role)
 * @param {object} data - Row data for service_logs
 *   Required: patient_id, category
 *   Common: entry_type, entry_date, medication, dosage, weight, quantity,
 *           protocol_id, administered_by, verified_by, lot_number,
 *           expiration_date, duration, notes, status, needs_billing,
 *           billing_reason, fulfillment_method, tracking_number
 * @param {object} [options]
 *   skipDuplicateCheck: skip the dup guard
 *   skipBillingCheck: skip billing flag (caller handles it)
 *   skipRecount: skip recountProtocolSessions
 *   skipWeightSync: skip vitals sync
 * @returns {Promise<{log: object, error: string|null}>}
 */
export async function createServiceLogEntry(supabase, data, options = {}) {
  if (!data.patient_id || !data.category) {
    return { log: null, error: 'Missing required fields: patient_id and category' };
  }

  const entryDate = data.entry_date || todayPacific();
  const entryType = data.entry_type || (['hbot', 'iv_therapy', 'red_light'].includes(data.category) ? 'session' : 'injection');

  // Duplicate check
  if (!options.skipDuplicateCheck && ['injection', 'session', 'pickup'].includes(entryType)) {
    let dupQuery = supabase
      .from('service_logs')
      .select('id, entry_date, category, entry_type, medication')
      .eq('patient_id', data.patient_id)
      .eq('entry_date', entryDate)
      .eq('category', data.category)
      .eq('entry_type', entryType);

    if (data.medication && ['injection', 'pickup'].includes(entryType)) {
      dupQuery = dupQuery.eq('medication', data.medication);
    }
    const { data: existing } = await dupQuery.limit(1);
    if (existing && existing.length > 0) {
      return {
        log: null,
        duplicate: true,
        existing,
        error: `A ${entryType} for this patient was already logged on ${entryDate}${data.medication ? ` (${data.medication})` : ''}`,
      };
    }
  }

  // Build insert row
  const logData = {
    patient_id: data.patient_id,
    category: data.category,
    entry_type: entryType,
    entry_date: entryDate,
    protocol_id: data.protocol_id || null,
    medication: data.medication || null,
    dosage: data.dosage || null,
    weight: data.weight ? parseFloat(data.weight) : null,
    quantity: data.quantity ? parseInt(data.quantity) : null,
    supply_type: data.supply_type || null,
    duration: data.duration ? parseInt(data.duration) : null,
    notes: data.notes || null,
    administered_by: data.administered_by || null,
    verified_by: data.verified_by || null,
    lot_number: data.lot_number || null,
    expiration_date: data.expiration_date || null,
    signature_url: data.signature_url || null,
    signed_at: data.signature_url ? new Date().toISOString() : null,
    fulfillment_method: data.fulfillment_method || null,
    tracking_number: data.tracking_number || null,
    created_by: data.created_by || null,
    note_id: data.note_id || null,
  };

  // Status: 'scheduled' for future take-home, 'completed' for everything else
  if (data.status) {
    logData.status = data.status;
  }

  // Billing: caller can set explicitly, or we check
  if (data.needs_billing !== undefined) {
    logData.needs_billing = data.needs_billing;
    if (data.billing_reason) logData.billing_reason = data.billing_reason;
  }

  // Insert
  let { data: log, error: insertError } = await supabase
    .from('service_logs')
    .insert([logData])
    .select()
    .single();

  // Retry without columns that may not exist yet
  if (insertError && insertError.message) {
    const retryFields = ['fulfillment_method', 'tracking_number', 'status', 'needs_billing', 'billing_reason', 'note_id'];
    const badField = retryFields.find(f => insertError.message.includes(f));
    if (badField) {
      for (const f of retryFields) delete logData[f];
      ({ data: log, error: insertError } = await supabase
        .from('service_logs')
        .insert([logData])
        .select()
        .single());
    }
  }

  if (insertError) {
    return { log: null, error: insertError.message };
  }

  // Billing flag (async, non-blocking on column absence)
  if (!options.skipBillingCheck && data.needs_billing === undefined && data.category !== 'supplement') {
    const hasCoverage = await checkBillingCoverage(supabase, data.patient_id, data.category, data.protocol_id);
    if (!hasCoverage) {
      try {
        await supabase
          .from('service_logs')
          .update({ needs_billing: true, billing_reason: 'No active package' })
          .eq('id', log.id);
        log.needs_billing = true;
        log.billing_reason = 'No active package';
      } catch {
        // Column may not exist yet — non-fatal
      }
    }
  }

  // Weight sync
  if (!options.skipWeightSync && data.weight) {
    await syncWeightToVitals(supabase, data.patient_id, data.weight, entryDate, data.administered_by);
  }

  // Recount protocol sessions
  if (!options.skipRecount && log.protocol_id && ['injection', 'session'].includes(entryType)) {
    await recountProtocolSessions(supabase, log.protocol_id);
  }

  return { log, error: null };
}

/**
 * Delete a service log entry and recount.
 */
export async function deleteServiceLogEntry(supabase, id) {
  const { data: entry } = await supabase
    .from('service_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (!entry) return { error: 'Log entry not found' };

  const { error } = await supabase
    .from('service_logs')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  if (entry.protocol_id) {
    await recountProtocolSessions(supabase, entry.protocol_id);
  }

  return { deleted: entry, error: null };
}
