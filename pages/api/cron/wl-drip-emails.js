// /pages/api/cron/wl-drip-emails.js
// Daily cron to send weight loss drip email sequence
// Sends 4 emails over 4 days to new weight loss patients via Resend
// Also continues sequences started manually via start-drip endpoint
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { WL_DRIP_EMAILS, personalizeEmail } from '../../../lib/wl-drip-emails';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    console.log('WL drip emails cron called without secret');
  }

  try {
    const now = new Date();
    const pacificDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const today = pacificDate.toISOString().split('T')[0];

    console.log('WL Drip Emails - Checking active weight loss protocols');

    // Fetch ALL active weight loss protocols (not just recent ones)
    // The cron handles both new protocols and manually-started drip sequences
    const { data: protocols, error: protocolError } = await supabase
      .from('protocols')
      .select('id, patient_id, program_type, created_at, patients(id, name, first_name, last_name, email)')
      .eq('program_type', 'weight_loss')
      .eq('status', 'active');

    if (protocolError) {
      console.error('Error fetching protocols:', protocolError);
      return res.status(500).json({ error: protocolError.message });
    }

    console.log(`Found ${protocols?.length || 0} active WL protocols`);

    const results = [];

    for (const protocol of protocols || []) {
      const patient = protocol.patients;
      if (!patient?.email) {
        continue;
      }

      // Check drip emails already sent for this protocol
      const { data: sentLogs, error: logsError } = await supabase
        .from('protocol_logs')
        .select('id, notes, log_date')
        .eq('protocol_id', protocol.id)
        .eq('log_type', 'drip_email')
        .order('log_date', { ascending: true });

      if (logsError) {
        console.error(`Error fetching drip logs for protocol ${protocol.id}:`, logsError);
        continue;
      }

      const emailsSent = sentLogs?.length || 0;

      // All 4 emails already sent — done
      if (emailsSent >= 4) {
        continue;
      }

      // No emails sent yet — only auto-start for protocols created in the last 2 days
      // Older protocols need the admin to manually click "Start Email Sequence"
      if (emailsSent === 0) {
        const createdDate = new Date(protocol.created_at);
        const createdPacific = new Date(createdDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
        const daysSinceCreation = Math.floor((pacificDate - createdPacific) / (1000 * 60 * 60 * 24));

        if (daysSinceCreation > 2) {
          continue; // Too old for auto-start, needs manual trigger
        }

        // New protocol — send Email 1
        const emailTemplate = WL_DRIP_EMAILS[0];
        const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : null);
        const personalizedHtml = personalizeEmail(emailTemplate.html, firstName);

        console.log(`Sending email 1 to ${patient.email} (${patient.name}) - new protocol`);

        const { error: sendError } = await resend.emails.send({
          from: 'Range Medical <noreply@range-medical.com>',
          replyTo: 'info@range-medical.com',
          to: patient.email,
          subject: emailTemplate.subject,
          html: personalizedHtml
        });

        if (sendError) {
          console.error(`Error sending email 1 to ${patient.email}:`, sendError);
          await logComm({ channel: 'email', messageType: 'drip_email_1', message: `Drip email 1: ${emailTemplate.subject}`, source: 'wl-drip-emails', patientId: protocol.patient_id, protocolId: protocol.id, patientName: patient.name, recipient: patient.email, subject: emailTemplate.subject, status: 'error', errorMessage: sendError.message });
          results.push({ protocol_id: protocol.id, patient: patient.name, email_number: 1, error: sendError.message });
          continue;
        }

        await supabase.from('protocol_logs').insert({
          protocol_id: protocol.id,
          patient_id: protocol.patient_id,
          log_type: 'drip_email',
          log_date: today,
          notes: `Drip email 1: ${emailTemplate.subject}`
        });

        await logComm({ channel: 'email', messageType: 'drip_email_1', message: `Drip email 1: ${emailTemplate.subject}`, source: 'wl-drip-emails', patientId: protocol.patient_id, protocolId: protocol.id, patientName: patient.name, recipient: patient.email, subject: emailTemplate.subject });

        results.push({ protocol_id: protocol.id, patient: patient.name, email: patient.email, email_number: 1, sent: true });
        continue;
      }

      // Emails 1-3 sent — send the next one if at least 1 day has passed since the last
      const lastSentDate = sentLogs[sentLogs.length - 1].log_date;
      const lastSentPacific = new Date(lastSentDate + 'T12:00:00');
      const daysSinceLastEmail = Math.floor((pacificDate - lastSentPacific) / (1000 * 60 * 60 * 24));

      if (daysSinceLastEmail < 1) {
        continue; // Wait at least 1 day between emails
      }

      // Send the next email in the sequence
      const nextEmailIndex = emailsSent;
      const emailTemplate = WL_DRIP_EMAILS[nextEmailIndex];

      if (!emailTemplate) {
        continue;
      }

      const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : null);
      const personalizedHtml = personalizeEmail(emailTemplate.html, firstName);

      console.log(`Sending email ${emailTemplate.emailNumber} to ${patient.email} (${patient.name})`);

      const { error: sendError } = await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        replyTo: 'info@range-medical.com',
        to: patient.email,
        subject: emailTemplate.subject,
        html: personalizedHtml
      });

      if (sendError) {
        console.error(`Error sending email ${emailTemplate.emailNumber} to ${patient.email}:`, sendError);
        await logComm({ channel: 'email', messageType: `drip_email_${emailTemplate.emailNumber}`, message: `Drip email ${emailTemplate.emailNumber}: ${emailTemplate.subject}`, source: 'wl-drip-emails', patientId: protocol.patient_id, protocolId: protocol.id, patientName: patient.name, recipient: patient.email, subject: emailTemplate.subject, status: 'error', errorMessage: sendError.message });
        results.push({ protocol_id: protocol.id, patient: patient.name, email_number: emailTemplate.emailNumber, error: sendError.message });
        continue;
      }

      await supabase.from('protocol_logs').insert({
        protocol_id: protocol.id,
        patient_id: protocol.patient_id,
        log_type: 'drip_email',
        log_date: today,
        notes: `Drip email ${emailTemplate.emailNumber}: ${emailTemplate.subject}`
      });

      await logComm({ channel: 'email', messageType: `drip_email_${emailTemplate.emailNumber}`, message: `Drip email ${emailTemplate.emailNumber}: ${emailTemplate.subject}`, source: 'wl-drip-emails', patientId: protocol.patient_id, protocolId: protocol.id, patientName: patient.name, recipient: patient.email, subject: emailTemplate.subject });

      console.log(`Sent email ${emailTemplate.emailNumber} to ${patient.name} (${patient.email})`);

      results.push({
        protocol_id: protocol.id,
        patient: patient.name,
        email: patient.email,
        email_number: emailTemplate.emailNumber,
        subject: emailTemplate.subject,
        sent: true
      });
    }

    const sentCount = results.filter(r => r.sent).length;
    console.log(`WL Drip Emails complete: ${sentCount} emails sent`);

    return res.status(200).json({
      success: true,
      date: today,
      protocolsChecked: protocols?.length || 0,
      emailsSent: sentCount,
      results
    });

  } catch (error) {
    console.error('WL drip emails cron error:', error);
    return res.status(500).json({ error: error.message });
  }
}
