// /pages/api/email/send.js
// Send a composed email on behalf of a logged-in employee via Resend
// Tracks in comms_log + audit_log — Range Medical System

import { Resend } from 'resend';
import { requireAuth, logAction } from '../../../lib/auth';
import { logComm } from '../../../lib/comms-log';

// Increase body size limit for file attachments (default is 1MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

function generateEmailHtml({ body, senderName, senderEmail }) {
  // Convert newlines to <br> tags for the body
  const formattedBody = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Message from Range Medical</title>
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
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <div style="color: #404040; font-size: 15px; line-height: 1.7;">
                                ${formattedBody}
                            </div>
                        </td>
                    </tr>

                    <!-- Email Signature -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 14px; line-height: 1.4;">
                                <tr>
                                    <td style="padding-right: 20px; vertical-align: top; border-right: 2px solid #1a1a1a;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 18px; font-weight: bold; color: #1a1a1a; letter-spacing: 0.3px; padding-bottom: 2px;">
                                                    ${senderName}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 12px; color: #555555; text-transform: uppercase; letter-spacing: 1.5px;">
                                                    Range Medical
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td style="padding-left: 20px; vertical-align: top;">
                                        <table cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #333333;">
                                            <tr>
                                                <td style="padding-bottom: 3px;">
                                                    <a href="tel:9499973988" style="color: #333333; text-decoration: none;">(949) 997-3988</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-bottom: 3px;">
                                                    <a href="mailto:${senderEmail}" style="color: #333333; text-decoration: none;">${senderEmail}</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-bottom: 3px;">
                                                    <a href="https://www.range-medical.com" style="color: #1a1a1a; text-decoration: none; font-weight: 600;">www.range-medical.com</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 12px; color: #777777;">
                                                    1901 Westcliff Dr, Ste 9 &amp; 10 &middot; Newport Beach, CA
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding-top: 16px;">
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td style="border-top: 1px solid #e0e0e0; padding-top: 12px; font-size: 10px; color: #999999; line-height: 1.5; max-width: 500px;">
                                                    <strong style="color: #888888;">Confidentiality:</strong> This email is intended solely for its addressed recipient and may contain privileged information. If received in error, please notify the sender and delete this message.
                                                    <br><br>
                                                    <strong style="color: #888888;">Medical:</strong> Content is informational only and not a substitute for professional medical advice, diagnosis, or treatment. Range Medical does not provide emergency care.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
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

  const employee = await requireAuth(req, res);
  if (!employee) return;

  const { to, subject, body, patientId, patientName, ghlContactId, attachments } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject, and body are required' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = generateEmailHtml({
      body,
      senderName: employee.name,
      senderEmail: employee.email,
    });

    // Build Resend attachments from base64 data
    const resendAttachments = (attachments || []).map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      ...(att.type ? { type: att.type } : {}),
    }));

    const { data, error: emailError } = await resend.emails.send({
      from: `${employee.name} via Range Medical <noreply@range-medical.com>`,
      replyTo: employee.email,
      to,
      subject,
      html,
      ...(resendAttachments.length > 0 ? { attachments: resendAttachments } : {}),
    });

    if (emailError) {
      console.error('Resend email error:', emailError);

      // Log failed attempt
      await logComm({
        channel: 'email',
        messageType: 'staff_email',
        message: body,
        source: 'email-send',
        patientId: patientId || null,
        patientName: patientName || null,
        ghlContactId: ghlContactId || null,
        recipient: to,
        subject,
        status: 'error',
        errorMessage: emailError.message || 'Resend error',
        direction: 'outbound',
        sentByEmployeeId: employee.id,
        sentByEmployeeName: employee.name,
      });

      return res.status(500).json({ error: 'Failed to send email', details: emailError.message });
    }

    // Log successful send to comms_log (includes full rendered HTML)
    await logComm({
      channel: 'email',
      messageType: 'staff_email',
      message: body,
      htmlBody: html,
      source: 'email-send',
      patientId: patientId || null,
      patientName: patientName || null,
      ghlContactId: ghlContactId || null,
      recipient: to,
      subject,
      status: 'sent',
      direction: 'outbound',
      sentByEmployeeId: employee.id,
      sentByEmployeeName: employee.name,
    });

    // Log to audit trail
    await logAction({
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'send_email',
      resourceType: patientId ? 'patient' : 'email',
      resourceId: patientId || null,
      details: { to, subject, patientName: patientName || null },
      req,
    });

    console.log(`Email sent by ${employee.name} to ${to}: ${subject}`);

    return res.status(200).json({
      success: true,
      message: `Email sent to ${to}`,
    });

  } catch (error) {
    console.error('Send email error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}
