// /pages/api/assessment/energy-book.js
// Creates a Cal.com booking for the energy/optimization blood draw + sends medical intake SMS
// Range Medical — Energy & Optimization Assessment

import { createClient } from '@supabase/supabase-js';
import { createBooking } from '../../../lib/calcom';
import { createFormBundle } from '../../../lib/form-bundles';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../lib/blooio-optin';

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
      panelType,
    } = req.body;

    if (!leadId || !eventTypeId || !start || !patientName || !patientEmail) {
      return res.status(400).json({ error: 'leadId, eventTypeId, start, patientName, and patientEmail are required' });
    }

    const panelLabel = panelType === 'elite' ? 'Elite Lab Panel' : 'Essential Lab Panel';

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
      notes: `Blood Draw \u2014 ${panelLabel} \u2014 booked via website`,
    });

    if (calResult.error) {
      console.error('Cal.com booking failed for energy assessment:', calResult);
      return res.status(500).json({
        error: 'Failed to create booking. Payment was successful \u2014 please call (949) 997-3988 to schedule.',
        details: calResult.error,
      });
    }

    console.log(`Energy assessment booking created: ${calResult.uid} for lead ${leadId}`);

    // Calculate end time and booking date
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 min
    const bookingDate = start.split('T')[0];

    // Format booking time for messages
    const bookingTime = startDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });

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
        service_name: 'Blood Draw \u2014 Energy Assessment',
        service_slug: 'energy-assessment',
        calcom_event_type_id: parseInt(eventTypeId),
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        booking_date: bookingDate,
        duration_minutes: 30,
        status: 'scheduled',
        notes: `Blood Draw \u2014 ${panelLabel}`,
        booked_by: 'patient',
      });

    if (dbError) {
      console.error('Energy assessment booking DB insert error:', dbError);
      // Non-blocking — booking was created in Cal.com
    }

    // Update assessment_leads with booking info
    await supabase
      .from('assessment_leads')
      .update({
        calcom_booking_uid: calResult.uid,
        booking_start_time: startDate.toISOString(),
      })
      .eq('id', leadId);

    // --- Create task for Tara ---
    try {
      const { data: staffMembers } = await supabase
        .from('employees')
        .select('id, email')
        .eq('email', 'tara@range-medical.com')
        .eq('is_active', true);

      if (staffMembers && staffMembers.length > 0) {
        const taskTitle = `New Lab Booking: ${patientName} (${panelLabel})`;
        const taskDescription = `${patientName} booked a ${panelLabel} via the website.\nEmail: ${patientEmail}\nPhone: ${patientPhone || 'N/A'}\nAppointment: ${bookingTime} PT`;

        for (const staff of staffMembers) {
          await supabase.from('tasks').insert({
            title: taskTitle,
            description: taskDescription,
            assigned_to: staff.id,
            assigned_by: staff.id,
            patient_id: patientId,
            patient_name: patientName,
            priority: 'high',
            status: 'pending',
          });
        }
        console.log(`Task created for Tara for energy booking ${calResult.uid}`);
      } else {
        console.warn('No active staff found for Tara task assignment');
      }
    } catch (taskErr) {
      console.error('Task creation error for energy booking:', taskErr);
      // Non-blocking
    }

    // --- Send SMS notification to Chris ---
    try {
      const chrisMessage = `New online booking! ${patientName} just booked a ${panelLabel} via the website. Appointment: ${bookingTime} PT.`;
      const chrisResult = await sendSMS({ to: '+19496900339', message: chrisMessage });

      if (chrisResult.success) {
        await logComm({
          channel: 'sms',
          messageType: 'admin_booking_notification',
          message: chrisMessage,
          source: 'energy-book',
          recipient: '+19496900339',
          twilioMessageSid: chrisResult.messageSid,
          direction: 'outbound',
          provider: chrisResult.provider || null,
        });
        console.log(`Admin booking notification sent to Chris for lead ${leadId}`);
      } else {
        console.error('Admin booking notification SMS failed:', chrisResult.error);
      }
    } catch (notifyErr) {
      console.error('Admin notification error:', notifyErr);
      // Non-blocking
    }

    // --- Send medical intake form via SMS ---
    let intakeSmsResult = null;
    const normalizedPhone = patientPhone ? normalizePhone(patientPhone) : null;

    if (normalizedPhone) {
      try {
        // Create form bundle with intake form
        const bundle = await createFormBundle({
          formIds: ['intake'],
          patientId,
          patientName,
          patientEmail: email,
          patientPhone: normalizedPhone,
        });

        const firstName = patientName.split(' ')[0];
        const messageBody = `Hi ${firstName}! Range Medical here. Your blood draw is booked for ${bookingTime} PT. Please complete your medical intake form before your visit:\n\n${bundle.url}`;

        // Handle Blooio two-step opt-in if needed
        if (isBlooioProvider()) {
          const optedIn = await hasBlooioOptIn(normalizedPhone);

          if (!optedIn) {
            // Send link-free opt-in message first
            const optInMessage = `Hi ${firstName}! Range Medical here. Your blood draw is booked for ${bookingTime} PT. We have your medical intake form ready \u2014 reply YES to receive it.`;

            const optInResult = await sendSMS({ to: normalizedPhone, message: optInMessage });

            if (optInResult.success) {
              await logComm({
                channel: 'sms',
                messageType: 'blooio_optin_request',
                message: optInMessage,
                source: 'energy-book',
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

            console.log(`Energy intake opt-in SMS sent to ${normalizedPhone} for lead ${leadId}`);

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
            source: 'energy-book',
            patientId,
            patientName,
            recipient: normalizedPhone,
            twilioMessageSid: smsResult.messageSid,
            direction: 'outbound',
            provider: smsResult.provider || null,
          });

          intakeSmsResult = { sent: true, twoStep: false };
        } else {
          console.error('Energy intake SMS failed:', smsResult.error);
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

        console.log(`Energy intake SMS sent to ${normalizedPhone} for lead ${leadId}`);
      } catch (smsErr) {
        console.error('Energy intake SMS error:', smsErr);
        intakeSmsResult = { sent: false, error: smsErr.message };
        // Non-blocking — booking was created successfully
      }
    } else {
      console.warn(`No valid phone for energy intake SMS (lead ${leadId})`);
    }

    return res.status(200).json({
      success: true,
      booking: { uid: calResult.uid, start: startDate.toISOString() },
      intakeSms: intakeSmsResult,
    });
  } catch (error) {
    console.error('Energy assessment booking error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
