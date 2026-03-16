#!/usr/bin/env node
// Migration: Backfill peptide_identifier + sub_category in pos_services
// and rename peptide product names to generic "Peptide Therapy" format.
//
// Existing formats:
//   "BPC-157/TB4 — 10 Day (Take-Home)"    → name: "Peptide Therapy — 10 Day (Take-Home)", peptide_id: "BPC-157/TB4"
//   "MOTS-C — 20 Day Phase 1 (In-Clinic)" → name: "Peptide Therapy — 20 Day Phase 1 (In-Clinic)", peptide_id: "MOTS-C"
//   "2X CJC/Ipa — Phase 1 (Take-Home)"    → name: "Peptide Therapy — Phase 1 (Take-Home)", peptide_id: "2X CJC/Ipa"
//   "BPC-157 / TB-4 — 10-Day"             → name: "Peptide Therapy — 10-Day", peptide_id: "BPC-157 / TB-4"
//   "MOTS-C Phase 1"                       → name: "Peptide Therapy", peptide_id: "MOTS-C Phase 1"
//   "GHK-Cu Cream"                         → name: "Peptide Therapy", peptide_id: "GHK-Cu Cream"
//
// Run: node scripts/migrate-peptide-identifier.js
//   --dry-run to preview changes without writing

const fs = require('fs');
const path = require('path');

const isDryRun = process.argv.includes('--dry-run');

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex);
  let value = trimmed.slice(eqIndex + 1);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = value;
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log(`\nPeptide Identifier Migration${isDryRun ? ' (DRY RUN)' : ''}\n`);

  // Fetch all peptide rows
  const { data: peptides, error: fetchErr } = await supabase
    .from('pos_services')
    .select('*')
    .eq('category', 'peptide')
    .eq('active', true)
    .order('sort_order');

  if (fetchErr) {
    console.error('Fetch error:', fetchErr.message);
    process.exit(1);
  }

  console.log(`Found ${peptides.length} peptide rows to process.\n`);

  let updated = 0;
  let skipped = 0;

  for (const row of peptides) {
    // Skip if already backfilled
    if (row.peptide_identifier) {
      console.log(`  SKIP (already set): ${row.name} → peptide_id="${row.peptide_identifier}"`);
      skipped++;
      continue;
    }

    const name = row.name;
    let peptideId = null;
    let newName = null;
    let subCat = null;

    // Pattern: "PeptideName — Duration (Delivery)" e.g., "BPC-157/TB4 — 10 Day (Take-Home)"
    const dashMatch = name.match(/^(.+?)\s*—\s*(.+)$/);

    if (dashMatch) {
      // Has a " — " separator: first part is peptide, rest is duration/phase/delivery
      peptideId = dashMatch[1].trim();
      const suffix = dashMatch[2].trim();
      newName = `Peptide Therapy — ${suffix}`;

      // Sub-category: group by the duration part (strip delivery method for grouping)
      // e.g., "10 Day (Take-Home)" → sub_cat "Peptide Therapy — 10 Day"
      // e.g., "Phase 1 (Take-Home)" → sub_cat "Peptide Therapy — Phases"
      const durationMatch = suffix.match(/^(\d+[\s-]*Day)/i);
      if (durationMatch) {
        subCat = `Peptide Therapy — ${durationMatch[1].replace('-', ' ')}`;
      } else if (/phase/i.test(suffix)) {
        subCat = 'Peptide Therapy — Phases';
      } else {
        subCat = 'Peptide Therapy';
      }
    } else {
      // No " — " separator: entire name is the peptide identifier
      // e.g., "MOTS-C Phase 1", "GHK-Cu Cream"
      peptideId = name;
      newName = 'Peptide Therapy';
      subCat = 'Peptide Therapy';
    }

    if (isDryRun) {
      console.log(`  [dry] "${name}"`);
      console.log(`         → name="${newName}", peptide_id="${peptideId}", sub_cat="${subCat}"`);
    } else {
      const { error: updateErr } = await supabase
        .from('pos_services')
        .update({
          name: newName,
          peptide_identifier: peptideId,
          sub_category: subCat,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      if (updateErr) {
        console.log(`  ERROR: "${name}" — ${updateErr.message}`);
      } else {
        console.log(`  OK: "${name}" → name="${newName}", peptide_id="${peptideId}"`);
        updated++;
      }
    }
  }

  console.log(`\nDone! ${isDryRun ? 'Would update' : 'Updated'} ${isDryRun ? peptides.length - skipped : updated} of ${peptides.length} rows (${skipped} already set).`);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
