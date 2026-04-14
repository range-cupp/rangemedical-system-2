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
    const { medication_name, strength, form, sig, start_date, source, is_active, last_pickup_date, last_pickup_quantity, quantity_unit } = req.body;
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
        last_pickup_date: last_pickup_date && last_pickup_date !== '' ? last_pickup_date : null,
        last_pickup_quantity: last_pickup_quantity && last_pickup_quantity !== '' ? parseInt(last_pickup_quantity, 10) : null,
        quantity_unit: quantity_unit && quantity_unit !== '' ? quantity_unit : 'pills',
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

    // Sanitize pickup fields — empty strings break date/integer columns
    if ('last_pickup_date' in updates) {
      updates.last_pickup_date = updates.last_pickup_date || null;
    }
    if ('last_pickup_quantity' in updates) {
      updates.last_pickup_quantity = updates.last_pickup_quantity ? parseInt(updates.last_pickup_quantity, 10) : null;
    }
    if ('start_date' in updates) {
      updates.start_date = updates.start_date || null;
    }
    if ('stop_date' in updates) {
      updates.stop_date = updates.stop_date || null;
    }
    // Clean empty strings to null for text fields
    ['strength', 'form', 'sig', 'source', 'quantity_unit'].forEach(k => {
      if (k in updates && updates[k] === '') updates[k] = null;
    });

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

  // DELETE — remove medication
  if (req.method === 'DELETE') {
    const { id: medId } = req.body;
    if (!medId) return res.status(400).json({ error: 'Medication ID required' });

    const { error } = await supabase
      .from('patient_medications')
      .delete()
      .eq('id', medId)
      .eq('patient_id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
