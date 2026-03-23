// lib/energy-check-emails.js
// Email templates for the Energy & Recovery Check nurture sequence
// 4 emails: results (immediate), meaning (day 1), urgency (day 3), soft (day 7)
// Range Medical

const SEVERITY_LABELS = {
  green: 'Low Concern',
  yellow: 'Moderate Concern',
  red: 'High Concern',
};

const SEVERITY_COLORS = {
  green: '#16A34A',
  yellow: '#D97706',
  red: '#DC2626',
};

function header() {
  return `
    <tr>
      <td style="background-color: #000000; padding: 30px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.1em;">RANGE MEDICAL</h1>
        <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Energy & Recovery Check</p>
      </td>
    </tr>`;
}

function footer() {
  return `
    <tr>
      <td style="padding: 24px 30px; border-top: 1px solid #e5e5e5;">
        <p style="margin: 0; font-size: 13px; color: #a3a3a3; line-height: 1.6;">
          Range Medical &middot; 1901 Westcliff Dr, Suite 10, Newport Beach, CA<br/>
          (949) 997-3988 &middot; range-medical.com<br/><br/>
          Reply STOP to unsubscribe from email.
        </p>
      </td>
    </tr>`;
}

function ctaButton(text, url) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
      <tr>
        <td style="background: #171717; border-radius: 8px;">
          <a href="${url}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600;">${text}</a>
        </td>
      </tr>
    </table>`;
}

function wrap(content) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px; border-radius: 12px; overflow: hidden;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Email 1: Immediate results recap (sent from submit.js) ──────────────────

export function getResultsEmailHtml({ firstName, score, severity, bookingUrl, door }) {
  const severityLabel = SEVERITY_LABELS[severity] || 'Results Ready';
  const severityColor = SEVERITY_COLORS[severity] || '#171717';
  const ctaLabel = door === 'recovery' ? 'Book Recovery Visit' : 'See Lab Panels & Pricing';

  return wrap(`
    ${header()}
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Your Results Are In, ${firstName}</h2>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background: #fafafa; border-radius: 10px;">
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 48px; font-weight: 700; color: ${severityColor};">${score}</p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #737373;">out of 24 points</p>
              <span style="display: inline-block; padding: 4px 14px; border-radius: 16px; font-size: 13px; font-weight: 700; color: #fff; background: ${severityColor};">${severityLabel.toUpperCase()}</span>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">Your quiz flagged real patterns — not guesses. But here's the thing: a symptom quiz can spot signals, but it can't measure what's actually happening inside your body.</p>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">Hormones, nutrients, and cellular markers don't show up in how you feel — they show up in labs. That's where we come in.</p>

        <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Your next step:</strong> Pick a lab panel and get the data you need to make a real plan.</p>

        ${ctaButton(ctaLabel, bookingUrl)}

        <p style="margin: 0; font-size: 13px; color: #a3a3a3;">No obligation. Just clarity.</p>
      </td>
    </tr>
    ${footer()}
  `);
}

// ── Email 2: "What your score really means" (Day 1) ─────────────────────────

export function getDay1EmailHtml({ firstName, score, severity, bookingUrl, door }) {
  const severityColor = SEVERITY_COLORS[severity] || '#171717';
  const ctaLabel = door === 'recovery' ? 'Book Recovery Visit' : 'See Lab Panels';

  const insight = severity === 'red'
    ? 'Scores in this range almost always correlate with measurable imbalances — low testosterone, thyroid issues, vitamin D deficiency, or elevated inflammation markers. These aren\'t things you can fix with more sleep or a new supplement stack.'
    : severity === 'yellow'
    ? 'Scores in this range often point to early-stage imbalances that haven\'t fully shown up yet. The tricky part? They feel like "normal aging" — but they\'re not. They\'re usually specific, measurable, and fixable.'
    : 'Even with a lower score, there are often hidden gaps — especially in hormones, vitamin D, B12, or thyroid markers — that don\'t cause obvious symptoms until they\'ve been off for a while. Catching them early is the whole point.';

  return wrap(`
    ${header()}
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">What Your Score Actually Means</h2>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">Hey ${firstName},</p>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">Yesterday you scored <strong style="color: ${severityColor};">${score}/24</strong> on the Energy & Recovery Check. Here's what that typically means in clinic:</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
          <tr>
            <td style="background: #fafafa; padding: 20px; border-left: 4px solid ${severityColor}; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;">${insight}</p>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">The only way to know for sure is to look. A comprehensive lab panel takes about 15 minutes and gives you (and a provider) something concrete to work with.</p>

        ${ctaButton(ctaLabel, bookingUrl)}
      </td>
    </tr>
    ${footer()}
  `);
}

// ── Email 3: "This doesn't fix itself" (Day 3) ──────────────────────────────

export function getDay3EmailHtml({ firstName, score, severity, bookingUrl, door }) {
  const ctaLabel = door === 'recovery' ? 'Book Recovery Visit' : 'See Lab Panels';

  return wrap(`
    ${header()}
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">This Usually Doesn't Fix Itself</h2>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">Hey ${firstName},</p>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">Quick reality check from what we see in clinic every week:</p>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">When fatigue, brain fog, or slow recovery has been going on for more than a few months, it almost never resolves on its own. Not with more coffee, not with a new workout, not with another supplement.</p>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">That's not a sales pitch — it's just what the data shows. The body is sending a signal, and the signal has a source. Labs find the source.</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
          <tr>
            <td style="background: #fafafa; padding: 20px; border-radius: 8px;">
              <p style="margin: 0 0 8px; color: #171717; font-size: 15px; font-weight: 600;">What most of our patients say afterward:</p>
              <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7; font-style: italic;">"I wish I'd done this six months ago."</p>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">If you've been meaning to do something about this — now's a good time.</p>

        ${ctaButton(ctaLabel, bookingUrl)}
      </td>
    </tr>
    ${footer()}
  `);
}

// ── Email 4: "Still feeling off?" (Day 7) ───────────────────────────────────

export function getDay7EmailHtml({ firstName, bookingUrl, door }) {
  const ctaLabel = door === 'recovery' ? 'Book Recovery Visit' : 'See Lab Panels';

  return wrap(`
    ${header()}
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Still Feeling Off?</h2>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">Hey ${firstName},</p>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">Last week you took our Energy & Recovery Check. Just checking in — has anything changed?</p>

        <p style="margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.7;">If you're still dealing with the same stuff, we're here. No pressure. If you want to talk through your options, you can:</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
          <tr>
            <td style="padding: 12px 0; font-size: 15px; color: #404040; line-height: 1.7;">
              &#8226; <strong>Reply to this email</strong> with any questions<br/>
              &#8226; <strong>Call or text us</strong> at (949) 997-3988<br/>
              &#8226; <strong>Book directly</strong> using the link below
            </td>
          </tr>
        </table>

        ${ctaButton(ctaLabel, bookingUrl)}

        <p style="margin: 0; font-size: 13px; color: #a3a3a3;">This is our last automated email about your check. We won't keep bugging you — but we're here if you need us.</p>
      </td>
    </tr>
    ${footer()}
  `);
}

// ── Nurture SMS templates ───────────────────────────────────────────────────

export function getDay1Sms({ firstName, bookingUrl }) {
  return `Hey ${firstName}, yesterday you took our Energy & Recovery Check. Your score flagged some real patterns — here's what it typically means in clinic:\n\n${bookingUrl}\n\n- Range Medical`;
}

export function getDay3Sms({ firstName, bookingUrl }) {
  return `Hey ${firstName}, quick thought: when fatigue or slow recovery has been going on for months, it almost never fixes itself. Labs find the source.\n\nReady to look? ${bookingUrl}\n\n- Range Medical`;
}

export function getDay7Sms({ firstName }) {
  return `Hey ${firstName}, just checking in. Still dealing with the same stuff from last week? Reply here or call/text us at (949) 997-3988. No pressure — we're here when you're ready.\n\n- Range Medical`;
}
