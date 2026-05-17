// /pages/api/ai/cancel-appointment.js
// Cancels an appointment from the AI assistant
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { appointment_id, reason, cancelled_by } = req.body;
  if (!appointment_id) return res.status(400).json({ error: 'appointment_id required' });

  try {
    const { data: appt, error: fetchErr } = await supabase
      .from('appointments')
      .select('id, patient_name, service_name, start_time, status')
      .eq('id', appointment_id)
      .single();

    if (fetchErr || !appt) return res.status(404).json({ error: 'Appointment not found' });

    if (['completed', 'cancelled', 'rescheduled'].includes(appt.status)) {
      return res.status(400).json({ error: `Cannot cancel — appointment is already ${appt.status}` });
    }

    const { error: updateErr } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || 'Cancelled via AI Assistant',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointment_id);

    if (updateErr) throw updateErr;

    await supabase.from('appointment_events').insert({
      appointment_id,
      event_type: 'cancelled',
      old_status: appt.status,
      new_status: 'cancelled',
      metadata: { reason, cancelled_by: cancelled_by || 'AI Assistant', source: 'ai-assistant' },
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      patient_name: appt.patient_name,
      service: appt.service_name,
      time: new Date(appt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' }),
    });
  } catch (err) {
    console.error('Cancel appointment error:', err);
    return res.status(500).json({ error: 'Failed to cancel appointment' });
  }
}
