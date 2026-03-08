// Script to find and remove duplicate appointments
// CSV-imported appointments that overlap with existing clinic_appointments
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

async function main() {
  // Get all CSV-imported appointments
  const { data: csvAppts } = await supabase
    .from('appointments')
    .select('id, patient_id, service_name, start_time, service_category')
    .eq('created_by', 'ghl_csv_import');

  console.log('Total CSV-imported appointments:', (csvAppts || []).length);
  if (!csvAppts || csvAppts.length === 0) return;

  // Get all clinic_appointments (from GHL webhooks)
  const { data: clinicAppts } = await supabase
    .from('clinic_appointments')
    .select('id, patient_id, calendar_name, appointment_date, start_time');

  console.log('Total clinic_appointments:', (clinicAppts || []).length);

  // Find duplicates: same patient_id + same date
  const dupeIds = [];
  for (const csv of csvAppts) {
    const csvDate = (csv.start_time || '').split('T')[0];
    const match = (clinicAppts || []).find(ca =>
      ca.patient_id === csv.patient_id &&
      ca.appointment_date === csvDate
    );
    if (match) {
      dupeIds.push(csv.id);
    }
  }
  console.log('Duplicates to remove:', dupeIds.length);
  console.log('Unique CSV entries to keep:', csvAppts.length - dupeIds.length);

  if (dupeIds.length === 0) {
    console.log('No duplicates found.');
    return;
  }

  // Delete duplicates in batches of 50
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) {
    console.log('DRY RUN — would delete', dupeIds.length, 'entries');
    return;
  }

  let deleted = 0;
  for (let i = 0; i < dupeIds.length; i += 50) {
    const batch = dupeIds.slice(i, i + 50);
    const { error } = await supabase
      .from('appointments')
      .delete()
      .in('id', batch);
    if (error) {
      console.error('Delete error:', error.message);
    } else {
      deleted += batch.length;
    }
  }
  console.log('Deleted', deleted, 'duplicate appointments.');
}

main().catch(console.error);
