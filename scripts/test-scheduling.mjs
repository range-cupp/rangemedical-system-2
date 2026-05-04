#!/usr/bin/env node
// scripts/test-scheduling.mjs
// Range Medical — verify lib/scheduling.js against real production data.
//
// USAGE:
//   node scripts/test-scheduling.mjs                    # smoke test (default)
//   node scripts/test-scheduling.mjs hbot 2026-05-11    # specific service+date
//   node scripts/test-scheduling.mjs all                # iterate every service for tomorrow

import {
  getServiceBySlug,
  getServiceProviders,
  getAvailableSlots,
  pickProviderForSlot,
  isSlotAvailable,
  _internals,
} from '../lib/scheduling.js';

const args = process.argv.slice(2);
const PT = 'America/Los_Angeles';

function todayPT() {
  return new Date().toLocaleDateString('en-CA', { timeZone: PT });
}
function tomorrowPT() {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  return d.toLocaleDateString('en-CA', { timeZone: PT });
}

function fmt(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: PT, hour: 'numeric', minute: '2-digit',
  });
}

async function smokeTest() {
  console.log('━━━ Smoke test ━━━');
  console.log(`Today (PT): ${todayPT()}, day_of_week=${_internals.dayOfWeekPacific(todayPT())}`);

  // 1. Service lookup
  const hbot = await getServiceBySlug('hbot');
  console.log(`\n1. getServiceBySlug('hbot') →`, hbot ? `✓ ${hbot.name} (${hbot.duration_minutes}min, buffer=${hbot.buffer_minutes}min)` : '❌ not found');

  // 2. Provider lookup
  const provs = await getServiceProviders('hbot');
  console.log(`\n2. getServiceProviders('hbot') → ${provs.length} provider(s):`);
  for (const p of provs) console.log(`   · ${p.displayLabel} (employeeId=${p.employeeId})`);

  // 3. Available slots tomorrow
  const tomorrow = tomorrowPT();
  console.log(`\n3. getAvailableSlots(hbot, ${tomorrow}):`);
  const result = await getAvailableSlots({ serviceSlug: 'hbot', date: tomorrow });
  const combined = result.slots[tomorrow];
  console.log(`   Combined: ${combined.length} slot(s)`);
  if (combined.length > 0) {
    const first5 = combined.slice(0, 5).map(s => fmt(s.start)).join(', ');
    const last2  = combined.slice(-2).map(s => fmt(s.start)).join(', ');
    console.log(`   First 5:  ${first5}`);
    console.log(`   Last 2:   ${last2}`);
  }
  console.log(`   By provider:`);
  for (const [empId, slots] of Object.entries(result.byProvider)) {
    const prov = provs.find(p => p.employeeId === empId);
    console.log(`     · ${prov?.displayLabel || empId}: ${slots.length} slot(s)`);
  }

  // 4. Round-robin pick for the first available slot
  if (combined.length > 0) {
    const firstSlot = combined[0].start;
    console.log(`\n4. pickProviderForSlot(hbot, ${fmt(firstSlot)}):`);
    const pick = await pickProviderForSlot({ serviceSlug: 'hbot', startISO: firstSlot });
    console.log(`   →`, pick ? `${pick.displayLabel} (least busy)` : '❌ no provider available');

    if (pick) {
      const ok = await isSlotAvailable({
        serviceSlug: 'hbot', employeeId: pick.employeeId, startISO: firstSlot,
      });
      console.log(`\n5. isSlotAvailable(hbot, ${pick.displayLabel}, ${fmt(firstSlot)}): ${ok ? '✓ yes' : '❌ no'}`);
    }
  }

  // 6. Edge case: yesterday should return empty
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString('en-CA', { timeZone: PT });
  console.log(`\n6. getAvailableSlots(hbot, ${yesterday}) — should be empty (past):`);
  const past = await getAvailableSlots({ serviceSlug: 'hbot', date: yesterday });
  console.log(`   reason: ${past.reason}, slots: ${past.slots[yesterday].length}`);
}

async function specificTest(slug, date) {
  console.log(`━━━ ${slug} on ${date} ━━━`);
  const svc = await getServiceBySlug(slug);
  if (!svc) {
    console.log(`❌ unknown service "${slug}"`);
    return;
  }
  console.log(`Service: ${svc.name} — ${svc.duration_minutes}min, buffer ${svc.buffer_minutes}min, min notice ${svc.min_notice_hours}h`);

  const result = await getAvailableSlots({ serviceSlug: slug, date });
  const slots = result.slots[date] || [];
  console.log(`\n${slots.length} slot(s) available:`);
  for (const s of slots) console.log(`  ${fmt(s.start)} – ${fmt(s.end)}`);

  if (Object.keys(result.byProvider).length > 0) {
    console.log(`\nBy provider:`);
    for (const [empId, ps] of Object.entries(result.byProvider)) {
      const provs = await getServiceProviders(slug);
      const name = provs.find(p => p.employeeId === empId)?.displayLabel || empId;
      console.log(`  ${name}: ${ps.length} slot(s) — ${ps.slice(0, 3).map(s => fmt(s.start)).join(', ')}${ps.length > 3 ? '…' : ''}`);
    }
  }
}

async function allTomorrow() {
  const date = tomorrowPT();
  console.log(`━━━ All services for ${date} ━━━`);
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: services } = await sb.from('services').select('slug').eq('is_active', true).order('slug');

  let totalSlots = 0;
  let servicesWithNoProviders = 0;
  for (const { slug } of services) {
    const r = await getAvailableSlots({ serviceSlug: slug, date });
    const n = (r.slots[date] || []).length;
    totalSlots += n;
    if (r.reason === 'no_providers') servicesWithNoProviders++;
    const flag = r.reason ? ` (${r.reason})` : '';
    console.log(`  ${slug.padEnd(40)} ${String(n).padStart(3)} slot(s)${flag}`);
  }
  console.log(`\nTotal slots across all services: ${totalSlots}`);
  if (servicesWithNoProviders > 0) {
    console.log(`Services with no eligible providers: ${servicesWithNoProviders}`);
  }
}

(async () => {
  try {
    if (args[0] === 'all') {
      await allTomorrow();
    } else if (args.length === 2) {
      await specificTest(args[0], args[1]);
    } else {
      await smokeTest();
    }
  } catch (e) {
    console.error('❌ Test failed:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
