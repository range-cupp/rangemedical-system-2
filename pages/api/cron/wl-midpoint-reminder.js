// /pages/api/cron/wl-midpoint-reminder.js
// Daily cron to send mid-point reminder for monthly weight loss patients
// Sends SMS to clinic when patient hits 2-week mark of their 4-week supply
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const NOTIFY_CONTACT_ID = process.env.RESEARCH_NOTIFY_CONTACT_ID || 'a2IWAaLOI1kJGJGYMCU2';

// Send SMS to clinic
async function sendClinicSMS(message) {
  if (!GHL_API_KEY) {
    console.log('Missing GHL_API_KEY');
    return { success: false };
  }

  try {
    const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId: NOTIFY_CONTACT_ID,
        message: message
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SMS error:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  // Allow GET for easy testing, POST for cron
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Verify cron secret for security
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    // Allow without secret for now, but log it
    console.log('Cron called without secret');
  }

  try {
    // Get today's date in Pacific Time
    const now = new Date();
    const pacificDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const today = pacificDate.toISOString().split('T')[0];

    // Calculate the date 14 days ago (patients who started 14 days ago are at midpoint)
    const fourteenDaysAgo = new Date(pacificDate);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const midpointStartDate = fourteenDaysAgo.toISOString().split('T')[0];

    console.log('Checking for monthly WL patients at midpoint (started on', midpointStartDate + ')');

    // Find monthly weight loss take-home protocols that started exactly 14 days ago
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('*, patients(id, name, ghl_contact_id)')
      .eq('program_type', 'weight_loss')
      .eq('delivery_method', 'take_home')
      .eq('pickup_frequency', '28')
      .eq('status', 'active')
      .eq('start_date', midpointStartDate);

    if (error) {
      console.error('Query error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Found', protocols?.length || 0, 'patients at midpoint');

    const reminders = [];

    for (const protocol of protocols || []) {
      const patientName = protocol.patients?.name || 'Unknown Patient';
      const medication = protocol.medication || 'Weight Loss';
      const dose = protocol.selected_dose || '';

      // Calculate days remaining
      const endDate = new Date(protocol.end_date + 'T12:00:00');
      const daysRemaining = Math.ceil((endDate - pacificDate) / (1000 * 60 * 60 * 24));

      const message = `📅 WL Mid-Point Check\n\n${patientName} is 2 weeks into their monthly ${medication} ${dose} supply.\n\n${daysRemaining} days until next pickup (${protocol.end_date}).\n\nConsider checking in with patient.`;

      const result = await sendClinicSMS(message);

      await logComm({
        channel: 'sms',
        messageType: 'wl_midpoint',
        message,
        source: 'wl-midpoint-reminder',
        patientId: protocol.patients?.id,
        protocolId: protocol.id,
        ghlContactId: protocol.patients?.ghl_contact_id,
        patientName,
        status: result.success ? 'sent' : 'error',
        errorMessage: result.error || null,
      });

      reminders.push({
        patient: patientName,
        sent: result.success
      });

      console.log('Mid-point reminder for', patientName, result.success ? '✓' : '✗');
    }

    return res.status(200).json({
      success: true,
      date: today,
      midpointStartDate,
      remindersCount: reminders.length,
      reminders
    });

  } catch (error) {
    console.error('Cron error:', error);
    return res.status(500).json({ error: error.message });
  }
}
