// /api/hbot-trial/get-trial-details
// Returns trial pass + surveys for the LeadDetailPanel trial tab
// Looks up by sales_pipeline_id, filtered to HBOT trials
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

  const { pipeline_id } = req.query;
  if (!pipeline_id) {
    return res.status(400).json({ error: 'pipeline_id is required' });
  }

  try {
    // Find trial pass by pipeline ID, filtered to HBOT type
    const { data: trial, error: trialErr } = await supabase
      .from('trial_passes')
      .select('*')
      .eq('sales_pipeline_id', pipeline_id)
      .eq('trial_type', 'hbot')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (trialErr) throw trialErr;

    if (!trial) {
      return res.status(200).json({ trial: null, surveys: [] });
    }

    // Fetch surveys for this trial
    const { data: surveys } = await supabase
      .from('trial_surveys')
      .select('*')
      .eq('trial_pass_id', trial.id)
      .order('created_at', { ascending: true });

    return res.status(200).json({
      trial,
      surveys: surveys || [],
    });
  } catch (err) {
    console.error('HBOT trial details error:', err);
    return res.status(500).json({ error: err.message });
  }
}
