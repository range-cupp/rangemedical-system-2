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
const PHONE_SID = 'PN092f92da78af39269aac58ce3d0ad21c';

async function main() {
  console.log('Updating SMS webhook URL for +19499973988...\n');

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/${PHONE_SID}.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      SmsUrl: 'https://app.range-medical.com/api/twilio/webhook',
      SmsMethod: 'POST',
      SmsFallbackUrl: 'https://app.range-medical.com/api/twilio/webhook',
      SmsFallbackMethod: 'POST',
      StatusCallback: 'https://app.range-medical.com/api/twilio/status-callback',
      StatusCallbackMethod: 'POST',
    }).toString(),
  });

  const body = await res.json();
  if (res.ok) {
    console.log('✓ Phone:', body.phone_number);
    console.log('✓ SMS URL:', body.sms_url);
    console.log('✓ SMS Fallback URL:', body.sms_fallback_url);
    console.log('✓ Voice URL:', body.voice_url);
    console.log('✓ Status Callback:', body.status_callback);
  } else {
    console.log('Error:', JSON.stringify(body));
  }
}

main().catch(err => console.error('Error:', err));
