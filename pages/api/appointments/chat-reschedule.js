// /api/appointments/chat-reschedule.js
// Inline reschedule from Communications chat view
// GET: fetch upcoming appointments for a patient (with Cal.com metadata)
// POST: execute full reschedule (appointments table + Cal.com + notifications)

import { createClient } from '@supabase/supabase-js';
import { rescheduleBooking } from '../../../lib/calcom';
import { sendAppointmentNotification } from '../../../lib/appointment-notifications';
import { sendProviderNotification } from '../../../lib/provider-notifications';
import { logAction } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET — upcoming appointments for a patient, with calcom_bookings metadata
async function handleGet(req, res) {
  const { patient_id } = req.query;
  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id is required' });
  }

  try {
    const now = new Date().toISOString();

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patient_id)
      .gte('start_time', now)
      .in('status', ['scheduled', 'confirmed'])
      .order('start_time', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // For appointments with cal_com_booking_id, look up calcom_bookings for event_type_id
    const enriched = await Promise.all(
      (appointments || []).map(async (appt) => {
        let calcom_event_type_id = null;
        let calcom_uid = null;
        let calcom_bookings_id = null;

        if (appt.cal_com_booking_id) {
          const { data: cb } = await supabase
            .from('calcom_bookings')
            .select('id, calcom_uid, calcom_event_type_id')
            .eq('booking_id', appt.cal_com_booking_id)
            .single();

          if (cb) {
            calcom_event_type_id = cb.calcom_event_type_id;
            calcom_uid = cb.calcom_uid;
            calcom_bookings_id = cb.id;
          }
        }

        return {
          ...appt,
          calcom_event_type_id,
          calcom_uid,
          calcom_bookings_id,
        };
      })
    );

    return res.status(200).json({ appointments: enriched });
  } catch (error) {
    console.error('Chat reschedule GET error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// POST — execute full reschedule
async function handlePost(req, res) {
  const { appointment_id, new_start_time, rescheduled_by } = req.body;

  if (!appointment_id || !new_start_time) {
    return res.status(400).json({ error: 'appointment_id and new_start_time are required' });
  }

  try {
    // Get current appointment
    const { data: oldAppt, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointment_id)
      .single();

    if (fetchError || !oldAppt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (['completed', 'cancelled', 'rescheduled'].includes(oldAppt.status)) {
      return res.status(400).json({ error: `Cannot reschedule a ${oldAppt.status} appointment` });
    }

    // Calculate new end time based on duration
    const duration = oldAppt.duration_minutes || 30;
    const newStart = new Date(new_start_time);
    const newEnd = new Date(newStart.getTime() + duration * 60000);
    const new_end_time = newEnd.toISOString();

    // Reschedule in Cal.com if this was a Cal.com booking
    if (oldAppt.cal_com_booking_id) {
      const { data: cb } = await supabase
        .from('calcom_bookings')
        .select('id, calcom_uid, duration_minutes')
        .eq('booking_id', oldAppt.cal_com_booking_id)
        .single();

      if (cb && cb.calcom_uid) {
        const calResult = await rescheduleBooking(cb.calcom_uid, new_start_time);
        if (calResult.error) {
          console.error('Cal.com reschedule failed:', calResult);
          return res.status(500).json({ error: 'Failed to reschedule in Cal.com', details: calResult.error });
        }

        // Update calcom_bookings times
        const cbDuration = cb.duration_minutes || duration;
        const cbEnd = new Date(newStart.getTime() + cbDuration * 60000);
        await supabase
          .from('calcom_bookings')
          .update({
            start_time: newStart.toISOString(),
            end_time: cbEnd.toISOString(),
            booking_date: new_start_time.split('T')[0],
          })
          .eq('id', cb.id);
      }
    }

    // Mark old appointment as rescheduled
    await supabase
      .from('appointments')
      .update({ status: 'rescheduled' })
      .eq('id', appointment_id);

    // Log event on old appointment
    await supabase.from('appointment_events').insert({
      appointment_id,
      event_type: 'rescheduled',
      old_status: oldAppt.status,
      new_status: 'rescheduled',
      metadata: { rescheduled_to_time: new_start_time, source: 'chat_reschedule' },
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
        duration_minutes: duration,
        status: 'scheduled',
        notes: oldAppt.notes,
        rescheduled_from: appointment_id,
        source: oldAppt.source,
        cal_com_booking_id: oldAppt.cal_com_booking_id,
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
      metadata: { rescheduled_from: appointment_id, rescheduled_by: rescheduled_by || null, source: 'chat_reschedule' },
    });

    // Audit log
    await logAction({
      employeeName: rescheduled_by || 'Unknown',
      action: 'reschedule_appointment',
      resourceType: 'appointment',
      resourceId: appointment_id,
      details: {
        patient_name: oldAppt.patient_name,
        service_name: oldAppt.service_name,
        old_time: oldAppt.start_time,
        new_time: new_start_time,
        new_appointment_id: newAppt.id,
        source: 'chat_reschedule',
      },
      req,
    });

    // Send patient notification (fire-and-forget)
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

    // Send provider SMS (fire-and-forget)
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

    return res.status(200).json({
      success: true,
      old_appointment: { ...oldAppt, status: 'rescheduled' },
      new_appointment: newAppt,
    });
  } catch (error) {
    console.error('Chat reschedule POST error:', error);
    return res.status(500).json({ error: error.message });
  }
}
