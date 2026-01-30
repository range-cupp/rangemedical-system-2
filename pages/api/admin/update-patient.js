// /pages/api/admin/update-patient.js
// Quick endpoint to update patient fields
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const { patient_id, name, email, phone, ghl_contact_id, update_purchases } = req.body;

  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id required' });
  }

  try {
    // Get current patient
    const { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patient_id)
      .single();

    if (fetchError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Build updates
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (ghl_contact_id) updates.ghl_contact_id = ghl_contact_id;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    // Update patient
    const { error: updateError } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', patient_id);

    if (updateError) {
      return res.status(500).json({ error: 'Update failed', details: updateError });
    }

    // Update purchases if name changed and requested
    if (updates.name && update_purchases !== false) {
      await supabase
        .from('purchases')
        .update({ patient_name: updates.name })
        .eq('patient_id', patient_id);
    }

    return res.status(200).json({
      success: true,
      patient_id,
      old_values: {
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        ghl_contact_id: patient.ghl_contact_id
      },
      new_values: updates
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
