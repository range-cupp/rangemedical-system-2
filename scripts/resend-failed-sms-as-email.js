#!/usr/bin/env node
// scripts/resend-failed-sms-as-email.js
// Fetches undelivered SMS messages from Twilio and resends them via email
// Usage: node scripts/resend-failed-sms-as-email.js [--dry-run]

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env vars
const envPath = resolve(import.meta.dirname, '..', '.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const DRY_RUN = process.argv.includes('--dry-run');

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(env.RESEND_API_KEY);

const TWILIO_SID = env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = env.TWILIO_AUTH_TOKEN;
const CHRIS_PHONE = '+19496900339';

async function main() {
  console.log(`\n=== Resend Failed SMS as Email ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // Step 1: Fetch undelivered messages from Twilio (last 3 days)
  console.log('Step 1: Fetching undelivered messages from Twilio...');
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json?PageSize=200&DateSent>=2026-03-03`,
    { headers: { 'Authorization': `Basic ${auth}` } }
  );
  const data = await resp.json();

  // Filter to outbound undelivered/failed, exclude Chris's test number
  const failed = data.messages.filter(m =>
    (m.status === 'undelivered' || m.status === 'failed') &&
    m.direction === 'outbound-api' &&
    m.to !== CHRIS_PHONE
  );

  console.log(`  Found ${failed.length} undelivered patient messages\n`);

  if (failed.length === 0) {
    console.log('No messages to resend!');
    return;
  }

  // Step 2: Look up patients by phone number
  console.log('Step 2: Looking up patient emails...');
  const { data: patients, error: pErr } = await supabase
    .from('patients')
    .select('id, name, full_name, first_name, email, phone');

  if (pErr) {
    console.error('Failed to fetch patients:', pErr);
    process.exit(1);
  }

  // Build phone lookup map (normalize phone numbers)
  const phoneToPatient = {};
  for (const p of patients) {
    if (p.phone) {
      const cleaned = p.phone.replace(/\D/g, '');
      const normalized = cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;
      phoneToPatient[normalized] = p;
      // Also store with just the 10 digits for matching
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        phoneToPatient[`+${cleaned}`] = p;
      }
    }
  }

  // Step 3: Match messages to patients and prepare emails
  console.log('Step 3: Matching messages to patients...\n');
  const toSend = [];
  const noEmail = [];

  for (const msg of failed) {
    const patient = phoneToPatient[msg.to];
    if (!patient || !patient.email) {
      noEmail.push({ to: msg.to, body: msg.body.slice(0, 60) });
      continue;
    }

    const firstName = patient.first_name || patient.name?.split(' ')[0] || 'there';
    toSend.push({
      patient,
      firstName,
      email: patient.email,
      originalBody: msg.body,
      dateSent: msg.date_sent,
    });
  }

  console.log(`  Ready to email: ${toSend.length}`);
  console.log(`  No email found: ${noEmail.length}`);

  if (noEmail.length > 0) {
    console.log('\n  --- Skipped (no email) ---');
    for (const n of noEmail) {
      console.log(`    ${n.to}: ${n.body}...`);
    }
  }

  console.log('\n  --- Will send ---');
  for (const s of toSend) {
    console.log(`    ${s.firstName} <${s.email}>: ${s.originalBody.slice(0, 60)}...`);
  }

  // Step 4: Send emails
  if (DRY_RUN) {
    console.log(`\nDRY RUN — would send ${toSend.length} emails. Run without --dry-run to send.\n`);
    return;
  }

  console.log(`\nStep 4: Sending ${toSend.length} emails...\n`);
  let sent = 0;
  let errored = 0;

  for (const item of toSend) {
    // Convert the SMS body to a nice email, preserving links
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

      // Delay to avoid Resend rate limits (2 req/sec)
      await new Promise(r => setTimeout(r, 600));
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
