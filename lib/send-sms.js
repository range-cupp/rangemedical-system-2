// lib/send-sms.js
// Unified SMS router — sends via Blooio (primary) or Twilio (fallback)
// Controlled by SMS_PROVIDER env var: 'blooio' | 'twilio' | 'blooio_with_fallback'
// Default: 'twilio' (safe default — nothing changes until env var is switched)
// Range Medical

import { sendTwilioSMS, normalizePhone } from './twilio-sms';
import { sendBlooioMessage } from './blooio';

// Re-export normalizePhone so callers can import from one place
export { normalizePhone };

/**
 * Send a message via the configured provider
 *
 * @param {Object} opts
 * @param {string}  opts.to        - Phone number in E.164 format (e.g., +19495551234)
 * @param {string}  opts.message   - Message body
 * @param {string}  [opts.mediaUrl] - Public URL of image/attachment to send
 * @returns {Promise<{ success: boolean, messageSid?: string, error?: string, provider?: string }>}
 */
export async function sendSMS({ to, message, provider: providerOverride, mediaUrl }) {
  const provider = (providerOverride || process.env.SMS_PROVIDER || 'twilio').toLowerCase().trim();

  // Route 1: Twilio only (default — safe during rollout)
  if (provider === 'twilio') {
    const result = await sendTwilioSMS({ to, message });
    return { ...result, provider: 'twilio' };
  }

  // Route 2: Blooio only
  if (provider === 'blooio') {
    const result = await sendBlooioMessage({ to, message, mediaUrl });
    return { ...result, provider: 'blooio' };
  }

  // Route 3: Blooio primary with Twilio fallback
  if (provider === 'blooio_with_fallback') {
    const blooioResult = await sendBlooioMessage({ to, message, mediaUrl });
    if (blooioResult.success) {
      return { ...blooioResult, provider: 'blooio' };
    }

    console.warn(`Blooio failed (${blooioResult.error}), falling back to Twilio for ${to}`);
    const twilioResult = await sendTwilioSMS({ to, message });
    return { ...twilioResult, provider: 'twilio', blooioError: blooioResult.error };
  }

  // Unknown provider — default to Twilio
  console.warn(`Unknown SMS_PROVIDER "${provider}", defaulting to Twilio`);
  const result = await sendTwilioSMS({ to, message });
  return { ...result, provider: 'twilio' };
}
