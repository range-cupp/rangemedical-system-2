// POST /api/lead-magnet/subscribe
// Receives { email, tag? } from ManyChat or landing page forms.
// Upserts into lead_magnet_subscribers, sends Email 1 immediately.
// Supports multiple lead magnets via tag field.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Chris Cupp <cupp@range-medical.com>';
const REPLY_TO = 'cupp@range-medical.com';

const DEFAULT_TAG = 'methylene-blue-leadmag';

const EMAIL_1_BY_TAG = {
  'methylene-blue-leadmag': {
    subject: 'The methylene blue guide you asked for',
    body: `You commented BLUE on the reel. Here's the clinical guide I promised.

https://range-medical.com/range-medical-methylene-blue-guide.pdf

Most of what's online about methylene blue is wrong. This guide is for the people who actually want to do it right — mechanism, research, the drug interactions every wellness bro is leaving out, and what to do if you decide it's for you.

Over the next 10 days I'm going to send you four more emails. The first is the most useful thing I've ever written about my own methylene blue experience. The last one tells you what to do if you actually want help. The ones in between will save you from hurting yourself.

After that you'll get one short tip a day if you want to stay on the list — easy unsubscribe at any time.

— Chris
Head Janitor, Range Medical
Newport Beach, CA`,
  },
  'bloodwork-leadmag': {
    subject: 'Your bloodwork guide is here',
    body: `Here's the guide.

https://www.range-medical.com/bloodwork-guide.pdf

A few things before you dig in:

This isn't a 60-page treatise. It's 10 pages. You can read it in 15 minutes. The point is to give you a checklist you can actually use — what to ask for, what to ignore, what "normal" actually means versus what you should be aiming for.

Over the next 10 days I'll send you four more emails. Not daily. Not constant. Just enough to make sure you actually do something with this instead of saving it to your downloads folder and forgetting about it like everyone does.

The next one is in two days. It's the story of how I figured out my own labs were lying to me at 40 — which is the whole reason this guide exists.

If you have a question while you're reading, hit reply. It comes to me.

— Chris
Head Janitor, Range Medical
Newport Beach, CA

Range Medical | https://www.range-medical.com/book-assessment
Reply to this email if you want to talk. It comes straight to me.`,
  },
};

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

  const { email, tag: reqTag } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const tag = reqTag && EMAIL_1_BY_TAG[reqTag] ? reqTag : DEFAULT_TAG;
  const cleaned = email.trim().toLowerCase();

  const { data: rpcResult, error: rpcErr } = await supabase
    .rpc('subscribe_lead_magnet', { p_email: cleaned, p_tag: tag });

  if (rpcErr) {
    console.error('[lead-magnet/subscribe] rpc error:', JSON.stringify(rpcErr));
    return res.status(500).json({ error: 'Database error' });
  }

  if (rpcResult.already_subscribed) {
    return res.status(200).json({ ok: true, already_subscribed: true });
  }

  const sub = { id: rpcResult.id };

  const emailContent = EMAIL_1_BY_TAG[tag];
  const unsubLink = `https://www.range-medical.com/api/lead-magnet/unsubscribe?id=${sub.id}`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: cleaned,
      replyTo: REPLY_TO,
      subject: emailContent.subject,
      html: buildHtml(emailContent.body, unsubLink),
      text: emailContent.body + `\n\nUnsubscribe: ${unsubLink}`,
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
