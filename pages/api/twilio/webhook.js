// /pages/api/twilio/webhook.js
// Receive inbound SMS from Twilio
// Stores messages in comms_log for conversation view
// Auto-replies to HRT IV scheduling prompts when patient replies YES
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';
import { sendSMS } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Positive reply keywords for scheduling prompt
const POSITIVE_REPLIES = ['yes', 'y', 'yeah', 'sure', 'yep', 'yea', 'ok', 'okay'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // Return TwiML empty response for GET (Twilio health checks)
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');
  }

  try {
    const {
      From,           // sender phone number in E.164
      To,             // your Twilio number
      Body,           // message text
      MessageSid,     // Twilio message ID
      NumMedia,       // number of media attachments
    } = req.body;

    console.log(`Inbound SMS from ${From}: ${Body}`);

    // Try to match the sender to a patient by phone.
    // Phones may be stored in many formats: +19495395023, (949) 539-5023, 9495395023, etc.
    // Pass 1: fast DB query — catches E.164 (+1...) and plain-digit formats
    // Pass 2: JS-side normalization fallback — strips non-digits from stored values
    //         and compares last 10 digits, catching (949) 539-5023 style storage
    let patient = null;
    if (From) {
      const normalizedFrom = From.replace(/\D/g, '').slice(-10);

      // Pass 1: DB-level match (E.164 and digit-only formats)
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
        console.log(`Inbound SMS matched to patient: ${patient.first_name} ${patient.last_name} (${patient.id})`);
      } else {
        console.warn(`Inbound SMS from ${From} — no matching patient found`);
      }
    }

    // Store in comms_log
    const { error: insertError } = await supabase
      .from('comms_log')
      .insert({
        patient_id: patient?.id || null,
        patient_name: patient
          ? (patient.first_name && patient.last_name
              ? `${patient.first_name} ${patient.last_name}`
              : patient.name)
          : From,
        ghl_contact_id: patient?.ghl_contact_id || null,
        channel: 'sms',
        message_type: 'inbound_sms',
        message: Body || '',
        source: 'twilio/webhook',
        status: 'received',
        recipient: From, // store the sender's phone
        direction: 'inbound',
        provider: 'twilio',
      });

    if (insertError) {
      console.error('Error storing inbound SMS:', insertError);
    }

    // ================================================================
    // AUTO-REPLY: HRT IV Scheduling Prompt
    // If patient replies YES to a recent scheduling prompt, send booking link
    // ================================================================
    if (patient?.id && Body) {
      const normalizedBody = (Body || '').trim().toLowerCase();

      if (POSITIVE_REPLIES.includes(normalizedBody)) {
        // Check for a recent (last 30 days) unanswered hrt_iv_schedule_prompt
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
          console.log(`HRT IV schedule YES reply from ${patient.name} — sending booking link`);

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

          const linkResult = await sendSMS({ to: From, message: linkMessage }).catch(err => {
            console.error('HRT IV schedule link SMS error:', err);
            return { success: false, error: err.message };
          });

          // Log the scheduling link SMS
          await logComm({
            channel: 'sms',
            messageType: 'hrt_iv_schedule_link',
            message: linkMessage,
            source: 'twilio/webhook',
            patientId: patient.id,
            patientName: patient.name,
            recipient: From,
            status: linkResult.success ? 'sent' : 'error',
            errorMessage: linkResult.error || null,
            twilioMessageSid: linkResult.messageSid || null,
            provider: linkResult.provider || null,
            direction: 'outbound',
          }).catch(() => {});

          // Mark the original prompt as replied (prevents duplicate link sends)
          await supabase
            .from('comms_log')
            .update({ status: 'replied' })
            .eq('id', pendingPrompt.id)
            .catch(() => {});

          if (linkResult.success) {
            console.log(`HRT IV scheduling link sent to ${patient.name} (${From})`);
          }
        }
      }
    }

    // Return TwiML (empty = no auto-reply via TwiML, replies sent via API above)
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');

  } catch (error) {
    console.error('Twilio webhook error:', error);
    // Always return 200 to Twilio to prevent retries
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');
  }
}

// Twilio sends form-encoded POST data
export const config = {
  api: {
    bodyParser: true,
  },
};
