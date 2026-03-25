// /pages/api/twilio/sync-all-calls.js
// Bulk sync ALL Twilio call history into comms_log
// Fetches all recent calls for the clinic phone, matches to patients, persists
// Called by Communications page when Calls tab or Activity Log is loaded
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

  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const rawPhone = (process.env.TWILIO_PHONE_NUMBER || '').trim();
  const clinicPhone = normalizePhone(rawPhone) || rawPhone || '+19499973988';

  if (!accountSid || !authToken) {
    return res.status(200).json({ synced: 0, error: 'Twilio credentials not configured' });
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const headers = { Authorization: `Basic ${auth}` };

    // Fetch inbound calls (to clinic) and outbound calls (from clinic)
    // Get up to 100 most recent calls each direction
    const [inboundRes, outboundRes] = await Promise.all([
      fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json?To=${encodeURIComponent(clinicPhone)}&PageSize=100`,
        { headers }
      ),
      fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json?From=${encodeURIComponent(clinicPhone)}&PageSize=100`,
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
      return res.status(200).json({ synced: 0, message: 'No calls found in Twilio' });
    }

    // Check which call SIDs are already in comms_log
    const callSids = uniqueCalls.map(c => c.sid);
    const { data: existingLogs } = await supabase
      .from('comms_log')
      .select('twilio_message_sid')
      .eq('channel', 'call')
      .in('twilio_message_sid', callSids);

    const existingSids = new Set((existingLogs || []).map(l => l.twilio_message_sid));

    // Collect all "other" phone numbers to look up patients
    const phoneNumbers = new Set();
    for (const call of uniqueCalls) {
      if (existingSids.has(call.sid)) continue;
      const otherPhone = call.direction === 'inbound' ? call.from : call.to;
      if (otherPhone && otherPhone !== clinicPhone) {
        phoneNumbers.add(normalizePhone(otherPhone) || otherPhone);
      }
    }

    // Batch lookup patients by phone
    let patientsByPhone = {};
    if (phoneNumbers.size > 0) {
      const phonesArray = Array.from(phoneNumbers).filter(Boolean);
      if (phonesArray.length > 0) {
        const { data: patients } = await supabase
          .from('patients')
          .select('id, name, first_name, last_name, phone')
          .or(phonesArray.map(p => `phone.eq.${p}`).join(','));

        if (patients) {
          for (const patient of patients) {
            const normalized = normalizePhone(patient.phone);
            if (normalized) {
              patientsByPhone[normalized] = {
                id: patient.id,
                name: patient.first_name && patient.last_name
                  ? `${patient.first_name} ${patient.last_name}`
                  : patient.name || 'Unknown',
              };
            }
          }
        }
      }
    }

    // Build insert rows for new calls
    const newCalls = [];
    for (const call of uniqueCalls) {
      if (existingSids.has(call.sid)) continue;

      const direction = call.direction === 'inbound' ? 'inbound' : 'outbound';
      const duration = parseInt(call.duration) || 0;
      const status = call.status;
      const startTime = call.start_time || call.date_created;

      // Find the "other" phone (not the clinic)
      const otherPhone = direction === 'inbound' ? call.from : call.to;
      const normalizedOther = normalizePhone(otherPhone) || otherPhone;
      const patient = patientsByPhone[normalizedOther] || null;

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
        patient_id: patient?.id || null,
        patient_name: patient?.name || normalizedOther || 'Unknown',
        channel: 'call',
        message_type: 'twilio_call',
        message,
        source: 'twilio/sync-all-calls',
        status: status === 'completed' ? 'completed' : status === 'no-answer' ? 'missed' : status,
        recipient: normalizedOther,
        direction,
        twilio_message_sid: call.sid,
        created_at: startTime,
      });
    }

    let synced = 0;
    if (newCalls.length > 0) {
      // Insert in batches of 50
      for (let i = 0; i < newCalls.length; i += 50) {
        const batch = newCalls.slice(i, i + 50);
        const { error: insertErr } = await supabase
          .from('comms_log')
          .insert(batch);

        if (insertErr) {
          console.error('Error syncing calls batch:', insertErr.message);
          // If twilio_message_sid column doesn't exist, retry without it
          if (insertErr.message && insertErr.message.includes('twilio_message_sid')) {
            for (const call of batch) {
              delete call.twilio_message_sid;
            }
            const { error: retryErr } = await supabase.from('comms_log').insert(batch);
            if (!retryErr) synced += batch.length;
          }
        } else {
          synced += batch.length;
        }
      }
    }

    return res.status(200).json({
      synced,
      total_twilio_calls: uniqueCalls.length,
      already_synced: uniqueCalls.length - newCalls.length,
    });

  } catch (error) {
    console.error('Twilio bulk call sync error:', error);
    return res.status(200).json({ synced: 0, error: error.message });
  }
}
