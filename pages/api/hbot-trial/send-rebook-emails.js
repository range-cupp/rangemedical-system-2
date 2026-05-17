// POST /api/hbot-trial/send-rebook-emails
// Sends re-engagement emails to HBOT trial no-shows with a link to rebook.
// Admin-only endpoint (requires CRON_SECRET auth).

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.range-medical.com';

function isAuthorized(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  if (req.headers['authorization'] === `Bearer ${expected}`) return true;
  if (req.headers['x-cron-secret'] === expected) return true;
  if (req.body?.secret === expected) return true;
  return false;
}

function buildEmailHtml(firstName, rebookUrl) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <tr><td style="padding:36px 32px 0;">
          <p style="font-size:15px;color:#171717;margin:0 0 16px;line-height:1.6;">
            Hey ${firstName},
          </p>
          <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.6;">
            It's Chris from Range Medical. I noticed you weren't able to make it to your free Hyperbaric Oxygen session — no worries at all, life happens.
          </p>
          <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.6;">
            I wanted to reach out because the offer is still on the table. We'd love to get you in for your free 60-minute HBOT session — it's a great way to see how hyperbaric oxygen can help with recovery, energy, inflammation, and more.
          </p>
          <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.6;">
            Tap below to pick a new time. All we need is a card on file to hold your spot (you're only charged $25 if you don't show without letting us know).
          </p>
        </td></tr>

        <tr><td align="center" style="padding:0 32px 28px;">
          <a href="${rebookUrl}" style="display:inline-block;background:#0891b2;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:16px 32px;border-radius:6px;letter-spacing:0.02em;">
            Rebook My Free Session
          </a>
        </td></tr>

        <tr><td style="padding:0 32px 32px;">
          <p style="font-size:14px;color:#6b7280;margin:0 0 4px;line-height:1.5;">
            If you have any questions, just reply to this email or text us at (949) 997-3988.
          </p>
          <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.5;">
            Looking forward to seeing you!
          </p>
          <p style="font-size:14px;color:#171717;margin:16px 0 0;font-weight:600;">
            Chris Cupp<br/>
            <span style="font-weight:400;color:#6b7280;">Range Medical</span>
          </p>
        </td></tr>

        <tr><td style="border-top:1px solid #e5e7eb;padding:20px 32px;background:#f9fafb;">
          <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">
            Range Medical · 1901 Westcliff Drive, Suite 10 · Newport Beach, CA 92660
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get all HBOT trial no-shows from appointments, joined with trial_passes for the token
    const { data: noShows, error: queryError } = await supabase
      .from('appointments')
      .select('id, patient_id, patient_name, start_time')
      .eq('status', 'no_show')
      .eq('service_name', 'Free Hyperbaric Oxygen Trial')
      .order('start_time', { ascending: false });

    if (queryError) throw queryError;

    // Exclude Melissa Gibney (existing patient, not a trial no-show)
    const filtered = noShows.filter(
      (a) => a.patient_name !== 'Melissa Gibney'
    );

    // Look up trial passes + patient emails for each no-show
    const results = [];
    const errors = [];

    for (const appt of filtered) {
      try {
        // Get trial pass for this patient
        const { data: trialPass } = await supabase
          .from('trial_passes')
          .select('id, first_name, email')
          .eq('patient_id', appt.patient_id)
          .eq('trial_type', 'hbot')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!trialPass || !trialPass.email) {
          // Fall back to patients table
          const { data: patient } = await supabase
            .from('patients')
            .select('id, first_name, email')
            .eq('id', appt.patient_id)
            .single();

          if (!patient?.email) {
            errors.push({ name: appt.patient_name, reason: 'No email found' });
            continue;
          }

          // No trial pass found — skip (can't generate rebook link without it)
          if (!trialPass) {
            errors.push({ name: appt.patient_name, reason: 'No trial pass found' });
            continue;
          }
        }

        const firstName = trialPass.first_name || appt.patient_name.split(' ')[0];
        const email = trialPass.email;
        const rebookUrl = `${BASE_URL}/hbot-trial/rebook?token=${trialPass.id}`;

        // Check if we already sent a rebook email to this person
        const { data: existing } = await supabase
          .from('comms_log')
          .select('id')
          .eq('recipient', email)
          .eq('message_type', 'hbot_rebook_email')
          .limit(1);

        if (existing && existing.length > 0) {
          results.push({ name: appt.patient_name, email, status: 'skipped_already_sent' });
          continue;
        }

        // Send email
        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: 'Chris Cupp - Range Medical <chris@range-medical.com>',
          to: email,
          subject: `${firstName}, your free HBOT session is still available`,
          html: buildEmailHtml(firstName, rebookUrl),
          reply_to: 'chris@range-medical.com',
        });

        if (emailError) {
          errors.push({ name: appt.patient_name, email, reason: emailError.message });
          continue;
        }

        // Log to comms_log
        await logComm({
          channel: 'email',
          messageType: 'hbot_rebook_email',
          message: `Rebook email sent with link: ${rebookUrl}`,
          source: 'hbot-trial/send-rebook-emails',
          patientId: appt.patient_id,
          patientName: appt.patient_name,
          recipient: email,
          subject: `${firstName}, your free HBOT session is still available`,
          status: 'sent',
          metadata: { resendId: emailResult?.id, appointmentId: appt.id },
        });

        results.push({ name: appt.patient_name, email, status: 'sent' });
      } catch (err) {
        errors.push({ name: appt.patient_name, reason: err.message });
      }
    }

    return res.status(200).json({
      total: filtered.length,
      sent: results.filter((r) => r.status === 'sent').length,
      skipped: results.filter((r) => r.status === 'skipped_already_sent').length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (err) {
    console.error('send-rebook-emails error:', err);
    return res.status(500).json({ error: 'Failed to send rebook emails' });
  }
}
