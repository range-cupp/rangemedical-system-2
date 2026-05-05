// Backfill historical take-home injection rows so service_logs matches the
// stored sessions_used for Melissa Rizk, Justin Bird, Dan Benhamo.
//
// Strategy: walk backward from each patient's most recent existing
// injection row in weekly intervals, skipping any slot within ±3 days of
// an existing row, creating one entry_type='injection' row per slot until
// we've added the target count.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const TARGETS = [
  { protocolPrefix: 'c55bb5e7', name: 'Melissa Rizk',  target: 30, dose: '2.5mg', medication: 'Tirzepatide' },
  { protocolPrefix: '06fb9b70', name: 'Justin Bird',   target: 5,  dose: '3mg',   medication: 'Retatrutide' },
  { protocolPrefix: 'a645fc72', name: 'Dan Benhamo',   target: 4,  dose: '2mg',   medication: 'Retatrutide' },
];

const { data: allProtos } = await supabase
  .from('protocols')
  .select('id, patient_id, start_date, end_date, frequency, injection_day')
  .eq('program_type', 'weight_loss');

for (const t of TARGETS) {
  const proto = allProtos.find(p => p.id.startsWith(t.protocolPrefix));
  if (!proto) { console.log(`✗ ${t.name}: protocol ${t.protocolPrefix} not found`); continue; }

  const { data: existing } = await supabase
    .from('service_logs')
    .select('id, entry_date, entry_type')
    .eq('protocol_id', proto.id)
    .in('entry_type', ['injection', 'session'])
    .order('entry_date', { ascending: false });

  const haveCount = existing.length;
  const needed = t.target - haveCount;
  if (needed <= 0) {
    console.log(`✓ ${t.name}: already has ${haveCount}/${t.target} — nothing to add`);
    continue;
  }

  // Use the latest existing row's date as the anchor (or today if none exist).
  // The day-of-week becomes the implicit injection_day.
  const anchorStr = existing[0]?.entry_date || new Date().toISOString().split('T')[0];
  const anchor = new Date(anchorStr + 'T12:00:00');

  // Walk backward weekly, skipping dates within ±3 days of existing rows
  const existingSet = new Set(existing.map(e => e.entry_date));
  const isCovered = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    for (const e of existing) {
      const ed = new Date(e.entry_date + 'T12:00:00');
      if (Math.abs((d - ed) / (1000 * 60 * 60 * 24)) <= 3) return true;
    }
    return false;
  };

  const toCreate = [];
  let cursor = new Date(anchor);
  cursor.setDate(cursor.getDate() - 7); // start one week before the anchor
  let safety = 0;

  while (toCreate.length < needed && safety < 200) {
    const cursorStr = cursor.toISOString().split('T')[0];
    if (!isCovered(cursorStr) && !existingSet.has(cursorStr)) {
      toCreate.push(cursorStr);
      existingSet.add(cursorStr);
    }
    cursor.setDate(cursor.getDate() - 7);
    safety++;
  }

  console.log(`\n${t.name}: have ${haveCount}, target ${t.target}, adding ${toCreate.length}`);
  console.log(`  Earliest new row: ${toCreate[toCreate.length - 1]}`);
  console.log(`  Latest new row:   ${toCreate[0]}`);

  for (const dateStr of toCreate) {
    const { error } = await supabase
      .from('service_logs')
      .insert({
        patient_id: proto.patient_id,
        protocol_id: proto.id,
        category: 'weight_loss',
        entry_type: 'injection',
        entry_date: dateStr,
        medication: t.medication,
        dosage: t.dose,
        weight: null,
        fulfillment_method: 'overnight',
        notes: 'Backfilled historical take-home injection (legacy stored count had drifted ahead of service_logs rows).',
      });
    if (error) console.error(`  Failed ${dateStr}:`, error.message);
  }

  // Final recount
  const { count } = await supabase
    .from('service_logs')
    .select('*', { count: 'exact', head: true })
    .eq('protocol_id', proto.id)
    .in('entry_type', ['injection', 'session']);

  await supabase
    .from('protocols')
    .update({ sessions_used: count || 0, updated_at: new Date().toISOString() })
    .eq('id', proto.id);

  console.log(`  ✓ Final sessions_used: ${count}`);
}
