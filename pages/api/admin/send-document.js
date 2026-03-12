// /pages/api/admin/send-document.js
// Send service document PDF links via email or SMS
// Range Medical System

import { Resend } from 'resend';
import { sendSMS } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';

function generateDocumentEmailHtml({ firstName, documentName, documentUrl }) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${documentName} — Range Medical</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px;">
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.1em;">RANGE MEDICAL</h1>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Service Information</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Here's the information about <strong>${documentName}</strong> from Range Medical:</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <a href="${documentUrl}" style="display: inline-block; padding: 14px 28px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
                                            View ${documentName}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 8px; color: #666; font-size: 13px; line-height: 1.6;">Have questions? Call or text us anytime — we're happy to help.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 30px; border-top: 1px solid #e5e5e5; background-color: #fafafa;">
                            <p style="margin: 0 0 4px; color: #999; font-size: 12px;">Range Medical</p>
                            <p style="margin: 0 0 4px; color: #999; font-size: 12px;">1901 Westcliff Dr, Suite 10 · Newport Beach, CA</p>
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

  const { type, documentUrl, documentName, patientEmail, patientPhone, patientName, patientId, ghlContactId } = req.body;

  if (!type || !documentUrl || !documentName) {
    return res.status(400).json({ error: 'type, documentUrl, and documentName are required' });
  }

  const firstName = patientName ? patientName.split(' ')[0] : 'there';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.range-medical.com';
  const fullUrl = documentUrl.startsWith('http') ? documentUrl : `${baseUrl}${documentUrl}`;

  try {
    // ── Send via Email ──
    if (type === 'email') {
      if (!patientEmail) {
        return res.status(400).json({ error: 'Patient email is required for email delivery' });
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      const html = generateDocumentEmailHtml({
        firstName,
        documentName,
        documentUrl: fullUrl,
      });

      const { data, error } = await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: patientEmail,
        subject: `${documentName} — Range Medical`,
        html,
      });

      if (error) {
        console.error('Document email error:', error);
        return res.status(500).json({ error: 'Failed to send email', details: error.message });
      }

      await logComm({
        channel: 'email',
        messageType: 'document_link',
        message: `Document sent via email: ${documentName}`,
        source: 'send-document',
        patientId: patientId || null,
        patientName: patientName || null,
        ghlContactId: ghlContactId || null,
        recipient: patientEmail,
        direction: 'outbound',
        subject: `${documentName} — Range Medical`,
      });

      console.log(`✓ Document email sent to ${patientEmail}: ${documentName}`);
      return res.status(200).json({ success: true, message: `${documentName} sent via email` });
    }

    // ── Send via SMS ──
    if (type === 'sms') {
      if (!patientPhone) {
        return res.status(400).json({ error: 'Patient phone is required for SMS delivery' });
      }

      const smsMessage = `Hi ${firstName}! Here's info about ${documentName} from Range Medical:\n\n${fullUrl}\n\nQuestions? Call us at (949) 997-3988.\n\n- Range Medical`;

      const result = await sendSMS({ to: patientPhone, message: smsMessage });

      if (!result.success) {
        console.error('Document SMS error:', result.error);
        return res.status(500).json({ error: 'Failed to send SMS', details: result.error });
      }

      await logComm({
        channel: 'sms',
        messageType: 'document_link',
        message: `Document sent via SMS: ${documentName}`,
        source: 'send-document',
        patientId: patientId || null,
        patientName: patientName || null,
        ghlContactId: ghlContactId || null,
        recipient: patientPhone,
        direction: 'outbound',
        provider: result.provider,
      });

      console.log(`✓ Document SMS sent to ${patientPhone}: ${documentName}`);
      return res.status(200).json({ success: true, message: `${documentName} sent via SMS` });
    }

    return res.status(400).json({ error: 'type must be "email" or "sms"' });

  } catch (error) {
    console.error('Send document error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send document' });
  }
}
