// /pages/api/credits/[patient_id].js
// GET: return credit balance + full history for a patient
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { patient_id } = req.query;

  if (!['GET', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // DELETE — remove a specific credit entry and recalculate balance
  if (req.method === 'DELETE') {
    const { entry_id } = req.body;
    if (!patient_id || !entry_id) {
      return res.status(400).json({ error: 'patient_id and entry_id are required' });
    }

    // Delete the entry (verify it belongs to this patient)
    const { error: deleteError } = await supabase
      .from('patient_credits')
      .delete()
      .eq('id', entry_id)
      .eq('patient_id', patient_id);

    if (deleteError) {
      console.error('[credits/delete] delete error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete credit entry' });
    }

    // Recalculate balance from remaining ledger entries
    const { data: remaining } = await supabase
      .from('patient_credits')
      .select('amount_cents')
      .eq('patient_id', patient_id);

    const newBalance = (remaining || []).reduce((acc, r) => acc + r.amount_cents, 0);

    const { error: updateError } = await supabase
      .from('patients')
      .update({ account_credit_cents: newBalance })
      .eq('id', patient_id);

    if (updateError) {
      console.error('[credits/delete] balance update error:', updateError);
    }

    return res.status(200).json({
      success: true,
      new_balance_cents: newBalance,
      new_balance_dollars: (newBalance / 100).toFixed(2),
    });
  }

  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id is required' });
  }

  // Get cached balance from patient row
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, first_name, last_name, account_credit_cents')
    .eq('id', patient_id)
    .single();

  if (patientError || !patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Get full credit history
  const { data: history, error: historyError } = await supabase
    .from('patient_credits')
    .select('*')
    .eq('patient_id', patient_id)
    .order('created_at', { ascending: false });

  if (historyError) {
    console.error('[credits/balance] history error:', historyError);
  }

  return res.status(200).json({
    patient_id: patient.id,
    patient_name: `${patient.first_name} ${patient.last_name}`,
    balance_cents: patient.account_credit_cents,
    balance_dollars: (patient.account_credit_cents / 100).toFixed(2),
    history: history || [],
  });
}
