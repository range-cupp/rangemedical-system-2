// /pages/api/twilio/sync-calls.js
// Syncs Twilio call history for a patient into comms_log
// Called by ConversationView on load (similar to GHL message sync)
// POST: { patient_id, patient_phone }
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, patient_phone } = req.body;

  if (!patient_id || !patient_phone) {
    return res.status(400).json({ error: 'patient_id and patient_phone are required' });
  }

  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const clinicPhone = (process.env.TWILIO_PHONE_NUMBER || '').trim();

  if (!accountSid || !authToken || !clinicPhone) {
    return res.status(200).json({ synced: 0, error: 'Twilio credentials not configured' });
  }

  const normalized = normalizePhone(patient_phone);
  if (!normalized) {
    return res.status(200).json({ synced: 0, error: 'Invalid phone number' });
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const headers = { Authorization: `Basic ${auth}` };

    // Fetch inbound calls (patient → clinic) and outbound calls (clinic → patient)
    const [inboundRes, outboundRes] = await Promise.all([
      fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json?From=${encodeURIComponent(normalized)}&To=${encodeURIComponent(clinicPhone)}&PageSize=50`,
        { headers }
      ),
      fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json?From=${encodeURIComponent(clinicPhone)}&To=${encodeURIComponent(normalized)}&PageSize=50`,
        { headers }
      ),
    ]);

    const inboundData = await inboundRes.json();
    const outboundData = await outboundRes.json();

    if (!inboundRes.ok || !outboundRes.ok) {
      const err = inboundData.message || outboundData.message || 'Twilio API error';
      console.error('Twilio calls fetch error:', err);
      return res.status(200).json({ synced: 0, error: err });
    }

    // Merge and deduplicate by SID
    const allCalls = [...(inboundData.calls || []), ...(outboundData.calls || [])];
    const seen = new Set();
    const uniqueCalls = [];
    for (const call of allCalls) {
      if (!seen.has(call.sid)) {
        seen.add(call.sid);
        uniqueCalls.push(call);
      }
    }

    if (uniqueCalls.length === 0) {
      return res.status(200).json({ synced: 0, message: 'No calls found' });
    }

    // Check existing comms_log entries to avoid duplicates
    // Use twilio_message_sid field to store call SIDs
    const callSids = uniqueCalls.map(c => c.sid);
    const { data: existingLogs } = await supabase
      .from('comms_log')
      .select('twilio_message_sid')
      .eq('patient_id', patient_id)
      .eq('channel', 'call')
      .in('twilio_message_sid', callSids);

    const existingSids = new Set((existingLogs || []).map(l => l.twilio_message_sid));

    // Get patient name
    const { data: patient } = await supabase
      .from('patients')
      .select('name')
      .eq('id', patient_id)
      .maybeSingle();

    const patientName = patient?.name || 'Unknown';

    // Insert new call records
    const newCalls = [];
    for (const call of uniqueCalls) {
      if (existingSids.has(call.sid)) continue;

      const direction = call.direction === 'inbound' ? 'inbound' : 'outbound';
      const duration = parseInt(call.duration) || 0;
      const status = call.status; // completed, no-answer, busy, canceled, failed
      const startTime = call.start_time || call.date_created;

      // Build message text
      let message;
      if (status === 'completed' && duration > 0) {
        message = `${direction === 'inbound' ? 'Inbound' : 'Outbound'} call — ${formatDuration(duration)}`;
      } else if (status === 'no-answer') {
        message = 'Missed call';
      } else if (status === 'busy') {
        message = 'Call — Busy';
      } else if (status === 'canceled') {
        message = 'Call — Canceled';
      } else if (status === 'failed') {
        message = 'Call — Failed';
      } else if (status === 'completed') {
        message = `${direction === 'inbound' ? 'Inbound' : 'Outbound'} call`;
      } else {
        message = `${direction === 'inbound' ? 'Inbound' : 'Outbound'} call`;
      }

      newCalls.push({
        patient_id,
        patient_name: patientName,
        channel: 'call',
        message_type: 'twilio_call',
        message,
        source: 'twilio/sync-calls',
        status: status === 'completed' ? 'completed' : status === 'no-answer' ? 'missed' : status,
        recipient: normalized,
        direction,
        twilio_message_sid: call.sid,
        created_at: startTime,
      });
    }

    let synced = 0;
    if (newCalls.length > 0) {
      const { error: insertErr } = await supabase
        .from('comms_log')
        .insert(newCalls);

      if (insertErr) {
        console.error('Error syncing Twilio calls:', insertErr.message);
        // If twilio_message_sid column doesn't exist, retry without it
        if (insertErr.message && insertErr.message.includes('twilio_message_sid')) {
          for (const call of newCalls) {
            delete call.twilio_message_sid;
          }
          const { error: retryErr } = await supabase.from('comms_log').insert(newCalls);
          if (!retryErr) synced = newCalls.length;
        }
      } else {
        synced = newCalls.length;
      }
    }

    return res.status(200).json({
      synced,
      total_calls: uniqueCalls.length,
      already_synced: uniqueCalls.length - newCalls.length,
    });

  } catch (error) {
    console.error('Twilio call sync error:', error);
    return res.status(200).json({ synced: 0, error: error.message });
  }
}
