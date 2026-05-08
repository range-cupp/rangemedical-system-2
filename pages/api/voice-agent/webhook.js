// /pages/api/voice-agent/webhook.js
// Receives post-call webhooks from Retell after each voice conversation ends.
// Extracts caller info and creates a follow-up task for staff if the caller
// didn't book an appointment but wants a callback or left their info.

import { createClient } from '@supabase/supabase-js';
import { sendSMS } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { event, call } = req.body;

  if (event !== 'call_ended' && event !== 'call_analyzed') {
    return res.status(200).json({ ok: true });
  }

  try {
    const analysis = call?.call_analysis || {};
    const callerName = analysis.caller_name || null;
    const callerPhone = analysis.caller_phone || null;
    const serviceInterest = analysis.service_interest || null;
    const wantsCallback = analysis.wants_callback || false;
    const appointmentBooked = analysis.appointment_booked || false;
    const transcript = call?.transcript || '';
    const callDuration = call?.end_timestamp && call?.start_timestamp
      ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
      : null;

    if (appointmentBooked) {
      return res.status(200).json({ ok: true, action: 'appointment_already_booked' });
    }

    if (!callerName && !callerPhone && !wantsCallback) {
      return res.status(200).json({ ok: true, action: 'no_actionable_data' });
    }

    const parts = [];
    if (callerName) parts.push(`Caller: ${callerName}`);
    if (callerPhone) parts.push(`Phone: ${callerPhone}`);
    if (serviceInterest) parts.push(`Interested in: ${serviceInterest}`);
    if (wantsCallback) parts.push('Wants a callback');
    if (callDuration) parts.push(`Call duration: ${callDuration}s`);

    const taskTitle = callerName
      ? `Voice agent lead — ${callerName}${serviceInterest ? ` (${serviceInterest})` : ''}`
      : `Voice agent lead — follow up${serviceInterest ? ` (${serviceInterest})` : ''}`;

    const taskBody = parts.join('\n');

    const { error: taskError } = await supabase.from('tasks').insert({
      title: taskTitle,
      body: taskBody,
      priority: wantsCallback ? 'high' : 'normal',
      status: 'pending',
      assigned_by: 'voice_agent',
      created_at: new Date().toISOString(),
    });

    if (taskError) {
      console.error('Failed to create voice agent task:', taskError);
    }

    // Notify Chris Cupp via SMS about the lead
    const notifyPhone = process.env.VOICE_AGENT_NOTIFY_PHONE;
    if (notifyPhone) {
      const smsBody = `🎙️ Voice Agent Lead\n${parts.join('\n')}`;
      try {
        await sendSMS({ to: notifyPhone, body: smsBody });
      } catch (e) {
        console.error('Failed to send voice agent lead SMS:', e);
      }
    }

    return res.status(200).json({ ok: true, action: 'task_created', taskTitle });
  } catch (err) {
    console.error('Voice agent webhook error:', err);
    return res.status(200).json({ ok: true });
  }
}
