#!/usr/bin/env node

// scripts/setup-twilio-sip.js
// Sets up Twilio SIP domain + credentials for Grandstream phone
// Then configures the phone number to route calls via SIP

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
const PHONE_SID = 'PN092f92da78af39269aac58ce3d0ad21c'; // From Twilio console screenshot
const SIP_DOMAIN_NAME = 'rangemedical.sip.twilio.com';
const SIP_USERNAME = 'rangemedical';
// Twilio requires: 12+ chars, uppercase, lowercase, number
const SIP_PASSWORD = 'Range' + crypto.randomBytes(6).toString('hex') + '1M';
const VOICE_WEBHOOK = 'https://app.range-medical.com/api/twilio/voice';

const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

async function twilioPost(endpoint, params) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  const body = await response.json();
  if (!response.ok) {
    // Check if it's a "already exists" error - that's fine
    if (body.code === 20404 || body.code === 21452 || body.code === 21232) {
      return { exists: true, ...body };
    }
    throw new Error(`Twilio API error (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function twilioGet(endpoint) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
    },
  });
  return response.json();
}

async function main() {
  console.log('\n📞 Setting up Twilio SIP for Grandstream Phone\n');

  // Step 1: Check for existing SIP domains
  console.log('Step 1: Setting up SIP domain...');
  const existingDomains = await twilioGet('/SIP/Domains.json');
  let domain = existingDomains.sip_domains?.find(d => d.domain_name.startsWith(SIP_DOMAIN_NAME));

  if (domain) {
    console.log(`  ✓ SIP domain already exists: ${domain.domain_name}`);
    // Update the voice URL
    await twilioPost(`/SIP/Domains/${domain.sid}.json`, {
      VoiceUrl: VOICE_WEBHOOK,
      VoiceMethod: 'POST',
    });
    console.log(`  ✓ Updated voice URL to: ${VOICE_WEBHOOK}`);
  } else {
    domain = await twilioPost('/SIP/Domains.json', {
      DomainName: SIP_DOMAIN_NAME,
      FriendlyName: 'Range Medical Grandstream',
      VoiceUrl: VOICE_WEBHOOK,
      VoiceMethod: 'POST',
    });
    console.log(`  ✓ Created SIP domain: ${domain.domain_name}`);
  }

  console.log(`  SIP Domain: ${domain.domain_name}`);
  console.log(`  SID: ${domain.sid}\n`);

  // Step 2: Create credential list
  console.log('Step 2: Setting up SIP credentials...');
  const existingCredLists = await twilioGet('/SIP/CredentialLists.json');
  let credList = existingCredLists.credential_lists?.find(c => c.friendly_name === 'Range Medical Grandstream');

  if (credList) {
    console.log(`  ✓ Credential list already exists: ${credList.sid}`);
    // Delete existing credentials and recreate with new password
    const existingCreds = await twilioGet(`/SIP/CredentialLists/${credList.sid}/Credentials.json`);
    for (const cred of (existingCreds.credentials || [])) {
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/CredentialLists/${credList.sid}/Credentials/${cred.sid}.json`, {
        method: 'DELETE',
        headers: { 'Authorization': `Basic ${auth}` },
      });
    }
    console.log('  ✓ Cleared old credentials');
  } else {
    credList = await twilioPost('/SIP/CredentialLists.json', {
      FriendlyName: 'Range Medical Grandstream',
    });
    console.log(`  ✓ Created credential list: ${credList.sid}`);
  }

  // Add credential
  const cred = await twilioPost(`/SIP/CredentialLists/${credList.sid}/Credentials.json`, {
    Username: SIP_USERNAME,
    Password: SIP_PASSWORD,
  });
  console.log(`  ✓ Created credential: ${SIP_USERNAME}\n`);

  // Step 3: Map credential list to domain for registration
  console.log('Step 3: Mapping credentials to domain...');
  try {
    await twilioPost(`/SIP/Domains/${domain.sid}/Auth/Registrations/CredentialListMappings.json`, {
      CredentialListSid: credList.sid,
    });
    console.log('  ✓ Mapped credential list for registration\n');
  } catch (err) {
    if (err.message.includes('21452') || err.message.includes('already')) {
      console.log('  ✓ Credential list already mapped\n');
    } else {
      throw err;
    }
  }

  // Also map for outbound calls (so Grandstream can make calls)
  try {
    await twilioPost(`/SIP/Domains/${domain.sid}/Auth/Calls/CredentialListMappings.json`, {
      CredentialListSid: credList.sid,
    });
    console.log('  ✓ Mapped credential list for outbound calls\n');
  } catch (err) {
    if (err.message.includes('already')) {
      console.log('  ✓ Outbound credential list already mapped\n');
    } else {
      console.log('  ⚠ Outbound mapping note:', err.message, '\n');
    }
  }

  // Step 4: Update phone number to use voice webhook
  console.log('Step 4: Configuring phone number voice routing...');
  const phoneUpdate = await twilioPost(`/IncomingPhoneNumbers/${PHONE_SID}.json`, {
    VoiceUrl: VOICE_WEBHOOK,
    VoiceMethod: 'POST',
    VoiceFallbackUrl: VOICE_WEBHOOK,
    VoiceFallbackMethod: 'POST',
  });
  console.log(`  ✓ Phone number ${phoneUpdate.phone_number} voice URL set to: ${VOICE_WEBHOOK}\n`);

  // Summary
  console.log('='.repeat(60));
  console.log('GRANDSTREAM PHONE SETTINGS');
  console.log('='.repeat(60));
  console.log('');
  console.log(`  SIP Server:    ${domain.domain_name}`);
  console.log(`  SIP User ID:   ${SIP_USERNAME}`);
  console.log(`  Auth ID:       ${SIP_USERNAME}`);
  console.log(`  Auth Password: ${SIP_PASSWORD}`);
  console.log(`  Outbound Proxy: ${domain.domain_name}`);
  console.log('');
  console.log('  Transport:     UDP (or TCP)');
  console.log('  SIP Port:      5060');
  console.log('');
  console.log('='.repeat(60));
  console.log('');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
