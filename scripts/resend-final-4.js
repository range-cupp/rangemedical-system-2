import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envFile = readFileSync(resolve(import.meta.dirname, '..', '.env.local'), 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const resend = new Resend(env.RESEND_API_KEY);
const TWILIO_SID = env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = env.TWILIO_AUTH_TOKEN;

// The 4 remaining patients we now have emails for
const phoneToEmail = {
  '+19499337628': { email: 'rileyjohnkerrigan@gmail.com', name: 'Riley' },
  '+19492167583': { email: 'zacharyzarvos@gmail.com', name: 'Zachary' },
  '+19492370873': { email: 'parnaz.mehdizadeh@yahoo.com', name: 'Soraya' },
  '+17147203186': { email: 'richard@wilneroreilly.com', name: 'Richard' },
};

// Fetch undelivered messages from Twilio
const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
const resp = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json?PageSize=200&DateSent>=2026-03-03`,
  { headers: { Authorization: `Basic ${auth}` } }
);
const data = await resp.json();

const failed = data.messages.filter(m =>
  (m.status === 'undelivered' || m.status === 'failed') &&
  m.direction === 'outbound-api' &&
  phoneToEmail[m.to]
);

console.log(`\nFound ${failed.length} messages to resend\n`);

let sent = 0;
for (const msg of failed) {
  const info = phoneToEmail[msg.to];
  const bodyHtml = msg.body
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color: #166534; font-weight: 600;">$1</a>');

  const { error } = await resend.emails.send({
    from: 'Range Medical <notifications@range-medical.com>',
    to: info.email,
    subject: '\u{1F4CB} Message from Range Medical',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: #166534; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">Range Medical</h2>
        </div>
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 14px; color: #6b7280; margin-top: 0;">
            Hi ${info.name}, our text messaging service is temporarily down, so we're sending this via email instead:
          </p>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0; font-size: 15px; line-height: 1.6; color: #111827;">
            ${bodyHtml}
          </div>
          <p style="font-size: 13px; color: #9ca3af; margin-bottom: 0;">
            If you have questions, call us at (949) 997-3988 or reply to this email.
          </p>
        </div>
        <div style="padding: 12px; text-align: center; font-size: 11px; color: #9ca3af;">
          Range Medical &middot; Regenerative Medicine
        </div>
      </div>
    `,
  });

  if (error) {
    console.error(`  FAILED: ${info.email} — ${error.message || JSON.stringify(error)}`);
  } else {
    console.log(`  \u2713 Sent to ${info.name} <${info.email}>`);
    sent++;
  }

  await new Promise(r => setTimeout(r, 1000));
}

console.log(`\nDone! Sent: ${sent}/${failed.length}\n`);
