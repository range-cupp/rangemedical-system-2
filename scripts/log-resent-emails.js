#!/usr/bin/env node
// scripts/log-resent-emails.js
// Logs the 21 resent-as-email SMS messages into comms_log so they appear in the Communications tab

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envFile = readFileSync(resolve(import.meta.dirname, '..', '.env.local'), 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const TWILIO_SID = env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = env.TWILIO_AUTH_TOKEN;
const CHRIS_PHONE = '+19496900339';

// All 21 patients we successfully emailed — hardcoded from verified lookups
const phoneToEmail = {
  // Batch 1 — original 10 matched by resend script
  '+19498365505': 'rachelsnyder87@gmail.com',
  // Brian - need to find his phone from Twilio messages
  // Batch 2+3+4 were matched manually — use the confirmed emails
  '+19499337628': 'rileyjohnkerrigan@gmail.com',
  '+164212335560': 'jossiwells@gmail.com',
  '+19492167583': 'zacharyzarvos@gmail.com',
  '+19492370873': 'parnaz.mehdizadeh@yahoo.com',
  '+19493007809': 'ks-clark@hotmail.com',
  '+19495664730': 'tatefit13@gmail.com',
  '+19493077404': 'matthewwallyburns@gmail.com',
  '+17144588107': 'jenrlaughlin@gmail.com',
  '+17143231421': 'Debbiegayle1953@yahoo.com',
  '+17147203186': 'richard@wilneroreilly.com',
  '+19492442323': 'jimbaur23@gmail.com',
};

async function main() {
  console.log('\n=== Log resent emails to comms_log ===\n');

  // Fetch all patients to build lookup
  const { data: patients } = await supabase
    .from('patients')
    .select('id, name, full_name, first_name, email, phone, ghl_contact_id');

  // Build email lookup (case-insensitive)
  const emailToPatient = {};
  for (const p of patients) {
    if (p.email) {
      emailToPatient[p.email.toLowerCase()] = p;
    }
  }

  // Also build phone lookup (last 10 digits)
  const phoneLast10ToPatient = {};
  for (const p of patients) {
    if (p.phone) {
      const last10 = p.phone.replace(/\D/g, '').slice(-10);
      phoneLast10ToPatient[last10] = p;
    }
  }

  // Fetch undelivered messages from Twilio
  console.log('Fetching undelivered messages from Twilio...');
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json?PageSize=200&DateSent>=2026-03-03`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  const data = await resp.json();

  const failed = data.messages.filter(m =>
    (m.status === 'undelivered' || m.status === 'failed') &&
    m.direction === 'outbound-api' &&
    m.to !== CHRIS_PHONE
  );

  console.log(`Found ${failed.length} undelivered messages\n`);

  let logged = 0;
  let skipped = 0;
  let alreadyLogged = 0;

  for (const msg of failed) {
    // Try to find patient by: 1) hardcoded email map, 2) phone last-10 lookup
    const twilioLast10 = msg.to.replace(/\D/g, '').slice(-10);
    const knownEmail = phoneToEmail[msg.to];

    let patient = null;
    if (knownEmail) {
      patient = emailToPatient[knownEmail.toLowerCase()];
    }
    if (!patient) {
      patient = phoneLast10ToPatient[twilioLast10];
    }

    if (!patient || !patient.email) {
      console.log(`  Skip: ${msg.to} — no patient/email match`);
      skipped++;
      continue;
    }

    // Check if we already logged this (avoid duplicates)
    const { data: existing } = await supabase
      .from('comms_log')
      .select('id')
      .eq('patient_id', patient.id)
      .eq('source', 'resend-failed-sms-as-email')
      .eq('channel', 'email')
      .gte('created_at', '2026-03-05T00:00:00Z')
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  Already logged: ${patient.full_name || patient.name} — skipping`);
      alreadyLogged++;
      continue;
    }

    const firstName = patient.first_name || patient.name?.split(' ')[0] || 'there';

    // Build the email HTML that was sent
    const bodyHtml = msg.body
      .replace(/\n/g, '<br>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color: #166534; font-weight: 600;">$1</a>');

    const emailHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto;">
  <div style="background: #166534; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
    <h2 style="margin: 0; font-size: 18px;">Range Medical</h2>
  </div>
  <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 14px; color: #6b7280; margin-top: 0;">
      Hi ${firstName}, our text messaging service is temporarily down, so we're sending this via email instead:
    </p>
    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0; font-size: 15px; line-height: 1.6; color: #111827;">
      ${bodyHtml}
    </div>
    <p style="font-size: 13px; color: #9ca3af; margin-bottom: 0;">
      If you have questions, call us at (949) 997-3988 or reply to this email.
    </p>
  </div>
</div>`;

    // Determine message_type from the original SMS content
    let messageType = 'resent_sms_email';
    if (msg.body.includes('peptide check-in')) messageType = 'peptide_followup_resent';
    else if (msg.body.includes('weight loss check-in')) messageType = 'wl_checkin_resent';
    else if (msg.body.includes('injection day')) messageType = 'hrt_injection_resent';
    else if (msg.body.includes('Range IV is included')) messageType = 'hrt_iv_reminder_resent';

    const { error } = await supabase.from('comms_log').insert({
      patient_id: patient.id,
      ghl_contact_id: patient.ghl_contact_id || null,
      patient_name: patient.full_name || patient.name,
      channel: 'email',
      message_type: messageType,
      recipient: patient.email,
      subject: '\u{1F4CB} Message from Range Medical',
      message: emailHtml,
      status: 'sent',
      source: 'resend-failed-sms-as-email',
      direction: 'outbound',
    });

    if (error) {
      console.error(`  ERROR: ${patient.email} — ${error.message}`);
    } else {
      console.log(`  \u2713 Logged: ${patient.full_name || patient.name} <${patient.email}> [${messageType}]`);
      logged++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Logged: ${logged}, Already logged: ${alreadyLogged}, Skipped: ${skipped}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
