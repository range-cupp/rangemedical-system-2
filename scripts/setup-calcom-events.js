#!/usr/bin/env node
// scripts/setup-calcom-events.js
// Creates/updates all 25 Cal.com event types for Range Medical
// Usage: node scripts/setup-calcom-events.js

const API_KEY = 'cal_live_bb31571d015c6664d0e4f4f0beee8200';
const V2_BASE = 'https://api.cal.com/v2';
const LOCATION_IN_PERSON = [{ type: 'address', address: 'Range Medical, 1901 Westcliff Dr Suite 9 & 10, Newport Beach, CA 92660', public: true }];
const LOCATION_VIDEO = [{ type: 'integration', integration: 'google-meet' }];
const LOCATION_PHONE = [{ type: 'phone', phone: '+19499973988', public: true }];

// All 25 event types we need
const EVENT_TYPES = [
  // LAB / BLOOD DRAW
  { slug: 'new-patient-blood-draw', title: 'New Patient Blood Draw', length: 30, description: 'Your first blood draw at Range Medical. We will collect labs for your initial panel.', locations: LOCATION_IN_PERSON },
  { slug: 'follow-up-blood-draw', title: 'Follow Up Blood Draw', length: 15, description: 'Follow-up blood draw for existing patients.', locations: LOCATION_IN_PERSON },
  { slug: 'initial-lab-review', title: 'Initial Lab Review', length: 30, description: 'Review your initial lab results with Dr. Burgess.', locations: LOCATION_IN_PERSON },
  { slug: 'follow-up-lab-review', title: 'Follow Up Lab Review', length: 30, description: 'Follow-up lab review with Dr. Burgess.', locations: LOCATION_IN_PERSON },
  { slug: 'initial-lab-review-telemedicine', title: 'Initial Lab Review - Tele-Medicine', length: 30, description: 'Virtual initial lab review with Dr. Burgess.', locations: LOCATION_VIDEO },
  { slug: 'follow-up-lab-review-telemedicine', title: 'Follow Up Lab Review - Tele-Medicine', length: 30, description: 'Virtual follow-up lab review with Dr. Burgess.', locations: LOCATION_VIDEO },
  { slug: 'follow-up-lab-review-phone', title: 'Follow Up Lab Review - Telephone Call', length: 15, description: 'Phone follow-up lab review with Dr. Burgess.', locations: LOCATION_PHONE },

  // INJECTIONS
  { slug: 'range-injections', title: 'Range Injections', length: 15, description: 'Vitamin and nutrient injection appointment. Fast — in and out in 5 minutes.', locations: LOCATION_IN_PERSON },
  { slug: 'nad-injection', title: 'NAD+ Injection', length: 15, description: 'NAD+ injection appointment.', locations: LOCATION_IN_PERSON },
  { slug: 'injection-testosterone', title: 'Injection - Testosterone', length: 15, description: 'Testosterone injection appointment (HRT protocol).', locations: LOCATION_IN_PERSON },
  { slug: 'injection-weight-loss', title: 'Injection - Weight Loss', length: 15, description: 'GLP-1 / weight loss injection appointment.', locations: LOCATION_IN_PERSON },
  { slug: 'injection-peptide', title: 'Injection - Peptide', length: 15, description: 'Peptide injection appointment.', locations: LOCATION_IN_PERSON },
  { slug: 'injection-medical', title: 'Injection - Medical', length: 15, description: 'Medical injection appointment.', locations: LOCATION_IN_PERSON },

  // THERAPIES
  { slug: 'hbot', title: 'Hyperbaric Oxygen Therapy (HBOT)', length: 60, description: 'Hyperbaric oxygen therapy session at Range Medical.', locations: LOCATION_IN_PERSON },
  { slug: 'red-light-therapy', title: 'Red Light Therapy', length: 30, description: 'Red light therapy session at Range Medical.', locations: LOCATION_IN_PERSON },

  // IV THERAPY
  { slug: 'range-iv', title: 'Range IV', length: 60, description: 'IV therapy session. Your blend of vitamins and minerals customized to how you\'re feeling.', locations: LOCATION_IN_PERSON },
  { slug: 'nad-iv-250', title: 'NAD+ IV (250mg)', length: 60, description: 'NAD+ IV infusion — 250mg dose. Approximately 1 hour.', locations: LOCATION_IN_PERSON },
  { slug: 'nad-iv-500', title: 'NAD+ IV (500mg)', length: 90, description: 'NAD+ IV infusion — 500mg dose. Approximately 1.5 hours.', locations: LOCATION_IN_PERSON },
  { slug: 'nad-iv-750', title: 'NAD+ IV (750mg)', length: 120, description: 'NAD+ IV infusion — 750mg dose. Approximately 2 hours.', locations: LOCATION_IN_PERSON },
  { slug: 'nad-iv-1000', title: 'NAD+ IV (1000mg)', length: 180, description: 'NAD+ IV infusion — 1000mg dose. Approximately 3 hours.', locations: LOCATION_IN_PERSON },
  { slug: 'vitamin-c-iv', title: 'Vitamin C IV', length: 90, description: 'High-dose Vitamin C IV infusion.', locations: LOCATION_IN_PERSON },
  { slug: 'specialty-iv', title: 'Specialty IV', length: 60, description: 'Specialty IV therapy session.', locations: LOCATION_IN_PERSON },

  // CONSULTATIONS
  { slug: 'initial-consultation', title: 'Initial Consultation', length: 30, description: 'Initial consultation with Dr. Burgess to discuss your health goals.', locations: LOCATION_IN_PERSON },
  { slug: 'initial-consultation-peptide', title: 'Initial Consultation - Peptide', length: 30, description: 'Initial peptide therapy consultation with Dr. Burgess.', locations: LOCATION_IN_PERSON },
  { slug: 'follow-up-consultation', title: 'Follow-Up Consultation', length: 30, description: 'Follow-up consultation with Dr. Burgess.', locations: LOCATION_IN_PERSON },
];

// Slugs that are NOT in our 25-type plan — should be hidden
const OBSOLETE_SLUGS = [
  'range-assessment', 'therapeutic-phlebotomy', 'blood-draw-elite', 'blood-draw-essential',
  'medication-pickup', 'prp-injection', 'dexa-scan', 'exosome-iv',
  'conversation-range-team', 'peptide-initial', 'peptide-follow-up', 'byo-iv',
  'testosterone-pellet', 'hyperbaric-oxygen-therapy',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function v2Get(path) {
  const res = await fetch(`${V2_BASE}${path}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'cal-api-version': '2024-06-14',
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

async function v2Patch(path, body) {
  const res = await fetch(`${V2_BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'cal-api-version': '2024-06-14',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function v2Post(path, body) {
  const res = await fetch(`${V2_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'cal-api-version': '2024-06-14',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function main() {
  console.log('=== Cal.com Event Types Setup — Range Medical ===\n');

  // Step 1: Fetch all existing event types
  console.log('Step 1: Fetching existing event types...');
  const existing = await v2Get('/event-types');
  if (existing.status !== 'success') {
    console.error('Failed to fetch event types:', existing);
    process.exit(1);
  }

  const existingMap = {};
  for (const et of existing.data) {
    existingMap[et.slug] = et;
  }
  console.log(`  Found ${existing.data.length} existing event types\n`);

  // Step 2: Hide obsolete event types
  console.log('Step 2: Hiding obsolete event types...');
  for (const slug of OBSOLETE_SLUGS) {
    const et = existingMap[slug];
    if (et && !et.hidden) {
      const result = await v2Patch(`/event-types/${et.id}`, { hidden: true });
      console.log(`  HIDDEN: ${slug} (${et.id}) — ${result.status}`);
      await sleep(500);
    } else if (et && et.hidden) {
      console.log(`  already hidden: ${slug} (${et.id})`);
    } else {
      console.log(`  not found: ${slug}`);
    }
  }
  console.log('');

  // Step 3: Update existing / create new event types
  console.log('Step 3: Creating/updating 25 event types...\n');
  const results = [];

  for (const spec of EVENT_TYPES) {
    const existing = existingMap[spec.slug];

    if (existing) {
      // Update existing event type
      const updates = {
        title: spec.title,
        lengthInMinutes: spec.length,
        description: spec.description,
        locations: spec.locations,
        hidden: false,
      };

      const result = await v2Patch(`/event-types/${existing.id}`, updates);
      if (result.status === 'success') {
        console.log(`  UPDATED: ${spec.slug} (${existing.id}) — ${spec.length}m`);
        results.push({ ...spec, id: existing.id, action: 'updated' });
      } else {
        console.log(`  FAILED to update ${spec.slug}:`, result.error?.message || result);
        results.push({ ...spec, id: existing.id, action: 'update_failed', error: result.error?.message });
      }
    } else {
      // Create new event type
      const body = {
        title: spec.title,
        slug: spec.slug,
        lengthInMinutes: spec.length,
        description: spec.description,
        locations: spec.locations,
      };

      const result = await v2Post('/event-types', body);
      if (result.status === 'success') {
        const newId = result.data?.id;
        console.log(`  CREATED: ${spec.slug} (${newId}) — ${spec.length}m`);
        results.push({ ...spec, id: newId, action: 'created' });
      } else {
        console.log(`  FAILED to create ${spec.slug}:`, result.error?.message || result);
        results.push({ ...spec, id: null, action: 'create_failed', error: result.error?.message });
      }
    }

    await sleep(800); // Rate limit protection
  }

  // Step 4: Print summary
  console.log('\n=== SUMMARY ===\n');
  console.log('ID       | Slug                                     | Dur  | Action');
  console.log('-'.repeat(80));
  for (const r of results) {
    const id = String(r.id || 'FAIL').padEnd(8);
    const slug = r.slug.padEnd(40);
    const dur = `${r.length}m`.padEnd(4);
    console.log(`${id} | ${slug} | ${dur} | ${r.action}`);
  }

  const created = results.filter(r => r.action === 'created').length;
  const updated = results.filter(r => r.action === 'updated').length;
  const failed = results.filter(r => r.action.includes('failed')).length;
  console.log(`\nCreated: ${created}, Updated: ${updated}, Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed items:');
    results.filter(r => r.action.includes('failed')).forEach(r => {
      console.log(`  ${r.slug}: ${r.error}`);
    });
  }
}

main().catch(console.error);
