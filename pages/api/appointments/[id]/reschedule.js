// PUT /api/appointments/[id]/reschedule
// Marks current appointment as rescheduled, creates new one with link

import { createClient } from '@supabase/supabase-js';
import { sendAppointmentNotification } from '../../../../lib/appointment-notifications';
import { sendProviderNotification } from '../../../../lib/provider-notifications';
import { logAction } from '../../../../lib/auth';
import { toPacificDate } from '../../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { new_start_time, new_end_time, rescheduled_by } = req.body;

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

    // Cancel the linked calcom_bookings row so the reminder cron stops
    // texting about the old time. The new appointment row created below
    // will get its own shadow calcom_bookings row created during normal
    // flow (when /api/appointments/create is used). Here we just close
    // the old shadow + the legacy Cal.com mirror, both forms.
    {
      const updates = { status: 'cancelled', cancelled_at: new Date().toISOString() };
      if (oldAppt.cal_com_booking_id) {
        const calcomBookingIdInt = parseInt(oldAppt.cal_com_booking_id, 10);
        if (!Number.isNaN(calcomBookingIdInt)) {
          await supabase
            .from('calcom_bookings')
            .update(updates)
            .eq('calcom_booking_id', calcomBookingIdInt)
            .then(({ error: cbErr }) => {
              if (cbErr) console.error('calcom_bookings reschedule (legacy) error:', cbErr);
            });
        }
      }
      await supabase
        .from('calcom_bookings')
        .update(updates)
        .eq('calcom_uid', `local-${id}`)
        .then(({ error: cbErr }) => {
          if (cbErr) console.error('calcom_bookings reschedule (shadow) error:', cbErr);
        });
    }

    // Log event on old appointment
    await supabase.from('appointment_events').insert({
      appointment_id: id,
      event_type: 'rescheduled',
      old_status: oldAppt.status,
      new_status: 'rescheduled',
      metadata: { rescheduled_to_time: new_start_time },
    });

    // Create new appointment — preserve visit_group_id so the rescheduled service stays
    // linked to its multi-service visit siblings in the popover/history.
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
        visit_group_id: oldAppt.visit_group_id || null,
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
      metadata: { rescheduled_from: id, rescheduled_by: rescheduled_by || null },
    });

    // Shadow calcom_bookings row for the new appointment so reminder/lab-prep
    // crons pick it up. Same sentinel pattern as lib/create-appointment.js.
    try {
      const { error: shadowErr } = await supabase.from('calcom_bookings').insert({
        calcom_uid: `local-${newAppt.id}`,
        patient_id: newAppt.patient_id,
        patient_name: newAppt.patient_name,
        patient_phone: newAppt.patient_phone,
        service_name: newAppt.service_name,
        service_slug: null,
        start_time: newAppt.start_time,
        end_time: newAppt.end_time,
        booking_date: toPacificDate(newAppt.start_time),
        duration_minutes: newAppt.duration_minutes,
        status: newAppt.status,
        location: newAppt.location,
        notes: newAppt.notes,
        booked_by: 'staff',
      });
      if (shadowErr) console.error('reschedule shadow row insert error:', shadowErr);
    } catch (e) {
      console.error('reschedule shadow row error (non-fatal):', e);
    }

    // Audit log
    await logAction({
      employeeName: rescheduled_by || 'Unknown',
      action: 'reschedule_appointment',
      resourceType: 'appointment',
      resourceId: id,
      details: {
        patient_name: oldAppt.patient_name,
        service_name: oldAppt.service_name,
        old_time: oldAppt.start_time,
        new_time: new_start_time,
        new_appointment_id: newAppt.id,
      },
      req,
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

    // Send provider SMS for reschedule (fire-and-forget)
    if (oldAppt.provider) {
      sendProviderNotification({
        type: 'rescheduled',
        provider: oldAppt.provider,
        appointment: {
          patientName: oldAppt.patient_name,
          serviceName: newAppt.service_name,
          startTime: newAppt.start_time,
        },
      }).catch(err => console.error('Provider SMS reschedule failed:', err));
    }

    return res.status(200).json({ old_appointment: { ...oldAppt, status: 'rescheduled' }, new_appointment: newAppt });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    return res.status(500).json({ error: error.message });
  }
}

