// /api/trial/check-patient-trial
// Checks if a patient has an active/purchased trial pass
// Returns trial info + pre-survey status for service log integration
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

  try {
    const { patient_id } = req.query;

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required' });
    }

    // Look up active trial passes for this patient
    const { data: trials, error } = await supabase
      .from('trial_passes')
      .select('*')
      .eq('patient_id', patient_id)
      .in('status', ['purchased', 'active'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!trials || trials.length === 0) {
      return res.status(200).json({ hasTrial: false });
    }

    const trial = trials[0];

    // Check if pre-survey exists
    const { data: preSurvey } = await supabase
      .from('trial_surveys')
      .select('id')
      .eq('trial_pass_id', trial.id)
      .eq('survey_type', 'pre')
      .limit(1);

    return res.status(200).json({
      hasTrial: true,
      trial: {
        id: trial.id,
        status: trial.status,
        sessions_used: trial.sessions_used || 0,
        pre_survey_completed: trial.pre_survey_completed || false,
        post_survey_completed: trial.post_survey_completed || false,
        first_name: trial.first_name,
        phone: trial.phone,
        activated_at: trial.activated_at,
        expires_at: trial.expires_at,
        trial_type: trial.trial_type || 'rlt',
      },
      hasPreSurvey: (preSurvey && preSurvey.length > 0) || trial.pre_survey_completed,
    });
  } catch (error) {
    console.error('Check patient trial error:', error);
    return res.status(500).json({ error: error.message });
  }
}
