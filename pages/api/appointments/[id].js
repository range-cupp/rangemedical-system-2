// GET /api/appointments/[id]
// Return single appointment with its events

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  // ── GET: Return single appointment with events ──
  if (req.method === 'GET') {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Get appointment error:', error);
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Auto-inherit id_verified from patient's id_on_file
      if (!appointment.id_verified && appointment.patient_id) {
        const { data: patient } = await supabase
          .from('patients')
          .select('id_on_file')
          .eq('id', appointment.patient_id)
          .single();

        if (patient?.id_on_file) {
          await supabase
            .from('appointments')
            .update({ id_verified: true })
            .eq('id', id);
          appointment.id_verified = true;
        }
      }

      const { data: events } = await supabase
        .from('appointment_events')
        .select('*')
        .eq('appointment_id', id)
        .order('created_at', { ascending: true });

      return res.status(200).json({ appointment, events: events || [] });
    } catch (error) {
      console.error('Get appointment error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ── DELETE: Remove appointment silently (no patient notification) ──
  if (req.method === 'DELETE') {
    try {
      // Clear any rescheduled_from references pointing to this appointment
      await supabase
        .from('appointments')
        .update({ rescheduled_from: null })
        .eq('rescheduled_from', id);

      // Delete related events first
      await supabase
        .from('appointment_events')
        .delete()
        .eq('appointment_id', id);

      // Try deleting from both appointment tables (appointments + clinic_appointments)
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      const { error: clinicError } = await supabase
        .from('clinic_appointments')
        .delete()
        .eq('id', id);

      // Only fail if both tables errored
      if (error && clinicError) {
        console.error('Delete appointment error:', error, clinicError);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete appointment error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ── PATCH: Update prep fields on appointment ──
  if (req.method === 'PATCH') {
    try {
      const allowedFields = [
        'labs_delivered', 'id_verified', 'provider_briefed', 'prep_notes',
        'visit_reason', 'modality', 'notes',
        'service_name', 'service_category', 'duration_minutes',
      ];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      // If duration changed, recalculate end_time based on existing start_time
      if (updates.duration_minutes) {
        const { data: existing } = await supabase
          .from('appointments')
          .select('start_time, service_name')
          .eq('id', id)
          .single();
        if (existing?.start_time) {
          const start = new Date(existing.start_time);
          updates.end_time = new Date(start.getTime() + updates.duration_minutes * 60000).toISOString();
        }
        // Log service type change event
        if (updates.service_name && existing?.service_name !== updates.service_name) {
          await supabase.from('appointment_events').insert({
            appointment_id: id,
            event_type: 'service_changed',
            metadata: {
              old_service: existing?.service_name,
              new_service: updates.service_name,
            },
          });
        }
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Patch appointment error:', error);
        return res.status(500).json({ error: error.message });
      }

      // When ID is verified, persist id_on_file on the patient so future appointments auto-inherit
      if (updates.id_verified === true && data.patient_id) {
        await supabase
          .from('patients')
          .update({ id_on_file: true })
          .eq('id', data.patient_id);
      }

      return res.status(200).json({ appointment: data });
    } catch (error) {
      console.error('Patch appointment error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
