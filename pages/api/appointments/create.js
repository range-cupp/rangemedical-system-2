// POST /api/appointments/create
// Creates a new appointment. For multi-service visits (services[].length > 1), splits into
// one row per service — each with its own provider, start_time, duration, and cal.com
// booking — linked by a shared visit_group_id. Patient notification, audit log, and
// booking automations run once per visit (for the primary/first row); provider SMS fires
// per row so each provider hears about their own piece.

import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { sendAppointmentNotification } from '../../../lib/appointment-notifications';
import { sendProviderNotification } from '../../../lib/provider-notifications';
import { logAction } from '../../../lib/auth';
import { runBookingAutomations } from '../../../lib/booking-automations';

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
      services, // array of per-service rows for multi-service visits
      visit_reason,
      modality,
    } = req.body;

    if (!patient_name || !service_name || !start_time || !end_time || !duration_minutes) {
      return res.status(400).json({ error: 'patient_name, service_name, start_time, end_time, and duration_minutes are required' });
    }
    if (!visit_reason || !visit_reason.trim()) {
      return res.status(400).json({ error: 'visit_reason is required' });
    }

    console.log('[appt-create]', {
      patient: patient_name,
      service: service_name,
      source: source || 'manual',
      notes_len: (notes || '').length,
      notes_preview: (notes || '').slice(0, 80),
      visit_reason_len: (visit_reason || '').length,
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

    // Build the list of rows to insert. Multi-service → N rows; single-service → 1 row.
    const isMulti = Array.isArray(services) && services.length > 1;
    const visitGroupId = isMulti ? randomUUID() : null;

    const rowsToInsert = isMulti
      ? services.map((svc, idx) => {
          // Per-service start time: explicit if provided, otherwise stagger from the visit
          // start using the running duration offset.
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

    // When a cal_com_booking_id is present, the Cal.com BOOKING_CREATED
    // webhook usually lands a placeholder row 100-300ms before this request
    // arrives (placeholder visit_reason, null notes). Update that row in
    // place with the real caller data instead of inserting a duplicate.
    // For multi-service visits the webhook only ever creates the first row,
    // so the primary (earliest) row gets updated and the rest are inserted.
    let inserted = [];
    let error = null;

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
        inserted = updated || [];
        error = updateErr;
      } else {
        const { data, error: insertErr } = await supabase
          .from('appointments')
          .insert(rowsToInsert)
          .select();
        inserted = data || [];
        error = insertErr;
      }
    } else if (isMulti && rowsToInsert[0].cal_com_booking_id) {
      // Multi-service: check if the primary row exists (webhook-created),
      // update it, then insert the remaining sibling rows.
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
        if (updateErr) error = updateErr;
        inserted = [...(updated || [])];

        if (!error && rowsToInsert.length > 1) {
          const { data: siblings, error: siblingErr } = await supabase
            .from('appointments')
            .insert(rowsToInsert.slice(1))
            .select();
          if (siblingErr) error = siblingErr;
          inserted = [...inserted, ...(siblings || [])];
        }
      } else {
        const { data, error: insertErr } = await supabase
          .from('appointments')
          .insert(rowsToInsert)
          .select();
        inserted = data || [];
        error = insertErr;
      }
    } else {
      const { data, error: insertErr } = await supabase
        .from('appointments')
        .insert(rowsToInsert)
        .select();
      inserted = data || [];
      error = insertErr;
    }

    if (error) {
      console.error('Create appointment error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Sort inserted rows by start_time so "primary" is always the earliest service.
    const appointments = (inserted || []).slice().sort(
      (a, b) => new Date(a.start_time) - new Date(b.start_time)
    );
    const primary = appointments[0];

    // Log a 'created' event for each row so audit trails track per-row status changes.
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
      }))
    );

    // Audit log — one entry per visit, with the service list in details for multi-service.
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

    // Patient notification — once per visit. Use combined service name for multi-service.
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

    // Staff note — mirror the visit reason (and notes) into the patient's staff notes
    // so it shows up on the patient profile without having to open the appointment.
    if (patient_id && visit_reason) {
      try {
        const noteBody = notes
          ? `${visit_reason.trim()}\n\n${notes.trim()}`
          : visit_reason.trim();
        const combinedService = isMulti
          ? appointments.map(a => a.service_name).join(' + ')
          : primary.service_name;

        await supabase.from('patient_notes').insert({
          patient_id,
          body: noteBody,
          raw_input: noteBody,
          created_by: created_by || 'System',
          note_date: new Date().toISOString(),
          source: 'manual',
          note_category: 'internal',
          appointment_id: primary.id,
          encounter_service: combinedService,
          visit_group_id: visitGroupId,
          status: 'signed',
        });
      } catch (noteErr) {
        console.error('Staff note from visit reason failed:', noteErr);
      }
    }

    // Provider SMS — fire per-row so every provider gets a heads-up for their slice.
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

    // Booking automations — only for rows that didn't come from Cal.com, and only once per
    // visit group (skip duplicating form sends). We fire for each row that lacks a
    // cal_com_booking_id since prep instructions are service-specific.
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
        if (a.cal_com_booking_id) continue; // Cal.com webhook handles those
        runBookingAutomations({
          appointmentId: a.id,
          eventTypeSlug: service_slug || null,
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

    // Pipeline automation: if the patient has an active energy_workup card
    // waiting on a consult (ready_to_schedule / scheduling_attempted), booking
    // any appointment advances it to consult_booked and closes Tara's
    // "Schedule consult" task.
    if (patient_id) {
      try {
        const { findActiveCard, moveCard } = await import('../../../lib/pipelines-server');
        const { runStageEntry } = await import('../../../lib/pipeline-automations');
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

    // Return the primary row as `appointment` (back-compat) plus the full list + group id.
    return res.status(200).json({
      appointment: primary,
      appointments,
      visit_group_id: visitGroupId,
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
