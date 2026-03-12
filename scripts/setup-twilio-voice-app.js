#!/usr/bin/env node
// scripts/setup-twilio-voice-app.js
// One-time setup: creates Twilio API Key + TwiML App for browser calling
// Run once, then add the output env vars to Vercel + .env.local
// Usage: node scripts/setup-twilio-voice-app.js

require('dotenv').config({ path: '.env.local' });
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://rangemedical-system-2.vercel.app';

if (!accountSid || !authToken) {
  console.error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function setup() {
  console.log('Setting up Twilio Voice for Range Medical Staff App…\n');

  // 1. Create API Key (safer than using main auth token in tokens)
  console.log('Creating API Key…');
  const apiKey = await client.newKeys.create({ friendlyName: 'Range Medical Staff App' });
  console.log(`  API Key SID:    ${apiKey.sid}`);
  console.log(`  API Key Secret: ${apiKey.secret}\n`);

  // 2. Create TwiML App — voice URL points to our app-specific voice webhook
  const voiceUrl = `${appUrl}/api/twilio/voice-app`;
  console.log(`Creating TwiML App (voice URL: ${voiceUrl})…`);
  const twimlApp = await client.applications.create({
    friendlyName: 'Range Medical Staff App',
    voiceUrl,
    voiceMethod: 'POST',
  });
  console.log(`  TwiML App SID: ${twimlApp.sid}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Add these to .env.local AND Vercel environment variables:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`TWILIO_API_KEY_SID=${apiKey.sid}`);
  console.log(`TWILIO_API_KEY_SECRET=${apiKey.secret}`);
  console.log(`TWILIO_TWIML_APP_SID=${twimlApp.sid}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Done! Copy the vars above and run: vercel env add');
}

setup().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
