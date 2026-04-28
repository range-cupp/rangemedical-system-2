import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);
const PID = '6ceba3d7-7da1-4595-81b1-826bce5352a2';
const PROTOCOL_ID = '18c239dc-b81a-4b43-8038-f19441f0e2fc';

const { data: pr } = await supabase
  .from('protocols')
  .select('id, medication, selected_dose, current_dose, dose, dose_per_injection, injections_per_week, dose_history, dose_change_reason, last_refill_date, starting_supply_ml, start_date')
  .eq('id', PROTOCOL_ID)
  .single();

console.log('Protocol fields:');
console.log(JSON.stringify(pr, null, 2));

const { data: reqs } = await supabase
  .from('dose_change_requests')
  .select('id, protocol_id, current_dose, proposed_dose, current_injections_per_week, proposed_injections_per_week, status, reason, created_at, approved_at, applied_at, approver, approver_name, requested_by')
  .eq('protocol_id', PROTOCOL_ID)
  .order('created_at');

console.log('\nDose change requests for protocol:');
console.log(JSON.stringify(reqs, null, 2));

const { data: logs } = await supabase
  .from('protocol_logs')
  .select('id, log_type, log_date, dose, weight, notes, logged_by, created_at')
  .eq('protocol_id', PROTOCOL_ID)
  .order('created_at');

console.log('\nProtocol logs:');
console.log(JSON.stringify(logs, null, 2));
