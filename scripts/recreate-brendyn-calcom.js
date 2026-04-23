#!/usr/bin/env node
// scripts/recreate-brendyn-calcom.js
// Cal.com silently drops user.name updates on existing managed users (PATCH returns 200
// but name stays null). The only API-based fix is to delete and recreate with name
// set at creation time. This script does the full flip-and-restore:
//   1. Remove Brendyn from assessment event hosts
//   2. Delete the Cal.com user
//   3. Recreate with name set
//   4. Add back to team
//   5. Recreate Newport Beach schedule (Thu/Fri 9-5)
//   6. Re-add as host on injury & both assessments

const API_KEY = process.env.CALCOM_API_KEY || 'cal_live_bb31571d015c6664d0e4f4f0beee8200';
const V2 = 'https://api.cal.com/v2';
const ORG_ID = 204444;
const TEAM_ID = 207558;
const OLD_USER_ID = 2357975;
const EMAIL = 'brendyn@range-medical.com';
const NAME = 'Brendyn Reed';
const ASSESSMENT_SLUGS = ['range-assessment-injury', 'range-assessment-both'];

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
  const res = await fetch(`${V2}${path}`, opts);
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: res.status, data: parsed };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('=== Recreating Brendyn Reed in Cal.com (name fix) ===\n');

  // Step 1: remove Brendyn from assessment event hosts
  console.log('1. Removing Brendyn from assessment event hosts...');
  const etList = await api('GET', `/organizations/${ORG_ID}/teams/${TEAM_ID}/event-types`);
  if (etList.status !== 200) {
    console.error('   Failed to list event types:', etList);
    process.exit(1);
  }
  const events = etList.data?.data || [];

  for (const slug of ASSESSMENT_SLUGS) {
    const et = events.find((e) => e.slug === slug);
    if (!et) {
      console.log(`   skip: ${slug} not found`);
      continue;
    }
    const filteredHosts = (et.hosts || [])
      .filter((h) => h.userId !== OLD_USER_ID)
      .map((h) => ({ userId: h.userId, mandatory: !!h.mandatory, priority: h.priority || 'medium' }));

    const patch = await api('PATCH', `/organizations/${ORG_ID}/teams/${TEAM_ID}/event-types/${et.id}`, {
      hosts: filteredHosts,
    });
    console.log(`   ${slug} (${et.id}) hosts=${filteredHosts.map((h) => h.userId).join(',')} status=${patch.status}`);
  }

  // Step 2: delete the old Cal.com user
  console.log('\n2. Deleting old Cal.com user...');
  const del = await api('DELETE', `/organizations/${ORG_ID}/users/${OLD_USER_ID}`);
  console.log(`   status=${del.status}`);
  if (del.status >= 300) console.log(`   body=${JSON.stringify(del.data, null, 2)}`);
  await sleep(1500);

  // Step 3: recreate with name
  console.log('\n3. Creating new Cal.com user with name...');
  const create = await api('POST', `/organizations/${ORG_ID}/users`, {
    email: EMAIL,
    name: NAME,
    autoAccept: true,
    timeZone: 'America/Los_Angeles',
  });
  console.log(`   status=${create.status}`);
  const newUserId = create.data?.data?.id;
  if (!newUserId) {
    console.error('   FAILED to create user. Body:', JSON.stringify(create.data, null, 2));
    process.exit(1);
  }
  console.log(`   new userId=${newUserId}, name=${create.data?.data?.name}`);

  // Step 4: add to team
  console.log('\n4. Adding to team...');
  const membership = await api('POST', `/organizations/${ORG_ID}/teams/${TEAM_ID}/memberships`, {
    userId: newUserId,
    role: 'MEMBER',
    accepted: true,
  });
  console.log(`   status=${membership.status}`);
  if (membership.status >= 300) console.log(`   body=${JSON.stringify(membership.data, null, 2)}`);

  // Step 5: create Newport Beach schedule (Thu/Fri 9-5)
  console.log('\n5. Creating Newport Beach schedule (Thu/Fri 9-5)...');
  const sched = await api('POST', `/organizations/${ORG_ID}/users/${newUserId}/schedules`, {
    name: 'Newport Beach',
    timeZone: 'America/Los_Angeles',
    isDefault: true,
    availability: [
      { days: ['Thursday', 'Friday'], startTime: '09:00', endTime: '17:00' },
    ],
    overrides: [],
  });
  console.log(`   status=${sched.status}`);
  if (sched.status >= 300) console.log(`   body=${JSON.stringify(sched.data, null, 2)}`);

  // Step 6: re-add as host on assessment events
  console.log('\n6. Re-adding as host on assessment events...');
  const etList2 = await api('GET', `/organizations/${ORG_ID}/teams/${TEAM_ID}/event-types`);
  const events2 = etList2.data?.data || [];
  for (const slug of ASSESSMENT_SLUGS) {
    const et = events2.find((e) => e.slug === slug);
    if (!et) {
      console.log(`   skip: ${slug} not found`);
      continue;
    }
    const existing = (et.hosts || []).map((h) => ({
      userId: h.userId,
      mandatory: !!h.mandatory,
      priority: h.priority || 'medium',
    }));
    const newHosts = [...existing, { userId: newUserId, mandatory: false, priority: 'medium' }];
    const patch = await api('PATCH', `/organizations/${ORG_ID}/teams/${TEAM_ID}/event-types/${et.id}`, {
      hosts: newHosts,
    });
    console.log(`   ${slug} (${et.id}) hosts=${newHosts.map((h) => h.userId).join(',')} status=${patch.status}`);
  }

  console.log('\n=== DONE ===');
  console.log(`Old user ID: ${OLD_USER_ID}`);
  console.log(`New user ID: ${newUserId}`);
  console.log('Remember to update employees.calcom_user_id in Supabase.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
