// /pages/api/cron/energy-check-nurture.js
// Daily cron — sends nurture emails + SMS to Energy Check leads who haven't booked
// Schedule: 3:00 PM Pacific (0 15 * * *)
// Steps: 2 = day 1, 3 = day 3, 4 = day 7 (step 1 = immediate, handled in submit.js)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { isInQuietHours } from '../../../lib/quiet-hours';
import {
  getDay1EmailHtml,
  getDay3EmailHtml,
  getDay7EmailHtml,
  getDay1Sms,
  getDay3Sms,
  getDay7Sms,
} from '../../../lib/energy-check-emails';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Step config: { step, minHoursAfterCreation, emailFn, smsFn, subject }
const STEPS = [
  {
    step: 2,
    minHours: 22, // ~1 day
    emailFn: getDay1EmailHtml,
    smsFn: getDay1Sms,
    subject: ({ firstName }) => `What your Energy Check score means, ${firstName}`,
  },
  {
    step: 3,
    minHours: 70, // ~3 days
    emailFn: getDay3EmailHtml,
    smsFn: getDay3Sms,
    subject: () => 'This usually doesn\'t fix itself',
  },
  {
    step: 4,
    minHours: 166, // ~7 days
    emailFn: getDay7EmailHtml,
    smsFn: getDay7Sms,
    subject: ({ firstName }) => `Still feeling off, ${firstName}?`,
  },
];

export default async function handler(req, res) {
  // Auth
  const cronSecret = req.headers['x-cron-secret'];
  const authHeader = req.headers.authorization;
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const force = req.query.force === 'true';

  const isAuthorized = isVercelCron || force || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!force && isInQuietHours()) {
    return res.status(200).json({ skipped: true, reason: 'quiet hours' });
  }

  const results = { sent: [], skipped: [], errors: [] };

  try {
    // Get all leads that haven't booked and still have nurture steps left (step < 4)
    const { data: leads, error: queryErr } = await supabase
      .from('energy_check_leads')
      .select('id, first_name, email, phone, score, severity, door, nurture_step, consent_sms, created_at')
      .neq('status', 'booked')
      .lt('nurture_step', 4)
      .limit(100);

    if (queryErr) {
      console.error('Query error:', queryErr);
      return res.status(500).json({ error: queryErr.message });
    }

    if (!leads || leads.length === 0) {
      return res.status(200).json({ message: 'No leads to nurture', ...results });
    }

    const now = new Date();

    for (const lead of leads) {
      const createdAt = new Date(lead.created_at);
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
      const currentStep = lead.nurture_step || 1;

      // Find the next step this lead is eligible for
      const nextStep = STEPS.find(
        (s) => s.step === currentStep + 1 && hoursSinceCreation >= s.minHours
      );

      if (!nextStep) {
        results.skipped.push({ id: lead.id, reason: 'not eligible yet', currentStep, hours: Math.round(hoursSinceCreation) });
        continue;
      }

      const bookingUrl = `https://range-medical.com/start/energy?name=${encodeURIComponent(lead.first_name)}&from=energy-check`;

      const emailData = {
        firstName: lead.first_name,
        score: lead.score,
        severity: lead.severity,
        bookingUrl,
      };

      // Send email
      try {
        const emailHtml = nextStep.emailFn(emailData);
        const subject = nextStep.subject(emailData);

        await resend.emails.send({
          from: 'Range Medical <hello@range-medical.com>',
          to: lead.email,
          subject,
          html: emailHtml,
        });

        await logComm({
          channel: 'email',
          messageType: `energy_check_nurture_${nextStep.step}`,
          message: `Energy Check nurture step ${nextStep.step}`,
          source: 'energy-check-nurture',
          patientName: lead.first_name,
          recipient: lead.email,
          subject,
          status: 'sent',
        });
      } catch (emailErr) {
        console.error(`Email error for ${lead.id}:`, emailErr);
        results.errors.push({ id: lead.id, type: 'email', error: emailErr.message });
      }

      // Send SMS if consented
      if (lead.consent_sms && lead.phone) {
        try {
          const normalized = normalizePhone(lead.phone);
          if (normalized) {
            const smsText = nextStep.smsFn({ firstName: lead.first_name, bookingUrl });
            const smsResult = await sendSMS({ to: normalized, message: smsText });

            await logComm({
              channel: 'sms',
              messageType: `energy_check_nurture_sms_${nextStep.step}`,
              message: smsText,
              source: 'energy-check-nurture',
              patientName: lead.first_name,
              recipient: normalized,
              status: smsResult.success ? 'sent' : 'error',
              errorMessage: smsResult.error || null,
              twilioMessageSid: smsResult.messageSid || null,
              provider: smsResult.provider || null,
            });
          }
        } catch (smsErr) {
          console.error(`SMS error for ${lead.id}:`, smsErr);
          results.errors.push({ id: lead.id, type: 'sms', error: smsErr.message });
        }
      }

      // Update lead nurture step
      await supabase
        .from('energy_check_leads')
        .update({
          nurture_step: nextStep.step,
          last_nurture_at: now.toISOString(),
        })
        .eq('id', lead.id);

      results.sent.push({ id: lead.id, step: nextStep.step });
    }

    return res.status(200).json({
      message: `Processed ${leads.length} leads`,
      ...results,
    });
  } catch (err) {
    console.error('Energy check nurture cron error:', err);
    return res.status(500).json({ error: err.message });
  }
}
