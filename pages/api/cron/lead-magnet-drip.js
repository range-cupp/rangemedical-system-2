// GET /api/cron/lead-magnet-drip
// Daily 7am Pacific — sends drip emails 2-5 to lead magnet subscribers
// based on days since subscription.
//
// Schedule: Email 2 = Day 2, Email 3 = Day 4, Email 4 = Day 7, Email 5 = Day 10
// Email 1 is sent immediately by /api/lead-magnet/subscribe.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Chris Cupp <cupp@range-medical.com>';
const REPLY_TO = 'cupp@range-medical.com';
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 100;

const DRIP_SCHEDULE = [
  { emailNum: 2, minDays: 2 },
  { emailNum: 3, minDays: 4 },
  { emailNum: 4, minDays: 7 },
  { emailNum: 5, minDays: 10 },
];

const EMAILS = {
  2: {
    subject: 'The morning I noticed it',
    body: `First morning I took methylene blue, I noticed two things.

One — my pee was an alarming shade of blue. Which the guide warned me about, so fine.

Two — by 9am my head was clearer than it had been in months. Not caffeinated-clear. Not pre-workout-clear. Just on.

I'll be honest, I was skeptical going in. The wellness-bro internet had been hyping methylene blue for six months and most of what I'd read sounded like the kind of breathless garbage that usually turns out to be 60% placebo and 40% supplement-company marketing.

But the research is real. The mechanism is real. And the felt experience the first day was real enough that I kept taking it.

Here's the honest caveat — it's not a miracle. I still sleep 7-8 hours. I still lift. I still eat clean. Methylene blue is a multiplier, not a magic bullet. If your sleep is wrecked and you eat like a college sophomore, no molecule is fixing that.

Tomorrow's email is about the part of the guide most people skip — the drug interactions — and why it matters even if you're not on an SSRI.

— Chris
Head Janitor, Range Medical
Newport Beach, CA

P.S. If you see a guy at Bandera with weirdly blue lips, that's just bad form. I take mine with water at home like a normal person.`,
  },

  3: {
    subject: 'The part of the guide most people skip',
    body: `Most people who downloaded the guide skipped the drug interaction section.

I get it. It's dense. It's the page with the table. It's the page that doesn't feel as fun as the mood-and-cognition page.

It's also the page that could keep you out of an ER.

Three real scenarios I think about constantly:

The guy on Lexapro who didn't mention it because "it's just a little antidepressant." Methylene blue plus an SSRI is one of the cleanest paths to serotonin syndrome in pharmacology. Real risk. Documented deaths.

The guy on low-dose tramadol for a knee from too much pickleball. Same mechanism. Same risk. He's not even thinking of his pain script as a "psychiatric" drug — but his serotonin system doesn't care what he calls it.

The guy on triptans for migraines who orders methylene blue off Amazon because the bottle was $19 and free shipping. He's stacking two serotonergic drugs and a contaminated source. That's a trifecta.

Every wellness brand selling methylene blue right now is either ignoring this or burying it in a disclaimer the size of a fortune-cookie message. That's not okay.

This is why a five-minute conversation with a real provider matters more than the molecule itself. Anyone can buy methylene blue. Almost nobody is screening for the right contraindications before they take it.

If you want someone to actually do this with you — not sell you a bottle and walk away — that's what Range is for. More on that Friday.

— Chris
Head Janitor, Range Medical
Newport Beach, CA`,
  },

  4: {
    subject: 'What to actually do about it',
    body: `You now have more clinical context on methylene blue than 95% of the guys ordering it online. Here's what you do with that.

The Range Assessment is a full-spectrum baseline reading of your body's systems with a provider who actually sits down and reads your labs with you. Not a portal email. Not a "your numbers look fine, see you next year." A real conversation.

What's included:

* Comprehensive lab panel — Total T, Free T, SHBG, estradiol, thyroid, A1c, fasting insulin
* G6PD screening before any methylene blue is recommended
* Full medication and supplement review — every prescription, every peptide, every random thing in your medicine cabinet
* One-on-one provider conversation
* Personalized recommendation — methylene blue is one option, not the only option

Cost: $350. Cash-pay, no insurance bullshit, no upsells.

If methylene blue isn't right for you, we tell you. We've turned plenty of guys away from it. That's the whole point.

Book the Range Assessment: https://range-medical.com/book-assessment

— Chris
Head Janitor, Range Medical
Newport Beach, CA

P.S. If you're in Orange County, 40+, and tired of figuring this out alone — this is what we're here for.`,
  },

  5: {
    subject: 'Last one',
    body: `This is the last email in the methylene blue sequence. Five emails over ten days. If you read the guide and made it through all five, you now know more about this molecule than most of the people selling it.

Two paths from here.

If you're ready to book — here's the link: https://range-medical.com/book-assessment

If you're not ready — you'll start getting my Daily Action Tip starting tomorrow. One short tip per morning. Health, hormones, recovery, training, sleep. Easy to unsubscribe at any time.

I don't do high-pressure sales. If you need to think about it for six months, think about it for six months. The labs will still be there. So will I.

— Chris
Head Janitor, Range Medical
Newport Beach, CA

P.S. If you ever want to talk and you're not ready to book yet, just reply to this email. It comes straight to me. I read everything.`,
  },
};

function isAuthorized(req) {
  if (req.headers['x-vercel-cron-signature']) return true;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  if (req.headers['authorization'] === `Bearer ${expected}`) return true;
  if (req.headers['x-cron-secret'] === expected) return true;
  if (req.query?.secret === expected) return true;
  return false;
}

function getPacificHour() {
  return parseInt(
    new Date().toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      hour12: false,
    }),
    10
  );
}

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

function daysSince(dateStr) {
  const subscribed = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - subscribed) / (1000 * 60 * 60 * 24));
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const force = req.query?.force === 'true';
  const ptHour = getPacificHour();
  if (!force && ptHour !== 7) {
    return res.status(200).json({
      skipped: true,
      reason: `Pacific hour is ${ptHour}, not 7 — waiting for the matching DST cron.`,
    });
  }

  const { data: subscribers, error: subErr } = await supabase
    .from('lead_magnet_subscribers')
    .select('id, email, subscribed_at, last_email_sent')
    .eq('tag', 'methylene-blue-leadmag')
    .eq('unsubscribed', false)
    .lt('last_email_sent', 5);

  if (subErr) {
    console.error('[cron/lead-magnet-drip] query error:', subErr);
    return res.status(500).json({ error: 'Query failed', detail: subErr.message });
  }

  if (!subscribers || subscribers.length === 0) {
    return res.status(200).json({ ok: true, eligible: 0, sent: 0 });
  }

  let sent = 0;
  let errors = 0;
  const errorSamples = [];

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (sub) => {
        const days = daysSince(sub.subscribed_at);
        let nextEmail = null;

        for (const step of DRIP_SCHEDULE) {
          if (sub.last_email_sent < step.emailNum && days >= step.minDays) {
            nextEmail = step.emailNum;
            break;
          }
        }

        if (!nextEmail) return null;

        const emailContent = EMAILS[nextEmail];
        const unsubLink = `https://www.range-medical.com/api/lead-magnet/unsubscribe?id=${sub.id}`;

        const result = await resend.emails.send({
          from: FROM,
          to: sub.email,
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
          throw new Error(result.error.message);
        }

        await supabase
          .from('lead_magnet_subscribers')
          .update({
            last_email_sent: nextEmail,
            last_send_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        return nextEmail;
      })
    );

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value !== null) {
        sent++;
      } else if (r.status === 'rejected') {
        errors++;
        if (errorSamples.length < 5) errorSamples.push(r.reason?.message || String(r.reason));
      }
    }

    if (i + BATCH_SIZE < subscribers.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  return res.status(200).json({
    ok: true,
    eligible: subscribers.length,
    sent,
    errors,
    errorSamples: errorSamples.length ? errorSamples : undefined,
  });
}
