#!/usr/bin/env node

// scripts/setup-twilio-extensions.js
// Creates individual SIP credentials for each Grandstream phone
// so they can be individually targeted for transfers
// Also keeps the shared 'rangemedical' credential for backwards compatibility

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
const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

// SIP phones to create credentials for
const SIP_PHONES = [
  { username: 'frontdesk1', name: 'Front Desk 1', ext: '101' },
  { username: 'frontdesk2', name: 'Front Desk 2', ext: '102' },
  { username: 'nursing', name: 'Nursing Station', ext: '103' },
];

function generatePassword() {
  // Twilio requires: 12+ chars, uppercase, lowercase, number
  return 'Range' + crypto.randomBytes(6).toString('hex') + '1M';
}

async function twilioGet(endpoint) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' },
  });
  return response.json();
}

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
  if (!response.ok && body.code !== 21452) {
    throw new Error(`Twilio API error (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  console.log('\n📞 Setting Up Grandstream Phone Extensions\n');

  // Find existing SIP domain
  const domains = await twilioGet('/SIP/Domains.json');
  const domain = (domains.sip_domains || domains.domains)?.find(d => d.domain_name.includes('rangemedical'));
  if (!domain) {
    console.error('❌ SIP domain not found. Run setup-twilio-sip.js first.');
    process.exit(1);
  }
  console.log(`✓ Found SIP domain: ${domain.domain_name} (${domain.sid})\n`);

  // Find existing credential list
  const credLists = await twilioGet('/SIP/CredentialLists.json');
  let credList = credLists.credential_lists?.find(c => c.friendly_name === 'Range Medical Grandstream');
  if (!credList) {
    console.error('❌ Credential list not found. Run setup-twilio-sip.js first.');
    process.exit(1);
  }
  console.log(`✓ Found credential list: ${credList.sid}\n`);

  // Check existing credentials
  const existingCreds = await twilioGet(`/SIP/CredentialLists/${credList.sid}/Credentials.json`);
  const existingUsernames = (existingCreds.credentials || []).map(c => c.username);
  console.log(`  Existing credentials: ${existingUsernames.join(', ') || 'none'}\n`);

  // Create credentials for each phone
  const results = [];
  for (const phone of SIP_PHONES) {
    const password = generatePassword();

    // Delete existing credential if it exists
    const existing = (existingCreds.credentials || []).find(c => c.username === phone.username);
    if (existing) {
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/SIP/CredentialLists/${credList.sid}/Credentials/${existing.sid}.json`, {
        method: 'DELETE',
        headers: { 'Authorization': `Basic ${auth}` },
      });
      console.log(`  Replaced existing credential: ${phone.username}`);
    }

    await twilioPost(`/SIP/CredentialLists/${credList.sid}/Credentials.json`, {
      Username: phone.username,
      Password: password,
    });

    results.push({ ...phone, password });
    console.log(`  ✓ Created credential: ${phone.username} (Ext ${phone.ext})`);
  }

  // Print configuration for each Grandstream
  console.log('\n' + '='.repeat(60));
  console.log('GRANDSTREAM PHONE CONFIGURATION');
  console.log('='.repeat(60));

  for (const phone of results) {
    console.log(`\n--- ${phone.name} (Extension ${phone.ext}) ---`);
    console.log(`  SIP Server:    ${domain.domain_name}`);
    console.log(`  SIP User ID:   ${phone.username}`);
    console.log(`  Auth ID:       ${phone.username}`);
    console.log(`  Auth Password: ${phone.password}`);
    console.log(`  Outbound Proxy: ${domain.domain_name}`);
    console.log(`  Transport:     UDP`);
    console.log(`  SIP Port:      5060`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('EXTENSION DIRECTORY');
  console.log('='.repeat(60));
  console.log('');
  console.log('  Ext 101  →  Front Desk 1');
  console.log('  Ext 102  →  Front Desk 2');
  console.log('  Ext 103  →  Nursing Station');
  console.log('  Ext 333  →  Chris Cupp (cell)');
  console.log('  Ext 334  →  Damien Burgess (cell)');
  console.log('  Ext 335  →  Lily Diaz (cell)');
  console.log('  Ext 336  →  Evan Riederich (cell)');
  console.log('');
  console.log('TO TRANSFER: Press the Transfer button on the Grandstream,');
  console.log('dial the extension number, then press Send/Transfer.');
  console.log('');
  console.log('='.repeat(60));
  console.log('');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
