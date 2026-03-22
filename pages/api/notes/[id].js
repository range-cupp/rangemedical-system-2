// /pages/api/notes/[id].js
// Delete, update content, or pin/unpin a clinical note

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map login emails to all possible created_by values (handles pre-transition names)
const AUTHOR_ALIASES = {
  'burgess@range-medical.com': ['burgess@range-medical.com', 'dr. damien burgess', 'dr. burgess', 'damien burgess'],
  'lily@range-medical.com': ['lily@range-medical.com', 'lily'],
  'evan@range-medical.com': ['evan@range-medical.com', 'evan'],
  'chris@range-medical.com': ['chris@range-medical.com', 'chris', 'chris cupp'],
};

function isNoteAuthor(noteCreatedBy, requestingUser) {
  if (!noteCreatedBy || !requestingUser) return false;
  if (noteCreatedBy === requestingUser) return true;
  const aliases = AUTHOR_ALIASES[requestingUser?.toLowerCase()] || [];
  return aliases.some(alias => alias === noteCreatedBy.toLowerCase());
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Note ID required' });
  }

  if (req.method === 'DELETE') {
    try {
      // Fetch note to check authorship and signed status
      const { data: note, error: fetchError } = await supabase
        .from('patient_notes')
        .select('id, created_by, status')
        .eq('id', id)
        .single();

      if (fetchError || !note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // Cannot delete signed notes
      if (note.status === 'signed') {
        return res.status(403).json({ error: 'Cannot delete a signed note. Add an addendum instead.' });
      }

      // Authorship check (if created_by is set and requester provided)
      const { requesting_user } = req.body || {};
      if (note.created_by && requesting_user && !isNoteAuthor(note.created_by, requesting_user)) {
        return res.status(403).json({ error: 'Only the note author can delete this note' });
      }

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
      const { pinned, body } = req.body;

      // Get the note to find its patient_id, authorship, and status
      const { data: note, error: fetchError } = await supabase
        .from('patient_notes')
        .select('id, patient_id, created_by, status')
        .eq('id', id)
        .single();

      if (fetchError || !note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // Cannot edit signed notes (except for pinning)
      if (note.status === 'signed' && typeof body === 'string') {
        return res.status(403).json({ error: 'Cannot edit a signed note. Add an addendum instead.' });
      }

      // Authorship check for content edits
      const { requesting_user, note_date } = req.body;
      if ((typeof body === 'string' || note_date) && note.created_by && requesting_user && !isNoteAuthor(note.created_by, requesting_user)) {
        return res.status(403).json({ error: 'Only the note author can edit this note' });
      }

      // Build update object
      const updates = {};

      // Handle pin toggle
      if (typeof pinned === 'boolean') {
        if (pinned) {
          // Unpin any currently pinned note for this patient
          await supabase
            .from('patient_notes')
            .update({ pinned: false })
            .eq('patient_id', note.patient_id)
            .eq('pinned', true);
        }
        updates.pinned = pinned;
      }

      // Handle body/content edit
      if (typeof body === 'string') {
        updates.body = body;
      }

      // Handle note_date edit (for backdating pre-transition notes)
      if (note_date) {
        updates.note_date = note_date;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update (body, pinned, or note_date)' });
      }

      const { error: updateError } = await supabase
        .from('patient_notes')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      return res.status(200).json({ success: true, ...updates });
    } catch (error) {
      console.error('Note update error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
