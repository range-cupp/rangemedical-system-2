// /pages/api/admin/google-reviews.js
// API for Google Review requests — two-step: review request first, gift after verified
// Range Medical System V2

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.range-medical.com';

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

export default async function handler(req, res) {
  // GET — fetch all active patients + sent status (review and gift separately)
  if (req.method === 'GET') {
    try {
      const { data: patients, error: pErr } = await supabase
        .from('patients')
        .select('id, first_name, last_name, phone, email, status')
        .in('status', ['active', 'completed'])
        .not('phone', 'is', null)
        .order('last_name', { ascending: true });

      if (pErr) throw pErr;

      // Fetch review requests and gift sends separately
      const { data: comms, error: sErr } = await supabase
        .from('comms_log')
        .select('patient_id, message_type, created_at')
        .in('message_type', ['google_review_request', 'google_review_gift'])
        .eq('status', 'sent')
        .eq('direction', 'outbound');

      if (sErr) throw sErr;

      // Build a map of patient_id -> { reviewSent, giftSent }
      const sentMap = {};
      for (const c of (comms || [])) {
        if (!c.patient_id) continue;
        if (!sentMap[c.patient_id]) sentMap[c.patient_id] = {};
        if (c.message_type === 'google_review_request') {
          sentMap[c.patient_id].reviewSent = c.created_at;
        } else if (c.message_type === 'google_review_gift') {
          sentMap[c.patient_id].giftSent = c.created_at;
        }
      }

      return res.status(200).json({ patients: patients || [], sentMap });
    } catch (err) {
      console.error('google-reviews GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST — send review request OR gift
  if (req.method === 'POST') {
    const { patient_id, patient_name, phone, message, message_type, provider } = req.body;

    if (!phone || !message || !patient_id) {
      return res.status(400).json({ error: 'patient_id, phone, and message are required' });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const isGift = message_type === 'gift';

    try {
      let finalMessage = message;

      // If sending a gift, create/reuse the review gift token
      if (isGift) {
        let giftToken;

        const { data: existingGift } = await supabase
          .from('review_gifts')
          .select('id, token, status')
          .eq('patient_id', patient_id)
          .maybeSingle();

        if (existingGift) {
          giftToken = existingGift.token;
          if (existingGift.status === 'expired') {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);
            await supabase
              .from('review_gifts')
              .update({ status: 'active', expires_at: expiresAt.toISOString() })
              .eq('id', existingGift.id);
          }
        } else {
          giftToken = generateToken();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          const { error: insertError } = await supabase
            .from('review_gifts')
            .insert({
              patient_id,
              token: giftToken,
              expires_at: expiresAt.toISOString(),
            });

          if (insertError) {
            console.error('Failed to create review gift:', insertError);
            return res.status(500).json({ error: 'Failed to create gift token' });
          }
        }

        const giftLink = `${BASE_URL}/review/${giftToken}`;
        finalMessage = finalMessage.replace(/{gift_link}/g, giftLink);
      }

      const result = await sendSMS({
        to: normalizedPhone,
        message: finalMessage,
        provider,
      });

      if (result.success) {
        await logComm({
          channel: 'sms',
          messageType: isGift ? 'google_review_gift' : 'google_review_request',
          message: finalMessage,
          source: `google-reviews(${result.provider || 'sms'})`,
          provider: result.provider || null,
          patientId: patient_id || null,
          patientName: patient_name || null,
          recipient: normalizedPhone,
          twilioMessageSid: result.messageSid || null,
          direction: 'outbound',
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
