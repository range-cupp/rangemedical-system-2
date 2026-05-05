// Create the missing May 5 service_log for Claudia Rangel.
// The May 5 encounter note (4bb0a8bf-...) was signed by Lily Diaz RN with
// 9mg Retatrutide injection but the note→service_log sync didn't fire.
// This puts Claudia at 11/10 — Payment Due, which is the correct state.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PID = '6ceba3d7-7da1-4595-81b1-826bce5352a2';
const PROTO = '18c239dc-b81a-4b43-8038-f19441f0e2fc';
const NOTE_ID = '4bb0a8bf-3380-44ee-b668-87ccbc5a19e3';

// Guard: only insert if not already present
const { data: existing } = await supabase
  .from('service_logs')
  .select('id')
  .eq('note_id', NOTE_ID)
  .maybeSingle();

if (existing) {
  console.log('Already exists:', existing.id);
  process.exit(0);
}

const { data: inserted, error: insertErr } = await supabase
  .from('service_logs')
  .insert({
    patient_id: PID,
    protocol_id: PROTO,
    category: 'weight_loss',
    entry_type: 'injection',
    entry_date: '2026-05-05',
    medication: 'Retatrutide',
    dosage: '9mg',
    weight: 270.4,
    note_id: NOTE_ID,
    administered_by: 'lily@range-medical.com',
    fulfillment_method: 'in_clinic',
    notes: 'Via encounter note by lily@range-medical.com',
  })
  .select()
  .single();

if (insertErr) {
  console.error('Insert failed:', insertErr);
  process.exit(1);
}

console.log('✓ Created service_log:', inserted.id);

// Recount and update protocol
const { count: actualCount } = await supabase
  .from('service_logs')
  .select('*', { count: 'exact', head: true })
  .eq('protocol_id', PROTO)
  .in('entry_type', ['injection', 'session']);

const nextDate = new Date('2026-05-05T12:00:00');
nextDate.setDate(nextDate.getDate() + 7);

const { error: protoErr } = await supabase
  .from('protocols')
  .update({
    sessions_used: actualCount || 0,
    last_visit_date: '2026-05-05',
    next_expected_date: nextDate.toISOString().split('T')[0],
    updated_at: new Date().toISOString(),
  })
  .eq('id', PROTO);

if (protoErr) {
  console.error('Protocol update failed:', protoErr);
  process.exit(1);
}

console.log(`✓ Protocol synced: sessions_used=${actualCount}`);

// Verify
const { data: proto } = await supabase
  .from('protocols')
  .select('sessions_used, total_sessions, selected_dose, last_visit_date, next_expected_date')
  .eq('id', PROTO)
  .single();

console.log('\nFinal state:');
console.log(`  ${proto.sessions_used}/${proto.total_sessions} | dose=${proto.selected_dose}`);
console.log(`  Last visit: ${proto.last_visit_date}`);
console.log(`  Next expected: ${proto.next_expected_date}`);
console.log(`  Payment status: ${proto.sessions_used > proto.total_sessions ? 'PAYMENT DUE' : proto.sessions_used === proto.total_sessions ? 'paid up exactly' : 'has remaining'}`);
