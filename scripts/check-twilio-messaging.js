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

async function twilioGet(endpoint) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  return response.json();
}

async function main() {
  // Check phone number configuration
  console.log('=== Phone Number Configuration ===');
  const phone = await twilioGet(`/IncomingPhoneNumbers/${PHONE_SID}.json`);
  console.log('  Phone:', phone.phone_number);
  console.log('  Friendly Name:', phone.friendly_name);
  console.log('  SMS URL:', phone.sms_url || '(not set)');
  console.log('  SMS Method:', phone.sms_method || '(not set)');
  console.log('  SMS Fallback URL:', phone.sms_fallback_url || '(not set)');
  console.log('  Voice URL:', phone.voice_url || '(not set)');
  console.log('  Capabilities:', JSON.stringify(phone.capabilities));
  console.log('  Status:', phone.status);

  // Check messaging services
  console.log('\n=== Messaging Services ===');
  const msgServices = await fetch(`https://messaging.twilio.com/v1/Services`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const msgBody = await msgServices.json();
  if (msgBody.services && msgBody.services.length > 0) {
    for (const s of msgBody.services) {
      console.log('  Service:', s.friendly_name, 'SID:', s.sid);
      console.log('    Use Case:', s.use_case);
    }
  } else {
    console.log('  No messaging services found');
  }

  // Check A2P Brand Registrations
  console.log('\n=== A2P Brand Registrations ===');
  const brandsRes = await fetch(`https://messaging.twilio.com/v1/a2p/BrandRegistrations`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const brandsBody = await brandsRes.json();
  if (brandsBody.data && brandsBody.data.length > 0) {
    for (const b of brandsBody.data) {
      console.log('  Brand:', b.customer_profile_bundle_sid);
      console.log('    Status:', b.brand_score !== undefined ? `Score: ${b.brand_score}` : 'N/A');
      console.log('    SID:', b.sid);
      console.log('    Status:', b.status);
    }
  } else {
    console.log('  No brand registrations found');
    console.log('  (Response:', JSON.stringify(brandsBody).substring(0, 200), ')');
  }

  // Check Trust Hub profiles
  console.log('\n=== Trust Hub Customer Profiles ===');
  const trustRes = await fetch(`https://trusthub.twilio.com/v1/CustomerProfiles`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const trustBody = await trustRes.json();
  if (trustBody.results && trustBody.results.length > 0) {
    for (const p of trustBody.results) {
      console.log('  Profile:', p.friendly_name);
      console.log('    Status:', p.status);
      console.log('    SID:', p.sid);
    }
  } else {
    console.log('  No customer profiles found');
  }

  // Check recent messages to see if any were sent/received
  console.log('\n=== Recent Messages (last 5) ===');
  const msgs = await twilioGet(`/Messages.json?PageSize=5`);
  if (msgs.messages && msgs.messages.length > 0) {
    for (const m of msgs.messages) {
      console.log(`  ${m.direction} | ${m.from} → ${m.to} | Status: ${m.status} | ${m.date_sent}`);
      if (m.error_code) console.log(`    Error: ${m.error_code} - ${m.error_message}`);
    }
  } else {
    console.log('  No recent messages');
  }
}

main().catch(err => console.error('Error:', err));
