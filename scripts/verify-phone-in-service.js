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

const MESSAGING_SERVICE_SID = 'MGba1b3ecde204f6f6072dc2d88e2ff93b';

async function main() {
  console.log('=== Phone Numbers in "Mixed A2P Messaging Service" ===\n');

  const phonesRes = await fetch(`https://messaging.twilio.com/v1/Services/${MESSAGING_SERVICE_SID}/PhoneNumbers`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const phonesBody = await phonesRes.json();

  let found3988 = false;
  for (const p of (phonesBody.phone_numbers || [])) {
    const marker = p.phone_number === '+19499973988' ? '  ← YOUR BUSINESS NUMBER ✓' : '';
    console.log(`  ${p.phone_number}${marker}`);
    if (p.phone_number === '+19499973988') found3988 = true;
  }

  console.log('');
  if (found3988) {
    console.log('✓ Confirmed: (949) 997-3988 IS in the messaging service with the A2P campaign.');
    console.log('  Once the campaign is approved, this number will be able to send texts.');
  } else {
    console.log('✗ WARNING: (949) 997-3988 is NOT in this messaging service!');
  }
}

main().catch(err => console.error('Error:', err));
