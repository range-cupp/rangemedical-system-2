import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const { data: patients } = await supabase
  .from('patients')
  .select('id, name, first_name, last_name, email, phone')
  .or('name.ilike.%linsey%,last_name.ilike.%krill%,last_name.ilike.%crill%');

console.log('=== Patients matching Linsey/Krill ===');
console.log(JSON.stringify(patients, null, 2));

for (const p of patients || []) {
  console.log(`\n\n=== ALL Protocols for ${p.name || p.first_name + ' ' + p.last_name} (${p.id}) ===`);
  const { data: protocols } = await supabase
    .from('protocols')
    .select('*')
    .eq('patient_id', p.id)
    .order('start_date', { ascending: true });
  for (const pr of protocols || []) {
    console.log(`\n--- Protocol ${pr.id} ---`);
    console.log(`  category: ${pr.category}, program_type: ${pr.program_type}`);
    console.log(`  program_name: ${pr.program_name}`);
    console.log(`  medication: ${pr.medication}`);
    console.log(`  selected_dose: ${pr.selected_dose}`);
    console.log(`  frequency: ${pr.frequency}`);
    console.log(`  status: ${pr.status}`);
    console.log(`  start_date: ${pr.start_date}, end_date: ${pr.end_date}`);
    console.log(`  total_sessions: ${pr.total_sessions}, sessions_used: ${pr.sessions_used}`);
    console.log(`  delivery_method: ${pr.delivery_method}, fulfillment: ${pr.fulfillment_method}`);
    console.log(`  injection_day: ${pr.injection_day}`);
    console.log(`  checkin_reminder_enabled: ${pr.checkin_reminder_enabled}`);
    console.log(`  created_at: ${pr.created_at}`);
  }

  console.log(`\n=== WL Service Logs for ${p.id} ===`);
  const { data: logs } = await supabase
    .from('service_logs')
    .select('id, protocol_id, entry_date, entry_type, medication, dosage, quantity, fulfillment_method, notes, weight, created_at')
    .eq('patient_id', p.id)
    .order('entry_date', { ascending: true });
  for (const l of logs || []) {
    console.log(`  ${l.entry_date} [${l.entry_type}] ${l.medication || ''} ${l.dosage || ''} qty=${l.quantity || 0} ${l.fulfillment_method || ''} (proto ${l.protocol_id || 'none'})  notes: ${(l.notes || '').slice(0, 80)}`);
  }

  console.log(`\n=== Purchases for ${p.id} ===`);
  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, service_name, service_category, total_paid, paid_date, fulfillment_method, status, created_at, protocol_id')
    .eq('patient_id', p.id)
    .order('created_at', { ascending: true });
  for (const pu of purchases || []) {
    console.log(`  ${pu.paid_date || pu.created_at} ${pu.service_category}  $${pu.total_paid}  "${pu.service_name}"  status=${pu.status}  proto=${pu.protocol_id || 'none'}`);
  }
}
