// Timothy v2 — add the missing Apr 29 take-home self-admin (the dose
// dispensed on Apr 22 for his firefighter-week-off), and tag the existing
// take-home self-admin rows with fulfillment_method='overnight' so the UI
// shows the take-home indicator.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PID = 'cc6d8d0d-7939-4aa4-913e-4de8c2d3794b';
const PROTO = '4d44b9b7-f5e6-4929-b5d3-16cb5350f08e';

// 1. Find the Apr 15 take-home self-admin row and tag it as overnight
const { data: apr15 } = await supabase
  .from('service_logs')
  .select('id, fulfillment_method, notes')
  .eq('protocol_id', PROTO)
  .eq('entry_date', '2026-04-15')
  .eq('entry_type', 'injection')
  .maybeSingle();

if (apr15 && apr15.fulfillment_method !== 'overnight') {
  await supabase
    .from('service_logs')
    .update({
      fulfillment_method: 'overnight',
      notes: 'Self-administered take-home (dispensed Apr 8 by Damien for the week he was traveling for work).',
      updated_at: new Date().toISOString(),
    })
    .eq('id', apr15.id);
  console.log(`✓ Apr 15 tagged take-home (id ${apr15.id.substring(0,8)})`);
}

// 2. Add Apr 29 self-administered take-home (dispensed by Evan on Apr 22)
const { data: apr29Existing } = await supabase
  .from('service_logs')
  .select('id')
  .eq('protocol_id', PROTO)
  .eq('entry_date', '2026-04-29')
  .eq('entry_type', 'injection')
  .maybeSingle();

if (!apr29Existing) {
  const { data: ins, error } = await supabase
    .from('service_logs')
    .insert({
      patient_id: PID,
      protocol_id: PROTO,
      category: 'weight_loss',
      entry_type: 'injection',
      entry_date: '2026-04-29',
      medication: 'Retatrutide',
      dosage: '2mg',
      weight: null,
      note_id: null,
      administered_by: null,
      fulfillment_method: 'overnight',
      notes: 'Self-administered take-home (dispensed Apr 22 by Evan; firefighter schedule, no clinic visit this week).',
    })
    .select('id')
    .single();
  if (error) { console.error('Insert failed:', error); process.exit(1); }
  console.log(`✓ Apr 29 added (id ${ins.id.substring(0,8)})`);
} else {
  console.log('Apr 29 already exists');
}

// 3. Recount sessions_used
const { count } = await supabase
  .from('service_logs')
  .select('*', { count: 'exact', head: true })
  .eq('protocol_id', PROTO)
  .in('entry_type', ['injection', 'session']);

await supabase
  .from('protocols')
  .update({
    sessions_used: count || 0,
    last_visit_date: '2026-05-05',
    next_expected_date: '2026-05-12',
    updated_at: new Date().toISOString(),
  })
  .eq('id', PROTO);

const { data: proto } = await supabase
  .from('protocols')
  .select('sessions_used, total_sessions, selected_dose, medication')
  .eq('id', PROTO)
  .single();

console.log(`\nFinal: ${proto.sessions_used}/${proto.total_sessions} | ${proto.medication} ${proto.selected_dose}`);
console.log(`Coverage: ${proto.sessions_used} administered of ${proto.total_sessions} paid → ${proto.total_sessions - proto.sessions_used} doses remaining`);

// Print full timeline
const { data: logs } = await supabase
  .from('service_logs')
  .select('entry_date, entry_type, dosage, fulfillment_method, weight, notes')
  .eq('protocol_id', PROTO)
  .order('entry_date');

console.log(`\nTimeline:`);
let injCount = 0;
for (const l of logs) {
  if (['injection', 'session'].includes(l.entry_type)) injCount++;
  const isInj = ['injection', 'session'].includes(l.entry_type);
  const numTag = isInj ? `Inj #${injCount}` : `       `;
  const setting = l.fulfillment_method === 'overnight' ? 'take-home' :
                  l.fulfillment_method === 'in_clinic' ? 'in-clinic' : '-';
  console.log(`  ${numTag} | ${l.entry_date} [${l.entry_type}] ${l.dosage || '-'} ${setting} wt=${l.weight ?? '-'}`);
}
