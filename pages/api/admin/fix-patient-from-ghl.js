// /pages/api/admin/fix-patient-from-ghl.js
// Fix patient name by fetching from GHL API
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';

export default async function handler(req, res) {
  // POST with patient_id or ghl_contact_id to fix
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { patient_id, ghl_contact_id } = req.body;

  if (!patient_id && !ghl_contact_id) {
    return res.status(400).json({ error: 'Provide patient_id or ghl_contact_id' });
  }

  try {
    // Find the patient
    let patient;
    if (patient_id) {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patient_id)
        .single();
      patient = data;
    } else {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .eq('ghl_contact_id', ghl_contact_id)
        .single();
      patient = data;
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const contactId = patient.ghl_contact_id;
    if (!contactId) {
      return res.status(400).json({ error: 'Patient has no ghl_contact_id' });
    }

    // Fetch from GHL
    const ghlResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );

    if (!ghlResponse.ok) {
      return res.status(500).json({ error: 'GHL API error', status: ghlResponse.status });
    }

    const ghlData = await ghlResponse.json();
    const contact = ghlData.contact;

    if (!contact) {
      return res.status(404).json({ error: 'GHL contact not found' });
    }

    // Build updated patient data
    const firstName = contact.firstName || '';
    const lastName = contact.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || patient.name;

    const updates = {
      name: fullName
    };

    // Also update email/phone if missing
    if (!patient.email && contact.email) {
      updates.email = contact.email;
    }
    if (!patient.phone && contact.phone) {
      updates.phone = contact.phone;
    }

    // Update patient
    const { error: updateError } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', patient.id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update patient', details: updateError });
    }

    // Also update any purchases with this patient
    await supabase
      .from('purchases')
      .update({ patient_name: fullName })
      .eq('patient_id', patient.id);

    await supabase
      .from('purchases')
      .update({ patient_name: fullName })
      .eq('ghl_contact_id', contactId);

    return res.status(200).json({
      success: true,
      patient_id: patient.id,
      old_name: patient.name,
      new_name: fullName,
      ghl_contact: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone
      },
      updates_applied: updates
    });

  } catch (error) {
    console.error('Fix patient error:', error);
    return res.status(500).json({ error: error.message });
  }
}
