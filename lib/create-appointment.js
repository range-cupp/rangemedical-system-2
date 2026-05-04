// lib/create-appointment.js
// Single source of truth for creating an appointment in Range Medical.
// Used by /api/appointments/create.js (admin wizard) AND every
// patient-facing book endpoint (birthday, review, free-session, IV
// booking, assessment, etc.) so they all share the same write path,
// notifications, automations, audit log, and shadow-row behaviour.
//
// Returns: { appointment, appointments, visit_group_id }
// Throws on validation failure with a `.statusCode` property the caller
// can pass straight to the HTTP response.

import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { sendAppointmentNotification } from './appointment-notifications';
import { sendProviderNotification } from './provider-notifications';
import { logAction } from './auth';
import { runBookingAutomations } from './booking-automations';
import { toPacificDate } from './date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class CreateAppointmentError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Create one (or more, for multi-service) appointments.
 *
 * @param {object} input - Same shape as the old /api/appointments/create body.
 * @param {object} [opts]
 * @param {object} [opts.req] - Express-style request, used only for audit IP.
 * @param {boolean} [opts.skipAuditLog=false] - Suppress the audit_log row.
 * @param {boolean} [opts.skipPipelineAdvance=false] - Suppress energy_workup pipeline advance.
 */
export async function createAppointment(input, { req = null, skipAuditLog = false, skipPipelineAdvance = false } = {}) {
  const {
    patient_id,
    patient_name,
    patient_phone,
    service_name,
    service_category,
    service_slug,
    provider,
    location,
    start_time,
    end_time,
    duration_minutes,
    notes,
    source,
    created_by,
    send_notification = true,
    cal_com_booking_id,
    services,
    visit_reason,
    modality,
  } = input;

  if (!patient_name || !service_name || !start_time || !end_time || !duration_minutes) {
    throw new CreateAppointmentError(
      'patient_name, service_name, start_time, end_time, and duration_minutes are required',
      400,
    );
  }
  if (!visit_reason || !visit_reason.trim()) {
    throw new CreateAppointmentError('visit_reason is required', 400);
  }

  console.log('[createAppointment]', {
    patient: patient_name,
    service: service_name,
    source: source || 'manual',
    created_by,
  });

  const appointmentLocation = location || 'Range Medical — Newport Beach';
  const sharedBase = {
    patient_id: patient_id || null,
    patient_name,
    patient_phone: patient_phone || null,
    location: appointmentLocation,
    status: 'scheduled',
    notes: notes || null,
    source: source || 'manual',
    created_by: created_by || null,
    visit_reason: visit_reason.trim(),
    modality: modality || null,
    send_notification,
  };

  const isMulti = Array.isArray(services) && services.length > 1;
  const visitGroupId = isMulti ? randomUUID() : null;

  const rowsToInsert = isMulti
    ? services.map((svc, idx) => {
        const offsetMins = services
          .slice(0, idx)
          .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
        const svcStart = svc.start_time
          ? new Date(svc.start_time)
          : new Date(new Date(start_time).getTime() + offsetMins * 60000);
        const svcDuration = Number(svc.duration) || 0;
        const svcEnd = new Date(svcStart.getTime() + svcDuration * 60000);
        return {
          ...sharedBase,
          service_name: svc.name,
          service_category: svc.category || null,
          provider: svc.provider || null,
          start_time: svcStart.toISOString(),
          end_time: svcEnd.toISOString(),
          duration_minutes: svcDuration,
          cal_com_booking_id: svc.calcom_booking_id || svc.cal_com_booking_id || null,
          visit_group_id: visitGroupId,
        };
      })
    : [{
        ...sharedBase,
        service_name,
        service_category: service_category || null,
        provider: provider || null,
        start_time,
        end_time,
        duration_minutes,
        cal_com_booking_id: cal_com_booking_id || null,
        visit_group_id: null,
      }];

  // Dedupe path: when cal_com_booking_id is present, the Cal.com webhook
  // may have landed a placeholder row already. Update in place.
  let inserted = [];

  if (!isMulti && rowsToInsert[0].cal_com_booking_id) {
    const row = rowsToInsert[0];
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('cal_com_booking_id', row.cal_com_booking_id)
      .maybeSingle();

    if (existing?.id) {
      const { data: updated, error: updateErr } = await supabase
        .from('appointments')
        .update({
          patient_id: row.patient_id,
          patient_name: row.patient_name,
          patient_phone: row.patient_phone,
          service_name: row.service_name,
          service_category: row.service_category,
          provider: row.provider,
          location: row.location,
          start_time: row.start_time,
          end_time: row.end_time,
          duration_minutes: row.duration_minutes,
          status: row.status,
          notes: row.notes,
          source: row.source,
          created_by: row.created_by,
          visit_reason: row.visit_reason,
          modality: row.modality,
          send_notification: row.send_notification,
        })
        .eq('id', existing.id)
        .select();
      if (updateErr) throw new CreateAppointmentError(updateErr.message);
      inserted = updated || [];
    } else {
      const { data, error: insertErr } = await supabase
        .from('appointments')
        .insert(rowsToInsert)
        .select();
      if (insertErr) throw new CreateAppointmentError(insertErr.message);
      inserted = data || [];
    }
  } else if (isMulti && rowsToInsert[0].cal_com_booking_id) {
    const primary = rowsToInsert[0];
    const { data: existingPrimary } = await supabase
      .from('appointments')
      .select('id')
      .eq('cal_com_booking_id', primary.cal_com_booking_id)
      .maybeSingle();

    if (existingPrimary?.id) {
      const { data: updated, error: updateErr } = await supabase
        .from('appointments')
        .update({
          patient_id: primary.patient_id,
          patient_name: primary.patient_name,
          patient_phone: primary.patient_phone,
          service_name: primary.service_name,
          service_category: primary.service_category,
          provider: primary.provider,
          location: primary.location,
          start_time: primary.start_time,
          end_time: primary.end_time,
          duration_minutes: primary.duration_minutes,
          status: primary.status,
          notes: primary.notes,
          source: primary.source,
          created_by: primary.created_by,
          visit_reason: primary.visit_reason,
          modality: primary.modality,
          send_notification: primary.send_notification,
          visit_group_id: primary.visit_group_id,
        })
        .eq('id', existingPrimary.id)
        .select();
      if (updateErr) throw new CreateAppointmentError(updateErr.message);
      inserted = [...(updated || [])];

      if (rowsToInsert.length > 1) {
        const { data: siblings, error: siblingErr } = await supabase
          .from('appointments')
          .insert(rowsToInsert.slice(1))
          .select();
        if (siblingErr) throw new CreateAppointmentError(siblingErr.message);
        inserted = [...inserted, ...(siblings || [])];
      }
    } else {
      const { data, error: insertErr } = await supabase
        .from('appointments')
        .insert(rowsToInsert)
        .select();
      if (insertErr) throw new CreateAppointmentError(insertErr.message);
      inserted = data || [];
    }
  } else {
    const { data, error: insertErr } = await supabase
      .from('appointments')
      .insert(rowsToInsert)
      .select();
    if (insertErr) throw new CreateAppointmentError(insertErr.message);
    inserted = data || [];
  }

  const appointments = (inserted || []).slice().sort(
    (a, b) => new Date(a.start_time) - new Date(b.start_time),
  );
  const primary = appointments[0];

  // Per-row 'created' event for audit trail.
  await supabase.from('appointment_events').insert(
    appointments.map(a => ({
      appointment_id: a.id,
      event_type: 'created',
      new_status: 'scheduled',
      metadata: {
        created_by,
        source: source || 'manual',
        send_notification,
        visit_group_id: visitGroupId,
      },
    })),
  );

  // Shadow calcom_bookings row so consumers that haven't been migrated
  // yet (reminder cron, lab-prep cron, patient timeline, staff-bot) keep
  // working. Skip rows that already have a cal_com_booking_id (those
  // come from the real Cal.com webhook).
  try {
    const shadowRows = appointments
      .filter(a => !a.cal_com_booking_id)
      .map(a => {
        const perServiceSlug = isMulti
          ? services.find(s => s.name === a.service_name)?.slug
          : null;
        return {
          calcom_uid: `local-${a.id}`,
          patient_id: a.patient_id,
          patient_name: a.patient_name,
          patient_phone: a.patient_phone,
          service_name: a.service_name,
          service_slug: perServiceSlug || service_slug || null,
          start_time: a.start_time,
          end_time: a.end_time,
          booking_date: toPacificDate(a.start_time),
          duration_minutes: a.duration_minutes,
          status: a.status,
          location: a.location,
          notes: a.notes,
          booked_by: source === 'patient' ? 'patient' : 'staff',
        };
      });
    if (shadowRows.length > 0) {
      const { error: shadowErr } = await supabase
        .from('calcom_bookings')
        .insert(shadowRows);
      if (shadowErr) {
        console.error('[createAppointment] shadow calcom_bookings write failed:', shadowErr);
      }
    }
  } catch (e) {
    console.error('[createAppointment] shadow write error (non-fatal):', e);
  }

  // Audit log — one entry per visit.
  if (!skipAuditLog) {
    await logAction({
      employeeName: created_by || 'Unknown',
      action: 'book_appointment',
      resourceType: 'appointment',
      resourceId: primary.id,
      details: {
        patient_name,
        service_name: isMulti ? appointments.map(a => a.service_name).join(' + ') : primary.service_name,
        start_time: primary.start_time,
        provider: isMulti ? appointments.map(a => a.provider).filter(Boolean).join(', ') : primary.provider,
        source: source || 'manual',
        visit_group_id: visitGroupId,
      },
      req,
    });
  }

  // Patient confirmation notification — once per visit.
  if (send_notification && patient_id) {
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, email, phone')
      .eq('id', patient_id)
      .single();

    if (patient) {
      const totalDuration = appointments.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
      const visitEnd = appointments[appointments.length - 1].end_time;
      const combinedServiceName = isMulti
        ? appointments.map(a => a.service_name).join(' + ')
        : primary.service_name;

      try {
        await sendAppointmentNotification({
          type: 'confirmation',
          patient: {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            phone: patient.phone || patient_phone,
          },
          appointment: {
            serviceName: combinedServiceName,
            serviceSlug: service_slug || null,
            startTime: primary.start_time,
            endTime: visitEnd,
            durationMinutes: totalDuration,
            location: appointmentLocation,
            notes,
          },
        });
      } catch (err) {
        console.error('Appointment notification error:', err);
      }
    }
  }

  // Mirror visit reason into a staff note.
  if (patient_id && visit_reason) {
    try {
      const noteBody = notes
        ? `${visit_reason.trim()}\n\n${notes.trim()}`
        : visit_reason.trim();

      await supabase.from('patient_notes').insert({
        patient_id,
        body: noteBody,
        raw_input: noteBody,
        created_by: created_by || 'System',
        note_date: new Date().toISOString(),
        source: 'manual',
        note_category: 'internal',
      });
    } catch (noteErr) {
      console.error('Staff note from visit reason failed:', noteErr);
    }
  }

  // Provider SMS per row.
  for (const a of appointments) {
    if (a.provider) {
      sendProviderNotification({
        type: 'created',
        provider: a.provider,
        appointment: {
          patientName: patient_name,
          serviceName: a.service_name,
          startTime: a.start_time,
        },
      }).catch(err => console.error('Provider SMS notification failed:', err));
    }
  }

  // Booking automations — only for rows that didn't come from Cal.com.
  if (send_notification) {
    let patientEmail = null;
    if (patient_id) {
      const { data: pt } = await supabase
        .from('patients')
        .select('email')
        .eq('id', patient_id)
        .single();
      patientEmail = pt?.email || null;
    }

    for (const a of appointments) {
      if (a.cal_com_booking_id) continue;
      const perServiceSlug = isMulti
        ? services.find(s => s.name === a.service_name)?.slug
        : service_slug;
      runBookingAutomations({
        appointmentId: a.id,
        eventTypeSlug: perServiceSlug || null,
        serviceCategory: a.service_category || 'other',
        patientId: patient_id || null,
        patientName: patient_name,
        patientEmail,
        patientPhone: patient_phone || null,
        serviceName: a.service_name,
        startTime: a.start_time,
      }).catch(err => console.error('Booking automations error:', err));
    }
  }

  // Pipeline advance: energy_workup → consult_booked.
  if (patient_id && !skipPipelineAdvance) {
    try {
      const { findActiveCard, moveCard } = await import('./pipelines-server');
      const { runStageEntry } = await import('./pipeline-automations');
      const card = await findActiveCard({ patient_id, pipeline: 'energy_workup' });
      if (card && ['ready_to_schedule', 'scheduling_attempted'].includes(card.stage)) {
        const updated = await moveCard({
          card_id: card.id,
          to_stage: 'consult_booked',
          triggered_by: 'automation',
          automation_reason: `appointment_booked:${primary.id}`,
        });
        if (updated) {
          await runStageEntry({ card: updated, stage: 'consult_booked' });
        }
      }
    } catch (pipeErr) {
      console.error('Appointment→pipeline advance error:', pipeErr);
    }
  }

  return { appointment: primary, appointments, visit_group_id: visitGroupId };
}

export { CreateAppointmentError };
