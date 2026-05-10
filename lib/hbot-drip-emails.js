// lib/hbot-drip-emails.js
// 5-email post-free-session drip for HBOT — personalized educational content
// + 7-day special membership pricing
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
  <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#171717;">${price}<span style="font-size:14px;font-weight:400;color:#737373;"> every 4 weeks</span></p>
  <p style="margin:0 0 4px;font-size:14px;color:#737373;"><s>${originalPrice}</s> &mdash; save ${savings}</p>
  <p style="margin:0;font-size:13px;color:#525252;">${description}</p>
</div>`;
}

function allPricingCards() {
  return pricingCard({
    title: 'HBOT — 3x/Week',
    price: '$999',
    originalPrice: '$1,399',
    savings: '$400',
    description: '12 sessions every 4 weeks — best rate for focused recovery',
  }) + pricingCard({
    title: 'HBOT + Red Light — 3x/Week',
    price: '$1,499',
    originalPrice: '$1,999',
    savings: '$500',
    description: '12 HBOT + 12 Red Light sessions every 4 weeks — full recovery stack',
  }) + pricingCard({
    title: 'Unlimited HBOT + Red Light',
    price: '$1,999',
    originalPrice: '$2,999',
    savings: '$1,000',
    description: 'Come every day — your choice of HBOT or Red Light each visit',
  });
}

// ── Condition → benefit content mapping ──────────────────────────────────────

const STRUGGLE_LABELS = {
  energy: 'low energy',
  brain_fog: 'brain fog',
  recovery: 'recovery',
  sleep: 'sleep',
  pain: 'chronic pain',
  headaches: 'headaches',
  skin: 'skin health',
  mood: 'mood',
  weight_loss: 'weight loss',
};

const BENEFIT_BLOCKS = {
  energy: {
    title: 'Energy',
    text: 'Every cell in your body needs oxygen to produce energy. HBOT floods your cells with up to 15 times more oxygen than normal breathing, giving your mitochondria the fuel they need to generate ATP — your body\'s energy currency. Many patients report feeling noticeably more energized within their first few sessions.',
  },
  brain_fog: {
    title: 'Brain Fog',
    text: 'Brain fog often comes from reduced blood flow and oxygen delivery to the brain. HBOT dramatically increases the amount of dissolved oxygen in your blood, allowing it to reach areas of the brain that are underperforming. Patients with brain fog frequently describe feeling "clearer" after just a handful of sessions.',
  },
  recovery: {
    title: 'Recovery',
    text: 'Recovery depends on oxygen — it is the raw material your body uses to repair damaged tissue, reduce swelling, and rebuild muscle. HBOT delivers 10 to 15 times more oxygen than normal breathing, accelerating every stage of the recovery process. Athletes and post-surgery patients have used HBOT for decades to cut recovery time.',
  },
  sleep: {
    title: 'Sleep',
    text: 'Poor sleep is often driven by chronic low-grade inflammation and an overactive nervous system. HBOT reduces systemic inflammation and supports parasympathetic nervous system function — the "rest and digest" mode your body needs to achieve deep, restorative sleep. Many patients report sleeping more deeply within their first few sessions.',
  },
  pain: {
    title: 'Chronic Pain',
    text: 'Chronic pain is almost always accompanied by inflammation — even when there is no visible swelling. HBOT reduces inflammatory markers at the cellular level, increasing oxygen delivery to painful areas and promoting tissue repair. Patients dealing with joint pain, back pain, and neuropathy often notice meaningful improvement within 6 to 10 sessions.',
  },
  headaches: {
    title: 'Headaches',
    text: 'Headaches — whether migraines, tension headaches, or cluster headaches — are frequently linked to reduced oxygen delivery and inflammation in the brain. HBOT increases dissolved oxygen in the blood, improving cerebral blood flow and reducing neuroinflammation. Many headache patients report a noticeable decrease in frequency and intensity within the first 5 to 8 sessions.',
  },
  skin: {
    title: 'Skin Health',
    text: 'Healthy skin starts at the cellular level. HBOT increases collagen production, supports wound healing, and delivers oxygen to the deeper layers of skin that topical products cannot reach. Patients often notice improved skin tone, faster healing, and a general "glow" within the first few weeks of consistent sessions.',
  },
  mood: {
    title: 'Mood',
    text: 'Mood is heavily influenced by brain inflammation and neurotransmitter production — both of which depend on adequate oxygen. HBOT reduces neuroinflammation and supports the production of serotonin and dopamine. Patients dealing with low mood, anxiety, or general irritability often report feeling more balanced and resilient within the first few weeks.',
  },
  weight_loss: {
    title: 'Weight Loss',
    text: 'Weight loss is not just about calories — it is about cellular function. When your mitochondria are starved for oxygen, your metabolism slows down and your body holds onto fat. HBOT fuels mitochondrial function, supports metabolic rate, and reduces the chronic inflammation that makes it harder for your body to burn fat efficiently.',
  },
};

const RESEARCH_BLOCKS = {
  energy: {
    title: 'Energy and Mitochondrial Function',
    text: 'Research shows HBOT increases mitochondrial biogenesis — your body literally creates new, more efficient power plants at the cellular level. Studies in aging research have demonstrated significant improvements in mitochondrial function and cellular energy metabolism after consistent HBOT protocols. The effect is cumulative — each session builds on the last.',
  },
  brain_fog: {
    title: 'Cognitive Function and Neuroplasticity',
    text: 'Brain imaging studies have shown that HBOT can increase cerebral blood flow and stimulate neuroplasticity — the brain\'s ability to form new connections. Research has demonstrated improved cognitive function and information processing speed after a series of HBOT sessions. If brain fog has been lingering for months, this is often the intervention that finally moves the needle.',
  },
  recovery: {
    title: 'Tissue Repair and Healing',
    text: 'HBOT promotes angiogenesis — the growth of new blood vessels in damaged tissue. This means more oxygen-rich blood reaches the areas that need it most. A systematic review of HBOT for sports injuries found significant reductions in recovery time and inflammation markers. Professional sports teams now use HBOT as a standard part of their recovery protocols.',
  },
  sleep: {
    title: 'Sleep Architecture',
    text: 'Research shows that HBOT can improve sleep architecture — specifically the amount of deep sleep and REM sleep you get each night. Studies have found HBOT improved sleep quality scores in participants with chronic conditions. Better sleep means better recovery, which means better results from HBOT — it is a compounding cycle.',
  },
  pain: {
    title: 'Pain and Inflammation',
    text: 'HBOT works on pain through multiple mechanisms: it reduces pro-inflammatory cytokines, promotes stem cell mobilization, and stimulates the growth of new blood vessels in oxygen-deprived tissue. Meta-analyses of HBOT for chronic pain conditions have found significant reductions in pain scores. For pain that has not responded to other treatments, HBOT often provides a pathway forward.',
  },
  headaches: {
    title: 'Headache and Migraine Frequency',
    text: 'Research on HBOT for migraines has shown promising results. Randomized controlled trials have found that HBOT can reduce migraine frequency by over 50 percent in participants who complete a full protocol. The mechanism involves reduced cerebral vasoconstriction and decreased levels of CGRP — a neuropeptide directly involved in migraine pathology.',
  },
  skin: {
    title: 'Collagen Production and Skin Regeneration',
    text: 'HBOT has been shown to increase fibroblast activity — the cells responsible for producing collagen and elastin. Studies on HBOT and skin aging have demonstrated significant improvements in skin elasticity and reduced signs of photoaging after a series of sessions. When combined with Red Light Therapy, the collagen-stimulating effects are amplified — which is why our combo membership is popular among patients focused on skin health.',
  },
  mood: {
    title: 'Mood, Anxiety, and Neuroinflammation',
    text: 'Emerging research has linked HBOT to improvements in depression and anxiety scores. Studies have found that HBOT reduced symptoms of treatment-resistant depression in participants who had not responded to medication alone. The proposed mechanism involves reduced neuroinflammation and improved neuroplasticity — essentially, giving the brain the oxygen it needs to heal and regulate mood more effectively.',
  },
  weight_loss: {
    title: 'Metabolism and Body Composition',
    text: 'Research shows that HBOT can influence body composition through several pathways: improved insulin sensitivity, increased metabolic rate, and reduced adipose tissue inflammation. Studies have demonstrated that HBOT improved metabolic markers in participants with metabolic syndrome. Combined with proper nutrition, HBOT gives your body the cellular environment it needs to optimize body composition.',
  },
};

function buildBenefitSection(block) {
  return `
<div style="background:#fafafa;border-left:3px solid #2E6B35;padding:16px 20px;margin:0 0 16px;">
  <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;color:#2E6B35;text-transform:uppercase;">${block.title}</p>
  <p style="margin:0;font-size:15px;color:#171717;line-height:1.6;">${block.text}</p>
</div>`;
}

function buildResearchSection(block) {
  return `
<div style="background:#fafafa;border-left:3px solid #171717;padding:16px 20px;margin:0 0 16px;">
  <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;color:#171717;text-transform:uppercase;">${block.title}</p>
  <p style="margin:0;font-size:15px;color:#171717;line-height:1.6;">${block.text}</p>
</div>`;
}

function parseStruggles(mainProblem) {
  if (!mainProblem) return [];
  return mainProblem
    .split(',')
    .map(s => s.trim().toLowerCase().replace(/\s+/g, '_'))
    .filter(s => BENEFIT_BLOCKS[s]);
}

function struggleListText(struggles) {
  const labels = struggles.map(s => STRUGGLE_LABELS[s] || s).filter(Boolean);
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return labels.slice(0, -1).join(', ') + ', and ' + labels[labels.length - 1];
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

// ── Email 2: Day 2 — personalized educational (how HBOT helps YOUR issues) ──

export function getEmail2Subject({ firstName, struggles }) {
  const top = (struggles || [])[0];
  const label = STRUGGLE_LABELS[top];
  if (label) return `How HBOT helps with ${label}, ${firstName}`;
  return `How HBOT helps with what you are dealing with, ${firstName}`;
}

export function getEmail2Html({ firstName, struggles }) {
  const blocks = (struggles || []).slice(0, 3);
  const hasBlocks = blocks.length > 0;

  const intro = hasBlocks
    ? `When you came in, you mentioned you were dealing with ${struggleListText(blocks)}. Here is how hyperbaric oxygen therapy specifically helps with each of those:`
    : 'Here is how hyperbaric oxygen therapy helps with some of the most common issues our patients come in with:';

  const benefitHtml = hasBlocks
    ? blocks.map(s => buildBenefitSection(BENEFIT_BLOCKS[s])).join('')
    : [BENEFIT_BLOCKS.energy, BENEFIT_BLOCKS.recovery, BENEFIT_BLOCKS.sleep]
        .map(b => buildBenefitSection(b)).join('');

  return wrap(`
${p(`Hi ${firstName},`)}
${p(intro)}
${benefitHtml}
${p(`Most people start to notice meaningful improvements after 4 to 6 sessions. The benefits compound — each session builds on the last, and the research supports doing at least 10 to 40 sessions for lasting results.`)}
${p(`If you have questions about how a consistent HBOT schedule could help, just reply to this email or give us a call at (949) 997-3988.`)}
${p(`— Range Medical`)}
  `);
}

// ── Email 3: Day 3 — pricing breakdown + details ─────────────────────────────

export function getEmail3Subject() {
  return 'Your exclusive HBOT membership pricing';
}

export function getEmail3Html({ firstName, expiryDate }) {
  return wrap(`
${p(`Hi ${firstName},`)}
${p(`You are a few days out from your free HBOT session. If you have noticed better sleep, less soreness, or just felt more clear-headed — that is your body responding to the increased oxygen delivery.`)}
${p(`We mentioned your post-session pricing earlier this week. Here is the full breakdown:`)}
${allPricingCards()}
<div style="background:#f0f7f1;border:1px solid #d4e8d6;padding:16px 20px;margin:0 0 20px;">
  <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#171717;">All memberships include:</p>
  <p style="margin:0 0 4px;font-size:14px;color:#525252;">&#10003; &nbsp;HSA/FSA accepted</p>
  <p style="margin:0 0 4px;font-size:14px;color:#525252;">&#10003; &nbsp;3-month minimum, then cancel anytime</p>
  <p style="margin:0 0 4px;font-size:14px;color:#525252;">&#10003; &nbsp;Upgrade or downgrade anytime (we pro-rate)</p>
  <p style="margin:0;font-size:14px;color:#525252;">&#10003; &nbsp;Members get discounted add-on sessions at $150 each</p>
</div>
${p(`If you want help choosing the right plan, call or text us and we will walk you through it based on what you are looking to improve.`)}
${ctaButton('Call or Text — (949) 997-3988')}
${p(`This pricing is available through ${expiryDate}.`)}
${p(`— Range Medical`)}
  `);
}

// ── Email 4: Day 5 — personalized research (deeper science for their issues) ─

export function getEmail4Subject({ firstName, struggles }) {
  const top = (struggles || [])[0];
  const block = RESEARCH_BLOCKS[top];
  if (block) return `The research behind HBOT and ${STRUGGLE_LABELS[top]}, ${firstName}`;
  return `The research behind your HBOT session, ${firstName}`;
}

export function getEmail4Html({ firstName, struggles, expiryDate }) {
  const blocks = (struggles || []).slice(0, 3);
  const hasBlocks = blocks.length > 0;

  const intro = hasBlocks
    ? `Earlier this week we talked about how HBOT helps with ${struggleListText(blocks)}. Here is some of the research behind why it works:`
    : 'Here is some of the research behind why HBOT works for the most common conditions our patients come in with:';

  const researchHtml = hasBlocks
    ? blocks.map(s => buildResearchSection(RESEARCH_BLOCKS[s])).join('')
    : [RESEARCH_BLOCKS.energy, RESEARCH_BLOCKS.recovery, RESEARCH_BLOCKS.sleep]
        .map(b => buildResearchSection(b)).join('');

  return wrap(`
${p(`Hi ${firstName},`)}
${p(intro)}
${researchHtml}
${p(`This is why we recommend a minimum of 10 sessions for anyone looking to see real, lasting results. Many of our patients who started with a free session and committed to a consistent schedule report significant improvements by session 8 to 12.`)}
${p(`Your post-session pricing is still available through ${expiryDate}. If you want to lock it in or have questions about what schedule makes sense for you, just reply to this email or give us a call.`)}
${ctaButton('Call or Text — (949) 997-3988')}
${p(`— Range Medical`)}
  `);
}

// ── Email 5: Day 7 — last day ────────────────────────────────────────────────

export function getEmail5Subject({ firstName }) {
  return `Last day for your HBOT pricing, ${firstName}`;
}

export function getEmail5Html({ firstName }) {
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

export { parseStruggles };
