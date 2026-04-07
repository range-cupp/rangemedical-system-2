// /pages/api/notes/[id].js
// Delete, update content, or pin/unpin a clinical note

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

import { isNoteAuthor, isAdmin, ADMIN_EMAILS } from '../../../lib/staff-config';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Note ID required' });
  }

  if (req.method === 'DELETE') {
    try {
      // Fetch full note for authorship check and audit log
      const { data: note, error: fetchError } = await supabase
        .from('patient_notes')
        .select('id, patient_id, created_by, status, body, source, note_category, created_at, note_date, encounter_service, protocol_name')
        .eq('id', id)
        .single();

      if (fetchError || !note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // Require requesting_user for authorship check
      const { requesting_user, reason } = req.body || {};
      if (!requesting_user) {
        return res.status(400).json({ error: 'requesting_user is required' });
      }

      // Signed notes can only be deleted by admin
      if (note.status === 'signed' && !isAdmin(requesting_user)) {
        return res.status(403).json({ error: 'Cannot delete a signed note. Add an addendum instead.' });
      }

      // Only the note author or an admin can delete
      if (!isAdmin(requesting_user) && note.created_by && !isNoteAuthor(note.created_by, requesting_user)) {
        return res.status(403).json({ error: 'Only the note author or an admin can delete this note' });
      }

      // Log deletion to audit table before deleting
      await supabase.from('note_deletions').insert({
        note_id: note.id,
        patient_id: note.patient_id,
        deleted_by: requesting_user,
        note_body: note.body,
        note_source: note.source,
        note_status: note.status,
        note_category: note.note_category,
        note_created_by: note.created_by,
        note_created_at: note.created_at,
        note_date: note.note_date,
        encounter_service: note.encounter_service,
        protocol_name: note.protocol_name,
        reason: reason || null,
      });

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

      // Authorship check for content edits
      const { requesting_user, note_date } = req.body;

      // Signed notes can only be edited by the original author
      if (note.status === 'signed' && typeof body === 'string') {
        if (!requesting_user || !note.created_by || !isNoteAuthor(note.created_by, requesting_user)) {
          return res.status(403).json({ error: 'Only the original author can edit a signed note.' });
        }
      }

      // Draft notes — only author can edit
      if (note.status !== 'signed' && (typeof body === 'string' || note_date) && note.created_by && requesting_user && !isNoteAuthor(note.created_by, requesting_user)) {
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

      // Log edit history when a signed note body is modified
      if (note.status === 'signed' && typeof body === 'string') {
        // Fetch current body for audit trail
        const { data: fullNote } = await supabase
          .from('patient_notes')
          .select('body, patient_id')
          .eq('id', id)
          .single();
        if (fullNote) {
          await supabase.from('note_edits').insert({
            note_id: id,
            patient_id: fullNote.patient_id,
            edited_by: requesting_user,
            previous_body: fullNote.body,
            new_body: body,
          });
        }
        updates.edited_after_signing = true;
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
