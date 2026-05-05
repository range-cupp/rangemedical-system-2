// Timothy Keating reconciliation:
//   Apr 8 — 1st in-clinic injection by Damien Burgess. Note exists as draft
//           but never signed. Create the service_log directly.
//   Apr 22 — 3rd in-clinic injection at 2mg (per draft note). Link to that
//            note even though draft so it stays joined.
//   May 5 — In-clinic injection. Note's Dose field reads 4mg (the planned
//           increase) but the narrative explicitly states "Patient received
//           3 mg RETA in clinic today." Use 3mg.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PID = 'cc6d8d0d-7939-4aa4-913e-4de8c2d3794b';
const PROTO = '4d44b9b7-f5e6-4929-b5d3-16cb5350f08e';

const rows = [
  {
    label: 'Apr 8 (1st injection by Damien — no signed note)',
    entry_date: '2026-04-08',
    dosage: '2mg',
    medication: 'Retatrutide',
    weight: null,
    note_id: null,
    administered_by: 'burgess@range-medical.com',
    fulfillment_method: 'in_clinic',
    notes: 'First in-clinic injection by Damien Burgess. Patient also took home 1 dose for self-administration the following week.',
  },
  {
    label: 'Apr 22 (3rd injection at 2mg by Evan — draft note linked)',
    entry_date: '2026-04-22',
    dosage: '2mg',
    medication: 'Retatrutide',
    weight: null,
    note_id: '3a8b1083-a224-4221-bf05-040ff8ce58d2',
    administered_by: 'evan@range-medical.com',
    fulfillment_method: 'in_clinic',
    notes: '2mg Retatrutide SubQ LLQ abd. Per Evan note (draft).',
  },
  {
    label: 'May 5 (3mg in-clinic by Lily — signed note linked)',
    entry_date: '2026-05-05',
    dosage: '3mg',
    medication: 'Retatrutide',
    weight: 226.2,
    note_id: '825962e3-f3ac-46e8-b1c2-3859f00cee32',
    administered_by: 'lily@range-medical.com',
    fulfillment_method: 'in_clinic',
    notes: 'Patient received 3 mg RETA in clinic today. 4 mg dispensed for next week (firefighter schedule).',
  },
];

for (const r of rows) {
  // Don't insert if a row already covers that date+protocol with entry_type=injection
  const { data: existing } = await supabase
    .from('service_logs')
    .select('id')
    .eq('protocol_id', PROTO)
    .eq('entry_date', r.entry_date)
    .eq('entry_type', 'injection')
    .maybeSingle();
  if (existing) {
    console.log(`SKIP ${r.label} — already exists ${existing.id}`);
    continue;
  }

  const { data, error } = await supabase
    .from('service_logs')
    .insert({
      patient_id: PID,
      protocol_id: PROTO,
      category: 'weight_loss',
      entry_type: 'injection',
      entry_date: r.entry_date,
      medication: r.medication,
      dosage: r.dosage,
      weight: r.weight,
      note_id: r.note_id,
      administered_by: r.administered_by,
      fulfillment_method: r.fulfillment_method,
      notes: r.notes,
    })
    .select('id')
    .single();
  if (error) { console.error(`FAIL ${r.label}:`, error.message); continue; }
  console.log(`✓ ${r.label} → ${data.id.substring(0,8)}`);
}

// Recount
const { count } = await supabase
  .from('service_logs')
  .select('*', { count: 'exact', head: true })
  .eq('protocol_id', PROTO)
  .in('entry_type', ['injection', 'session']);

await supabase
  .from('protocols')
  .update({
    sessions_used: count || 0,
    selected_dose: '3mg',
    last_visit_date: '2026-05-05',
    next_expected_date: '2026-05-12',
    updated_at: new Date().toISOString(),
  })
  .eq('id', PROTO);

const { data: proto } = await supabase
  .from('protocols')
  .select('sessions_used, total_sessions, selected_dose')
  .eq('id', PROTO)
  .single();

console.log(`\nFinal: ${proto.sessions_used}/${proto.total_sessions} | dose ${proto.selected_dose}`);

// Print full timeline
const { data: logs } = await supabase
  .from('service_logs')
  .select('entry_date, entry_type, dosage, fulfillment_method, weight, notes')
  .eq('protocol_id', PROTO)
  .order('entry_date');

console.log(`\nTimeline (${logs.length}):`);
logs.forEach((l, i) => {
  console.log(`  #${i+1} ${l.entry_date} [${l.entry_type}] ${l.dosage || '-'} ${l.fulfillment_method || '-'} wt=${l.weight ?? '-'}`);
});
