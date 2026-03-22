// pages/api/questionnaire/trigger.js
// Generates a single baseline questionnaire token and sends ONE SMS to patient
// Consolidates both doors into a single seamless assessment when both are selected
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

    // Determine door: 1=injury only, 2=optimization only, 3=both
    const hasInjury = !!intake.injured;
    const hasOptimization = !!intake.interested_in_optimization;

    if (!hasInjury && !hasOptimization) {
      console.log('Questionnaire trigger: no door selected, skipping');
      return res.status(200).json({ success: true, message: 'No questionnaire needed' });
    }

    if (!intake.phone) {
      console.warn('Questionnaire trigger: no phone number for intake', intake_id);
      return res.status(200).json({ success: true, message: 'No phone number' });
    }

    const normalizedPhone = normalizePhone(intake.phone);
    if (!normalizedPhone) {
      console.warn('Questionnaire trigger: invalid phone', intake.phone);
      return res.status(200).json({ success: true, message: 'Invalid phone number' });
    }

    // Single consolidated door value
    let door, questionnaire_type;
    if (hasInjury && hasOptimization) {
      door = 3;
      questionnaire_type = 'combined_baseline';
    } else if (hasInjury) {
      door = 1;
      questionnaire_type = 'door1_baseline';
    } else {
      door = 2;
      questionnaire_type = 'door2_baseline';
    }

    const token = crypto.randomBytes(16).toString('hex');

    // Create single questionnaire record
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
      console.error('Questionnaire trigger: failed to create record', qErr);
      return res.status(500).json({ error: 'Failed to create questionnaire' });
    }

    // Build the link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
      || 'https://app.range-medical.com';
    const link = `${baseUrl}/questionnaire/${token}`;

    // Warm handoff SMS — personalized, explains why
    const firstName = intake.first_name || 'there';
    const message = `Hi ${firstName}, based on what you shared in your intake, we've prepared a short clinical assessment tailored to your goals. It helps your provider build your personalized plan before your visit — takes under 10 minutes: ${link}`;

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
      metadata: {
        trigger: 'baseline_questionnaire',
        door,
        questionnaire_type,
        questionnaire_id: qRecord.id,
      },
    });

    if (smsResult.success) {
      console.log(`✅ Questionnaire SMS sent (door ${door}) to ${normalizedPhone}`);
    } else {
      console.error(`❌ Questionnaire SMS failed:`, smsResult.error);
    }

    return res.status(200).json({
      success: true,
      questionnaire_id: qRecord.id,
      token: qRecord.token,
      door,
      sms_sent: smsResult.success,
    });

  } catch (error) {
    console.error('Questionnaire trigger error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
