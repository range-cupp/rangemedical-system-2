// lib/twilio-sms.js
// Shared Twilio SMS sender for all outbound messaging
// Uses Messaging Service SID for A2P 10DLC compliance
// Range Medical

/**
 * Send an SMS via Twilio
 *
 * @param {Object} opts
 * @param {string}  opts.to       - Phone number in E.164 format (e.g., +19496900339)
 * @param {string}  opts.message  - Message body
 * @returns {Promise<{ success: boolean, messageSid?: string, error?: string }>}
 */
export async function sendTwilioSMS({ to, message }) {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const messagingServiceSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || '').trim();
  const fromNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim();

  if (!accountSid || !authToken) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  if (!messagingServiceSid && !fromNumber) {
    return { success: false, error: 'No Twilio sender configured (MessagingServiceSid or phone number)' };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const params = new URLSearchParams();
    params.append('To', to);

    // Prefer Messaging Service SID for A2P compliance
    if (messagingServiceSid) {
      params.append('MessagingServiceSid', messagingServiceSid);
    } else {
      params.append('From', fromNumber);
    }

    params.append('Body', message);

    // Status callback for delivery tracking
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com').replace(/\/$/, '');
    params.append('StatusCallback', `${baseUrl}/api/twilio/status-callback`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio SMS error:', data.message || data);
      return { success: false, error: data.message || `Twilio error ${response.status}` };
    }

    return { success: true, messageSid: data.sid };
  } catch (err) {
    console.error('Twilio SMS exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Normalize a phone number to E.164 format
 * @param {string} phone - Phone number in any format
 * @returns {string|null} - E.164 phone number or null if invalid
 */
export function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (phone.startsWith('+') && digits.length >= 10) return '+' + digits;
  return null;
}
