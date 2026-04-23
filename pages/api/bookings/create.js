// /pages/api/bookings/create.js
// Creates a booking in Cal.com and stores it in Supabase

import { createClient } from '@supabase/supabase-js';
import { createBooking, reassignBooking } from '../../../lib/calcom';

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
    serviceDetails,
    hostUserId,
    hostName,
  } = req.body;

  if (!eventTypeId || !start || !patientId || !patientName) {
    return res.status(400).json({ error: 'eventTypeId, start, patientId, and patientName are required' });
  }

  try {
    // Use placeholder email if patient has none or has an invalid value (e.g. "na", "none").
    // Cal.com rejects malformed emails with email_validation_error.
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rawEmail = typeof patientEmail === 'string' ? patientEmail.trim() : '';
    const email = emailRe.test(rawEmail) ? rawEmail : `${patientId}@range-medical.com`;

    // Create booking in Cal.com (round-robin auto-assigns host)
    const calResult = await createBooking({
      eventTypeId: parseInt(eventTypeId),
      start,
      name: patientName,
      email,
      phoneNumber: patientPhone,
      notes,
    });

    if (calResult.error) {
      console.error('Cal.com booking failed:', calResult);

      // Parse Cal.com error for user-friendly message
      let errorMsg = 'Failed to create booking in Cal.com';
      let schedulingWindowError = false;
      const rawErrStr = typeof calResult.error === 'string'
        ? calResult.error
        : JSON.stringify(calResult.error || '');
      try {
        const parsed = typeof calResult.error === 'string' ? JSON.parse(calResult.error) : calResult.error;
        const detail = parsed?.error?.message || parsed?.message || '';
        if (detail.includes('already has booking') || detail.includes('not available')) {
          errorMsg = 'This time slot is no longer available — all providers are booked. Please select a different time.';
        } else if (detail.includes("can't be booked at the") || detail.includes('minimum booking notice') || detail.includes('scheduling window')) {
          errorMsg = 'Cal.com won\u2019t accept this time (too close to now or outside the event\u2019s booking window). Falling back to a manual appointment.';
          schedulingWindowError = true;
        } else if (detail.includes('not found')) {
          errorMsg = 'This appointment type is no longer available. Please refresh and try again.';
        } else if (detail) {
          errorMsg = detail;
        }
      } catch {
        // If error is a plain string, check it directly
        if (rawErrStr.includes('already has booking') || rawErrStr.includes('not available')) {
          errorMsg = 'This time slot is no longer available — all providers are booked. Please select a different time.';
        } else if (rawErrStr.includes("can't be booked at the") || rawErrStr.includes('minimum booking notice') || rawErrStr.includes('scheduling window')) {
          errorMsg = 'Cal.com won\u2019t accept this time. Falling back to a manual appointment.';
          schedulingWindowError = true;
        }
      }

      return res.status(calResult.status === 400 ? 400 : 500).json({
        error: errorMsg,
        slotUnavailable: errorMsg.includes('no longer available'),
        schedulingWindowError,
        details: calResult.error,
      });
    }

    console.log('📅 Cal.com booking created:', calResult.id || calResult.uid);

    // If a specific host was requested and Cal.com assigned someone else, reassign
    if (hostUserId) {
      const assignedHostId = calResult.hosts?.[0]?.id;
      if (assignedHostId && assignedHostId !== parseInt(hostUserId)) {
        console.log(`📅 Reassigning from host ${assignedHostId} to requested host ${hostUserId}`);
        const reassignResult = await reassignBooking(calResult.uid, parseInt(hostUserId));
        if (reassignResult.error) {
          console.warn('Cal.com reassign failed (booking still created):', reassignResult.error);
        } else {
          console.log('📅 Host reassigned successfully');
        }
      }
    }

    // Calculate end time
    const duration = durationMinutes || 30;
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const bookingDate = start.split('T')[0];

    // Store in Supabase (calcom_bookings only — the admin schedule reads from
    // the native `appointments` table, which is written by the caller's
    // secondary POST /api/appointments/create and, as a fallback, by the
    // Cal.com BOOKING_CREATED webhook).
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
        service_details: serviceDetails || null,
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
