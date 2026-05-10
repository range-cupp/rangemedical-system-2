import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';
import {
  getDay1Subject, getDay1Html,
  getDay3Subject, getDay3Html,
  getDay7Subject, getDay7Html,
} from '../../../lib/quiz-drip-emails';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STEPS = [
  { step: 2, minHours: 22,  emailFn: getDay1Html, subjectFn: getDay1Subject },
  { step: 3, minHours: 70,  emailFn: getDay3Html, subjectFn: getDay3Subject },
  { step: 4, minHours: 166, emailFn: getDay7Html, subjectFn: getDay7Subject },
];

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

  const results = { sent: [], skipped: [], errors: [] };

  try {
    const { data: leads, error: queryErr } = await supabase
      .from('quiz_leads')
      .select('id, first_name, email, path, answers, nurture_step, created_at')
      .neq('status', 'converted')
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
      const hoursSince = (now - createdAt) / (1000 * 60 * 60);
      const currentStep = lead.nurture_step || 1;

      const nextStep = STEPS.find(
        (s) => s.step === currentStep + 1 && hoursSince >= s.minHours
      );

      if (!nextStep) {
        results.skipped.push({ id: lead.id, currentStep, hours: Math.round(hoursSince) });
        continue;
      }

      const bookingUrl = `https://app.range-medical.com/book-assessment?firstName=${encodeURIComponent(lead.first_name)}&email=${encodeURIComponent(lead.email)}`;

      const emailData = {
        firstName: lead.first_name,
        path: lead.path,
        bookingUrl,
      };

      try {
        const html = nextStep.emailFn(emailData);
        const subject = nextStep.subjectFn(emailData);

        await resend.emails.send({
          from: 'Range Medical <hello@range-medical.com>',
          replyTo: 'info@range-medical.com',
          to: lead.email,
          subject,
          html,
        });

        await supabase
          .from('quiz_leads')
          .update({ nurture_step: nextStep.step, updated_at: new Date().toISOString() })
          .eq('id', lead.id);

        await logComm({
          channel: 'email',
          messageType: `quiz_drip_${nextStep.step}`,
          message: `Quiz drip email step ${nextStep.step}`,
          source: 'cron/quiz-drip',
          patientName: lead.first_name,
          recipient: lead.email,
          subject,
          status: 'sent',
          direction: 'outbound',
        });

        results.sent.push({ id: lead.id, step: nextStep.step });
      } catch (emailErr) {
        console.error(`Email error for ${lead.id}:`, emailErr);
        results.errors.push({ id: lead.id, step: nextStep.step, error: emailErr.message });
      }
    }

    return res.status(200).json({ ...results, total: leads.length });
  } catch (error) {
    console.error('Quiz drip error:', error);
    return res.status(500).json({ error: error.message });
  }
}
