// Second-pass fix for Lia & Trey Assad's GLOW protocols: populate
// doses_per_vial (GLOW = 30 injections/vial) and recompute end_date from
// num_vials × doses_per_vial at daily frequency. The first pass hardcoded
// end_date = today + 30 regardless of vial count.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = readFileSync('.env.local', 'utf-8');
for (const line of env.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const k = t.slice(0, eq);
  let v = t.slice(eq + 1);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const LIA_GLOW = '21c08189-aeb1-4057-9fd4-14e3bcb2452b'; // num_vials=2 → 60 days
const TREY_GLOW = '76f49d2c-adc6-417c-879f-0e5b7c2505bf'; // num_vials=1 → 30 days
const GLOW_DOSES_PER_VIAL = 30;
const FREQUENCY = 'Daily';

const DRY = process.argv.includes('--dry-run');
console.log(DRY ? '=== DRY RUN ===' : '=== LIVE RUN ===');

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

async function fixProtocol(id, numVials) {
  const { data: proto, error } = await s.from('protocols').select('*').eq('id', id).single();
  if (error) { console.error(`  FAIL read:`, error); return; }

  const totalDoses = numVials * GLOW_DOSES_PER_VIAL;
  const newEnd = addDays(proto.start_date || '2026-04-21', totalDoses); // daily = 1 per day

  console.log(`\n  ${proto.patient_name} protocol ${id.slice(0, 8)}:`);
  console.log(`    num_vials: ${proto.num_vials} (keep)`);
  console.log(`    doses_per_vial: ${proto.doses_per_vial} → ${GLOW_DOSES_PER_VIAL}`);
  console.log(`    frequency: ${proto.frequency} → ${FREQUENCY}`);
  console.log(`    end_date: ${proto.end_date} → ${newEnd} (${totalDoses} doses daily)`);

  if (DRY) return;

  const { error: upErr } = await s.from('protocols').update({
    doses_per_vial: GLOW_DOSES_PER_VIAL,
    frequency: FREQUENCY,
    end_date: newEnd,
    next_expected_date: newEnd,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (upErr) { console.error(`  FAIL update:`, upErr); return; }
  console.log(`    ✓ updated`);
}

await fixProtocol(LIA_GLOW, 2);
await fixProtocol(TREY_GLOW, 1);

console.log(DRY ? '\n(dry run — no changes written)' : '\n✅ Done.');
