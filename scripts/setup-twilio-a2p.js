#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex);
  let value = trimmed.slice(eqIndex + 1);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = value;
}

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

const MESSAGING_SERVICE_SID = 'MGba1b3ecde204f6f6072dc2d88e2ff93b'; // Mixed A2P
const BRAND_SID = 'BN340fb227198a851933d09e9e3757997d';
const PHONE_SID = 'PN092f92da78af39269aac58ce3d0ad21c'; // +19499973988

async function main() {
  // Step 1: Add phone number +19499973988 to messaging service
  console.log('Step 1: Adding +19499973988 to Messaging Service...');
  const addPhoneRes = await fetch(`https://messaging.twilio.com/v1/Services/${MESSAGING_SERVICE_SID}/PhoneNumbers`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      PhoneNumberSid: PHONE_SID,
    }).toString(),
  });
  const addPhoneBody = await addPhoneRes.json();
  if (addPhoneRes.ok) {
    console.log('  ✓ Added:', addPhoneBody.phone_number);
  } else {
    console.log('  Status:', addPhoneRes.status);
    console.log('  Response:', JSON.stringify(addPhoneBody));
  }

  // Step 2: Check what use cases are available
  console.log('\nStep 2: Checking available A2P use cases...');
  const useCasesRes = await fetch(`https://messaging.twilio.com/v1/a2p/BrandRegistrations/${BRAND_SID}/Vettings`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const useCasesBody = await useCasesRes.json();
  console.log('  Vettings:', JSON.stringify(useCasesBody, null, 2).substring(0, 500));

  // Step 3: Create A2P Campaign
  console.log('\nStep 3: Creating A2P 10DLC Campaign...');
  const campaignRes = await fetch(`https://messaging.twilio.com/v1/Services/${MESSAGING_SERVICE_SID}/UsAppToPerson`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      BrandRegistrationSid: BRAND_SID,
      Description: 'Range Medical sends appointment reminders, purchase confirmations, HRT injection reminders, and patient notifications to opted-in patients and clients.',
      MessageFlow: 'Patients opt in to receive text messages during their medical intake form and onboarding process on range-medical.com. They can opt out at any time by replying STOP.',
      MessageSamples: JSON.stringify([
        'Your Range Medical purchase of $150.00 has been confirmed. Thank you!',
        'Reminder: Your HRT injection is scheduled for today (Monday). - Range Medical',
        'Your lab results are ready. Please log in to your patient portal to view them. - Range Medical'
      ]),
      UsAppToPersonUsecase: 'MIXED',
      HasEmbeddedLinks: 'true',
      HasEmbeddedPhone: 'false',
      OptInMessage: 'You have opted in to receive text messages from Range Medical. Reply STOP to unsubscribe.',
      OptOutMessage: 'You have been unsubscribed from Range Medical messages. Reply START to resubscribe.',
      HelpMessage: 'Range Medical: For help, call (949) 997-3988 or visit range-medical.com. Reply STOP to unsubscribe.',
      OptInType: 'WEB_FORM',
    }).toString(),
  });
  const campaignBody = await campaignRes.json();
  console.log('  Status:', campaignRes.status);
  console.log('  Response:', JSON.stringify(campaignBody, null, 2).substring(0, 1500));

  // Step 4: List current phone numbers in service
  console.log('\nStep 4: Phone numbers now in messaging service...');
  const phonesRes = await fetch(`https://messaging.twilio.com/v1/Services/${MESSAGING_SERVICE_SID}/PhoneNumbers`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const phonesBody = await phonesRes.json();
  for (const p of (phonesBody.phone_numbers || [])) {
    console.log('  ', p.phone_number, '(SID:', p.sid + ')');
  }
}

main().catch(err => console.error('Error:', err));
