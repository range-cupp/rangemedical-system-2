// POST /api/oxygen/subscribe
// Handles email opt-in for the 30-day email series
// Sends Day 1 email immediately via Resend

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { generateDay1Html } from '../../../lib/oxygen-emails';
import { logComm } from '../../../lib/comms-log';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, email } = req.body;

    if (!firstName || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Save subscriber to DB
    const { error: dbError } = await supabase
      .from('oxygen_subscribers')
      .upsert({
        email: email.toLowerCase(),
        first_name: firstName,
        subscribed_at: new Date().toISOString(),
        current_day: 1,
        status: 'active',
      }, { onConflict: 'email' });

    if (dbError) {
      console.error('Oxygen subscriber DB error:', dbError);
    }

    // Send Day 1 email
    const html = generateDay1Html({ firstName });
    const subject = 'Day 1: The one thing your blood test isn\'t telling you';

    await resend.emails.send({
      from: 'Chris Cupp <cupp@range-medical.com>',
      to: email,
      subject,
      html,
    });

    await logComm({
      channel: 'email',
      messageType: 'oxygen_day_1',
      message: subject,
      source: 'oxygen/subscribe',
      patientName: firstName,
      recipient: email,
      subject,
    });

    console.log(`[oxygen] Day 1 sent to ${firstName} <${email}>`);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Oxygen subscribe error:', error);

    await logComm({
      channel: 'email',
      messageType: 'oxygen_day_1',
      message: 'Day 1 send failed',
      source: 'oxygen/subscribe',
      recipient: req.body?.email,
      patientName: req.body?.firstName,
      status: 'error',
      errorMessage: error.message,
    }).catch(() => {});

    return res.status(500).json({ error: 'Something went wrong' });
  }
}
