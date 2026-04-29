#!/usr/bin/env node
// Backfill the `sig` field on every peptide protocol so patient-facing
// rx directions read consistently:
//   "Administer 1 Prefilled Syringe {Frequency}"
//
// Usage:
//   node scripts/backfill-peptide-sig.mjs           # dry run
//   node scripts/backfill-peptide-sig.mjs --apply   # actually update
//
// Overwrites any existing sig on peptide protocols — the format is the
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

function buildPeptideSig(frequency) {
  const freq = (frequency || '').trim();
  if (!freq) return null;
  return `Administer 1 Prefilled Syringe ${freq}`;
}

const { data: protocols, error } = await supabase
  .from('protocols')
  .select('id, patient_name, program_type, medication, frequency, sig, status')
  .eq('program_type', 'peptide')
  .order('start_date', { ascending: false, nullsFirst: false });

if (error) {
  console.error('Query failed:', error.message);
  process.exit(1);
}

console.log(`Scanned ${protocols.length} peptide protocols.\n`);

const changes = [];
const noFreq = [];
for (const p of protocols) {
  if (PRESERVE_IDS.has(p.id)) continue;

  if (!p.frequency) {
    noFreq.push(p);
    continue;
  }

  const newSig = buildPeptideSig(p.frequency);
  if (!newSig) {
    noFreq.push(p);
    continue;
  }
  if (p.sig === newSig) continue;

  changes.push({
    id: p.id,
    patient: p.patient_name || '(unknown)',
    med: p.medication || '',
    frequency: p.frequency,
    status: p.status,
    old_sig: p.sig || '(empty)',
    new_sig: newSig,
  });
}

if (changes.length === 0 && noFreq.length === 0) {
  console.log('Every peptide protocol already has the correct sig. Nothing to do.');
  process.exit(0);
}

if (changes.length) {
  console.log(`Will update ${changes.length} protocols:\n`);
  for (const c of changes) {
    console.log(
      `  ${c.id.slice(0, 8)} · ${String(c.patient).padEnd(28)} · ${(c.med || '').padEnd(28)} · ${String(c.frequency).padEnd(14)} · ${c.status}`
    );
    console.log(`     old: ${c.old_sig}`);
    console.log(`     new: ${c.new_sig}\n`);
  }
}

if (noFreq.length) {
  console.log(`\nSkipping ${noFreq.length} protocols with no frequency recorded:`);
  for (const p of noFreq) {
    console.log(`  ${p.id.slice(0, 8)} · ${p.patient_name || '(unknown)'} · ${p.medication || ''} · ${p.status}`);
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
