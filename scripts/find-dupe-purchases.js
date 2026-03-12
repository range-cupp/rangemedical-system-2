const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

async function fetchAll() {
  let all = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('purchases')
      .select('id, patient_id, patient_name, purchase_date, item_name, amount, source, created_at, protocol_id, protocol_created, session_logged, ghl_payment_id, ghl_invoice_id, stripe_payment_intent_id')
      .order('purchase_date', { ascending: true })
      .range(from, from + batchSize - 1);
    if (error) { console.error('Fetch error:', error.message); break; }
    all = all.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return all;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const purchases = await fetchAll();
  console.log('Total purchases fetched:', purchases.length);

  // Group by patient + date + item_name + amount to find exact duplicates
  const groups = {};
  for (const p of purchases) {
    const key = `${(p.patient_name || '').trim()}|${p.purchase_date}|${(p.item_name || '').trim()}|${p.amount}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  // Find groups with duplicates
  const dupeGroups = Object.entries(groups).filter(([, arr]) => arr.length > 1);
  console.log('Duplicate groups found:', dupeGroups.length);

  let totalDupes = 0;
  const toDelete = [];

  for (const [key, arr] of dupeGroups) {
    // Keep the one with the most data (protocol_id, ghl_payment_id, etc.)
    arr.sort((a, b) => {
      // Prefer one with protocol_id
      if (a.protocol_id && !b.protocol_id) return -1;
      if (!a.protocol_id && b.protocol_id) return 1;
      // Prefer one with ghl_payment_id
      if (a.ghl_payment_id && !b.ghl_payment_id) return -1;
      if (!a.ghl_payment_id && b.ghl_payment_id) return 1;
      // Prefer one with stripe_payment_intent_id
      if (a.stripe_payment_intent_id && !b.stripe_payment_intent_id) return -1;
      if (!a.stripe_payment_intent_id && b.stripe_payment_intent_id) return 1;
      // Keep oldest
      return new Date(a.created_at) - new Date(b.created_at);
    });

    const keep = arr[0];
    const dupes = arr.slice(1);
    totalDupes += dupes.length;

    console.log(`\n[${arr.length}x] ${key.split('|').slice(0,3).join(' | ')} | $${key.split('|')[3]}`);
    console.log(`  KEEP: ${keep.id.substring(0,8)} | src:${keep.source} | proto:${keep.protocol_id ? keep.protocol_id.substring(0,8) : 'none'} | ghl:${keep.ghl_payment_id ? 'yes' : 'no'} | created:${keep.created_at?.substring(0,10)}`);
    for (const d of dupes) {
      console.log(`  DEL:  ${d.id.substring(0,8)} | src:${d.source} | proto:${d.protocol_id ? d.protocol_id.substring(0,8) : 'none'} | ghl:${d.ghl_payment_id ? 'yes' : 'no'} | created:${d.created_at?.substring(0,10)}`);
      toDelete.push(d.id);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total duplicate entries to delete: ${totalDupes}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no deletions)' : 'LIVE'}`);

  if (!dryRun && toDelete.length > 0) {
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      const { error: delErr } = await supabase
        .from('purchases')
        .delete()
        .in('id', batch);
      if (delErr) console.error('Delete batch error:', delErr.message);
      else console.log(`Deleted batch ${Math.floor(i/50) + 1} (${batch.length} records)`);
    }
    console.log(`\nDone! Deleted ${toDelete.length} duplicate purchases.`);

    const remaining = await fetchAll();
    console.log(`Remaining purchases: ${remaining.length}`);
  }
}
main().catch(console.error);
