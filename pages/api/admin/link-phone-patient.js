// /pages/api/admin/link-phone-patient.js
// Links a phone-only conversation to a patient record.
// Creates a new patient if none exists for that phone, or links to an existing one.
// Updates all comms_log rows for that phone to point to the patient.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone, firstName, lastName } = req.body;

  if (!phone || !firstName || !lastName) {
    return res.status(400).json({ error: 'phone, firstName, and lastName are required' });
  }

  const normalizedPhone = phone.replace(/\D/g, '');
  const last10 = normalizedPhone.slice(-10);

  if (last10.length < 10) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  try {
    // Check if a patient already exists with this phone
    const { data: existing } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, phone')
      .or(`phone.ilike.%${last10}%`);

    let patient = null;

    if (existing && existing.length > 0) {
      // Find exact phone match
      for (const p of existing) {
        const pLast10 = (p.phone || '').replace(/\D/g, '').slice(-10);
        if (pLast10 === last10) {
          patient = p;
          break;
        }
      }
      if (!patient) patient = existing[0];

      // Update the patient name if it was previously unknown or just a phone number
      const name = `${firstName.trim()} ${lastName.trim()}`;
      const { error: updateErr } = await supabase
        .from('patients')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          name,
        })
        .eq('id', patient.id);

      if (updateErr) {
        console.error('Error updating patient name:', updateErr);
      }

      patient.name = name;
      patient.first_name = firstName.trim();
      patient.last_name = lastName.trim();
    } else {
      // Create new patient
      const name = `${firstName.trim()} ${lastName.trim()}`;
      const formattedPhone = `+1${last10}`;

      const { data: newPatient, error: createErr } = await supabase
        .from('patients')
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          name,
          phone: formattedPhone,
        })
        .select('id, name, first_name, last_name, phone')
        .single();

      if (createErr) {
        console.error('Error creating patient:', createErr);
        return res.status(500).json({ error: 'Failed to create patient' });
      }

      patient = newPatient;
    }

    // Link all comms_log messages for this phone to the patient
    // Match by last 10 digits of recipient
    const { data: orphanedMessages } = await supabase
      .from('comms_log')
      .select('id')
      .is('patient_id', null)
      .ilike('recipient', `%${last10}`);

    if (orphanedMessages && orphanedMessages.length > 0) {
      const ids = orphanedMessages.map(m => m.id);
      const { error: linkErr } = await supabase
        .from('comms_log')
        .update({
          patient_id: patient.id,
          patient_name: patient.name,
        })
        .in('id', ids);

      if (linkErr) {
        console.error('Error linking comms_log:', linkErr);
      }
    }

    // Also update any comms_log rows that have this phone but wrong/missing patient_name
    await supabase
      .from('comms_log')
      .update({ patient_name: patient.name })
      .eq('patient_id', patient.id)
      .neq('patient_name', patient.name);

    return res.status(200).json({
      success: true,
      patient: {
        id: patient.id,
        name: patient.name,
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone,
      },
    });
  } catch (err) {
    console.error('link-phone-patient error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
