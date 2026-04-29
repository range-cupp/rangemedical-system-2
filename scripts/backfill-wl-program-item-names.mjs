#!/usr/bin/env node
// Backfill purchases with item_name = "Weight Loss Program" so patient profiles
// display the actual items purchased. Amount paid is never modified — the receipt
// description (which is PHI-safe) is preserved on the `description` column.
//
// Mapping rules:
//   - Specific override for James Baur 2026-04-25 → "Retatrutide — 2x 6mg" (per user)
//   - medication present, qty > 1: `${medication} Injection × ${qty}`
//   - medication present, qty = 1: `${medication} Weight Loss Injection`
//   - medication missing: `Compounded GLP-1 Injection`
//
// Usage:
//   node --env-file=.env.local scripts/backfill-wl-program-item-names.mjs           (dry-run)
//   node --env-file=.env.local scripts/backfill-wl-program-item-names.mjs --apply

import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Specific overrides keyed by purchase id — user provided exact breakdown.
const OVERRIDES = {
  '6b1903fc-4c0f-4377-afed-aa387e647d96': {
    item_name: 'Retatrutide — 2x 6mg',
    product_name: 'Retatrutide — 2x 6mg',
    medication: 'Retatrutide',
    quantity: 2,
  },
};

function buildItemName({ medication, quantity }) {
  const qty = Number(quantity) || 1;
  const med = (medication || '').trim();
  if (!med || med.toLowerCase() === 'tbd') return 'Compounded GLP-1 Injection';
  if (qty > 1) return `${med} Injection × ${qty}`;
  return `${med} Weight Loss Injection`;
}

async function main() {
  const { data: rows, error } = await supabase
    .from('purchases')
    .select('id, patient_name, purchase_date, item_name, product_name, description, medication, quantity, amount_paid, source, payment_method')
    .or('item_name.eq.Weight Loss Program,product_name.eq.Weight Loss Program');

  if (error) {
    console.error('Query error:', error);
    process.exit(1);
  }

  console.log(`Found ${rows.length} purchases with item_name/product_name = "Weight Loss Program"`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);

  let updates = 0, skipped = 0, errors = 0;
  for (const row of rows) {
    const override = OVERRIDES[row.id];
    let payload;
    if (override) {
      payload = { ...override };
    } else {
      const newName = buildItemName({ medication: row.medication, quantity: row.quantity });
      if (newName === row.item_name && newName === row.product_name) {
        skipped++;
        continue;
      }
      payload = { item_name: newName, product_name: newName };
    }

    console.log(
      `${APPLY ? 'UPDATE' : 'WOULD UPDATE'}  ${row.purchase_date}  $${(row.amount_paid ?? 0)
        .toString()
        .padStart(7)}  ${(row.patient_name || 'Unknown').padEnd(28)}  → ${payload.item_name}`
    );

    if (APPLY) {
      const { error: updErr } = await supabase
        .from('purchases')
        .update(payload)
        .eq('id', row.id);
      if (updErr) {
        console.error(`  ! update error for ${row.id}:`, updErr.message);
        errors++;
      } else {
        updates++;
      }
    } else {
      updates++;
    }
  }

  console.log(`\nSummary: ${updates} ${APPLY ? 'updated' : 'would update'}, ${skipped} unchanged, ${errors} errors`);
  if (!APPLY) console.log('Re-run with --apply to commit.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
