// /pages/api/protocols/[id]/mark-shipped.js
// Logs a shipment for a take-home protocol. Writes a service_logs row
// (entry_type='pickup', fulfillment_method='overnight') and advances the
// protocol's last_refill_date / next_expected_date.

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CATEGORY_MAP = {
  hrt: 'testosterone',
  hrt_male: 'testosterone',
  hrt_female: 'testosterone',
  weight_loss: 'weight_loss',
  peptide: 'peptide',
};

function calculateIntervalDays(protocol) {
  const pt = (protocol.program_type || '').toLowerCase();
  const supply = (protocol.supply_type || '').toLowerCase();

  if (pt.includes('weight_loss')) return 28;
  if (pt === 'peptide') return 30;

  if (pt.includes('hrt')) {
    if (supply.includes('oral')) return 30;
    if (supply === 'prefilled_1week') return 7;
    if (supply === 'prefilled_2week') return 14;
    if (supply === 'prefilled_4week' || supply === 'prefilled') return 28;
    return 28;
  }

  return 28;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { shipped_date, tracking_number } = req.body || {};
  const entryDate = shipped_date || todayPacific();

  const { data: protocol, error: protocolErr } = await supabase
    .from('protocols')
    .select('id, patient_id, program_type, medication, selected_dose, supply_type, delivery_method, status')
    .eq('id', id)
    .single();

  if (protocolErr || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  if (protocol.delivery_method !== 'take_home') {
    return res.status(400).json({ error: 'Mark as Shipped only applies to take-home protocols' });
  }

  const category = CATEGORY_MAP[protocol.program_type] || protocol.program_type;

  const { data: existing } = await supabase
    .from('service_logs')
    .select('id')
    .eq('protocol_id', id)
    .eq('entry_date', entryDate)
    .eq('entry_type', 'pickup')
    .limit(1);

  if (existing && existing.length > 0) {
    return res.status(409).json({ error: 'Already marked as shipped on this date', existing_id: existing[0].id });
  }

  const { data: serviceLog, error: logErr } = await supabase
    .from('service_logs')
    .insert({
      patient_id: protocol.patient_id,
      protocol_id: id,
      category,
      entry_type: 'pickup',
      entry_date: entryDate,
      medication: protocol.medication || null,
      dosage: protocol.selected_dose || null,
      quantity: 1,
      supply_type: protocol.supply_type || null,
      fulfillment_method: 'overnight',
      tracking_number: tracking_number || null,
    })
    .select('id')
    .single();

  if (logErr) {
    console.error('mark-shipped log error:', logErr);
    return res.status(500).json({ error: logErr.message });
  }

  const intervalDays = calculateIntervalDays(protocol);
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
    console.error('mark-shipped protocol update error:', updateErr);
  }

  return res.status(200).json({
    success: true,
    service_log_id: serviceLog.id,
    shipped_date: entryDate,
    next_expected_date: nextExpectedDate,
    interval_days: intervalDays,
  });
}
