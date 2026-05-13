// pages/api/cron/hbot-form-email-backfill.js
// One-time backfill: sends forms (intake, HIPAA, HBOT consent) via EMAIL
// to upcoming HBOT sessions that missed their SMS form links.
// Idempotent — safe to re-run (skips patients who already received form emails).
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { createFormBundle, FORM_DEFINITIONS } from '../../../lib/form-bundles';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

function isAuthorized(req) {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  return isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );
}

function generateFormsEmailHtml({ firstName, forms, bundleUrl }) {
  const formListHtml = forms.map(f => `
    <tr>
      <td style="padding: 6px 0; color: #404040; font-size: 14px;">
        &bull; ${f.name} <span style="color: #999;">(${f.time})</span>
      </td>
    </tr>
  `).join('');

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
                        <td style="background-color: #000000; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.1em;">RANGE MEDICAL</h1>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Forms to Complete</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Please complete the following form${forms.length > 1 ? 's' : ''} before your Hyperbaric Oxygen Therapy session at Range Medical:</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
                                <tr>
                                    <td style="padding: 0;">
                                        <a href="${bundleUrl}" style="display: inline-block; padding: 16px 40px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 700; letter-spacing: 0.05em;">
                                            Complete Your Forms
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 24px; width: 100%;">
                                ${formListHtml}
                            </table>
                            <p style="margin: 0 0 8px; color: #666; font-size: 13px; line-height: 1.6;">Your information carries forward between forms so you only need to enter it once.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 30px; border-top: 1px solid #e5e5e5; background-color: #fafafa;">
                            <p style="margin: 0; color: #888; font-size: 13px; text-align: center; line-height: 1.6;">
                                Questions? Call or text us at <strong>(949) 997-3988</strong>
                            </p>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 12px; text-align: center;">Range Medical &#8226; Newport Beach, CA</p>
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
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: trials, error } = await supabase
      .from('trial_passes')
      .select('id, patient_id, first_name, last_name, email, phone, trial_type')
      .eq('trial_type', 'hbot')
      .eq('status', 'scheduled')
      .gte('scheduled_start_time', new Date().toISOString())
      .not('email', 'is', null);

    if (error) {
      console.error('hbot-form-email-backfill query error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!trials || trials.length === 0) {
      return res.status(200).json({ success: true, considered: 0, sent: 0, message: 'No eligible sessions' });
    }

    let sent = 0;
    let skipped = 0;
    const results = [];

    for (const trial of trials) {
      // Skip if form email already sent for this patient
      const { data: priorEmails } = await supabase
        .from('comms_log')
        .select('id')
        .eq('patient_id', trial.patient_id)
        .eq('channel', 'email')
        .eq('message_type', 'form_links')
        .in('source', ['hbot-form-email-backfill', 'send-forms-email'])
        .limit(1);

      if (priorEmails && priorEmails.length > 0) {
        results.push({ trialId: trial.id, name: `${trial.first_name} ${trial.last_name}`, skipped: 'email_already_sent' });
        skipped++;
        continue;
      }

      // Check which forms are already completed
      const requiredFormIds = ['intake', 'hipaa', 'hbot'];
      const completedFormIds = new Set();

      if (trial.patient_id) {
        const [{ data: consents }, { data: intakes }] = await Promise.all([
          supabase.from('consents').select('consent_type').eq('patient_id', trial.patient_id).in('consent_type', ['hipaa', 'hbot']),
          supabase.from('intakes').select('id').eq('patient_id', trial.patient_id).limit(1),
        ]);
        if (consents) consents.forEach(c => completedFormIds.add(c.consent_type));
        if (intakes && intakes.length > 0) completedFormIds.add('intake');
      }

      const missingFormIds = requiredFormIds.filter(id => !completedFormIds.has(id));

      if (missingFormIds.length === 0) {
        results.push({ trialId: trial.id, name: `${trial.first_name} ${trial.last_name}`, skipped: 'all_forms_complete' });
        skipped++;
        continue;
      }

      try {
        const customerName = `${trial.first_name || ''} ${trial.last_name || ''}`.trim();
        const firstName = trial.first_name || 'there';

        const bundle = await createFormBundle({
          formIds: missingFormIds,
          patientId: trial.patient_id || null,
          patientName: customerName,
          patientEmail: trial.email,
          patientPhone: trial.phone || null,
          metadata: { source: 'hbot_form_email_backfill', trialPassId: trial.id },
        });

        const validForms = missingFormIds.map(id => ({ ...FORM_DEFINITIONS[id], id }));
        const formNames = validForms.map(f => f.name).join(', ');

        const subject = validForms.length === 1
          ? `Please complete your ${validForms[0].name} — Range Medical`
          : 'Forms to complete before your visit — Range Medical';

        const html = generateFormsEmailHtml({
          firstName,
          forms: validForms,
          bundleUrl: bundle.url,
        });

        const { error: sendError } = await resend.emails.send({
          from: 'Range Medical <noreply@range-medical.com>',
          to: trial.email,
          subject,
          html,
        });

        if (sendError) {
          console.error(`Email send error for ${trial.email}:`, sendError);
          results.push({ trialId: trial.id, name: customerName, error: sendError.message });
          continue;
        }

        await logComm({
          channel: 'email',
          messageType: 'form_links',
          message: `Forms sent via email: ${formNames} (bundle: ${bundle.token})`,
          source: 'hbot-form-email-backfill',
          patientId: trial.patient_id,
          patientName: customerName,
          recipient: trial.email,
          subject,
          direction: 'outbound',
          htmlBody: html,
        });

        sent++;
        results.push({ trialId: trial.id, name: customerName, email: trial.email, sent: true, forms: missingFormIds });
        console.log(`Form email sent to trial ${trial.id?.slice(0, 8)}: ${formNames}`);
      } catch (sendErr) {
        console.error(`hbot-form-email-backfill send error for trial ${trial.id}:`, sendErr);
        results.push({ trialId: trial.id, name: `${trial.first_name} ${trial.last_name}`, error: sendErr.message });
      }
    }

    return res.status(200).json({ success: true, considered: trials.length, sent, skipped, results });
  } catch (err) {
    console.error('hbot-form-email-backfill error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
