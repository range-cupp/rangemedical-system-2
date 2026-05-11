// POST /api/lead-magnet/subscribe
// Receives { email } from ManyChat external request.
// Upserts into lead_magnet_subscribers, sends Email 1 immediately.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Chris Cupp <cupp@range-medical.com>';
const REPLY_TO = 'cupp@range-medical.com';

const EMAIL_1_SUBJECT = 'The methylene blue guide you asked for';
const EMAIL_1_BODY = `You commented BLUE on the reel. Here's the clinical guide I promised.

https://range-medical.com/range-medical-methylene-blue-guide.pdf

Most of what's online about methylene blue is wrong. This guide is for the people who actually want to do it right — mechanism, research, the drug interactions every wellness bro is leaving out, and what to do if you decide it's for you.

Over the next 10 days I'm going to send you four more emails. The first is the most useful thing I've ever written about my own methylene blue experience. The last one tells you what to do if you actually want help. The ones in between will save you from hurting yourself.

After that you'll get one short tip a day if you want to stay on the list — easy unsubscribe at any time.

— Chris
Head Janitor, Range Medical
Newport Beach, CA`;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function bodyToHtml(body) {
  const safe = escapeHtml(body);
  const linked = safe.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#1B4D8C;text-decoration:underline;">$1</a>'
  );
  const paragraphs = linked.split(/\n{2,}/).map(p =>
    `<p style="margin:0 0 16px 0;">${p.replace(/\n/g, '<br>')}</p>`
  );
  return paragraphs.join('\n');
}

function buildHtml(body, unsubLink) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:32px 16px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
        <tr><td style="font-size:16px;line-height:1.6;color:#1a1a1a;padding:0 4px;">
          ${bodyToHtml(body)}
        </td></tr>
        <tr><td style="padding:32px 4px 0;border-top:1px solid #e5e5e5;">
          <p style="font-size:11px;line-height:1.5;color:#999;margin:24px 0 4px 0;">
            Range Medical &middot; 1901 Westcliff Drive, Suite 10, Newport Beach, CA
          </p>
          <p style="font-size:11px;line-height:1.5;color:#999;margin:0;">
            <a href="${unsubLink}" style="color:#999;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const cleaned = email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from('lead_magnet_subscribers')
    .select('id, last_email_sent')
    .eq('email', cleaned)
    .eq('tag', 'methylene-blue-leadmag')
    .maybeSingle();

  if (existing && existing.last_email_sent >= 1) {
    return res.status(200).json({ ok: true, already_subscribed: true });
  }

  const { data: sub, error: upsertErr } = await supabase
    .from('lead_magnet_subscribers')
    .upsert(
      {
        email: cleaned,
        tag: 'methylene-blue-leadmag',
        subscribed_at: new Date().toISOString(),
        last_email_sent: 1,
        last_send_at: new Date().toISOString(),
      },
      { onConflict: 'email,tag' }
    )
    .select('id')
    .single();

  if (upsertErr) {
    console.error('[lead-magnet/subscribe] upsert error:', upsertErr);
    return res.status(500).json({ error: 'Database error' });
  }

  const unsubLink = `https://www.range-medical.com/api/lead-magnet/unsubscribe?id=${sub.id}`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: cleaned,
      replyTo: REPLY_TO,
      subject: EMAIL_1_SUBJECT,
      html: buildHtml(EMAIL_1_BODY, unsubLink),
      text: EMAIL_1_BODY + `\n\nUnsubscribe: ${unsubLink}`,
      headers: {
        'List-Unsubscribe': `<${unsubLink}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (result.error) {
      console.error('[lead-magnet/subscribe] Resend error:', result.error);
      return res.status(500).json({ error: 'Email send failed' });
    }

    return res.status(200).json({ ok: true, subscriber_id: sub.id });
  } catch (err) {
    console.error('[lead-magnet/subscribe] send error:', err.message);
    return res.status(500).json({ error: 'Email send failed' });
  }
}
