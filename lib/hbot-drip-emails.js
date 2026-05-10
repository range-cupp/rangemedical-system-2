// lib/hbot-drip-emails.js
// 3-email post-free-session drip for HBOT — 7-day special membership pricing
// Range Medical

const HEADER = `
<div style="background:#000;padding:24px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:18px;letter-spacing:0.12em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">RANGE MEDICAL</h1>
</div>`;

const FOOTER = `
<div style="padding:24px;text-align:center;border-top:1px solid #e5e5e5;">
  <p style="margin:0 0 8px;color:#737373;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    Range Medical &middot; 1901 Westcliff Dr Suite 10 &middot; Newport Beach, CA 92660
  </p>
  <p style="margin:0;color:#737373;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <a href="tel:9499973988" style="color:#525252;text-decoration:none;">(949) 997-3988</a> &middot; <a href="https://range-medical.com" style="color:#525252;text-decoration:none;">range-medical.com</a>
  </p>
</div>`;

function ctaButton(text) {
  return `
<div style="text-align:center;margin:28px 0;">
  <a href="tel:9499973988" style="display:inline-block;padding:16px 36px;background:#171717;color:#fff;text-decoration:none;font-size:15px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;letter-spacing:0.02em;">${text}</a>
</div>`;
}

function wrap(body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
${HEADER}
<div style="padding:32px 28px;">
${body}
</div>
${FOOTER}
</div></body></html>`;
}

const p = (text) => `<p style="margin:0 0 16px;color:#171717;font-size:15px;line-height:1.6;">${text}</p>`;

function pricingCard({ title, price, originalPrice, savings, description }) {
  return `
<div style="background:#fafafa;border:1px solid #e5e5e5;padding:20px 24px;margin:0 0 12px;">
  <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.08em;color:#737373;text-transform:uppercase;">${title}</p>
  <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#171717;">${price}<span style="font-size:14px;font-weight:400;color:#737373;">/mo</span></p>
  <p style="margin:0 0 4px;font-size:14px;color:#737373;"><s>${originalPrice}/mo</s> &mdash; save ${savings}/mo</p>
  <p style="margin:0;font-size:13px;color:#525252;">${description}</p>
</div>`;
}

function allPricingCards() {
  return pricingCard({
    title: 'HBOT — 3x/Week',
    price: '$999',
    originalPrice: '$1,399',
    savings: '$400',
    description: '12 sessions/mo — best rate for focused recovery',
  }) + pricingCard({
    title: 'HBOT + Red Light — 3x/Week',
    price: '$1,499',
    originalPrice: '$1,999',
    savings: '$500',
    description: '12 HBOT + 12 Red Light sessions/mo — full recovery stack',
  }) + pricingCard({
    title: 'Unlimited HBOT + Red Light',
    price: '$1,999',
    originalPrice: '$2,999',
    savings: '$1,000',
    description: 'Come every day — your choice of HBOT or Red Light each visit',
  });
}

// ── Email 1: Day 1 — check-in + introduce offer ──────────────────────────────

export function getEmail1Subject({ firstName }) {
  return `How was your first session, ${firstName}?`;
}

export function getEmail1Html({ firstName, expiryDate }) {
  return wrap(`
${p(`Hi ${firstName},`)}
${p(`Hope you enjoyed your first hyperbaric oxygen therapy session. Most people notice they feel relaxed or sleep a little better after their first time in the chamber.`)}
${p(`Here is what happens from here: the real benefits of HBOT build over multiple sessions. Most people who feel a noticeable difference do at least 10 to 40 sessions. Each time, your body absorbs more oxygen at a deeper level — supporting recovery, reducing inflammation, and boosting cellular energy.`)}
${p(`Because you just experienced it firsthand, we want to make it easy to keep going. <strong>For the next 7 days, we are offering you exclusive post-session pricing on our memberships:</strong>`)}
${allPricingCards()}
${p(`All memberships are 3-month minimum, HSA/FSA accepted, and you can upgrade or downgrade anytime.`)}
${ctaButton('Call or Text to Get Started')}
${p(`This pricing is available through ${expiryDate}. If you have questions about which plan makes sense, just reply to this email or give us a call.`)}
${p(`— Range Medical`)}
  `);
}

// ── Email 2: Day 3 — pricing breakdown + details ─────────────────────────────

export function getEmail2Subject() {
  return 'Your exclusive HBOT membership pricing';
}

export function getEmail2Html({ firstName, expiryDate }) {
  return wrap(`
${p(`Hi ${firstName},`)}
${p(`You are a few days out from your free HBOT session. If you have noticed better sleep, less soreness, or just felt more clear-headed — that is your body responding to the increased oxygen delivery.`)}
${p(`We mentioned your post-session pricing earlier this week. Here is the full breakdown:`)}
${allPricingCards()}
<div style="background:#f0f7f1;border:1px solid #d4e8d6;padding:16px 20px;margin:0 0 20px;">
  <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#171717;">All memberships include:</p>
  <p style="margin:0 0 4px;font-size:14px;color:#525252;">✓ &nbsp;HSA/FSA accepted</p>
  <p style="margin:0 0 4px;font-size:14px;color:#525252;">✓ &nbsp;3-month minimum, then cancel anytime</p>
  <p style="margin:0 0 4px;font-size:14px;color:#525252;">✓ &nbsp;Upgrade or downgrade anytime (we pro-rate)</p>
  <p style="margin:0;font-size:14px;color:#525252;">✓ &nbsp;Members get discounted add-on sessions at $150 each</p>
</div>
${p(`If you want help choosing the right plan, call or text us and we will walk you through it based on what you are looking to improve.`)}
${ctaButton('Call or Text — (949) 997-3988')}
${p(`This pricing is available through ${expiryDate}.`)}
${p(`— Range Medical`)}
  `);
}

// ── Email 3: Day 7 — last day ────────────────────────────────────────────────

export function getEmail3Subject({ firstName }) {
  return `Last day for your HBOT pricing, ${firstName}`;
}

export function getEmail3Html({ firstName }) {
  return wrap(`
${p(`Hi ${firstName},`)}
${p(`Quick heads up — your post-session membership pricing expires today.`)}
${allPricingCards()}
${p(`After today, these plans go back to regular pricing. If you have been thinking about it, now is the time to lock it in.`)}
${ctaButton('Call or Text to Lock In Your Pricing')}
${p(`If now is not the right time, no worries at all. You can always start a membership at regular pricing whenever you are ready.`)}
${p(`— Range Medical`)}
  `);
}
