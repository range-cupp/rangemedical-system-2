// /pages/api/bookings/cancel.js
// Cancels a booking. Cal.com is no longer in the loop — this updates
// both the calcom_bookings row (so the reminder cron stops texting)
// and the matching appointments row (so the admin calendar reflects
// the cancellation). Works for legacy Cal.com bookings AND for the
// shadow rows created by lib/create-appointment.js.

import { createClient } from '@supabase/supabase-js';
import { sendProviderNotification } from '../../../lib/provider-notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookingId, reason } = req.body;
  if (!bookingId) {
    return res.status(400).json({ error: 'bookingId is required' });
  }

  try {
    // Look up the calcom_bookings row to find the matching appointment.
    const { data: booking, error: fetchError } = await supabase
      .from('calcom_bookings')
      .select('id, calcom_booking_id, calcom_uid')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const cancelledAt = new Date().toISOString();

    // Cancel the calcom_bookings row.
    {
      const { error: cbErr } = await supabase
        .from('calcom_bookings')
        .update({ status: 'cancelled', cancelled_at: cancelledAt })
        .eq('id', bookingId);
      if (cbErr) {
        console.error('calcom_bookings cancel error:', cbErr);
        return res.status(500).json({ error: 'Failed to update booking status', details: cbErr.message });
      }
    }

    // Find and cancel the matching appointment row. Two cases:
    //   1. Shadow row → calcom_uid='local-<appointment_id>' so we can pull
    //      the appointment id straight out of the uid.
    //   2. Legacy Cal.com row → look up by cal_com_booking_id (string).
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

    let cancelledAppointment = null;
    if (appointmentId) {
      const { data: appt, error: apptErr } = await supabase
        .from('appointments')
        .update({ status: 'cancelled', cancellation_reason: reason || null })
        .eq('id', appointmentId)
        .not('status', 'in', '(completed,cancelled,rescheduled)')
        .select()
        .maybeSingle();
      if (apptErr) {
        console.error('appointments cancel error:', apptErr);
      } else if (appt) {
        cancelledAppointment = appt;
        await supabase.from('appointment_events').insert({
          appointment_id: appt.id,
          event_type: 'cancelled',
          old_status: 'scheduled',
          new_status: 'cancelled',
          metadata: { source: 'bookings_cancel', cancellation_reason: reason || null },
        });
        if (appt.provider) {
          sendProviderNotification({
            type: 'cancelled',
            provider: appt.provider,
            appointment: {
              patientName: appt.patient_name,
              serviceName: appt.service_name,
              startTime: appt.start_time,
            },
          }).catch(err => console.error('Provider SMS cancel failed:', err));
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled',
      appointment_id: cancelledAppointment?.id || null,
    });
  } catch (error) {
    console.error('Cancel booking API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
