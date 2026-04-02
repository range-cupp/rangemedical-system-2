// pages/api/questionnaire/send.js
// Manual send — creates a baseline questionnaire and sends SMS to patient
// Called from admin patient profile "Send Assessment" button
// Does NOT require an intake — works directly with patient_id and chosen door

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
    const { patient_id, door } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required' });
    }

    if (![1, 2, 3].includes(door)) {
      return res.status(400).json({ error: 'door must be 1, 2, or 3' });
    }

    // Fetch patient info
    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .select('id, first_name, last_name, phone')
      .eq('id', patient_id)
      .single();

    if (patientErr || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.phone) {
      return res.status(400).json({ error: 'Patient has no phone number on file' });
    }

    const normalizedPhone = normalizePhone(patient.phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const questionnaire_type = door === 3 ? 'combined_baseline' : door === 1 ? 'door1_baseline' : 'door2_baseline';
    const token = crypto.randomBytes(5).toString('hex');

    const { data: qRecord, error: qErr } = await supabase
      .from('baseline_questionnaires')
      .insert({
        patient_id,
        intake_id: null,
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
      console.error('Manual questionnaire send: failed to create record', qErr);
      return res.status(500).json({ error: 'Failed to create questionnaire' });
    }

    const link = `https://app.range-medical.com/q/${token}`;

    const firstName = patient.first_name || 'there';
    const message = `Hi ${firstName}, your provider at Range Medical has prepared a short clinical assessment for you. It helps us build your personalized plan — takes under 10 minutes: ${link}`;

    const smsResult = await sendSMS({ to: normalizedPhone, message });

    await supabase.from('comms_log').insert({
      patient_id,
      direction: 'outbound',
      channel: 'sms',
      provider: smsResult.provider || 'twilio',
      message_sid: smsResult.messageSid || null,
      to_number: normalizedPhone,
      message_body: message,
      status: smsResult.success ? 'sent' : 'failed',
      metadata: {
        trigger: 'manual_baseline_questionnaire',
        door,
        questionnaire_type,
        questionnaire_id: qRecord.id,
      },
    });

    return res.status(200).json({
      success: true,
      questionnaire_id: qRecord.id,
      token: qRecord.token,
      door,
      sms_sent: smsResult.success,
    });

  } catch (error) {
    console.error('Manual questionnaire send error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
