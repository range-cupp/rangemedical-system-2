// /pages/api/credits/apply.js
// Apply (deduct) account credit during checkout
// Called by POSChargeModal when payment method is 'account_credit'
// Supports partial credit (credit covers part, rest charged to card)
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    patient_id,
    amount_cents,           // amount of credit to apply (may be less than full charge)
    purchase_id,            // link to the purchase record
    description,
    created_by,
  } = req.body;

  if (!patient_id || !amount_cents || amount_cents <= 0) {
    return res.status(400).json({ error: 'patient_id and positive amount_cents are required' });
  }

  // Fetch current balance
  const { data: patient, error: fetchError } = await supabase
    .from('patients')
    .select('id, first_name, last_name, account_credit_cents')
    .eq('id', patient_id)
    .single();

  if (fetchError || !patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  if (patient.account_credit_cents < amount_cents) {
    return res.status(400).json({
      error: 'Insufficient credit balance',
      available_cents: patient.account_credit_cents,
      requested_cents: amount_cents,
    });
  }

  const new_balance = patient.account_credit_cents - amount_cents;

  // Insert debit ledger entry (negative amount)
  const { data: entry, error: insertError } = await supabase
    .from('patient_credits')
    .insert({
      patient_id,
      amount_cents: -amount_cents,
      type: 'use',
      reason: 'purchase',
      description: description || 'Applied at checkout',
      reference_purchase_id: purchase_id || null,
      created_by: created_by || 'pos',
    })
    .select()
    .single();

  if (insertError) {
    console.error('[credits/apply] insert error:', insertError);
    return res.status(500).json({ error: 'Failed to record credit use' });
  }

  // Deduct from cached balance
  const { error: updateError } = await supabase
    .from('patients')
    .update({ account_credit_cents: new_balance })
    .eq('id', patient_id);

  if (updateError) {
    console.error('[credits/apply] balance update error:', updateError);
    // Ledger entry exists so we can reconcile — don't fail the whole charge
  }

  return res.status(200).json({
    success: true,
    credit_entry: entry,
    applied_cents: amount_cents,
    new_balance_cents: new_balance,
    new_balance_dollars: (new_balance / 100).toFixed(2),
  });
}
