// /pages/api/admin/dispense.js
// Dispense medication — logs pickup to service_log + advances next_expected_date on protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Calculate refill interval in days based on protocol type and supply
function getRefillIntervalDays(programType, supplyType, pickupFrequency) {
  const pt = (programType || '').toLowerCase();

  if (pt.includes('weight_loss')) {
    if (pickupFrequency === 'weekly') return 7;
    if (pickupFrequency === 'every_2_weeks') return 14;
    return 28;
  }

  if (pt.includes('hrt')) {
    const supplyDays = {
      prefilled_1week: 7, prefilled_2week: 14, prefilled_4week: 28,
      vial_5ml: 70, vial_10ml: 140, in_clinic: 7,
    };
    return supplyDays[(supplyType || '').toLowerCase()] || 30;
  }

  if (pt === 'peptide') return 30;

  return 30;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      protocol_id,
      patient_id,
      patient_name,
      dispense_date, // YYYY-MM-DD — allows backdating
      refill_interval_days, // override if provided, otherwise auto-calculated
    } = req.body;

    if (!protocol_id || !patient_id) {
      return res.status(400).json({ error: 'protocol_id and patient_id required' });
    }

    const entryDate = dispense_date || new Date().toISOString().split('T')[0];

    // Fetch protocol details for category mapping and interval calculation
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('id, program_type, program_name, medication, selected_dose, supply_type, pickup_frequency, delivery_method, sessions_used, next_expected_date')
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
        patient_name: patient_name || null,
        protocol_id,
        category,
        entry_type: 'pickup',
        entry_date: entryDate,
        medication: protocol.medication || null,
        dosage: protocol.selected_dose || null,
        supply_type: protocol.supply_type || null,
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Dispense log error:', logError);
      return res.status(500).json({ error: logError.message });
    }

    // Calculate next_expected_date from the dispense date + interval
    const intervalDays = refill_interval_days || getRefillIntervalDays(
      protocol.program_type,
      protocol.supply_type,
      protocol.pickup_frequency
    );

    const nextDate = new Date(entryDate + 'T12:00:00');
    nextDate.setDate(nextDate.getDate() + intervalDays);
    const nextExpectedDate = nextDate.toISOString().split('T')[0];

    // Update protocol: advance next_expected_date and increment sessions_used
    const updateData = {
      next_expected_date: nextExpectedDate,
      sessions_used: (protocol.sessions_used || 0) + 1,
    };

    const { error: updateError } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', protocol_id);

    if (updateError) {
      console.error('Protocol update error:', updateError);
      // Non-fatal — pickup was still logged
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
