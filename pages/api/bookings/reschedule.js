// /pages/api/bookings/reschedule.js
// Reschedules a booking in Cal.com and updates local times

import { createClient } from '@supabase/supabase-js';
import { rescheduleBooking } from '../../../lib/calcom';

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
    // Get the booking from Supabase
    const { data: booking, error: fetchError } = await supabase
      .from('calcom_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Reschedule in Cal.com
    if (booking.calcom_uid) {
      const calResult = await rescheduleBooking(booking.calcom_uid, newStart);
      if (calResult.error) {
        console.error('Cal.com reschedule failed:', calResult);
        return res.status(500).json({ error: 'Failed to reschedule in Cal.com', details: calResult.error });
      }
    }

    // Update local times
    const duration = booking.duration_minutes || 30;
    const startDate = new Date(newStart);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const bookingDate = newStart.split('T')[0];

    const { error: updateError } = await supabase
      .from('calcom_bookings')
      .update({
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        booking_date: bookingDate
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(500).json({ error: 'Failed to update booking times', details: updateError.message });
    }

    console.log('📅 Booking rescheduled:', bookingId, 'to', newStart);
    return res.status(200).json({ success: true, message: 'Booking rescheduled' });
  } catch (error) {
    console.error('Reschedule booking API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
