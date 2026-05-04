// /pages/api/bookings/cancel.js
// Cancels an appointment (used by BookingTab). The `bookingId` it sends
// is now an appointments.id UUID — bookings/list returns that field as
// `id` post-cutover. Updates only the appointments table; no Cal.com,
// no calcom_bookings (those are historical-only now).

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
    const { data: appt, error: apptErr } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', cancellation_reason: reason || null })
      .eq('id', bookingId)
      .not('status', 'in', '(completed,cancelled,rescheduled)')
      .select()
      .maybeSingle();
    if (apptErr) {
      console.error('appointments cancel error:', apptErr);
      return res.status(500).json({ error: 'Failed to cancel appointment', details: apptErr.message });
    }
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found or not cancellable' });
    }

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

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled',
      appointment_id: appt.id,
    });
  } catch (error) {
    console.error('Cancel booking API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
