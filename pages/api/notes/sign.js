// pages/api/notes/sign.js
// Sign and lock a clinical note (standard EMR workflow)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { note_id, signed_by } = req.body;

  if (!note_id || !signed_by) {
    return res.status(400).json({ error: 'note_id and signed_by are required' });
  }

  try {
    // Fetch the note first to check authorship and status
    const { data: note, error: fetchError } = await supabase
      .from('patient_notes')
      .select('id, created_by, status')
      .eq('id', note_id)
      .single();

    if (fetchError || !note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only the author can sign their own note
    if (note.created_by && note.created_by !== signed_by) {
      return res.status(403).json({ error: 'Only the note author can sign this note' });
    }

    // Can't sign an already signed note
    if (note.status === 'signed') {
      return res.status(400).json({ error: 'Note is already signed' });
    }

    // Sign the note
    const { data: updated, error: updateError } = await supabase
      .from('patient_notes')
      .update({
        status: 'signed',
        signed_by,
        signed_at: new Date().toISOString(),
      })
      .eq('id', note_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({ success: true, note: updated });
  } catch (error) {
    console.error('Sign note error:', error);
    return res.status(500).json({ error: error.message });
  }
}
