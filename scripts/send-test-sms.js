#!/usr/bin/env node

// Test: send SMS via Twilio

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
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TO_NUMBER = '+19496900339';

async function main() {
  console.log('Sending test SMS via Twilio...');
  console.log(`  From: ${FROM_NUMBER}`);
  console.log(`  To: ${TO_NUMBER}`);
  console.log(`  Account: ${ACCOUNT_SID}\n`);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: TO_NUMBER,
      From: FROM_NUMBER,
      Body: 'Test from Range Medical — Stripe purchase notifications are now live via Twilio!',
    }).toString(),
  });

  const body = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(body, null, 2));
}

main().catch(err => console.error('Error:', err.message));
