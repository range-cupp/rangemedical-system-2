#!/usr/bin/env node
// Two-pass backfill that establishes one source of truth between protocols
// and prescriptions:
//
//   Pass 1 — Link existing prescriptions to a matching protocol when one
//            exists for the same patient + medication. We only set
//            protocol_id; we don't overwrite the rx's stored fields.
//   Pass 2 — For every active take-home protocol (peptide / weight_loss /
//            HRT) that does not yet have a linked prescription, create a
//            draft prescription tied to it.
//
// The patient page already prefers the linked protocol's medication / dose
// / sig at render time, so once this runs, both UI sections show the same
// values.
//
// Usage:
//   node scripts/backfill-prescription-protocol-link.mjs           # dry run
//   node scripts/backfill-prescription-protocol-link.mjs --apply   # actually update

import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

// Loose tokenization — strip dashes, slashes, parentheses so "BPC157/TB4" and
// "BPC-157/TB4 (Thymosin Beta 4)" collapse to the same key.
function medKey(s) {
  if (!s) return '';
  return s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[\s\-/]/g, '').trim();
}

function categoryOf(protocol) {
  const raw = (protocol?.program_type || '').toLowerCase();
  if (raw === 'hrt' || raw === 'hrt_male' || raw === 'hrt_female' || raw.includes('testosterone')) return 'hrt';
  if (raw.includes('weight')) return 'weight_loss';
  if (raw === 'peptide' || raw.includes('peptide')) return 'peptide';
  return raw;
}

function deriveForm(protocol) {
  const supply = (protocol.supply_type || '').toLowerCase();
  if (supply.includes('prefilled') || supply.includes('syringe')) return 'Prefilled Syringe';
  if (supply.includes('vial')) return 'Vial';
  const cat = categoryOf(protocol);
  if (cat === 'peptide') return 'Prefilled Syringe';
  if (cat === 'weight_loss') return 'Prefilled Syringe';
  if (cat === 'hrt') return 'Solution';
  return null;
}

const PLACEHOLDER_NAMES = new Set(['weight loss program', 'peptide protocol', 'hrt protocol', 'lab panel', 'tbd']);

function shouldAutoPrescribe(protocol) {
  if (!protocol) return false;
  const cat = categoryOf(protocol);
  if (!['hrt', 'weight_loss', 'peptide'].includes(cat)) return false;
  const med = (protocol.medication || '').trim();
  if (!med) return false;
  if (PLACEHOLDER_NAMES.has(med.toLowerCase())) return false;
  if (protocol.delivery_method === 'in_clinic') return false;
  if (protocol.status !== 'active') return false;
  const hasDose = protocol.selected_dose || protocol.starting_dose || protocol.current_dose;
  if (!hasDose && !protocol.sig) return false;
  return true;
}

// ── Load data (paginate; Supabase caps at 1000 by default) ───────────────
async function fetchAll(table, columns) {
  const PAGE = 1000;
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + PAGE - 1);
    if (error) { console.error(table, 'fetch error:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

const rxRows = await fetchAll('prescriptions', 'id, patient_id, medication_name, protocol_id, status, created_at');
const protocols = await fetchAll('protocols', 'id, patient_id, patient_name, medication, selected_dose, starting_dose, current_dose, sig, frequency, program_type, supply_type, delivery_method, status, start_date');

console.log(`Loaded ${rxRows.length} prescriptions and ${protocols.length} protocols.\n`);

// Group protocols by patient_id + medKey, prefer active > queued > completed
const protoIndex = new Map(); // `${patient_id}|${medKey}` → protocol
const STATUS_RANK = { active: 3, queued: 2, completed: 1 };
for (const p of protocols) {
  if (!p.medication) continue;
  const key = `${p.patient_id}|${medKey(p.medication)}`;
  const existing = protoIndex.get(key);
  if (!existing || (STATUS_RANK[p.status] || 0) > (STATUS_RANK[existing.status] || 0)) {
    protoIndex.set(key, p);
  }
}

// ── Pass 1: link existing prescriptions ─────────────────────────────────
const linkUpdates = [];
const linkSkipped = [];
for (const rx of rxRows) {
  if (rx.protocol_id) continue;
  const proto = protoIndex.get(`${rx.patient_id}|${medKey(rx.medication_name)}`);
  if (proto) {
    linkUpdates.push({ rx_id: rx.id, protocol_id: proto.id, rx_med: rx.medication_name, proto_med: proto.medication });
  } else {
    linkSkipped.push(rx);
  }
}

// ── Pass 2: prescriptions to create ─────────────────────────────────────
// Build a set of protocol_ids that already have at least one rx.
const protosWithRx = new Set(rxRows.filter(r => r.protocol_id).map(r => r.protocol_id));
// Also count rxs that pass 1 will link.
for (const u of linkUpdates) protosWithRx.add(u.protocol_id);

const rxInserts = [];
for (const p of protocols) {
  if (!shouldAutoPrescribe(p)) continue;
  if (protosWithRx.has(p.id)) continue;
  rxInserts.push({
    patient_id: p.patient_id,
    protocol_id: p.id,
    medication_name: p.medication,
    strength: p.selected_dose || p.starting_dose || p.current_dose || null,
    sig: p.sig || null,
    form: deriveForm(p),
    category: categoryOf(p),
    status: 'draft',
    created_by: 'system-backfill',
    proto_status: p.status,
    patient: p.patient_name || '(unknown)',
  });
}

console.log(`Pass 1: ${linkUpdates.length} prescriptions can be linked to a protocol.`);
console.log(`Pass 1: ${linkSkipped.length} prescriptions have no matching protocol (left as-is).`);
console.log(`Pass 2: ${rxInserts.length} new draft prescriptions to create for active take-home protocols without one.\n`);

if (linkUpdates.length === 0 && rxInserts.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

if (linkUpdates.length) {
  console.log('--- Pass 1 sample (first 10) ---');
  for (const u of linkUpdates.slice(0, 10)) {
    console.log(`  rx ${u.rx_id.slice(0, 8)}  →  protocol ${u.protocol_id.slice(0, 8)}  ·  "${u.rx_med}" ↔ "${u.proto_med}"`);
  }
  if (linkUpdates.length > 10) console.log(`  …and ${linkUpdates.length - 10} more.`);
  console.log();
}

if (rxInserts.length) {
  console.log('--- Pass 2 sample (first 10) ---');
  for (const r of rxInserts.slice(0, 10)) {
    console.log(`  ${r.patient.padEnd(28)} · ${r.category.padEnd(11)} · ${(r.medication_name || '').padEnd(34)} · ${r.strength || ''} · ${r.proto_status}`);
    if (r.sig) console.log(`     sig: ${r.sig}`);
  }
  if (rxInserts.length > 10) console.log(`  …and ${rxInserts.length - 10} more.`);
  console.log();
}

if (!APPLY) {
  console.log('Dry run. Re-run with --apply to write changes.');
  process.exit(0);
}

console.log('Applying...');

// Pass 1: link
let linkOk = 0, linkFail = 0;
for (const u of linkUpdates) {
  const { error } = await supabase
    .from('prescriptions')
    .update({ protocol_id: u.protocol_id, updated_at: new Date().toISOString() })
    .eq('id', u.rx_id);
  if (error) { console.error(`  link FAIL ${u.rx_id}: ${error.message}`); linkFail++; }
  else linkOk++;
}
console.log(`Pass 1 linked: ${linkOk} ok, ${linkFail} failed.`);

// Pass 2: insert in batches of 100
let insOk = 0, insFail = 0;
const cleanInserts = rxInserts.map(({ proto_status, patient, ...row }) => row);
for (let i = 0; i < cleanInserts.length; i += 100) {
  const batch = cleanInserts.slice(i, i + 100);
  const { error } = await supabase.from('prescriptions').insert(batch);
  if (error) { console.error(`  batch FAIL @ ${i}: ${error.message}`); insFail += batch.length; }
  else insOk += batch.length;
}
console.log(`Pass 2 inserted: ${insOk} ok, ${insFail} failed.`);
