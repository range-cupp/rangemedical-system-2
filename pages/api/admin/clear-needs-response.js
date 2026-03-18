// /pages/api/admin/clear-needs-response.js
// Manually clear needs_response flag for a patient
// Optionally logs an internal note explaining why no response was needed
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patientId, note } = req.body;

  if (!patientId) {
    return res.status(400).json({ error: 'patientId is required' });
  }

  try {
    // Clear all needs_response flags for this patient
    const { data, error } = await supabase
      .from('comms_log')
      .update({ needs_response: false })
      .eq('patient_id', patientId)
      .eq('needs_response', true)
      .select('id');

    if (error) {
      console.error('[clear-needs-response] error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    // Log an internal note if provided
    let noteId = null;
    if (note && note.trim()) {
      // Get patient name for the log entry
      const { data: patient } = await supabase
        .from('patients')
        .select('name, first_name, last_name')
        .eq('id', patientId)
        .maybeSingle();

      const patientName = patient
        ? (patient.first_name && patient.last_name
            ? `${patient.first_name} ${patient.last_name}`
            : patient.name)
        : null;

      const { data: noteRow, error: noteErr } = await supabase
        .from('comms_log')
        .insert({
          patient_id: patientId,
          patient_name: patientName,
          channel: 'sms',
          message_type: 'internal_note',
          message: note.trim(),
          direction: 'outbound',
          source: 'internal_note',
          status: 'sent',
          needs_response: false,
        })
        .select('id')
        .single();

      if (noteErr) {
        console.error('[clear-needs-response] note insert error:', noteErr.message);
      } else {
        noteId = noteRow?.id || null;
      }
    }

    return res.status(200).json({ success: true, cleared: data?.length || 0, noteId });
  } catch (err) {
    console.error('[clear-needs-response] unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}
