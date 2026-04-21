// Fix: Lia Assad's 2026-04-21 GLOW Vial x3 purchase was incorrectly extended
// onto her existing TB4 protocol (fuzzy match on "TB-4" as a GLOW component).
// Correct outcome: Lia gets a proper GLOW protocol with num_vials=2,
// and 1 vial is transferred to Trey Assad as his own GLOW protocol.
//
// Steps:
//   1. Revert TB4 protocol 04972aef: end_date 2026-09-15 → 2026-08-16,
//      total_sessions 60 → 30, strip extension note.
//   2. Create Lia GLOW protocol (num_vials=2) linked to the GLOW purchase.
//   3. Create Trey GLOW protocol (num_vials=1, manual transfer, no purchase link).

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

const LIA_ID = '38e8eff3-56e1-4029-a757-e5ae52d3d2bf';
const TREY_ID = '8c273793-10f6-47a2-aab1-e36ee69108ed';
const TB4_PROTOCOL_ID = '04972aef-db0d-46e5-b736-fcf55ace4767';
const GLOW_PURCHASE_ID = 'c8a9568c-cfb5-45e9-b728-3ebbfb8cd893';
const GLOW_MED = 'GLOW (GHK-Cu / BPC-157 / TB-4)';

const DRY = process.argv.includes('--dry-run');
console.log(DRY ? '=== DRY RUN ===' : '=== LIVE RUN ===');

// 1. Revert TB4 protocol
console.log('\n[1] Reverting TB4 protocol extension...');
const tb4Update = {
  end_date: '2026-08-16',
  total_sessions: 30,
  notes: null,
  updated_at: new Date().toISOString(),
};
console.log('  update:', tb4Update);
if (!DRY) {
  const { error } = await s.from('protocols').update(tb4Update).eq('id', TB4_PROTOCOL_ID);
  if (error) { console.error('  FAIL:', error); process.exit(1); }
  console.log('  ✓ reverted');
}

// 2. Create Lia's GLOW protocol (num_vials=2)
console.log('\n[2] Creating Lia GLOW protocol (num_vials=2)...');
const today = '2026-04-21';
const in30 = new Date(today);
in30.setDate(in30.getDate() + 30);
const endStr = in30.toISOString().split('T')[0];

const liaGlow = {
  patient_id: LIA_ID,
  patient_name: 'Lia Assad',
  program_type: 'peptide',
  program_name: 'Peptide Protocol',
  medication: GLOW_MED,
  status: 'active',
  delivery_method: 'take_home',
  num_vials: 2,
  doses_per_vial: null,
  total_sessions: null,
  sessions_used: 0,
  start_date: today,
  end_date: endStr,
  next_expected_date: endStr,
  peptide_reminders_enabled: true,
  source: 'manual-fix',
  created_by: 'assad-glow-fix',
  notes: 'GLOW Vial x3 purchase 2026-04-21 split — Lia keeps 2, Trey receives 1 (see paired Trey protocol).',
};
console.log('  new protocol:', { medication: liaGlow.medication, num_vials: liaGlow.num_vials, end: liaGlow.end_date });

let liaGlowId = null;
if (!DRY) {
  const { data, error } = await s.from('protocols').insert(liaGlow).select('id').single();
  if (error) { console.error('  FAIL:', error); process.exit(1); }
  liaGlowId = data.id;
  console.log('  ✓ created', liaGlowId);

  // Re-link the GLOW purchase to the new protocol
  const { error: puErr } = await s.from('purchases').update({ protocol_id: liaGlowId }).eq('id', GLOW_PURCHASE_ID);
  if (puErr) { console.error('  FAIL re-link:', puErr); process.exit(1); }
  console.log('  ✓ re-linked purchase', GLOW_PURCHASE_ID.slice(0,8), '→ protocol', liaGlowId.slice(0,8));
}

// 3. Create Trey's GLOW protocol (num_vials=1)
console.log('\n[3] Creating Trey GLOW protocol (num_vials=1)...');
const treyGlow = {
  patient_id: TREY_ID,
  patient_name: 'Trey Assad',
  program_type: 'peptide',
  program_name: 'Peptide Protocol',
  medication: GLOW_MED,
  status: 'active',
  delivery_method: 'take_home',
  num_vials: 1,
  doses_per_vial: null,
  total_sessions: null,
  sessions_used: 0,
  start_date: today,
  end_date: endStr,
  next_expected_date: endStr,
  peptide_reminders_enabled: true,
  source: 'manual-fix',
  created_by: 'assad-glow-fix',
  notes: 'Transferred from Lia Assad\'s 2026-04-21 GLOW Vial x3 purchase (1 of 3 vials).',
};
console.log('  new protocol:', { medication: treyGlow.medication, num_vials: treyGlow.num_vials });

if (!DRY) {
  const { data, error } = await s.from('protocols').insert(treyGlow).select('id').single();
  if (error) { console.error('  FAIL:', error); process.exit(1); }
  console.log('  ✓ created', data.id);
}

console.log('\n✅ Done.', DRY ? '(no changes written — re-run without --dry-run)' : '');
