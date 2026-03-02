// /pages/api/cron/send-notifications.js
// Process queued notifications (messages sent during quiet hours)
// Runs at 7:00 AM PST daily (0 14 * * * UTC)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Phone normalization (matches /pages/api/twilio/send-sms.js)
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (phone.startsWith('+') && digits.length >= 10) return '+' + digits;
  return null;
}

const GHL_API_KEY = process.env.GHL_API_KEY;

// Send SMS — GHL primary, Twilio fallback (only for patients without GHL contact)
async function sendSMS(to, message, patientId = null) {
  // Primary: GHL (manages the business phone number 949-997-3988)
  if (GHL_API_KEY && patientId) {
    const { data: patient } = await supabase
      .from('patients')
      .select('ghl_contact_id')
      .eq('id', patientId)
      .single();

    if (patient?.ghl_contact_id) {
      // Try GHL with one retry
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const ghlRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              type: 'SMS',
              contactId: patient.ghl_contact_id,
              message,
            }),
          });

          if (ghlRes.ok) {
            return { success: true, via: 'ghl' };
          }
          console.error(`GHL SMS attempt ${attempt + 1} failed:`, ghlRes.status, await ghlRes.text());
          if (attempt === 0) {
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }
          return { success: false, error: 'GHL send failed after retries' };
        } catch (err) {
          console.error(`GHL SMS attempt ${attempt + 1} error:`, err.message);
          if (attempt === 0) {
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }
          return { success: false, error: `GHL error: ${err.message}` };
        }
      }
    }
    // Patient has no GHL contact ID — fall through to Twilio
  }

  // Fallback: Twilio
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const fromNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim();
  const messagingServiceSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || '').trim();

  if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
    return { success: false, error: 'No SMS provider configured' };
  }

  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) {
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams();
    params.append('To', normalizedTo);
    if (messagingServiceSid) {
      params.append('MessagingServiceSid', messagingServiceSid);
    } else {
      params.append('From', fromNumber);
    }
    params.append('Body', message);

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com').replace(/\/$/, '');
    params.append('StatusCallback', `${baseUrl}/api/twilio/status-callback`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || 'SMS send failed' };
    }
    return { success: true, via: 'twilio', sid: data.sid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  // Verify cron authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = { sent: 0, errors: 0, details: [] };

  try {
    // Fetch all pending notifications that are ready to send
    const { data: pending, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(100);

    if (fetchError) {
      console.error('Failed to fetch notification queue:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch queue', details: fetchError.message });
    }

    if (!pending || pending.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending notifications',
        sent: 0,
      });
    }

    console.log(`Processing ${pending.length} queued notifications`);

    for (const notification of pending) {
      try {
        let sendResult;

        if (notification.channel === 'sms') {
          // Send SMS via GHL (primary) or Twilio (fallback)
          sendResult = await sendSMS(notification.recipient, notification.message, notification.patient_id);
        } else if (notification.channel === 'email') {
          // Send email via Resend
          try {
            await resend.emails.send({
              from: 'Range Medical <noreply@range-medical.com>',
              replyTo: 'info@range-medical.com',
              to: notification.recipient,
              subject: notification.subject || 'Range Medical',
              html: notification.message,
            });
            sendResult = { success: true };
          } catch (emailErr) {
            sendResult = { success: false, error: emailErr.message };
          }
        } else {
          sendResult = { success: false, error: `Unknown channel: ${notification.channel}` };
        }

        // Update notification status
        if (sendResult.success) {
          await supabase
            .from('notification_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', notification.id);

          // Log to comms_log
          await logComm({
            channel: notification.channel,
            messageType: notification.message_type,
            message: notification.message,
            source: 'send-notifications-cron',
            patientId: notification.patient_id,
            patientName: notification.patient_name,
            recipient: notification.channel === 'email' ? notification.recipient : null,
            subject: notification.subject,
            status: 'sent',
          });

          results.sent++;
          results.details.push({
            id: notification.id,
            channel: notification.channel,
            type: notification.message_type,
            patient: notification.patient_name,
            status: 'sent',
          });
        } else {
          await supabase
            .from('notification_queue')
            .update({ status: 'error', error_message: sendResult.error })
            .eq('id', notification.id);

          await logComm({
            channel: notification.channel,
            messageType: notification.message_type,
            message: notification.message,
            source: 'send-notifications-cron',
            patientId: notification.patient_id,
            patientName: notification.patient_name,
            recipient: notification.channel === 'email' ? notification.recipient : null,
            subject: notification.subject,
            status: 'error',
            errorMessage: sendResult.error,
          });

          results.errors++;
          results.details.push({
            id: notification.id,
            channel: notification.channel,
            type: notification.message_type,
            patient: notification.patient_name,
            status: 'error',
            error: sendResult.error,
          });
        }
      } catch (err) {
        console.error(`Error processing notification ${notification.id}:`, err);
        results.errors++;
      }
    }

    console.log(`Notification queue processed: ${results.sent} sent, ${results.errors} errors`);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      total: pending.length,
      sent: results.sent,
      errors: results.errors,
      details: results.details,
    });

  } catch (error) {
    console.error('Send notifications cron error:', error);
    return res.status(500).json({ error: error.message });
  }
}
