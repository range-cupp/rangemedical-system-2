// POST /api/appointments/create
// Creates a new appointment and logs the "created" event

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      patient_id,
      patient_name,
      patient_phone,
      service_name,
      service_category,
      provider,
      location,
      start_time,
      end_time,
      duration_minutes,
      notes,
      source,
      created_by,
    } = req.body;

    if (!patient_name || !service_name || !start_time || !end_time || !duration_minutes) {
      return res.status(400).json({ error: 'patient_name, service_name, start_time, end_time, and duration_minutes are required' });
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patient_id || null,
        patient_name,
        patient_phone: patient_phone || null,
        service_name,
        service_category: service_category || null,
        provider: provider || null,
        location: location || 'Range Medical — Newport Beach',
        start_time,
        end_time,
        duration_minutes,
        status: 'scheduled',
        notes: notes || null,
        source: source || 'manual',
        created_by: created_by || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Create appointment error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Log the created event
    await supabase.from('appointment_events').insert({
      appointment_id: appointment.id,
      event_type: 'created',
      new_status: 'scheduled',
      metadata: { created_by, source: source || 'manual' },
    });

    // Fire-and-forget: send confirmation SMS if patient has a GHL contact ID
    if (patient_id) {
      sendConfirmationSMS(patient_id, appointment).catch(err =>
        console.error('Confirmation SMS failed:', err)
      );
    }

    return res.status(200).json({ appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function sendConfirmationSMS(patientId, appointment) {
  const { data: patient } = await supabase
    .from('patients')
    .select('ghl_contact_id, name')
    .eq('id', patientId)
    .single();

  if (!patient?.ghl_contact_id) return;

  const apptDate = new Date(appointment.start_time).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const apptTime = new Date(appointment.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  const message = `Hi ${patient.name.split(' ')[0]}! Your appointment for ${appointment.service_name} has been scheduled for ${apptDate} at ${apptTime}. See you at Range Medical!`;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.rangemedical.com';
    await fetch(`${baseUrl}/api/ghl/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: patient.ghl_contact_id,
        message,
      }),
    });

    await logComm({
      channel: 'sms',
      messageType: 'appointment_confirmation',
      message,
      source: 'appointments/create',
      patientId,
      patientName: patient.name,
      ghlContactId: patient.ghl_contact_id,
    });
  } catch (err) {
    console.error('Confirmation SMS error:', err);
  }
}
