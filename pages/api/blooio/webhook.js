// /pages/api/blooio/webhook.js
// Receive inbound messages + delivery status updates from Blooio
// Handles both event types via webhook_type: "all"
// Range Medical

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendBlooioMessage } from '../../../lib/blooio';
import { getPendingMessages, markPendingMessageSent } from '../../../lib/blooio-optin';
import { identifyStaff, handleStaffMessage } from '../../../lib/staff-bot';

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
    // KEY: Status updates may include `text` (original message content) but have NO `from`/`sender`.
    // Real inbound messages ALWAYS have a sender phone number.
    const hasSender = !!(body.from || body.sender || body.chat_id);
    const hasExplicitType = body.type || body.event_type;
    const eventType = hasExplicitType || (hasSender && body.text ? 'message' : 'status');

    if ((eventType === 'message' || body.text) && hasSender) {
      // INBOUND MESSAGE — must have a sender phone
      await handleInboundMessage(body);
    } else if (eventType === 'status' || body.message_id || !hasSender) {
      // DELIVERY STATUS UPDATE (or text with no sender = status echo)
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

  // ================================================================
  // STAFF BOT: Check if sender is a staff member — route to bot if so
  // Skip staff bot if sender is also a patient (treat as patient message)
  // ================================================================
  if (senderPhone && messageText) {
    const staffMember = await identifyStaff(senderPhone);

    // Check if sender is also a patient — if so, skip staff bot
    let senderIsPatient = false;
    if (staffMember) {
      const normalizedPhone = senderPhone.replace(/\D/g, '').slice(-10);
      const { data: patientMatch } = await supabase
        .from('patients')
        .select('id')
        .or(`phone.ilike.%${normalizedPhone},phone.eq.+1${normalizedPhone}`)
        .limit(1)
        .maybeSingle();
      senderIsPatient = !!patientMatch;
      if (senderIsPatient) {
        console.log(`Staff member ${staffMember.name} is also a patient — routing as patient message`);
      }
    }

    if (staffMember && !senderIsPatient) {
      console.log(`Staff message from ${staffMember.name} (${senderPhone}): ${messageText}`);

      // Log inbound staff message to comms_log
      const inboundRow = {
        channel: 'sms',
        message_type: 'staff_bot_inbound',
        message: messageText,
        source: 'blooio/webhook(staff-bot)',
        status: 'received',
        recipient: senderPhone,
        direction: 'inbound',
        provider: 'blooio',
        patient_name: staffMember.name,
      };
      if (messageId) inboundRow.twilio_message_sid = messageId;
      await supabase.from('comms_log').insert(inboundRow).catch(() => {});

      // Process through staff bot and get response
      let botResponse;
      try {
        botResponse = await handleStaffMessage(messageText, staffMember);
      } catch (err) {
        console.error('Staff bot error:', err);
        botResponse = 'Sorry, something went wrong. Please try again or contact IT.';
      }

      // Send bot response back to staff member
      const sendResult = await sendBlooioMessage({ to: senderPhone, message: botResponse });

      // Log outbound bot response to comms_log
      const outboundRow = {
        channel: 'sms',
        message_type: 'staff_bot_response',
        message: botResponse,
        source: 'blooio/webhook(staff-bot)',
        status: sendResult.success ? 'sent' : 'error',
        error_message: sendResult.error || null,
        recipient: senderPhone,
        direction: 'outbound',
        provider: 'blooio',
        patient_name: staffMember.name,
      };
      if (sendResult.messageSid) outboundRow.twilio_message_sid = sendResult.messageSid;
      await supabase.from('comms_log').insert(outboundRow).catch(() => {});

      // Staff message handled — do not continue to patient flow
      return;
    }
  }

  // Try to match sender to a patient by phone.
  // Pass 1: fast DB query — catches E.164 (+1...) and plain-digit formats
  // Pass 2: JS-side normalization fallback — strips non-digits from stored values
  //         and compares last 10 digits, catching (949) 539-5023 style storage
  let patient = null;
  if (senderPhone) {
    const normalizedFrom = senderPhone.replace(/\D/g, '').slice(-10);

    // Pass 1: DB-level match
    const { data: phoneMatch } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, phone, ghl_contact_id')
      .or(`phone.ilike.%${normalizedFrom},phone.eq.+1${normalizedFrom},phone.eq.${normalizedFrom}`)
      .limit(1)
      .maybeSingle();

    patient = phoneMatch || null;

    // Pass 2: JS normalization fallback — handles (949) 539-5023 stored format
    if (!patient && normalizedFrom.length === 10) {
      const areaCode = normalizedFrom.substring(0, 3);
      const { data: candidates } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, phone, ghl_contact_id')
        .ilike('phone', `%${areaCode}%`)
        .limit(500);

      if (candidates?.length) {
        const found = candidates.find(p => {
          const digits = (p.phone || '').replace(/\D/g, '').slice(-10);
          return digits === normalizedFrom;
        });
        patient = found || null;
      }
    }

    if (patient) {
      console.log(`Inbound Blooio SMS matched to patient: ${patient.first_name} ${patient.last_name} (${patient.id})`);
    } else {
      console.warn(`Inbound Blooio SMS from ${senderPhone} — no matching patient found`);
    }
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

  // ================================================================
  // AUTO-REPLY: HRT IV Scheduling Prompt
  // If patient replies YES to a recent scheduling prompt, send booking link
  // ================================================================
  if (patient?.id && messageText) {
    const POSITIVE_REPLIES = ['yes', 'y', 'yeah', 'sure', 'yep', 'yea', 'ok', 'okay'];
    const normalizedBody = messageText.trim().toLowerCase();

    if (POSITIVE_REPLIES.includes(normalizedBody)) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: pendingPrompt } = await supabase
        .from('comms_log')
        .select('id, created_at')
        .eq('patient_id', patient.id)
        .eq('message_type', 'hrt_iv_schedule_prompt')
        .eq('direction', 'outbound')
        .neq('status', 'replied')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingPrompt) {
        console.log(`HRT IV schedule YES reply from ${patient.name} via Blooio — sending booking link`);

        // Look up patient email for pre-filling the booking form
        const { data: patientDetails } = await supabase
          .from('patients')
          .select('email, first_name, name')
          .eq('id', patient.id)
          .single();

        const linkParams = new URLSearchParams();
        const displayName = patientDetails?.first_name || patientDetails?.name || patient.name || '';
        if (displayName) linkParams.set('name', displayName);
        if (patientDetails?.email) linkParams.set('email', patientDetails.email);
        const queryStr = linkParams.toString();
        const scheduleLink = `https://app.range-medical.com/schedule-iv${queryStr ? '?' + queryStr : ''}`;
        const linkMessage = `Here's your link to schedule your Range IV: ${scheduleLink} — Range Medical`;

        const linkResult = await sendBlooioMessage({ to: senderPhone, message: linkMessage });

        // Log the scheduling link SMS
        const linkRow = {
          patient_id: patient.id,
          patient_name: patient.name,
          channel: 'sms',
          message_type: 'hrt_iv_schedule_link',
          message: linkMessage,
          source: 'blooio/webhook',
          recipient: senderPhone,
          status: linkResult.success ? 'sent' : 'error',
          error_message: linkResult.error || null,
          direction: 'outbound',
          provider: 'blooio',
        };
        if (linkResult.messageSid) linkRow.twilio_message_sid = linkResult.messageSid;

        await supabase.from('comms_log').insert(linkRow).catch(() => {});

        // Mark original prompt as replied (prevents duplicate link sends)
        await supabase
          .from('comms_log')
          .update({ status: 'replied' })
          .eq('id', pendingPrompt.id)
          .catch(() => {});

        if (linkResult.success) {
          console.log(`HRT IV scheduling link sent to ${patient.name} (${senderPhone}) via Blooio`);
        }
      }
    }
  }
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
