// pages/api/notes/addendum.js
// Create an addendum to a signed note

import { createClient } from '@supabase/supabase-js';
import { nowPacificISO } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { parent_note_id, patient_id, body, raw_input, created_by, appointment_id, encounter_service } = req.body;

  if (!parent_note_id || !patient_id || !body) {
    return res.status(400).json({ error: 'parent_note_id, patient_id, and body are required' });
  }

  try {
    // Verify parent note exists and is signed
    const { data: parentNote, error: fetchError } = await supabase
      .from('patient_notes')
      .select('id, status, appointment_id, encounter_service')
      .eq('id', parent_note_id)
      .single();

    if (fetchError || !parentNote) {
      return res.status(404).json({ error: 'Parent note not found' });
    }

    if (parentNote.status !== 'signed') {
      return res.status(400).json({ error: 'Addendums can only be added to signed notes' });
    }

    // Create the addendum
    const { data: addendum, error: insertError } = await supabase
      .from('patient_notes')
      .insert({
        patient_id,
        body,
        raw_input: raw_input || body,
        created_by: created_by || null,
        source: 'addendum',
        status: 'draft',
        parent_note_id,
        appointment_id: appointment_id || parentNote.appointment_id || null,
        encounter_service: encounter_service || parentNote.encounter_service || null,
        note_date: nowPacificISO(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({ success: true, note: addendum });
  } catch (error) {
    console.error('Create addendum error:', error);
    return res.status(500).json({ error: error.message });
  }
}
