// /pages/api/patient/comms-preferences.js
// Admin endpoint to update patient communication opt-out preferences
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, sms_opt_out, email_opt_out, call_opt_out, marketing_opt_out, automations_opt_out, comms_notes } = req.body;

  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id required' });
  }

  const updates = { comms_updated_at: new Date().toISOString() };

  if (typeof sms_opt_out === 'boolean') updates.sms_opt_out = sms_opt_out;
  if (typeof email_opt_out === 'boolean') updates.email_opt_out = email_opt_out;
  if (typeof call_opt_out === 'boolean') updates.call_opt_out = call_opt_out;
  if (typeof marketing_opt_out === 'boolean') updates.marketing_opt_out = marketing_opt_out;
  if (typeof automations_opt_out === 'boolean') updates.automations_opt_out = automations_opt_out;
  if (typeof comms_notes === 'string') updates.comms_notes = comms_notes;

  try {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', patient_id)
      .select('sms_opt_out, email_opt_out, call_opt_out, marketing_opt_out, automations_opt_out, comms_notes, comms_updated_at')
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error('comms-preferences update error:', err);
    return res.status(500).json({ error: err.message });
  }
}
