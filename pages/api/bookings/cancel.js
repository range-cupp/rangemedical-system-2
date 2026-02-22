// /pages/api/bookings/cancel.js
// Cancels a booking in Cal.com and updates local status

import { createClient } from '@supabase/supabase-js';
import { cancelBooking } from '../../../lib/calcom';

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
    // Get the booking from Supabase to find the Cal.com UID
    const { data: booking, error: fetchError } = await supabase
      .from('calcom_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Cancel in Cal.com
    if (booking.calcom_uid) {
      const calResult = await cancelBooking(booking.calcom_uid, reason);
      if (calResult.error) {
        console.error('Cal.com cancel failed:', calResult);
        // Continue to update local status even if Cal.com fails
      }
    }

    // Update local status
    const { error: updateError } = await supabase
      .from('calcom_bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(500).json({ error: 'Failed to update booking status', details: updateError.message });
    }

    console.log('📅 Booking cancelled:', bookingId);
    return res.status(200).json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    console.error('Cancel booking API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
