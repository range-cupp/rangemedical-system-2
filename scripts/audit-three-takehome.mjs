import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const NAMES = ['rizk', 'bird', 'benhamo'];

for (const lname of NAMES) {
  const { data: patients } = await supabase
    .from('patients')
    .select('id, first_name, last_name')
    .ilike('last_name', `%${lname}%`);

  for (const p of patients || []) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`${p.first_name} ${p.last_name}  (${p.id})`);

    const { data: protos } = await supabase
      .from('protocols')
      .select('id, medication, delivery_method, status, frequency, injection_day, sessions_used, total_sessions, selected_dose')
      .eq('patient_id', p.id)
      .eq('program_type', 'weight_loss');

    for (const proto of protos || []) {
      console.log(`\nProtocol ${proto.id.substring(0,8)} ${proto.status} ${proto.medication} ${proto.delivery_method} ${proto.frequency} injDay=${proto.injection_day || 'null'} dose=${proto.selected_dose}`);
      console.log(`Stored: ${proto.sessions_used}/${proto.total_sessions}`);

      const { data: logs } = await supabase
        .from('service_logs')
        .select('entry_date, entry_type, dosage, quantity, fulfillment_method, notes')
        .eq('protocol_id', proto.id)
        .order('entry_date');

      const counts = {};
      for (const l of logs) counts[l.entry_type] = (counts[l.entry_type] || 0) + 1;
      console.log(`Logs: ${logs.length} rows ${JSON.stringify(counts)}`);

      const pickups = logs.filter(l => l.entry_type === 'pickup' || l.entry_type === 'med_pickup');
      console.log(`Pickups (${pickups.length}):`);
      for (const pk of pickups) {
        console.log(`  ${pk.entry_date} qty=${pk.quantity} dose=${pk.dosage || '-'} fulfill=${pk.fulfillment_method || '-'}`);
        console.log(`    notes: ${(pk.notes || '').substring(0, 80)}`);
      }

      const injs = logs.filter(l => l.entry_type === 'injection' || l.entry_type === 'session');
      console.log(`Injections (${injs.length}):`);
      for (const inj of injs) {
        console.log(`  ${inj.entry_date} dose=${inj.dosage || '-'} fulfill=${inj.fulfillment_method || '-'}`);
      }

      const { data: purchases } = await supabase
        .from('purchases')
        .select('purchase_date, amount_paid, item_name, quantity')
        .eq('protocol_id', proto.id)
        .order('purchase_date');
      console.log(`Purchases (${purchases?.length || 0}):`);
      let totalDoses = 0;
      for (const pu of purchases || []) {
        const itemLower = (pu.item_name || '').toLowerCase();
        const hasMul = /×\s*\d|\bx\s*\d|\bsingle\b/i.test(pu.item_name || '');
        let assumed = pu.quantity > 1 ? pu.quantity : (hasMul ? pu.quantity : 4);
        totalDoses += assumed;
        console.log(`  ${pu.purchase_date} $${pu.amount_paid} qty=${pu.quantity} → ${assumed} doses | ${pu.item_name}`);
      }
      console.log(`  Total assumed doses paid: ${totalDoses}`);
    }
  }
}
