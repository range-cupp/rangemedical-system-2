#!/usr/bin/env node
// scripts/backfill-scheduling-from-calcom.mjs
// Range Medical — One-time backfill: populate the new scheduling tables from
// the existing Cal.com config + the hardcoded JS catalogs.
//
// SAFETY:
//  - READ-ONLY against Cal.com (no mutations to Cal.com)
//  - IDEMPOTENT: re-running this script is safe; it upserts by stable keys
//  - Does NOT touch `appointments` or `calcom_bookings` — only writes to the
//    new tables created in migrations/05032026-create-scheduling-tables.sql
//
// USAGE:
//   node scripts/backfill-scheduling-from-calcom.mjs            # all phases
//   node scripts/backfill-scheduling-from-calcom.mjs --dry-run  # preview only
//   node scripts/backfill-scheduling-from-calcom.mjs --phase=1  # one phase only
//
// Phases:
//   1. locations           (from lib/appointment-services.js LOCATIONS)
//   2. services            (from APPOINTMENT_SERVICES + Cal.com event types)
//   3. service_providers   (from PROVIDERS map + employees.calcom_user_id)
//   4. service_locations   (from LOCATION_ENABLED_CATEGORIES)
//   5. service_required_forms       (from REQUIRED_FORMS)
//   6. service_prep_instructions    (from PREP_INSTRUCTIONS)
//   7. service_automations          (from CALCOM_APPOINTMENT_ACTIONS in webhook)
//   8. provider_schedules           (from Cal.com user schedules API)

import { createClient } from '@supabase/supabase-js';
import {
  LOCATIONS,
  APPOINTMENT_SERVICES,
  PROVIDERS,
  REQUIRED_FORMS,
  PREP_INSTRUCTIONS,
  LOCATION_ENABLED_CATEGORIES,
  BLOOD_WORK_VALIDITY_DAYS,
} from '../lib/appointment-services.js';

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const PHASE_ARG = [...args].find(a => a.startsWith('--phase='));
const ONLY_PHASE = PHASE_ARG ? parseInt(PHASE_ARG.split('=')[1], 10) : null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_BASE_URL = 'https://api.cal.com/v2';
const CALCOM_ORG_ID = 204444;
const CALCOM_TEAM_ID = 207558;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const log = (...a) => console.log(...a);
const warn = (...a) => console.warn('⚠️ ', ...a);
const ok = (msg) => console.log(`   ✓ ${msg}`);
const phase = (n, title) => console.log(`\n━━━ Phase ${n}: ${title} ${'━'.repeat(Math.max(0, 60 - title.length))}`);

const shouldRun = (n) => ONLY_PHASE === null || ONLY_PHASE === n;

// ─────────────────────────────────────────────────────────────────────────────
// CALCOM_APPOINTMENT_ACTIONS — duplicated here to avoid importing the webhook
// (the webhook is a Next.js page handler that imports server-only modules).
// Keep this in sync with pages/api/webhooks/calcom.js.
// ─────────────────────────────────────────────────────────────────────────────
const CALCOM_APPOINTMENT_ACTIONS = {
  hbot: 'decrement',
  'red-light-therapy': 'decrement',
  'range-iv': 'decrement',
  'range-iv-immune': 'decrement',
  'range-iv-energy': 'decrement',
  'range-iv-recovery': 'decrement',
  'range-iv-detox': 'decrement',
  'nad-iv-225': 'decrement',
  'nad-iv-250': 'decrement',
  'nad-iv-500': 'decrement',
  'nad-iv-750': 'decrement',
  'nad-iv-1000': 'decrement',
  'vitamin-c-iv': 'decrement',
  'vitamin-c-iv-25g': 'decrement',
  'vitamin-c-iv-50g': 'decrement',
  'vitamin-c-iv-75g': 'decrement',
  'methylene-blue-iv': 'decrement',
  'mb-combo-iv': 'decrement',
  'glutathione-iv': 'decrement',
  'glutathione-iv-1g': 'decrement',
  'glutathione-iv-2g': 'decrement',
  'glutathione-iv-3g': 'decrement',
  'specialty-iv': 'decrement',
  'range-injections': 'decrement',
  'nad-injection': 'decrement',
  'injection-testosterone': 'track_visit',
  'injection-weight-loss': 'track_visit',
  'injection-peptide': 'track_visit',
  'range-assessment-injury': 'log',
  'range-assessment-energy': 'log',
  'range-assessment-both': 'log',
  'medical-procedure-prp': 'log',
  'medical-procedure-pellet': 'log',
  'initial-consultation': 'log',
  'follow-up-consultation': 'log',
  'follow-up-consultation-telemedicine': 'log',
  'follow-up-consultation-phone': 'log',
  'injection-medical': 'log',
  'new-patient-blood-draw': 'lab_journey',
  'follow-up-blood-draw': 'lab_journey',
  'initial-lab-review': 'lab_journey',
  'follow-up-lab-review': 'lab_journey',
  'initial-lab-review-telemedicine': 'lab_journey',
  'follow-up-lab-review-telemedicine': 'lab_journey',
  'follow-up-lab-review-phone': 'lab_journey',
};

// ─────────────────────────────────────────────────────────────────────────────
// Cal.com API helpers (read-only)
// ─────────────────────────────────────────────────────────────────────────────
async function calcomGet(path, apiVersion) {
  if (!CALCOM_API_KEY) {
    throw new Error('CALCOM_API_KEY required for Cal.com phases (8). Set env var or skip with --phase=N for an earlier phase.');
  }
  const res = await fetch(`${CALCOM_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${CALCOM_API_KEY}`,
      'cal-api-version': apiVersion,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cal.com GET ${path} → ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.data ?? json;
}

const getEventTypes = () =>
  calcomGet(`/organizations/${CALCOM_ORG_ID}/teams/${CALCOM_TEAM_ID}/event-types`, '2024-06-14');

const getTeamMemberships = () =>
  calcomGet(`/organizations/${CALCOM_ORG_ID}/teams/${CALCOM_TEAM_ID}/memberships`, '2024-06-14');

const getUserSchedules = (userId) =>
  calcomGet(`/organizations/${CALCOM_ORG_ID}/users/${userId}/schedules`, '2024-06-14');

// ─────────────────────────────────────────────────────────────────────────────
// Upsert helpers (no-op in dry-run)
// ─────────────────────────────────────────────────────────────────────────────
async function upsert(table, rows, conflictCols) {
  if (rows.length === 0) {
    log(`   (no rows to write to ${table})`);
    return;
  }
  if (DRY_RUN) {
    log(`   [dry-run] would upsert ${rows.length} row(s) into ${table}`);
    return;
  }
  const { error } = await sb.from(table).upsert(rows, { onConflict: conflictCols });
  if (error) throw new Error(`Upsert ${table} failed: ${error.message}`);
  ok(`upserted ${rows.length} row(s) into ${table}`);
}

async function deleteAndReplace(table, filter, rows) {
  if (DRY_RUN) {
    log(`   [dry-run] would replace ${table} where ${JSON.stringify(filter)} with ${rows.length} row(s)`);
    return;
  }
  let q = sb.from(table).delete();
  for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
  const { error: delErr } = await q;
  if (delErr) throw new Error(`Delete ${table} failed: ${delErr.message}`);
  if (rows.length > 0) {
    const { error: insErr } = await sb.from(table).insert(rows);
    if (insErr) throw new Error(`Insert ${table} failed: ${insErr.message}`);
  }
  ok(`replaced ${table} (${JSON.stringify(filter)}) with ${rows.length} row(s)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 — locations
// ─────────────────────────────────────────────────────────────────────────────
async function phase1Locations() {
  if (!shouldRun(1)) return;
  phase(1, 'locations');
  const rows = LOCATIONS.map((loc, i) => ({
    id: loc.id,
    name: loc.label,
    short_name: loc.short,
    address: loc.address ?? null,
    timezone: 'America/Los_Angeles',
    is_active: true,
    sort_order: i,
  }));
  await upsert('locations', rows, 'id');
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — services (combine local catalog + Cal.com event types for IDs)
// ─────────────────────────────────────────────────────────────────────────────
let CALCOM_EVENT_TYPES_CACHE = null; // shared with phase 3
async function phase2Services() {
  if (!shouldRun(2) && !shouldRun(3)) return; // phase 3 needs the same fetch
  phase(2, 'services');

  // Pull Cal.com event types so we can store legacy_calcom_event_type_id for matching
  let calcomBySlug = {};
  try {
    if (CALCOM_API_KEY) {
      CALCOM_EVENT_TYPES_CACHE = await getEventTypes();
      for (const et of CALCOM_EVENT_TYPES_CACHE) {
        if (et.slug) calcomBySlug[et.slug] = et;
      }
      ok(`fetched ${CALCOM_EVENT_TYPES_CACHE.length} event types from Cal.com`);
    } else {
      warn('CALCOM_API_KEY not set — proceeding without Cal.com event type IDs');
    }
  } catch (e) {
    warn(`Cal.com event types fetch failed: ${e.message} — continuing without IDs`);
  }

  if (!shouldRun(2)) return;

  const rows = [];
  let sortOrder = 0;
  for (const [groupLabel, items] of Object.entries(APPOINTMENT_SERVICES)) {
    for (const item of items) {
      const slug = item.calcomSlug || slugify(item.name);
      const calcom = calcomBySlug[slug];
      rows.push({
        name: item.name,
        slug,
        category: item.category,
        group_label: groupLabel,
        duration_minutes: item.duration,
        buffer_minutes: 0,
        min_notice_hours: 0,
        booking_window_days: 60,
        description: calcom?.description ?? null,
        has_modality: !!item.hasModality,
        allowed_modalities: item.allowedModalities ?? null,
        requires_blood_work: !!item.requiresBloodWork,
        blood_work_validity_days: item.requiresBloodWork ? BLOOD_WORK_VALIDITY_DAYS : null,
        subtype: item.subtype ?? null,
        color: null,
        is_active: true,
        is_public_bookable: false,
        sort_order: sortOrder++,
        legacy_calcom_event_type_id: calcom?.id ?? null,
      });
    }
  }
  await upsert('services', rows, 'slug');
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — service_providers (PROVIDERS map keyed by category)
// ─────────────────────────────────────────────────────────────────────────────
async function phase3ServiceProviders() {
  if (!shouldRun(3)) return;
  phase(3, 'service_providers');

  // Look up local services + employees once
  const { data: services, error: sErr } = await sb.from('services').select('id, slug, category');
  if (sErr) throw new Error(`Read services: ${sErr.message}`);
  const { data: employees, error: eErr } = await sb
    .from('employees')
    .select('id, name, calcom_user_id')
    .not('calcom_user_id', 'is', null);
  if (eErr) throw new Error(`Read employees: ${eErr.message}`);

  // calcomUsername → employee.id
  // PROVIDERS uses friendly usernames ('chris', 'damien', 'brendyn'). These
  // do NOT match what Cal.com's API returns (e.g. 'chris-cupp-acwuhk',
  // 'burgess', 'brendyn-range-medical'). The existing system bridges via the
  // hardcoded list in pages/api/bookings/provider-schedules.js — we mirror
  // that list here so the data model lines up exactly.
  const FRIENDLY_USERNAME_TO_CALCOM_USER_ID = {
    chris:   2189658,
    damien:  2197563,
    lily:    2197567,
    evan:    2197566,
    damon:   2197565,
    brendyn: 2383086,
  };

  const empByCalcomUserId = {};
  for (const emp of employees) empByCalcomUserId[emp.calcom_user_id] = emp.id;

  const usernameToEmpId = {};
  for (const [friendly, calcomUserId] of Object.entries(FRIENDLY_USERNAME_TO_CALCOM_USER_ID)) {
    const empId = empByCalcomUserId[calcomUserId];
    if (empId) usernameToEmpId[friendly] = empId;
    else warn(`friendly username "${friendly}" → calcom_user_id=${calcomUserId} but no employee row matches`);
  }
  ok(`bridged ${Object.keys(usernameToEmpId).length} friendly username(s) → employee(s)`);

  // services keyed by category
  const servicesByCategory = {};
  for (const svc of services) {
    if (!servicesByCategory[svc.category]) servicesByCategory[svc.category] = [];
    servicesByCategory[svc.category].push(svc);
  }

  const rows = [];
  const skipped = [];
  for (const [category, provs] of Object.entries(PROVIDERS)) {
    const matchingServices = servicesByCategory[category] || [];
    if (matchingServices.length === 0) {
      skipped.push(`category="${category}" has no services`);
      continue;
    }
    for (const svc of matchingServices) {
      provs.forEach((p, idx) => {
        const empId = usernameToEmpId[p.calcomUsername];
        if (!empId) {
          skipped.push(`username="${p.calcomUsername}" has no matching employee (service=${svc.slug})`);
          return;
        }
        const labelOverride = p.label && p.label !== p.name ? p.label : null;
        rows.push({
          service_id: svc.id,
          employee_id: empId,
          display_label: labelOverride,
          sort_order: idx,
        });
      });
    }
  }

  if (skipped.length > 0) {
    warn(`Skipped ${skipped.length} provider assignment(s):`);
    skipped.slice(0, 10).forEach(s => log(`     · ${s}`));
    if (skipped.length > 10) log(`     · …and ${skipped.length - 10} more`);
  }
  await upsert('service_providers', rows, 'service_id,employee_id');
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — service_locations
// LOCATION_ENABLED_CATEGORIES = ['iv'] currently. Services in other categories
// are bookable at all locations (represented by NO rows for that service).
// IV services get explicit rows for both Newport + Placentia.
// ─────────────────────────────────────────────────────────────────────────────
async function phase4ServiceLocations() {
  if (!shouldRun(4)) return;
  phase(4, 'service_locations');

  const { data: services, error } = await sb
    .from('services')
    .select('id, slug, category')
    .in('category', LOCATION_ENABLED_CATEGORIES);
  if (error) throw new Error(`Read services: ${error.message}`);

  const rows = [];
  for (const svc of services) {
    for (const loc of LOCATIONS) {
      rows.push({ service_id: svc.id, location_id: loc.id });
    }
  }
  await upsert('service_locations', rows, 'service_id,location_id');
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5 — service_required_forms
// ─────────────────────────────────────────────────────────────────────────────
async function phase5RequiredForms() {
  if (!shouldRun(5)) return;
  phase(5, 'service_required_forms');

  const { data: services, error } = await sb.from('services').select('id, slug, category');
  if (error) throw new Error(`Read services: ${error.message}`);

  const rows = [];
  for (const svc of services) {
    const forms = REQUIRED_FORMS[svc.category];
    if (!forms || forms.length === 0) continue;
    forms.forEach((formId, idx) => {
      rows.push({ service_id: svc.id, form_id: formId, sort_order: idx });
    });
  }
  await upsert('service_required_forms', rows, 'service_id,form_id');
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 6 — service_prep_instructions
// ─────────────────────────────────────────────────────────────────────────────
async function phase6PrepInstructions() {
  if (!shouldRun(6)) return;
  phase(6, 'service_prep_instructions');

  const { data: services, error } = await sb.from('services').select('id, slug');
  if (error) throw new Error(`Read services: ${error.message}`);

  const rows = [];
  for (const svc of services) {
    const prep = PREP_INSTRUCTIONS[svc.slug];
    if (!prep) continue;
    rows.push({
      service_id: svc.id,
      sms_body: prep.sms ?? null,
      email_subject: prep.subject ?? null,
      email_body: prep.email ?? null,
      send_hours_before: 24,
      is_active: true,
    });
  }
  await upsert('service_prep_instructions', rows, 'service_id');
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 7 — service_automations
// ─────────────────────────────────────────────────────────────────────────────
async function phase7Automations() {
  if (!shouldRun(7)) return;
  phase(7, 'service_automations');

  const { data: services, error } = await sb.from('services').select('id, slug');
  if (error) throw new Error(`Read services: ${error.message}`);

  const rows = [];
  for (const svc of services) {
    const action = CALCOM_APPOINTMENT_ACTIONS[svc.slug];
    if (!action) continue;
    rows.push({
      service_id: svc.id,
      action,
      config: {},
      is_active: true,
    });
  }
  await upsert('service_automations', rows, 'service_id,action');
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 8 — provider_schedules (from Cal.com)
// ─────────────────────────────────────────────────────────────────────────────
const DAY_NAME_TO_NUM = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

async function phase8ProviderSchedules() {
  if (!shouldRun(8)) return;
  phase(8, 'provider_schedules (from Cal.com)');

  if (!CALCOM_API_KEY) {
    warn('CALCOM_API_KEY not set — skipping. Run again with the env var to backfill schedules.');
    return;
  }

  const { data: employees, error: eErr } = await sb
    .from('employees')
    .select('id, name, calcom_user_id')
    .not('calcom_user_id', 'is', null);
  if (eErr) throw new Error(`Read employees: ${eErr.message}`);

  const { data: locations, error: lErr } = await sb.from('locations').select('id, short_name');
  if (lErr) throw new Error(`Read locations: ${lErr.message}`);

  // Match a Cal.com schedule.name to a location_id.
  // Default schedule (isDefault=true) → newport.
  // Schedules with "placentia" or "tlab" in the name → placentia.
  // Anything else falls back to newport so we don't silently lose hours
  // for providers whose Cal.com setup is non-standard (e.g., Brendyn's
  // "Working hours" schedule that isn't marked isDefault).
  function locationIdForSchedule(sched) {
    const name = (sched.name || '').toLowerCase();
    if (name.includes('placentia') || name.includes('tlab')) return 'placentia';
    if (sched.isDefault) return 'newport';
    warn(`schedule "${sched.name}" has no location keyword — defaulting to newport`);
    return 'newport';
  }

  let totalRows = 0;
  for (const emp of employees) {
    let schedules;
    try {
      schedules = await getUserSchedules(emp.calcom_user_id);
    } catch (e) {
      warn(`getUserSchedules(${emp.name} / ${emp.calcom_user_id}) failed: ${e.message}`);
      continue;
    }
    if (!schedules || schedules.length === 0) {
      log(`   (no schedules in Cal.com for ${emp.name})`);
      continue;
    }

    const rowsForEmployee = [];
    for (const sched of schedules) {
      const locationId = locationIdForSchedule(sched);
      if (!locationId) {
        warn(`unrecognized Cal.com schedule "${sched.name}" for ${emp.name} — skipping`);
        continue;
      }
      for (const block of (sched.availability || [])) {
        const start = normalizeTime(block.startTime);
        const end = normalizeTime(block.endTime);
        // Skip blocks where end <= start (Cal.com data errors). The DB has
        // a CHECK constraint that would reject these; warn and move on.
        if (!start || !end || end <= start) {
          warn(`${emp.name}: skipping invalid block ${block.startTime}–${block.endTime} on ${(block.days || []).join(',')}`);
          continue;
        }
        for (const dayName of (block.days || [])) {
          const dow = DAY_NAME_TO_NUM[String(dayName).toLowerCase()];
          if (dow === undefined) continue;
          rowsForEmployee.push({
            employee_id: emp.id,
            location_id: locationId,
            day_of_week: dow,
            start_time: start,
            end_time: end,
            effective_from: null,
            effective_until: null,
            is_active: true,
          });
        }
      }
    }

    // Cal.com sometimes returns overlapping/duplicate schedules (e.g., a
    // "Working hours" schedule that duplicates the default). Dedupe by the
    // logical key before insert so re-runs stay clean.
    const seen = new Set();
    const deduped = rowsForEmployee.filter(r => {
      const k = `${r.location_id}|${r.day_of_week}|${r.start_time}|${r.end_time}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // Replace this employee's schedules entirely (idempotent re-run safety)
    await deleteAndReplace('provider_schedules', { employee_id: emp.id }, deduped);
    totalRows += deduped.length;
  }
  ok(`total schedule rows written: ${totalRows}`);
}

function normalizeTime(t) {
  // Cal.com returns "HH:MM" or "HH:MM:SS" — Postgres TIME accepts both
  if (!t) return null;
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  return t;
}

// ─────────────────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  log(`Range Medical scheduling backfill — ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  log(`Target: ${SUPABASE_URL}`);
  if (ONLY_PHASE !== null) log(`Running only phase ${ONLY_PHASE}`);

  try {
    await phase1Locations();
    await phase2Services();
    await phase3ServiceProviders();
    await phase4ServiceLocations();
    await phase5RequiredForms();
    await phase6PrepInstructions();
    await phase7Automations();
    await phase8ProviderSchedules();

    log(`\n✅ Backfill complete${DRY_RUN ? ' (DRY RUN — no writes)' : ''}.`);
  } catch (e) {
    console.error(`\n❌ Backfill failed: ${e.message}`);
    console.error(e.stack);
    process.exit(1);
  }
})();
