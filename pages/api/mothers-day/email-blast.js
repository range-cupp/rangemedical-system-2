// pages/api/mothers-day/email-blast.js
// Mother's Day Wellness Credit email blast
// Sends promo email to all patients with email addresses
// Protected by CRON_SECRET — trigger via: /api/mothers-day/email-blast?secret=CRON_SECRET
// Range Medical

import { createClient } from '@supabase/supabase-js';

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
          <h2 style="margin:0 0 16px;font-size:24px;color:#111;font-weight:800;">Mother's Day Wellness Credit</h2>
          <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">${greeting} quick Mother's Day note from Range Medical &mdash; we're doing something simple this weekend:</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e0e0e0;margin:0 0 20px;">
            <tr>
              <td style="padding:16px 20px;font-size:15px;color:#111;font-weight:700;border-bottom:1px solid #eee;">Pay $300, get $400 in Wellness Credit</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:14px;color:#666;">Good for any service &mdash; IVs, labs, red light, hyperbaric, hormones, weight loss, and more</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:14px;color:#666;">Valid for 12 months</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:14px;color:#666;">Max 2 per person</td>
            </tr>
          </table>

          <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7;">Gift it to Mom, or keep it for yourself &mdash; she raised you to make good decisions.</p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="https://www.range-medical.com/mothers-day" style="display:inline-block;background:#000;color:#fff;padding:16px 40px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">GET YOUR WELLNESS CREDIT</a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#999;text-align:center;">Ends Sunday night. Non-refundable.</p>
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
    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('id, name, first_name, email')
      .not('email', 'is', null)
      .neq('email', '')
      .eq('referral_source', 'Range Medical')
      .or('marketing_opt_out.is.null,marketing_opt_out.eq.false');

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    const eligible = (patients || []).filter(p => {
      const email = (p.email || '').trim();
      return email && email.includes('@');
    });

    const toSend = limit > 0 ? eligible.slice(0, limit) : eligible;

    if (dryRun) {
      return res.status(200).json({
        dry_run: true,
        total_patients_with_email: eligible.length,
        would_send: toSend.length,
        sample: toSend.slice(0, 5).map(p => ({
          name: p.name,
          email: p.email,
          subject: "Mother's Day Wellness Credit — Range Medical",
        }))
      });
    }

    const stats = { sent: 0, failed: 0, errors: [] };

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
            subject: "Mother's Day Wellness Credit — Range Medical",
            html,
          })
        });

        const result = await resp.json();

        if (resp.ok) {
          stats.sent++;
        } else {
          stats.failed++;
          stats.errors.push({ name: patient.name, error: result.message || JSON.stringify(result) });
        }

        // 100ms delay to stay within Resend rate limits
        await sleep(100);
      } catch (err) {
        stats.failed++;
        stats.errors.push({ name: patient.name, error: err.message });
      }
    }

    console.log(`Mother's Day email blast complete: ${stats.sent} sent, ${stats.failed} failed out of ${toSend.length}`);

    return res.status(200).json({
      ok: true,
      total_eligible: eligible.length,
      attempted: toSend.length,
      ...stats
    });

  } catch (error) {
    console.error("Mother's Day email blast error:", error);
    return res.status(500).json({ error: error.message });
  }
}
