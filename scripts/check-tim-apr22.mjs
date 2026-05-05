import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);
const { data } = await supabase
  .from('patient_notes')
  .select('id, status, encounter_service, body, created_by')
  .eq('id', '3a8b1083-a224-4221-bf05-040ff8ce58d2')
  .maybeSingle();
console.log(`status=${data.status}, by=${data.created_by}, service=${data.encounter_service}`);
console.log('\nBody:');
console.log(data.body);
