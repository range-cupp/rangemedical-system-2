// lib/giveaway-scholarships.js
// Shared logic for sending the $1,000 scholarship SMS to non-winner entries.
// Used by both /api/admin/giveaway/send-scholarships (manual) and
// /api/cron/giveaway-scholarships (automated Saturday 11 AM blast).

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from './send-sms';
import { logComm } from './comms-log';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const STRUGGLE_SHORT = {
  energy: 'energy',
  brain_fog: 'focus',
  recovery: 'recovery',
  weight_loss: 'weight-loss goals',
  other: 'results',
};

function buildMessage(firstName, struggleMain) {
  const topic = STRUGGLE_SHORT[struggleMain] || 'results';
  return `${firstName}, Range Medical here. Bad news: we picked the winner of the 6-Week Cellular Energy Reset and it wasn't you. Good news: we set aside a $1,000 scholarship on the same program if you still want to fix your ${topic} over the next 6 weeks — $2,999 → $1,999. Giveaway entrants only, expires in 7 days. Reply YES for details.`;
}

/**
 * Send scholarship SMS to all eligible non-winner entries in a campaign.
 *
 * @param {Object} opts
 * @param {string} opts.campaignKey - Campaign identifier
 * @param {boolean} [opts.requireWinner] - If true, refuse to send unless a winner exists (cron safety)
 * @param {boolean} [opts.dryRun] - If true, returns counts without sending
 * @returns {Promise<{success, sent, failed, skipped, totalEligible, failures, error?, winner?}>}
 */
export async function sendScholarshipBlast({ campaignKey, requireWinner = false, dryRun = false }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Safety: check for a winner before sending
  let winner = null;
  const { data: winnerRow } = await supabase
    .from('giveaway_entries')
    .select('id, name, phone, email')
    .eq('campaign_key', campaignKey)
    .eq('is_winner', true)
    .maybeSingle();

  winner = winnerRow || null;

  if (requireWinner && !winner) {
    return {
      success: false,
      error: 'No winner picked yet — refusing to send scholarship blast',
      sent: 0,
      failed: 0,
      skipped: 0,
      totalEligible: 0,
      failures: [],
      winner: null,
    };
  }

  const { data: entries, error: fetchErr } = await supabase
    .from('giveaway_entries')
    .select('*')
    .eq('campaign_key', campaignKey)
    .eq('is_winner', false)
    .eq('consent_marketing', true)
    .is('scholarship_offered_at', null);

  if (fetchErr) {
    console.error('scholarship fetch error:', fetchErr);
    return { success: false, error: fetchErr.message, sent: 0, failed: 0, skipped: 0, totalEligible: 0, failures: [], winner };
  }

  if (!entries || entries.length === 0) {
    return {
      success: true,
      sent: 0,
      failed: 0,
      skipped: 0,
      totalEligible: 0,
      failures: [],
      message: 'No eligible entries to message.',
      winner,
    };
  }

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      totalEligible: entries.length,
      sampleMessage: buildMessage((entries[0].name || '').split(/\s+/)[0] || 'there', entries[0].struggle_main),
      sent: 0,
      failed: 0,
      skipped: 0,
      failures: [],
      winner,
    };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SEVEN_DAYS_MS);
  const results = { sent: 0, failed: 0, skipped: 0, failures: [] };

  for (const entry of entries) {
    const firstName = (entry.name || '').trim().split(/\s+/)[0] || 'there';
    const normalized = normalizePhone(entry.phone);
    if (!normalized) {
      results.skipped += 1;
      continue;
    }

    const message = buildMessage(firstName, entry.struggle_main);

    let smsResult;
    try {
      smsResult = await sendSMS({ to: normalized, message });
    } catch (e) {
      smsResult = { success: false, error: e.message };
    }

    if (smsResult.success) {
      results.sent += 1;
      await supabase
        .from('giveaway_entries')
        .update({
          scholarship_offered_at: now.toISOString(),
          scholarship_expires_at: expiresAt.toISOString(),
          status: 'scholarship_offered',
        })
        .eq('id', entry.id);
    } else {
      results.failed += 1;
      results.failures.push({ id: entry.id, phone: entry.phone, error: smsResult.error });
    }

    await logComm({
      channel: 'sms',
      messageType: 'giveaway_scholarship_offer',
      message,
      source: 'giveaway-scholarships',
      patientId: entry.patient_id,
      patientName: firstName,
      recipient: normalized,
      status: smsResult.success ? 'sent' : 'error',
      errorMessage: smsResult.error || null,
      twilioMessageSid: smsResult.messageSid || null,
      provider: smsResult.provider || null,
    });
  }

  return {
    success: true,
    totalEligible: entries.length,
    ...results,
    winner,
  };
}
