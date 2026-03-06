#!/usr/bin/env node
// Log the remaining 11 resent emails that weren't captured in the first logging run

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

// The 11 patients we emailed but haven't logged yet (with confirmed patient IDs)
const phoneLookup = {
  '+19499337628': { id: '10e99484-7405-4764-bd87-9382732170f3', email: 'rileyjohnkerrigan@gmail.com', name: 'Riley Kerrigan', firstName: 'Riley' },
  '+164212335560': { id: '7a77625f-f9c2-4e76-9b24-89ed1fe09346', email: 'jossiwells@gmail.com', name: 'Josiah Wells', firstName: 'Josiah' },
  '+19492167583': { id: '40546b11-8ee8-4a0c-9d96-60a0098e3bd6', email: 'zacharyzarvos@gmail.com', name: 'Zachary Zarvos', firstName: 'Zachary' },
  '+19492370873': { id: '76f897fe-dd61-48ef-9041-69827ac7710a', email: 'parnaz.mehdizadeh@yahoo.com', name: 'Soraya Burwell', firstName: 'Soraya' },
  '+19493007809': { id: 'e13a5704-b5f4-4687-ac76-50d576056503', email: 'ks-clark@hotmail.com', name: 'Ken Clark', firstName: 'Ken' },
  '+19495664730': { id: '3d5a53c3-2433-424b-a8d9-43b1d8802084', email: 'tatefit13@gmail.com', name: 'Cristina Tate', firstName: 'Cristina' },
  '+19493077404': { id: '12604c94-80b1-47ef-8c97-8c645ece8cb0', email: 'matthewwallyburns@gmail.com', name: 'Matthew Burns', firstName: 'Matthew' },
  '+17144588107': { id: 'ebc583f2-1c8a-4dee-99ae-e2bdcaca0529', email: 'jenrlaughlin@gmail.com', name: 'Jennifer Laughlin', firstName: 'Jennifer' },
  '+17143231421': { id: 'b153943f-58b2-46f2-a307-0da6478c1c3d', email: 'Debbiegayle1953@yahoo.com', name: 'Debbie Johnson', firstName: 'Debbie' },
  '+17147203186': { id: 'd4093cd8-e999-490d-93ff-10af8e621793', email: 'richard@wilneroreilly.com', name: 'Richard Wilner', firstName: 'Richard' },
  '+19492442323': { id: '9947a250-bafd-4d32-9d0a-53229d2e899f', email: 'jimbaur23@gmail.com', name: 'James Baur', firstName: 'James' },
};

async function main() {
  console.log('\n=== Log remaining 11 resent emails to comms_log ===\n');

  // Get GHL contact IDs for these patients
  const patientIds = Object.values(phoneLookup).map(p => p.id);
  const { data: dbPatients } = await supabase
    .from('patients')
    .select('id, ghl_contact_id')
    .in('id', patientIds);

  const idToGhl = {};
  for (const p of dbPatients || []) {
    idToGhl[p.id] = p.ghl_contact_id;
  }

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
    phoneLookup[m.to]
  );

  console.log(`Found ${failed.length} messages to log\n`);

  let logged = 0;

  for (const msg of failed) {
    const info = phoneLookup[msg.to];

    const bodyHtml = msg.body
      .replace(/\n/g, '<br>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color: #166534; font-weight: 600;">$1</a>');

    const emailHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto;">
  <div style="background: #166534; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
    <h2 style="margin: 0; font-size: 18px;">Range Medical</h2>
  </div>
  <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 14px; color: #6b7280; margin-top: 0;">
      Hi ${info.firstName}, our text messaging service is temporarily down, so we're sending this via email instead:
    </p>
    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0; font-size: 15px; line-height: 1.6; color: #111827;">
      ${bodyHtml}
    </div>
    <p style="font-size: 13px; color: #9ca3af; margin-bottom: 0;">
      If you have questions, call us at (949) 997-3988 or reply to this email.
    </p>
  </div>
</div>`;

    let messageType = 'resent_sms_email';
    if (msg.body.includes('peptide check-in')) messageType = 'peptide_followup_resent';
    else if (msg.body.includes('weight loss check-in')) messageType = 'wl_checkin_resent';
    else if (msg.body.includes('injection day')) messageType = 'hrt_injection_resent';
    else if (msg.body.includes('Range IV is included')) messageType = 'hrt_iv_reminder_resent';

    const { error } = await supabase.from('comms_log').insert({
      patient_id: info.id,
      ghl_contact_id: idToGhl[info.id] || null,
      patient_name: info.name,
      channel: 'email',
      message_type: messageType,
      recipient: info.email,
      subject: '\u{1F4CB} Message from Range Medical',
      message: emailHtml,
      status: 'sent',
      source: 'resend-failed-sms-as-email',
      direction: 'outbound',
    });

    if (error) {
      console.error(`  ERROR: ${info.name} — ${error.message}`);
    } else {
      console.log(`  \u2713 Logged: ${info.name} <${info.email}> [${messageType}]`);
      logged++;
    }
  }

  console.log(`\n=== DONE — Logged: ${logged} ===\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
