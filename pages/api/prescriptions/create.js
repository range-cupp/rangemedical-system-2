// pages/api/prescriptions/create.js
// Create a draft prescription (scaffolding — e-prescribing not yet active)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    patient_id, appointment_id, note_id,
    medication_name, strength, form, quantity, sig, refills, days_supply, daw,
    is_controlled, schedule, category,
    created_by
  } = req.body;

  if (!patient_id || !medication_name) {
    return res.status(400).json({ error: 'patient_id and medication_name are required' });
  }

  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        patient_id,
        appointment_id: appointment_id || null,
        note_id: note_id || null,
        medication_name,
        strength: strength || null,
        form: form || null,
        quantity: quantity || null,
        sig: sig || null,
        refills: refills || 0,
        days_supply: days_supply ? parseInt(days_supply) : null,
        daw: daw || false,
        is_controlled: is_controlled || false,
        schedule: schedule || null,
        category: category || null,
        status: 'draft',
        created_by: created_by || null,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, prescription: data });
  } catch (error) {
    console.error('Create prescription error:', error);
    return res.status(500).json({ error: error.message });
  }
}
