import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);
const PATIENT_ID = '6e645950-7136-4b0c-ac2f-a3bffbd5c965';
const MERGE = ['a4ba2fd4-877b-4418-bc7f-1c46828945bb','3705da90-e615-4335-9b99-0a8604ea1d48','75b28dd8-ce15-4a89-a0de-2c562b06548b'];
const { data, error } = await supabase
  .from('purchases')
  .select('*')
  .eq('patient_id', PATIENT_ID);
console.log('error:', error?.message);
console.log('purchases:', data?.length, 'rows');
for (const p of data || []) {
  console.log(`  id=${p.id}  proto=${p.protocol_id}  cat=${p.service_category}  service=${p.service_name}`);
}
