// Finalize Claudia: paid 12 doses, 13 administered (incl. 2 self-admin) →
// Payment Due. Convert Apr 4/11 back to entry_type='injection' so the
// canonical sessions_used count works without changing every filter.
// Notes already document them as "Self-administered while in Japan."

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PROTO = '18c239dc-b81a-4b43-8038-f19441f0e2fc';
const APR4_ID  = '20c3e881-f112-4d95-9a98-62ba37f3413a';
const APR11_ID = '391e3881-76d7-4ab3-8115-6e748291de6b';

// 1. Convert Apr 4 + Apr 11 back to 'injection'
for (const id of [APR4_ID, APR11_ID]) {
  const { error } = await supabase
    .from('service_logs')
    .update({ entry_type: 'injection', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('Update failed:', error); process.exit(1); }
  console.log(`✓ Reclassified ${id.substring(0,8)} as injection`);
}

// 2. Set total_sessions = 12 (paid: 4+4+2+2)
await supabase
  .from('protocols')
  .update({ total_sessions: 12, updated_at: new Date().toISOString() })
  .eq('id', PROTO);
console.log('✓ Set total_sessions = 12 (paid)');

// 3. Recount sessions_used
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
  .select('sessions_used, total_sessions, selected_dose')
  .eq('id', PROTO)
  .single();

console.log('\n──────────────────────────────────────');
console.log(`Final state: ${proto.sessions_used}/${proto.total_sessions} | dose ${proto.selected_dose}`);
console.log(`Status: ${proto.sessions_used > proto.total_sessions ? 'PAYMENT DUE — over by ' + (proto.sessions_used - proto.total_sessions) : 'paid up'}`);

// 4. Print the final schedule
const { data: logs } = await supabase
  .from('service_logs')
  .select('entry_date, entry_type, dosage, weight, notes')
  .eq('protocol_id', PROTO)
  .order('entry_date');

console.log(`\nService log rows (${logs.length}):`);
logs.forEach((l, i) => {
  const inClinic = !(l.notes || '').includes('Self-administered');
  console.log(`  #${i+1} ${l.entry_date} [${l.entry_type}] ${l.dosage || '-'} ${inClinic ? 'in-clinic' : 'self-admin'}`);
});
