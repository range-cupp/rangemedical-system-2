// pages/api/questionnaire/trigger.js
// Generates a baseline questionnaire token and sends SMS to patient
// Called internally after intake form submission

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { intake_id } = req.body;

    if (!intake_id) {
      return res.status(400).json({ error: 'intake_id is required' });
    }

    // Fetch the intake record to determine door + patient info
    const { data: intake, error: intakeErr } = await supabase
      .from('intakes')
      .select('id, patient_id, first_name, last_name, phone, gender, injured, interested_in_optimization, symptoms')
      .eq('id', intake_id)
      .single();

    if (intakeErr || !intake) {
      console.error('Questionnaire trigger: intake not found', intakeErr);
      return res.status(404).json({ error: 'Intake not found' });
    }

    // Determine which door(s) to trigger
    const doors = [];
    if (intake.injured) doors.push(1);
    if (intake.interested_in_optimization) doors.push(2);

    if (doors.length === 0) {
      console.log('Questionnaire trigger: no door selected, skipping');
      return res.status(200).json({ success: true, message: 'No questionnaire needed — no door selected' });
    }

    if (!intake.phone) {
      console.warn('Questionnaire trigger: no phone number for intake', intake_id);
      return res.status(200).json({ success: true, message: 'No phone number — cannot send SMS' });
    }

    const normalizedPhone = normalizePhone(intake.phone);
    if (!normalizedPhone) {
      console.warn('Questionnaire trigger: invalid phone', intake.phone);
      return res.status(200).json({ success: true, message: 'Invalid phone number' });
    }

    const results = [];

    for (const door of doors) {
      const token = crypto.randomBytes(16).toString('hex');
      const questionnaire_type = door === 1 ? 'door1_baseline' : 'door2_baseline';

      // Create the questionnaire record
      const { data: qRecord, error: qErr } = await supabase
        .from('baseline_questionnaires')
        .insert({
          patient_id: intake.patient_id || null,
          intake_id: intake.id,
          door,
          questionnaire_type,
          token,
          status: 'in_progress',
          responses: {},
          scored_totals: {},
          sections_completed: [],
        })
        .select('id, token')
        .single();

      if (qErr) {
        console.error(`Questionnaire trigger: failed to create door ${door} record`, qErr);
        continue;
      }

      // Build the link
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://app.range-medical.com';
      const link = `${baseUrl}/questionnaire/${token}`;

      // Send SMS
      const firstName = intake.first_name || 'there';
      const message = `Hi ${firstName}, one more quick step before your appointment — takes under 10 minutes: ${link}`;

      const smsResult = await sendSMS({ to: normalizedPhone, message });

      // Log to comms_log
      await supabase.from('comms_log').insert({
        patient_id: intake.patient_id || null,
        direction: 'outbound',
        channel: 'sms',
        provider: smsResult.provider || 'twilio',
        message_sid: smsResult.messageSid || null,
        to_number: normalizedPhone,
        message_body: message,
        status: smsResult.success ? 'sent' : 'failed',
        metadata: { trigger: 'baseline_questionnaire', door, questionnaire_id: qRecord.id },
      });

      if (smsResult.success) {
        console.log(`✅ Questionnaire SMS sent for door ${door} to ${normalizedPhone}`);
      } else {
        console.error(`❌ Questionnaire SMS failed for door ${door}:`, smsResult.error);
      }

      results.push({
        door,
        questionnaire_id: qRecord.id,
        token: qRecord.token,
        sms_sent: smsResult.success,
      });
    }

    return res.status(200).json({ success: true, results });

  } catch (error) {
    console.error('Questionnaire trigger error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
