// /pages/api/cron/hrt-lab-reminders.js
// Daily cron to send staff SMS with upcoming HRT lab draws
// Runs at 9:00 AM PST (0 17 * * * UTC)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { getHRTLabSchedule, matchDrawsToLogs } from '../../../lib/hrt-lab-schedule';
import { sendStaffSMS } from '../../../lib/ghl-sync';

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

  try {
    // Get all active HRT protocols with patient info
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        start_date,
        patients!inner (
          id,
          name,
          phone
        )
      `)
      .ilike('program_type', '%hrt%')
      .eq('status', 'active');

    if (protocolsError) {
      throw new Error('Protocols query error: ' + protocolsError.message);
    }

    const upcomingDraws = [];
    const now = new Date();
    const fourteenDaysFromNow = new Date(now);
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

    for (const protocol of (protocols || [])) {
      if (!protocol.start_date) continue;

      const schedule = getHRTLabSchedule(protocol.start_date);

      // Get blood draw logs for this protocol
      const { data: bloodDrawLogs } = await supabase
        .from('protocol_logs')
        .select('id, log_date, notes')
        .eq('protocol_id', protocol.id)
        .eq('log_type', 'blood_draw');

      // Get labs for this patient
      const { data: labs } = await supabase
        .from('labs')
        .select('lab_date, collection_date, completed_date')
        .eq('patient_id', protocol.patient_id);

      const matched = matchDrawsToLogs(schedule, bloodDrawLogs || [], labs || []);

      for (const draw of matched) {
        if (draw.status !== 'upcoming') continue;
        const targetDate = new Date(draw.targetDate + 'T00:00:00');
        if (targetDate <= fourteenDaysFromNow) {
          upcomingDraws.push({
            patientName: protocol.patients.name,
            label: draw.label,
            weekLabel: draw.weekLabel,
            targetDate: draw.targetDate,
          });
        }
      }
    }

    // Skip sending if no upcoming draws
    if (upcomingDraws.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No upcoming lab draws in the next 14 days',
        sent: false,
      });
    }

    // Build consolidated SMS
    const lines = upcomingDraws.map(d =>
      `\u2022 ${d.patientName} \u2014 ${d.label} (${d.weekLabel})`
    );
    const message = `Lab Draw Reminders:\n${lines.join('\n')}`;

    const smsResult = await sendStaffSMS(message);

    return res.status(200).json({
      success: true,
      sent: !!smsResult,
      upcomingDraws,
      message: smsResult ? 'SMS sent' : 'SMS failed',
    });

  } catch (error) {
    console.error('HRT lab reminders cron error:', error);
    return res.status(500).json({ error: error.message });
  }
}
