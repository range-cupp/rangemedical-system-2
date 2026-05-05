// Trigger the new spawn helper for Tim's existing May 5 pickup so the
// May 12 take-home injection row appears in his schedule.

import { createClient } from '@supabase/supabase-js';
import { spawnTakeHomeInjections } from '../lib/spawn-takehome-injections.js';

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PROTO = '4d44b9b7-f5e6-4929-b5d3-16cb5350f08e';

const { data: pickups } = await supabase
  .from('service_logs')
  .select('*')
  .eq('protocol_id', PROTO)
  .eq('entry_type', 'pickup')
  .order('entry_date');

const { data: proto } = await supabase
  .from('protocols')
  .select('id, frequency, injection_day, medication, selected_dose, dose')
  .eq('id', PROTO)
  .single();

console.log(`Protocol injection_day=${proto.injection_day} frequency=${proto.frequency}`);
console.log(`Pickups found: ${pickups.length}\n`);

for (const p of pickups) {
  console.log(`Pickup ${p.entry_date} qty=${p.quantity} ${p.dosage}`);
  const result = await spawnTakeHomeInjections(supabase, p, proto);
  console.log(`  spawned=${result.spawned} skipped=${result.skipped}`);
}

// Recount
const { count } = await supabase
  .from('service_logs')
  .select('*', { count: 'exact', head: true })
  .eq('protocol_id', PROTO)
  .in('entry_type', ['injection', 'session']);

await supabase
  .from('protocols')
  .update({ sessions_used: count || 0, updated_at: new Date().toISOString() })
  .eq('id', PROTO);

console.log(`\nsessions_used now: ${count}`);

// Print full timeline
const { data: logs } = await supabase
  .from('service_logs')
  .select('entry_date, entry_type, dosage, fulfillment_method, weight, notes')
  .eq('protocol_id', PROTO)
  .order('entry_date');

console.log(`\nTimeline:`);
let injCount = 0;
for (const l of logs) {
  if (['injection', 'session'].includes(l.entry_type)) injCount++;
  const isInj = ['injection', 'session'].includes(l.entry_type);
  const numTag = isInj ? `Inj #${injCount}` : `       `;
  const setting = l.fulfillment_method === 'overnight' ? 'take-home' :
                  l.fulfillment_method === 'in_clinic' ? 'in-clinic' : '-';
  console.log(`  ${numTag} | ${l.entry_date} [${l.entry_type}] ${l.dosage || '-'} ${setting} wt=${l.weight ?? '-'}`);
}
