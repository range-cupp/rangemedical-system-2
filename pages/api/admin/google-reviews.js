// /pages/api/admin/google-reviews.js
// API for Google Review request tracking — send SMS + log to comms_log
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET — fetch all active patients + who's already been sent a review request
  if (req.method === 'GET') {
    try {
      // Fetch active patients with phone numbers
      const { data: patients, error: pErr } = await supabase
        .from('patients')
        .select('id, first_name, last_name, phone, email, status')
        .in('status', ['active', 'completed'])
        .not('phone', 'is', null)
        .order('last_name', { ascending: true });

      if (pErr) throw pErr;

      // Fetch who's already been sent a google_review_request
      const { data: sent, error: sErr } = await supabase
        .from('comms_log')
        .select('patient_id, created_at')
        .eq('message_type', 'google_review_request')
        .eq('status', 'sent')
        .eq('direction', 'outbound');

      if (sErr) throw sErr;

      // Build a map of patient_id -> sent date
      const sentMap = {};
      for (const s of (sent || [])) {
        if (s.patient_id) {
          sentMap[s.patient_id] = s.created_at;
        }
      }

      return res.status(200).json({ patients: patients || [], sentMap });
    } catch (err) {
      console.error('google-reviews GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST — send a review request SMS
  if (req.method === 'POST') {
    const { patient_id, patient_name, phone, message, media_url, provider } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message are required' });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    try {
      const result = await sendSMS({
        to: normalizedPhone,
        message,
        provider,
        mediaUrl: media_url,
      });

      if (result.success) {
        await logComm({
          channel: 'sms',
          messageType: 'google_review_request',
          message,
          source: `google-reviews(${result.provider || 'sms'})`,
          provider: result.provider || null,
          patientId: patient_id || null,
          patientName: patient_name || null,
          recipient: normalizedPhone,
          twilioMessageSid: result.messageSid || null,
          direction: 'outbound',
          mediaUrl: media_url || null,
        });

        return res.status(200).json({ success: true, provider: result.provider });
      }

      return res.status(500).json({ error: 'SMS send failed', details: result.error });
    } catch (err) {
      console.error('google-reviews POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
