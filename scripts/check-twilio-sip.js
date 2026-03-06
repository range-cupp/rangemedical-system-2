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

const NEW_PASSWORD = 'RangeMed2024Sip!';

async function main() {
  // Check SIP domains
  console.log('=== SIP Domains ===');
  const domRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains.json`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const domains = await domRes.json();
  let domainSid = null;
  for (const d of (domains.sip_domains || [])) {
    console.log('Domain:', d.domain_name, 'SID:', d.sid);
    console.log('  VoiceUrl:', d.voice_url);
    domainSid = d.sid;
  }

  // Check credential lists
  console.log('\n=== Credential Lists ===');
  const clRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/CredentialLists.json`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const credLists = await clRes.json();
  let credListSid = null;
  for (const cl of (credLists.credential_lists || [])) {
    console.log('CredList:', cl.friendly_name, 'SID:', cl.sid);
    credListSid = cl.sid;

    // Check credentials in this list
    const credsRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/CredentialLists/${cl.sid}/Credentials.json`, {
      headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
    });
    const creds = await credsRes.json();
    for (const c of (creds.credentials || [])) {
      console.log('  Credential:', c.username, 'SID:', c.sid);

      // Delete old credential
      console.log('  Deleting old credential...');
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/CredentialLists/${cl.sid}/Credentials/${c.sid}.json`, {
        method: 'DELETE',
        headers: { 'Authorization': `Basic ${auth}` }
      });
    }

    // Create new credential with known password
    console.log(`\n  Creating new credential: rangemedical / ${NEW_PASSWORD}`);
    const newCredRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/CredentialLists/${cl.sid}/Credentials.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        Username: 'rangemedical',
        Password: NEW_PASSWORD,
      }).toString(),
    });
    const newCred = await newCredRes.json();
    if (newCredRes.ok) {
      console.log('  ✓ Created credential:', newCred.username, 'SID:', newCred.sid);
    } else {
      console.log('  ✗ Error creating credential:', JSON.stringify(newCred));
    }
  }

  // Check domain auth mappings
  if (domainSid) {
    console.log('\n=== Registration Mappings ===');
    const regRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${domainSid}/Auth/Registrations/CredentialListMappings.json`, {
      headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
    });
    const regMappings = await regRes.json();
    const regList = regMappings.contents || regMappings.credential_list_mappings || [];
    if (regList.length > 0) {
      console.log('  ✓ Registration mappings found:', regList.length);
      for (const m of regList) {
        console.log('    -', m.friendly_name, m.sid);
      }
    } else {
      console.log('  ✗ No registration mappings - need to add one');
      // Add mapping
      if (credListSid) {
        const mapRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${domainSid}/Auth/Registrations/CredentialListMappings.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ CredentialListSid: credListSid }).toString(),
        });
        const mapBody = await mapRes.json();
        console.log('  Added mapping:', mapRes.ok ? '✓' : '✗', JSON.stringify(mapBody));
      }
    }

    console.log('\n=== Calls Mappings ===');
    const callRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${domainSid}/Auth/Calls/CredentialListMappings.json`, {
      headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
    });
    const callMappings = await callRes.json();
    const callList = callMappings.contents || callMappings.credential_list_mappings || [];
    if (callList.length > 0) {
      console.log('  ✓ Calls mappings found:', callList.length);
      for (const m of callList) {
        console.log('    -', m.friendly_name, m.sid);
      }
    } else {
      console.log('  ✗ No calls mappings - need to add one');
      if (credListSid) {
        const mapRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${domainSid}/Auth/Calls/CredentialListMappings.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ CredentialListSid: credListSid }).toString(),
        });
        const mapBody = await mapRes.json();
        console.log('  Added mapping:', mapRes.ok ? '✓' : '✗', JSON.stringify(mapBody));
      }
    }
  }

  // Also update the domain voice URL to make sure it's correct
  if (domainSid) {
    console.log('\n=== Updating Domain Voice URL ===');
    const updateRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/Domains/${domainSid}.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        VoiceUrl: 'https://app.range-medical.com/api/twilio/voice',
        VoiceMethod: 'POST',
      }).toString(),
    });
    const updateBody = await updateRes.json();
    console.log(updateRes.ok ? '  ✓ Voice URL updated' : '  ✗ Error:', updateBody.voice_url || JSON.stringify(updateBody));
  }

  console.log('\n' + '='.repeat(50));
  console.log('UPDATED GRANDSTREAM SETTINGS');
  console.log('='.repeat(50));
  console.log('');
  console.log('  SIP Server:    rangemedical.sip.twilio.com');
  console.log('  SIP User ID:   rangemedical');
  console.log('  Authenticate ID: rangemedical');
  console.log(`  Auth Password: ${NEW_PASSWORD}`);
  console.log('  Outbound Proxy: rangemedical.sip.twilio.com');
  console.log('');
}

main().catch(err => console.error('Error:', err));
