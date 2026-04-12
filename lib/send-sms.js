// lib/send-sms.js
// Unified SMS router — sends via Blooio (primary) or Twilio (fallback)
// Controlled by SMS_PROVIDER env var: 'blooio' | 'twilio' | 'blooio_with_fallback'
// Default: 'twilio' (safe default — nothing changes until env var is switched)
// Range Medical

import { sendTwilioSMS, normalizePhone } from './twilio-sms';
import { sendBlooioMessage } from './blooio';
import { logComm } from './comms-log';

// Re-export normalizePhone so callers can import from one place
export { normalizePhone };

/**
 * Send a message via the configured provider
 *
 * @param {Object} opts
 * @param {string}  opts.to        - Phone number in E.164 format (e.g., +19495551234)
 * @param {string}  opts.message   - Message body
 * @param {string}  [opts.mediaUrl] - Public URL of image/attachment to send
 * @param {Object}  [opts.log]     - If provided, auto-log to comms_log after sending
 * @param {string}  opts.log.messageType - e.g. 'injection_reminder', 'booking_confirmation'
 * @param {string}  opts.log.source      - file/context that sent it, e.g. 'injection-reminders'
 * @param {string}  [opts.log.patientId] - patient UUID (optional — orphan matching by phone works too)
 * @param {string}  [opts.log.protocolId] - protocol UUID
 * @returns {Promise<{ success: boolean, messageSid?: string, error?: string, provider?: string }>}
 */
export async function sendSMS({ to, message, provider: providerOverride, mediaUrl, log }) {
  const provider = (providerOverride || process.env.SMS_PROVIDER || 'twilio').toLowerCase().trim();

  let result;

  // Route 1: Twilio only (default — safe during rollout)
  if (provider === 'twilio') {
    result = await sendTwilioSMS({ to, message });
    result = { ...result, provider: 'twilio' };
  }
  // Route 2: Blooio only
  else if (provider === 'blooio') {
    result = await sendBlooioMessage({ to, message, mediaUrl });
    result = { ...result, provider: 'blooio' };
  }
  // Route 3: Blooio primary with Twilio fallback
  else if (provider === 'blooio_with_fallback') {
    const blooioResult = await sendBlooioMessage({ to, message, mediaUrl });
    if (blooioResult.success) {
      result = { ...blooioResult, provider: 'blooio' };
    } else {
      console.warn(`Blooio failed (${blooioResult.error}), falling back to Twilio for ${to}`);
      const twilioResult = await sendTwilioSMS({ to, message });
      result = { ...twilioResult, provider: 'twilio', blooioError: blooioResult.error };
    }
  }
  // Unknown provider — default to Twilio
  else {
    console.warn(`Unknown SMS_PROVIDER "${provider}", defaulting to Twilio`);
    result = await sendTwilioSMS({ to, message });
    result = { ...result, provider: 'twilio' };
  }

  // Auto-log to comms_log if caller provided log context
  if (log) {
    try {
      await logComm({
        channel: 'sms',
        messageType: log.messageType || 'automated_sms',
        message,
        source: log.source || 'send-sms',
        patientId: log.patientId || null,
        protocolId: log.protocolId || null,
        recipient: to,
        status: result.success ? 'sent' : 'error',
        errorMessage: result.success ? null : result.error,
        twilioMessageSid: result.messageSid || null,
        direction: 'outbound',
        provider: result.provider,
      });
    } catch (logErr) {
      console.error('sendSMS auto-log error:', logErr.message);
    }
  }

  return result;
}
