// /pages/api/email/send.js
// Send a composed email on behalf of a logged-in employee via Resend
// Tracks in comms_log + audit_log — Range Medical System

import { Resend } from 'resend';
import { requireAuth, logAction } from '../../../lib/auth';
import { logComm } from '../../../lib/comms-log';

function generateEmailHtml({ body, senderName }) {
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

                    <!-- Sender -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="border-left: 4px solid #000000; padding-left: 20px;">
                                        <p style="margin: 0 0 2px; color: #111; font-size: 14px; font-weight: 600;">${senderName}</p>
                                        <p style="margin: 0; color: #888; font-size: 13px;">Range Medical</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 30px; border-top: 1px solid #e5e5e5; background-color: #fafafa;">
                            <p style="margin: 0 0 4px; color: #999; font-size: 12px;">Range Medical</p>
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

  const employee = await requireAuth(req, res);
  if (!employee) return;

  const { to, subject, body, patientId, patientName, ghlContactId } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject, and body are required' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = generateEmailHtml({
      body,
      senderName: employee.name,
    });

    const { data, error: emailError } = await resend.emails.send({
      from: `${employee.name} via Range Medical <noreply@range-medical.com>`,
      replyTo: employee.email,
      to,
      subject,
      html,
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

    // Log successful send to comms_log
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
