import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PID = '6bc0f9a5'; // 79b54924's patient

const { data: allP } = await supabase
  .from('patients')
  .select('id, first_name, last_name')
  .ilike('id', `${PID}%`)
  .limit(1);

const patient = allP?.[0];
if (!patient) {
  // Try matching the full UUID we know
  const { data: notes } = await supabase
    .from('patient_notes')
    .select('patient_id')
    .gte('note_date', '2026-05-05')
    .lt('note_date', '2026-05-06')
    .ilike('encounter_service', '%weight%');
  console.log('Found notes:', notes?.length);
  for (const n of notes || []) {
    if (n.patient_id?.startsWith(PID)) {
      console.log('Match patient_id:', n.patient_id);

      // Now query protocols with the exact helper query
      const { data: protocols, error } = await supabase
        .from('protocols')
        .select('id, status, program_type, category, medication')
        .eq('patient_id', n.patient_id)
        .ilike('program_type', 'weight_loss%')
        .in('status', ['active', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) console.log('  query error:', error);
      console.log('  Helper query result:', protocols);

      // Compare with all protocols (no filter)
      const { data: allProto } = await supabase
        .from('protocols')
        .select('id, status, program_type, category, medication')
        .eq('patient_id', n.patient_id);
      console.log('  All protocols:');
      allProto?.forEach(p => console.log(`    ${p.id.substring(0,8)} program_type="${p.program_type}" status=${p.status} category=${p.category}`));
      break;
    }
  }
}
