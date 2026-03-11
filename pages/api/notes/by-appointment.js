// pages/api/notes/by-appointment.js
// Fetch all notes linked to a specific appointment

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { appointment_id } = req.query;

  if (!appointment_id) {
    return res.status(400).json({ error: 'appointment_id is required' });
  }

  try {
    // Fetch notes for this appointment, including addendums
    const { data: notes, error } = await supabase
      .from('patient_notes')
      .select('*')
      .or(`appointment_id.eq.${appointment_id},parent_note_id.not.is.null`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Filter: get direct notes + their addendums
    const directNotes = (notes || []).filter(n => n.appointment_id === appointment_id);
    const directNoteIds = new Set(directNotes.map(n => n.id));
    const addendums = (notes || []).filter(n => n.parent_note_id && directNoteIds.has(n.parent_note_id));

    // Combine and sort
    const allNotes = [...directNotes, ...addendums.filter(a => !directNoteIds.has(a.id))];
    allNotes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return res.status(200).json({ success: true, notes: allNotes });
  } catch (error) {
    console.error('Fetch encounter notes error:', error);
    return res.status(500).json({ error: error.message });
  }
}
