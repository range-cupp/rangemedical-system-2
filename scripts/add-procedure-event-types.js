#!/usr/bin/env node
// scripts/add-procedure-event-types.js
// Creates PRP Procedure and Testosterone Pellet Procedure event types on Cal.com
// Dr. Burgess (Damien) only — fixed host, round-robin scheduling type

const API_KEY = 'cal_live_bb31571d015c6664d0e4f4f0beee8200';
const V2_BASE = 'https://api.cal.com/v2';
const ORG_ID = 204444;
const TEAM_ID = 207558;

const DAMIEN = 2197563;

const LOC_IN_PERSON = [{ type: 'address', address: 'Range Medical, 1901 Westcliff Dr Suite 9 & 10, Newport Beach, CA 92660', public: true }];

const EVENT_TYPES = [
  {
    slug: 'medical-procedure-prp',
    title: 'PRP Procedure',
    length: 60,
    desc: 'PRP (platelet-rich plasma) procedure with Dr. Burgess. Approximately 1 hour.',
    loc: LOC_IN_PERSON,
    hosts: [{ userId: DAMIEN, mandatory: true, priority: 'high' }],
  },
  {
    slug: 'medical-procedure-pellet',
    title: 'Testosterone Pellet Procedure',
    length: 60,
    desc: 'Testosterone pellet insertion procedure with Dr. Burgess. Approximately 1 hour.',
    loc: LOC_IN_PERSON,
    hosts: [{ userId: DAMIEN, mandatory: true, priority: 'high' }],
  },
];

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
  return res.json();
}

async function main() {
  console.log('=== Adding Procedure Event Types ===\n');

  for (const spec of EVENT_TYPES) {
    const body = {
      title: spec.title,
      slug: spec.slug,
      lengthInMinutes: spec.length,
      description: spec.desc,
      locations: spec.loc,
      schedulingType: 'ROUND_ROBIN',
      hosts: spec.hosts,
    };

    const result = await api('POST', `/organizations/${ORG_ID}/teams/${TEAM_ID}/event-types`, body);

    if (result.status === 'success') {
      const et = result.data;
      console.log(`  CREATED: ${spec.slug} (ID: ${et.id}) — ${spec.length}m, Dr. Burgess only`);
    } else {
      const err = result.error?.message || JSON.stringify(result);
      console.log(`  FAILED: ${spec.slug} — ${err}`);
    }

    await sleep(1000);
  }

  console.log('\nDone! Add the new event type IDs to EVENT_TYPE_ID_TO_SLUG in pages/api/webhooks/calcom.js');
}

main().catch(console.error);
