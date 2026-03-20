// /pages/api/admin/toggle-bot.js
// Toggle bot_paused on a patient record
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patientId, paused } = req.body;

  if (!patientId) {
    return res.status(400).json({ error: 'patientId is required' });
  }

  const { error } = await supabase
    .from('patients')
    .update({ bot_paused: !!paused })
    .eq('id', patientId);

  if (error) {
    console.error('Toggle bot error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, bot_paused: !!paused });
}
