// /pages/api/notes/[id].js
// Delete or update (pin/unpin) a clinical note

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Note ID required' });
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('patient_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Note delete error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { pinned } = req.body;

      if (typeof pinned !== 'boolean') {
        return res.status(400).json({ error: 'pinned (boolean) is required' });
      }

      // Get the note to find its patient_id
      const { data: note, error: fetchError } = await supabase
        .from('patient_notes')
        .select('id, patient_id')
        .eq('id', id)
        .single();

      if (fetchError || !note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      if (pinned) {
        // Unpin any currently pinned note for this patient
        await supabase
          .from('patient_notes')
          .update({ pinned: false })
          .eq('patient_id', note.patient_id)
          .eq('pinned', true);
      }

      // Set the pin state on the target note
      const { error: updateError } = await supabase
        .from('patient_notes')
        .update({ pinned })
        .eq('id', id);

      if (updateError) throw updateError;

      return res.status(200).json({ success: true, pinned });
    } catch (error) {
      console.error('Note pin toggle error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
