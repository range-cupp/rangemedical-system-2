// PUT /api/appointments/[id]/status
// Update appointment status with validation and event logging

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../../lib/comms-log';
import { autoLogSessionFromAppointment } from '../../../../lib/auto-session-log';
import { sendSMS, normalizePhone } from '../../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VALID_TRANSITIONS = {
  scheduled: ['confirmed', 'checked_in', 'completed', 'cancelled', 'no_show', 'rescheduled'],
  confirmed: ['checked_in', 'completed', 'cancelled', 'no_show', 'rescheduled'],
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

async function createEncounterReminderTask(appointment) {
  // Find provider employee by matching appointment.provider name (case-insensitive)
  let assigneeId = null;

  if (appointment.provider) {
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name')
      .ilike('name', `%${appointment.provider.replace(/^Dr\.\s*/i, '').trim()}%`);

    if (employees?.length > 0) {
      assigneeId = employees[0].id;
    }
  }

  // Fallback: look for the default provider (Dr. Burgess)
  if (!assigneeId) {
    const { data: defaultProvider } = await supabase
      .from('employees')
      .select('id, name')
      .ilike('name', '%burgess%')
      .single();
    assigneeId = defaultProvider?.id || null;
  }

  // No assignee found — skip task creation
  if (!assigneeId) {
    console.warn('Encounter reminder task skipped — no provider employee found for:', appointment.provider);
    return;
  }

  const apptDate = new Date(appointment.start_time).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });

  const serviceName = appointment.service_name || appointment.appointment_title || 'visit';
  const patientName = appointment.patient_name || 'Patient';

  await supabase.from('tasks').insert({
    title: `Document encounter — ${patientName}`,
    description: `Create encounter note for ${patientName}'s ${serviceName} on ${apptDate}. Appointment marked as completed.`,
    assigned_to: assigneeId,
    assigned_by: assigneeId,
    patient_id: appointment.patient_id || null,
    patient_name: patientName,
    appointment_id: appointment.id,
    priority: 'high',
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // due tomorrow
    status: 'pending',
  });
}

async function advanceFreeSessionOnCompletion(appointment) {
  if (!appointment.patient_id) return;
  const { moveCard } = await import('../../../../lib/pipelines-server');

  const prizeTypeMap = { hbot: 'hbot', rlt: 'red_light' };
  const prizeType = prizeTypeMap[appointment.service_category];

  let query = supabase
    .from('pipeline_cards')
    .select('id')
    .eq('pipeline', 'free_sessions')
    .eq('status', 'active')
    .eq('stage', 'scheduled')
    .eq('patient_id', appointment.patient_id);

  if (prizeType) {
    query = query.filter('meta->>prize_type', 'eq', prizeType);
  }

  const { data: card } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!card) return;

  await moveCard({
    card_id: card.id,
    to_stage: 'completed',
    triggered_by: 'automation',
    automation_reason: `appointment_completed:${appointment.id}`,
  });
}

async function advanceEnergyWorkupOnCompletion(appointment) {
  if (!appointment.patient_id) return;
  const { findActiveCard, moveCard } = await import('../../../../lib/pipelines-server');
  const { runStageEntry } = await import('../../../../lib/pipeline-automations');
  const card = await findActiveCard({
    patient_id: appointment.patient_id,
    pipeline: 'energy_workup',
  });
  if (!card || card.stage !== 'consult_booked') return;

  const consultDate = new Date(appointment.start_time)
    .toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); // YYYY-MM-DD Pacific

  const updated = await moveCard({
    card_id: card.id,
    to_stage: 'consult_completed',
    triggered_by: 'automation',
    automation_reason: `appointment_completed:${appointment.id}`,
  });
  if (updated) {
    await runStageEntry({
      card: updated,
      stage: 'consult_completed',
      context: { consultDate },
    });
  }
}

async function processAppointmentEvent(appointment, newStatus, oldStatus) {
  // Auto-create encounter documentation task when appointment is completed
  if (newStatus === 'completed') {
    createEncounterReminderTask(appointment).catch(err =>
      console.error('Encounter reminder task error:', err)
    );

    // Only auto-log when the appointment TRANSITIONS to completed —
    // re-saving an already-completed appointment shouldn't create a phantom log.
    if (oldStatus !== 'completed') {
      autoLogSessionFromAppointment(appointment).catch(err =>
        console.error('Auto-session logging error:', err)
      );
    }

    // Advance energy_workup: consult_booked → consult_completed (Evan's task)
    advanceEnergyWorkupOnCompletion(appointment).catch(err =>
      console.error('Energy workup advance on completion error:', err)
    );

    // Advance free_sessions: scheduled → completed
    advanceFreeSessionOnCompletion(appointment).catch(err =>
      console.error('Free session advance on completion error:', err)
    );
  }

  // Send cancellation SMS
  if (newStatus === 'cancelled' && appointment.patient_id) {
    const { data: patient } = await supabase
      .from('patients')
      .select('ghl_contact_id, name, phone')
      .eq('id', appointment.patient_id)
      .single();

    const phone = normalizePhone(patient?.phone);
    if (patient && phone) {
      const firstName = patient.name.split(' ')[0];
      const apptDate = new Date(appointment.start_time).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
              timeZone: 'America/Los_Angeles',
      });
      const message = `Hi ${firstName}, your ${appointment.service_name} appointment on ${apptDate} has been cancelled. Please call (949) 997-3988 to reschedule.`;

      try {
        const smsResult = await sendSMS({ to: phone, message });

        await logComm({
          channel: 'sms',
          messageType: 'appointment_cancellation',
          message,
          source: 'appointments/status',
          patientId: appointment.patient_id,
          patientName: patient.name,
          ghlContactId: patient.ghl_contact_id,
          recipient: phone,
          twilioMessageSid: smsResult.messageSid || null,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.success ? null : smsResult.error,
          provider: smsResult.provider || null,
          direction: 'outbound',
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
      provider: null,
    });
  }
}
