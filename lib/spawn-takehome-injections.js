// lib/spawn-takehome-injections.js
// When a take-home pickup is logged for a weight-loss patient, immediately
// spawn one `injection` service_log row per dose dispensed, dated for the
// patient's regular injection day. Rationale:
//
//  - Range's WL programs run weekly without skipped weeks. Every dispensed
//    dose corresponds to a real injection in a known future week.
//  - sessions_used is recounted from injection rows. If we don't spawn the
//    administration rows up front, the count under-represents what the
//    patient has been paid up for, and "Payment Due" never lights up.
//  - The schedule renderer already skips projected rows when a real log
//    exists within ±3 days, so spawning real rows replaces the visual-only
//    projection without doubling.
//
// Spawned rows are idempotent: if a row (any entry_type) exists within 3
// days of the target date for this protocol, we skip that slot.

const PARSE_FREQ_DEFAULT = 7;

const DAY_NAME_TO_NUM = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function parseFrequencyDays(frequency) {
  if (!frequency) return PARSE_FREQ_DEFAULT;
  const f = String(frequency).toLowerCase();
  if (f.includes('week')) return 7;
  if (f.includes('biweek') || f.includes('every other')) return 14;
  if (f.includes('twice') || f.includes('2x')) return 3.5;
  const m = f.match(/(\d+)\s*day/);
  if (m) return parseInt(m[1], 10);
  return PARSE_FREQ_DEFAULT;
}

/**
 * Spawn weekly take-home injection rows for a freshly-logged pickup.
 *
 * @param {object} supabase
 * @param {object} pickup - the service_log row that was just inserted
 *   (must have id, patient_id, protocol_id, entry_date, dosage, quantity)
 * @param {object} protocol - protocol row (must have frequency,
 *   injection_day, medication, selected_dose)
 * @returns {Promise<{spawned: number, skipped: number}>}
 */
export async function spawnTakeHomeInjections(supabase, pickup, protocol) {
  if (!pickup || !protocol) return { spawned: 0, skipped: 0 };
  const qty = parseInt(pickup.quantity || 0, 10);
  if (qty <= 0) return { spawned: 0, skipped: 0 };
  if (pickup.fulfillment_method === 'in_clinic_injections') return { spawned: 0, skipped: 0 };

  // Per-slot plan: only spawn placeholder rows for slots the patient is taking
  // home. In-clinic slots become real injection rows when the visit happens —
  // pre-spawning them mislabels future visits as take-home/overnighted.
  const slots = Array.isArray(pickup.slot_fulfillment) ? pickup.slot_fulfillment : null;

  // Anchor to the next occurrence of the patient's injection_day on or
  // after the pickup date. Falls back to pickup_date + 7d intervals.
  const intervalDays = parseFrequencyDays(protocol.frequency);
  const pickupDate = new Date(pickup.entry_date + 'T12:00:00');
  const targetDayNum = DAY_NAME_TO_NUM[String(protocol.injection_day || '').toLowerCase()];

  const anchor = new Date(pickupDate);
  if (typeof targetDayNum === 'number') {
    const diff = (targetDayNum - anchor.getDay() + 7) % 7;
    // If pickup is exactly on the injection day, push to next week — the
    // pickup itself is the dispensing event, not the administration.
    anchor.setDate(anchor.getDate() + (diff === 0 ? 7 : diff));
  } else {
    anchor.setDate(anchor.getDate() + 7);
  }

  let spawned = 0;
  let skipped = 0;
  const dose = pickup.dosage || protocol.selected_dose || protocol.dose || null;
  const medication = pickup.medication || protocol.medication || null;

  for (let i = 0; i < qty; i++) {
    // Resolve fulfillment for this slot. Prefer the per-slot plan; fall back
    // to the pickup-level method for legacy rows that never had slot_fulfillment.
    const slotMethod = slots && slots[i]
      ? slots[i]
      : (pickup.fulfillment_method === 'overnight' ? 'overnight' : 'take_home');

    // In-clinic slots aren't spawned — they're administered at a real visit.
    if (slotMethod === 'in_clinic') {
      skipped++;
      continue;
    }

    const target = new Date(anchor);
    target.setDate(target.getDate() + Math.round(i * intervalDays));
    const targetStr = target.toISOString().split('T')[0];

    // Idempotency: skip if any row exists within ±3 days for this protocol
    const lo = new Date(target); lo.setDate(lo.getDate() - 3);
    const hi = new Date(target); hi.setDate(hi.getDate() + 3);
    const { data: nearby } = await supabase
      .from('service_logs')
      .select('id, entry_date, entry_type')
      .eq('protocol_id', pickup.protocol_id)
      .gte('entry_date', lo.toISOString().split('T')[0])
      .lte('entry_date', hi.toISOString().split('T')[0])
      .in('entry_type', ['injection', 'session']);

    if ((nearby || []).length > 0) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('service_logs')
      .insert({
        patient_id: pickup.patient_id,
        protocol_id: pickup.protocol_id,
        category: 'weight_loss',
        entry_type: 'injection',
        entry_date: targetStr,
        medication,
        dosage: dose,
        weight: null,
        fulfillment_method: slotMethod === 'overnight' ? 'overnight' : null,
        notes: `Take-home dose dispensed via pickup ${pickup.id}. Awaiting weight check from patient.`,
      });
    if (error) {
      console.error('[spawn-takehome] insert failed', target, error.message);
      continue;
    }
    spawned++;
  }

  if (spawned > 0) {
    console.log(`[spawn-takehome] protocol=${pickup.protocol_id.substring(0, 8)} pickup=${pickup.id.substring(0, 8)} spawned=${spawned} skipped=${skipped}`);
  }
  return { spawned, skipped };
}
