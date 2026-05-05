import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

// Pull all WL encounter notes from May 4-5 and check whether each has a
// corresponding service_log via note_id linkage.
const { data: notes } = await supabase
  .from('patient_notes')
  .select('id, patient_id, note_date, encounter_service, source, status, created_by, body')
  .eq('source', 'encounter')
  .gte('note_date', '2026-05-04T00:00:00')
  .lt('note_date', '2026-05-06T00:00:00');

console.log(`May 4-5 encounter notes: ${notes?.length || 0}\n`);

for (const n of notes || []) {
  const { data: sl } = await supabase
    .from('service_logs')
    .select('id, entry_date, entry_type, dosage')
    .eq('note_id', n.id)
    .maybeSingle();

  const wlField = n.body?.includes('**Medication:**') && n.body?.includes('**Dose:**');
  console.log(`Note ${n.id.substring(0,8)} | ${n.note_date.substring(0,10)} | ${n.encounter_service} | ${n.status} | by ${n.created_by}`);
  console.log(`  WL fields in body: ${wlField}`);
  console.log(`  service_log linked: ${sl ? `${sl.entry_date} ${sl.entry_type} ${sl.dosage}` : 'NONE'}`);

  // Also check date-based service_log
  const dateOnly = n.note_date.split('T')[0];
  const { data: byDate } = await supabase
    .from('service_logs')
    .select('id, entry_type, note_id, dosage')
    .eq('patient_id', n.patient_id)
    .eq('entry_date', dateOnly)
    .eq('category', 'weight_loss');
  console.log(`  service_logs on ${dateOnly}: ${byDate?.length || 0} ${byDate?.map(x => `[${x.entry_type}/${x.note_id ? 'linked' : 'unlinked'}]`).join(',')}`);
  console.log('');
}
