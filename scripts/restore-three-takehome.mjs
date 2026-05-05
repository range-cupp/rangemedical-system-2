// Restore sessions_used for Melissa Rizk, Justin Bird, Dan Benhamo to
// their pre-spawn-backfill values. They're take-home-only patients whose
// counts shouldn't have been pulled down by the recount.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const RESTORES = [
  { protocolId: 'c55bb5e7', name: 'Melissa Rizk',  sessions_used: 30 },
  { protocolId: '06fb9b70', name: 'Justin Bird',    sessions_used: 5 },
  { protocolId: 'a645fc72', name: 'Dan Benhamo',    sessions_used: 4 },
];

// Find full protocol IDs
const shortIds = RESTORES.map(r => r.protocolId);
const { data: protos } = await supabase
  .from('protocols')
  .select('id, sessions_used, total_sessions, patient_id')
  .eq('program_type', 'weight_loss')
  .eq('status', 'active');

for (const r of RESTORES) {
  const proto = protos.find(p => p.id.startsWith(r.protocolId));
  if (!proto) { console.log(`! ${r.name}: protocol ${r.protocolId} not found`); continue; }

  const { error } = await supabase
    .from('protocols')
    .update({
      sessions_used: r.sessions_used,
      updated_at: new Date().toISOString(),
    })
    .eq('id', proto.id);

  if (error) { console.error(`Failed ${r.name}:`, error); continue; }
  console.log(`✓ ${r.name} sessions_used restored ${proto.sessions_used} → ${r.sessions_used} (total ${proto.total_sessions})`);
}
