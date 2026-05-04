// /pages/api/bookings/reschedule.js
// Reschedules an appointment in place (used by BookingTab). bookingId is
// an appointments.id UUID. Updates only appointments + events; no Cal.com,
// no calcom_bookings.

import { createClient } from '@supabase/supabase-js';
import { sendAppointmentNotification } from '../../../lib/appointment-notifications';
import { sendProviderNotification } from '../../../lib/provider-notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookingId, newStart } = req.body;
  if (!bookingId || !newStart) {
    return res.status(400).json({ error: 'bookingId and newStart are required' });
  }

  try {
    const { data: oldAppt, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();
    if (fetchError || !oldAppt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (['completed', 'cancelled', 'rescheduled'].includes(oldAppt.status)) {
      return res.status(400).json({ error: `Cannot reschedule a ${oldAppt.status} appointment` });
    }

    const duration = oldAppt.duration_minutes || 30;
    const startDate = new Date(newStart);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const { data: updated, error: apptErr } = await supabase
      .from('appointments')
      .update({
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();
    if (apptErr) {
      console.error('appointments reschedule error:', apptErr);
      return res.status(500).json({ error: 'Failed to reschedule', details: apptErr.message });
    }

    await supabase.from('appointment_events').insert({
      appointment_id: bookingId,
      event_type: 'rescheduled',
      old_status: oldAppt.status,
      new_status: oldAppt.status,
      metadata: {
        source: 'bookings_reschedule',
        old_time: oldAppt.start_time,
        new_time: startDate.toISOString(),
      },
    });

    if (updated.patient_id) {
      sendAppointmentNotification({
        type: 'reschedule',
        patient: {
          id: updated.patient_id,
          name: updated.patient_name,
          phone: updated.patient_phone,
        },
        appointment: {
          serviceName: updated.service_name,
          startTime: updated.start_time,
          endTime: updated.end_time,
          durationMinutes: updated.duration_minutes,
          location: updated.location,
        },
      }).catch(err => console.error('Reschedule notification error:', err));
    }
    if (updated.provider) {
      sendProviderNotification({
        type: 'rescheduled',
        provider: updated.provider,
        appointment: {
          patientName: updated.patient_name,
          serviceName: updated.service_name,
          startTime: updated.start_time,
        },
      }).catch(err => console.error('Provider SMS reschedule failed:', err));
    }

    return res.status(200).json({
      success: true,
      message: 'Booking rescheduled',
      appointment_id: bookingId,
    });
  } catch (error) {
    console.error('Reschedule booking API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
