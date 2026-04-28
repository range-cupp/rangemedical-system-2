// One-shot consolidation for Lindsay Krill's WL protocols.
// Marks her three stale "completed" WL protocols as merged into the active
// 7f82e945 protocol, repoints any service_logs and purchases at the master,
// and seeds dose_history with the titration timeline (2mg → 5mg → 4mg).
//
// Run: node scripts/consolidate-lindsay-krill.mjs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PATIENT_ID = '6e645950-7136-4b0c-ac2f-a3bffbd5c965'; // Lindsay Krill
const MASTER_PROTOCOL_ID = '7f82e945-8018-44f8-8609-40c6cc86ef36'; // active 4mg/Every 10 Days
const MERGE_INTO_MASTER = [
  'a4ba2fd4-877b-4418-bc7f-1c46828945bb', // Dec 6 — Retatrutide 2mg, in_clinic, completed
  '3705da90-e615-4335-9b99-0a8604ea1d48', // Jan 13 — TBD placeholder, completed
  '75b28dd8-ce15-4a89-a0de-2c562b06548b', // Jan 30 — Retatrutide 5mg Weekly, completed
];

const DOSE_HISTORY = [
  { date: '2025-12-06', dose: '2mg', notes: 'Starting dose' },
  { date: '2026-01-30', dose: '5mg', notes: 'Titrated up from 2mg' },
  { date: '2026-04-16', dose: '4mg', notes: 'Titrated down from 5mg (current)' },
];

const STARTING_DOSE = '2mg';
const ORIGINAL_START_DATE = '2025-12-06';

console.log('=== Pre-flight: master protocol ===');
const { data: master, error: masterErr } = await supabase
  .from('protocols')
  .select('id, status, selected_dose, frequency, start_date, end_date, total_sessions, sessions_used, dose_history, starting_dose, notes')
  .eq('id', MASTER_PROTOCOL_ID)
  .single();
if (masterErr) {
  console.error('Failed to fetch master:', masterErr.message);
  process.exit(1);
}
console.log(JSON.stringify(master, null, 2));

console.log('\n=== Step 1: repoint service_logs from merged protocols → master ===');
const { data: relogs, error: relogErr } = await supabase
  .from('service_logs')
  .update({ protocol_id: MASTER_PROTOCOL_ID })
  .in('protocol_id', MERGE_INTO_MASTER)
  .eq('patient_id', PATIENT_ID)
  .select('id, entry_date, medication, dosage');
if (relogErr) console.error('  service_logs error:', relogErr.message);
else console.log(`  ${relogs?.length || 0} service_log row(s) repointed`);

console.log('\n=== Step 2: repoint purchases from merged protocols → master ===');
const { data: repurch, error: repurchErr } = await supabase
  .from('purchases')
  .update({ protocol_id: MASTER_PROTOCOL_ID })
  .in('protocol_id', MERGE_INTO_MASTER)
  .eq('patient_id', PATIENT_ID)
  .select('id, service_name, paid_date, total_paid');
if (repurchErr) console.error('  purchases error:', repurchErr.message);
else console.log(`  ${repurch?.length || 0} purchase row(s) repointed`);

console.log('\n=== Step 3: mark stale protocols as merged ===');
const { data: merged, error: mergeErr } = await supabase
  .from('protocols')
  .update({
    status: 'merged',
    notes: `Merged into master protocol ${MASTER_PROTOCOL_ID} on ${new Date().toISOString().split('T')[0]} (consolidated WL history)`,
    updated_at: new Date().toISOString(),
  })
  .in('id', MERGE_INTO_MASTER)
  .select('id, status');
if (mergeErr) console.error('  merge error:', mergeErr.message);
else console.log(`  ${merged?.length || 0} protocol(s) marked merged:`, merged?.map(m => m.id));

console.log('\n=== Step 4: backfill master with starting_dose, dose_history, original start_date ===');
const updatedNotes = (master.notes || '')
  + (master.notes ? '\n' : '')
  + `Consolidated ${MERGE_INTO_MASTER.length} prior WL protocol(s); original start ${ORIGINAL_START_DATE}.`;
const { error: updateErr } = await supabase
  .from('protocols')
  .update({
    starting_dose: STARTING_DOSE,
    dose_history: DOSE_HISTORY,
    start_date: ORIGINAL_START_DATE,
    notes: updatedNotes,
    updated_at: new Date().toISOString(),
  })
  .eq('id', MASTER_PROTOCOL_ID);
if (updateErr) console.error('  master update error:', updateErr.message);
else console.log('  master updated with starting_dose=2mg, 3-entry dose_history, original start 2025-12-06');

console.log('\n=== Final state ===');
const { data: final } = await supabase
  .from('protocols')
  .select('id, status, selected_dose, starting_dose, frequency, start_date, end_date, total_sessions, sessions_used, dose_history')
  .eq('patient_id', PATIENT_ID)
  .order('start_date', { ascending: true });
for (const p of final || []) {
  console.log(`  ${p.id}  status=${p.status}  ${p.start_date}→${p.end_date}  ${p.selected_dose} (${p.frequency || 'no freq'})  ${p.sessions_used}/${p.total_sessions || '?'}`);
  if (Array.isArray(p.dose_history) && p.dose_history.length > 0) {
    console.log('    dose_history:', JSON.stringify(p.dose_history));
  }
}
