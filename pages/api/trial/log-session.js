// /api/trial/log-session
// Called when a trial RLT session is logged in service log
// Increments sessions_used, activates trial on first session, advances pipeline stage
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendTrialPostSession1, sendTrialEndCheckIn } from '../../../lib/trial-sms';
import { normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { trialPassId } = req.body;

    if (!trialPassId) {
      return res.status(400).json({ error: 'trialPassId is required' });
    }

    const { data: trial, error: fetchErr } = await supabase
      .from('trial_passes')
      .select('*')
      .eq('id', trialPassId)
      .single();

    if (fetchErr || !trial) {
      return res.status(404).json({ error: 'Trial pass not found' });
    }

    const newSessionsUsed = (trial.sessions_used || 0) + 1;
    const updates = {
      sessions_used: newSessionsUsed,
      updated_at: new Date().toISOString(),
    };

    // First session — activate trial, set expiration
    if (trial.sessions_used === 0) {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 7);

      updates.activated_at = now.toISOString();
      updates.expires_at = expiresAt.toISOString().split('T')[0];
      updates.status = 'active';
    }

    await supabase
      .from('trial_passes')
      .update(updates)
      .eq('id', trialPassId);

    // Advance pipeline stage
    if (trial.sales_pipeline_id) {
      let newStage;
      if (newSessionsUsed === 1) newStage = 'day_1';
      else if (newSessionsUsed >= 3) newStage = 'check_in';
      else newStage = 'trial_active';

      // Only advance forward, don't go backwards
      const stageOrder = ['new_lead', 'purchased', 'day_1', 'trial_active', 'check_in', 'converted', 'nurture', 'lost'];
      const { data: currentLead } = await supabase
        .from('sales_pipeline')
        .select('stage')
        .eq('id', trial.sales_pipeline_id)
        .single();

      const currentIdx = stageOrder.indexOf(currentLead?.stage || 'new_lead');
      const newIdx = stageOrder.indexOf(newStage);

      if (newIdx > currentIdx) {
        await supabase
          .from('sales_pipeline')
          .update({ stage: newStage, updated_at: new Date().toISOString() })
          .eq('id', trial.sales_pipeline_id);
      }
    }

    // SMS triggers
    const phone = trial.phone ? normalizePhone(trial.phone) : null;

    // After first session — send follow-up next day (for now, send immediately as a trigger)
    if (newSessionsUsed === 1 && phone) {
      // We'll trigger this from the cron job the next day instead
      console.log(`Trial ${trialPassId}: first session logged, follow-up SMS will go via cron`);
    }

    // 3+ sessions — trigger end-of-trial check-in SMS
    if (newSessionsUsed >= 3 && !trial.post_survey_completed && phone) {
      try {
        await sendTrialEndCheckIn({
          phone,
          firstName: trial.first_name,
          trialId: trialPassId,
        });
      } catch (smsErr) {
        console.error('End-of-trial SMS error:', smsErr);
      }
    }

    console.log(`Trial ${trialPassId}: session ${newSessionsUsed} logged`);

    return res.status(200).json({
      success: true,
      sessionsUsed: newSessionsUsed,
      status: updates.status || trial.status,
    });
  } catch (error) {
    console.error('Trial log-session error:', error);
    return res.status(500).json({ error: error.message });
  }
}
