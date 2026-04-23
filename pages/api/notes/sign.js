// pages/api/notes/sign.js
// Sign and lock a clinical note (standard EMR workflow)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

import { isNoteAuthor } from '../../../lib/staff-config';
import { notifyTaskAssignee } from '../../../lib/notify-task-assignee';

const BURGESS_EMAIL = 'burgess@range-medical.com';
const EVAN_EMAIL = 'evan@range-medical.com';
const LAB_REVIEW_OR_CONSULT = /lab review|consult/i;

// Auto-task: when Dr. Burgess signs a lab review or consult note, create a
// task for Evan to review the new note. Best-effort — never fail the sign.
async function maybeCreateReviewTask(note) {
  if ((note.created_by || '').toLowerCase() !== BURGESS_EMAIL) return;
  if (!LAB_REVIEW_OR_CONSULT.test(note.encounter_service || '')) return;

  const { data: employees } = await supabase
    .from('employees')
    .select('id, name, email')
    .in('email', [EVAN_EMAIL, BURGESS_EMAIL]);
  const evan = employees?.find(e => e.email === EVAN_EMAIL);
  const burgess = employees?.find(e => e.email === BURGESS_EMAIL);
  if (!evan || !burgess) return;

  let patientName = null;
  if (note.patient_id) {
    const { data: patient } = await supabase
      .from('patients')
      .select('first_name, last_name')
      .eq('id', note.patient_id)
      .single();
    if (patient) patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
  }

  const serviceLabel = (note.encounter_service || 'Encounter').replace(/_/g, ' ');
  const title = `Review encounter note — ${patientName || 'new patient'}`;
  const description = `${serviceLabel} signed by Dr. Burgess. Review the encounter note and follow up with the patient as needed.`;

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      assigned_to: evan.id,
      assigned_by: burgess.id,
      patient_id: note.patient_id || null,
      patient_name: patientName,
      priority: 'medium',
      status: 'pending',
      task_category: 'clinical',
    })
    .select()
    .single();

  if (error) {
    console.error('Auto-task insert error:', error);
    return;
  }

  notifyTaskAssignee(evan.id, {
    assignerName: burgess.name || 'Dr. Burgess',
    taskTitle: title,
    priority: 'medium',
  }).catch(err => console.error('Auto-task SMS error:', err));
}

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
      .select('id, created_by, status, appointment_id')
      .eq('id', note_id)
      .single();

    if (fetchError || !note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only the author can sign their own note
    if (note.created_by && !isNoteAuthor(note.created_by, signed_by)) {
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

    // Fire auto-task for Evan on Burgess lab reviews / consults (best-effort)
    try {
      await maybeCreateReviewTask(updated);
    } catch (taskErr) {
      console.error('maybeCreateReviewTask failed:', taskErr);
    }

    return res.status(200).json({ success: true, note: updated });
  } catch (error) {
    console.error('Sign note error:', error);
    return res.status(500).json({ error: error.message });
  }
}
