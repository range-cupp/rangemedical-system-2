// lib/sms-email-copy.js
// Sends an email copy of every outbound SMS so patients stay informed while SMS is down.
// Controlled by SMS_EMAIL_COPY env var ('true' to enable).
// Looks up patient email by patientId or phone number, respects email opt-out.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { checkCommsOptOut } from './check-comms-opt-out';
import { logComm } from './comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const MESSAGE_TYPE_SUBJECTS = {
  injection_reminder: 'Injection Reminder',
  hrt_injection_reminder: 'Injection Reminder',
  appointment_reminder: 'Appointment Reminder',
  booking_confirmation: 'Appointment Confirmed',
  booking_cancellation: 'Appointment Cancelled',
  booking_reschedule: 'Appointment Rescheduled',
  birthday_sms: 'Happy Birthday from Range Medical',
  lab_results: 'Your Lab Results',
  lab_prep: 'Lab Prep Instructions',
  weekly_checkin: 'Weekly Check-In',
  wl_checkin: 'Weight Loss Check-In',
  peptide_checkin: 'Peptide Check-In',
  iv_followup: 'IV Therapy Follow-Up',
  free_session_prep: 'Session Prep',
  free_session_hbot_prep: 'Session Prep — Hyperbaric Oxygen',
  free_session_followup: 'Session Follow-Up',
  lab_prep_3day: 'Lab Prep Instructions',
  lab_prep_day_before: 'Lab Prep Reminder — Tomorrow',
  invoice_payment: 'Invoice from Range Medical',
  quote_sent: 'Quote from Range Medical',
  payment_link: 'Payment Link',
  guide_sent: 'Your Protocol Guide',
  form_sent: 'Form to Complete',
  video_sent: 'Video from Range Medical',
  renewal_reminder: 'Prescription Renewal',
  dose_change: 'Dose Change Update',
  giveaway_entry: 'Giveaway Entry Confirmed',
  giveaway_winner: 'Giveaway Winner!',
  referral: 'Referral Link',
  energy_check: 'Your Energy Score',
  shop_order: 'Order Confirmation',
  direct_sms: 'Message from Range Medical',
};

function subjectFromType(messageType) {
  if (!messageType) return 'Message from Range Medical';
  if (MESSAGE_TYPE_SUBJECTS[messageType]) return MESSAGE_TYPE_SUBJECTS[messageType];
  return 'Message from Range Medical';
}

function buildEmailHtml(messageText, firstName) {
  const greeting = firstName ? `Hi ${firstName},` : '';
  const lines = messageText
    .split('\n')
    .map(line => `<p style="margin: 0 0 12px; color: #404040; font-size: 15px; line-height: 1.7;">${line || '&nbsp;'}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px;">
                    <tr>
                        <td style="background-color: #000000; padding: 24px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.1em;">RANGE MEDICAL</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 36px 30px 24px;">
                            ${greeting ? `<p style="margin: 0 0 16px; color: #000000; font-size: 16px; font-weight: 600;">${greeting}</p>` : ''}
                            ${lines}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #fafafa; padding: 24px 30px; border-top: 1px solid #eee;">
                            <p style="margin: 0; color: #888; font-size: 13px; text-align: center; line-height: 1.6;">
                                Questions? Call or text us at <strong>(949) 997-3988</strong>
                            </p>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 12px; text-align: center;">
                                Range Medical &#8226; 1901 Westcliff Drive, Suite 10, Newport Beach, CA
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

/**
 * Send an email copy of an SMS message to the patient.
 *
 * @param {Object} opts
 * @param {string}  opts.to          - Phone number (used to look up patient if no patientId/email)
 * @param {string}  opts.message     - SMS message text
 * @param {string}  [opts.patientId] - Patient UUID (preferred for lookup)
 * @param {string}  [opts.patientEmail] - If already known, skip DB lookup
 * @param {string}  [opts.patientName]  - If already known
 * @param {string}  [opts.messageType]  - For subject line and logging
 * @param {string}  [opts.source]       - Calling file for logging
 * @param {string}  [opts.protocolId]   - Protocol UUID for logging
 * @returns {Promise<{ sent: boolean, email?: string, error?: string }>}
 */
export async function sendEmailCopy({ to, message, patientId, patientEmail, patientName, messageType, source, protocolId }) {
  try {
    if (process.env.SMS_EMAIL_COPY !== 'true') {
      return { sent: false, error: 'SMS_EMAIL_COPY not enabled' };
    }

    let email = patientEmail;
    let firstName = patientName?.split(' ')[0] || null;
    let resolvedPatientId = patientId;

    if (!email) {
      let patient;

      if (patientId) {
        const { data } = await supabase
          .from('patients')
          .select('id, email, first_name, last_name')
          .eq('id', patientId)
          .single();
        patient = data;
      }

      if (!patient && to) {
        const digits = to.replace(/\D/g, '').slice(-10);
        if (digits.length === 10) {
          const { data } = await supabase
            .from('patients')
            .select('id, email, first_name, last_name')
            .ilike('phone', `%${digits}`)
            .limit(1)
            .single();
          patient = data;
        }
      }

      if (!patient || !patient.email) {
        return { sent: false, error: 'No patient email found' };
      }

      email = patient.email;
      firstName = firstName || patient.first_name || null;
      resolvedPatientId = resolvedPatientId || patient.id;
    }

    if (resolvedPatientId) {
      const isAutomation = !!(source && source !== 'manual' && source !== 'send-sms');
      const optOut = await checkCommsOptOut({
        patientId: resolvedPatientId,
        channel: 'email',
        isAutomation,
      });
      if (!optOut.allowed) {
        return { sent: false, error: optOut.reason };
      }
    }

    const subject = subjectFromType(messageType);
    const html = buildEmailHtml(message, firstName);

    const { error: sendError } = await resend.emails.send({
      from: 'Range Medical <notifications@range-medical.com>',
      to: email,
      subject,
      html,
    });

    if (sendError) {
      console.error('SMS email copy send error:', sendError);
      return { sent: false, error: sendError.message || 'Resend error' };
    }

    try {
      await logComm({
        channel: 'email',
        messageType: `sms_email_copy_${messageType || 'unknown'}`,
        message,
        source: source ? `sms-email-copy(${source})` : 'sms-email-copy',
        patientId: resolvedPatientId,
        protocolId: protocolId || null,
        recipient: email,
        subject,
        status: 'sent',
        direction: 'outbound',
        htmlBody: html,
      });
    } catch (logErr) {
      console.error('SMS email copy log error:', logErr.message);
    }

    return { sent: true, email };
  } catch (err) {
    console.error('sendEmailCopy error:', err.message);
    return { sent: false, error: err.message };
  }
}
