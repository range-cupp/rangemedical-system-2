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
 * @param {string}  opts.to        - Phone number in E.164 format (e.g., +19495551234)
 * @param {string}  opts.message   - Message body
 * @param {string}  [opts.mediaUrl] - Public URL of image/attachment to send
 * @returns {Promise<{ success: boolean, messageSid?: string, error?: string }>}
 */
export async function sendBlooioMessage({ to, message, mediaUrl }) {
  const apiKey = (process.env.BLOOIO_API_KEY || '').trim();
  const fromNumber = (process.env.BLOOIO_PHONE_NUMBER || '').trim();

  if (!apiKey) {
    return { success: false, error: 'Blooio API key not configured' };
  }

  if (!to || (!message && !mediaUrl)) {
    return { success: false, error: 'Missing required fields: to and (message or mediaUrl)' };
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
      body: JSON.stringify({
        ...(message ? { text: message } : {}),
        ...(mediaUrl ? { attachments: [{ url: mediaUrl, type: 'image' }] } : {}),
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Blooio returned non-JSON:', response.status, text.substring(0, 200));
      // If status is OK (200/202) but response is not JSON, message likely sent
      if (response.ok) {
        return { success: true, messageSid: null };
      }
      return { success: false, error: `Blooio returned non-JSON (${response.status})` };
    }

    // Blooio returns 202 for queued messages, 200 for idempotent duplicates
    if (!response.ok) {
      const errorMsg = data.error || data.message || `Blooio error ${response.status}`;
      // 503 = no active Mac devices connected to Blooio
      if (response.status === 503) {
        console.error('Blooio 503: No active devices — is the Mac with Blooio running?');
      } else {
        console.error('Blooio send error:', errorMsg);
      }
      return { success: false, error: errorMsg };
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
