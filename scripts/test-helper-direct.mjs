// Reproduce the helper logic against a specific note to debug why backfill
// didn't sync. Inlined parser to avoid module resolution issues.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

function field(body, label) {
  const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`, 'i');
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

const NOTE_IDS = [
  '79b54924', // 2026-05-05 weight_loss with WL fields, active proto, no link
  'f77aa9af', // 2026-05-05 weight_loss with WL fields, active proto, no link
  '161f896b', // 2026-05-04 weight_loss with WL fields, NO active proto
];

// Pull all encounter notes and filter client-side by ID prefix
const { data: allNotes } = await supabase
  .from('patient_notes')
  .select('*')
  .eq('source', 'encounter')
  .gte('note_date', '2026-05-04T00:00:00')
  .lt('note_date', '2026-05-06T00:00:00');

for (const prefix of NOTE_IDS) {
  const note = (allNotes || []).find(n => n.id.startsWith(prefix));
  if (!note) { console.log(`${prefix}: not found`); continue; }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Note ${note.id.substring(0,8)}  patient=${note.patient_id.substring(0,8)}  date=${note.note_date.substring(0,10)}`);
  console.log(`  encounter_service: "${note.encounter_service}"`);
  console.log(`  source: ${note.source}, status: ${note.status}`);
  console.log(`  body length: ${note.body?.length || 0}`);

  // Parse WL
  const med = field(note.body || '', 'Medication');
  const dose = field(note.body || '', 'Dose');
  const weight = field(note.body || '', 'Current Weight');
  console.log(`  parsed: med=${med}, dose=${dose}, weight=${weight}`);

  // Find active WL protocol
  const { data: protos } = await supabase
    .from('protocols')
    .select('id, status, program_type, medication, sessions_used, total_sessions')
    .eq('patient_id', note.patient_id)
    .ilike('program_type', 'weight_loss%')
    .in('status', ['active', 'in_progress'])
    .order('created_at', { ascending: false });
  console.log(`  WL protocols: ${protos?.length || 0}`);
  protos?.forEach(p => console.log(`    ${p.id.substring(0,8)} ${p.program_type} ${p.status} ${p.sessions_used}/${p.total_sessions}`));

  // Service logs by note_id
  const { data: byNoteId } = await supabase
    .from('service_logs')
    .select('id, entry_type, entry_date')
    .eq('note_id', note.id);
  console.log(`  service_logs by note_id: ${byNoteId?.length || 0}`);
}
