// POST /api/appointments/webhook
// Internal automation trigger dispatcher for appointment events

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Handler functions
async function sendConfirmationSMS(appointment, event) {
  if (!appointment.patient_id) return;

  const { data: patient } = await supabase
    .from('patients')
    .select('ghl_contact_id, name')
    .eq('id', appointment.patient_id)
    .single();

  if (!patient?.ghl_contact_id) return;

  const firstName = patient.name.split(' ')[0];
  const apptDate = new Date(appointment.start_time).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const apptTime = new Date(appointment.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  const message = `Hi ${firstName}! Your appointment for ${appointment.service_name} has been scheduled for ${apptDate} at ${apptTime}. See you at Range Medical!`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.rangemedical.com';
  await fetch(`${baseUrl}/api/ghl/send-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact_id: patient.ghl_contact_id, message }),
  });

  await logComm({
    channel: 'sms',
    messageType: 'appointment_confirmation',
    message,
    source: 'appointments/webhook',
    patientId: appointment.patient_id,
    patientName: patient.name,
    ghlContactId: patient.ghl_contact_id,
  });
}

async function sendCancellationSMS(appointment, event) {
  if (!appointment.patient_id) return;

  const { data: patient } = await supabase
    .from('patients')
    .select('ghl_contact_id, name')
    .eq('id', appointment.patient_id)
    .single();

  if (!patient?.ghl_contact_id) return;

  const firstName = patient.name.split(' ')[0];
  const apptDate = new Date(appointment.start_time).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const message = `Hi ${firstName}, your ${appointment.service_name} appointment on ${apptDate} has been cancelled. Please call (949) 997-3988 to reschedule.`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.rangemedical.com';
  await fetch(`${baseUrl}/api/ghl/send-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact_id: patient.ghl_contact_id, message }),
  });

  await logComm({
    channel: 'sms',
    messageType: 'appointment_cancellation',
    message,
    source: 'appointments/webhook',
    patientId: appointment.patient_id,
    patientName: patient.name,
    ghlContactId: patient.ghl_contact_id,
  });
}

async function sendRescheduleSMS(appointment, event) {
  if (!appointment.patient_id) return;

  const { data: patient } = await supabase
    .from('patients')
    .select('ghl_contact_id, name')
    .eq('id', appointment.patient_id)
    .single();

  if (!patient?.ghl_contact_id) return;

  const firstName = patient.name.split(' ')[0];
  const newDate = new Date(appointment.start_time).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const newTime = new Date(appointment.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  const message = `Hi ${firstName}, your ${appointment.service_name} appointment has been rescheduled to ${newDate} at ${newTime}. See you at Range Medical!`;

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
    source: 'appointments/webhook',
    patientId: appointment.patient_id,
    patientName: patient.name,
    ghlContactId: patient.ghl_contact_id,
  });
}

async function logToCommsLog(appointment, event) {
  await logComm({
    channel: 'sms',
    messageType: `appointment_${event.event_type}`,
    message: `Appointment ${event.event_type}: ${appointment.patient_name} — ${appointment.service_name}`,
    source: 'appointments/webhook',
    patientId: appointment.patient_id,
    patientName: appointment.patient_name,
  });
}

async function createNoShowAlert(appointment, event) {
  await logComm({
    channel: 'sms',
    messageType: 'appointment_no_show',
    message: `NO SHOW ALERT: ${appointment.patient_name} missed their ${appointment.service_name} appointment`,
    source: 'appointments/webhook',
    patientId: appointment.patient_id,
    patientName: appointment.patient_name,
  });
}

// Event → handler mapping
const handlers = {
  created: [sendConfirmationSMS, logToCommsLog],
  confirmed: [logToCommsLog],
  checked_in: [logToCommsLog],
  in_progress: [logToCommsLog],
  completed: [logToCommsLog],
  no_show: [logToCommsLog, createNoShowAlert],
  cancelled: [sendCancellationSMS, logToCommsLog],
  rescheduled: [sendRescheduleSMS, logToCommsLog],
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_type, appointment } = req.body;

    if (!event_type || !appointment) {
      return res.status(400).json({ error: 'event_type and appointment are required' });
    }

    const eventHandlers = handlers[event_type] || [];

    // Run all handlers in parallel
    await Promise.allSettled(
      eventHandlers.map(fn => fn(appointment, { event_type }))
    );

    return res.status(200).json({ success: true, handlers_run: eventHandlers.length });
  } catch (error) {
    console.error('Appointment webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
