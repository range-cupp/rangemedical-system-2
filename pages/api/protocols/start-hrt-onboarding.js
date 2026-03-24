// /pages/api/protocols/start-hrt-onboarding.js
// Manually trigger HRT onboarding email + SMS sequence for a protocol
// Sends Day 0 welcome email + SMS, sets onboarding_start_date
// Range Medical

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { HRT_ONBOARDING_SEQUENCE, personalizeHRTEmail } from '../../../lib/hrt-drip-emails';
import { isHRTType } from '../../../lib/protocol-config';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { isInQuietHours } from '../../../lib/quiet-hours';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { protocolId } = req.body;

    if (!protocolId) {
      return res.status(400).json({ error: 'Protocol ID required' });
    }

    // Fetch protocol with patient info
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*, patients(id, name, first_name, last_name, email, phone, ghl_contact_id)')
      .eq('id', protocolId)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Validate: must be HRT
    if (!isHRTType(protocol.program_type)) {
      return res.status(400).json({ error: 'HRT onboarding is only for HRT protocols' });
    }

    // Validate: must be active
    if (protocol.status !== 'active') {
      return res.status(400).json({ error: 'Protocol must be active to start onboarding' });
    }

    const patient = protocol.patients;
    if (!patient?.email) {
      return res.status(400).json({ error: 'Patient has no email address on file' });
    }

    // Validate: if take-home, must have injection_method set
    if (protocol.delivery_method === 'take_home' && !protocol.injection_method) {
      return res.status(400).json({ error: 'Please set the injection method (IM or SubQ) in Edit before starting onboarding' });
    }

    // Prevent double-start
    if (protocol.onboarding_start_date) {
      return res.status(400).json({ error: 'Onboarding already started on ' + protocol.onboarding_start_date });
    }

    // Also check protocol_logs for existing entries
    const { data: existingLogs } = await supabase
      .from('protocol_logs')
      .select('id')
      .eq('protocol_id', protocolId)
      .eq('log_type', 'hrt_onboarding')
      .limit(1);

    if (existingLogs && existingLogs.length > 0) {
      return res.status(400).json({ error: 'Onboarding sequence already started for this protocol' });
    }

    // Send Day 0 welcome email
    const welcomeStep = HRT_ONBOARDING_SEQUENCE[0];
    const personalizedHtml = personalizeHRTEmail(welcomeStep.html, protocol, patient);
    const personalizedSubject = personalizeHRTEmail(welcomeStep.subject, protocol, patient);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      replyTo: 'info@range-medical.com',
      to: patient.email,
      subject: personalizedSubject,
      html: personalizedHtml
    });

    if (sendError) {
      console.error('HRT onboarding email send error:', sendError);
      await logComm({
        channel: 'email',
        messageType: 'hrt_onboarding_welcome',
        message: `HRT onboarding welcome: ${welcomeStep.subject}`,
        source: 'start-hrt-onboarding',
        patientId: protocol.patient_id,
        protocolId: protocol.id,
        patientName: patient.name,
        recipient: patient.email,
        subject: personalizedSubject,
        status: 'error',
        errorMessage: sendError.message
      });
      return res.status(500).json({ error: 'Failed to send email: ' + sendError.message });
    }

    // Log email to comms_log
    await logComm({
      channel: 'email',
      messageType: 'hrt_onboarding_welcome',
      message: `HRT onboarding welcome: ${welcomeStep.subject}`,
      source: 'start-hrt-onboarding',
      patientId: protocol.patient_id,
      protocolId: protocol.id,
      ghlContactId: patient.ghl_contact_id,
      patientName: patient.name,
      recipient: patient.email,
      subject: personalizedSubject
    });

    // Send Day 0 SMS (if patient has phone and not in quiet hours)
    let smsSent = false;
    if (patient.phone) {
      const phone = normalizePhone(patient.phone);
      if (phone) {
        if (isInQuietHours()) {
          // Queue for later via notification_queue
          await supabase.from('notification_queue').insert({
            patient_id: protocol.patient_id,
            protocol_id: protocol.id,
            channel: 'sms',
            message: personalizeHRTEmail(welcomeStep.smsText, protocol, patient),
            phone: phone,
            status: 'pending',
            source: 'start-hrt-onboarding'
          }).then(() => {}).catch(() => {});
          console.log(`HRT onboarding SMS queued for ${patient.name} (quiet hours)`);
        } else {
          const smsResult = await sendSMS({
            to: phone,
            message: personalizeHRTEmail(welcomeStep.smsText, protocol, patient)
          });

          if (smsResult.success) {
            smsSent = true;
            await logComm({
              channel: 'sms',
              messageType: 'hrt_onboarding_welcome',
              message: personalizeHRTEmail(welcomeStep.smsText, protocol, patient),
              source: 'start-hrt-onboarding',
              patientId: protocol.patient_id,
              protocolId: protocol.id,
              ghlContactId: patient.ghl_contact_id,
              patientName: patient.name,
              recipient: phone,
              provider: smsResult.provider,
              twilioMessageSid: smsResult.messageSid
            });
          } else {
            console.error(`HRT onboarding SMS failed for ${patient.name}:`, smsResult.error);
            await logComm({
              channel: 'sms',
              messageType: 'hrt_onboarding_welcome',
              message: personalizeHRTEmail(welcomeStep.smsText, protocol, patient),
              source: 'start-hrt-onboarding',
              patientId: protocol.patient_id,
              protocolId: protocol.id,
              patientName: patient.name,
              recipient: phone,
              status: 'error',
              errorMessage: smsResult.error
            });
          }
        }
      }
    }

    // Send immediate IV booking SMS (separate from welcome — direct booking nudge)
    if (patient.phone) {
      const phone = normalizePhone(patient.phone);
      if (phone && !isInQuietHours()) {
        const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');
        const ivBookingMsg = `Hey ${firstName}! Your HRT membership includes a monthly Range IV ($225 value) — and you're eligible right now. Want to book your first one? Call (949) 997-3988 or reply here!`;

        const ivSmsResult = await sendSMS({ to: phone, message: ivBookingMsg });
        await logComm({
          channel: 'sms',
          messageType: 'hrt_onboarding_iv_booking',
          message: ivBookingMsg,
          source: 'start-hrt-onboarding',
          patientId: protocol.patient_id,
          protocolId: protocol.id,
          ghlContactId: patient.ghl_contact_id,
          patientName: patient.name,
          recipient: phone,
          status: ivSmsResult.success ? 'sent' : 'error',
          errorMessage: ivSmsResult.success ? null : ivSmsResult.error,
          provider: ivSmsResult.provider,
          twilioMessageSid: ivSmsResult.messageSid
        });
      }
    }

    // Log to protocol_logs
    const today = todayPacific();
    await supabase.from('protocol_logs').insert({
      protocol_id: protocolId,
      patient_id: protocol.patient_id,
      log_type: 'hrt_onboarding',
      log_date: today,
      notes: `HRT onboarding step: welcome (Day 0)`
    });

    // Generate access_token for patient portal (if not already set)
    let accessToken = protocol.access_token;
    if (!accessToken) {
      accessToken = crypto.randomBytes(32).toString('hex');
    }

    // Set onboarding_start_date + access_token
    await supabase
      .from('protocols')
      .update({
        onboarding_start_date: today,
        access_token: accessToken,
        updated_at: new Date().toISOString()
      })
      .eq('id', protocolId);

    const portalUrl = `https://www.range-medical.com/hrt/${accessToken}`;
    console.log(`HRT onboarding started for protocol ${protocolId} - Welcome email sent to ${patient.email} - Portal: ${portalUrl}`);

    return res.status(200).json({
      success: true,
      message: `Welcome email sent to ${patient.email}. Onboarding sequence started.`,
      email: patient.email,
      smsSent,
      patientName: patient.name,
      onboardingStartDate: today,
      portalUrl
    });

  } catch (error) {
    console.error('Start HRT onboarding error:', error);
    return res.status(500).json({ error: error.message });
  }
}
