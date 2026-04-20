// pages/api/admin/giveaway/send-scholarships.js
// Sends the $1,000 scholarship offer SMS to all non-winner, consented entries
// in a given campaign that haven't been offered yet.
// Marks them: scholarship_offered_at = now(), scholarship_expires_at = +7 days, status = 'scholarship_offered'
// POST body: { campaignKey?, dryRun? }

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../../lib/send-sms';
import { logComm } from '../../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_CAMPAIGN = 'cellular_reset_2026_04';
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      campaignKey = DEFAULT_CAMPAIGN,
      dryRun = false,
    } = req.body || {};

    // Pull all consented non-winners that haven't been offered yet
    const { data: entries, error: fetchErr } = await supabase
      .from('giveaway_entries')
      .select('*')
      .eq('campaign_key', campaignKey)
      .eq('is_winner', false)
      .eq('consent_marketing', true)
      .is('scholarship_offered_at', null);

    if (fetchErr) {
      console.error('send-scholarships fetch error:', fetchErr);
      return res.status(500).json({ error: fetchErr.message });
    }

    if (!entries || entries.length === 0) {
      return res.status(200).json({ success: true, sent: 0, skipped: 0, message: 'No eligible entries to message.' });
    }

    if (dryRun) {
      return res.status(200).json({
        dryRun: true,
        eligibleCount: entries.length,
        sampleMessage: buildMessage((entries[0].name || '').split(/\s+/)[0] || 'there', entries[0].struggle_main),
      });
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
        source: 'giveaway-send-scholarships',
        patientId: entry.patient_id,
        patientName: firstName,
        recipient: normalized,
        status: smsResult.success ? 'sent' : 'error',
        errorMessage: smsResult.error || null,
        twilioMessageSid: smsResult.messageSid || null,
        provider: smsResult.provider || null,
      });
    }

    return res.status(200).json({
      success: true,
      totalEligible: entries.length,
      ...results,
    });
  } catch (err) {
    console.error('send-scholarships error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
