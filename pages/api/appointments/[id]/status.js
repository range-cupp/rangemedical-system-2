// PUT /api/appointments/[id]/status
// Update appointment status with validation and event logging

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VALID_TRANSITIONS = {
  scheduled: ['confirmed', 'checked_in', 'cancelled', 'no_show', 'rescheduled'],
  confirmed: ['checked_in', 'cancelled', 'no_show', 'rescheduled'],
  checked_in: ['in_progress', 'completed', 'cancelled', 'no_show'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
  rescheduled: [],
};

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { status, cancellation_reason } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    // Get current appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Validate status transition
    const allowed = VALID_TRANSITIONS[appointment.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from "${appointment.status}" to "${status}"`,
      });
    }

    // Update appointment
    const updateData = { status };
    if (cancellation_reason) {
      updateData.cancellation_reason = cancellation_reason;
    }

    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update appointment status error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // Log event
    await supabase.from('appointment_events').insert({
      appointment_id: id,
      event_type: status,
      old_status: appointment.status,
      new_status: status,
      metadata: cancellation_reason ? { cancellation_reason } : {},
    });

    // Fire-and-forget automation triggers
    processAppointmentEvent(updated, status, appointment.status).catch(err =>
      console.error('Appointment event processing error:', err)
    );

    return res.status(200).json({ appointment: updated });
  } catch (error) {
    console.error('Update appointment status error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function processAppointmentEvent(appointment, newStatus, oldStatus) {
  // Send cancellation SMS
  if (newStatus === 'cancelled' && appointment.patient_id) {
    const { data: patient } = await supabase
      .from('patients')
      .select('ghl_contact_id, name')
      .eq('id', appointment.patient_id)
      .single();

    if (patient?.ghl_contact_id) {
      const firstName = patient.name.split(' ')[0];
      const apptDate = new Date(appointment.start_time).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      });
      const message = `Hi ${firstName}, your ${appointment.service_name} appointment on ${apptDate} has been cancelled. Please call (949) 997-3988 to reschedule.`;

      try {
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
          source: 'appointments/status',
          patientId: appointment.patient_id,
          patientName: patient.name,
          ghlContactId: patient.ghl_contact_id,
        });
      } catch (err) {
        console.error('Cancellation SMS error:', err);
      }
    }
  }

  // Log no-shows for alerting
  if (newStatus === 'no_show') {
    await logComm({
      channel: 'sms',
      messageType: 'appointment_no_show',
      message: `No-show: ${appointment.patient_name} — ${appointment.service_name}`,
      source: 'appointments/status',
      patientId: appointment.patient_id,
      patientName: appointment.patient_name,
    });
  }
}
