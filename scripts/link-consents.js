// scripts/link-consents.js
// Backfill patient_id for existing consents

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMxNDksImV4cCI6MjA4MDI4OTE0OX0.NrI1AykMBOh91mM9BFvpSH0JwzGrkv5ADDkZinh0elc'
);

async function linkConsents() {
  console.log('Fetching patients...');

  // Get patients with emails
  const { data: patients, error: pErr } = await supabase
    .from('patients')
    .select('id, email');

  if (pErr) {
    console.error('Error fetching patients:', pErr);
    return;
  }

  const emailToPatientId = {};
  patients.forEach(p => {
    if (p.email) emailToPatientId[p.email.toLowerCase()] = p.id;
  });

  console.log('Found', Object.keys(emailToPatientId).length, 'patients with emails');

  // Get consents without patient_id
  const { data: consents, error: cErr } = await supabase
    .from('consents')
    .select('id, email')
    .is('patient_id', null);

  if (cErr) {
    console.error('Error fetching consents:', cErr);
    return;
  }

  console.log('Found', consents.length, 'consents without patient_id');

  let linked = 0;
  let skipped = 0;

  for (const consent of consents) {
    const email = (consent.email || '').toLowerCase();
    const patientId = emailToPatientId[email];

    if (patientId) {
      const { error } = await supabase
        .from('consents')
        .update({ patient_id: patientId })
        .eq('id', consent.id);

      if (!error) {
        linked++;
      } else {
        console.error('Error linking consent', consent.id, ':', error.message);
      }
    } else {
      skipped++;
    }
  }

  console.log('---');
  console.log('Linked to existing patients:', linked);
  console.log('Skipped (no matching patient):', skipped);
}

linkConsents().catch(console.error);
