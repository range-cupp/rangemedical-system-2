import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;

function giftCardEmailHtml({ purchaserName, recipientName, code, expiresAt }) {
  const expDate = new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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
          <h2 style="margin:0 0 8px;font-size:22px;color:#111;font-weight:800;">Happy Mother's Day!</h2>
          <p style="margin:0 0 24px;font-size:15px;color:#666;line-height:1.6;">Someone special wants you to feel your best.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;margin:0 0 24px;">
            <tr><td style="padding:32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;color:#808080;letter-spacing:2px;text-transform:uppercase;">Mother's Day</p>
              <h2 style="margin:0 0 16px;font-size:24px;color:#fff;font-weight:900;letter-spacing:1px;">WELLNESS CREDIT</h2>
              <p style="margin:0 0 20px;font-size:42px;color:#fff;font-weight:900;">$400</p>
              <table width="80%" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#808080;">To</td>
                  <td style="padding:6px 0;font-size:13px;color:#fff;text-align:right;font-weight:600;">${recipientName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#808080;">From</td>
                  <td style="padding:6px 0;font-size:13px;color:#fff;text-align:right;font-weight:600;">${purchaserName}</td>
                </tr>
              </table>
              <div style="margin:20px auto;padding:14px 20px;background:rgba(255,255,255,0.08);border-radius:4px;display:inline-block;">
                <p style="margin:0 0 4px;font-size:10px;color:#808080;letter-spacing:1px;text-transform:uppercase;">Your Code</p>
                <p style="margin:0;font-size:22px;color:#fff;font-weight:700;letter-spacing:3px;font-family:monospace;">${code}</p>
              </div>
              <p style="margin:12px 0 0;font-size:12px;color:#606060;">Valid through ${expDate}</p>
            </td></tr>
          </table>

          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Your $400 wellness credit is good for any Range Medical service &mdash; IV therapy, red light therapy, hyperbaric oxygen, labs, peptides, hormone therapy, weight loss, and more.</p>

          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#999;text-transform:uppercase;">How to Use</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:10px 0;font-size:14px;color:#444;line-height:1.6;border-bottom:1px solid #f0f0f0;">
                <span style="display:inline-block;width:24px;height:24px;background:#1a1a1a;color:#808080;font-size:12px;font-weight:700;text-align:center;line-height:24px;margin-right:10px;vertical-align:middle;">1</span>
                Call or text <strong>(949) 997-3988</strong> to schedule
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-size:14px;color:#444;line-height:1.6;border-bottom:1px solid #f0f0f0;">
                <span style="display:inline-block;width:24px;height:24px;background:#1a1a1a;color:#808080;font-size:12px;font-weight:700;text-align:center;line-height:24px;margin-right:10px;vertical-align:middle;">2</span>
                Mention your gift code when you arrive
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-size:14px;color:#444;line-height:1.6;">
                <span style="display:inline-block;width:24px;height:24px;background:#1a1a1a;color:#808080;font-size:12px;font-weight:700;text-align:center;line-height:24px;margin-right:10px;vertical-align:middle;">3</span>
                Your credit is applied automatically
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="tel:+19499973988" style="display:inline-block;background:#000;color:#fff;padding:14px 40px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:1px;">SCHEDULE YOUR FIRST VISIT</a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:14px;color:#666;line-height:1.6;text-align:center;">We can't wait to take care of you.</p>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#111;font-weight:600;">Range Medical</p>
          <p style="margin:0 0 4px;font-size:12px;color:#999;">1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660</p>
          <p style="margin:0;font-size:11px;color:#bbb;">Credit valid 12 months from purchase. Non-refundable.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dryRun = req.query.dry === 'true';

  try {
    const { data: pending, error: fetchError } = await supabase
      .from('mothers_day_promos')
      .select('id, purchaser_name, recipient_name, recipient_email, gift_card_id, scheduled_send_at')
      .eq('is_gift', true)
      .eq('gift_sent', false);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!pending || pending.length === 0) {
      return res.status(200).json({ ok: true, message: 'No pending gift deliveries.' });
    }

    if (dryRun) {
      return res.status(200).json({
        dry_run: true,
        pending: pending.map(p => ({
          recipient: p.recipient_name,
          email: p.recipient_email,
          from: p.purchaser_name,
        }))
      });
    }

    const stats = { sent: 0, failed: 0, errors: [] };

    for (const promo of pending) {
      try {
        const { data: card } = await supabase
          .from('gift_cards')
          .select('code, created_at')
          .eq('id', promo.gift_card_id)
          .single();

        if (!card) {
          stats.failed++;
          stats.errors.push({ name: promo.recipient_name, error: 'Gift card not found' });
          continue;
        }

        const expiresAt = new Date(card.created_at);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        const html = giftCardEmailHtml({
          purchaserName: promo.purchaser_name,
          recipientName: promo.recipient_name,
          code: card.code,
          expiresAt: expiresAt.toISOString(),
        });

        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Range Medical <noreply@range-medical.com>',
            to: promo.recipient_email,
            subject: `You've Received a Mother's Day Wellness Gift from ${promo.purchaser_name}`,
            html,
          })
        });

        const result = await resp.json();

        if (resp.ok) {
          stats.sent++;

          await supabase
            .from('mothers_day_promos')
            .update({ gift_sent: true, gift_sent_at: new Date().toISOString() })
            .eq('id', promo.id);

          const { data: recipientPatient } = await supabase
            .from('patients')
            .select('id')
            .ilike('email', promo.recipient_email)
            .maybeSingle();

          await logComm({
            channel: 'email',
            messageType: 'mothers_day_gift_delivery',
            message: `Mother's Day gift card delivered — $400 wellness credit (code: ${card.code}) from ${promo.purchaser_name}`,
            source: 'mothers-day/send-scheduled-gifts',
            patientId: recipientPatient?.id || null,
            patientName: promo.recipient_name,
            recipient: promo.recipient_email,
            subject: `You've Received a Mother's Day Wellness Gift from ${promo.purchaser_name}`,
            status: 'sent',
            provider: 'resend',
          }).catch(() => {});
        } else {
          stats.failed++;
          stats.errors.push({ name: promo.recipient_name, error: result.message || JSON.stringify(result) });
        }
      } catch (err) {
        stats.failed++;
        stats.errors.push({ name: promo.recipient_name, error: err.message });
      }
    }

    return res.status(200).json({ ok: true, ...stats });
  } catch (error) {
    console.error('Send scheduled gifts error:', error);
    return res.status(500).json({ error: error.message });
  }
}
