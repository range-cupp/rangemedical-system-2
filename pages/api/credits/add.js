// /pages/api/credits/add.js
// Add account credit to a patient's balance (admin only)
// Creates a ledger row and bumps the cached balance on the patient record
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

  const { patient_id, amount_dollars, reason, description, created_by } = req.body;

  if (!patient_id || !amount_dollars || isNaN(Number(amount_dollars)) || Number(amount_dollars) <= 0) {
    return res.status(400).json({ error: 'patient_id and a positive amount_dollars are required' });
  }

  const amount_cents = Math.round(Number(amount_dollars) * 100);

  // Insert ledger entry
  const { data: entry, error: insertError } = await supabase
    .from('patient_credits')
    .insert({
      patient_id,
      amount_cents,
      type: 'add',
      reason: reason || 'manual',
      description: description || null,
      created_by: created_by || 'admin',
    })
    .select()
    .single();

  if (insertError) {
    console.error('[credits/add] insert error:', insertError);
    return res.status(500).json({ error: 'Failed to add credit' });
  }

  // Recalculate cached balance from ledger (sum all entries for this patient)
  const { data: allEntries } = await supabase
    .from('patient_credits')
    .select('amount_cents')
    .eq('patient_id', patient_id);

  const total = (allEntries || []).reduce((acc, r) => acc + r.amount_cents, 0);

  await supabase
    .from('patients')
    .update({ account_credit_cents: total })
    .eq('id', patient_id);

  // Return updated balance
  const { data: updated } = await supabase
    .from('patients')
    .select('id, first_name, last_name, account_credit_cents')
    .eq('id', patient_id)
    .single();

  return res.status(200).json({
    success: true,
    credit_entry: entry,
    new_balance_cents: updated?.account_credit_cents ?? amount_cents,
    new_balance_dollars: ((updated?.account_credit_cents ?? amount_cents) / 100).toFixed(2),
  });
}
