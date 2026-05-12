// /pages/api/bookings/cancel.js
// Cancels an appointment (used by BookingTab). The `bookingId` it sends
// is now an appointments.id UUID — bookings/list returns that field as
// `id` post-cutover. Updates only the appointments table; no Cal.com,
// no calcom_bookings (those are historical-only now).

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendProviderNotification } from '../../../lib/provider-notifications';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { generateBookingCancellationHtml } from '../../../lib/appointment-emails';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookingId, reason } = req.body;
  if (!bookingId) {
    return res.status(400).json({ error: 'bookingId is required' });
  }

  try {
    const { data: appt, error: apptErr } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', cancellation_reason: reason || null })
      .eq('id', bookingId)
      .not('status', 'in', '(completed,cancelled,rescheduled)')
      .select()
      .maybeSingle();
    if (apptErr) {
      console.error('appointments cancel error:', apptErr);
      return res.status(500).json({ error: 'Failed to cancel appointment', details: apptErr.message });
    }
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found or not cancellable' });
    }

    await supabase.from('appointment_events').insert({
      appointment_id: appt.id,
      event_type: 'cancelled',
      old_status: 'scheduled',
      new_status: 'cancelled',
      metadata: { source: 'bookings_cancel', cancellation_reason: reason || null },
    });

    if (appt.provider) {
      sendProviderNotification({
        type: 'cancelled',
        provider: appt.provider,
        appointment: {
          patientName: appt.patient_name,
          serviceName: appt.service_name,
          startTime: appt.start_time,
        },
      }).catch(err => console.error('Provider SMS cancel failed:', err));
    }

    // Send patient cancellation SMS + email (fire-and-forget)
    if (appt.patient_id) {
      (async () => {
        const { data: patient } = await supabase
          .from('patients')
          .select('name, phone, email')
          .eq('id', appt.patient_id)
          .single();
        if (!patient) return;

        const firstName = (patient.name || 'there').split(' ')[0];
        const apptDate = new Date(appt.start_time).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric',
          timeZone: 'America/Los_Angeles',
        });
        const apptTime = new Date(appt.start_time).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit',
          timeZone: 'America/Los_Angeles',
        });

        const phone = normalizePhone(patient.phone);
        if (phone) {
          const message = `Hi ${firstName}, your ${appt.service_name} appointment on ${apptDate} has been cancelled. Please call (949) 997-3988 to reschedule.`;
          const smsResult = await sendSMS({ to: phone, message, skipEmailCopy: true });
          await logComm({
            channel: 'sms',
            messageType: 'appointment_cancellation',
            message,
            source: 'bookings/cancel',
            patientId: appt.patient_id,
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
            serviceName: appt.service_name,
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
            source: 'bookings/cancel',
            patientId: appt.patient_id,
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

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled',
      appointment_id: appt.id,
    });
  } catch (error) {
    console.error('Cancel booking API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
