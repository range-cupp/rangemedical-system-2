// lib/trial-sms.js
// SMS message templates for the RLT trial funnel
// All messages sent via sendSMS() and logged via logComm()
// Range Medical

import { sendSMS } from './send-sms';
import { logComm } from './comms-log';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://range-medical.com';

/**
 * Send trial purchase confirmation SMS
 */
export async function sendTrialConfirmation({ phone, firstName, trialId }) {
  const surveyLink = `${BASE_URL}/rlt-trial/survey?trial_id=${trialId}&type=pre`;
  const message = `Hey ${firstName}! Your Red Light Trial is confirmed. Complete your quick energy survey to book your first session:\n${surveyLink}\n\n- Range Medical`;

  const result = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms',
    messageType: 'rlt_trial_confirmation',
    message,
    source: 'trial-checkout',
    recipient: phone,
    patientName: firstName,
    status: result.success ? 'sent' : 'error',
    errorMessage: result.error || null,
    provider: result.provider,
  });

  return result;
}

/**
 * Send session reminder (day before)
 */
export async function sendTrialSessionReminder({ phone, firstName, sessionTime }) {
  const message = `Reminder: Your Red Light session is tomorrow at ${sessionTime}. See you at Range Medical! (949) 997-3988`;

  const result = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms',
    messageType: 'rlt_trial_session_reminder',
    message,
    source: 'trial-cron',
    recipient: phone,
    patientName: firstName,
    status: result.success ? 'sent' : 'error',
    errorMessage: result.error || null,
    provider: result.provider,
  });

  return result;
}

/**
 * Send post-session follow-up (after first session)
 */
export async function sendTrialPostSession1({ phone, firstName }) {
  const message = `How are you feeling after your first Red Light session, ${firstName}? You have the rest of the week to come in — no appointment needed, just walk in during clinic hours.\n\n- Range Medical (949) 997-3988`;

  const result = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms',
    messageType: 'rlt_trial_post_session_1',
    message,
    source: 'trial-cron',
    recipient: phone,
    patientName: firstName,
    status: result.success ? 'sent' : 'error',
    errorMessage: result.error || null,
    provider: result.provider,
  });

  return result;
}

/**
 * Send expiration warning (day before trial expires)
 */
export async function sendTrialExpirationWarning({ phone, firstName, sessionsRemaining }) {
  const sessionText = sessionsRemaining === 1 ? '1 session' : `${sessionsRemaining} sessions`;
  const message = `Hey ${firstName}, your Red Light Trial expires tomorrow! You still have time for ${sessionText}. Walk in anytime during clinic hours.\n\n- Range Medical (949) 997-3988`;

  const result = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms',
    messageType: 'rlt_trial_expiration_warning',
    message,
    source: 'trial-cron',
    recipient: phone,
    patientName: firstName,
    status: result.success ? 'sent' : 'error',
    errorMessage: result.error || null,
    provider: result.provider,
  });

  return result;
}

/**
 * Send end-of-trial check-in invitation
 */
export async function sendTrialEndCheckIn({ phone, firstName, trialId }) {
  const surveyLink = `${BASE_URL}/rlt-trial/survey?trial_id=${trialId}&type=post`;
  const message = `Tomorrow is your Energy Week wrap-up, ${firstName}. We'll do a quick check-in to see what changed and talk about next steps.\n\nComplete your post-survey first:\n${surveyLink}\n\n- Range Medical`;

  const result = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms',
    messageType: 'rlt_trial_end_checkin',
    message,
    source: 'trial-cron',
    recipient: phone,
    patientName: firstName,
    status: result.success ? 'sent' : 'error',
    errorMessage: result.error || null,
    provider: result.provider,
  });

  return result;
}

/**
 * Send nurture follow-up (for leads who didn't convert)
 */
export async function sendTrialNurtureFollowUp({ phone, firstName }) {
  const message = `Hey ${firstName}, thanks for trying Red Light Therapy with us! If you ever want to come back, we have single sessions, 10-packs, and monthly memberships.\n\nCall or text anytime: (949) 997-3988\n\n- Range Medical`;

  const result = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms',
    messageType: 'rlt_trial_nurture',
    message,
    source: 'trial-cron',
    recipient: phone,
    patientName: firstName,
    status: result.success ? 'sent' : 'error',
    errorMessage: result.error || null,
    provider: result.provider,
  });

  return result;
}
