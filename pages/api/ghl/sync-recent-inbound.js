// /pages/api/ghl/sync-recent-inbound.js
// Fetches recent GHL conversations to catch any inbound messages
// the webhook may have missed. Called on Communications page load.
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_BASE = 'https://services.leadconnectorhq.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    return res.status(200).json({ synced: 0, error: 'GHL not configured' });
  }

  try {
    // Fetch recent conversations from GHL (last 48 hours)
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const searchRes = await fetch(
      `${GHL_API_BASE}/conversations/search?locationId=${GHL_LOCATION_ID}&sortBy=last_message_date&sortOrder=desc&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
        },
      }
    );

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error('GHL conversation search failed:', searchRes.status, errText);
      return res.status(200).json({ synced: 0, error: 'GHL search failed' });
    }

    const searchData = await searchRes.json();
    const conversations = searchData.conversations || [];

    if (conversations.length === 0) {
      return res.status(200).json({ synced: 0, message: 'No recent GHL conversations' });
    }

    let totalSynced = 0;

    // Process each recent conversation
    for (const conv of conversations) {
      const contactId = conv.contactId;
      if (!contactId) continue;

      // Skip conversations with no recent activity
      const lastMsgDate = conv.lastMessageDate || conv.dateUpdated;
      if (lastMsgDate && new Date(lastMsgDate) < new Date(since)) continue;

      try {
        // Look up patient by GHL contact ID
        let patient = null;
        const { data: patientMatch } = await supabase
          .from('patients')
          .select('id, name, first_name, last_name, phone, ghl_contact_id')
          .eq('ghl_contact_id', contactId)
          .limit(1)
          .maybeSingle();

        patient = patientMatch;

        // If no match by contact ID, try matching by phone from conversation
        if (!patient && conv.contactPhone) {
          const normalizedPhone = conv.contactPhone.replace(/\D/g, '').slice(-10);
          if (normalizedPhone.length === 10) {
            const { data: phoneMatch } = await supabase
              .from('patients')
              .select('id, name, first_name, last_name, phone, ghl_contact_id')
              .or(`phone.ilike.%${normalizedPhone}`)
              .limit(1)
              .maybeSingle();

            patient = phoneMatch;

            // If we found the patient by phone, update their ghl_contact_id
            if (patient && !patient.ghl_contact_id) {
              await supabase
                .from('patients')
                .update({ ghl_contact_id: contactId })
                .eq('id', patient.id);
            }
          }
        }

        // Also try matching by name from conversation
        if (!patient && conv.contactName) {
          const nameParts = conv.contactName.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            const { data: nameMatch } = await supabase
              .from('patients')
              .select('id, name, first_name, last_name, phone, ghl_contact_id')
              .ilike('first_name', firstName)
              .ilike('last_name', lastName)
              .limit(1)
              .maybeSingle();

            patient = nameMatch;

            // Update ghl_contact_id if found
            if (patient && !patient.ghl_contact_id) {
              await supabase
                .from('patients')
                .update({ ghl_contact_id: contactId })
                .eq('id', patient.id);
            }
          }
        }

        const patientName = patient
          ? (patient.first_name && patient.last_name
              ? `${patient.first_name} ${patient.last_name}`
              : patient.name)
          : (conv.contactName || conv.contactPhone || contactId);

        // Fetch recent messages from this conversation
        const msgRes = await fetch(
          `${GHL_API_BASE}/conversations/${conv.id}/messages`,
          {
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Accept': 'application/json',
            },
          }
        );

        if (!msgRes.ok) continue;

        const msgData = await msgRes.json();
        const wrapper = msgData.messages || {};
        const messages = Array.isArray(wrapper) ? wrapper : (wrapper.messages || []);

        // Only process recent inbound SMS messages
        const GHL_TYPE_SMS = 2;
        for (const msg of messages) {
          const isSMS = msg.type === GHL_TYPE_SMS || msg.type === 'SMS' || msg.messageType === 'SMS';
          if (!isSMS) continue;

          const direction = msg.direction === 'inbound' ? 'inbound' : 'outbound';
          // Focus on inbound messages (outbound are already logged when sent)
          if (direction !== 'inbound') continue;

          const body = msg.body || msg.message || '';
          const timestamp = msg.dateAdded || msg.createdAt || msg.date;
          if (!body || !timestamp) continue;

          // Skip if older than 48 hours
          if (new Date(timestamp) < new Date(since)) continue;

          // Dedup check: look for similar message in comms_log
          const msgSnippet = body.substring(0, 50);
          const fiveMinBefore = new Date(new Date(timestamp).getTime() - 300000).toISOString();
          const fiveMinAfter = new Date(new Date(timestamp).getTime() + 300000).toISOString();

          const dedupeQuery = supabase
            .from('comms_log')
            .select('id')
            .eq('direction', 'inbound')
            .eq('channel', 'sms')
            .gte('created_at', fiveMinBefore)
            .lte('created_at', fiveMinAfter)
            .ilike('message', `${msgSnippet}%`)
            .limit(1);

          if (patient?.id) {
            dedupeQuery.eq('patient_id', patient.id);
          } else {
            dedupeQuery.eq('ghl_contact_id', contactId);
          }

          const { data: existing } = await dedupeQuery;
          if (existing && existing.length > 0) continue;

          // Insert the missed inbound message
          const { error: insertErr } = await supabase
            .from('comms_log')
            .insert({
              patient_id: patient?.id || null,
              patient_name: patientName,
              ghl_contact_id: contactId,
              channel: 'sms',
              message_type: 'inbound_sms',
              message: body,
              source: 'ghl/sync-recent',
              status: 'received',
              recipient: conv.contactPhone || patient?.phone || null,
              direction: 'inbound',
              created_at: timestamp,
            });

          if (!insertErr) {
            totalSynced++;
          }
        }
      } catch (err) {
        console.error(`Error syncing conversation for contact ${contactId}:`, err.message);
      }
    }

    return res.status(200).json({
      synced: totalSynced,
      conversations_checked: conversations.length,
    });

  } catch (error) {
    console.error('GHL recent inbound sync error:', error);
    return res.status(200).json({ synced: 0, error: error.message });
  }
}
