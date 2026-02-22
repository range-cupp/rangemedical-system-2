// /pages/api/cron/wl-midpoint-reminder.js
// Daily cron to send mid-point reminder for monthly weight loss patients
// Sends SMS to clinic when patient hits 2-week mark of their 4-week supply
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendStaffSMS } from '../../../lib/twilio';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Send SMS to clinic staff via Twilio
async function sendClinicSMS(message) {
  const result = await sendStaffSMS(message);
  return result ? { success: true } : { success: false, error: 'SMS failed' };
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
