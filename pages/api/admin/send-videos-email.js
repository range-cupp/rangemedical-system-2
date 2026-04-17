// /pages/api/admin/send-videos-email.js
// Send injection demo video links to patients via email (Resend)
// Range Medical

import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';
import { INJECTION_VIDEOS } from '../../../lib/injection-videos';

function generateVideosEmailHtml({ firstName, videos, baseUrl }) {
  const videoBlocksHtml = videos.map(v => `
    <tr>
      <td style="padding: 0 0 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border: 1px solid #e5e5e5;">
          <tr>
            <td style="padding: 20px 24px;">
              <p style="margin: 0 0 6px; color: #000; font-size: 16px; font-weight: 600;">${v.name}</p>
              <p style="margin: 0 0 14px; color: #737373; font-size: 13px; line-height: 1.5;">${v.subtitle}</p>
              <a href="${baseUrl}/v/${v.slug}" style="display: inline-block; padding: 12px 22px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 0.04em;">
                ▶ Watch Video
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Injection Video from Range Medical</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px;">

                    <!-- Header -->
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.1em;">RANGE MEDICAL</h1>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Your Injection Instructions</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>
                            <p style="margin: 0 0 28px; color: #404040; font-size: 15px; line-height: 1.7;">Here ${videos.length > 1 ? 'are your injection videos' : 'is your injection video'}. Watch ${videos.length > 1 ? 'them' : 'it'} as many times as you need — each one shows how to remove the red flip-top cap and attach the needle to the Luer lock, step by step.</p>

                            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                                ${videoBlocksHtml}
                            </table>

                            <p style="margin: 20px 0 0; color: #666; font-size: 13px; line-height: 1.6;">Questions before you inject? Call or text us any time at (949) 997-3988.</p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 30px; border-top: 1px solid #e5e5e5; background-color: #fafafa;">
                            <p style="margin: 0 0 4px; color: #999; font-size: 12px;">Range Medical</p>
                            <p style="margin: 0 0 4px; color: #999; font-size: 12px;">Questions? Call us at (949) 997-3988</p>
                            <p style="margin: 0; color: #999; font-size: 12px;">www.range-medical.com</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName, videoSlugs, patientId, patientName, ghlContactId } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  if (!videoSlugs || videoSlugs.length === 0) {
    return res.status(400).json({ error: 'At least one video must be selected' });
  }

  const validVideos = videoSlugs
    .filter(slug => INJECTION_VIDEOS[slug])
    .map(slug => INJECTION_VIDEOS[slug]);

  if (validVideos.length === 0) {
    return res.status(400).json({ error: 'No valid videos selected' });
  }

  const baseUrl = 'https://www.range-medical.com';
  const name = firstName || 'there';

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = generateVideosEmailHtml({
      firstName: name,
      videos: validVideos,
      baseUrl,
    });

    const videoNames = validVideos.map(v => v.name).join(', ');
    const subject = validVideos.length === 1
      ? `Your ${validVideos[0].name} video — Range Medical`
      : `Your injection videos — Range Medical`;

    const { data, error } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error.message });
    }

    await logComm({
      channel: 'email',
      messageType: 'injection_video_links',
      message: `Injection videos sent via email: ${videoNames}`,
      source: 'send-videos-email',
      patientId: patientId || null,
      patientName: patientName || firstName || null,
      ghlContactId: ghlContactId || null,
      recipient: email,
      direction: 'outbound',
      subject,
    });

    console.log(`Injection video email sent to ${email}: ${videoNames}`);

    return res.status(200).json({
      success: true,
      videosSent: validVideos.length,
      message: `Sent ${validVideos.length} video${validVideos.length > 1 ? 's' : ''} via email`,
    });

  } catch (error) {
    console.error('Send videos email error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}
