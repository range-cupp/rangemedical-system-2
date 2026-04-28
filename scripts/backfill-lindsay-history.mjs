// Backfill Lindsay Krill's pre-Feb 13 history into her master WL protocol so
// the consolidated record actually reflects her Dec 6 start. Inserts weekly
// "Backfilled from protocol history" service_log entries for the 2mg phase
// (Dec 6 → Jan 30) and the first two 5mg weeks (Jan 30, Feb 6), then bumps
// total_sessions / sessions_used to reflect her real cumulative count.
//
// Idempotent: skips dates that already have a service_log on this protocol.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PATIENT_ID = '6e645950-7136-4b0c-ac2f-a3bffbd5c965';
const MASTER = '7f82e945-8018-44f8-8609-40c6cc86ef36';

// 2mg phase Dec 6 → Jan 23 (weekly, 8 doses), then 5mg weeks Jan 30, Feb 6.
// Feb 13 onward already exists in service_logs.
const BACKFILL_INJECTIONS = [
  { date: '2025-12-06', dose: '2mg' },
  { date: '2025-12-13', dose: '2mg' },
  { date: '2025-12-20', dose: '2mg' },
  { date: '2025-12-27', dose: '2mg' },
  { date: '2026-01-03', dose: '2mg' },
  { date: '2026-01-10', dose: '2mg' },
  { date: '2026-01-17', dose: '2mg' },
  { date: '2026-01-24', dose: '2mg' },
  { date: '2026-01-30', dose: '5mg' },
  { date: '2026-02-06', dose: '5mg' },
];

console.log('=== Existing service_logs on master ===');
const { data: existing } = await supabase
  .from('service_logs')
  .select('id, entry_date, dosage, entry_type, notes')
  .eq('protocol_id', MASTER)
  .eq('patient_id', PATIENT_ID)
  .order('entry_date', { ascending: true });
const existingDates = new Set((existing || []).map(l => l.entry_date));
console.log(`  ${existing?.length || 0} log(s) currently on master:`);
for (const l of existing || []) console.log(`    ${l.entry_date}  ${l.entry_type}  ${l.dosage || ''}`);

console.log('\n=== Inserting backfilled injection logs (skip dates already present) ===');
const toInsert = BACKFILL_INJECTIONS
  .filter(b => !existingDates.has(b.date))
  .map(b => ({
    patient_id: PATIENT_ID,
    protocol_id: MASTER,
    category: 'weight_loss',
    entry_type: 'injection',
    entry_date: b.date,
    medication: 'Retatrutide',
    dosage: b.dose,
    quantity: 0,
    fulfillment_method: null,
    notes: 'Backfilled from protocol history (consolidated)',
  }));

if (toInsert.length === 0) {
  console.log('  Nothing to insert — all dates already covered.');
} else {
  console.log(`  Inserting ${toInsert.length} backfill entr${toInsert.length === 1 ? 'y' : 'ies'}:`);
  for (const r of toInsert) console.log(`    ${r.entry_date}  ${r.dosage}`);
  const { data: inserted, error: insErr } = await supabase
    .from('service_logs')
    .insert(toInsert)
    .select('id, entry_date, dosage');
  if (insErr) console.error('  insert error:', insErr.message);
  else console.log(`  ✓ ${inserted?.length || 0} row(s) inserted`);
}

console.log('\n=== Recompute session counts on master ===');
const { data: allLogs } = await supabase
  .from('service_logs')
  .select('id, entry_date, entry_type, dosage, quantity, notes')
  .eq('protocol_id', MASTER)
  .eq('patient_id', PATIENT_ID)
  .eq('category', 'weight_loss')
  .order('entry_date', { ascending: true });

// One injection per "injection" log + one per "pickup" quantity (take-homes are
// individual injections she'll administer at home). Weight-checks don't count.
const injectionLogs = (allLogs || []).filter(l => l.entry_type === 'injection');
const pickupLogs = (allLogs || []).filter(l => l.entry_type === 'pickup');
const pickupQty = pickupLogs.reduce((s, l) => s + (l.quantity || 0), 0);
const sessionsUsed = injectionLogs.length + pickupQty;
const totalSessions = Math.max(sessionsUsed, 8); // never drop below the existing block plan

console.log(`  injection logs: ${injectionLogs.length}`);
console.log(`  pickup quantity: ${pickupQty}`);
console.log(`  → sessions_used = ${sessionsUsed}`);
console.log(`  → total_sessions = ${totalSessions}`);

const { error: updErr } = await supabase
  .from('protocols')
  .update({
    sessions_used: sessionsUsed,
    total_sessions: totalSessions,
    updated_at: new Date().toISOString(),
  })
  .eq('id', MASTER);
if (updErr) console.error('  update error:', updErr.message);
else console.log('  ✓ master protocol updated');

console.log('\n=== Final state ===');
const { data: final } = await supabase
  .from('protocols')
  .select('id, status, selected_dose, starting_dose, frequency, start_date, end_date, total_sessions, sessions_used, dose_history')
  .eq('id', MASTER)
  .single();
console.log(JSON.stringify(final, null, 2));
