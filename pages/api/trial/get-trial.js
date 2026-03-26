// /api/trial/get-trial
// Returns trial pass data for pre-filling the checkout form
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  try {
    const { data: trial, error } = await supabase
      .from('trial_passes')
      .select('id, first_name, last_name, email, phone, status, main_problem, importance_1_10, sessions_used, pre_survey_completed, post_survey_completed, purchased_at, activated_at, expires_at')
      .eq('id', id)
      .single();

    if (error) throw error;

    return res.status(200).json({ trial });
  } catch (err) {
    return res.status(404).json({ error: 'Trial not found' });
  }
}
