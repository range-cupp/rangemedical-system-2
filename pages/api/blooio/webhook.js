// /pages/api/blooio/webhook.js
// Receive inbound messages + delivery status updates from Blooio
// Handles both event types via webhook_type: "all"
// Range Medical

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendBlooioMessage } from '../../../lib/blooio';
import { getPendingMessages, markPendingMessageSent } from '../../../lib/blooio-optin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify Blooio webhook signature
function verifySignature(req, rawBody) {
  const secret = process.env.BLOOIO_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification if not configured yet

  const signature = req.headers['x-blooio-signature'] || req.headers['x-signature'];
  if (!signature) {
    console.warn('Blooio webhook: no signature header found');
    return true; // Allow during initial setup
  }

  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok' });
  }

  try {
    const body = req.body;

    // Determine event type from payload
    // Blooio sends different payloads for messages vs status updates
    const eventType = body.type || body.event_type || (body.text ? 'message' : 'status');

    if (eventType === 'message' || body.text) {
      // INBOUND MESSAGE
      await handleInboundMessage(body);
    } else if (eventType === 'status' || body.message_id) {
      // DELIVERY STATUS UPDATE
      await handleStatusUpdate(body);
    } else {
      console.log('Blooio webhook: unrecognized event type:', JSON.stringify(body).substring(0, 200));
    }

    return res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('Blooio webhook error:', error);
    // Always return 200 to prevent retries
    return res.status(200).json({ status: 'error', message: error.message });
  }
}

async function handleInboundMessage(body) {
  // Extract fields from Blooio payload
  const senderPhone = body.from || body.sender || body.chat_id || '';
  const messageText = body.text || body.body || '';
  const messageId = body.message_id || body.id || null;

  console.log(`Inbound iMessage/SMS from ${senderPhone}: ${messageText}`);

  // Try to match sender to a patient by phone
  let patient = null;
  if (senderPhone) {
    const normalizedFrom = senderPhone.replace(/\D/g, '').slice(-10);

    const { data: phoneMatch } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, phone, ghl_contact_id')
      .or(`phone.ilike.%${normalizedFrom}`)
      .limit(1)
      .maybeSingle();

    patient = phoneMatch;
  }

  // Store in comms_log
  const row = {
    patient_id: patient?.id || null,
    patient_name: patient
      ? (patient.first_name && patient.last_name
          ? `${patient.first_name} ${patient.last_name}`
          : patient.name)
      : senderPhone,
    ghl_contact_id: patient?.ghl_contact_id || null,
    channel: 'sms',
    message_type: 'inbound_sms',
    message: messageText,
    source: 'blooio/webhook',
    status: 'received',
    recipient: senderPhone,
    direction: 'inbound',
  };

  // Add optional columns (may not exist yet)
  if (messageId) row.twilio_message_sid = messageId;
  row.provider = 'blooio';

  const { error: insertError } = await supabase.from('comms_log').insert(row);

  if (insertError) {
    // Retry without optional columns if they don't exist
    if (insertError.message && (insertError.message.includes('twilio_message_sid') || insertError.message.includes('provider'))) {
      delete row.twilio_message_sid;
      delete row.provider;
      const { error: retryErr } = await supabase.from('comms_log').insert(row);
      if (retryErr) console.error('Error storing inbound message (retry):', retryErr);
    } else {
      console.error('Error storing inbound message:', insertError);
    }
  }

  // Auto-send any pending link messages now that patient has replied
  await sendPendingMessages(senderPhone, patient);
}

async function sendPendingMessages(phone, patient) {
  try {
    const pending = await getPendingMessages(phone);
    if (pending.length === 0) return;

    console.log(`Found ${pending.length} pending link message(s) for ${phone} — auto-sending`);

    for (const msg of pending) {
      // Send the queued link message via Blooio (patient just replied on Blooio)
      const result = await sendBlooioMessage({ to: msg.phone, message: msg.message });

      if (result.success) {
        // Log auto-send to comms_log
        const logRow = {
          patient_id: msg.patient_id || patient?.id || null,
          patient_name: msg.patient_name || patient?.name || phone,
          ghl_contact_id: patient?.ghl_contact_id || null,
          channel: 'sms',
          message_type: msg.message_type || 'auto_send',
          message: msg.message,
          source: 'blooio/webhook(auto-send)',
          status: 'sent',
          recipient: msg.phone,
          direction: 'outbound',
          provider: 'blooio',
        };
        if (result.messageSid) logRow.twilio_message_sid = result.messageSid;

        await supabase.from('comms_log').insert(logRow);

        // Mark pending message as sent
        await markPendingMessageSent(msg.id);

        console.log(`Auto-sent pending ${msg.message_type} to ${msg.phone} (${msg.id})`);
      } else {
        console.error(`Failed to auto-send pending message ${msg.id}:`, result.error);
      }
    }
  } catch (err) {
    console.error('sendPendingMessages error:', err);
  }
}

async function handleStatusUpdate(body) {
  const messageId = body.message_id || body.id || null;
  const messageStatus = body.status || body.message_status || '';

  if (!messageId) {
    console.log('Blooio status update: no message_id found');
    return;
  }

  console.log(`Blooio status update: ${messageId} → ${messageStatus}`);

  // Map Blooio statuses to comms_log statuses
  const statusMap = {
    queued: 'queued',
    sending: 'sending',
    sent: 'sent',
    delivered: 'delivered',
    read: 'delivered', // iMessage read receipt — map to delivered
    failed: 'error',
    undelivered: 'undelivered',
  };

  const mappedStatus = statusMap[messageStatus] || messageStatus;

  const updateData = { status: mappedStatus };

  if (messageStatus === 'failed' || messageStatus === 'undelivered') {
    const errorInfo = body.error || body.error_message || body.reason || '';
    if (errorInfo) {
      updateData.error_message = typeof errorInfo === 'string' ? errorInfo : JSON.stringify(errorInfo);
    }
  }

  // Update comms_log by message ID (stored in twilio_message_sid column)
  const { data: updated, error: updateError } = await supabase
    .from('comms_log')
    .update(updateData)
    .eq('twilio_message_sid', messageId)
    .select('id, patient_name, status')
    .maybeSingle();

  if (updateError) {
    console.error('Blooio status update error:', updateError.message);
  } else if (updated) {
    console.log(`Updated comms_log ${updated.id} for ${updated.patient_name}: ${mappedStatus}`);
  } else {
    console.log(`No comms_log entry found for Blooio message_id: ${messageId}`);
  }
}
