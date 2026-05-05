import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);
const PID = '6ceba3d7-7da1-4595-81b1-826bce5352a2';
const PROTO = '18c239dc-b81a-4b43-8038-f19441f0e2fc';

console.log('═══════════════════════════════════════════════════');
console.log('  CLAUDIA RANGEL — FULL AUDIT');
console.log('═══════════════════════════════════════════════════\n');

// Purchases
const { data: purch } = await supabase
  .from('purchases')
  .select('*')
  .eq('protocol_id', PROTO)
  .order('purchase_date');

console.log('PURCHASES:');
let totalInjPaid = 0;
purch?.forEach(p => {
  console.log(`  ${p.purchase_date} | $${p.amount_paid} | ${p.item_name}`);
  console.log(`    qty=${p.quantity}, item_type=${p.item_type || '-'}, payment_type=${p.payment_type || '-'}`);
});

// Service logs with full detail
const { data: logs } = await supabase
  .from('service_logs')
  .select('*')
  .eq('protocol_id', PROTO)
  .order('entry_date');

console.log(`\nSERVICE LOGS (${logs.length} rows):`);
logs?.forEach(l => {
  console.log(`  ${l.entry_date} [${l.entry_type}] ${l.dosage || '-'} | wt:${l.weight ?? '-'} qty:${l.quantity ?? '-'} fulfill:${l.fulfillment_method || '-'}`);
  console.log(`    id=${l.id}`);
  console.log(`    note_id=${l.note_id || '-'}`);
  console.log(`    appointment_id=${l.appointment_id || '-'}`);
  console.log(`    administered_by=${l.administered_by || '-'}`);
  console.log(`    notes=${(l.notes || '-').substring(0, 80)}`);
  console.log(`    created_at=${l.created_at}`);
});

// Patient notes for this protocol
const { data: notes } = await supabase
  .from('patient_notes')
  .select('id, note_date, source, encounter_service, status, created_by, body')
  .eq('patient_id', PID)
  .order('note_date');

console.log(`\nPATIENT NOTES (${notes?.length || 0} rows):`);
notes?.forEach(n => {
  const bodyPreview = (n.body || '').replace(/\n/g, ' ').substring(0, 120);
  console.log(`  ${n.note_date} [${n.source || '-'}/${n.encounter_service || '-'}] by ${n.created_by || '-'}`);
  console.log(`    id=${n.id}, status=${n.status || '-'}`);
  console.log(`    body: ${bodyPreview}...`);
});

// Cross-check: which service_logs have notes vs not
console.log('\n═══════════════════════════════════════════════════');
console.log('  RECONCILIATION');
console.log('═══════════════════════════════════════════════════\n');

const injectionLogs = logs.filter(l => l.entry_type === 'injection');
const pickupLogs = logs.filter(l => l.entry_type === 'pickup' || l.entry_type === 'med_pickup');
const otherLogs = logs.filter(l => !['injection', 'pickup', 'med_pickup'].includes(l.entry_type));

console.log(`  Injection rows: ${injectionLogs.length}`);
console.log(`  Pickup rows: ${pickupLogs.length}`);
console.log(`  Other rows: ${otherLogs.length}`);
console.log(`  Protocol.sessions_used: 12, total_sessions: 12`);

console.log('\n  INJECTIONS WITH NOTE LINKAGE:');
injectionLogs.forEach(l => {
  const linked = l.note_id ? '✓' : '✗ NO NOTE';
  console.log(`    ${l.entry_date} ${l.dosage} → ${linked}`);
});

// Tally injections paid for from purchases (assuming 4-pack heuristic)
console.log('\n  PURCHASE → DOSE COUNT INTERPRETATION:');
console.log('    User says: Feb 2 = 4-pack, Mar 3 = 4-pack, Mar 28 = 2, Apr 21 = 2 → 10 total');
console.log('    But purchases.quantity stored as: 1, 1, 2, 2 = 6');
console.log('    The early "4-pack" purchases were entered as qty=1 line items.');
