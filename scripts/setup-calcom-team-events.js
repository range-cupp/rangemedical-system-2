#!/usr/bin/env node
// scripts/setup-calcom-team-events.js
// Creates 25 team event types with round-robin hosts under Range Medical Team
// Then hides old personal event types

const API_KEY = 'cal_live_bb31571d015c6664d0e4f4f0beee8200';
const V2_BASE = 'https://api.cal.com/v2';
const ORG_ID = 204444;
const TEAM_ID = 207558;

// Member IDs
const CHRIS = 2189658;
const DAMIEN = 2197563;
const LILY = 2197567;
const EVAN = 2197566;
const DAMON = 2197565;

const LOC_IN_PERSON = [{ type: 'address', address: 'Range Medical, 1901 Westcliff Dr Suite 9 & 10, Newport Beach, CA 92660', public: true }];
const LOC_VIDEO = [{ type: 'integration', integration: 'google-meet' }];
const LOC_PHONE = [{ type: 'phone', phone: '+19499973988', public: true }];

function hosts(userIds) {
  return userIds.map((id, i) => ({ userId: id, mandatory: false, priority: 'medium' }));
}

function fixedHost(userId) {
  return [{ userId, mandatory: true, priority: 'high' }];
}

const EVENT_TYPES = [
  // LAB / BLOOD DRAW
  { slug: 'new-patient-blood-draw', title: 'New Patient Blood Draw', length: 30, desc: 'Your first blood draw at Range Medical. We will collect labs for your initial panel.', loc: LOC_IN_PERSON, hosts: hosts([LILY, EVAN, DAMIEN]) },
  { slug: 'follow-up-blood-draw', title: 'Follow Up Blood Draw', length: 15, desc: 'Follow-up blood draw for existing patients.', loc: LOC_IN_PERSON, hosts: hosts([LILY, EVAN, DAMIEN]) },
  { slug: 'initial-lab-review', title: 'Initial Lab Review', length: 30, desc: 'Review your initial lab results with Dr. Burgess.', loc: LOC_IN_PERSON, hosts: fixedHost(DAMIEN) },
  { slug: 'follow-up-lab-review', title: 'Follow Up Lab Review', length: 30, desc: 'Follow-up lab review with Dr. Burgess.', loc: LOC_IN_PERSON, hosts: fixedHost(DAMIEN) },
  { slug: 'initial-lab-review-telemedicine', title: 'Initial Lab Review - Tele-Medicine', length: 30, desc: 'Virtual initial lab review with Dr. Burgess.', loc: LOC_VIDEO, hosts: fixedHost(DAMIEN) },
  { slug: 'follow-up-lab-review-telemedicine', title: 'Follow Up Lab Review - Tele-Medicine', length: 30, desc: 'Virtual follow-up lab review with Dr. Burgess.', loc: LOC_VIDEO, hosts: fixedHost(DAMIEN) },
  { slug: 'follow-up-lab-review-phone', title: 'Follow Up Lab Review - Telephone Call', length: 15, desc: 'Phone follow-up lab review with Dr. Burgess.', loc: LOC_PHONE, hosts: fixedHost(DAMIEN) },

  // INJECTIONS
  { slug: 'range-injections', title: 'Range Injections', length: 15, desc: 'Vitamin and nutrient injection appointment. Fast — in and out in 5 minutes.', loc: LOC_IN_PERSON, hosts: hosts([LILY, EVAN, DAMIEN]) },
  { slug: 'nad-injection', title: 'NAD+ Injection', length: 15, desc: 'NAD+ injection appointment.', loc: LOC_IN_PERSON, hosts: hosts([LILY, EVAN, DAMIEN]) },
  { slug: 'injection-testosterone', title: 'Injection - Testosterone', length: 15, desc: 'Testosterone injection appointment (HRT protocol).', loc: LOC_IN_PERSON, hosts: hosts([LILY, EVAN, DAMIEN]) },
  { slug: 'injection-weight-loss', title: 'Injection - Weight Loss', length: 15, desc: 'GLP-1 / weight loss injection appointment.', loc: LOC_IN_PERSON, hosts: hosts([LILY, EVAN, DAMIEN]) },
  { slug: 'injection-peptide', title: 'Injection - Peptide', length: 15, desc: 'Peptide injection appointment.', loc: LOC_IN_PERSON, hosts: hosts([LILY, EVAN, DAMIEN]) },
  { slug: 'injection-medical', title: 'Injection - Medical', length: 15, desc: 'Medical injection appointment.', loc: LOC_IN_PERSON, hosts: hosts([LILY, EVAN, DAMIEN]) },

  // THERAPIES
  { slug: 'hbot', title: 'Hyperbaric Oxygen Therapy (HBOT)', length: 60, desc: 'Hyperbaric oxygen therapy session at Range Medical.', loc: LOC_IN_PERSON, hosts: hosts([CHRIS, DAMON]) },
  { slug: 'red-light-therapy', title: 'Red Light Therapy', length: 30, desc: 'Red light therapy session at Range Medical.', loc: LOC_IN_PERSON, hosts: hosts([CHRIS, DAMON]) },

  // IV THERAPY
  { slug: 'range-iv', title: 'Range IV', length: 60, desc: 'IV therapy session. Your blend of vitamins and minerals customized to how you\'re feeling.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'nad-iv-250', title: 'NAD+ IV (250mg)', length: 60, desc: 'NAD+ IV infusion — 250mg dose. Approximately 1 hour.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'nad-iv-500', title: 'NAD+ IV (500mg)', length: 90, desc: 'NAD+ IV infusion — 500mg dose. Approximately 1.5 hours.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'nad-iv-750', title: 'NAD+ IV (750mg)', length: 120, desc: 'NAD+ IV infusion — 750mg dose. Approximately 2 hours.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'nad-iv-1000', title: 'NAD+ IV (1000mg)', length: 180, desc: 'NAD+ IV infusion — 1000mg dose. Approximately 3 hours.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'vitamin-c-iv', title: 'Vitamin C IV', length: 90, desc: 'High-dose Vitamin C IV infusion.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'specialty-iv', title: 'Specialty IV', length: 60, desc: 'Specialty IV therapy session.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },

  // CONSULTATIONS
  { slug: 'initial-consultation', title: 'Initial Consultation', length: 30, desc: 'Initial consultation with Dr. Burgess to discuss your health goals.', loc: LOC_IN_PERSON, hosts: fixedHost(DAMIEN) },
  { slug: 'initial-consultation-peptide', title: 'Initial Consultation - Peptide', length: 30, desc: 'Initial peptide therapy consultation with Dr. Burgess.', loc: LOC_IN_PERSON, hosts: fixedHost(DAMIEN) },
  { slug: 'follow-up-consultation', title: 'Follow-Up Consultation', length: 30, desc: 'Follow-up consultation with Dr. Burgess.', loc: LOC_IN_PERSON, hosts: fixedHost(DAMIEN) },
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
  console.log('=== Creating Team Event Types (Round-Robin) ===\n');
  console.log(`Org: ${ORG_ID}, Team: ${TEAM_ID}\n`);

  const results = [];

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
      const hostCount = (et.hosts || []).length;
      console.log(`  CREATED: ${spec.slug} (${et.id}) — ${spec.length}m, ${hostCount} hosts`);
      results.push({ ...spec, id: et.id, action: 'created' });
    } else {
      const err = result.error?.message || JSON.stringify(result);
      console.log(`  FAILED: ${spec.slug} — ${err}`);
      results.push({ ...spec, id: null, action: 'failed', error: err });
    }

    await sleep(1000);
  }

  // Now hide old personal event types
  console.log('\n--- Hiding old personal event types ---\n');
  const personalTypes = await api('GET', '/event-types');
  if (personalTypes.status === 'success') {
    for (const et of personalTypes.data) {
      if (!et.hidden) {
        const hideResult = await api('PATCH', `/event-types/${et.id}`, { hidden: true });
        console.log(`  HIDDEN: ${et.slug} (${et.id}) — ${hideResult.status}`);
        await sleep(500);
      }
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===\n');
  console.log('ID       | Slug                                     | Dur  | Hosts | Action');
  console.log('-'.repeat(90));
  for (const r of results) {
    const id = String(r.id || 'FAIL').padEnd(8);
    const slug = r.slug.padEnd(40);
    const dur = `${r.length}m`.padEnd(4);
    const h = (r.hosts || []).length;
    console.log(`${id} | ${slug} | ${dur} | ${h}     | ${r.action}`);
  }

  const created = results.filter(r => r.action === 'created').length;
  const failed = results.filter(r => r.action === 'failed').length;
  console.log(`\nCreated: ${created}, Failed: ${failed}`);
}

main().catch(console.error);
