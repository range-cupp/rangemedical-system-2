import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;

function buildHtml({ purchaserName, qty, totalPaid, totalCredit, codes, isGift, recipientName, sendType }) {
  const codeList = codes.map(c =>
    `<span style="display:inline-block;background:#f5f5f5;padding:8px 16px;font-family:monospace;font-size:18px;font-weight:700;letter-spacing:2px;border:1px solid #e0e0e0;margin:4px 0;">${c}</span>`
  ).join('<br/>');

  const giftInfo = isGift ? `
    <tr>
      <td style="padding:12px 16px;font-size:14px;color:#666;border-bottom:1px solid #f0f0f0;">Gift Recipient</td>
      <td style="padding:12px 16px;font-size:14px;color:#111;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">${recipientName}</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;font-size:14px;color:#666;border-bottom:1px solid #f0f0f0;">Delivery</td>
      <td style="padding:12px 16px;font-size:14px;color:#111;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">${sendType === 'scheduled' ? "Mother's Day morning (May 10)" : 'Sent immediately'}</td>
    </tr>` : '';

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
          <h2 style="margin:0 0 8px;font-size:22px;color:#111;font-weight:800;">Thank You, ${purchaserName}!</h2>
          <p style="margin:0 0 24px;font-size:15px;color:#666;line-height:1.6;">Your Mother's Day Wellness Credit order is confirmed.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;margin-bottom:24px;">
            <tr style="background:#fafafa;">
              <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:700;letter-spacing:2px;color:#999;text-transform:uppercase;border-bottom:1px solid #e0e0e0;">Order Summary</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:14px;color:#666;border-bottom:1px solid #f0f0f0;">Wellness Credit</td>
              <td style="padding:12px 16px;font-size:14px;color:#111;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">${qty} &times; $400</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:14px;color:#666;border-bottom:1px solid #f0f0f0;">Amount Paid</td>
              <td style="padding:12px 16px;font-size:14px;color:#111;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">$${totalPaid}</td>
            </tr>${giftInfo}
          </table>
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#999;text-transform:uppercase;">Your Code${codes.length > 1 ? 's' : ''}</p>
          <div style="margin:0 0 24px;text-align:center;">${codeList}</div>
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#999;text-transform:uppercase;">How to Use</p>
          <ul style="margin:0 0 24px;padding-left:18px;font-size:14px;color:#444;line-height:1.8;">
            <li>Present your code at any Range Medical visit</li>
            <li>Good for any service &mdash; IVs, labs, red light, hyperbaric, hormones, weight loss, and more</li>
            <li>Use across multiple visits until your balance reaches $0</li>
          </ul>
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#999;text-transform:uppercase;">Terms</p>
          <ul style="margin:0 0 24px;padding-left:18px;font-size:13px;color:#666;line-height:1.8;">
            <li>Valid for 12 months from purchase</li>
            <li>Non-refundable</li>
            <li>Cannot be used to purchase other gift cards</li>
          </ul>
          <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">Questions? Call or text <a href="tel:+19499973988" style="color:#111;font-weight:600;text-decoration:none;">(949) 997-3988</a></p>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#111;font-weight:600;">Range Medical</p>
          <p style="margin:0;font-size:12px;color:#999;">1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: promos, error } = await supabase
      .from('mothers_day_promos')
      .select('*, gift_cards!inner(code)')
      .order('created_at');

    if (error) return res.status(500).json({ error: error.message });

    const byPurchaser = {};
    for (const p of promos) {
      const key = p.purchaser_email;
      if (!byPurchaser[key]) {
        byPurchaser[key] = {
          purchaserName: p.purchaser_name,
          purchaserEmail: p.purchaser_email,
          codes: [],
          isGift: p.is_gift,
          recipientName: p.recipient_name,
          sendType: p.send_type,
          totalPaid: 0,
          totalCredit: 0,
          qty: 0,
        };
      }
      byPurchaser[key].codes.push(p.gift_cards.code);
      byPurchaser[key].totalPaid += p.amount_paid / 100;
      byPurchaser[key].totalCredit += p.credit_value / 100;
      byPurchaser[key].qty++;
      if (p.is_gift && p.recipient_name && !byPurchaser[key].recipientName.includes(p.recipient_name)) {
        byPurchaser[key].recipientName += ' & ' + p.recipient_name;
      }
    }

    const results = [];

    for (const [email, data] of Object.entries(byPurchaser)) {
      const html = buildHtml(data);
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Range Medical <noreply@range-medical.com>',
          to: email,
          subject: "Your Mother's Day Wellness Credit — Range Medical",
          html,
        }),
      });
      const result = await resp.json();
      results.push({ name: data.purchaserName, email, ok: resp.ok, id: result.id || null, error: result.message || null });
      await sleep(250);
    }

    return res.status(200).json({ ok: true, sent: results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
