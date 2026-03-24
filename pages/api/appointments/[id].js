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

  return res.status(405).json({ error: 'Method not allowed' });
}
