// /pages/api/appointments/update.js
// Update appointment status, notes, category
// Supports both 'appointments' and 'clinic_appointments' tables
// When status → checked_in: records checked_in_at timestamp, logs event, creates encounter note

import { createClient } from '@supabase/supabase-js';
import { logAction } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_TABLES = ['appointments', 'clinic_appointments'];
const ALLOWED_STATUSES = ['scheduled', 'confirmed', 'checked_in', 'showed', 'completed', 'no_show', 'cancelled'];

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, table, status, notes, category, updated_by } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing appointment id' });
  }

  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Invalid table' });
  }

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const now = new Date().toISOString();
    const updates = { updated_at: now };

    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    // Category field differs between tables
    if (category !== undefined) {
      if (table === 'appointments') {
        updates.service_category = category;
      } else {
        updates.appointment_title = category;
      }
    }

    // Record check-in timestamp when status changes to checked_in
    if (status === 'checked_in') {
      updates.checked_in_at = now;
    }

    const { error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id);

    if (error) {
      // If checked_in_at column doesn't exist yet, retry without it
      if (error.message?.includes('checked_in_at')) {
        delete updates.checked_in_at;
        const { error: retryError } = await supabase.from(table).update(updates).eq('id', id);
        if (retryError) {
          console.error('Error updating appointment (retry):', retryError);
          return res.status(500).json({ error: retryError.message });
        }
      } else {
        console.error('Error updating appointment:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    // Log status change event in appointment_events
    if (status) {
      await supabase.from('appointment_events').insert({
        appointment_id: id,
        event_type: `status_${status}`,
        new_status: status,
        metadata: status === 'checked_in' ? { checked_in_at: now, updated_by: updated_by || null } : { updated_by: updated_by || null },
      }).catch(e => console.error('Event log error:', e));

      // Audit log
      await logAction({
        employeeName: updated_by || 'Unknown',
        action: `update_appointment_${status}`,
        resourceType: 'appointment',
        resourceId: id,
        details: { new_status: status },
        req,
      });
    }

    // When checked in, create an encounter note on the patient record
    if (status === 'checked_in') {
      try {
        // Fetch appointment details to get patient info
        const { data: appt } = await supabase
          .from(table)
          .select('patient_id, patient_name, service_name, service_category, start_time')
          .eq('id', id)
          .single();

        if (appt?.patient_id) {
          const ptDate = new Date(now).toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit',
          });

          const noteBody = `**Patient Checked In**\n\nService: ${appt.service_name || 'Appointment'}\nCheck-in Time: ${ptDate} PT\nScheduled Time: ${new Date(appt.start_time).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' })} PT`;

          await supabase.from('patient_notes').insert({
            patient_id: appt.patient_id,
            body: noteBody,
            note_date: now,
            source: 'encounter',
            status: 'draft',
            appointment_id: id,
            encounter_service: appt.service_name || null,
          });
        }
      } catch (noteErr) {
        // Don't fail the status update if note creation fails
        console.error('Encounter note creation error:', noteErr);
      }
    }

    return res.status(200).json({ success: true, checked_in_at: status === 'checked_in' ? now : undefined });
  } catch (error) {
    console.error('Appointment update error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
