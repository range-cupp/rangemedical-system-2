// Fix Claudia Rangel's protocol tracking inflation.
//
// Problem: 12 injection rows logged but only 10 paid for. Apr 4 and Apr 11
// were manually backfilled on Apr 21 to record self-administered doses
// taken during her Japan trip — those 2 doses were already represented by
// the Mar 28 pickup row (qty=2). Result: 2 duplicate injection rows
// inflating sessions_used to 12.
//
// Fix:
//   1. Reclassify Apr 4 + Apr 11 service_logs to entry_type='self_administered'
//      (preserves clinical record of administration dates without counting
//      them as billable injection events)
//   2. Cross-reference admin dates in Mar 28 pickup notes
//   3. Recount sessions_used from injection-type rows only → 10
//   4. Update total_sessions to match paid doses (10)
//
// This is data correction only; no code changes.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PID = '6ceba3d7-7da1-4595-81b1-826bce5352a2';
const PROTO = '18c239dc-b81a-4b43-8038-f19441f0e2fc';
const APR4_LOG_ID  = '20c3e881-f112-4d95-9a98-62ba37f3413a';
const APR11_LOG_ID = '391e3881-76d7-4ab3-8115-6e748291de6b';
const MAR28_PICKUP_ID = '7d6f6ae7-c2ec-4d61-8900-d50c17e2e5c3';

console.log('═══════════════════════════════════════════════════');
console.log('  CLAUDIA RANGEL — DATA CORRECTION');
console.log('═══════════════════════════════════════════════════\n');

// 1. Reclassify Apr 4
{
  const { error } = await supabase
    .from('service_logs')
    .update({
      entry_type: 'self_administered',
      notes: 'Self-administered while in Japan. Dose dispensed via Mar 28 pickup.',
      updated_at: new Date().toISOString(),
    })
    .eq('id', APR4_LOG_ID);
  if (error) {
    console.error('Apr 4 reclassify failed:', error);
    process.exit(1);
  }
  console.log('✓ Apr 4 reclassified as self_administered');
}

// 2. Reclassify Apr 11
{
  const { error } = await supabase
    .from('service_logs')
    .update({
      entry_type: 'self_administered',
      notes: 'Self-administered while in Japan. Dose dispensed via Mar 28 pickup.',
      updated_at: new Date().toISOString(),
    })
    .eq('id', APR11_LOG_ID);
  if (error) {
    console.error('Apr 11 reclassify failed:', error);
    process.exit(1);
  }
  console.log('✓ Apr 11 reclassified as self_administered');
}

// 3. Cross-reference admin dates in Mar 28 pickup notes
{
  const { error } = await supabase
    .from('service_logs')
    .update({
      notes: '2-dose take-home pickup for Japan trip. Administered Apr 4 and Apr 11.',
      updated_at: new Date().toISOString(),
    })
    .eq('id', MAR28_PICKUP_ID);
  if (error) {
    console.error('Mar 28 pickup notes update failed:', error);
    process.exit(1);
  }
  console.log('✓ Mar 28 pickup notes updated with cross-reference');
}

// 4. Recount sessions_used from injection-type rows
const { count: actualInjectionCount } = await supabase
  .from('service_logs')
  .select('*', { count: 'exact', head: true })
  .eq('protocol_id', PROTO)
  .in('entry_type', ['injection', 'session']);

console.log(`\n  Recounted injection rows: ${actualInjectionCount}`);

// 5. Update protocol: sessions_used = recounted, total_sessions = 10
{
  const { error } = await supabase
    .from('protocols')
    .update({
      sessions_used: actualInjectionCount || 0,
      total_sessions: 10,
      updated_at: new Date().toISOString(),
    })
    .eq('id', PROTO);
  if (error) {
    console.error('Protocol update failed:', error);
    process.exit(1);
  }
  console.log(`✓ Protocol updated: sessions_used=${actualInjectionCount}, total_sessions=10`);
}

// Verify
console.log('\n═══════════════════════════════════════════════════');
console.log('  VERIFICATION');
console.log('═══════════════════════════════════════════════════\n');

const { data: proto } = await supabase
  .from('protocols')
  .select('sessions_used, total_sessions, status, selected_dose')
  .eq('id', PROTO)
  .single();

console.log('Protocol:', proto);

const { data: logs } = await supabase
  .from('service_logs')
  .select('entry_date, entry_type, dosage')
  .eq('protocol_id', PROTO)
  .order('entry_date');

console.log('\nService logs (after fix):');
logs.forEach(l => console.log(`  ${l.entry_date} [${l.entry_type}] ${l.dosage || '-'}`));

const injCount = logs.filter(l => ['injection','session'].includes(l.entry_type)).length;
const selfCount = logs.filter(l => l.entry_type === 'self_administered').length;
const pickupCount = logs.filter(l => ['pickup','med_pickup'].includes(l.entry_type)).length;
console.log(`\nSummary: ${injCount} injections | ${selfCount} self-administered | ${pickupCount} pickup`);
console.log(`Protocol shows: ${proto.sessions_used}/${proto.total_sessions}`);
