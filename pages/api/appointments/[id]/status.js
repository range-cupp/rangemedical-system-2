// PUT /api/appointments/[id]/status
// Update appointment status with validation and event logging

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../../lib/comms-log';

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

// Map appointment service names to service log categories and protocol types
// Injections: must contain "injection" keyword + one of these
const INJECTION_APPOINTMENT_TYPES = {
  'peptide': { category: 'peptide', programType: 'peptide', entryType: 'injection' },
  'weight loss': { category: 'weight_loss', programType: 'weight_loss', entryType: 'injection' },
  'testosterone': { category: 'testosterone', programType: 'hrt', entryType: 'injection' },
  'hrt': { category: 'testosterone', programType: 'hrt', entryType: 'injection' },
  'b12': { category: 'injection', programType: 'injection', entryType: 'injection' },
  'b-12': { category: 'injection', programType: 'injection', entryType: 'injection' },
  'vitamin': { category: 'injection', programType: 'injection', entryType: 'injection' },
  'nad': { category: 'injection', programType: 'injection', entryType: 'injection' },
  'glutathione': { category: 'injection', programType: 'injection', entryType: 'injection' },
};

// Session types: matched by keyword alone (no "injection" required)
const SESSION_APPOINTMENT_TYPES = {
  'hbot': { category: 'hbot', programType: 'hbot', entryType: 'session' },
  'hyperbaric': { category: 'hbot', programType: 'hbot', entryType: 'session' },
  'red light': { category: 'red_light', programType: 'rlt', entryType: 'session' },
  'rlt': { category: 'red_light', programType: 'rlt', entryType: 'session' },
  'iv therapy': { category: 'iv_therapy', programType: 'iv', entryType: 'session' },
  'iv drip': { category: 'iv_therapy', programType: 'iv', entryType: 'session' },
  'myers': { category: 'iv_therapy', programType: 'iv', entryType: 'session' },
  'nad+ iv': { category: 'iv_therapy', programType: 'iv', entryType: 'session' },
  'immunity drip': { category: 'iv_therapy', programType: 'iv', entryType: 'session' },
  'hydration': { category: 'iv_therapy', programType: 'iv', entryType: 'session' },
};

// Detect what type of service this appointment is
function detectAppointmentServiceType(appointment) {
  const name = (appointment.service_name || appointment.appointment_title || '').toLowerCase();
  const category = (appointment.service_category || '').toLowerCase();

  // Check injection types (requires "injection" in name)
  if (name.includes('injection')) {
    for (const [keyword, config] of Object.entries(INJECTION_APPOINTMENT_TYPES)) {
      if (name.includes(keyword)) return config;
    }
    // Generic injection fallback
    return { category: 'injection', programType: 'injection', entryType: 'injection' };
  }

  // Check session types (keyword match alone)
  for (const [keyword, config] of Object.entries(SESSION_APPOINTMENT_TYPES)) {
    if (name.includes(keyword) || category.includes(keyword)) return config;
  }

  // Check category-based matching as fallback
  if (category === 'hbot' || category === 'hyperbaric') return { category: 'hbot', programType: 'hbot', entryType: 'session' };
  if (category === 'red_light' || category === 'rlt') return { category: 'red_light', programType: 'rlt', entryType: 'session' };
  if (category === 'iv_therapy' || category === 'iv') return { category: 'iv_therapy', programType: 'iv', entryType: 'session' };

  return null;
}

async function autoLogSessionFromAppointment(appointment) {
  const serviceType = detectAppointmentServiceType(appointment);
  if (!serviceType) return;

  // Skip weight loss and HRT — these use encounter notes as their single source of truth.
  // Appointment completion just serves as a visual overlay, not the injection record.
  const encounterNoteCategories = ['weight_loss', 'testosterone'];
  if (encounterNoteCategories.includes(serviceType.category)) {
    console.log(`Auto-session-log: skipping ${serviceType.category} — encounter note is the source of truth`);
    return;
  }

  const patientId = appointment.patient_id;
  if (!patientId) {
    console.log('Auto-session-log: no patient_id on appointment, skipping');
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const provider = appointment.provider || null;

  // Find active protocol for this type (optional — sessions can be logged without a protocol)
  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, medication, selected_dose, program_type, sessions_used, total_sessions')
    .eq('patient_id', patientId)
    .eq('program_type', serviceType.programType)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Check for duplicate on same date + same type
  const dupQuery = supabase
    .from('service_logs')
    .select('id')
    .eq('patient_id', patientId)
    .eq('entry_date', todayStr)
    .eq('category', serviceType.category)
    .eq('entry_type', serviceType.entryType);
  if (protocol) dupQuery.eq('protocol_id', protocol.id);
  const { data: existing } = await dupQuery.limit(1);
  if (existing && existing.length > 0) {
    console.log(`Auto-session-log: already logged ${serviceType.category} ${serviceType.entryType} for patient ${patientId} on ${todayStr}, skipping`);
    return;
  }

  // Log to service_logs
  const { error: slErr } = await supabase.from('service_logs').insert({
    patient_id: patientId,
    protocol_id: protocol?.id || null,
    category: serviceType.category,
    entry_type: serviceType.entryType,
    entry_date: todayStr,
    medication: protocol?.medication || null,
    dosage: protocol?.selected_dose || null,
    administered_by: provider,
    notes: `Auto-logged from completed appointment: ${appointment.service_name || appointment.appointment_title || 'Session'}${provider ? ` — ${provider}` : ''}`,
  });

  if (slErr) {
    console.error('Auto-session-log service_log error:', slErr);
    return;
  }

  // Update sessions_used on the protocol if one exists
  if (protocol) {
    const newSessionsUsed = (protocol.sessions_used || 0) + 1;
    await supabase
      .from('protocols')
      .update({ sessions_used: newSessionsUsed, updated_at: new Date().toISOString() })
      .eq('id', protocol.id);

    console.log(`Auto-session-log: logged ${serviceType.category} ${serviceType.entryType} for patient ${patientId}, protocol ${protocol.id} (${provider || 'no provider'}). Sessions: ${newSessionsUsed}/${protocol.total_sessions || '∞'}`);
  } else {
    console.log(`Auto-session-log: logged ${serviceType.category} ${serviceType.entryType} for patient ${patientId} (no protocol). ${provider || 'no provider'}`);
  }
}

async function processAppointmentEvent(appointment, newStatus, oldStatus) {
  // Auto-create encounter documentation task when appointment is completed
  if (newStatus === 'completed') {
    createEncounterReminderTask(appointment).catch(err =>
      console.error('Encounter reminder task error:', err)
    );

    // Auto-log session/injection in service_logs when appointment is completed
    autoLogSessionFromAppointment(appointment).catch(err =>
      console.error('Auto-session logging error:', err)
    );
  }

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
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';
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
