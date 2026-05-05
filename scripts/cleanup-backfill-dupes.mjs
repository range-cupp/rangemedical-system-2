// Delete the duplicate injection rows the 60-day backfill created. A row
// is a "dupe" when it was created in the last 90 minutes AND another
// injection-or-pickup row exists for the same protocol within ±5 days.
//
// Then recount sessions_used for every affected protocol.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const ninetyMinAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString();

const { data: recent } = await supabase
  .from('service_logs')
  .select('id, patient_id, protocol_id, entry_date, entry_type, dosage, note_id, created_at')
  .gte('created_at', ninetyMinAgo)
  .eq('entry_type', 'injection')
  .eq('category', 'weight_loss')
  .not('note_id', 'is', null)
  .order('created_at');

console.log(`Service_logs created in last 90 min: ${recent?.length || 0}`);

const toDelete = [];
const affectedProtocols = new Set();

for (const r of recent || []) {
  const start = new Date(r.entry_date); start.setDate(start.getDate() - 5);
  const end   = new Date(r.entry_date); end.setDate(end.getDate() + 5);

  const { data: nearby } = await supabase
    .from('service_logs')
    .select('id, entry_date, entry_type')
    .eq('protocol_id', r.protocol_id)
    .gte('entry_date', start.toISOString().split('T')[0])
    .lte('entry_date', end.toISOString().split('T')[0])
    .in('entry_type', ['injection', 'session', 'pickup']);

  const others = (nearby || []).filter(x => x.id !== r.id);
  if (others.length > 0) {
    toDelete.push(r);
    affectedProtocols.add(r.protocol_id);
  }
}

console.log(`Duplicates to delete: ${toDelete.length}`);
console.log(`Protocols to recount: ${affectedProtocols.size}\n`);

for (const r of toDelete) {
  const { error } = await supabase.from('service_logs').delete().eq('id', r.id);
  if (error) {
    console.error(`  Failed to delete ${r.id}:`, error.message);
  } else {
    console.log(`  Deleted ${r.entry_date} ${r.dosage} (${r.id.substring(0,8)})`);
  }
}

console.log('\nRecounting affected protocols:\n');
for (const protoId of affectedProtocols) {
  const { count } = await supabase
    .from('service_logs')
    .select('*', { count: 'exact', head: true })
    .eq('protocol_id', protoId)
    .in('entry_type', ['injection', 'session']);

  const { data: proto, error } = await supabase
    .from('protocols')
    .update({ sessions_used: count || 0, updated_at: new Date().toISOString() })
    .eq('id', protoId)
    .select('id, sessions_used, total_sessions, patient_id')
    .single();

  if (error) {
    console.error(`  ${protoId.substring(0,8)}: update failed`, error.message);
  } else {
    console.log(`  ${proto.id.substring(0,8)} pat=${proto.patient_id.substring(0,8)} → ${proto.sessions_used}/${proto.total_sessions}`);
  }
}

console.log('\nDone.');
