// /pages/api/protocols/send-progress.js
// Send weight loss progress chart + portal link to patient via email and/or SMS
// Range Medical

import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, logAction } from '../../../lib/auth';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../lib/blooio-optin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

function generateProgressEmailHtml({ firstName, stats, portalUrl, senderName }) {
  const lossColor = stats.totalLoss && parseFloat(stats.totalLoss) > 0 ? '#16a34a' : '#666';
  const lossText = stats.totalLoss && parseFloat(stats.totalLoss) > 0
    ? `-${stats.totalLoss} lbs`
    : 'N/A';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Weight Loss Progress | Range Medical</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px; border-radius: 8px; overflow: hidden;">

                    <!-- Header -->
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.1em;">RANGE MEDICAL</h1>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 40px 30px 20px;">
                            <h2 style="margin: 0; font-size: 22px; color: #1a1a1a;">Hi ${firstName},</h2>
                            <p style="margin: 12px 0 0; font-size: 15px; color: #666; line-height: 1.6;">Here's your weight loss progress update from Range Medical. Keep up the great work!</p>
                        </td>
                    </tr>

                    <!-- Stats -->
                    <tr>
                        <td style="padding: 0 30px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f9fafb; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 20px; text-align: center; width: 33%;">
                                        <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Starting</div>
                                        <div style="font-size: 22px; font-weight: 700; color: #1a1a1a;">${stats.startingWeight || '—'} lbs</div>
                                    </td>
                                    <td style="padding: 20px; text-align: center; width: 33%;">
                                        <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Current</div>
                                        <div style="font-size: 22px; font-weight: 700; color: #1a1a1a;">${stats.currentWeight || '—'} lbs</div>
                                    </td>
                                    <td style="padding: 20px; text-align: center; width: 33%;">
                                        <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Total Loss</div>
                                        <div style="font-size: 22px; font-weight: 700; color: ${lossColor};">${lossText}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Sessions -->
                    <tr>
                        <td style="padding: 16px 30px 0; text-align: center;">
                            <span style="font-size: 13px; color: #999;">${stats.sessions || 0} sessions completed</span>
                        </td>
                    </tr>

                    <!-- Chart Image Note -->
                    <tr>
                        <td style="padding: 20px 30px 10px;">
                            <p style="margin: 0; font-size: 14px; color: #666; text-align: center; font-style: italic;">See your progress chart attached below.</p>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 20px 30px 40px; text-align: center;">
                            <a href="${portalUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1e40af; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">View Your Progress</a>
                            <p style="margin: 12px 0 0; font-size: 12px; color: #999;">Tap to see your interactive progress chart</p>
                        </td>
                    </tr>

                    <!-- Signature -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <div style="border-top: 1px solid #eee; padding-top: 20px;">
                                <p style="margin: 0; font-size: 14px; color: #404040;">Best,<br><strong>${senderName}</strong><br>Range Medical</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
                            <p style="margin: 0; font-size: 11px; color: #999; line-height: 1.6;">
                                Range Medical | Costa Mesa, CA<br>
                                This message contains protected health information intended only for the named recipient.
                            </p>
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

  const { patientId, protocolId, method, chartImage, stats } = req.body;

  if (!patientId || !protocolId || !method) {
    return res.status(400).json({ error: 'patientId, protocolId, and method are required' });
  }

  if (!['email', 'sms', 'both'].includes(method)) {
    return res.status(400).json({ error: 'method must be email, sms, or both' });
  }

  try {
    // Fetch protocol with patient info
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*, patients(id, name, first_name, last_name, email, phone, ghl_contact_id)')
      .eq('id', protocolId)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const patient = protocol.patients;
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');

    // Generate access_token for portal if not already set
    let accessToken = protocol.access_token;
    if (!accessToken) {
      accessToken = crypto.randomBytes(32).toString('hex');
      await supabase
        .from('protocols')
        .update({ access_token: accessToken, updated_at: new Date().toISOString() })
        .eq('id', protocolId);
    }

    const portalUrl = `https://app.range-medical.com/portal/${accessToken}`;
    const results = { email: null, sms: null };

    // === EMAIL ===
    if (method === 'email' || method === 'both') {
      if (!patient.email) {
        results.email = { success: false, error: 'No email on file' };
      } else {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);

          const html = generateProgressEmailHtml({
            firstName,
            stats: stats || {},
            portalUrl,
            senderName: employee.name,
          });

          const emailPayload = {
            from: `${employee.name} via Range Medical <noreply@range-medical.com>`,
            replyTo: employee.email,
            to: patient.email,
            subject: `Your Weight Loss Progress - Range Medical`,
            html,
          };

          // Attach chart image if provided
          if (chartImage) {
            emailPayload.attachments = [{
              filename: 'weight-loss-progress.png',
              content: Buffer.from(chartImage, 'base64'),
            }];
          }

          const { data: emailData, error: emailError } = await resend.emails.send(emailPayload);

          if (emailError) {
            results.email = { success: false, error: emailError.message };
            await logComm({
              channel: 'email',
              messageType: 'weight_loss_progress',
              message: `Weight loss progress update sent to ${firstName}`,
              source: 'send-progress',
              patientId: patient.id,
              patientName: patient.name,
              ghlContactId: patient.ghl_contact_id,
              recipient: patient.email,
              subject: 'Your Weight Loss Progress - Range Medical',
              status: 'error',
              errorMessage: emailError.message,
              direction: 'outbound',
              sentByEmployeeId: employee.id,
              sentByEmployeeName: employee.name,
            });
          } else {
            results.email = { success: true };
            await logComm({
              channel: 'email',
              messageType: 'weight_loss_progress',
              message: `Weight loss progress update sent to ${firstName}`,
              source: 'send-progress',
              patientId: patient.id,
              patientName: patient.name,
              ghlContactId: patient.ghl_contact_id,
              recipient: patient.email,
              subject: 'Your Weight Loss Progress - Range Medical',
              status: 'sent',
              direction: 'outbound',
              sentByEmployeeId: employee.id,
              sentByEmployeeName: employee.name,
            });
          }
        } catch (emailErr) {
          console.error('Email send error:', emailErr);
          results.email = { success: false, error: emailErr.message };
        }
      }
    }

    // === SMS ===
    if (method === 'sms' || method === 'both') {
      if (!patient.phone) {
        results.sms = { success: false, error: 'No phone number on file' };
      } else {
        try {
          const phone = normalizePhone(patient.phone);
          if (!phone) {
            results.sms = { success: false, error: 'Invalid phone number' };
          } else {
            const lossText = stats?.totalLoss && parseFloat(stats.totalLoss) > 0
              ? ` You've lost ${stats.totalLoss} lbs so far!`
              : '';
            const smsMessage = `Hi ${firstName}! Here's your weight loss progress at Range Medical.${lossText} View your chart: ${portalUrl}`;

            // Handle Blooio two-step opt-in
            if (isBlooioProvider()) {
              const optedIn = await hasBlooioOptIn(phone);

              if (!optedIn) {
                // Send link-free opt-in message first
                const optInMessage = `Hi ${firstName}! Range Medical here. We have your weight loss progress update ready. Reply YES to receive it.`;
                const optInResult = await sendSMS({ to: phone, message: optInMessage });

                if (optInResult.success) {
                  await logComm({
                    channel: 'sms',
                    messageType: 'blooio_optin_request',
                    message: optInMessage,
                    source: `send-progress(${optInResult.provider || 'sms'})`,
                    patientId: patient.id,
                    patientName: patient.name,
                    ghlContactId: patient.ghl_contact_id,
                    recipient: phone,
                    twilioMessageSid: optInResult.messageSid,
                    direction: 'outbound',
                    provider: optInResult.provider || null,
                  });

                  // Queue the link message
                  await queuePendingLinkMessage({
                    phone,
                    message: smsMessage,
                    messageType: 'weight_loss_progress',
                    patientId: patient.id,
                    patientName: patient.name,
                  });

                  results.sms = { success: true, twoStep: true };
                } else {
                  results.sms = { success: false, error: optInResult.error };
                }

                // Skip direct send
              } else {
                // Already opted in — send directly
                const smsResult = await sendSMS({ to: phone, message: smsMessage });
                results.sms = { success: smsResult.success, error: smsResult.error };

                await logComm({
                  channel: 'sms',
                  messageType: 'weight_loss_progress',
                  message: smsMessage,
                  source: `send-progress(${smsResult.provider || 'sms'})`,
                  patientId: patient.id,
                  patientName: patient.name,
                  ghlContactId: patient.ghl_contact_id,
                  recipient: phone,
                  status: smsResult.success ? 'sent' : 'error',
                  errorMessage: smsResult.success ? null : smsResult.error,
                  twilioMessageSid: smsResult.messageSid,
                  direction: 'outbound',
                  provider: smsResult.provider || null,
                });
              }
            } else {
              // Not Blooio — send directly
              const smsResult = await sendSMS({ to: phone, message: smsMessage });
              results.sms = { success: smsResult.success, error: smsResult.error };

              await logComm({
                channel: 'sms',
                messageType: 'weight_loss_progress',
                message: smsMessage,
                source: `send-progress(${smsResult.provider || 'sms'})`,
                patientId: patient.id,
                patientName: patient.name,
                ghlContactId: patient.ghl_contact_id,
                recipient: phone,
                status: smsResult.success ? 'sent' : 'error',
                errorMessage: smsResult.success ? null : smsResult.error,
                twilioMessageSid: smsResult.messageSid,
                direction: 'outbound',
                provider: smsResult.provider || null,
              });
            }
          }
        } catch (smsErr) {
          console.error('SMS send error:', smsErr);
          results.sms = { success: false, error: smsErr.message };
        }
      }
    }

    // Audit log
    await logAction({
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'send_progress',
      resourceType: 'patient',
      resourceId: patient.id,
      details: { method, protocolId, patientName: patient.name, results },
      req,
    });

    // Determine overall success
    const emailOk = !results.email || results.email.success;
    const smsOk = !results.sms || results.sms.success;
    const allOk = emailOk && smsOk;

    let message = '';
    if (method === 'both') {
      const parts = [];
      if (results.email?.success) parts.push(`email to ${patient.email}`);
      if (results.sms?.success) parts.push(`SMS to ${patient.phone}${results.sms.twoStep ? ' (opt-in sent)' : ''}`);
      if (parts.length > 0) message = `Progress sent via ${parts.join(' and ')}`;
      if (!emailOk && results.email) message += (message ? '. ' : '') + `Email failed: ${results.email.error}`;
      if (!smsOk && results.sms) message += (message ? '. ' : '') + `SMS failed: ${results.sms.error}`;
    } else if (method === 'email') {
      message = results.email?.success ? `Progress sent to ${patient.email}` : `Email failed: ${results.email?.error}`;
    } else {
      message = results.sms?.success
        ? `Progress sent to ${patient.phone}${results.sms?.twoStep ? ' (opt-in sent — will deliver when patient replies)' : ''}`
        : `SMS failed: ${results.sms?.error}`;
    }

    return res.status(allOk ? 200 : 207).json({
      success: allOk,
      message,
      results,
      portalUrl,
    });

  } catch (error) {
    console.error('Send progress error:', error);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
