// PUT /api/appointments/[id]/status
// Update appointment status with validation and event logging

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logComm } from '../../../../lib/comms-log';
import { autoLogSessionFromAppointment } from '../../../../lib/auto-session-log';
import { sendSMS, normalizePhone } from '../../../../lib/send-sms';
import { generateBookingCancellationHtml } from '../../../../lib/appointment-emails';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

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

async function advanceLabsPipelineOnCompletion(appointment) {
  if (!appointment.patient_id) return;
  const { findActiveCard, moveCard } = await import('../../../../lib/pipelines-server');
  const { runStageEntry, ensureLabsCardAtAwaitingResults } = await import('../../../../lib/pipeline-automations');

  // Check both labs pipelines
  let card = await findActiveCard({ patient_id: appointment.patient_id, pipeline: 'energy_workup' });
  if (!card) {
    card = await findActiveCard({ patient_id: appointment.patient_id, pipeline: 'follow_up_labs' });
  }

  const sn = (appointment.service_name || '').toLowerCase();
  const isBloodDraw = sn.includes('blood draw') || sn.includes('phlebotomy');

  // No card — create one at awaiting_results for completed blood draws
  if (!card) {
    if (isBloodDraw) {
      await ensureLabsCardAtAwaitingResults({
        patientId: appointment.patient_id,
        reason: `appointment_completed:${appointment.id}`,
      });
    }
    return;
  }

  // Blood draw completed → labs_scheduled → awaiting_results
  if (card.stage === 'labs_scheduled') {
    if (isBloodDraw) {
      await moveCard({
        card_id: card.id,
        to_stage: 'awaiting_results',
        triggered_by: 'automation',
        automation_reason: `appointment_completed:${appointment.id}`,
      });
    }
    return;
  }

  // Advance from any pre-completed stage to consult_completed —
  // but only when the completed appointment is a consult or lab review.
  const isConsult = sn.includes('consult') || sn.includes('lab review');
  const preCompletedStages = ['ready_to_schedule', 'scheduling_attempted', 'consult_booked'];
  if (!isConsult || !preCompletedStages.includes(card.stage)) return;

  const consultDate = new Date(appointment.start_time)
    .toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

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

    // Advance labs pipeline: any pre-completed stage → consult_completed
    advanceLabsPipelineOnCompletion(appointment).catch(err =>
      console.error('Labs pipeline advance on completion error:', err)
    );

    // Advance free_sessions: scheduled → completed
    advanceFreeSessionOnCompletion(appointment).catch(err =>
      console.error('Free session advance on completion error:', err)
    );
  }

  // Send cancellation SMS + email
  if (newStatus === 'cancelled' && appointment.patient_id) {
    const { data: patient } = await supabase
      .from('patients')
      .select('ghl_contact_id, name, phone, email')
      .eq('id', appointment.patient_id)
      .single();

    const phone = normalizePhone(patient?.phone);
    const firstName = (patient?.name || 'there').split(' ')[0];
    const apptDate = new Date(appointment.start_time).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
      timeZone: 'America/Los_Angeles',
    });
    const apptTime = new Date(appointment.start_time).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });

    // SMS
    if (patient && phone) {
      const message = `Hi ${firstName}, your ${appointment.service_name} appointment on ${apptDate} has been cancelled. Please call (949) 997-3988 to reschedule.`;
      try {
        const smsResult = await sendSMS({ to: phone, message, skipEmailCopy: true });
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

    // Email
    if (patient?.email) {
      try {
        const emailSubject = `Appointment Cancelled — Range Medical`;
        const emailHtml = generateBookingCancellationHtml({
          patientName: patient.name,
          serviceName: appointment.service_name,
          date: apptDate,
          time: apptTime,
        });
        await resend.emails.send({
          from: 'Range Medical <noreply@range-medical.com>',
          replyTo: 'info@range-medical.com',
          to: patient.email,
          subject: emailSubject,
          html: emailHtml,
        });
        await logComm({
          channel: 'email',
          messageType: 'appointment_cancellation',
          message: emailHtml,
          source: 'appointments/status',
          patientId: appointment.patient_id,
          patientName: patient.name,
          recipient: patient.email,
          subject: emailSubject,
          status: 'sent',
          direction: 'outbound',
          htmlBody: emailHtml,
        });
      } catch (err) {
        console.error('Cancellation email error:', err);
      }
    }
  }

  // No-show: send patient SMS + email + log
  if (newStatus === 'no_show' && appointment.patient_id) {
    const { data: noShowPatient } = await supabase
      .from('patients')
      .select('ghl_contact_id, name, phone, email')
      .eq('id', appointment.patient_id)
      .single();

    const noShowPhone = normalizePhone(noShowPatient?.phone);
    if (noShowPatient && noShowPhone) {
      const firstName = noShowPatient.name.split(' ')[0];
      const apptDate = new Date(appointment.start_time).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
        timeZone: 'America/Los_Angeles',
      });
      const noShowMsg = `Hi ${firstName}, we missed you at your ${appointment.service_name} appointment on ${apptDate}. Please call or text (949) 997-3988 to reschedule.`;

      try {
        const smsResult = await sendSMS({ to: noShowPhone, message: noShowMsg, skipEmailCopy: true });
        await logComm({
          channel: 'sms',
          messageType: 'appointment_no_show',
          message: noShowMsg,
          source: 'appointments/status',
          patientId: appointment.patient_id,
          patientName: noShowPatient.name,
          ghlContactId: noShowPatient.ghl_contact_id,
          recipient: noShowPhone,
          twilioMessageSid: smsResult.messageSid || null,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.success ? null : smsResult.error,
          provider: smsResult.provider || null,
          direction: 'outbound',
        });
      } catch (err) {
        console.error('No-show SMS error:', err);
      }
    } else {
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

    // No-show email
    if (noShowPatient?.email) {
      const firstName = noShowPatient.name.split(' ')[0];
      const apptDate = new Date(appointment.start_time).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
        timeZone: 'America/Los_Angeles',
      });
      const apptTime = new Date(appointment.start_time).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
        timeZone: 'America/Los_Angeles',
      });
      try {
        const emailSubject = `We Missed You — Range Medical`;
        const emailHtml = generateBookingCancellationHtml({
          patientName: noShowPatient.name,
          serviceName: appointment.service_name,
          date: apptDate,
          time: apptTime,
        });
        await resend.emails.send({
          from: 'Range Medical <noreply@range-medical.com>',
          replyTo: 'info@range-medical.com',
          to: noShowPatient.email,
          subject: emailSubject,
          html: emailHtml,
        });
        await logComm({
          channel: 'email',
          messageType: 'appointment_no_show',
          message: emailHtml,
          source: 'appointments/status',
          patientId: appointment.patient_id,
          patientName: noShowPatient.name,
          recipient: noShowPatient.email,
          subject: emailSubject,
          status: 'sent',
          direction: 'outbound',
          htmlBody: emailHtml,
        });
      } catch (err) {
        console.error('No-show email error:', err);
      }
    }
  }
}
