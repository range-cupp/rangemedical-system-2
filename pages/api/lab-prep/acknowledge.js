// /pages/api/lab-prep/acknowledge.js
// Marks a lab prep acknowledgment token as confirmed
// Called when patient clicks "I understand" on /lab-prep?t=TOKEN
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  // Look up the token
  const { data: ack, error: lookupError } = await supabase
    .from('lab_prep_acknowledgments')
    .select('id, acknowledged_at, patient_name')
    .eq('token', token)
    .single();

  if (lookupError || !ack) {
    return res.status(404).json({ error: 'Token not found' });
  }

  if (ack.acknowledged_at) {
    return res.status(200).json({ success: true, alreadyAcknowledged: true, name: ack.patient_name });
  }

  // Mark as acknowledged
  const { error: updateError } = await supabase
    .from('lab_prep_acknowledgments')
    .update({ acknowledged_at: new Date().toISOString() })
    .eq('id', ack.id);

  if (updateError) {
    console.error('Acknowledge update error:', updateError);
    return res.status(500).json({ error: updateError.message });
  }

  console.log(`Lab prep acknowledged: ${ack.patient_name} (token: ${token})`);
  return res.status(200).json({ success: true, name: ack.patient_name });
}
