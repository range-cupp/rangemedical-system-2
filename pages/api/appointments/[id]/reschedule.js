// PUT /api/appointments/[id]/reschedule
// Marks current appointment as rescheduled, creates new one with link

import { createClient } from '@supabase/supabase-js';
import { sendAppointmentNotification } from '../../../../lib/appointment-notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { new_start_time, new_end_time } = req.body;

  if (!new_start_time || !new_end_time) {
    return res.status(400).json({ error: 'new_start_time and new_end_time are required' });
  }

  try {
    // Get current appointment
    const { data: oldAppt, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !oldAppt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (['completed', 'cancelled', 'rescheduled'].includes(oldAppt.status)) {
      return res.status(400).json({ error: `Cannot reschedule a ${oldAppt.status} appointment` });
    }

    // Mark old appointment as rescheduled
    await supabase
      .from('appointments')
      .update({ status: 'rescheduled' })
      .eq('id', id);

    // Log event on old appointment
    await supabase.from('appointment_events').insert({
      appointment_id: id,
      event_type: 'rescheduled',
      old_status: oldAppt.status,
      new_status: 'rescheduled',
      metadata: { rescheduled_to_time: new_start_time },
    });

    // Create new appointment
    const { data: newAppt, error: createError } = await supabase
      .from('appointments')
      .insert({
        patient_id: oldAppt.patient_id,
        patient_name: oldAppt.patient_name,
        patient_phone: oldAppt.patient_phone,
        service_name: oldAppt.service_name,
        service_category: oldAppt.service_category,
        provider: oldAppt.provider,
        location: oldAppt.location,
        start_time: new_start_time,
        end_time: new_end_time,
        duration_minutes: oldAppt.duration_minutes,
        status: 'scheduled',
        notes: oldAppt.notes,
        rescheduled_from: id,
        source: oldAppt.source,
        created_by: oldAppt.created_by,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create rescheduled appointment error:', createError);
      return res.status(500).json({ error: createError.message });
    }

    // Log event on new appointment
    await supabase.from('appointment_events').insert({
      appointment_id: newAppt.id,
      event_type: 'created',
      new_status: 'scheduled',
      metadata: { rescheduled_from: id },
    });

    // Fire-and-forget: send reschedule notification (email + SMS with proper timezone)
    if (oldAppt.patient_id) {
      sendAppointmentNotification({
        type: 'reschedule',
        patient: {
          id: oldAppt.patient_id,
          name: oldAppt.patient_name,
          phone: oldAppt.patient_phone,
        },
        appointment: {
          serviceName: newAppt.service_name,
          startTime: newAppt.start_time,
          endTime: newAppt.end_time,
          durationMinutes: newAppt.duration_minutes,
          location: newAppt.location,
        },
      }).catch(err => console.error('Reschedule notification error:', err));
    }

    return res.status(200).json({ old_appointment: { ...oldAppt, status: 'rescheduled' }, new_appointment: newAppt });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    return res.status(500).json({ error: error.message });
  }
}

