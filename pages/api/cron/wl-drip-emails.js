// /pages/api/cron/wl-drip-emails.js
// Daily cron to send weight loss drip email sequence
// Sends 4 emails over 4 days to new weight loss patients via Resend
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { WL_DRIP_EMAILS, personalizeEmail } from '../../../lib/wl-drip-emails';

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

    // Find active weight loss protocols created in the last 5 days
    const fiveDaysAgo = new Date(pacificDate);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const cutoffDate = fiveDaysAgo.toISOString().split('T')[0];

    console.log(`WL Drip Emails - Checking protocols created since ${cutoffDate}`);

    const { data: protocols, error: protocolError } = await supabase
      .from('protocols')
      .select('id, patient_id, program_type, created_at, patients(id, name, first_name, last_name, email)')
      .eq('program_type', 'weight_loss')
      .eq('status', 'active')
      .gte('created_at', cutoffDate + 'T00:00:00');

    if (protocolError) {
      console.error('Error fetching protocols:', protocolError);
      return res.status(500).json({ error: protocolError.message });
    }

    console.log(`Found ${protocols?.length || 0} active WL protocols in range`);

    const results = [];

    for (const protocol of protocols || []) {
      const patient = protocol.patients;
      if (!patient?.email) {
        console.log(`Skipping protocol ${protocol.id} - no patient email`);
        results.push({ protocol_id: protocol.id, skipped: true, reason: 'no_email' });
        continue;
      }

      // Check how many drip emails have already been sent
      const { data: sentLogs, error: logsError } = await supabase
        .from('protocol_logs')
        .select('id, notes')
        .eq('protocol_id', protocol.id)
        .eq('log_type', 'drip_email')
        .order('log_date', { ascending: true });

      if (logsError) {
        console.error(`Error fetching drip logs for protocol ${protocol.id}:`, logsError);
        continue;
      }

      const emailsSent = sentLogs?.length || 0;

      // All 4 emails already sent
      if (emailsSent >= 4) {
        continue;
      }

      // Calculate days since protocol creation
      const createdDate = new Date(protocol.created_at);
      const createdPacific = new Date(createdDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      const daysSinceCreation = Math.floor((pacificDate - createdPacific) / (1000 * 60 * 60 * 24));

      // Determine which email to send next
      const nextEmailIndex = emailsSent; // 0-indexed
      const emailTemplate = WL_DRIP_EMAILS[nextEmailIndex];

      if (!emailTemplate) {
        continue;
      }

      // Only send if enough days have passed
      // Email 1 (index 0) sends on day 0, Email 2 on day 1, etc.
      if (daysSinceCreation < emailTemplate.day) {
        console.log(`Protocol ${protocol.id}: Day ${daysSinceCreation}, waiting for day ${emailTemplate.day} to send email ${emailTemplate.emailNumber}`);
        continue;
      }

      // Get patient first name for personalization
      const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : null);

      // Personalize the email HTML
      const personalizedHtml = personalizeEmail(emailTemplate.html, firstName);

      // Send via Resend
      console.log(`Sending email ${emailTemplate.emailNumber} to ${patient.email} (${patient.name})`);

      const { error: sendError } = await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: patient.email,
        subject: emailTemplate.subject,
        html: personalizedHtml
      });

      if (sendError) {
        console.error(`Error sending email ${emailTemplate.emailNumber} to ${patient.email}:`, sendError);
        results.push({
          protocol_id: protocol.id,
          patient: patient.name,
          email_number: emailTemplate.emailNumber,
          error: sendError.message
        });
        continue;
      }

      // Log the sent email in protocol_logs
      const { error: logError } = await supabase
        .from('protocol_logs')
        .insert({
          protocol_id: protocol.id,
          patient_id: protocol.patient_id,
          log_type: 'drip_email',
          log_date: today,
          notes: `Drip email ${emailTemplate.emailNumber}: ${emailTemplate.subject}`
        });

      if (logError) {
        console.error('Error logging drip email:', logError);
      }

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
