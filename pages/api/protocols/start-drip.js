// /pages/api/protocols/start-drip.js
// Manually trigger weight loss drip email sequence for a protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { WL_DRIP_EMAILS, personalizeEmail } from '../../../lib/wl-drip-emails';

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
      .select('id, patient_id, program_type, created_at, patients(id, name, first_name, last_name, email)')
      .eq('id', protocolId)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    if (protocol.program_type !== 'weight_loss') {
      return res.status(400).json({ error: 'Drip emails are only for weight loss protocols' });
    }

    const patient = protocol.patients;
    if (!patient?.email) {
      return res.status(400).json({ error: 'Patient has no email address on file' });
    }

    // Check if any drip emails have already been sent for this protocol
    const { data: existingLogs } = await supabase
      .from('protocol_logs')
      .select('id, notes')
      .eq('protocol_id', protocolId)
      .eq('log_type', 'drip_email');

    if (existingLogs && existingLogs.length > 0) {
      return res.status(400).json({ error: 'Email sequence already started', emailsSent: existingLogs.length });
    }

    // Check if this patient already received drip emails from any previous WL protocol
    const { data: previousDrips } = await supabase
      .from('protocol_logs')
      .select('id')
      .eq('patient_id', protocol.patient_id)
      .eq('log_type', 'drip_email')
      .limit(1);

    if (previousDrips && previousDrips.length > 0) {
      return res.status(400).json({ error: 'Patient already received drip emails from a previous weight loss protocol' });
    }

    // Send Email 1 immediately
    const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : null);
    const emailTemplate = WL_DRIP_EMAILS[0];
    const personalizedHtml = personalizeEmail(emailTemplate.html, firstName);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      replyTo: 'info@range-medical.com',
      to: patient.email,
      subject: emailTemplate.subject,
      html: personalizedHtml
    });

    if (sendError) {
      console.error('Drip email send error:', sendError);
      return res.status(500).json({ error: 'Failed to send email: ' + sendError.message });
    }

    // Log it so the cron picks up emails 2-4
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('protocol_logs').insert({
      protocol_id: protocolId,
      patient_id: protocol.patient_id,
      log_type: 'drip_email',
      log_date: today,
      notes: `Drip email 1: ${emailTemplate.subject}`
    });

    // Update protocol created_at to today so the cron sends emails 2-4 on the right schedule
    await supabase
      .from('protocols')
      .update({ drip_start_date: today })
      .eq('id', protocolId);

    console.log(`Manual drip started for protocol ${protocolId} - Email 1 sent to ${patient.email}`);

    return res.status(200).json({
      success: true,
      message: `Email 1 sent to ${patient.email}. Emails 2-4 will send over the next 3 days.`,
      email: patient.email,
      patientName: patient.name
    });

  } catch (error) {
    console.error('Start drip error:', error);
    return res.status(500).json({ error: error.message });
  }
}
