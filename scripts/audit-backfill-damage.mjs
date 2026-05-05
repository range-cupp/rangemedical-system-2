// Find service_logs CREATED by today's backfill (within last 90 min) and
// flag duplicates: rows where another injection already exists on a near
// date for the same protocol.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const ninetyMinAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString();

// Find all service_logs created in the backfill window with note_id linkage
const { data: recent } = await supabase
  .from('service_logs')
  .select('id, patient_id, protocol_id, entry_date, entry_type, dosage, weight, note_id, notes, created_at')
  .gte('created_at', ninetyMinAgo)
  .eq('entry_type', 'injection')
  .eq('category', 'weight_loss')
  .not('note_id', 'is', null)
  .order('created_at');

console.log(`Service_logs CREATED by backfill: ${recent?.length || 0}\n`);

const suspects = [];

for (const r of recent || []) {
  // For each, check: are there OTHER injection rows on the same protocol within ±5 days?
  const startDate = new Date(r.entry_date);
  startDate.setDate(startDate.getDate() - 5);
  const endDate = new Date(r.entry_date);
  endDate.setDate(endDate.getDate() + 5);

  const { data: nearby } = await supabase
    .from('service_logs')
    .select('id, entry_date, entry_type, dosage, note_id, created_at')
    .eq('protocol_id', r.protocol_id)
    .gte('entry_date', startDate.toISOString().split('T')[0])
    .lte('entry_date', endDate.toISOString().split('T')[0])
    .in('entry_type', ['injection', 'session', 'pickup']);

  const others = (nearby || []).filter(x => x.id !== r.id);

  if (others.length > 0) {
    suspects.push({
      newRow: r,
      nearby: others,
    });
  }
}

console.log(`Suspect rows (created with nearby existing entries): ${suspects.length}\n`);

for (const s of suspects.slice(0, 50)) {
  console.log(`NEW: ${s.newRow.entry_date} ${s.newRow.dosage} for proto ${s.newRow.protocol_id.substring(0,8)} (id ${s.newRow.id.substring(0,8)})`);
  for (const n of s.nearby) {
    console.log(`  near: ${n.entry_date} [${n.entry_type}] ${n.dosage || '-'} ${n.note_id ? '(linked)' : '(unlinked)'}`);
  }
  console.log('');
}

// Also list affected protocols (for sessions_used recount)
const affectedProtocols = [...new Set(suspects.map(s => s.newRow.protocol_id))];
console.log(`\nAffected protocols: ${affectedProtocols.length}`);
console.log('Protocol IDs:', affectedProtocols.slice(0, 20));
