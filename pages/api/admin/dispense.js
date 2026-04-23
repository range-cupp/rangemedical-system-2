// /pages/api/admin/dispense.js
// Dispense medication — logs pickup to service_log + advances next_expected_date on protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';
import { guardDoseChange } from '../../../lib/dose-change-guard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse per-injection ml dose from selected_dose string
function parseDoseMl(selectedDose) {
  if (!selectedDose) return null;
  const weeksMatch = selectedDose.match(/\((\d+)\s*weeks?\)/i);
  if (weeksMatch) return { weeks: parseInt(weeksMatch[1]) };
  if (/vial\s*\(\d+ml/i.test(selectedDose)) return null;
  const atMlMatch = selectedDose.match(/@\s*(\d+\.?\d*)\s*ml/i);
  if (atMlMatch) return { ml: parseFloat(atMlMatch[1]) };
  const mlMatch = selectedDose.match(/(\d+\.?\d*)\s*ml/i);
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1]);
    if (ml < 2) return { ml };
  }
  return null;
}

// Calculate refill interval in days based on full protocol data
function getRefillIntervalDays(protocol) {
  const pt = (protocol.program_type || '').toLowerCase();
  const supply = (protocol.supply_type || '').toLowerCase();
  const dose = protocol.selected_dose || '';

  // Weight Loss
  if (pt.includes('weight_loss')) {
    if (protocol.pickup_frequency === 'weekly') return 7;
    if (protocol.pickup_frequency === 'every_2_weeks') return 14;
    return 28;
  }

  // HRT
  if (pt.includes('hrt')) {
    if (supply === 'pellet') return 120; // 4 months
    if (supply === 'oral_30day' || supply.includes('oral')) return 30;
    if (supply === 'in_clinic') return 7;

    // Prefilled — calculate from quantity + frequency (or legacy fixed values)
    if (supply === 'prefilled' || supply.startsWith('prefilled_')) {
      const prefillDays = { prefilled_1week: 7, prefilled_2week: 14, prefilled_4week: 28 };
      if (prefillDays[supply]) return prefillDays[supply];
      return 28; // default 4 weeks for prefilled
    }

    // Vials — calculate from dose + injection frequency
    if (supply.includes('vial')) {
      const vialMl = supply === 'vial_5ml' ? 5 : 10;
      const parsed = parseDoseMl(dose);
      if (parsed?.weeks) return parsed.weeks * 7;
      if (parsed?.ml) {
        const isSubQ = (protocol.injection_method || '').toLowerCase() === 'subq';
        const injectionsPerWeek = isSubQ ? 7 : (protocol.injection_frequency || 2);
        const mlPerWeek = parsed.ml * injectionsPerWeek;
        const weeks = vialMl / mlPerWeek;
        return Math.round(weeks * 7);
      }
      return supply === 'vial_5ml' ? 42 : 84;
    }

    return 30;
  }

  // Peptide
  if (pt === 'peptide') return 30;

  return 30;
}

// DEPRECATED: Use /api/medication-checkout instead.
// This endpoint is kept for backward compatibility but all new dispense flows
// should go through the unified medication-checkout API which enforces
// controlled substance dual verification and sends receipt emails.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.warn('[DEPRECATED] /api/admin/dispense called — use /api/medication-checkout instead');

  try {
    const {
      protocol_id,
      patient_id,
      patient_name,
      dispense_date, // YYYY-MM-DD — allows backdating
      refill_interval_days, // override if provided, otherwise auto-calculated
      dosage_override, // if staff changed dosage at dispense time
      quantity, // number of units dispensed (e.g., 2 injections for weight loss)
      supply_type_override, // if staff switched supply type (e.g., prefilled → vial)
      fulfillment_method, // 'in_clinic' or 'overnight'
      tracking_number, // shipping tracking number for overnight orders
      dosing_notes, // optional split-dosing schedule (e.g., "2mg x 2wks → 4mg x 2wks")
    } = req.body;

    if (!protocol_id || !patient_id) {
      return res.status(400).json({ error: 'protocol_id and patient_id required' });
    }

    const entryDate = dispense_date || todayPacific();

    // Fetch protocol details — include injection_method and injection_frequency for vial calc
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('id, program_type, program_name, medication, selected_dose, supply_type, pickup_frequency, delivery_method, sessions_used, next_expected_date, injection_method, injection_frequency')
      .eq('id', protocol_id)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Map program_type to service_log category
    const typeMap = {
      hrt: 'testosterone', hrt_male: 'testosterone', hrt_female: 'testosterone',
      weight_loss: 'weight_loss', peptide: 'peptide',
    };
    const category = typeMap[protocol.program_type] || protocol.program_type;

    // Check for duplicate pickup on same date
    const { data: existing } = await supabase
      .from('service_logs')
      .select('id')
      .eq('patient_id', patient_id)
      .eq('protocol_id', protocol_id)
      .eq('entry_date', entryDate)
      .eq('entry_type', 'pickup')
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Already dispensed for this date', existing_id: existing[0].id });
    }

    // Log pickup to service_logs
    const { data: serviceLog, error: logError } = await supabase
      .from('service_logs')
      .insert({
        patient_id,
        protocol_id,
        category,
        entry_type: 'pickup',
        entry_date: entryDate,
        medication: protocol.medication || null,
        dosage: dosage_override || protocol.selected_dose || null,
        quantity: quantity || 1,
        supply_type: supply_type_override || protocol.supply_type || null,
        fulfillment_method: fulfillment_method || 'in_clinic',
        tracking_number: tracking_number || null,
        notes: dosing_notes || null,
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Dispense log error:', logError);
      return res.status(500).json({ error: logError.message });
    }

    // Calculate next_expected_date from the dispense date + interval
    const intervalDays = refill_interval_days || getRefillIntervalDays(protocol);

    const nextDate = new Date(entryDate + 'T12:00:00');
    nextDate.setDate(nextDate.getDate() + intervalDays);
    const nextExpectedDate = nextDate.toISOString().split('T')[0];

    // Update protocol: advance next_expected_date, set last_refill_date
    // For weight loss: sessions_used tracks actual injections taken, NOT pickups dispensed
    // Pickups are tracked separately via service_logs with entry_type='pickup'
    const isWeightLoss = ['weight_loss'].includes(protocol.program_type);
    const updateData = {
      next_expected_date: nextExpectedDate,
      last_refill_date: entryDate,
      ...(isWeightLoss ? {} : { sessions_used: (protocol.sessions_used || 0) + (quantity || 1) }),
    };

    // If dosage was changed at dispense time, update the protocol's selected_dose.
    // Gated for WL (all changes) and HRT (increases) — dose changes must go through
    // the Dose Change modal → Burgess SMS approval.
    if (dosage_override) {
      const guard = await guardDoseChange(
        supabase,
        protocol,
        { selected_dose: dosage_override },
        { mode: 'reject' }
      );
      if (!guard.allowed) {
        return res.status(400).json({
          error: guard.reason,
          requires_approval: true,
          category: guard.category,
        });
      }
      updateData.selected_dose = dosage_override;
    }

    // If dosing notes provided (split dosing), store on protocol for reference
    if (dosing_notes) {
      const guard = await guardDoseChange(
        supabase,
        protocol,
        { selected_dose: dosing_notes },
        { mode: 'reject' }
      );
      if (!guard.allowed) {
        return res.status(400).json({
          error: guard.reason,
          requires_approval: true,
          category: guard.category,
        });
      }
      updateData.selected_dose = dosing_notes;
    }

    // If supply type was changed (e.g., switched from prefilled to vial), update protocol
    if (supply_type_override) {
      updateData.supply_type = supply_type_override;
    }

    const { error: updateError } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', protocol_id);

    if (updateError) {
      console.error('Protocol update error:', updateError);
    }

    console.log(`Dispensed: ${patient_name || patient_id} — ${protocol.medication || protocol.program_name} on ${entryDate}, next refill: ${nextExpectedDate} (+${intervalDays}d)`);

    return res.status(200).json({
      success: true,
      service_log_id: serviceLog.id,
      dispense_date: entryDate,
      next_expected_date: nextExpectedDate,
      interval_days: intervalDays,
    });

  } catch (error) {
    console.error('Dispense API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
