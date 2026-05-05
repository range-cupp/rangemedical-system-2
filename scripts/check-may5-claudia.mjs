import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PID = '6ceba3d7-7da1-4595-81b1-826bce5352a2';

// Fetch the May 5 note in full
const { data: note } = await supabase
  .from('patient_notes')
  .select('*')
  .eq('patient_id', PID)
  .gte('note_date', '2026-05-05T00:00:00')
  .lt('note_date', '2026-05-06T00:00:00')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

console.log('May 5 note:', JSON.stringify(note, null, 2));

// Look for ANY May 5 service logs
const { data: logs } = await supabase
  .from('service_logs')
  .select('*')
  .eq('patient_id', PID)
  .gte('entry_date', '2026-05-05')
  .lt('entry_date', '2026-05-06');

console.log('\nMay 5 service_logs for Claudia:', logs);
