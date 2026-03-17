#!/usr/bin/env node
// scripts/setup-iv-event-types.js
// Creates new Cal.com team event types for individual IV formulas
// Run: node scripts/setup-iv-event-types.js

const API_KEY = 'cal_live_bb31571d015c6664d0e4f4f0beee8200';
const V2_BASE = 'https://api.cal.com/v2';
const ORG_ID = 204444;
const TEAM_ID = 207558;

// IV nurses
const LILY = 2197567;
const DAMIEN = 2197563;

const LOC_IN_PERSON = [{ type: 'address', address: 'Range Medical, 1901 Westcliff Dr Suite 9 & 10, Newport Beach, CA 92660', public: true }];

function hosts(userIds) {
  return userIds.map((id) => ({ userId: id, mandatory: false, priority: 'medium' }));
}

const NEW_EVENT_TYPES = [
  // Range IV Signature Formulas (60 min each)
  { slug: 'range-iv-immune', title: 'Range IV — Immune Defense', length: 60, desc: 'Immune Defense IV: Vitamin C, Zinc, Glutathione, B-Complex, Magnesium. Immune support, antioxidant protection, and infection defense.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'range-iv-energy', title: 'Range IV — Energy & Vitality', length: 60, desc: 'Energy & Vitality IV: B12, B-Complex, L-Carnitine, Magnesium, Vitamin C. Energy production, reduced fatigue, and metabolic support.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'range-iv-recovery', title: 'Range IV — Muscle Recovery', length: 60, desc: 'Muscle Recovery & Performance IV: Amino Acids, Magnesium, B-Complex, Vitamin C, Glutathione. Muscle repair and recovery acceleration.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'range-iv-detox', title: 'Range IV — Detox & Cellular Repair', length: 60, desc: 'Detox & Cellular Repair IV: Glutathione, Vitamin C, NAC, Zinc, Magnesium. Liver support, oxidative stress defense, cellular repair.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },

  // Specialty IVs
  { slug: 'methylene-blue-iv', title: 'Methylene Blue IV', length: 60, desc: 'Methylene Blue IV infusion. Requires pre-screening blood work (G6PD, CMP, CBC). Mitochondrial support, cognitive enhancement.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'mb-combo-iv', title: 'MB + Vitamin C + Magnesium Combo IV', length: 120, desc: 'Methylene Blue + High-Dose Vitamin C + Magnesium combo IV. Requires pre-screening blood work (G6PD, CMP, CBC). Full mitochondrial + anti-inflammatory support.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'glutathione-iv', title: 'Glutathione IV', length: 60, desc: 'Glutathione IV push. Master antioxidant — detox, liver support, immune function, skin health.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },

  // High-Dose Vitamin C (individual event types by dose)
  { slug: 'vitamin-c-iv-25g', title: 'Vitamin C IV (25g)', length: 90, desc: 'High-dose Vitamin C 25g IV infusion. Requires pre-screening blood work (G6PD, CMP, CBC). Immune support, anti-oxidant.', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'vitamin-c-iv-50g', title: 'Vitamin C IV (50g)', length: 90, desc: 'High-dose Vitamin C 50g IV infusion. Requires pre-screening blood work (G6PD, CMP, CBC).', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
  { slug: 'vitamin-c-iv-75g', title: 'Vitamin C IV (75g)', length: 120, desc: 'High-dose Vitamin C 75g IV infusion. Requires pre-screening blood work (G6PD, CMP, CBC).', loc: LOC_IN_PERSON, hosts: hosts([LILY, DAMIEN]) },
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
  console.log('=== Creating New IV Event Types ===\n');
  console.log(`Org: ${ORG_ID}, Team: ${TEAM_ID}\n`);

  const results = [];

  for (const spec of NEW_EVENT_TYPES) {
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

  // Summary
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
  const failed = results.filter(r => r.action === 'failed').length;
  console.log(`\nCreated: ${created}, Failed: ${failed}`);
}

main().catch(console.error);
