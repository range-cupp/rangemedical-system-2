// lib/hbot-trial-sms.js
// SMS message templates for the HBOT trial funnel
// All messages sent via sendSMS() and logged via logComm()
// Range Medical

import { sendSMS } from './send-sms';
import { logComm } from './comms-log';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://range-medical.com';

/**
 * Send HBOT trial purchase confirmation SMS
 */
export async function sendHBOTTrialConfirmation({ phone, firstName, trialId }) {
  const surveyLink = `${BASE_URL}/hbot-trial/survey?trial_id=${trialId}&type=pre`;
  const message = `Hey ${firstName}! Your Hyperbaric Recovery Trial is confirmed. Complete your quick Brain & Recovery survey:\n${surveyLink}\n\nCall or text (949) 997-3988 to book your first session.\n\n- Range Medical`;

  const result = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms',
    messageType: 'hbot_trial_confirmation',
    message,
    source: 'hbot-trial-checkout',
    recipient: phone,
    patientName: firstName,
    status: result.success ? 'sent' : 'error',
    errorMessage: result.error || null,
    provider: result.provider,
  });

  return result;
}

/**
 * Send post-session follow-up (after first HBOT session)
 */
export async function sendHBOTTrialPostSession1({ phone, firstName }) {
  const message = `How are you feeling after your first hyperbaric session, ${firstName}? Most people notice changes by session 2\u20133. Book your next visit: (949) 997-3988\n\n- Range Medical`;

  const result = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms',
    messageType: 'hbot_trial_post_session_1',
    message,
    source: 'hbot-trial-cron',
    recipient: phone,
    patientName: firstName,
    status: result.success ? 'sent' : 'error',
    errorMessage: result.error || null,
    provider: result.provider,
  });

  return result;
}

/**
 * Send expiration warning (day before HBOT trial expires)
 */
export async function sendHBOTTrialExpirationWarning({ phone, firstName, sessionsRemaining }) {
  const message = sessionsRemaining > 0
    ? `Hey ${firstName}, your Hyperbaric Recovery Trial expires tomorrow! You still have ${sessionsRemaining === 1 ? '1 session' : `${sessionsRemaining} sessions`} left. Call or text to book: (949) 997-3988\n\n- Range Medical`
    : `Hey ${firstName}, your Hyperbaric Recovery Trial expires tomorrow! If you want to keep going, we have session packs and memberships. Call or text us: (949) 997-3988\n\n- Range Medical`;

  const result = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms',
    messageType: 'hbot_trial_expiration_warning',
    message,
    source: 'hbot-trial-cron',
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
export async function sendHBOTTrialEndCheckIn({ phone, firstName, trialId }) {
  const surveyLink = `${BASE_URL}/hbot-trial/survey?trial_id=${trialId}&type=post`;
  const message = `You've completed your Hyperbaric Recovery Trial, ${firstName}! Complete your Brain & Recovery check-in so we can see what changed:\n${surveyLink}\n\n- Range Medical`;

  const result = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms',
    messageType: 'hbot_trial_end_checkin',
    message,
    source: 'hbot-trial-cron',
    recipient: phone,
    patientName: firstName,
    status: result.success ? 'sent' : 'error',
    errorMessage: result.error || null,
    provider: result.provider,
  });

  return result;
}

/**
 * Send nurture follow-up (for HBOT leads who didn't convert)
 */
export async function sendHBOTTrialNurtureFollowUp({ phone, firstName }) {
  const message = `Hey ${firstName}, thanks for trying Hyperbaric Oxygen Therapy with us! If you ever want to come back, we have single sessions, 10-packs, and monthly memberships.\n\nCall or text anytime: (949) 997-3988\n\n- Range Medical`;

  const result = await sendSMS({ to: phone, message });

  await logComm({
    channel: 'sms',
    messageType: 'hbot_trial_nurture',
    message,
    source: 'hbot-trial-cron',
    recipient: phone,
    patientName: firstName,
    status: result.success ? 'sent' : 'error',
    errorMessage: result.error || null,
    provider: result.provider,
  });

  return result;
}
