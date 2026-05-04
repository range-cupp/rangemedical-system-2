// /api/appointments/chat-reschedule.js
// Inline reschedule from the Communications chat view.
// GET: fetch upcoming appointments for a patient.
// POST: execute reschedule (appointments table only — Cal.com is no
//       longer in the loop; the linked calcom_bookings shadow row gets
//       cancelled and a new one created so reminder crons stay accurate).

import { createClient } from '@supabase/supabase-js';
import { sendAppointmentNotification } from '../../../lib/appointment-notifications';
import { sendProviderNotification } from '../../../lib/provider-notifications';
import { logAction } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET — upcoming appointments for a patient.
async function handleGet(req, res) {
  const { patient_id } = req.query;
  if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

  try {
    const now = new Date().toISOString();
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patient_id)
      .gte('start_time', now)
      .in('status', ['scheduled', 'confirmed'])
      .order('start_time', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ appointments: appointments || [] });
  } catch (error) {
    console.error('Chat reschedule GET error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// POST — execute reschedule.
async function handlePost(req, res) {
  const { appointment_id, new_start_time, rescheduled_by } = req.body;
  if (!appointment_id || !new_start_time) {
    return res.status(400).json({ error: 'appointment_id and new_start_time are required' });
  }

  try {
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

    const duration = oldAppt.duration_minutes || 30;
    const newStart = new Date(new_start_time);
    const newEnd = new Date(newStart.getTime() + duration * 60000);

    // Mark old appointment as rescheduled.
    await supabase
      .from('appointments')
      .update({ status: 'rescheduled' })
      .eq('id', appointment_id);

    // (calcom_bookings updates removed at end of Cal.com cutover.)

    await supabase.from('appointment_events').insert({
      appointment_id,
      event_type: 'rescheduled',
      old_status: oldAppt.status,
      new_status: 'rescheduled',
      metadata: { rescheduled_to_time: new_start_time, source: 'chat_reschedule' },
    });

    // Create new appointment.
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
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
        duration_minutes: duration,
        status: 'scheduled',
        notes: oldAppt.notes,
        rescheduled_from: appointment_id,
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

    await supabase.from('appointment_events').insert({
      appointment_id: newAppt.id,
      event_type: 'created',
      new_status: 'scheduled',
      metadata: { rescheduled_from: appointment_id, rescheduled_by: rescheduled_by || null, source: 'chat_reschedule' },
    });

    // (Shadow calcom_bookings row removed — crons read appointments now.)

    await logAction({
      employeeName: rescheduled_by || 'Unknown',
      action: 'reschedule_appointment',
      resourceType: 'appointment',
      resourceId: appointment_id,
      details: {
        patient_name: oldAppt.patient_name,
        service_name: oldAppt.service_name,
        old_time: oldAppt.start_time,
        new_time: newStart.toISOString(),
        new_appointment_id: newAppt.id,
        source: 'chat_reschedule',
      },
      req,
    });

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
