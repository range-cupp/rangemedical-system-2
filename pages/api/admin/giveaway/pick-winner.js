// pages/api/admin/giveaway/pick-winner.js
// Picks a random non-winning entry for a given campaign_key, marks it as winner,
// and notifies the winner by SMS and email.
// POST body: { campaignKey?, onlyConsented?, dryRun? }

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendSMS, normalizePhone } from '../../../../lib/send-sms';
import { logComm } from '../../../../lib/comms-log';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_CAMPAIGN = 'cellular_reset_2026_04';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      campaignKey = DEFAULT_CAMPAIGN,
      onlyConsented = true,
      dryRun = false,
    } = req.body || {};

    // 1. Pull eligible entries (not already a winner, still 'new')
    let query = supabase
      .from('giveaway_entries')
      .select('*')
      .eq('campaign_key', campaignKey)
      .eq('is_winner', false)
      .in('status', ['new']);

    if (onlyConsented) {
      query = query.eq('consent_marketing', true);
    }

    const { data: pool, error: poolErr } = await query;

    if (poolErr) {
      console.error('pick-winner pool error:', poolErr);
      return res.status(500).json({ error: poolErr.message });
    }
    if (!pool || pool.length === 0) {
      return res.status(404).json({ error: 'No eligible entries found for this campaign.' });
    }

    // 2. Random selection
    const winner = pool[Math.floor(Math.random() * pool.length)];

    if (dryRun) {
      return res.status(200).json({ dryRun: true, poolSize: pool.length, candidate: winner });
    }

    // 3. Mark as winner
    const { error: updateErr } = await supabase
      .from('giveaway_entries')
      .update({ is_winner: true, status: 'winner_notified' })
      .eq('id', winner.id);

    if (updateErr) {
      console.error('pick-winner update error:', updateErr);
      return res.status(500).json({ error: updateErr.message });
    }

    const firstName = (winner.name || '').trim().split(/\s+/)[0] || 'there';

    // 4. Notify winner via SMS
    try {
      const normalized = normalizePhone(winner.phone);
      if (normalized) {
        const message = `${firstName}, this is Range Medical. You just won the 6-Week Cellular Energy Reset — 18 Hyperbaric Oxygen sessions + 18 Red Light sessions over 6 weeks, completely free. Congrats! Reply YES and we'll get you booked for your kickoff.\n\n- Range Medical`;
        const smsResult = await sendSMS({ to: normalized, message });

        await logComm({
          channel: 'sms',
          messageType: 'giveaway_winner_notification',
          message,
          source: 'giveaway-pick-winner',
          patientId: winner.patient_id,
          patientName: firstName,
          recipient: normalized,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          twilioMessageSid: smsResult.messageSid || null,
          provider: smsResult.provider || null,
        });
      }
    } catch (smsErr) {
      console.error('Winner SMS error:', smsErr);
    }

    // 5. Notify winner via email
    try {
      const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;">
        <tr><td style="padding:40px;border-left:4px solid #171717;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#16A34A;font-weight:700;">You won</p>
          <h1 style="margin:0 0 16px;font-size:28px;font-weight:900;line-height:1.1;color:#171717;">${firstName}, you won the 6-Week Cellular Energy Reset.</h1>
          <p style="font-size:15px;line-height:1.6;color:#404040;">You've been picked as the grand-prize winner. The full program is yours — 18 Hyperbaric Oxygen sessions and 18 Red Light Therapy sessions over 6 weeks. Zero cost.</p>
          <p style="font-size:15px;line-height:1.6;color:#404040;">Reply to the text we just sent you, or call <strong>(949) 997-3988</strong>, and we'll get your kickoff session on the calendar this week.</p>
          <p style="font-size:14px;line-height:1.6;color:#737373;margin-top:28px;">— The Range Medical team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

      await resend.emails.send({
        from: 'Range Medical <hello@range-medical.com>',
        to: winner.email,
        subject: `${firstName}, you won the 6-Week Cellular Energy Reset`,
        html,
      });
    } catch (emailErr) {
      console.error('Winner email error:', emailErr);
    }

    // 6. Staff notification
    try {
      await resend.emails.send({
        from: 'Range Medical <hello@range-medical.com>',
        to: ['chris@range-medical.com', 'damon@range-medical.com'],
        subject: `Giveaway winner picked: ${winner.name}`,
        html: `<p>Winner: <strong>${winner.name}</strong><br>Phone: ${winner.phone}<br>Email: ${winner.email}<br>Tier: ${winner.lead_tier}<br>Pool size: ${pool.length}</p><p>They've been notified by SMS + email. Queue up /api/admin/giveaway/send-scholarships next to blast the runners-up.</p>`,
      });
    } catch (e) {
      console.error('Staff winner notification error:', e);
    }

    return res.status(200).json({
      success: true,
      winner: { id: winner.id, name: winner.name, email: winner.email, phone: winner.phone },
      poolSize: pool.length,
    });
  } catch (err) {
    console.error('pick-winner error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
