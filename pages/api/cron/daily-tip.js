// GET /api/cron/daily-tip
// Daily 6am Pacific cron — sends today's queued tip to every active
// subscriber whose welcome sequence is complete.
//
// Runs at 13:07 UTC (= 6am PDT) and 14:07 UTC (= 6am PST). Only the
// run that's actually 6am PT does the work; the other returns early.
//
// If no tip is scheduled with status='approved' for today, sends an
// alert to cupp@range-medical.com and returns. (Better an angry email
// than a silent failure.)

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendDailyEmail } from '../../../lib/daily-emails';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 100;

function isAuthorized(req) {
  if (req.headers['x-vercel-cron-signature']) return true;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  if (req.headers['authorization'] === `Bearer ${expected}`) return true;
  if (req.headers['x-cron-secret'] === expected) return true;
  if (req.query?.secret === expected) return true;
  return false;
}

function getPacificHour() {
  return parseInt(
    new Date().toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      hour12: false,
    }),
    10
  );
}

function getTodayPacificDate() {
  // YYYY-MM-DD in Pacific time
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year').value;
  const m = parts.find((p) => p.type === 'month').value;
  const d = parts.find((p) => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

async function sendQueueEmptyAlert(today) {
  await resend.emails.send({
    from: 'Daily Tip System <cupp@range-medical.com>',
    to: 'cupp@range-medical.com',
    subject: `No daily tip scheduled for ${today}. Get to work.`,
    text: `Hey Chris,

The Daily Action Tip queue is empty for ${today}. Nothing went out this morning at 6am Pacific.

Open the queue, write something, hit approve. Or pull a backup tip out of the draft pile. Whatever — just don't let tomorrow be empty too.

Queue: https://www.range-medical.com/admin/daily/queue

— The system that runs your list
(and is judging you a little right now)
`,
  });
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const force = req.query?.force === 'true';
  const ptHour = getPacificHour();
  if (!force && ptHour !== 6) {
    return res.status(200).json({
      skipped: true,
      reason: `Pacific hour is ${ptHour}, not 6 — waiting for the matching DST cron.`,
    });
  }

  const today = getTodayPacificDate();

  // Find today's approved tip.
  const { data: tips, error: tipErr } = await supabase
    .from('daily_tips')
    .select('id, subject, body, status')
    .eq('scheduled_for', today)
    .eq('status', 'approved')
    .limit(2);

  if (tipErr) {
    console.error('[cron/daily-tip] tip query error:', tipErr);
    return res.status(500).json({ error: 'Tip query failed', detail: tipErr.message });
  }

  if (!tips || tips.length === 0) {
    try {
      await sendQueueEmptyAlert(today);
    } catch (alertErr) {
      console.error('[cron/daily-tip] queue-empty alert send failed:', alertErr.message);
    }
    return res.status(200).json({ ok: true, queue_empty: true, date: today });
  }

  if (tips.length > 1) {
    // More than one approved tip for the same date — pick the first but log.
    console.warn(`[cron/daily-tip] multiple approved tips for ${today}; using ${tips[0].id}`);
  }

  const tip = tips[0];

  // Pull all eligible subscribers.
  const { data: subscribers, error: subErr } = await supabase
    .from('daily_subscribers')
    .select('id, email')
    .eq('status', 'active')
    .eq('welcome_sequence_completed', true);

  if (subErr) {
    console.error('[cron/daily-tip] subscriber query error:', subErr);
    return res.status(500).json({ error: 'Subscriber query failed', detail: subErr.message });
  }

  // Defensive: drop anyone on the permanent suppression list.
  const { data: suppressed } = await supabase
    .from('daily_unsubscribes')
    .select('email');
  const suppressedSet = new Set((suppressed || []).map((r) => r.email.toLowerCase()));
  const eligible = (subscribers || []).filter(
    (s) => !suppressedSet.has(s.email.toLowerCase())
  );

  if (eligible.length === 0) {
    // No one to send to — still mark the tip sent so we don't re-process tomorrow.
    await supabase
      .from('daily_tips')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', tip.id);
    return res.status(200).json({
      ok: true,
      tip_id: tip.id,
      eligible: 0,
      sent: 0,
      note: 'No eligible subscribers',
    });
  }

  let sent = 0;
  let errors = 0;
  const errorList = [];

  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const batch = eligible.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (sub) => {
        const { messageId } = await sendDailyEmail({
          to: sub.email,
          subject: tip.subject,
          body: tip.body,
          subscriberId: sub.id,
        });
        return { sub, messageId };
      })
    );

    const sendRows = [];
    const subscriberUpdates = [];

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === 'fulfilled') {
        sent++;
        sendRows.push({
          subscriber_id: r.value.sub.id,
          tip_id: tip.id,
          resend_message_id: r.value.messageId,
        });
        subscriberUpdates.push(r.value.sub.id);
      } else {
        errors++;
        const sub = batch[j];
        errorList.push({ email: sub.email, error: r.reason?.message || String(r.reason) });
        console.error(`[cron/daily-tip] send failed for ${sub.email}:`, r.reason?.message || r.reason);
      }
    }

    if (sendRows.length > 0) {
      await supabase.from('daily_sends').insert(sendRows);
      await supabase
        .from('daily_subscribers')
        .update({ last_sent_at: new Date().toISOString() })
        .in('id', subscriberUpdates);
    }

    if (i + BATCH_SIZE < eligible.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  // Mark the tip as sent so the next cron run skips it.
  await supabase
    .from('daily_tips')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', tip.id);

  return res.status(200).json({
    ok: true,
    tip_id: tip.id,
    subject: tip.subject,
    eligible: eligible.length,
    sent,
    errors,
    errorSamples: errorList.slice(0, 5),
  });
}
