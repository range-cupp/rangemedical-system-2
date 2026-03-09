// /pages/api/cron/hrt-onboarding-emails.js
// Daily cron to progress HRT onboarding email + SMS sequence
// Sends next step in sequence based on days since onboarding_start_date
// Also handles recurring monthly IV and quarterly lab reminders
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  HRT_ONBOARDING_SEQUENCE,
  RECURRING_REMINDERS,
  getInjectionTrainingEmail,
  personalizeHRTEmail
} from '../../../lib/hrt-drip-emails';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { isInQuietHours } from '../../../lib/quiet-hours';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Verify cron authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const pacificDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const today = pacificDate.toISOString().split('T')[0];

    console.log('HRT Onboarding Emails - Checking active HRT protocols');

    // Fetch all active HRT protocols that have onboarding started
    const { data: protocols, error: protocolError } = await supabase
      .from('protocols')
      .select('*, patients(id, name, first_name, last_name, email, phone, ghl_contact_id)')
      .not('onboarding_start_date', 'is', null)
      .eq('status', 'active');

    if (protocolError) {
      console.error('Error fetching HRT protocols:', protocolError);
      return res.status(500).json({ error: protocolError.message });
    }

    // Filter to HRT protocols only (in case other types somehow have onboarding_start_date)
    const hrtProtocols = (protocols || []).filter(p =>
      p.program_type && (p.program_type.toLowerCase().includes('hrt'))
    );

    console.log(`Found ${hrtProtocols.length} active HRT protocols with onboarding started`);

    const results = [];

    for (const protocol of hrtProtocols) {
      const patient = protocol.patients;
      if (!patient?.email) {
        continue;
      }

      // Calculate days since onboarding started
      const startDate = new Date(protocol.onboarding_start_date + 'T12:00:00');
      const daysSinceStart = Math.floor((pacificDate - startDate) / (1000 * 60 * 60 * 24));

      // Fetch all onboarding logs for this protocol
      const { data: sentLogs, error: logsError } = await supabase
        .from('protocol_logs')
        .select('id, notes, log_date')
        .eq('protocol_id', protocol.id)
        .eq('log_type', 'hrt_onboarding')
        .order('log_date', { ascending: true });

      if (logsError) {
        console.error(`Error fetching onboarding logs for protocol ${protocol.id}:`, logsError);
        continue;
      }

      const sentStepIds = new Set();
      (sentLogs || []).forEach(log => {
        // Extract stepId from notes: "HRT onboarding step: welcome (Day 0)"
        const match = log.notes?.match(/HRT onboarding step: (\w+)/);
        if (match) {
          sentStepIds.add(match[1]);
        }
        // Also match recurring types
        const recurMatch = log.notes?.match(/HRT recurring: (\w+_\w+)/);
        if (recurMatch) {
          // Track with date for recurring dedup
        }
      });

      // Check which sequence steps to send (max 1 per day)
      let sentThisRun = false;

      for (const step of HRT_ONBOARDING_SEQUENCE) {
        if (sentThisRun) break; // Max 1 email per cron run per protocol
        if (sentStepIds.has(step.stepId)) continue; // Already sent
        if (daysSinceStart < step.day) continue; // Not time yet

        // Don't send if already sent today (check log_date)
        const sentToday = (sentLogs || []).some(log => log.log_date === today);
        if (sentToday) break;

        // Determine email content
        let emailSubject = step.subject;
        let emailHtml = step.html;

        // Handle conditional Day 1 branching
        if (step.conditional) {
          const training = getInjectionTrainingEmail(protocol);
          emailSubject = training.subject;
          emailHtml = training.html;
        }

        // Personalize
        const personalizedHtml = personalizeHRTEmail(emailHtml, protocol, patient);
        const personalizedSubject = personalizeHRTEmail(emailSubject, protocol, patient);

        // Send email
        console.log(`Sending HRT onboarding [${step.stepId}] to ${patient.email} (${patient.name})`);

        const { error: sendError } = await resend.emails.send({
          from: 'Range Medical <noreply@range-medical.com>',
          replyTo: 'info@range-medical.com',
          to: patient.email,
          subject: personalizedSubject,
          html: personalizedHtml
        });

        if (sendError) {
          console.error(`Error sending HRT onboarding [${step.stepId}] to ${patient.email}:`, sendError);
          await logComm({
            channel: 'email',
            messageType: `hrt_onboarding_${step.stepId}`,
            message: `HRT onboarding ${step.stepId}: ${emailSubject}`,
            source: 'hrt-onboarding-emails',
            patientId: protocol.patient_id,
            protocolId: protocol.id,
            patientName: patient.name,
            recipient: patient.email,
            subject: personalizedSubject,
            status: 'error',
            errorMessage: sendError.message
          });
          results.push({ protocol_id: protocol.id, patient: patient.name, step: step.stepId, error: sendError.message });
          continue;
        }

        // Log email
        await logComm({
          channel: 'email',
          messageType: `hrt_onboarding_${step.stepId}`,
          message: `HRT onboarding ${step.stepId}: ${emailSubject}`,
          source: 'hrt-onboarding-emails',
          patientId: protocol.patient_id,
          protocolId: protocol.id,
          ghlContactId: patient.ghl_contact_id,
          patientName: patient.name,
          recipient: patient.email,
          subject: personalizedSubject
        });

        // Send SMS (if patient has phone and not in quiet hours)
        if (patient.phone && step.smsText && !isInQuietHours()) {
          const phone = normalizePhone(patient.phone);
          if (phone) {
            const smsMessage = personalizeHRTEmail(step.smsText, protocol, patient);
            const smsResult = await sendSMS({ to: phone, message: smsMessage });

            await logComm({
              channel: 'sms',
              messageType: `hrt_onboarding_${step.stepId}`,
              message: smsMessage,
              source: 'hrt-onboarding-emails',
              patientId: protocol.patient_id,
              protocolId: protocol.id,
              ghlContactId: patient.ghl_contact_id,
              patientName: patient.name,
              recipient: phone,
              status: smsResult.success ? 'sent' : 'error',
              errorMessage: smsResult.success ? null : smsResult.error,
              provider: smsResult.provider,
              twilioMessageSid: smsResult.messageSid
            });
          }
        }

        // Log to protocol_logs
        await supabase.from('protocol_logs').insert({
          protocol_id: protocol.id,
          patient_id: protocol.patient_id,
          log_type: 'hrt_onboarding',
          log_date: today,
          notes: `HRT onboarding step: ${step.stepId} (Day ${step.day})`
        });

        results.push({
          protocol_id: protocol.id,
          patient: patient.name,
          email: patient.email,
          step: step.stepId,
          day: step.day,
          sent: true
        });

        sentThisRun = true;
      }

      // Handle recurring reminders (only if initial sequence is complete)
      if (!sentThisRun && sentStepIds.has('book_labs')) {
        for (const reminder of RECURRING_REMINDERS) {
          if (sentThisRun) break;
          if (daysSinceStart < reminder.startAfterDay) continue;

          // Check if it's time for this reminder
          // Calculate: days since startAfterDay, check if a new interval has passed
          const daysPastStart = daysSinceStart - reminder.startAfterDay;
          const intervalNumber = Math.floor(daysPastStart / reminder.intervalDays);

          // Check if we already sent this interval's reminder
          const reminderLogKey = `HRT recurring: ${reminder.type} #${intervalNumber + 1}`;
          const alreadySent = (sentLogs || []).some(log => log.notes === reminderLogKey);
          if (alreadySent) continue;

          // Check if this interval just became due (within the last day)
          const daysIntoInterval = daysPastStart % reminder.intervalDays;
          if (daysIntoInterval > 1) continue; // Only send on the day it's due

          // Don't send if already sent today
          const sentToday = (sentLogs || []).some(log => log.log_date === today);
          if (sentToday) break;

          // Send recurring email
          const personalizedHtml = personalizeHRTEmail(reminder.html, protocol, patient);
          const personalizedSubject = personalizeHRTEmail(reminder.subject, protocol, patient);

          console.log(`Sending HRT recurring [${reminder.type}] to ${patient.email} (${patient.name})`);

          const { error: sendError } = await resend.emails.send({
            from: 'Range Medical <noreply@range-medical.com>',
            replyTo: 'info@range-medical.com',
            to: patient.email,
            subject: personalizedSubject,
            html: personalizedHtml
          });

          if (sendError) {
            console.error(`Error sending recurring ${reminder.type} to ${patient.email}:`, sendError);
            results.push({ protocol_id: protocol.id, patient: patient.name, step: reminder.type, error: sendError.message });
            continue;
          }

          // Log email
          await logComm({
            channel: 'email',
            messageType: `hrt_recurring_${reminder.type}`,
            message: `HRT recurring ${reminder.type}: ${reminder.subject}`,
            source: 'hrt-onboarding-emails',
            patientId: protocol.patient_id,
            protocolId: protocol.id,
            ghlContactId: patient.ghl_contact_id,
            patientName: patient.name,
            recipient: patient.email,
            subject: personalizedSubject
          });

          // Send SMS
          if (patient.phone && reminder.smsText && !isInQuietHours()) {
            const phone = normalizePhone(patient.phone);
            if (phone) {
              const smsMessage = personalizeHRTEmail(reminder.smsText, protocol, patient);
              const smsResult = await sendSMS({ to: phone, message: smsMessage });

              await logComm({
                channel: 'sms',
                messageType: `hrt_recurring_${reminder.type}`,
                message: smsMessage,
                source: 'hrt-onboarding-emails',
                patientId: protocol.patient_id,
                protocolId: protocol.id,
                ghlContactId: patient.ghl_contact_id,
                patientName: patient.name,
                recipient: phone,
                status: smsResult.success ? 'sent' : 'error',
                errorMessage: smsResult.success ? null : smsResult.error,
                provider: smsResult.provider,
                twilioMessageSid: smsResult.messageSid
              });
            }
          }

          // Log to protocol_logs with specific key for dedup
          await supabase.from('protocol_logs').insert({
            protocol_id: protocol.id,
            patient_id: protocol.patient_id,
            log_type: 'hrt_onboarding',
            log_date: today,
            notes: reminderLogKey
          });

          results.push({
            protocol_id: protocol.id,
            patient: patient.name,
            email: patient.email,
            step: reminder.type,
            recurring: true,
            sent: true
          });

          sentThisRun = true;
        }
      }
    }

    const sentCount = results.filter(r => r.sent).length;
    console.log(`HRT Onboarding Emails complete: ${sentCount} emails sent`);

    return res.status(200).json({
      success: true,
      date: today,
      protocolsChecked: hrtProtocols.length,
      emailsSent: sentCount,
      results
    });

  } catch (error) {
    console.error('HRT onboarding emails cron error:', error);
    return res.status(500).json({ error: error.message });
  }
}
