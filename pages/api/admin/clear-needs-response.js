// /pages/api/admin/clear-needs-response.js
// Manually clear needs_response flag for a patient (by ID or phone)
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

  const { patientId, phone, note } = req.body;

  if (!patientId && !phone) {
    return res.status(400).json({ error: 'patientId or phone is required' });
  }

  try {
    let cleared = 0;

    // Clear by patient_id if available
    if (patientId) {
      const { data, error } = await supabase
        .from('comms_log')
        .update({ needs_response: false })
        .eq('patient_id', patientId)
        .eq('needs_response', true)
        .select('id');

      if (error) {
        console.error('[clear-needs-response] patient_id error:', error.message);
        return res.status(500).json({ error: error.message });
      }
      cleared = data?.length || 0;
    }

    // Also clear by phone (catches orphaned messages without patient_id)
    if (phone) {
      const digits = phone.replace(/\D/g, '').slice(-10);
      if (digits.length >= 7) {
        const formats = [...new Set([digits, `+1${digits}`, phone.trim()])];
        for (const fmt of formats) {
          const { data, error } = await supabase
            .from('comms_log')
            .update({ needs_response: false })
            .eq('recipient', fmt)
            .eq('needs_response', true)
            .select('id');

          if (!error && data?.length) {
            cleared += data.length;
          }
        }
      }
    }

    // Log an internal note if provided
    let noteId = null;
    if (note && note.trim()) {
      let patientName = null;

      // Try to get patient name
      if (patientId) {
        const { data: patient } = await supabase
          .from('patients')
          .select('name, first_name, last_name')
          .eq('id', patientId)
          .maybeSingle();

        patientName = patient
          ? (patient.first_name && patient.last_name
              ? `${patient.first_name} ${patient.last_name}`
              : patient.name)
          : null;
      }

      const noteRow = {
        patient_id: patientId || null,
        patient_name: patientName || phone || null,
        channel: 'sms',
        message_type: 'internal_note',
        message: note.trim(),
        direction: 'outbound',
        source: 'internal_note',
        status: 'sent',
        needs_response: false,
      };
      if (phone) noteRow.recipient = phone;

      const { data: inserted, error: noteErr } = await supabase
        .from('comms_log')
        .insert(noteRow)
        .select('id')
        .single();

      if (noteErr) {
        console.error('[clear-needs-response] note insert error:', noteErr.message);
      } else {
        noteId = inserted?.id || null;
      }
    }

    return res.status(200).json({ success: true, cleared, noteId });
  } catch (err) {
    console.error('[clear-needs-response] unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}
