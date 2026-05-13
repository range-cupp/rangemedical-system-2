// TEMPORARY — send all 5 bloodwork drip emails to a single address for preview.
// Delete after use.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Chris Cupp <cupp@range-medical.com>';
const REPLY_TO = 'cupp@range-medical.com';

const EMAILS = [
  {
    subject: '[1/5] Your bloodwork guide is here',
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
  {
    subject: '[2/5] I was "normal" for ten years and felt like garbage',
    body: `I was 40. Two hundred and sixty pounds. My back hurt. I was up three times a night. I'd been told by my PCP for a decade that my labs were "fine."

He wasn't wrong, by his standards. Cholesterol borderline but no statin yet. Glucose 96. Testosterone 410. A1c 5.7. All technically inside the lines.

I felt like shit.

The thing that broke it open was getting my own bloodwork run privately, off insurance. Total T was 410 — "normal." Free T was at the bottom of range. SHBG was elevated. Estradiol was 38 pg/mL — fine if you don't measure it, problematic if you do. Fasting insulin was 14 uIU/mL. HOMA-IR was 3.6. I'd been pre-diabetic for years and my A1c was still "normal."

None of those numbers were on the panel my doctor was running. Once I saw them, the picture was obvious. Once the picture was obvious, the fix was obvious. Once I started fixing it, I lost a hundred pounds and stopped waking up at 3am.

I'm not telling you this so you'll think I'm a genius. I'm telling you this because for a decade I was the guy in the guide. "Normal labs, feel like shit." It's not a personal failing. It's a measurement problem.

The next email — Day 4 — is the one most guys need to read twice. It's the stuff nobody tells you about reading your own labs, the mistakes I see Newport Beach guys make weekly, and why "I'll just buy testosterone online" is the single fastest way to end up with hematocrit at 56% and a stroke risk you didn't know about.

— Chris
Head Janitor, Range Medical
Newport Beach, CA

Range Medical | https://www.range-medical.com/book-assessment
Reply to this email if you want to talk. It comes straight to me.

P.S. — If you haven't actually opened the guide yet, here it is again: https://www.range-medical.com/bloodwork-guide.pdf. The TL;DR on page 2 is the only page you actually have to read.`,
  },
  {
    subject: '[3/5] The three ways Newport Beach guys mess this up',
    body: `This is the email I wish someone had sent me at 42.

The three things I watch Newport Beach guys do every week:

One: They read their own labs and self-medicate. They've Googled the protocols. They know a guy who knows a guy. They order testosterone from a peptide site that's three websites removed from a Chinese manufacturer, inject themselves on a schedule a forum recommended, and feel great for six months. Then their hematocrit climbs to 55+ and they have no idea because they're not testing. Some of them stroke out. Some of them just sit at 54% for a few years before they find out the hard way. The labs in the guide — specifically hematocrit, estradiol, and PSA — exist to prevent that exact thing.

Two: They anchor to "normal" and accept the slow grind. They get labs, see "all in range," and go home. Five years later they're 15 pounds heavier, libido is gone, sleep is shot, and they're still "normal." Reference ranges include the entire population. The population is sick. If you anchor there, you're benchmarking yourself against the guys who feel like you do.

Three: They never measure Lp(a). It's a one-time test. Your number is genetic. If yours is high, you've been carrying 3x cardiovascular risk your entire life and nobody mentioned it. Including your cardiologist, probably. The AHA told doctors to start measuring it in 2022. Most still don't.

These are the things the Range Assessment is built to catch. Not the only things — but the ones that move the needle most.

On Friday — Day 7 — I'll send you the offer. What the Range Assessment actually includes, what it costs, and what to expect. No pressure. Just the information.

— Chris
Head Janitor, Range Medical
Newport Beach, CA

Range Medical | https://www.range-medical.com/book-assessment
Reply to this email if you want to talk. It comes straight to me.`,
  },
  {
    subject: '[4/5] What the Range Assessment actually is',
    body: `Friday. Time for the offer.

The Range Assessment is what we do when a guy walks in and says, "I want to figure out what's actually going on."

What you get:

- Comprehensive bloodwork. Total T, free T, SHBG, estradiol, A1c, fasting insulin, full lipid panel, hs-CRP, thyroid, CBC, metabolic.
- Optional Elite add-ons. ApoB, Lp(a), DHEA-S, full thyroid (free T3, free T4, reverse T3), homocysteine, vitamin D, ferritin, cortisol AM. The advanced six from the guide.
- A 45-minute provider conversation. Your labs read with you, in person or by video. Not emailed at you. Not summarized by a portal bot.
- A personalized protocol. Could be testosterone. Could be a GLP-1. Could be "your sleep and your insulin are the problem, here's how we fix that first." Could be "your labs are great, keep doing what you're doing." We turn guys away from TRT and GLP-1s regularly. That's the whole point of having a provider.

What it costs: $197 — applied as a credit toward any labs or treatment plan. It's not an extra cost on top.

Where to book: https://www.range-medical.com/book-assessment

A note on what we don't do. We don't push testosterone on guys who don't need it. We don't push GLP-1s on guys who can lose 30 pounds with a different lever. We don't run a med spa with a script pad in the back. We run a clinic. There's a difference.

If you want to talk first before booking, reply to this email. It comes to me, not a support inbox. I'll get back to you the same day most of the time.

— Chris
Head Janitor, Range Medical
Newport Beach, CA

Range Medical | https://www.range-medical.com/book-assessment
Reply to this email if you want to talk. It comes straight to me.

P.S. — If you're in Newport Beach or Costa Mesa, the clinic is here. If you're remote, most of this still works — labs get drawn at a Quest near you, the consult is video. Couple of states have rules. We'll tell you upfront.`,
  },
  {
    subject: '[5/5] Last one from me on this',
    body: `Last email in this sequence.

If you've booked the assessment, ignore this. I'll see you in the clinic or on the schedule.

If you haven't booked yet, here's the final CTA: https://www.range-medical.com/book-assessment. No countdown timer. No "limited spots." When you're ready, we're here.

What I do want to leave you with: the bloodwork is one piece. Sleep, movement, nutrition, and stress are the four levers that make any protocol work — or fall apart. I send out a short weekly tip on one of those levers. No long emails. No newsletter padding. One thing that actually moves the needle, every Sunday.

If you want those, you don't need to do anything — you're already on the list. If you don't, the unsubscribe link is at the bottom and I won't take it personally.

Most guys who read this guide don't end up at Range Medical. That's fine. The point of the guide is to make you smarter at the next dinner conversation, the next physical with your PCP, the next decision you make about your own body. If we end up working together, great. If not, you have better information than you did 10 days ago, and that was the whole job.

— Chris
Head Janitor, Range Medical
Newport Beach, CA

Range Medical | https://www.range-medical.com/book-assessment
Reply to this email if you want to talk. It comes straight to me.

P.S. — The guide is here one more time if you want to forward it to the friend who needs it: https://www.range-medical.com/bloodwork-guide.pdf. That's how most of these reach the right guy.`,
  },
];

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

function buildHtml(body) {
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
            [PREVIEW — no unsubscribe link in test send]
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const to = req.query.email;
  if (!to || !to.includes('@')) return res.status(400).json({ error: 'email query param required' });

  const secret = req.query.secret;
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const results = [];

  for (let i = 0; i < EMAILS.length; i++) {
    const email = EMAILS[i];
    try {
      const result = await resend.emails.send({
        from: FROM,
        to,
        replyTo: REPLY_TO,
        subject: email.subject,
        html: buildHtml(email.body),
        text: email.body,
      });
      results.push({ num: i + 1, ok: !result.error, id: result.data?.id });
      if (result.error) results[results.length - 1].error = result.error.message;
    } catch (err) {
      results.push({ num: i + 1, ok: false, error: err.message });
    }
  }

  return res.status(200).json({ ok: true, sent: results });
}
