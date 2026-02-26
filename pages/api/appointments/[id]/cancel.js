// PUT /api/appointments/[id]/cancel
// Cancel an appointment with reason

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { cancellation_reason } = req.body;

  try {
    // Get current appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (['completed', 'cancelled', 'rescheduled'].includes(appointment.status)) {
      return res.status(400).json({ error: `Cannot cancel a ${appointment.status} appointment` });
    }

    // Update status
    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: cancellation_reason || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Cancel appointment error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // Log event
    await supabase.from('appointment_events').insert({
      appointment_id: id,
      event_type: 'cancelled',
      old_status: appointment.status,
      new_status: 'cancelled',
      metadata: cancellation_reason ? { cancellation_reason } : {},
    });

    return res.status(200).json({ appointment: updated });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
