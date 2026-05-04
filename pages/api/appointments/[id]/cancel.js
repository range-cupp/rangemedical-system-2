// PUT /api/appointments/[id]/cancel
// Cancel an appointment with reason

import { createClient } from '@supabase/supabase-js';
import { sendProviderNotification } from '../../../../lib/provider-notifications';
import { logAction } from '../../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { cancellation_reason, cancelled_by } = req.body;

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

    if (['completed', 'cancelled', 'rescheduled'].includes(appointment.status)) {
      return res.status(400).json({ error: `Cannot cancel a ${appointment.status} appointment` });
    }

    // Update status
    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: cancellation_reason || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Cancel appointment error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // Cancel the linked calcom_bookings row so the reminder/lab-prep crons
    // (which still query calcom_bookings by booking_date + status='scheduled')
    // stop texting the patient. Two cases:
    //   1. Old Cal.com booking — match by cal_com_booking_id (numeric).
    //   2. New shadow row — match by calcom_uid='local-<appointment.id>'.
    {
      const updates = { status: 'cancelled', cancelled_at: new Date().toISOString() };
      if (appointment.cal_com_booking_id) {
        const calcomBookingIdInt = parseInt(appointment.cal_com_booking_id, 10);
        if (!Number.isNaN(calcomBookingIdInt)) {
          await supabase
            .from('calcom_bookings')
            .update(updates)
            .eq('calcom_booking_id', calcomBookingIdInt)
            .then(({ error: cbErr }) => {
              if (cbErr) console.error('calcom_bookings cancel (legacy) error:', cbErr);
            });
        }
      }
      // Always try the shadow row lookup — works for local-only bookings
      // and is a no-op when none exists.
      await supabase
        .from('calcom_bookings')
        .update(updates)
        .eq('calcom_uid', `local-${id}`)
        .then(({ error: cbErr }) => {
          if (cbErr) console.error('calcom_bookings cancel (shadow) error:', cbErr);
        });
    }

    // Log event
    await supabase.from('appointment_events').insert({
      appointment_id: id,
      event_type: 'cancelled',
      old_status: appointment.status,
      new_status: 'cancelled',
      metadata: { cancellation_reason: cancellation_reason || null, cancelled_by: cancelled_by || null },
    });

    // Audit log
    await logAction({
      employeeName: cancelled_by || 'Unknown',
      action: 'cancel_appointment',
      resourceType: 'appointment',
      resourceId: id,
      details: {
        patient_name: appointment.patient_name,
        service_name: appointment.service_name,
        cancellation_reason: cancellation_reason || null,
      },
      req,
    });

    // Send provider SMS for cancellation (fire-and-forget)
    if (appointment.provider) {
      sendProviderNotification({
        type: 'cancelled',
        provider: appointment.provider,
        appointment: {
          patientName: appointment.patient_name,
          serviceName: appointment.service_name,
          startTime: appointment.start_time,
        },
      }).catch(err => console.error('Provider SMS cancel failed:', err));
    }

    return res.status(200).json({ appointment: updated });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
