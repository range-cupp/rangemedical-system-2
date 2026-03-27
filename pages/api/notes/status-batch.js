// pages/api/notes/status-batch.js
// Batch check which appointments have encounter notes and their status
// Returns: { [appointment_id]: { hasNote: true, status: 'signed'|'draft'|'unsigned' } }

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { appointment_ids } = req.query;

  if (!appointment_ids) {
    return res.status(400).json({ error: 'appointment_ids is required' });
  }

  const ids = appointment_ids.split(',').filter(Boolean);
  if (ids.length === 0) {
    return res.status(200).json({ noteStatus: {} });
  }

  try {
    const { data: notes, error } = await supabase
      .from('patient_notes')
      .select('appointment_id, status')
      .in('appointment_id', ids)
      .is('parent_note_id', null); // Only primary notes, not addendums

    if (error) throw error;

    const noteStatus = {};
    for (const note of (notes || [])) {
      const apptId = note.appointment_id;
      // If multiple notes for same appointment, prefer signed > unsigned > draft
      if (!noteStatus[apptId] || priorityOf(note.status) > priorityOf(noteStatus[apptId].status)) {
        noteStatus[apptId] = { hasNote: true, status: note.status || 'draft' };
      }
    }

    return res.status(200).json({ noteStatus });
  } catch (error) {
    console.error('Note status batch error:', error);
    return res.status(500).json({ error: error.message });
  }
}

function priorityOf(status) {
  if (status === 'signed') return 3;
  if (status === 'unsigned') return 2;
  return 1; // draft
}
