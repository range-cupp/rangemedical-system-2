// /pages/api/admin/conversations.js
// Returns deduplicated SMS conversation list — one entry per patient/phone
// Uses SQL to get most recent message per patient rather than over-fetching rows
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { days = '60', limit = '100' } = req.query;
    const daysNum = Math.min(365, Math.max(1, parseInt(days) || 60));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 100));
    const since = new Date();
    since.setDate(since.getDate() - daysNum);

    // Step 1: Get the most recent comms_log entry per patient (by patient_id)
    // Uses a raw SQL DISTINCT ON query for efficiency
    const { data: convRows, error: convErr } = await supabase.rpc('get_recent_conversations', {
      since_ts: since.toISOString(),
      row_limit: limitNum,
    });

    // If the RPC doesn't exist, fall back to a JS-side approach with a higher limit
    if (convErr) {
      console.warn('[conversations] RPC not available, using fallback:', convErr.message);
      return fallbackConversations(req, res, daysNum, limitNum, since, supabase);
    }

    // Step 2: Get unread counts + actual phone numbers from patients table
    const patientIds = (convRows || []).map(r => r.patient_id).filter(Boolean);
    let unreadMap = {};
    let phoneMap = {};
    if (patientIds.length > 0) {
      const [{ data: unreadRows }, { data: patientRows }] = await Promise.all([
        supabase
          .from('comms_log')
          .select('patient_id')
          .in('patient_id', patientIds)
          .eq('direction', 'inbound')
          .is('read_at', null),
        supabase
          .from('patients')
          .select('id, phone')
          .in('id', patientIds),
      ]);
      for (const row of unreadRows || []) {
        unreadMap[row.patient_id] = (unreadMap[row.patient_id] || 0) + 1;
      }
      for (const row of patientRows || []) {
        if (row.phone) phoneMap[row.id] = row.phone;
      }
    }

    const conversations = (convRows || []).map(r => ({
      ...r,
      // Use the patient's actual phone from patients table, fall back to comms_log recipient
      recipient: (r.patient_id && phoneMap[r.patient_id]) || r.recipient,
      unread_count: unreadMap[r.patient_id] || 0,
    }));

    return res.status(200).json({ conversations });

  } catch (err) {
    console.error('[conversations] error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Fallback: fetch more rows and deduplicate in JS
// Used when the RPC hasn't been created yet
async function fallbackConversations(req, res, daysNum, limitNum, since, supabase) {
  // Fetch last 500 SMS entries — enough to cover all active conversations
  const { data: logs, error } = await supabase
    .from('comms_log')
    .select('id, patient_id, ghl_contact_id, patient_name, direction, message, created_at, read_at, recipient, channel')
    .eq('channel', 'sms')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return res.status(500).json({ error: error.message });

  const patientMap = {};
  const unreadCounts = {};
  const phoneToKeys = {};

  for (const log of logs || []) {
    const key =
      log.patient_id ||
      (log.ghl_contact_id ? `ghl_${log.ghl_contact_id}` : null) ||
      (log.recipient ? `phone_${log.recipient.replace(/\D/g, '').slice(-10)}` : null);
    if (!key) continue;

    // Track phone → key for merging
    if (log.recipient) {
      const digits = log.recipient.replace(/\D/g, '').slice(-10);
      if (digits.length === 10) {
        if (!phoneToKeys[digits]) phoneToKeys[digits] = new Set();
        phoneToKeys[digits].add(key);
      }
    }

    if (log.direction === 'inbound' && !log.read_at) {
      unreadCounts[key] = (unreadCounts[key] || 0) + 1;
    }

    if (!patientMap[key] || new Date(log.created_at) > new Date(patientMap[key].last_message_at)) {
      patientMap[key] = {
        patient_id: log.patient_id || null,
        ghl_contact_id: log.ghl_contact_id || null,
        patient_name: log.patient_name || log.recipient || 'Unknown',
        last_message: log.message || '',
        last_message_at: log.created_at,
        last_direction: log.direction,
        recipient: log.recipient || null,
      };
    }
  }

  // Merge conversations sharing the same phone number
  for (const keys of Object.values(phoneToKeys)) {
    if (keys.size <= 1) continue;
    const keyArr = Array.from(keys);
    const preferredKey =
      keyArr.find(k => !k.startsWith('phone_') && !k.startsWith('ghl_')) ||
      keyArr.find(k => k.startsWith('ghl_')) ||
      keyArr[0];

    for (const key of keyArr) {
      if (key === preferredKey) continue;
      const other = patientMap[key];
      const preferred = patientMap[preferredKey];
      if (!other || !preferred) continue;

      if (new Date(other.last_message_at) > new Date(preferred.last_message_at)) {
        preferred.last_message = other.last_message;
        preferred.last_message_at = other.last_message_at;
        preferred.last_direction = other.last_direction;
      }
      if ((!preferred.patient_name || preferred.patient_name === preferred.recipient) && other.patient_name && other.patient_name !== other.recipient) {
        preferred.patient_name = other.patient_name;
      }
      if (!preferred.patient_id && other.patient_id) preferred.patient_id = other.patient_id;
      if (!preferred.ghl_contact_id && other.ghl_contact_id) preferred.ghl_contact_id = other.ghl_contact_id;
      if (!preferred.recipient && other.recipient) preferred.recipient = other.recipient;

      unreadCounts[preferredKey] = (unreadCounts[preferredKey] || 0) + (unreadCounts[key] || 0);
      delete patientMap[key];
      delete unreadCounts[key];
    }
  }

  for (const key of Object.keys(patientMap)) {
    patientMap[key].unread_count = unreadCounts[key] || 0;
  }

  // Look up actual phone numbers from patients table to avoid comms_log mismatches
  const fallbackPatientIds = Object.values(patientMap).map(c => c.patient_id).filter(Boolean);
  if (fallbackPatientIds.length > 0) {
    const { data: patientRows } = await supabase
      .from('patients')
      .select('id, phone')
      .in('id', fallbackPatientIds);
    const phoneMap = {};
    for (const row of patientRows || []) {
      if (row.phone) phoneMap[row.id] = row.phone;
    }
    for (const conv of Object.values(patientMap)) {
      if (conv.patient_id && phoneMap[conv.patient_id]) {
        conv.recipient = phoneMap[conv.patient_id];
      }
    }
  }

  const conversations = Object.values(patientMap)
    .sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (a.unread_count === 0 && b.unread_count > 0) return 1;
      return new Date(b.last_message_at) - new Date(a.last_message_at);
    })
    .slice(0, limitNum);

  return res.status(200).json({ conversations });
}
