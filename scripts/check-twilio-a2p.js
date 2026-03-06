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

async function main() {
  const BRAND_SID = 'BN340fb227198a851933d09e9e3757997d';

  // Check A2P Campaigns
  console.log('=== A2P Campaigns ===');
  const campaignsRes = await fetch(`https://messaging.twilio.com/v1/Services/MGba1b3ecde204f6f6072dc2d88e2ff93b/UsAppToPersonUsecases`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const campaignsBody = await campaignsRes.json();
  console.log('Available use cases:', JSON.stringify(campaignsBody, null, 2).substring(0, 1000));

  // Check existing campaigns for the brand
  console.log('\n=== Existing A2P Campaigns ===');
  const existRes = await fetch(`https://messaging.twilio.com/v1/Services/MGba1b3ecde204f6f6072dc2d88e2ff93b/UsAppToPerson`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const existBody = await existRes.json();
  console.log(JSON.stringify(existBody, null, 2).substring(0, 2000));

  // Also check the other messaging service
  console.log('\n=== Campaigns on Marketing Service ===');
  const exist2Res = await fetch(`https://messaging.twilio.com/v1/Services/MGbb485c8031a028649ebb5bc365c07fca/UsAppToPerson`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const exist2Body = await exist2Res.json();
  console.log(JSON.stringify(exist2Body, null, 2).substring(0, 2000));

  // Check phone numbers in messaging service 1
  console.log('\n=== Phone Numbers in Mixed A2P Service ===');
  const phones1Res = await fetch(`https://messaging.twilio.com/v1/Services/MGba1b3ecde204f6f6072dc2d88e2ff93b/PhoneNumbers`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const phones1Body = await phones1Res.json();
  console.log(JSON.stringify(phones1Body, null, 2).substring(0, 1000));

  // Check phone numbers in messaging service 2
  console.log('\n=== Phone Numbers in Marketing Service ===');
  const phones2Res = await fetch(`https://messaging.twilio.com/v1/Services/MGbb485c8031a028649ebb5bc365c07fca/PhoneNumbers`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const phones2Body = await phones2Res.json();
  console.log(JSON.stringify(phones2Body, null, 2).substring(0, 1000));
}

main().catch(err => console.error('Error:', err));
