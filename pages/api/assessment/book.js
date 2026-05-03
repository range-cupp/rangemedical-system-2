// /pages/api/assessment/book.js
// Creates a Cal.com booking for the assessment appointment + sends medical intake SMS
// Range Medical — Injury & Recovery Assessment

import { createClient } from '@supabase/supabase-js';
import { createBooking } from '../../../lib/calcom';
import { createFormBundle } from '../../../lib/form-bundles';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../lib/blooio-optin';
import { runPostBookingNotifications } from '../../../lib/assessment-post-booking';

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
      leadId,
      eventTypeId,
      start,
      patientName,
      patientEmail,
      patientPhone,
    } = req.body;

    if (!leadId || !eventTypeId || !start || !patientName || !patientEmail) {
      return res.status(400).json({ error: 'leadId, eventTypeId, start, patientName, and patientEmail are required' });
    }

    // Verify payment was completed
    const { data: lead, error: leadError } = await supabase
      .from('assessment_leads')
      .select('payment_status')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Assessment lead not found' });
    }

    if (lead.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment must be completed before booking' });
    }

    // Create booking in Cal.com
    const email = patientEmail || `${leadId}@booking.rangemedical.com`;
    const calResult = await createBooking({
      eventTypeId: parseInt(eventTypeId),
      start,
      name: patientName,
      email,
      phoneNumber: patientPhone || undefined,
      notes: 'Injury & Recovery Assessment — booked via website',
    });

    if (calResult.error) {
      console.error('Cal.com booking failed for assessment:', calResult);
      return res.status(500).json({
        error: 'Failed to create booking. Payment was successful — please call (949) 997-3988 to schedule.',
        details: calResult.error,
      });
    }

    console.log(`Assessment booking created: ${calResult.uid} for lead ${leadId}`);

    // Calculate end time and booking date
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 min
    const bookingDate = start.split('T')[0];

    // Look up patient ID by email for the booking record
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('email', patientEmail.toLowerCase().trim())
      .maybeSingle();

    const patientId = patient?.id || null;

    // Store in calcom_bookings table
    const { error: dbError } = await supabase
      .from('calcom_bookings')
      .insert({
        calcom_booking_id: calResult.id,
        calcom_uid: calResult.uid,
        patient_id: patientId,
        patient_name: patientName,
        patient_email: email,
        patient_phone: patientPhone || null,
        service_name: 'Range Assessment',
        service_slug: 'assessment',
        calcom_event_type_id: parseInt(eventTypeId),
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        booking_date: bookingDate,
        duration_minutes: 30,
        status: 'scheduled',
        notes: 'Injury & Recovery Assessment',
        booked_by: 'patient',
      });

    if (dbError) {
      console.error('Assessment booking DB insert error:', dbError);
      // Non-blocking — booking was created in Cal.com
    }

    // Update assessment_leads with booking info AND with the verified contact
    // info from this booking call (overrides any earlier autofill noise).
    const verifiedFirst = (patientName.trim().split(/\s+/)[0] || '').trim();
    const verifiedLast = patientName.trim().split(/\s+/).slice(1).join(' ').trim();
    const verifiedEmail = patientEmail.toLowerCase().trim();
    await supabase
      .from('assessment_leads')
      .update({
        calcom_booking_uid: calResult.uid,
        booking_start_time: startDate.toISOString(),
        first_name: verifiedFirst || undefined,
        last_name: verifiedLast || undefined,
        email: verifiedEmail || undefined,
        phone: patientPhone || undefined,
      })
      .eq('id', leadId);

    // Fire intake email + Damon's task + pipeline insert. Idempotent — guarded
    // by post_booking_notified_at on the lead row. Wrapped so a notification
    // failure never breaks the booking response.
    runPostBookingNotifications({
      supabase,
      leadId,
      patientId,
      verified: {
        firstName: verifiedFirst,
        lastName: verifiedLast,
        email: verifiedEmail,
        phone: patientPhone || '',
      },
    }).catch((err) => console.error('[book] post-booking notifications failed:', err.message));

    // --- Send medical intake form via SMS ---
    // AUTO FORM-SEND DISABLED — staff send forms manually from the patient profile.
    const AUTO_SEND_FORMS_ON_BOOKING = false;
    let intakeSmsResult = null;
    const normalizedPhone = patientPhone ? normalizePhone(patientPhone) : null;

    if (AUTO_SEND_FORMS_ON_BOOKING && normalizedPhone) {
      try {
        // Create form bundle with intake form
        const bundle = await createFormBundle({
          formIds: ['intake'],
          patientId,
          patientName,
          patientEmail: email,
          patientPhone: normalizedPhone,
        });

        // Format booking time for SMS
        const bookingTime = startDate.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/Los_Angeles',
        });

        const firstName = patientName.split(' ')[0];
        const messageBody = `Hi ${firstName}! Range Medical here. Your assessment is booked for ${bookingTime} PT. Please complete your medical intake form before your visit:\n\n${bundle.url}`;

        // Handle Blooio two-step opt-in if needed
        if (isBlooioProvider()) {
          const optedIn = await hasBlooioOptIn(normalizedPhone);

          if (!optedIn) {
            // Send link-free opt-in message first
            const optInMessage = `Hi ${firstName}! Range Medical here. Your assessment is booked for ${bookingTime} PT. We have your medical intake form ready — reply YES to receive it.`;

            const optInResult = await sendSMS({ to: normalizedPhone, message: optInMessage });

            if (optInResult.success) {
              await logComm({
                channel: 'sms',
                messageType: 'blooio_optin_request',
                message: optInMessage,
                source: 'assessment-book',
                patientId,
                patientName,
                recipient: normalizedPhone,
                twilioMessageSid: optInResult.messageSid,
                direction: 'outbound',
                provider: optInResult.provider || null,
              });

              // Queue the link message
              await queuePendingLinkMessage({
                phone: normalizedPhone,
                message: messageBody,
                messageType: 'form_links',
                patientId,
                patientName,
              });
            }

            intakeSmsResult = { sent: true, twoStep: true };

            // Update assessment_leads
            await supabase
              .from('assessment_leads')
              .update({
                intake_sms_sent: true,
                intake_sms_sent_at: new Date().toISOString(),
                intake_bundle_token: bundle.token,
              })
              .eq('id', leadId);

            console.log(`Assessment intake opt-in SMS sent to ${normalizedPhone} for lead ${leadId}`);

            return res.status(200).json({
              success: true,
              booking: { uid: calResult.uid, start: startDate.toISOString() },
              intakeSms: intakeSmsResult,
            });
          }
        }

        // Direct send (Twilio or patient already opted in for Blooio)
        const smsResult = await sendSMS({ to: normalizedPhone, message: messageBody });

        if (smsResult.success) {
          await logComm({
            channel: 'sms',
            messageType: 'assessment_intake_link',
            message: messageBody,
            source: 'assessment-book',
            patientId,
            patientName,
            recipient: normalizedPhone,
            twilioMessageSid: smsResult.messageSid,
            direction: 'outbound',
            provider: smsResult.provider || null,
          });

          intakeSmsResult = { sent: true, twoStep: false };
        } else {
          console.error('Assessment intake SMS failed:', smsResult.error);
          intakeSmsResult = { sent: false, error: smsResult.error };
        }

        // Update assessment_leads
        await supabase
          .from('assessment_leads')
          .update({
            intake_sms_sent: true,
            intake_sms_sent_at: new Date().toISOString(),
            intake_bundle_token: bundle.token,
          })
          .eq('id', leadId);

        console.log(`Assessment intake SMS sent to ${normalizedPhone} for lead ${leadId}`);
      } catch (smsErr) {
        console.error('Assessment intake SMS error:', smsErr);
        intakeSmsResult = { sent: false, error: smsErr.message };
        // Non-blocking — booking was created successfully
      }
    } else {
      console.warn(`No valid phone for assessment intake SMS (lead ${leadId})`);
    }

    return res.status(200).json({
      success: true,
      booking: { uid: calResult.uid, start: startDate.toISOString() },
      intakeSms: intakeSmsResult,
    });
  } catch (error) {
    console.error('Assessment booking error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
