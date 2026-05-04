// /pages/api/bookings/reschedule.js
// Reschedules a booking. Cal.com is no longer in the loop — this updates
// the calcom_bookings row + the matching appointments row directly.
// Works for legacy Cal.com bookings AND for the shadow rows created by
// lib/create-appointment.js.

import { createClient } from '@supabase/supabase-js';
import { sendAppointmentNotification } from '../../../lib/appointment-notifications';
import { sendProviderNotification } from '../../../lib/provider-notifications';
import { toPacificDate } from '../../../lib/date-utils';

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
    const { data: booking, error: fetchError } = await supabase
      .from('calcom_bookings')
      .select('id, calcom_booking_id, calcom_uid, duration_minutes')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const duration = booking.duration_minutes || 30;
    const startDate = new Date(newStart);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    // Update calcom_bookings times.
    {
      const { error: updateError } = await supabase
        .from('calcom_bookings')
        .update({
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          booking_date: toPacificDate(startDate.toISOString()),
        })
        .eq('id', bookingId);
      if (updateError) {
        console.error('calcom_bookings reschedule error:', updateError);
        return res.status(500).json({ error: 'Failed to update booking', details: updateError.message });
      }
    }

    // Find and update the matching appointment.
    let appointmentId = null;
    if (booking.calcom_uid?.startsWith('local-')) {
      appointmentId = booking.calcom_uid.slice('local-'.length);
    } else if (booking.calcom_booking_id) {
      const { data: apptByCal } = await supabase
        .from('appointments')
        .select('id')
        .eq('cal_com_booking_id', String(booking.calcom_booking_id))
        .maybeSingle();
      if (apptByCal?.id) appointmentId = apptByCal.id;
    }

    if (appointmentId) {
      const { data: oldAppt } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .maybeSingle();

      if (oldAppt && !['completed', 'cancelled'].includes(oldAppt.status)) {
        const apptDuration = oldAppt.duration_minutes || duration;
        const apptEnd = new Date(startDate.getTime() + apptDuration * 60000);

        const { data: updated, error: apptErr } = await supabase
          .from('appointments')
          .update({
            start_time: startDate.toISOString(),
            end_time: apptEnd.toISOString(),
          })
          .eq('id', appointmentId)
          .select()
          .single();

        if (apptErr) {
          console.error('appointments reschedule error:', apptErr);
        } else if (updated) {
          await supabase.from('appointment_events').insert({
            appointment_id: appointmentId,
            event_type: 'rescheduled',
            old_status: oldAppt.status,
            new_status: oldAppt.status,
            metadata: {
              source: 'bookings_reschedule',
              old_time: oldAppt.start_time,
              new_time: startDate.toISOString(),
            },
          });

          // Patient SMS + email
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

          // Provider SMS
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
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Booking rescheduled',
      appointment_id: appointmentId,
    });
  } catch (error) {
    console.error('Reschedule booking API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
