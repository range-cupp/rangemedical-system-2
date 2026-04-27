#!/usr/bin/env node
// Backfill the `sig` field on every weight_loss protocol so patient-facing
// rx directions read consistently:
//   "Administer {dose} subcutaneously one time weekly"
//
// Usage:
//   node scripts/backfill-weight-loss-sig.mjs           # dry run
//   node scripts/backfill-weight-loss-sig.mjs --apply   # actually update
//
// Overwrites any existing sig on weight_loss protocols — the format is the
// new clinic standard. If you need to preserve a hand-edited sig on a
// specific record, add its id to PRESERVE_IDS below.

import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const PRESERVE_IDS = new Set([
  // 'uuid-here', // example: keep custom sig as-is
]);

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

// Match doses like "0.25mg", "2.5mg", "10mg" — optionally with a trailing
// "/week" suffix that we'll strip since the sig already says "weekly".
const DOSE_RE = /^(\d+(?:\.\d+)?)\s*mg(?:\s*\/\s*(?:week|wk))?$/i;

function normalizeDose(raw) {
  const cleaned = (raw || '').trim();
  if (!cleaned) return null;
  const m = cleaned.match(DOSE_RE);
  if (!m) return null;
  return `${m[1]}mg`;
}

function buildWeightLossSig(dose) {
  const normalized = normalizeDose(dose);
  if (!normalized) return null;
  return `Administer ${normalized} subcutaneously one time weekly`;
}

const { data: protocols, error } = await supabase
  .from('protocols')
  .select('id, patient_name, program_type, medication, selected_dose, current_dose, starting_dose, sig, status')
  .eq('program_type', 'weight_loss')
  .order('start_date', { ascending: false, nullsFirst: false });

if (error) {
  console.error('Query failed:', error.message);
  process.exit(1);
}

console.log(`Scanned ${protocols.length} weight_loss protocols.\n`);

const changes = [];
const noDose = [];
const badDose = [];
for (const p of protocols) {
  if (PRESERVE_IDS.has(p.id)) continue;

  const dose = p.selected_dose || p.current_dose || p.starting_dose;
  if (!dose) {
    noDose.push(p);
    continue;
  }

  const newSig = buildWeightLossSig(dose);
  if (!newSig) {
    // Dose exists but isn't a clean "Xmg" value — skip rather than write
    // a sig that reads "Administer TBD subcutaneously one time weekly".
    badDose.push({ ...p, dose });
    continue;
  }
  if (p.sig === newSig) continue;

  changes.push({
    id: p.id,
    patient: p.patient_name || '(unknown)',
    med: p.medication || '',
    dose,
    status: p.status,
    old_sig: p.sig || '(empty)',
    new_sig: newSig,
  });
}

if (changes.length === 0 && noDose.length === 0 && badDose.length === 0) {
  console.log('Every weight_loss protocol already has the correct sig. Nothing to do.');
  process.exit(0);
}

if (changes.length) {
  console.log(`Will update ${changes.length} protocols:\n`);
  for (const c of changes) {
    console.log(
      `  ${c.id.slice(0, 8)} · ${String(c.patient).padEnd(28)} · ${(c.med || '').padEnd(13)} · ${c.dose.padEnd(8)} · ${c.status}`
    );
    console.log(`     old: ${c.old_sig}`);
    console.log(`     new: ${c.new_sig}\n`);
  }
}

if (noDose.length) {
  console.log(`\nSkipping ${noDose.length} protocols with no dose recorded:`);
  for (const p of noDose) {
    console.log(`  ${p.id.slice(0, 8)} · ${p.patient_name || '(unknown)'} · ${p.medication || ''} · ${p.status}`);
  }
}

if (badDose.length) {
  console.log(`\nSkipping ${badDose.length} protocols with non-numeric dose (likely placeholder/legacy data):`);
  for (const p of badDose) {
    console.log(`  ${p.id.slice(0, 8)} · ${p.patient_name || '(unknown)'} · ${p.medication || ''} · dose="${p.dose}" · ${p.status}`);
  }
}

if (!APPLY) {
  console.log(`\nDry run. Re-run with --apply to update ${changes.length} protocols.`);
  process.exit(0);
}

console.log(`\nApplying updates...`);
let ok = 0, fail = 0;
for (const c of changes) {
  const { error: updErr } = await supabase
    .from('protocols')
    .update({ sig: c.new_sig, updated_at: new Date().toISOString() })
    .eq('id', c.id);
  if (updErr) { console.error(`  FAIL ${c.id}: ${updErr.message}`); fail++; }
  else ok++;
}
console.log(`\nDone. Updated ${ok}, failed ${fail}.`);
