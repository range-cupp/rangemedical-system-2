// /pages/api/twilio/calls.js
// Fetch call history from Twilio for the clinic phone number
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { normalizePhone } from '../../../lib/twilio-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const clinicPhone = (process.env.TWILIO_PHONE_NUMBER || '').trim();

  if (!accountSid || !authToken) {
    return res.status(500).json({ error: 'Twilio credentials not configured' });
  }

  const page = parseInt(req.query.page) || 0;
  const pageSize = parseInt(req.query.limit) || 20;

  try {
    // Fetch calls from Twilio API
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams({
      PageSize: String(pageSize),
      Page: String(page),
    });

    // Fetch both inbound and outbound calls for the clinic number
    const [toRes, fromRes] = await Promise.all([
      fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json?${params}&To=${encodeURIComponent(clinicPhone)}`,
        { headers: { Authorization: `Basic ${auth}` } }
      ),
      fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json?${params}&From=${encodeURIComponent(clinicPhone)}`,
        { headers: { Authorization: `Basic ${auth}` } }
      ),
    ]);

    const toData = await toRes.json();
    const fromData = await fromRes.json();

    if (!toRes.ok || !fromRes.ok) {
      const err = toData.message || fromData.message || 'Twilio API error';
      return res.status(500).json({ error: err });
    }

    // Merge and deduplicate by SID
    const allCalls = [...(toData.calls || []), ...(fromData.calls || [])];
    const seen = new Set();
    const uniqueCalls = [];
    for (const call of allCalls) {
      if (!seen.has(call.sid)) {
        seen.add(call.sid);
        uniqueCalls.push(call);
      }
    }

    // Sort by start time descending
    uniqueCalls.sort((a, b) => new Date(b.start_time || b.date_created) - new Date(a.start_time || a.date_created));

    // Limit to pageSize
    const paginated = uniqueCalls.slice(0, pageSize);

    // Collect all phone numbers to look up patient names
    const phoneNumbers = new Set();
    for (const call of paginated) {
      const otherPhone = call.direction === 'inbound' ? call.from : call.to;
      if (otherPhone && otherPhone !== clinicPhone) {
        phoneNumbers.add(otherPhone);
      }
    }

    // Look up patient names by phone
    let patientsByPhone = {};
    if (phoneNumbers.size > 0) {
      const phonesArray = Array.from(phoneNumbers);
      // Normalize phones for lookup
      const normalizedPhones = phonesArray.map(p => normalizePhone(p)).filter(Boolean);

      if (normalizedPhones.length > 0) {
        const { data: patients } = await supabase
          .from('patients')
          .select('id, name, first_name, last_name, phone')
          .or(normalizedPhones.map(p => `phone.eq.${p}`).join(','));

        if (patients) {
          for (const patient of patients) {
            const normalized = normalizePhone(patient.phone);
            if (normalized) {
              patientsByPhone[normalized] = patient.first_name && patient.last_name
                ? `${patient.first_name} ${patient.last_name}`
                : patient.name || 'Unknown';
            }
          }
        }
      }
    }

    // Map to simplified format
    const calls = paginated.map(call => {
      const otherPhone = call.direction === 'inbound' ? call.from : call.to;
      const normalizedOther = normalizePhone(otherPhone);
      const patientName = normalizedOther ? patientsByPhone[normalizedOther] || null : null;

      return {
        sid: call.sid,
        from: call.from,
        to: call.to,
        direction: call.direction === 'inbound' ? 'inbound' : 'outbound',
        duration: parseInt(call.duration) || 0,
        status: call.status,
        startTime: call.start_time || call.date_created,
        endTime: call.end_time || null,
        patientName,
      };
    });

    return res.status(200).json({
      calls,
      page,
      pageSize,
    });

  } catch (error) {
    console.error('Twilio calls error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch calls' });
  }
}
