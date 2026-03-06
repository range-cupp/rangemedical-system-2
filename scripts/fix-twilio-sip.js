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

const DOMAIN_SID = 'SD7e213f8223cac898bb770a9ae6bc5310';
const CRED_LIST_SID = 'CLbb8f8d11c3448d43df94018fd68a74df';
const VOICE_WEBHOOK = 'https://app.range-medical.com/api/twilio/voice';

async function main() {
  // Step 1: Enable SIP registration on the domain (THIS WAS THE BUG!)
  console.log('Step 1: Enabling SIP Registration on domain...');
  const updateRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      SipRegistration: 'true',
      VoiceUrl: VOICE_WEBHOOK,
      VoiceMethod: 'POST',
    }).toString(),
  });
  const updateBody = await updateRes.json();
  if (updateRes.ok) {
    console.log('  ✓ SIP Registration enabled:', updateBody.sip_registration);
    console.log('  ✓ Voice URL:', updateBody.voice_url);
  } else {
    console.log('  ✗ Error:', JSON.stringify(updateBody));
  }

  // Step 2: Verify registration credential mapping exists
  console.log('\nStep 2: Checking registration credential mappings...');
  const regRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}/Auth/Registrations/CredentialListMappings.json`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const regBody = await regRes.json();
  const regContents = regBody.contents || [];
  if (regContents.length > 0) {
    console.log('  ✓ Registration mappings exist:', regContents.length);
    for (const m of regContents) {
      console.log('    -', m.friendly_name, m.sid);
    }
  } else {
    console.log('  Adding registration mapping...');
    const addRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}/Auth/Registrations/CredentialListMappings.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ CredentialListSid: CRED_LIST_SID }).toString(),
    });
    const addBody = await addRes.json();
    console.log(addRes.ok ? '  ✓ Added registration mapping' : '  ✗ Error:', JSON.stringify(addBody));
  }

  // Step 3: Verify calls credential mapping exists
  console.log('\nStep 3: Checking calls credential mappings...');
  const callRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}/Auth/Calls/CredentialListMappings.json`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const callBody = await callRes.json();
  const callContents = callBody.contents || [];
  if (callContents.length > 0) {
    console.log('  ✓ Calls mappings exist:', callContents.length);
    for (const m of callContents) {
      console.log('    -', m.friendly_name, m.sid);
    }
  } else {
    console.log('  Adding calls mapping...');
    const addRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}/Auth/Calls/CredentialListMappings.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ CredentialListSid: CRED_LIST_SID }).toString(),
    });
    const addBody = await addRes.json();
    console.log(addRes.ok ? '  ✓ Added calls mapping' : '  ✗ Error:', JSON.stringify(addBody));
  }

  // Step 4: Verify credentials exist
  console.log('\nStep 4: Verifying credentials...');
  const credsRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/CredentialLists/${CRED_LIST_SID}/Credentials.json`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const credsBody = await credsRes.json();
  for (const c of (credsBody.credentials || [])) {
    console.log('  ✓ Credential:', c.username, 'SID:', c.sid);
  }

  // Final check
  console.log('\nStep 5: Final domain state...');
  const finalRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${DOMAIN_SID}.json`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const finalBody = await finalRes.json();
  console.log('  Domain:', finalBody.domain_name);
  console.log('  SIP Registration:', finalBody.sip_registration);
  console.log('  Voice URL:', finalBody.voice_url);

  console.log('\n' + '='.repeat(50));
  console.log('GRANDSTREAM PHONE SETTINGS');
  console.log('='.repeat(50));
  console.log('');
  console.log('  SIP Server:      rangemedical.sip.twilio.com');
  console.log('  SIP User ID:     rangemedical');
  console.log('  Authenticate ID: rangemedical');
  console.log('  Auth Password:   RangeMed2024Sip!');
  console.log('  Outbound Proxy:  rangemedical.sip.twilio.com');
  console.log('');
  console.log('='.repeat(50));
  console.log('');
  console.log('After updating the phone, reboot it to re-register.');
}

main().catch(err => console.error('Error:', err));
