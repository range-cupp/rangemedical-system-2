// /pages/api/cron/oxygen-daily.js
// Daily cron to send the next day's email in the 30-day oxygen series
// Runs at 9 AM UTC (~1-2 AM Pacific, emails land early morning)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getEmailForDay } from '../../../lib/oxygen-emails';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Verify cron authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch all active subscribers who haven't finished the series
    const { data: subscribers, error: fetchError } = await supabase
      .from('oxygen_subscribers')
      .select('*')
      .eq('status', 'active')
      .lt('current_day', 31);

    if (fetchError) {
      console.error('[oxygen-daily] Fetch error:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('[oxygen-daily] No active subscribers to process');
      return res.status(200).json({ sent: 0, message: 'No active subscribers' });
    }

    const results = [];

    for (const sub of subscribers) {
      // current_day is the last day they received — send current_day + 1
      const nextDay = sub.current_day + 1;

      // Skip if we don't have content for this day yet
      const emailData = getEmailForDay(nextDay, { firstName: sub.first_name });
      if (!emailData) {
        results.push({ email: sub.email, day: nextDay, status: 'skipped', reason: 'no template' });
        continue;
      }

      // Check subscriber has been subscribed for at least 1 day
      // (Day 1 is sent immediately on subscribe, so the cron only sends Day 2+)
      const subscribedAt = new Date(sub.subscribed_at);
      const now = new Date();
      const hoursElapsed = (now - subscribedAt) / (1000 * 60 * 60);

      // Must be at least 20 hours since last send (prevents double-sends)
      if (hoursElapsed < 20 && nextDay === 2) {
        results.push({ email: sub.email, day: nextDay, status: 'skipped', reason: 'too soon' });
        continue;
      }

      try {
        // Send the email
        await resend.emails.send({
          from: 'Chris Cupp <cupp@range-medical.com>',
          to: sub.email,
          subject: emailData.subject,
          html: emailData.html,
        });

        // Update current_day (or mark complete if day 30)
        const updates = { current_day: nextDay };
        if (nextDay >= 30) {
          updates.status = 'completed';
        }

        await supabase
          .from('oxygen_subscribers')
          .update(updates)
          .eq('id', sub.id);

        // Log to comms_log
        await logComm({
          channel: 'email',
          messageType: `oxygen_day_${nextDay}`,
          message: emailData.subject,
          source: 'cron/oxygen-daily',
          patientName: sub.first_name,
          recipient: sub.email,
          subject: emailData.subject,
        });

        results.push({ email: sub.email, day: nextDay, status: 'sent' });
        console.log(`[oxygen-daily] Day ${nextDay} sent to ${sub.first_name} <${sub.email}>`);
      } catch (sendError) {
        console.error(`[oxygen-daily] Failed for ${sub.email}:`, sendError);

        await logComm({
          channel: 'email',
          messageType: `oxygen_day_${nextDay}`,
          message: `Day ${nextDay} send failed`,
          source: 'cron/oxygen-daily',
          recipient: sub.email,
          patientName: sub.first_name,
          status: 'error',
          errorMessage: sendError.message,
        }).catch(() => {});

        results.push({ email: sub.email, day: nextDay, status: 'error', error: sendError.message });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const errors = results.filter(r => r.status === 'error').length;

    console.log(`[oxygen-daily] Done: ${sent} sent, ${skipped} skipped, ${errors} errors`);

    return res.status(200).json({ sent, skipped, errors, results });
  } catch (error) {
    console.error('[oxygen-daily] Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
