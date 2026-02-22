// /lib/twilio.js
// Twilio SMS Utility - Sends SMS via Twilio REST API
// Range Medical
//
// Replaces GHL Conversations API for all SMS sending.
// Uses Twilio REST API directly (no SDK needed).

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Staff phone numbers for alerts
const STAFF_PHONES = {
  chris: '+19496900339',
  lily: '+19496900339' // Update with Nurse Lily's actual number
};

/**
 * Format phone number to E.164 (+1XXXXXXXXXX)
 */
function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+') && digits.length >= 11) return `+${digits}`;
  return null;
}

/**
 * Send SMS via Twilio REST API
 * @param {string} to - Phone number (any format, will be normalized to E.164)
 * @param {string} message - Message body
 * @returns {object|null} - Twilio message object or null on failure
 */
export async function sendSMS(to, message) {
  const toFormatted = formatPhone(to);
  if (!toFormatted) {
    console.error('Twilio: Invalid phone number:', to);
    return null;
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('Twilio: Missing environment variables');
    return null;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const body = new URLSearchParams({
      To: toFormatted,
      From: TWILIO_PHONE_NUMBER,
      Body: message
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Twilio SMS error:', result.code, result.message);
      return null;
    }

    console.log('SMS sent to:', toFormatted, '| SID:', result.sid);
    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return null;
  }
}

/**
 * Send SMS to staff (Chris by default)
 * @param {string} message - Message body
 * @param {string} staffKey - Staff member key (default: 'chris')
 * @returns {object|null}
 */
export async function sendStaffSMS(message, staffKey = 'chris') {
  const phone = STAFF_PHONES[staffKey] || STAFF_PHONES.chris;
  return sendSMS(phone, message);
}

/**
 * Send SMS to multiple staff members
 * @param {string} message - Message body
 * @param {string[]} staffKeys - Array of staff keys
 * @returns {object[]}
 */
export async function sendMultiStaffSMS(message, staffKeys = ['chris']) {
  const results = [];
  for (const key of staffKeys) {
    const result = await sendStaffSMS(message, key);
    results.push({ staff: key, result });
  }
  return results;
}
