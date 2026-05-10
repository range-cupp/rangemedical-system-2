// /pages/api/cron/hbot-drip.js
// Runs daily. Sends a 3-email drip to patients who completed a free HBOT
// session, offering exclusive 7-day membership pricing.
//
// Eligibility:
//   - appointment with service_category='hbot', service_name LIKE '%Free%',
//     status='completed', start_time within last 8 days
//   - patient has NOT purchased any HBOT membership/package since the session
//   - email not already sent (dedup via comms_log)
//
// Schedule: Day 1 (~22h), Day 3 (~70h), Day 7 (~166h) after session
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';
import { isInQuietHours } from '../../../lib/quiet-hours';
import {
  getEmail1Subject, getEmail1Html,
  getEmail2Subject, getEmail2Html,
  getEmail3Subject, getEmail3Html,
} from '../../../lib/hbot-drip-emails';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STEPS = [
  { step: 1, minHours: 22,  emailFn: getEmail1Html, subjectFn: getEmail1Subject },
  { step: 2, minHours: 70,  emailFn: getEmail2Html, subjectFn: getEmail2Subject },
  { step: 3, minHours: 166, emailFn: getEmail3Html, subjectFn: getEmail3Subject },
];

function formatExpiryDate(sessionDate) {
  const expiry = new Date(sessionDate);
  expiry.setDate(expiry.getDate() + 7);
  return expiry.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
}

export default async function handler(req, res) {
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

  if (isInQuietHours() && !force) {
    return res.status(200).json({ message: 'Quiet hours — skipping' });
  }

  const results = { sent: [], skipped: [], errors: [] };

  try {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

    const { data: appointments, error: queryErr } = await supabase
      .from('appointments')
      .select('id, patient_id, patient_name, patient_email, start_time')
      .eq('service_category', 'hbot')
      .eq('status', 'completed')
      .ilike('service_name', '%Free%')
      .gte('start_time', eightDaysAgo)
      .order('start_time', { ascending: false });

    if (queryErr) {
      console.error('HBOT drip query error:', queryErr);
      return res.status(500).json({ error: queryErr.message });
    }

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({ message: 'No completed free sessions to nurture', ...results });
    }

    // Deduplicate by patient_id (keep most recent session)
    const patientMap = new Map();
    for (const appt of appointments) {
      if (!appt.patient_email || !appt.patient_id) continue;
      if (!patientMap.has(appt.patient_id)) {
        patientMap.set(appt.patient_id, appt);
      }
    }

    const eligible = Array.from(patientMap.values());
    if (eligible.length === 0) {
      return res.status(200).json({ message: 'No eligible patients', ...results });
    }

    const patientIds = eligible.map(a => a.patient_id);

    // Check for conversions — patients who purchased HBOT after their free session
    const { data: hbotPurchases } = await supabase
      .from('purchases')
      .select('patient_id')
      .in('patient_id', patientIds)
      .gt('amount_paid', 0)
      .or('description.ilike.%hbot%,description.ilike.%hyperbaric%,item_name.ilike.%hbot%,item_name.ilike.%hyperbaric%');

    const convertedIds = new Set((hbotPurchases || []).map(p => p.patient_id));

    // Check comms_log for already-sent drip emails
    const { data: priorComms } = await supabase
      .from('comms_log')
      .select('patient_id, message_type')
      .in('patient_id', patientIds)
      .in('message_type', ['hbot_free_drip_1', 'hbot_free_drip_2', 'hbot_free_drip_3']);

    const sentSteps = new Map();
    for (const comm of (priorComms || [])) {
      const stepNum = parseInt(comm.message_type.replace('hbot_free_drip_', ''));
      const current = sentSteps.get(comm.patient_id) || 0;
      if (stepNum > current) sentSteps.set(comm.patient_id, stepNum);
    }

    const now = new Date();

    for (const appt of eligible) {
      if (convertedIds.has(appt.patient_id)) {
        results.skipped.push({ patientId: appt.patient_id, reason: 'converted' });
        continue;
      }

      const sessionTime = new Date(appt.start_time);
      const hoursSince = (now - sessionTime) / (1000 * 60 * 60);
      const highestSent = sentSteps.get(appt.patient_id) || 0;

      if (highestSent >= 3) {
        results.skipped.push({ patientId: appt.patient_id, reason: 'all_sent' });
        continue;
      }

      const nextStep = STEPS.find(
        (s) => s.step === highestSent + 1 && hoursSince >= s.minHours
      );

      if (!nextStep) {
        results.skipped.push({ patientId: appt.patient_id, highestSent, hours: Math.round(hoursSince) });
        continue;
      }

      const firstName = (appt.patient_name || '').split(' ')[0] || 'there';
      const expiryDate = formatExpiryDate(appt.start_time);

      try {
        const html = nextStep.emailFn({ firstName, expiryDate });
        const subject = nextStep.subjectFn({ firstName });

        await resend.emails.send({
          from: 'Range Medical <hello@range-medical.com>',
          replyTo: 'info@range-medical.com',
          to: appt.patient_email,
          subject,
          html,
        });

        await logComm({
          channel: 'email',
          messageType: `hbot_free_drip_${nextStep.step}`,
          message: `HBOT post-session drip email ${nextStep.step}`,
          source: 'cron/hbot-drip',
          patientId: appt.patient_id,
          patientName: appt.patient_name,
          recipient: appt.patient_email,
          subject,
          status: 'sent',
          direction: 'outbound',
        });

        results.sent.push({ patientId: appt.patient_id, step: nextStep.step });
      } catch (emailErr) {
        console.error(`HBOT drip email error for ${appt.patient_id}:`, emailErr);
        results.errors.push({ patientId: appt.patient_id, step: nextStep.step, error: emailErr.message });
      }
    }

    return res.status(200).json({ ...results, total: eligible.length });
  } catch (error) {
    console.error('HBOT drip error:', error);
    return res.status(500).json({ error: error.message });
  }
}
