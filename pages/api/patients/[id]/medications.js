// pages/api/patients/[id]/medications.js
// CRUD for patient_medications table — admin/provider only

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Patient ID required' });

  // POST — add new medication
  if (req.method === 'POST') {
    const { medication_name, strength, form, sig, start_date, source, is_active } = req.body;
    if (!medication_name) return res.status(400).json({ error: 'Medication name required' });

    const { data, error } = await supabase
      .from('patient_medications')
      .insert({
        patient_id: id,
        medication_name,
        strength: strength || null,
        form: form || null,
        sig: sig || null,
        start_date: start_date || new Date().toISOString().split('T')[0],
        source: source || null,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // PUT — update existing medication
  if (req.method === 'PUT') {
    const { id: medId, ...updates } = req.body;
    if (!medId) return res.status(400).json({ error: 'Medication ID required' });

    const { data, error } = await supabase
      .from('patient_medications')
      .update(updates)
      .eq('id', medId)
      .eq('patient_id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
