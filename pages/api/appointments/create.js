// POST /api/appointments/create
// Creates a new appointment, logs the event, and sends patient notification
// Range Medical

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
      services, // array of { name, category, duration } for multi-service appointments
      visit_reason,
      modality,
    } = req.body;

    if (!patient_name || !service_name || !start_time || !end_time || !duration_minutes) {
      return res.status(400).json({ error: 'patient_name, service_name, start_time, end_time, and duration_minutes are required' });
    }

    // visit_reason is required for all appointments (Cal.com webhook auto-populates a placeholder)
    if (!visit_reason || !visit_reason.trim()) {
      return res.status(400).json({ error: 'visit_reason is required' });
    }

    const appointmentLocation = location || 'Range Medical — Newport Beach';

    const insertRow = {
      patient_id: patient_id || null,
      patient_name,
      patient_phone: patient_phone || null,
      service_name,
      service_category: service_category || null,
      provider: provider || null,
      location: appointmentLocation,
      start_time,
      end_time,
      duration_minutes,
      status: 'scheduled',
      notes: notes || null,
      source: source || 'manual',
      created_by: created_by || null,
      services: services || null, // null for single-service, array for multi-service
      visit_reason: visit_reason.trim(),
      modality: modality || null,
      send_notification,
    };

    // Include cal_com_booking_id if provided (prevents duplicate when webhook fires)
    if (cal_com_booking_id) {
      insertRow.cal_com_booking_id = cal_com_booking_id;
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert(insertRow)
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
      metadata: { created_by, source: source || 'manual', send_notification },
    });

    // Audit log — who booked this appointment
    await logAction({
      employeeName: created_by || 'Unknown',
      action: 'book_appointment',
      resourceType: 'appointment',
      resourceId: appointment.id,
      details: {
        patient_name,
        service_name,
        start_time,
        provider: provider || null,
        source: source || 'manual',
      },
      req,
    });

    // Send patient notification (email + SMS) if enabled
    if (send_notification && patient_id) {
      // Look up patient email/phone
      const { data: patient } = await supabase
        .from('patients')
        .select('id, name, email, phone')
        .eq('id', patient_id)
        .single();

      if (patient) {
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
              serviceName: services ? services.map(s => s.name).join(' + ') : service_name,
              serviceSlug: service_slug || null,
              startTime: start_time,
              endTime: end_time,
              durationMinutes: duration_minutes,
              location: appointmentLocation,
              notes,
            },
          });
        } catch (err) {
          console.error('Appointment notification error:', err);
          // Don't fail the appointment creation if notification fails
        }
      }
    }

    // Send provider SMS notification (fire-and-forget)
    if (provider) {
      sendProviderNotification({
        type: 'created',
        provider,
        appointment: {
          patientName: patient_name,
          serviceName: services ? services.map(s => s.name).join(' + ') : service_name,
          startTime: start_time,
        },
      }).catch(err => console.error('Provider SMS notification failed:', err));
    }

    // Run booking automations (prep instructions, forms, prereq check)
    // Skip if cal_com_booking_id exists — the Cal.com webhook handles those
    // Skip if send_notification is false — staff opted out of patient comms
    if (!cal_com_booking_id && send_notification) {
      // Look up patient email for form sends
      let patientEmail = null;
      if (patient_id) {
        const { data: pt } = await supabase
          .from('patients')
          .select('email')
          .eq('id', patient_id)
          .single();
        patientEmail = pt?.email || null;
      }

      runBookingAutomations({
        appointmentId: appointment.id,
        eventTypeSlug: service_slug || null,
        serviceCategory: service_category || 'other',
        patientId: patient_id || null,
        patientName: patient_name,
        patientEmail,
        patientPhone: patient_phone || null,
        serviceName: service_name,
        startTime: start_time,
      }).catch(err => console.error('Booking automations error:', err));
    }

    return res.status(200).json({ appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
