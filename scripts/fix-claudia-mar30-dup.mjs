import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PROTO = '18c239dc-b81a-4b43-8038-f19441f0e2fc';

// 1. Find and delete the Mar 30 phantom row
const { data: mar30 } = await supabase
  .from('service_logs')
  .select('id, entry_date, entry_type, notes, note_id')
  .eq('protocol_id', PROTO)
  .eq('entry_date', '2026-03-30')
  .eq('entry_type', 'injection');

console.log('Mar 30 row(s) found:', mar30);

if (mar30 && mar30.length > 0) {
  for (const row of mar30) {
    await supabase.from('service_logs').delete().eq('id', row.id);
    console.log(`  Deleted ${row.id}`);
  }
}

// 2. Restore Mar 17 dose to 4mg (the original — the addendum changed it to 5mg)
const { data: mar17 } = await supabase
  .from('service_logs')
  .select('id, dosage')
  .eq('protocol_id', PROTO)
  .eq('entry_date', '2026-03-17')
  .eq('entry_type', 'injection')
  .maybeSingle();

if (mar17 && mar17.dosage !== '4mg') {
  await supabase
    .from('service_logs')
    .update({ dosage: '4mg', updated_at: new Date().toISOString() })
    .eq('id', mar17.id);
  console.log(`Mar 17 dose restored: ${mar17.dosage} → 4mg`);
}

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

console.log(`\nsessions_used recounted: ${count}`);

// Verify final state
const { data: proto } = await supabase
  .from('protocols')
  .select('sessions_used, total_sessions, selected_dose')
  .eq('id', PROTO)
  .single();

console.log(`Final: ${proto.sessions_used}/${proto.total_sessions} | dose=${proto.selected_dose}`);
console.log(`Status: ${proto.sessions_used > proto.total_sessions ? 'PAYMENT DUE ✓' : 'paid up'}`);
