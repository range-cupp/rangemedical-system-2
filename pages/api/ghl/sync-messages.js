// /pages/api/ghl/sync-messages.js
// Fetches GHL conversation messages for a patient and persists
// any new ones (especially inbound) to comms_log.
// Called by ConversationView on load to ensure GHL messages are in our DB.
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_API_BASE = 'https://services.leadconnectorhq.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contact_id, patient_id } = req.body;

  if (!contact_id) {
    return res.status(400).json({ error: 'contact_id is required' });
  }

  if (!GHL_API_KEY) {
    return res.status(200).json({ synced: 0, error: 'GHL not configured' });
  }

  try {
    // 1. Fetch GHL conversation messages
    const searchRes = await fetch(
      `${GHL_API_BASE}/conversations/search?contactId=${contact_id}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
        },
      }
    );

    if (!searchRes.ok) {
      return res.status(200).json({ synced: 0, error: 'GHL search failed' });
    }

    const searchData = await searchRes.json();
    const conversations = searchData.conversations || [];

    if (conversations.length === 0) {
      return res.status(200).json({ synced: 0, message: 'No GHL conversations found' });
    }

    // 2. Fetch messages from conversations
    // GHL message types (numeric): 2 = SMS
    const GHL_TYPE_SMS = 2;
    const ghlMessages = [];

    for (const conv of conversations.slice(0, 3)) {
      try {
        // Paginate to get all messages
        let lastMessageId = null;
        let pages = 0;

        while (pages < 10) {
          let url = `${GHL_API_BASE}/conversations/${conv.id}/messages`;
          if (lastMessageId) url += `?lastMessageId=${lastMessageId}`;

          const msgRes = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Accept': 'application/json',
            },
          });

          if (!msgRes.ok) break;

          const msgData = await msgRes.json();

          // GHL returns nested: { messages: { lastMessageId, nextPage, messages: [...] } }
          const wrapper = msgData.messages || {};
          const messages = Array.isArray(wrapper) ? wrapper : (wrapper.messages || []);
          const nextPage = wrapper.nextPage || false;

        for (const msg of messages) {
          // GHL uses numeric types: 2 = SMS
          const isSMS = msg.type === GHL_TYPE_SMS
            || msg.type === 'SMS'
            || msg.messageType === 'SMS';

          if (!isSMS) continue;

          const direction = msg.direction === 'inbound' ? 'inbound' : 'outbound';
          const body = msg.body || msg.message || '';
          const timestamp = msg.dateAdded || msg.createdAt || msg.date;

          if (!body || !timestamp) continue;

          ghlMessages.push({
            ghl_id: msg.id,
            body,
            direction,
            timestamp,
            phone: msg.meta?.phone || msg.phone || '',
          });
        }

          if (!nextPage || messages.length === 0) break;
          lastMessageId = wrapper.lastMessageId;
          pages++;
        }
      } catch (err) {
        console.error('Error fetching GHL conversation messages:', err.message);
      }
    }

    if (ghlMessages.length === 0) {
      return res.status(200).json({ synced: 0, message: 'No SMS messages in GHL' });
    }

    // 3. Get existing comms_log entries for this patient to deduplicate
    const lookupField = patient_id ? 'patient_id' : 'ghl_contact_id';
    const lookupValue = patient_id || contact_id;

    const { data: existingLogs } = await supabase
      .from('comms_log')
      .select('message, direction, created_at')
      .eq(lookupField, lookupValue)
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(500);

    // Build dedup set: rounded timestamp + first 40 chars of message
    const existingKeys = new Set();
    for (const log of (existingLogs || [])) {
      const t = new Date(log.created_at).getTime();
      const key = `${Math.floor(t / 60000)}_${log.direction}_${(log.message || '').substring(0, 40).toLowerCase()}`;
      existingKeys.add(key);
    }

    // 4. Look up patient info if we have patient_id
    let patient = null;
    if (patient_id) {
      const { data: p } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, phone, ghl_contact_id')
        .eq('id', patient_id)
        .maybeSingle();
      patient = p;
    } else {
      const { data: p } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, phone, ghl_contact_id')
        .eq('ghl_contact_id', contact_id)
        .maybeSingle();
      patient = p;
    }

    const patientName = patient
      ? (patient.first_name && patient.last_name
          ? `${patient.first_name} ${patient.last_name}`
          : patient.name)
      : contact_id;

    // 5. Insert new messages
    let synced = 0;
    const newMessages = [];

    for (const msg of ghlMessages) {
      const t = new Date(msg.timestamp).getTime();
      const key = `${Math.floor(t / 60000)}_${msg.direction}_${msg.body.substring(0, 40).toLowerCase()}`;

      if (existingKeys.has(key)) continue;

      // Mark as seen so we don't insert duplicates within this batch
      existingKeys.add(key);

      newMessages.push({
        patient_id: patient?.id || null,
        patient_name: patientName,
        ghl_contact_id: contact_id,
        channel: 'sms',
        message_type: msg.direction === 'inbound' ? 'inbound_sms' : 'ghl_sms',
        message: msg.body,
        source: 'ghl/sync',
        status: msg.direction === 'inbound' ? 'received' : 'sent',
        recipient: msg.phone || patient?.phone || null,
        direction: msg.direction,
        created_at: msg.timestamp,
      });
    }

    if (newMessages.length > 0) {
      // Insert in batches of 50
      for (let i = 0; i < newMessages.length; i += 50) {
        const batch = newMessages.slice(i, i + 50);
        const { error: insertErr } = await supabase
          .from('comms_log')
          .insert(batch);

        if (insertErr) {
          console.error('Error syncing GHL messages batch:', insertErr.message);
        } else {
          synced += batch.length;
        }
      }
    }

    return res.status(200).json({
      synced,
      total_ghl_messages: ghlMessages.length,
      already_synced: ghlMessages.length - newMessages.length,
      inbound_synced: newMessages.filter(m => m.direction === 'inbound').length,
      outbound_synced: newMessages.filter(m => m.direction === 'outbound').length,
    });

  } catch (error) {
    console.error('GHL sync error:', error);
    return res.status(200).json({ synced: 0, error: error.message });
  }
}
