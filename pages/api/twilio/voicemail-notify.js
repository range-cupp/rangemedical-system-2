// /pages/api/twilio/voicemail-notify.js
// Called by Twilio when a voicemail recording is ready
// Sends email notification with recording link via Resend
// Range Medical

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      RecordingUrl,
      RecordingSid,
      RecordingDuration,
      RecordingStatus,
    } = req.body;

    // Only notify on completed recordings
    if (RecordingStatus !== 'completed') {
      return res.status(200).json({ ok: true });
    }

    // Get caller number from query param (passed from voicemail.js)
    const caller = req.query.caller || 'Unknown';

    // Format caller number for display
    const callerDisplay = formatPhone(caller);

    // Duration in minutes:seconds
    const duration = parseInt(RecordingDuration || '0', 10);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationDisplay = `${mins}:${secs.toString().padStart(2, '0')}`;

    // Use our proxy URL so the browser plays the audio inline (no download)
    const audioUrl = `https://app.range-medical.com/api/twilio/recording/${RecordingSid}`;

    // Send email notification
    const { error } = await resend.emails.send({
      from: 'Range Medical <notifications@range-medical.com>',
      to: 'intake@range-medical.com',
      subject: `📞 New Voicemail from ${callerDisplay}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background: #166534; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0; font-size: 20px;">📞 New Voicemail</h2>
          </div>
          <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">From:</td>
                <td style="padding: 8px 0; font-size: 16px; font-weight: 600;">${callerDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Duration:</td>
                <td style="padding: 8px 0; font-size: 16px;">${durationDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time:</td>
                <td style="padding: 8px 0; font-size: 16px;">${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' })}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${audioUrl}" style="display: inline-block; background: #166534; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">
                🎧 Listen to Voicemail
              </a>
            </div>
            <p style="margin-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;">
              Recording ID: ${RecordingSid || 'N/A'}
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Voicemail notification email error:', error);
      return res.status(500).json({ error: 'Failed to send notification' });
    }

    console.log(`Voicemail notification sent — caller: ${callerDisplay}, duration: ${durationDisplay}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Voicemail notify error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function formatPhone(number) {
  // Format +1XXXXXXXXXX to (XXX) XXX-XXXX
  const cleaned = (number || '').replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return number || 'Unknown';
}
