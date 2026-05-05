// Delete the Mar 28 pickup row from Claudia's service_logs. The 2 doses
// it dispensed are already represented by the Apr 4 and Apr 11
// self_administered rows, so the pickup row is redundant in the schedule.
//
// Note text on the self_admin rows already cross-references Mar 28, so the
// clinical context is preserved.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PROTO = '18c239dc-b81a-4b43-8038-f19441f0e2fc';
const PICKUP_ID = '7d6f6ae7-c2ec-4d61-8900-d50c17e2e5c3';

const { error } = await supabase
  .from('service_logs')
  .delete()
  .eq('id', PICKUP_ID);

if (error) {
  console.error('Delete failed:', error);
  process.exit(1);
}
console.log('✓ Deleted Mar 28 pickup row');

// Recount sessions_used (should still be 11; pickup wasn't counted anyway)
const { count } = await supabase
  .from('service_logs')
  .select('*', { count: 'exact', head: true })
  .eq('protocol_id', PROTO)
  .in('entry_type', ['injection', 'session']);

await supabase
  .from('protocols')
  .update({ sessions_used: count || 0, updated_at: new Date().toISOString() })
  .eq('id', PROTO);

const { data: proto } = await supabase
  .from('protocols')
  .select('sessions_used, total_sessions')
  .eq('id', PROTO)
  .single();

console.log(`Final: ${proto.sessions_used}/${proto.total_sessions}`);

// Verify schedule rows
const { data: logs } = await supabase
  .from('service_logs')
  .select('entry_date, entry_type, dosage')
  .eq('protocol_id', PROTO)
  .order('entry_date');

console.log(`\nService log rows: ${logs.length}`);
logs.forEach(l => console.log(`  ${l.entry_date} [${l.entry_type}] ${l.dosage || '-'}`));
