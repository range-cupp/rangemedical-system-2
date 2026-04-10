// /pages/api/app/messages.js
// GET: conversation list (most recent SMS per patient) + full thread for a patient
// POST: send SMS via existing send-sms infrastructure
// Range Medical Employee App
// comms_log columns: id, patient_id, channel, message, direction, status,
//   source, created_at, read_at, provider, sent_by_employee_name, recipient

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { patient_id, limit = '60' } = req.query;

    if (patient_id) {
      // Full SMS thread for a specific patient
      const { data: messages, error } = await supabase
        .from('comms_log')
        .select('id, patient_id, direction, message, created_at, status, channel, read_at, sent_by_employee_name, needs_response, source, media_url')
        .eq('patient_id', patient_id)
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(Number(limit));

      if (error) return res.status(500).json({ error: 'Failed to load messages' });

      // Mark inbound messages as read
      await supabase
        .from('comms_log')
        .update({ read_at: new Date().toISOString() })
        .eq('patient_id', patient_id)
        .eq('direction', 'inbound')
        .is('read_at', null);

      const normalized = (messages || []).reverse().map(m => ({
        ...m,
        body: m.message,
        sent_at: m.created_at,
      }));

      return res.status(200).json({ messages: normalized });
    }

    // Conversation list — most recent SMS per unique patient
    // Filter to SMS only so emails/calls don't crowd out real conversations
    const { data: recent, error } = await supabase
      .from('comms_log')
      .select(`
        id,
        patient_id,
        direction,
        message,
        created_at,
        read_at,
        recipient,
        patients(id, first_name, last_name, phone)
      `)
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) return res.status(500).json({ error: 'Failed to load conversations' });

    // Deduplicate by patient_id, keep most recent
    const seen = new Set();
    const conversations = [];
    for (const msg of recent || []) {
      if (!msg.patient_id || seen.has(msg.patient_id)) continue;
      seen.add(msg.patient_id);
      conversations.push({ ...msg, body: msg.message, sent_at: msg.created_at });
      if (conversations.length >= 100) break;
    }

    // Count unread + needs_response inbound SMS per patient
    const patientIds = conversations.map(c => c.patient_id).filter(Boolean);
    let unreadMap = {};
    let needsResponseMap = {};
    if (patientIds.length > 0) {
      const [{ data: unread }, { data: needsResp }] = await Promise.all([
        supabase
          .from('comms_log')
          .select('patient_id')
          .in('patient_id', patientIds)
          .eq('channel', 'sms')
          .eq('direction', 'inbound')
          .is('read_at', null),
        supabase
          .from('comms_log')
          .select('patient_id')
          .in('patient_id', patientIds)
          .eq('needs_response', true),
      ]);
      for (const row of unread || []) {
        unreadMap[row.patient_id] = (unreadMap[row.patient_id] || 0) + 1;
      }
      for (const row of needsResp || []) {
        needsResponseMap[row.patient_id] = (needsResponseMap[row.patient_id] || 0) + 1;
      }
    }

    return res.status(200).json({
      conversations: conversations.map(c => ({
        ...c,
        unread_count: unreadMap[c.patient_id] || 0,
        needs_response_count: needsResponseMap[c.patient_id] || 0,
      })),
    });
  }

  if (req.method === 'POST') {
    const { patient_id, phone, message, staff_name, media_url } = req.body;
    if (!phone || (!message && !media_url)) {
      return res.status(400).json({ error: 'phone and (message or media_url) are required' });
    }

    try {
      const normalizedTo = normalizePhone(phone);
      const result = await sendSMS({ to: normalizedTo, message: message || '', mediaUrl: media_url });

      // Log outbound to comms_log
      if (patient_id) {
        const logRow = {
          patient_id,
          direction: 'outbound',
          channel: 'sms',
          message: message || (media_url ? '📷 Image' : ''),
          status: result.success ? 'sent' : 'failed',
          source: 'staff_app',
          sent_by_employee_name: staff_name || 'Staff',
          recipient: normalizedTo,
          created_at: new Date().toISOString(),
        };
        if (media_url) logRow.media_url = media_url;
        await supabase.from('comms_log').insert(logRow);

        // Clear needs_response on all prior inbound messages for this patient
        // This is a STAFF reply from the mobile app
        await supabase
          .from('comms_log')
          .update({ needs_response: false })
          .eq('patient_id', patient_id)
          .eq('needs_response', true)
          .catch(err => { console.error('comms_log update error:', err.message); });
      }

      if (!result.success) throw new Error(result.error || 'Failed to send');
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[app/messages] send error:', err);
      return res.status(500).json({ error: err.message || 'Failed to send message' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
