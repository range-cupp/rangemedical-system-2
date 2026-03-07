// lib/blooio.js
// Blooio messaging client — iMessage/RCS/SMS smart routing
// API Docs: https://docs.blooio.com
// Range Medical

const BLOOIO_BASE_URL = 'https://backend.blooio.com/v2/api';

/**
 * Send a message via Blooio API
 * Blooio auto-selects iMessage (Apple), RCS (Android), or SMS (fallback)
 *
 * @param {Object} opts
 * @param {string}  opts.to       - Phone number in E.164 format (e.g., +19495551234)
 * @param {string}  opts.message  - Message body
 * @returns {Promise<{ success: boolean, messageSid?: string, error?: string }>}
 */
export async function sendBlooioMessage({ to, message }) {
  const apiKey = (process.env.BLOOIO_API_KEY || '').trim();
  const fromNumber = (process.env.BLOOIO_PHONE_NUMBER || '').trim();

  if (!apiKey) {
    return { success: false, error: 'Blooio API key not configured' };
  }

  if (!to || !message) {
    return { success: false, error: 'Missing required fields: to and message' };
  }

  try {
    // chatId = URL-encoded E.164 phone number
    const chatId = encodeURIComponent(to);
    const url = `${BLOOIO_BASE_URL}/chats/${chatId}/messages`;

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    // Set sender number if configured
    if (fromNumber) {
      headers['X-From-Number'] = fromNumber;
    }

    // Idempotency key to prevent duplicate sends on retries
    headers['Idempotency-Key'] = `rm-${to}-${Date.now()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: message }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Blooio send error:', data.error || data);
      return {
        success: false,
        error: data.error || `Blooio error ${response.status}`,
      };
    }

    // Map Blooio's message_id to messageSid for consistent interface with Twilio
    return {
      success: true,
      messageSid: data.message_id || data.message_ids?.[0] || null,
    };
  } catch (err) {
    console.error('Blooio send exception:', err);
    return { success: false, error: err.message };
  }
}
