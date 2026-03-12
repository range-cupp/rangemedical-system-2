// /pages/api/app/messages.js
// GET: conversation list (most recent per patient) + full thread for a patient
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
    const { patient_id, limit = '40' } = req.query;

    if (patient_id) {
      // Full thread for a specific patient
      const { data: messages, error } = await supabase
        .from('comms_log')
        .select('id, patient_id, direction, message, created_at, status, channel, read_at, sent_by_employee_name')
        .eq('patient_id', patient_id)
        .order('created_at', { ascending: false })
        .limit(Number(limit));

      if (error) return res.status(500).json({ error: 'Failed to load messages' });

      // Mark inbound messages as read (set read_at)
      await supabase
        .from('comms_log')
        .update({ read_at: new Date().toISOString() })
        .eq('patient_id', patient_id)
        .eq('direction', 'inbound')
        .is('read_at', null);

      // Normalize for client: expose `body` and `sent_at` as aliases
      const normalized = (messages || []).reverse().map(m => ({
        ...m,
        body: m.message,
        sent_at: m.created_at,
      }));

      return res.status(200).json({ messages: normalized });
    }

    // Conversation list — most recent message per unique patient (last 50 convos)
    const { data: recent, error } = await supabase
      .from('comms_log')
      .select(`
        id,
        patient_id,
        direction,
        message,
        created_at,
        read_at,
        patients(id, first_name, last_name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) return res.status(500).json({ error: 'Failed to load conversations' });

    // Deduplicate by patient_id, keep most recent
    const seen = new Set();
    const conversations = [];
    for (const msg of recent || []) {
      if (!msg.patient_id || seen.has(msg.patient_id)) continue;
      seen.add(msg.patient_id);
      // Normalize field names for client
      conversations.push({ ...msg, body: msg.message, sent_at: msg.created_at });
      if (conversations.length >= 50) break;
    }

    // Count unread (inbound with no read_at) per patient
    const patientIds = conversations.map(c => c.patient_id).filter(Boolean);
    let unreadMap = {};
    if (patientIds.length > 0) {
      const { data: unread } = await supabase
        .from('comms_log')
        .select('patient_id')
        .in('patient_id', patientIds)
        .eq('direction', 'inbound')
        .is('read_at', null);
      for (const row of unread || []) {
        unreadMap[row.patient_id] = (unreadMap[row.patient_id] || 0) + 1;
      }
    }

    return res.status(200).json({
      conversations: conversations.map(c => ({
        ...c,
        unread_count: unreadMap[c.patient_id] || 0,
      })),
    });
  }

  if (req.method === 'POST') {
    const { patient_id, phone, message, staff_name } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message are required' });
    }

    try {
      const normalizedTo = normalizePhone(phone);
      const result = await sendSMS({ to: normalizedTo, message });

      // Log outbound to comms_log
      if (patient_id) {
        await supabase.from('comms_log').insert({
          patient_id,
          direction: 'outbound',
          channel: result.provider || 'sms',
          message,
          status: result.success ? 'sent' : 'failed',
          source: 'staff_app',
          sent_by_employee_name: staff_name || 'Staff',
          recipient: normalizedTo,
          created_at: new Date().toISOString(),
        });
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
