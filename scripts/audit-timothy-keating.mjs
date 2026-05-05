// Same audit pattern as Claudia: pull purchases, service_logs, notes, and
// reconcile sessions_used / total_sessions against the actual paid doses.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

// Find Timothy Keating
const { data: matches } = await supabase
  .from('patients')
  .select('id, first_name, last_name, email, phone')
  .ilike('first_name', 'tim%')
  .ilike('last_name', 'keating');

console.log('Matching patients:');
matches?.forEach(p => console.log(`  ${p.id} | ${p.first_name} ${p.last_name} | ${p.email || '-'} | ${p.phone || '-'}`));

if (!matches || matches.length === 0) {
  console.log('No matches — broaden search');
  const { data: broad } = await supabase
    .from('patients')
    .select('id, first_name, last_name')
    .ilike('last_name', 'keating');
  broad?.forEach(p => console.log(`  ${p.id} | ${p.first_name} ${p.last_name}`));
  process.exit(0);
}

const pat = matches[0];
const PID = pat.id;
console.log(`\nUsing: ${pat.first_name} ${pat.last_name} (${PID})\n`);

// All WL protocols
const { data: protos } = await supabase
  .from('protocols')
  .select('id, medication, program_type, delivery_method, status, start_date, end_date, sessions_used, total_sessions, frequency, selected_dose')
  .eq('patient_id', PID)
  .eq('program_type', 'weight_loss')
  .order('created_at');

console.log(`WL protocols: ${protos?.length || 0}`);
console.log(JSON.stringify(protos, null, 2));

for (const proto of protos || []) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Protocol ${proto.id.substring(0,8)} ${proto.status} ${proto.medication} ${proto.delivery_method}`);
  console.log(`  Stored: ${proto.sessions_used}/${proto.total_sessions} | dose ${proto.selected_dose}`);

  const { data: purch } = await supabase
    .from('purchases')
    .select('purchase_date, amount_paid, item_name, quantity, payment_method, item_type')
    .eq('protocol_id', proto.id)
    .order('purchase_date');

  console.log(`\n  Purchases (${purch?.length || 0}):`);
  let dollarsTotal = 0;
  let dosesAssumed = 0;
  for (const p of purch || []) {
    const itemLower = (p.item_name || '').toLowerCase();
    const hasMultiplier = /×\s*\d|\bx\s*\d|\bsingle\b/i.test(p.item_name || '');
    let assumed;
    if (p.quantity > 1) assumed = p.quantity;
    else if (hasMultiplier) assumed = p.quantity;
    else assumed = 4;
    dollarsTotal += parseFloat(p.amount_paid || 0);
    dosesAssumed += assumed;
    console.log(`    ${p.purchase_date} | $${p.amount_paid} qty=${p.quantity} ${p.payment_method || '-'} → ${assumed} doses`);
    console.log(`      ${p.item_name}`);
  }
  console.log(`    TOTAL: $${dollarsTotal.toFixed(2)} → ${dosesAssumed} doses`);

  const { data: logs } = await supabase
    .from('service_logs')
    .select('id, entry_date, entry_type, dosage, weight, fulfillment_method, note_id, notes, administered_by')
    .eq('protocol_id', proto.id)
    .order('entry_date');

  console.log(`\n  Service logs (${logs?.length || 0}):`);
  const counts = {};
  for (const l of logs || []) {
    counts[l.entry_type] = (counts[l.entry_type] || 0) + 1;
    const sigBits = [
      l.fulfillment_method || '-',
      l.note_id ? `note:${l.note_id.substring(0,8)}` : 'no-note',
      l.administered_by ? `by:${l.administered_by}` : '',
    ].filter(Boolean).join(' | ');
    console.log(`    ${l.entry_date} [${l.entry_type}] ${l.dosage || '-'} wt=${l.weight ?? '-'} ${sigBits}`);
    if (l.notes) console.log(`      "${l.notes.substring(0, 100)}"`);
  }
  console.log(`    by entry_type:`, counts);

  // Reconciliation
  const injections = (logs || []).filter(l => ['injection', 'session'].includes(l.entry_type)).length;
  console.log(`\n  RECONCILIATION:`);
  console.log(`    Paid (assumed): ${dosesAssumed} | Stored total_sessions: ${proto.total_sessions}`);
  console.log(`    Counted injections: ${injections} | Stored sessions_used: ${proto.sessions_used}`);
  if (injections !== proto.sessions_used) console.log(`    ⚠️ sessions_used drift: ${proto.sessions_used} stored vs ${injections} actual`);
  if (dosesAssumed !== proto.total_sessions) console.log(`    ⚠️ total_sessions drift: ${proto.total_sessions} stored vs ${dosesAssumed} from purchases`);
}

// Recent encounter notes for context
console.log(`\n${'═'.repeat(70)}`);
console.log('Recent encounter notes (last 90 days):');
const { data: notes } = await supabase
  .from('patient_notes')
  .select('id, note_date, source, encounter_service, status, created_by, body')
  .eq('patient_id', PID)
  .eq('source', 'encounter')
  .gte('note_date', new Date(Date.now() - 90 * 86400000).toISOString())
  .order('note_date');

for (const n of notes || []) {
  const bodyPrev = (n.body || '').replace(/\n/g, ' ').substring(0, 100);
  console.log(`  ${n.note_date.substring(0, 10)} [${n.encounter_service || '-'}/${n.status}] ${n.created_by || '-'}`);
  console.log(`    ${bodyPrev}`);
}
