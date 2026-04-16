#!/usr/bin/env node
// scripts/add-calcom-brendyn.js
// Adds Brendyn Reed NP as a managed user in Cal.com org, adds to team, creates schedule

const API_KEY = process.env.CALCOM_API_KEY || 'cal_live_bb31571d015c6664d0e4f4f0beee8200';
const V2_BASE = 'https://api.cal.com/v2';
const ORG_ID = 204444;
const TEAM_ID = 207558;

async function api(method, path, body, apiVersion = '2024-06-14') {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'cal-api-version': apiVersion,
      'Content-Type': 'application/json',
    }
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
  console.log('=== Adding Brendyn Reed NP to Cal.com ===\n');

  // Step 1: Create managed user in the organization
  console.log('1. Creating managed user in org...');
  const createUser = await api('POST', `/organizations/${ORG_ID}/users`, {
    email: 'brendyn@range-medical.com',
    name: 'Brendyn Reed',
    autoAccept: true,
  });
  console.log('   Status:', createUser.status);
  console.log('   Response:', JSON.stringify(createUser.data, null, 2));

  let userId = createUser.data?.data?.id;

  // If user already exists, try to find them in the org
  if (!userId) {
    console.log('\n   User may already exist. Fetching org members...');
    const members = await api('GET', `/organizations/${ORG_ID}/users`);
    if (members.data?.data) {
      const brendyn = members.data.data.find(u =>
        u.email === 'brendyn@range-medical.com' ||
        (u.name && u.name.toLowerCase().includes('brendyn'))
      );
      if (brendyn) {
        userId = brendyn.id;
        console.log('   Found existing user:', userId);
      }
    }
  }

  if (!userId) {
    console.log('\n   Could not create or find user. Try alternative approach...');

    // Try inviting via team membership directly
    console.log('   Attempting team membership invite...');
    const invite = await api('POST', `/organizations/${ORG_ID}/teams/${TEAM_ID}/memberships`, {
      email: 'brendyn@range-medical.com',
      role: 'MEMBER',
    });
    console.log('   Invite status:', invite.status);
    console.log('   Invite response:', JSON.stringify(invite.data, null, 2));

    userId = invite.data?.data?.userId;
  }

  if (!userId) {
    console.error('\n   FAILED: Could not create user or get user ID.');
    console.log('   You may need to invite brendyn@range-medical.com manually via Cal.com dashboard.');
    console.log('   Once added, run this script again or note the user ID for the setup script.');
    process.exit(1);
  }

  console.log(`\n   SUCCESS: Brendyn Reed user ID = ${userId}`);

  // Step 2: Add to team (if not already)
  console.log('\n2. Adding to team...');
  const addToTeam = await api('POST', `/organizations/${ORG_ID}/teams/${TEAM_ID}/memberships`, {
    userId: userId,
    role: 'MEMBER',
    accepted: true,
  });
  console.log('   Status:', addToTeam.status);
  console.log('   Response:', JSON.stringify(addToTeam.data, null, 2));

  // Step 3: Create default Newport Beach schedule
  console.log('\n3. Creating Newport Beach schedule...');
  const schedule = await api('POST', `/organizations/${ORG_ID}/users/${userId}/schedules`, {
    name: 'Newport Beach',
    timeZone: 'America/Los_Angeles',
    isDefault: true,
    availability: [
      { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], startTime: '09:00', endTime: '17:00' },
    ],
    overrides: [],
  });
  console.log('   Status:', schedule.status);
  console.log('   Response:', JSON.stringify(schedule.data, null, 2));

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`User ID:  ${userId}`);
  console.log(`Email:    brendyn@range-medical.com`);
  console.log(`Name:     Brendyn Reed NP`);
  console.log(`Team:     ${TEAM_ID}`);
  console.log(`Schedule: Newport Beach (Mon-Fri 9am-5pm Pacific)`);
  console.log('\nIMPORTANT: Save this user ID. You will need it to add Brendyn as a host');
  console.log('on specific Cal.com event types (appointment services).');
}

main().catch(console.error);
