// /pages/api/twilio/call-status.js
// Receives call status updates from Twilio when a call completes
// Automatically logs completed calls to comms_log in real-time
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';
import { normalizePhone } from '../../../lib/twilio-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('');
  }

  try {
    const {
      CallSid,
      CallStatus,      // completed, busy, no-answer, failed, canceled
      CallDuration,     // seconds (only on completed)
      To,
      From,
      Direction,        // inbound, outbound-api, outbound-dial
    } = req.body;

    // Only log terminal statuses
    const terminalStatuses = ['completed', 'busy', 'no-answer', 'failed', 'canceled'];
    if (!CallSid || !terminalStatuses.includes(CallStatus)) {
      return res.status(200).send('');
    }

    console.log(`Call status: ${CallSid} ${Direction} ${CallStatus} ${CallDuration || 0}s`);

    // Check if this call is already logged (dedup by SID)
    const { data: existing } = await supabase
      .from('comms_log')
      .select('id')
      .eq('twilio_message_sid', CallSid)
      .maybeSingle();

    if (existing) {
      return res.status(200).send('');
    }

    // Determine direction and the "other" phone number
    const direction = Direction === 'inbound' ? 'inbound' : 'outbound';
    const clinicPhone = (process.env.TWILIO_PHONE_NUMBER || '+19499973988').trim();
    const otherPhone = direction === 'inbound' ? From : To;
    const normalizedOther = normalizePhone(otherPhone) || otherPhone;

    // Look up patient by phone
    let patientId = null;
    let patientName = normalizedOther || 'Unknown';

    if (normalizedOther && normalizedOther !== 'Anonymous') {
      const { data: patient } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, phone')
        .eq('phone', normalizedOther)
        .maybeSingle();

      if (patient) {
        patientId = patient.id;
        patientName = patient.first_name && patient.last_name
          ? `${patient.first_name} ${patient.last_name}`
          : patient.name || patientName;
      }
    }

    // Build message text
    const duration = parseInt(CallDuration) || 0;
    let message;
    if (CallStatus === 'completed' && duration > 0) {
      message = `${direction === 'inbound' ? 'Inbound' : 'Outbound'} call — ${formatDuration(duration)}`;
    } else if (CallStatus === 'no-answer') {
      message = 'Missed call';
    } else if (CallStatus === 'busy') {
      message = 'Call — Busy';
    } else if (CallStatus === 'canceled') {
      message = 'Call — Canceled';
    } else if (CallStatus === 'failed') {
      message = 'Call — Failed';
    } else {
      message = `${direction === 'inbound' ? 'Inbound' : 'Outbound'} call`;
    }

    const status = CallStatus === 'completed' ? 'completed'
      : CallStatus === 'no-answer' ? 'missed'
      : CallStatus;

    const { error: insertErr } = await supabase
      .from('comms_log')
      .insert({
        patient_id: patientId,
        patient_name: patientName,
        channel: 'call',
        message_type: 'twilio_call',
        message,
        source: 'twilio/call-status',
        status,
        recipient: normalizedOther,
        direction,
        twilio_message_sid: CallSid,
        created_at: new Date().toISOString(),
      });

    if (insertErr) {
      console.error('Call status insert error:', insertErr.message);
    }

    return res.status(200).send('');

  } catch (error) {
    console.error('Call status webhook error:', error);
    return res.status(200).send('');
  }
}
