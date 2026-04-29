#!/usr/bin/env node
// One-shot cleanup: normalize the misspellings of "Administer" in stored sigs
// across prescriptions and patient_medications. Variants observed in prod:
//   - "Adminsiter"   (letter swap)
//   - "Adminisiter"  (extra "i")
//   - "Adminster"    (missing "i")
//
// Usage:
//   node scripts/fix-administer-typos.mjs           # dry run
//   node scripts/fix-administer-typos.mjs --apply   # actually update

import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

// Match any of the three typos, case-insensitive, only at a word boundary.
const TYPO_RE = /\b(Adminsiter|Adminisiter|Adminster)\b/gi;

function fix(sig) {
  if (!sig) return sig;
  return sig.replace(TYPO_RE, (match) => {
    // Preserve capitalization of the first letter.
    return match[0] === match[0].toUpperCase() ? 'Administer' : 'administer';
  });
}

const TABLES = ['prescriptions', 'patient_medications', 'protocols'];

const allChanges = [];
for (const tbl of TABLES) {
  const { data, error } = await supabase
    .from(tbl)
    .select('id, sig')
    .ilike('sig', '%admin%');
  if (error) { console.error(tbl, 'query failed:', error.message); continue; }
  for (const row of data) {
    const newSig = fix(row.sig);
    if (newSig !== row.sig) {
      allChanges.push({ table: tbl, id: row.id, old: row.sig, new: newSig });
    }
  }
}

if (allChanges.length === 0) {
  console.log('No "Adminsiter/Adminisiter/Adminster" rows found. Nothing to do.');
  process.exit(0);
}

console.log(`Will update ${allChanges.length} rows:\n`);
for (const c of allChanges) {
  console.log(`  [${c.table}] ${c.id.slice(0, 8)}`);
  console.log(`     old: ${c.old}`);
  console.log(`     new: ${c.new}\n`);
}

if (!APPLY) {
  console.log('Dry run. Re-run with --apply to update.');
  process.exit(0);
}

let ok = 0, fail = 0;
for (const c of allChanges) {
  const { error } = await supabase
    .from(c.table)
    .update({ sig: c.new, updated_at: new Date().toISOString() })
    .eq('id', c.id);
  if (error) { console.error(`  FAIL ${c.table}/${c.id}: ${error.message}`); fail++; }
  else ok++;
}
console.log(`\nDone. Updated ${ok}, failed ${fail}.`);
