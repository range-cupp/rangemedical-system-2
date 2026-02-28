// /pages/api/twilio/webhook.js
// Receive inbound SMS from Twilio
// Stores messages in comms_log for conversation view
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // Try to match the sender to a patient by phone
    let patient = null;
    if (From) {
      const normalizedFrom = From.replace(/\D/g, '').slice(-10);

      // Try exact phone match
      const { data: phoneMatch } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, phone, ghl_contact_id')
        .or(`phone.ilike.%${normalizedFrom}`)
        .limit(1)
        .maybeSingle();

      patient = phoneMatch;
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
      });

    if (insertError) {
      console.error('Error storing inbound SMS:', insertError);
    }

    // Return TwiML (empty = no auto-reply)
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');

  } catch (error) {
    console.error('Twilio webhook error:', error);
    // Always return 200 to Twilio to prevent retries
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');
  }
}

// Disable body parser for Twilio webhooks (they send form-encoded)
export const config = {
  api: {
    bodyParser: true,
  },
};
