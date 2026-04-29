#!/usr/bin/env node
// Backfill staff notes from existing appointments.
//
// For every appointment that has a patient_id + visit_reason, ensure there's
// a corresponding internal staff note on the patient's profile. This mirrors
// what pages/api/appointments/create.js now does at booking time, so old
// appointments don't get left out.
//
// Dedupe: if an internal note already exists pointing at this appointment_id,
// we skip it (covers anything created via the new code path or a prior run).
//
// Usage:
//   node scripts/backfill-appointment-staff-notes.mjs           # dry run
//   node scripts/backfill-appointment-staff-notes.mjs --apply   # actually write

import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

async function fetchAll(table, columns, filterFn) {
  const PAGE = 1000;
  const all = [];
  let from = 0;
  while (true) {
    let query = supabase.from(table).select(columns).range(from, from + PAGE - 1);
    if (filterFn) query = filterFn(query);
    const { data, error } = await query;
    if (error) { console.error(table, 'fetch error:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

const appts = await fetchAll(
  'appointments',
  'id, patient_id, patient_name, service_name, visit_reason, notes, created_by, created_at, visit_group_id',
  (q) => q.not('patient_id', 'is', null).not('visit_reason', 'is', null),
);

const internalNotes = await fetchAll(
  'patient_notes',
  'id, appointment_id',
  (q) => q.eq('note_category', 'internal').not('appointment_id', 'is', null),
);

const notedApptIds = new Set(internalNotes.map(n => String(n.appointment_id)));

console.log(`Loaded ${appts.length} appointments with patient_id + visit_reason.`);
console.log(`Loaded ${internalNotes.length} internal notes already linked to an appointment.\n`);

// Group multi-service visits — one note per visit_group_id, anchored to the
// earliest appointment row so it matches what the live API does on booking.
const byGroup = new Map();   // visit_group_id → [appt, ...]
const singles = [];          // appts with no visit_group_id
for (const a of appts) {
  if (!a.visit_reason || !String(a.visit_reason).trim()) continue;
  if (a.visit_group_id) {
    const arr = byGroup.get(a.visit_group_id) || [];
    arr.push(a);
    byGroup.set(a.visit_group_id, arr);
  } else {
    singles.push(a);
  }
}

const toInsert = [];
const skipped = { alreadyNoted: 0, blankReason: 0 };

function buildBody(visit_reason, notes) {
  const vr = String(visit_reason || '').trim();
  const n = String(notes || '').trim();
  return n ? `${vr}\n\n${n}` : vr;
}

// Singles
for (const a of singles) {
  if (notedApptIds.has(String(a.id))) { skipped.alreadyNoted++; continue; }
  toInsert.push({
    patient_id: a.patient_id,
    body: buildBody(a.visit_reason, a.notes),
    raw_input: buildBody(a.visit_reason, a.notes),
    created_by: a.created_by || 'System',
    note_date: a.created_at || new Date().toISOString(),
    source: 'manual',
    note_category: 'internal',
    appointment_id: a.id,
    encounter_service: a.service_name || null,
    visit_group_id: null,
    status: 'signed',
    _patient_name: a.patient_name,
  });
}

// Multi-service visits
for (const [groupId, rows] of byGroup) {
  const sorted = rows.slice().sort((x, y) => new Date(x.created_at) - new Date(y.created_at));
  const primary = sorted[0];
  const alreadyHas = sorted.some(r => notedApptIds.has(String(r.id)));
  if (alreadyHas) { skipped.alreadyNoted++; continue; }
  const combinedService = sorted.map(r => r.service_name).filter(Boolean).join(' + ');
  toInsert.push({
    patient_id: primary.patient_id,
    body: buildBody(primary.visit_reason, primary.notes),
    raw_input: buildBody(primary.visit_reason, primary.notes),
    created_by: primary.created_by || 'System',
    note_date: primary.created_at || new Date().toISOString(),
    source: 'manual',
    note_category: 'internal',
    appointment_id: primary.id,
    encounter_service: combinedService || primary.service_name || null,
    visit_group_id: groupId,
    status: 'signed',
    _patient_name: primary.patient_name,
  });
}

console.log(`Notes to create: ${toInsert.length}`);
console.log(`Skipped (already have an internal note linked to this appointment): ${skipped.alreadyNoted}`);
console.log();

if (toInsert.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

console.log('--- Sample (first 10) ---');
for (const r of toInsert.slice(0, 10)) {
  const preview = r.body.replace(/\s+/g, ' ').slice(0, 90);
  console.log(`  ${(r._patient_name || '(unknown)').padEnd(28)} · ${(r.encounter_service || '').padEnd(28)} · ${preview}${r.body.length > 90 ? '…' : ''}`);
}
if (toInsert.length > 10) console.log(`  …and ${toInsert.length - 10} more.\n`);

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write changes.');
  process.exit(0);
}

console.log('\nApplying...');

const cleanInserts = toInsert.map(({ _patient_name, ...row }) => row);
let ok = 0, fail = 0;
for (let i = 0; i < cleanInserts.length; i += 100) {
  const batch = cleanInserts.slice(i, i + 100);
  const { error } = await supabase.from('patient_notes').insert(batch);
  if (error) { console.error(`  batch FAIL @ ${i}: ${error.message}`); fail += batch.length; }
  else ok += batch.length;
}
console.log(`Inserted: ${ok} ok, ${fail} failed.`);
