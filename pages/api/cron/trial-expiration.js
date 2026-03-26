// /api/cron/trial-expiration
// Daily cron: handles trial expiration warnings, expired passes, and post-session follow-ups
// Run daily at 9 AM Pacific via Vercel Cron
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendTrialExpirationWarning, sendTrialEndCheckIn, sendTrialPostSession1, sendTrialNurtureFollowUp } from '../../../lib/trial-sms';
import { normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Verify cron authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

  let expirationWarnings = 0;
  let expired = 0;
  let checkInsSent = 0;
  let followUpsSent = 0;
  let nurtured = 0;
  const errors = [];

  try {
    // 1. Expiration warnings — trial expires tomorrow
    const { data: expiring } = await supabase
      .from('trial_passes')
      .select('*')
      .in('status', ['active'])
      .eq('expires_at', tomorrowStr);

    for (const trial of (expiring || [])) {
      if (!trial.phone) continue;
      try {
        const phone = normalizePhone(trial.phone);
        await sendTrialExpirationWarning({
          phone,
          firstName: trial.first_name,
          sessionsRemaining: 'unlimited',
        });
        expirationWarnings++;

        await supabase
          .from('trial_passes')
          .update({ status: 'expiring', updated_at: new Date().toISOString() })
          .eq('id', trial.id);
      } catch (err) {
        errors.push(`Expiration warning for ${trial.first_name}: ${err.message}`);
      }
    }

    // 2. Expire passed trials
    const { data: toExpire } = await supabase
      .from('trial_passes')
      .select('*')
      .in('status', ['active', 'expiring', 'purchased'])
      .lte('expires_at', yesterdayStr);

    for (const trial of (toExpire || [])) {
      await supabase
        .from('trial_passes')
        .update({ status: 'expired', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', trial.id);

      // Move pipeline to lost
      if (trial.sales_pipeline_id) {
        await supabase
          .from('sales_pipeline')
          .update({ stage: 'lost', lost_reason: 'trial_expired', updated_at: new Date().toISOString() })
          .eq('id', trial.sales_pipeline_id);
      }

      expired++;
    }

    // 3. End-of-trial check-in — 3+ sessions but no post-survey yet
    const { data: needsCheckIn } = await supabase
      .from('trial_passes')
      .select('*')
      .in('status', ['active', 'expiring'])
      .gte('sessions_used', 3)
      .eq('post_survey_completed', false);

    for (const trial of (needsCheckIn || [])) {
      if (!trial.phone) continue;
      try {
        const phone = normalizePhone(trial.phone);
        await sendTrialEndCheckIn({
          phone,
          firstName: trial.first_name,
          trialId: trial.id,
        });
        checkInsSent++;
      } catch (err) {
        errors.push(`Check-in SMS for ${trial.first_name}: ${err.message}`);
      }
    }

    // 4. Post-session 1 follow-up — activated yesterday, sessions_used === 1
    const { data: firstSessionFollowUps } = await supabase
      .from('trial_passes')
      .select('*')
      .eq('status', 'active')
      .eq('sessions_used', 1)
      .gte('activated_at', `${yesterdayStr}T00:00:00`)
      .lte('activated_at', `${yesterdayStr}T23:59:59`);

    for (const trial of (firstSessionFollowUps || [])) {
      if (!trial.phone) continue;
      try {
        const phone = normalizePhone(trial.phone);
        await sendTrialPostSession1({ phone, firstName: trial.first_name });
        followUpsSent++;
      } catch (err) {
        errors.push(`Post-session 1 SMS for ${trial.first_name}: ${err.message}`);
      }
    }

    // 5. Nurture — completed trials (post-survey done) without conversion after 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString();

    const { data: readyToNurture } = await supabase
      .from('trial_passes')
      .select('*')
      .eq('status', 'completed')
      .eq('post_survey_completed', true)
      .is('converted_to', null)
      .lte('completed_at', threeDaysAgoStr);

    for (const trial of (readyToNurture || [])) {
      if (!trial.phone) continue;
      try {
        const phone = normalizePhone(trial.phone);
        await sendTrialNurtureFollowUp({ phone, firstName: trial.first_name });

        await supabase
          .from('trial_passes')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', trial.id);

        if (trial.sales_pipeline_id) {
          await supabase
            .from('sales_pipeline')
            .update({ stage: 'nurture', updated_at: new Date().toISOString() })
            .eq('id', trial.sales_pipeline_id);
        }

        nurtured++;
      } catch (err) {
        errors.push(`Nurture SMS for ${trial.first_name}: ${err.message}`);
      }
    }

    console.log(`Trial cron: ${expirationWarnings} warnings, ${expired} expired, ${checkInsSent} check-ins, ${followUpsSent} follow-ups, ${nurtured} nurtured`);

    return res.status(200).json({
      success: true,
      expirationWarnings,
      expired,
      checkInsSent,
      followUpsSent,
      nurtured,
      errors: errors.length > 0 ? errors : undefined,
      run_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Trial cron error:', error);
    return res.status(500).json({ error: error.message });
  }
}
