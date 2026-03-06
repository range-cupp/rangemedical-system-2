#!/usr/bin/env node
// scripts/resend-remaining-7.js
// Resend failed SMS as emails to 7 specific patients whose emails we now know
// Usage: node scripts/resend-remaining-7.js [--dry-run]

import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env vars from .env.local
const envPath = resolve(import.meta.dirname, '..', '.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const DRY_RUN = process.argv.includes('--dry-run');

const resend = new Resend(env.RESEND_API_KEY);

const TWILIO_SID = env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = env.TWILIO_AUTH_TOKEN;
const CHRIS_PHONE = '+19496900339';

// The 7 patients whose emails we now know
const PHONE_TO_EMAIL = {
  '+164212335560': { email: 'jossiwells@gmail.com', name: 'Josiah' },
  '+19493007809':  { email: 'ks-clark@hotmail.com', name: 'Ken' },
  '+19495664730':  { email: 'tatefit13@gmail.com', name: 'Cristina' },
  '+19493077404':  { email: 'matthewwallyburns@gmail.com', name: 'Matthew' },
  '+17144588107':  { email: 'jenrlaughlin@gmail.com', name: 'Jennifer' },
  '+17143231421':  { email: 'Debbiegayle1953@yahoo.com', name: 'Debbie' },
  '+19492442323':  { email: 'jimbaur23@gmail.com', name: 'James' },
};

async function main() {
  console.log(`\n=== Resend Remaining 7 Failed SMS as Email ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // Step 1: Fetch undelivered messages from Twilio
  console.log('Step 1: Fetching undelivered messages from Twilio...');
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json?PageSize=200&DateSent>=2026-03-03`,
    { headers: { 'Authorization': `Basic ${auth}` } }
  );
  const data = await resp.json();

  // Filter to outbound undelivered/failed, exclude Chris's number
  const failed = data.messages.filter(m =>
    (m.status === 'undelivered' || m.status === 'failed') &&
    m.direction === 'outbound-api' &&
    m.to !== CHRIS_PHONE
  );

  console.log(`  Found ${failed.length} total undelivered patient messages`);

  // Step 2: Match to our 7 specific patients
  console.log('\nStep 2: Matching to the 7 target patients...\n');
  const toSend = [];

  for (const msg of failed) {
    const patient = PHONE_TO_EMAIL[msg.to];
    if (!patient) continue;

    // Extract first name from SMS body (starts with "Hi [name]!")
    const nameMatch = msg.body.match(/^Hi\s+([^!,]+)[!,]/);
    const firstName = nameMatch ? nameMatch[1].trim() : patient.name;

    toSend.push({
      phone: msg.to,
      email: patient.email,
      firstName,
      originalBody: msg.body,
      dateSent: msg.date_sent,
    });
  }

  console.log(`  Matched ${toSend.length} messages for ${Object.keys(PHONE_TO_EMAIL).length} target patients\n`);

  // Show what we'll send
  for (const s of toSend) {
    console.log(`  ${s.firstName} <${s.email}> (${s.phone}): ${s.originalBody.slice(0, 60)}...`);
  }

  if (toSend.length === 0) {
    console.log('No matching messages found!');
    return;
  }

  // Step 3: Send emails
  if (DRY_RUN) {
    console.log(`\nDRY RUN — would send ${toSend.length} emails. Run without --dry-run to send.\n`);
    return;
  }

  console.log(`\nStep 3: Sending ${toSend.length} emails...\n`);
  let sent = 0;
  let errored = 0;

  for (const item of toSend) {
    // Convert SMS body to HTML, preserving links
    const bodyHtml = item.originalBody
      .replace(/\n/g, '<br>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color: #166534; font-weight: 600;">$1</a>');

    try {
      const { error } = await resend.emails.send({
        from: 'Range Medical <notifications@range-medical.com>',
        to: item.email,
        subject: '📋 Message from Range Medical',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto;">
            <div style="background: #166534; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="margin: 0; font-size: 18px;">Range Medical</h2>
            </div>
            <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 14px; color: #6b7280; margin-top: 0;">
                Hi ${item.firstName}, our text messaging service is temporarily down, so we're sending this via email instead:
              </p>
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0; font-size: 15px; line-height: 1.6; color: #111827;">
                ${bodyHtml}
              </div>
              <p style="font-size: 13px; color: #9ca3af; margin-bottom: 0;">
                If you have questions, call us at (949) 997-3988 or reply to this email.
              </p>
            </div>
            <div style="padding: 12px; text-align: center; font-size: 11px; color: #9ca3af;">
              Range Medical · Regenerative Medicine
            </div>
          </div>
        `,
      });

      if (error) {
        console.error(`  FAILED: ${item.email} — ${error.message || JSON.stringify(error)}`);
        errored++;
      } else {
        console.log(`  ✓ Sent to ${item.firstName} <${item.email}>`);
        sent++;
      }

      // 1000ms delay between sends to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ERROR: ${item.email} — ${err.message}`);
      errored++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Sent: ${sent}, Failed: ${errored}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
