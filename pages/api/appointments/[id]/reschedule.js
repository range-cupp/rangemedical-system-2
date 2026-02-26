// PUT /api/appointments/[id]/reschedule
// Marks current appointment as rescheduled, creates new one with link

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { new_start_time, new_end_time } = req.body;

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

    // Log event on old appointment
    await supabase.from('appointment_events').insert({
      appointment_id: id,
      event_type: 'rescheduled',
      old_status: oldAppt.status,
      new_status: 'rescheduled',
      metadata: { rescheduled_to_time: new_start_time },
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
        duration_minutes: oldAppt.duration_minutes,
        status: 'scheduled',
        notes: oldAppt.notes,
        rescheduled_from: id,
        source: oldAppt.source,
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
      metadata: { rescheduled_from: id },
    });

    // Fire-and-forget: send reschedule SMS
    if (oldAppt.patient_id) {
      sendRescheduleSMS(oldAppt, newAppt).catch(err =>
        console.error('Reschedule SMS error:', err)
      );
    }

    return res.status(200).json({ old_appointment: { ...oldAppt, status: 'rescheduled' }, new_appointment: newAppt });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function sendRescheduleSMS(oldAppt, newAppt) {
  const { data: patient } = await supabase
    .from('patients')
    .select('ghl_contact_id, name')
    .eq('id', oldAppt.patient_id)
    .single();

  if (!patient?.ghl_contact_id) return;

  const firstName = patient.name.split(' ')[0];
  const newDate = new Date(newAppt.start_time).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const newTime = new Date(newAppt.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  const message = `Hi ${firstName}, your ${newAppt.service_name} appointment has been rescheduled to ${newDate} at ${newTime}. See you at Range Medical!`;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.rangemedical.com';
    await fetch(`${baseUrl}/api/ghl/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: patient.ghl_contact_id, message }),
    });

    await logComm({
      channel: 'sms',
      messageType: 'appointment_reschedule',
      message,
      source: 'appointments/reschedule',
      patientId: oldAppt.patient_id,
      patientName: patient.name,
      ghlContactId: patient.ghl_contact_id,
    });
  } catch (err) {
    console.error('Reschedule SMS error:', err);
  }
}
