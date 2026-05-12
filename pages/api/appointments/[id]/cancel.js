// PUT /api/appointments/[id]/cancel
// Cancel an appointment with reason

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendProviderNotification } from '../../../../lib/provider-notifications';
import { logAction } from '../../../../lib/auth';
import { logComm } from '../../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../../lib/send-sms';
import { generateBookingCancellationHtml } from '../../../../lib/appointment-emails';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // (calcom_bookings updates removed at end of Cal.com cutover — the
    // crons and other readers now query the appointments table directly.)

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

    // Send patient cancellation SMS + email (fire-and-forget)
    if (appointment.patient_id) {
      (async () => {
        const { data: patient } = await supabase
          .from('patients')
          .select('name, phone, email')
          .eq('id', appointment.patient_id)
          .single();
        if (!patient) return;

        const firstName = (patient.name || 'there').split(' ')[0];
        const apptDate = new Date(appointment.start_time).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric',
          timeZone: 'America/Los_Angeles',
        });
        const apptTime = new Date(appointment.start_time).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit',
          timeZone: 'America/Los_Angeles',
        });

        const phone = normalizePhone(patient.phone);
        if (phone) {
          const message = `Hi ${firstName}, your ${appointment.service_name} appointment on ${apptDate} has been cancelled. Please call (949) 997-3988 to reschedule.`;
          const smsResult = await sendSMS({ to: phone, message, skipEmailCopy: true });
          await logComm({
            channel: 'sms',
            messageType: 'appointment_cancellation',
            message,
            source: 'appointments/cancel',
            patientId: appointment.patient_id,
            patientName: patient.name,
            recipient: phone,
            status: smsResult.success ? 'sent' : 'error',
            errorMessage: smsResult.success ? null : smsResult.error,
            direction: 'outbound',
          });
        }

        if (patient.email) {
          const emailSubject = 'Appointment Cancelled — Range Medical';
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
            source: 'appointments/cancel',
            patientId: appointment.patient_id,
            patientName: patient.name,
            recipient: patient.email,
            subject: emailSubject,
            status: 'sent',
            direction: 'outbound',
            htmlBody: emailHtml,
          });
        }
      })().catch(err => console.error('Patient cancel notification error:', err));
    }

    return res.status(200).json({ appointment: updated });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
