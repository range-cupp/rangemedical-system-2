import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

// Check 161f896b — May 4 weight_loss note that earlier check showed
// had WL fields in body but no service_log
const { data: note } = await supabase
  .from('patient_notes')
  .select('id, patient_id, body, encounter_service, source, note_date, created_by, appointment_id, status')
  .eq('id', '161f896b-87f3-4e5b-aa78-a02c4b6b54f8')
  .maybeSingle();

if (!note) {
  // Try to find recent WL notes that look problematic
  const { data: notes } = await supabase
    .from('patient_notes')
    .select('id, patient_id, body, encounter_service, source, note_date, status')
    .eq('source', 'encounter')
    .gte('note_date', '2026-05-04T00:00:00')
    .lt('note_date', '2026-05-06T00:00:00')
    .order('note_date');

  console.log(`Found ${notes?.length || 0} encounter notes May 4-5:\n`);
  for (const n of notes || []) {
    const hasMed = n.body?.includes('**Medication:**');
    const hasDose = n.body?.includes('**Dose:**');
    const isWL = (n.encounter_service || '').toLowerCase().includes('weight') ||
                 (n.encounter_service || '').toLowerCase().includes('injection');

    const { data: existing } = await supabase
      .from('service_logs')
      .select('id, entry_type, note_id, entry_date')
      .eq('note_id', n.id)
      .maybeSingle();

    const dateOnly = n.note_date.substring(0, 10);
    const { data: byDate } = await supabase
      .from('service_logs')
      .select('id, entry_type, note_id')
      .eq('patient_id', n.patient_id)
      .eq('entry_date', dateOnly)
      .eq('category', 'weight_loss');

    // Check active protocol
    const { data: proto } = await supabase
      .from('protocols')
      .select('id, status, program_type')
      .eq('patient_id', n.patient_id)
      .ilike('program_type', 'weight_loss%')
      .in('status', ['active', 'in_progress'])
      .limit(1);

    if (isWL || hasMed) {
      console.log(`${n.id.substring(0, 8)} ${n.note_date.substring(0, 10)} [${n.encounter_service}] status=${n.status}`);
      console.log(`  WL fields: med=${hasMed} dose=${hasDose}`);
      console.log(`  by note_id: ${existing ? 'YES' : 'no'}`);
      console.log(`  by date: ${byDate?.length || 0} ${(byDate || []).map(x => `[${x.entry_type}/${x.note_id ? 'lnk' : 'orph'}]`).join(', ')}`);
      console.log(`  active WL protocol: ${proto?.length ? proto[0].id.substring(0, 8) : 'NONE'}`);
      console.log('');
    }
  }
}
