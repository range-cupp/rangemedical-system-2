// POST /api/appointments/webhook
// Internal automation trigger dispatcher for appointment events
// SMS sent via sendAppointmentNotification (respects quiet hours + uses Blooio)

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';
import { sendAppointmentNotification } from '../../../lib/appointment-notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Handler functions — use sendAppointmentNotification for SMS (respects quiet hours 8am-8pm PST)
async function sendConfirmationSMS(appointment, event) {
  if (!appointment.patient_id) return;

  const { data: patient } = await supabase
    .from('patients')
    .select('id, name, email, phone, ghl_contact_id')
    .eq('id', appointment.patient_id)
    .single();

  if (!patient) return;

  await sendAppointmentNotification({
    type: 'confirmation',
    patient: {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
    },
    appointment: {
      serviceName: appointment.service_name,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      durationMinutes: appointment.duration_minutes,
      location: 'Range Medical — Newport Beach',
      notes: appointment.notes,
    },
  });
}

async function sendCancellationSMS(appointment, event) {
  if (!appointment.patient_id) return;

  const { data: patient } = await supabase
    .from('patients')
    .select('id, name, email, phone, ghl_contact_id')
    .eq('id', appointment.patient_id)
    .single();

  if (!patient) return;

  await sendAppointmentNotification({
    type: 'cancellation',
    patient: {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
    },
    appointment: {
      serviceName: appointment.service_name,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      durationMinutes: appointment.duration_minutes,
      location: 'Range Medical — Newport Beach',
      notes: appointment.notes,
    },
  });
}

async function sendRescheduleSMS(appointment, event) {
  if (!appointment.patient_id) return;

  const { data: patient } = await supabase
    .from('patients')
    .select('id, name, email, phone, ghl_contact_id')
    .eq('id', appointment.patient_id)
    .single();

  if (!patient) return;

  await sendAppointmentNotification({
    type: 'reschedule',
    patient: {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
    },
    appointment: {
      serviceName: appointment.service_name,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      durationMinutes: appointment.duration_minutes,
      location: 'Range Medical — Newport Beach',
      notes: appointment.notes,
    },
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
    provider: null,
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
    provider: null,
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
