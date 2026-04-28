// /pages/api/protocols/[id]/mark-new-vial.js
// Logs a "new vial started" event for in-clinic HRT protocols. Writes a
// service_logs row (entry_type='pickup', fulfillment_method='in_clinic') and
// resets the protocol's last_refill_date so the supply countdown restarts.

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { vial_start_date, notes } = req.body || {};
  const entryDate = vial_start_date || todayPacific();

  const { data: protocol, error: protocolErr } = await supabase
    .from('protocols')
    .select('id, patient_id, program_type, medication, selected_dose, supply_type, delivery_method, status, vial_mg, dose_mg, frequency_days, supply_days')
    .eq('id', id)
    .single();

  if (protocolErr || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  if (protocol.program_type !== 'hrt' || protocol.delivery_method !== 'in_clinic') {
    return res.status(400).json({ error: 'Mark New Vial only applies to in-clinic HRT protocols' });
  }

  const { data: existing } = await supabase
    .from('service_logs')
    .select('id')
    .eq('protocol_id', id)
    .eq('entry_date', entryDate)
    .eq('entry_type', 'pickup')
    .limit(1);

  if (existing && existing.length > 0) {
    return res.status(409).json({ error: 'A vial-start entry already exists for this date', existing_id: existing[0].id });
  }

  const { data: serviceLog, error: logErr } = await supabase
    .from('service_logs')
    .insert({
      patient_id: protocol.patient_id,
      protocol_id: id,
      category: 'testosterone',
      entry_type: 'pickup',
      entry_date: entryDate,
      medication: protocol.medication || null,
      dosage: protocol.selected_dose || null,
      quantity: 1,
      supply_type: protocol.supply_type || null,
      fulfillment_method: 'in_clinic',
      notes: notes || 'New vial started in clinic',
    })
    .select('id')
    .single();

  if (logErr) {
    console.error('mark-new-vial log error:', logErr);
    return res.status(500).json({ error: logErr.message });
  }

  // Compute next expected date from supply_days when available; fall back to a
  // supply_type-derived interval so the UI still shows something sensible.
  let intervalDays = null;
  if (protocol.supply_days && protocol.supply_days > 0) {
    intervalDays = protocol.supply_days;
  } else {
    const supply = (protocol.supply_type || '').toLowerCase();
    if (supply === 'prefilled_1week') intervalDays = 7;
    else if (supply === 'prefilled_2week') intervalDays = 14;
    else if (supply === 'prefilled_4week' || supply === 'prefilled') intervalDays = 28;
    else if (supply === 'vial_5ml') intervalDays = 42;
    else if (supply.startsWith('vial')) intervalDays = 84;
    else intervalDays = 28;
  }

  const nextDate = new Date(entryDate + 'T12:00:00');
  nextDate.setDate(nextDate.getDate() + intervalDays);
  const nextExpectedDate = nextDate.toISOString().split('T')[0];

  const { error: updateErr } = await supabase
    .from('protocols')
    .update({
      last_refill_date: entryDate,
      next_expected_date: nextExpectedDate,
    })
    .eq('id', id);

  if (updateErr) {
    console.error('mark-new-vial protocol update error:', updateErr);
  }

  // Auto-resolve any open refill follow-ups for this protocol.
  await supabase
    .from('follow_ups')
    .update({
      status: 'completed',
      outcome: 'auto_resolved',
      outcome_notes: `Auto-resolved by Mark New Vial on ${entryDate}`,
      completed_at: new Date().toISOString(),
    })
    .eq('protocol_id', id)
    .in('type', ['refill_due_soon', 'wl_payment_due'])
    .in('status', ['pending', 'in_progress']);

  return res.status(200).json({
    success: true,
    service_log_id: serviceLog.id,
    vial_start_date: entryDate,
    next_expected_date: nextExpectedDate,
    interval_days: intervalDays,
  });
}
