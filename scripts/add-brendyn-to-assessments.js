#!/usr/bin/env node
// scripts/add-brendyn-to-assessments.js
// Adds Brendyn Reed as a round-robin host on the Range Assessment — Injury & Recovery
// (and Range Assessment — Both) team event types.

const API_KEY = process.env.CALCOM_API_KEY || 'cal_live_bb31571d015c6664d0e4f4f0beee8200';
const V2_BASE = 'https://api.cal.com/v2';
const ORG_ID = 204444;
const TEAM_ID = 207558;
const BRENDYN = 2383086;

// Slugs to add Brendyn to (everything covering Injury & Recovery)
const TARGET_SLUGS = ['range-assessment-injury', 'range-assessment-both'];

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'cal-api-version': '2024-06-14',
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${V2_BASE}${path}`, opts);
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

async function main() {
  console.log('=== Adding Brendyn to Injury & Recovery Assessment hosts ===\n');

  // 1) List team event types
  const list = await api('GET', `/organizations/${ORG_ID}/teams/${TEAM_ID}/event-types`);
  if (list.status !== 200 || !Array.isArray(list.data?.data)) {
    console.error('Failed to list team event types:', JSON.stringify(list, null, 2));
    process.exit(1);
  }

  const events = list.data.data;

  for (const slug of TARGET_SLUGS) {
    const et = events.find((e) => e.slug === slug);
    if (!et) {
      console.log(`  SKIP: could not find event type with slug "${slug}"`);
      continue;
    }

    const existingHosts = (et.hosts || []).map((h) => ({
      userId: h.userId,
      mandatory: !!h.mandatory,
      priority: h.priority || 'medium',
    }));

    if (existingHosts.some((h) => h.userId === BRENDYN)) {
      console.log(`  ALREADY PRESENT: ${slug} (${et.id}) — Brendyn is already a host`);
      continue;
    }

    const newHosts = [
      ...existingHosts,
      { userId: BRENDYN, mandatory: false, priority: 'medium' },
    ];

    console.log(`  UPDATING: ${slug} (${et.id})`);
    console.log(`    before hosts: ${existingHosts.map((h) => h.userId).join(', ')}`);
    console.log(`    after  hosts: ${newHosts.map((h) => h.userId).join(', ')}`);

    const update = await api(
      'PATCH',
      `/organizations/${ORG_ID}/teams/${TEAM_ID}/event-types/${et.id}`,
      { hosts: newHosts }
    );

    if (update.status >= 200 && update.status < 300) {
      console.log(`    OK — status ${update.status}`);
    } else {
      console.log(`    FAILED — status ${update.status}`);
      console.log(`    ${JSON.stringify(update.data, null, 2)}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
