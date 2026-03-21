// POST /api/appointments/create
// Creates a new appointment, logs the event, and sends patient notification
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendAppointmentNotification } from '../../../lib/appointment-notifications';
import { sendProviderNotification } from '../../../lib/provider-notifications';
import { logAction } from '../../../lib/auth';

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
      send_notification = true,
      cal_com_booking_id,
      services, // array of { name, category, duration } for multi-service appointments
    } = req.body;

    if (!patient_name || !service_name || !start_time || !end_time || !duration_minutes) {
      return res.status(400).json({ error: 'patient_name, service_name, start_time, end_time, and duration_minutes are required' });
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

    return res.status(200).json({ appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
