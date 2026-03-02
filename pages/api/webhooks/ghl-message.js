// /pages/api/webhooks/ghl-message.js
// Receives inbound (and optionally outbound) SMS webhook events from GHL
// Logs messages to comms_log so they appear in the Communications tab
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Always return 200 to GHL to prevent retries
  if (req.method !== 'POST') {
    return res.status(200).json({ received: true });
  }

  try {
    const payload = req.body;

    console.log('GHL message webhook received:', JSON.stringify(payload).substring(0, 500));

    // GHL webhook payloads can vary in format
    // Common fields: type, contactId, body/message, direction, messageType, phone, dateAdded
    const eventType = payload.type || payload.event || '';
    const contactId = payload.contactId || payload.contact_id || '';
    const messageBody = payload.body || payload.message || payload.text || '';
    const messageDirection = payload.direction;
    const messageType = payload.messageType || payload.message_type || '';
    const phone = payload.phone || payload.from || payload.to || '';
    const messageId = payload.messageId || payload.id || '';
    const dateAdded = payload.dateAdded || payload.createdAt || payload.date || new Date().toISOString();
    const conversationId = payload.conversationId || payload.conversation_id || '';

    // Only process SMS messages
    if (messageType && messageType !== 'SMS' && messageType !== 'sms') {
      console.log('Skipping non-SMS message type:', messageType);
      return res.status(200).json({ received: true, skipped: 'not_sms' });
    }

    // Determine direction
    // GHL uses: direction 1 = inbound, 0 = outbound (or string 'inbound'/'outbound')
    let direction = 'inbound';
    if (messageDirection === 0 || messageDirection === 'outbound') {
      direction = 'outbound';
    } else if (messageDirection === 1 || messageDirection === 'inbound') {
      direction = 'inbound';
    } else if (eventType.toLowerCase().includes('outbound')) {
      direction = 'outbound';
    }

    // For outbound messages, check if we already logged this (to avoid duplicates)
    // since our system logs outbound when sending
    if (direction === 'outbound') {
      // Check for recent outbound message with similar content (within 2 minutes)
      const twoMinAgo = new Date(Date.now() - 120000).toISOString();
      const msgSnippet = (messageBody || '').substring(0, 50);

      if (msgSnippet && contactId) {
        const { data: existing } = await supabase
          .from('comms_log')
          .select('id')
          .eq('ghl_contact_id', contactId)
          .eq('direction', 'outbound')
          .eq('channel', 'sms')
          .gte('created_at', twoMinAgo)
          .ilike('message', `${msgSnippet}%`)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log('Skipping duplicate outbound message for contact:', contactId);
          return res.status(200).json({ received: true, skipped: 'duplicate_outbound' });
        }
      }
    }

    // Look up the patient by GHL contact ID
    let patient = null;
    if (contactId) {
      const { data: patientMatch } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, phone, ghl_contact_id')
        .eq('ghl_contact_id', contactId)
        .limit(1)
        .maybeSingle();

      patient = patientMatch;
    }

    // If no patient found by contact ID, try by phone number
    if (!patient && phone) {
      const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
      if (normalizedPhone.length === 10) {
        const { data: phoneMatch } = await supabase
          .from('patients')
          .select('id, name, first_name, last_name, phone, ghl_contact_id')
          .or(`phone.ilike.%${normalizedPhone}`)
          .limit(1)
          .maybeSingle();

        patient = phoneMatch;
      }
    }

    const patientName = patient
      ? (patient.first_name && patient.last_name
          ? `${patient.first_name} ${patient.last_name}`
          : patient.name)
      : (phone || contactId);

    // For inbound: also deduplicate (GHL might send the same message via webhook multiple times)
    if (direction === 'inbound' && messageBody) {
      const fiveMinAgo = new Date(Date.now() - 300000).toISOString();
      const msgSnippet = messageBody.substring(0, 50);

      const dedupeQuery = supabase
        .from('comms_log')
        .select('id')
        .eq('direction', 'inbound')
        .eq('channel', 'sms')
        .gte('created_at', fiveMinAgo)
        .ilike('message', `${msgSnippet}%`)
        .limit(1);

      // Narrow by patient or contact
      if (patient?.id) {
        dedupeQuery.eq('patient_id', patient.id);
      } else if (contactId) {
        dedupeQuery.eq('ghl_contact_id', contactId);
      }

      const { data: existingInbound } = await dedupeQuery;
      if (existingInbound && existingInbound.length > 0) {
        console.log('Skipping duplicate inbound message');
        return res.status(200).json({ received: true, skipped: 'duplicate_inbound' });
      }
    }

    // Insert into comms_log
    const { error: insertError } = await supabase
      .from('comms_log')
      .insert({
        patient_id: patient?.id || null,
        patient_name: patientName,
        ghl_contact_id: contactId || patient?.ghl_contact_id || null,
        channel: 'sms',
        message_type: direction === 'inbound' ? 'inbound_sms' : 'ghl_sms',
        message: messageBody,
        source: 'ghl/webhook',
        status: direction === 'inbound' ? 'received' : 'sent',
        recipient: phone || patient?.phone || null,
        direction,
      });

    if (insertError) {
      console.error('Error storing GHL message:', insertError);
      return res.status(200).json({ received: true, error: insertError.message });
    }

    console.log(`GHL ${direction} SMS logged for ${patientName} (contact: ${contactId})`);

    return res.status(200).json({
      received: true,
      direction,
      patientId: patient?.id || null,
      patientName,
    });

  } catch (error) {
    console.error('GHL message webhook error:', error);
    // Always return 200 to prevent GHL from retrying
    return res.status(200).json({ received: true, error: error.message });
  }
}
