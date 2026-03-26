// /api/trial/send-pre-survey
// Sends (or re-sends) the pre-survey link via SMS to a trial patient
// Called from service log when front desk sees the patient hasn't completed it
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://range-medical.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { trialId } = req.body;

    if (!trialId) {
      return res.status(400).json({ error: 'trialId is required' });
    }

    const { data: trial, error } = await supabase
      .from('trial_passes')
      .select('*')
      .eq('id', trialId)
      .single();

    if (error || !trial) {
      return res.status(404).json({ error: 'Trial pass not found' });
    }

    if (!trial.phone) {
      return res.status(400).json({ error: 'No phone number on file for this trial' });
    }

    const phone = normalizePhone(trial.phone);
    const surveyLink = `${BASE_URL}/rlt-trial/survey?trial_id=${trialId}&type=pre`;
    const message = `Hey ${trial.first_name}! Please complete this quick survey before your session — it only takes 60 seconds:\n${surveyLink}\n\n- Range Medical`;

    const result = await sendSMS({ to: phone, message });

    await logComm({
      channel: 'sms',
      messageType: 'rlt_trial_pre_survey_resend',
      message,
      source: 'service-log',
      recipient: phone,
      patientName: trial.first_name,
      status: result.success ? 'sent' : 'error',
      errorMessage: result.error || null,
      provider: result.provider,
    });

    return res.status(200).json({
      success: true,
      surveyUrl: surveyLink,
    });
  } catch (error) {
    console.error('Send pre-survey error:', error);
    return res.status(500).json({ error: error.message });
  }
}
