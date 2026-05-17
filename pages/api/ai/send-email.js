// /pages/api/ai/send-email.js
// Sends an email drafted by the AI assistant via Resend, logs to comms_log
// Range Medical

import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, subject, body, patient_id, patient_name, sent_by_name, sent_by_id } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject, and body are required' });
  }

  const fromName = sent_by_name ? `${sent_by_name} via Range Medical` : 'Range Medical';
  const html = body
    .replace(/\n/g, '<br>')
    .replace(/^(.*)$/, `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a;">$&</div>`);

  try {
    await resend.emails.send({
      from: `${fromName} <noreply@range-medical.com>`,
      to,
      subject,
      html,
    });

    await logComm({
      channel: 'email',
      messageType: 'assistant_email',
      message: body,
      htmlBody: html,
      source: 'ai-assistant',
      patientId: patient_id || null,
      patientName: patient_name || null,
      recipient: to,
      subject,
      status: 'sent',
      direction: 'outbound',
      sentByEmployeeId: sent_by_id || null,
      sentByEmployeeName: sent_by_name || null,
      metadata: { via: 'ai_assistant' },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Send email error:', err);

    await logComm({
      channel: 'email',
      messageType: 'assistant_email',
      message: body,
      source: 'ai-assistant',
      patientId: patient_id || null,
      recipient: to,
      subject,
      status: 'error',
      errorMessage: err.message,
    }).catch(() => {});

    return res.status(500).json({ error: 'Failed to send email' });
  }
}
