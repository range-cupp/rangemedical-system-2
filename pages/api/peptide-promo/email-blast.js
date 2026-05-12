// pages/api/peptide-promo/email-blast.js
// Peptide re-engagement email — targets March/April peptide purchasers
// who are NOT currently on an active peptide protocol.
// Protected by CRON_SECRET — trigger via: /api/peptide-promo/email-blast?secret=CRON_SECRET
// Dry run: /api/peptide-promo/email-blast?secret=CRON_SECRET&dry=true

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;

function buildEmailHtml(firstName, email) {
  const name = firstName || '';
  const greeting = name ? `Hey ${name},` : 'Hey,';
  const unsubUrl = `https://www.range-medical.com/api/unsubscribe?email=${encodeURIComponent(email)}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#000;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;letter-spacing:3px;">RANGE MEDICAL</h1>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <h2 style="margin:0 0 16px;font-size:22px;color:#111;font-weight:800;">Ready for Your Next Peptide Protocol?</h2>
          <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">${greeting} since you've done a peptide protocol with us before, we wanted to send over a quick offer:</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e0e0e0;border-radius:8px;margin:0 0 20px;">
            <tr>
              <td style="padding:16px 20px;font-size:16px;color:#111;font-weight:700;border-bottom:1px solid #eee;">Peptide Protocol Savings</td>
            </tr>
            <tr>
              <td style="padding:14px 20px;font-size:15px;color:#333;border-bottom:1px solid #eee;">
                <strong>$50 off</strong> &mdash; any 10-day protocol
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;font-size:15px;color:#333;border-bottom:1px solid #eee;">
                <strong>$75 off</strong> &mdash; any 20-day protocol
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;font-size:15px;color:#333;">
                <strong>$100 off</strong> &mdash; any 30-day protocol
              </td>
            </tr>
          </table>

          <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">Whether you're looking at BPC-157 for recovery, a GH blend for sleep and body comp, or something new &mdash; this applies to any peptide protocol on the menu.</p>

          <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7;">Just mention this email when you come in, or text us to get started.</p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="https://www.range-medical.com/peptide-therapy" style="display:inline-block;background:#000;color:#fff;padding:16px 40px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">VIEW PEPTIDE OPTIONS</a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#999;text-align:center;">Offer valid through June 30, 2026. One discount per protocol.</p>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#111;font-weight:600;">Range Medical</p>
          <p style="margin:0 0 4px;font-size:12px;color:#999;">1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660</p>
          <p style="margin:0 0 8px;font-size:12px;color:#999;">(949) 997-3988</p>
          <p style="margin:0;font-size:11px;"><a href="${unsubUrl}" style="color:#bbb;text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dryRun = req.query.dry === 'true';
  const limit = parseInt(req.query.limit) || 0;

  try {
    // 1. Get all peptide purchases from March and April 2026
    const { data: peptidePurchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('patient_id')
      .eq('category', 'peptide')
      .gte('created_at', '2026-03-01')
      .lt('created_at', '2026-05-01');

    if (purchaseError) {
      return res.status(500).json({ error: 'Failed to fetch purchases: ' + purchaseError.message });
    }

    const purchaserIds = [...new Set((peptidePurchases || []).map(p => p.patient_id).filter(Boolean))];

    if (purchaserIds.length === 0) {
      return res.status(200).json({ ok: true, message: 'No peptide purchasers found in March/April', total: 0 });
    }

    // 2. Get patients with active peptide protocols (to exclude)
    const { data: activeProtocols, error: protoError } = await supabase
      .from('protocols')
      .select('patient_id')
      .eq('type', 'peptide')
      .eq('status', 'active');

    if (protoError) {
      return res.status(500).json({ error: 'Failed to fetch protocols: ' + protoError.message });
    }

    const activePatientIds = new Set((activeProtocols || []).map(p => p.patient_id));

    // 3. Filter to purchasers WITHOUT an active peptide protocol
    const eligibleIds = purchaserIds.filter(id => !activePatientIds.has(id));

    if (eligibleIds.length === 0) {
      return res.status(200).json({
        ok: true,
        message: 'All March/April peptide purchasers have active protocols',
        total_purchasers: purchaserIds.length,
        with_active_protocol: activePatientIds.size,
        eligible: 0
      });
    }

    // 4. Get patient details for eligible patients
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, name, first_name, email, marketing_opt_out, email_opt_out')
      .in('id', eligibleIds);

    if (patientError) {
      return res.status(500).json({ error: 'Failed to fetch patients: ' + patientError.message });
    }

    // 5. Filter for valid emails and opt-in
    const eligible = (patients || []).filter(p => {
      const email = (p.email || '').trim();
      if (!email || !email.includes('@')) return false;
      if (p.marketing_opt_out || p.email_opt_out) return false;
      return true;
    });

    const toSend = limit > 0 ? eligible.slice(0, limit) : eligible;

    if (dryRun) {
      return res.status(200).json({
        dry_run: true,
        total_march_april_purchasers: purchaserIds.length,
        with_active_protocol: purchaserIds.length - eligibleIds.length,
        eligible_no_active_protocol: eligibleIds.length,
        after_opt_out_filter: eligible.length,
        would_send: toSend.length,
        sample: toSend.slice(0, 10).map(p => ({
          name: p.name,
          email: p.email,
        }))
      });
    }

    const stats = { sent: 0, failed: 0, errors: [] };
    const subject = 'Your Next Peptide Protocol — Save Up to $100';

    for (const patient of toSend) {
      try {
        const email = patient.email.trim().toLowerCase();
        const html = buildEmailHtml(patient.first_name, email);

        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Range Medical <noreply@range-medical.com>',
            to: email,
            subject,
            html,
          })
        });

        const result = await resp.json();

        if (resp.ok) {
          stats.sent++;
          await logComm({
            channel: 'email',
            messageType: 'peptide_promo_blast',
            message: 'Peptide re-engagement promo email',
            source: 'peptide-promo/email-blast',
            patientId: patient.id,
            patientName: patient.name,
            recipient: email,
            subject,
            status: 'sent',
            provider: 'resend',
          }).catch(() => {});
        } else {
          stats.failed++;
          stats.errors.push({ name: patient.name, error: result.message || JSON.stringify(result) });
        }

        await sleep(250);
      } catch (err) {
        stats.failed++;
        stats.errors.push({ name: patient.name, error: err.message });
      }
    }

    console.log(`Peptide promo blast complete: ${stats.sent} sent, ${stats.failed} failed out of ${toSend.length}`);

    return res.status(200).json({
      ok: true,
      total_march_april_purchasers: purchaserIds.length,
      excluded_active_protocol: purchaserIds.length - eligibleIds.length,
      eligible_after_opt_out: eligible.length,
      attempted: toSend.length,
      ...stats
    });

  } catch (error) {
    console.error('Peptide promo blast error:', error);
    return res.status(500).json({ error: error.message });
  }
}
