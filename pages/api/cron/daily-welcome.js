// GET /api/cron/daily-welcome
// Hourly cron — fires welcome emails 2 and 3 to subscribers whose
// welcome sequence is in progress.
//
// Logic:
//   - For each active subscriber where welcome_sequence_completed = false:
//     - If welcome_sequence_started_at is ≥24h ago AND step 2 not sent → send step 2
//     - If welcome_sequence_started_at is ≥48h ago AND step 3 not sent → send step 3, mark completed
//   - Honors quiet hours (no sends outside 8am-8pm Pacific) — pushes
//     send to next eligible hour.

import { createClient } from '@supabase/supabase-js';
import { sendWelcomeStep } from '../../../lib/daily-emails';
import { isInQuietHours } from '../../../lib/quiet-hours';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isAuthorized(req) {
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  if (isVercelCron) return true;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers['authorization'];
  if (auth === `Bearer ${expected}`) return true;
  if (req.headers['x-cron-secret'] === expected) return true;
  if (req.query?.secret === expected) return true;
  return false;
}

const HOUR_MS = 60 * 60 * 1000;
const MIN_STEP2_AGE_MS = 24 * HOUR_MS;
const MIN_STEP3_AGE_MS = 48 * HOUR_MS;

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const force = req.query?.force === 'true';
  if (!force && isInQuietHours()) {
    return res.status(200).json({ skipped: true, reason: 'Outside Pacific send window' });
  }

  const now = Date.now();
  const step2Cutoff = new Date(now - MIN_STEP2_AGE_MS).toISOString();

  // Pull every active in-progress subscriber whose started_at ≥24h ago.
  // (≥24h means at least due for step 2; we'll also handle ≥48h step 3.)
  const { data: candidates, error } = await supabase
    .from('daily_subscribers')
    .select('id, email, welcome_sequence_started_at')
    .eq('status', 'active')
    .eq('welcome_sequence_completed', false)
    .not('welcome_sequence_started_at', 'is', null)
    .lte('welcome_sequence_started_at', step2Cutoff)
    .limit(500);

  if (error) {
    console.error('[cron/daily-welcome] query error:', error);
    return res.status(500).json({ error: 'Query failed', detail: error.message });
  }

  if (!candidates || candidates.length === 0) {
    return res.status(200).json({ ok: true, considered: 0, sent: 0 });
  }

  // Pull all welcome-sequence sends for these subscribers in one shot.
  const ids = candidates.map((c) => c.id);
  const { data: sentRows } = await supabase
    .from('daily_sends')
    .select('subscriber_id, welcome_sequence_step')
    .in('subscriber_id', ids)
    .not('welcome_sequence_step', 'is', null);

  const sentMap = new Map(); // subscriberId -> Set of steps sent
  for (const row of sentRows || []) {
    if (!sentMap.has(row.subscriber_id)) sentMap.set(row.subscriber_id, new Set());
    sentMap.get(row.subscriber_id).add(row.welcome_sequence_step);
  }

  let sent = 0;
  let errors = 0;
  const log = [];

  for (const sub of candidates) {
    const startedAt = new Date(sub.welcome_sequence_started_at).getTime();
    const ageMs = now - startedAt;
    const stepsSent = sentMap.get(sub.id) || new Set();

    let stepToSend = null;
    if (ageMs >= MIN_STEP3_AGE_MS && !stepsSent.has(3)) {
      stepToSend = 3;
    } else if (ageMs >= MIN_STEP2_AGE_MS && !stepsSent.has(2)) {
      stepToSend = 2;
    }

    if (!stepToSend) continue;

    try {
      const { messageId } = await sendWelcomeStep({
        subscriberId: sub.id,
        email: sub.email,
        step: stepToSend,
      });

      await supabase.from('daily_sends').insert({
        subscriber_id: sub.id,
        welcome_sequence_step: stepToSend,
        resend_message_id: messageId,
      });

      const updates = { last_sent_at: new Date().toISOString() };
      if (stepToSend === 3) updates.welcome_sequence_completed = true;
      await supabase.from('daily_subscribers').update(updates).eq('id', sub.id);

      sent++;
      log.push({ email: sub.email, step: stepToSend });
    } catch (err) {
      errors++;
      console.error(`[cron/daily-welcome] send failed for ${sub.email} step ${stepToSend}:`, err.message);
    }

    // Rate limit: Resend default tier allows 10/sec. Sleep 100ms between.
    await new Promise((r) => setTimeout(r, 100));
  }

  return res.status(200).json({
    ok: true,
    considered: candidates.length,
    sent,
    errors,
    log,
  });
}
