// /pages/api/cron/wl-midpoint-reminder.js
// Daily cron to send mid-point reminder for monthly weight loss patients
// Sends SMS to clinic when patient hits 2-week mark of their 4-week supply
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { isInQuietHours } from '../../../lib/quiet-hours';
import { postToStaffChannel } from '../../../lib/post-to-staff-channel';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

  // Check quiet hours (skip if outside 8am-8pm Pacific, unless forced)
  const force = req.query?.force === 'true';
  if (!force && isInQuietHours()) {
    return res.status(200).json({ skipped: true, reason: 'Outside Pacific send window (8 AM – 8 PM)' });
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
      .ilike('program_type', 'weight_loss%')
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

      const result = await postToStaffChannel({
        channelName: 'WL Check-ins',
        memberEmails: ['damon@range-medical.com', 'tara@range-medical.com', 'burgess@range-medical.com'],
        content: message,
        pushPayload: {
          title: `WL Mid-Point: ${patientName}`,
          body: `${daysRemaining} days until pickup`,
        },
      });

      reminders.push({
        patient: patientName,
        sent: !!result?.ok,
      });

      console.log('Mid-point reminder for', patientName, result?.ok ? '✓' : '✗');
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
