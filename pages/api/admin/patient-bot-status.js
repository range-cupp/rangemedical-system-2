// /pages/api/admin/patient-bot-status.js
// Get bot_paused status for a patient
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { patientId } = req.query;
  if (!patientId) return res.status(400).json({ error: 'patientId required' });

  const { data, error } = await supabase
    .from('patients')
    .select('bot_paused')
    .eq('id', patientId)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ bot_paused: !!data?.bot_paused });
}
