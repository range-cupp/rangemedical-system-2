const HEADER = `
<div style="background:#000;padding:24px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:18px;letter-spacing:0.12em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">RANGE MEDICAL</h1>
</div>`;

const FOOTER = `
<div style="padding:24px;text-align:center;border-top:1px solid #e5e5e5;">
  <p style="margin:0 0 8px;color:#737373;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    Range Medical · 1901 Westcliff Dr Suite 10 · Newport Beach, CA 92660
  </p>
  <p style="margin:0;color:#737373;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <a href="tel:9499973988" style="color:#525252;text-decoration:none;">(949) 997-3988</a> · <a href="https://range-medical.com" style="color:#525252;text-decoration:none;">range-medical.com</a>
  </p>
</div>`;

function ctaButton(url, text) {
  return `
<div style="text-align:center;margin:28px 0;">
  <a href="${url}" style="display:inline-block;padding:16px 36px;background:#171717;color:#fff;text-decoration:none;font-size:15px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;letter-spacing:0.02em;">${text}</a>
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

export function getDay1Subject({ firstName }) {
  return `Your quiz results, ${firstName}`;
}

export function getDay1Html({ firstName, path, bookingUrl }) {
  const pathLabel = path === 'energy' ? 'energy and optimization' : 'injury and recovery';
  return wrap(`
${p(`Hi ${firstName},`)}
${p(`Thanks for taking the Clarity Finder quiz. Based on your answers, your focus area is <strong>${pathLabel}</strong>.`)}
${p(`The next step is a Range Assessment — a single visit where we review focused labs and your symptoms together, then give you a written plan you can follow.`)}
${p(`It is $197 and applies as a credit toward any labs or treatment plan. If you come fasted (no food for 12 hours, water is fine), we can draw blood during the same visit so you do not need a second trip.`)}
${ctaButton(bookingUrl, 'Book Your Range Assessment — $197')}
${p(`If you have any questions, just reply to this email or call us at (949) 997-3988.`)}
${p(`— Range Medical`)}
  `);
}

export function getDay3Subject() {
  return 'What happens during a Range Assessment';
}

export function getDay3Html({ firstName, bookingUrl }) {
  return wrap(`
${p(`Hi ${firstName},`)}
${p(`A lot of people wonder what actually happens during a Range Assessment, so here is the breakdown:`)}
<div style="background:#fafafa;border:1px solid #e5e5e5;padding:20px 24px;margin:0 0 20px;">
  <p style="margin:0 0 12px;font-size:14px;color:#171717;line-height:1.7;"><strong>1. Symptom review</strong> — We sit down and go through what you are experiencing. Not a 5-minute check-in. A real conversation.</p>
  <p style="margin:0 0 12px;font-size:14px;color:#171717;line-height:1.7;"><strong>2. Focused labs</strong> — If your provider recommends bloodwork, we draw it on the spot (come fasted so we can do this in one visit).</p>
  <p style="margin:0 0 12px;font-size:14px;color:#171717;line-height:1.7;"><strong>3. Written plan</strong> — You leave with a clear plan. Not a vague recommendation. Something you can actually follow.</p>
  <p style="margin:0;font-size:14px;color:#171717;line-height:1.7;"><strong>4. Credit applied</strong> — Your $197 applies toward any labs or treatment plan we recommend. It is not an extra cost on top.</p>
</div>
${p(`Most people tell us they wish they had done this sooner.`)}
${ctaButton(bookingUrl, 'Book Your Assessment')}
${p(`— Range Medical`)}
  `);
}

export function getDay7Subject({ firstName }) {
  return `Still thinking about it, ${firstName}?`;
}

export function getDay7Html({ firstName, bookingUrl }) {
  return wrap(`
${p(`Hi ${firstName},`)}
${p(`It has been about a week since you took the quiz. If you are still on the fence, that is completely fine — but we did not want you to forget about it.`)}
${p(`The symptoms you described are not the kind of thing that usually resolves on its own. Whether it is energy, hormones, weight, or recovery — the sooner you get a clear picture of what is going on, the sooner you can start feeling better.`)}
${p(`One visit. Focused labs. A written plan. $197 that credits toward your treatment.`)}
${ctaButton(bookingUrl, 'Book Your Range Assessment')}
${p(`If now is not the right time, no worries at all. We are here whenever you are ready.`)}
${p(`— Range Medical`)}
  `);
}
