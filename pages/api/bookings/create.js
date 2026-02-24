// /pages/api/bookings/create.js
// Creates a booking in Cal.com and stores it in Supabase

import { createClient } from '@supabase/supabase-js';
import { createBooking } from '../../../lib/calcom';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    eventTypeId,
    start,
    patientId,
    patientName,
    patientEmail,
    patientPhone,
    serviceName,
    serviceSlug,
    durationMinutes,
    notes,
    serviceDetails
  } = req.body;

  if (!eventTypeId || !start || !patientId || !patientName) {
    return res.status(400).json({ error: 'eventTypeId, start, patientId, and patientName are required' });
  }

  try {
    // Use placeholder email if patient has none
    const email = patientEmail || `${patientId}@booking.rangemedical.com`;

    // Create booking in Cal.com
    const calResult = await createBooking({
      eventTypeId: parseInt(eventTypeId),
      start,
      name: patientName,
      email,
      phoneNumber: patientPhone,
      notes
    });

    if (calResult.error) {
      console.error('Cal.com booking failed:', calResult);
      return res.status(500).json({ error: 'Failed to create booking in Cal.com', details: calResult.error });
    }

    console.log('📅 Cal.com booking created:', calResult.id || calResult.uid);

    // Calculate end time
    const duration = durationMinutes || 30;
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const bookingDate = start.split('T')[0];

    // Store in Supabase
    const { data: booking, error: dbError } = await supabase
      .from('calcom_bookings')
      .insert({
        calcom_booking_id: calResult.id,
        calcom_uid: calResult.uid,
        patient_id: patientId,
        patient_name: patientName,
        patient_email: email,
        patient_phone: patientPhone,
        service_name: serviceName,
        service_slug: serviceSlug,
        calcom_event_type_id: parseInt(eventTypeId),
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        booking_date: bookingDate,
        duration_minutes: duration,
        status: 'scheduled',
        notes,
        booked_by: 'staff',
        service_details: serviceDetails || null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      // Booking was created in Cal.com but failed to save locally
      return res.status(200).json({
        success: true,
        warning: 'Booking created in Cal.com but failed to save locally',
        calcom: calResult,
        dbError: dbError.message
      });
    }

    return res.status(200).json({
      success: true,
      booking,
      calcom: calResult
    });
  } catch (error) {
    console.error('Create booking API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
