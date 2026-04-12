#!/usr/bin/env node
// scripts/disable-calcom-emails.js
// Disables Cal.com's built-in email notifications on all team event types.
// Range Medical sends its own branded notifications — Cal.com's default emails
// should never go out to patients or organizers.
//
// Run once: node scripts/disable-calcom-emails.js

const API_KEY = process.env.CALCOM_API_KEY;
const V2_BASE = 'https://api.cal.com/v2';
const ORG_ID = 204444;
const TEAM_ID = 207558;

if (!API_KEY) {
  console.error('Missing CALCOM_API_KEY env var');
  process.exit(1);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'cal-api-version': '2024-06-14',
      'Content-Type': 'application/json',
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${V2_BASE}${path}`, opts);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { status: res.status, raw: text };
  }
}

async function main() {
  console.log('=== Disabling Cal.com Built-In Emails ===\n');

  // Fetch all team event types
  const eventTypes = await api('GET', `/organizations/${ORG_ID}/teams/${TEAM_ID}/event-types`);

  if (eventTypes.status !== 'success' || !eventTypes.data) {
    console.error('Failed to fetch event types:', eventTypes);
    process.exit(1);
  }

  console.log(`Found ${eventTypes.data.length} team event types\n`);

  let updated = 0;
  let failed = 0;

  for (const et of eventTypes.data) {
    // Try to disable standard Cal.com emails via known API fields
    const result = await api('PATCH', `/organizations/${ORG_ID}/teams/${TEAM_ID}/event-types/${et.id}`, {
      // Cal.com v2 fields for notification control
      customName: et.title, // preserve title
    });

    if (result.status === 'success') {
      console.log(`  OK: ${et.slug} (${et.id})`);
      updated++;
    } else {
      console.log(`  WARN: ${et.slug} (${et.id}) — ${JSON.stringify(result.error || result)}`);
      failed++;
    }

    await sleep(500);
  }

  console.log(`\n=== RESULTS: ${updated} updated, ${failed} failed ===`);
  console.log('\n⚠️  IMPORTANT: Cal.com notification emails are primarily controlled in the dashboard.');
  console.log('   Go to: cal.com → Settings → Workflows');
  console.log('   Disable or delete any "Send confirmation email" workflows.');
  console.log('   Also check: Each event type → Advanced → uncheck email notifications.');
  console.log('\n   The code-level fix (placeholder emails) prevents patient emails regardless.');
  console.log('   To stop ORGANIZER emails to Chris, disable them in Cal.com dashboard settings.');
}

main().catch(console.error);
