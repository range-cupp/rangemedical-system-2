// /pages/api/cron/generate-alerts.js
// Daily cron to identify at-risk patients and create alerts
// Range Medical

import { createClient } from '@supabase/supabase-js';

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
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];

    let alertsCreated = 0;

    // Get all patients with active protocols
    const { data: patients } = await supabase
      .from('patients')
      .select('id, first_name, last_name, ghl_contact_id');

    for (const patient of (patients || [])) {
      // Check if patient has active protocol
      const { data: protocols } = await supabase
        .from('protocols')
        .select('id')
        .or(`patient_id.eq.${patient.id},ghl_contact_id.eq.${patient.ghl_contact_id || 'none'}`)
        .eq('status', 'active')
        .limit(1);

      if (!protocols?.length) continue;

      // Check for existing active alert
      const { data: existingAlert } = await supabase
        .from('alerts')
        .select('id')
        .eq('patient_id', patient.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (existingAlert) continue;

      // Calculate accountability
      const { data: logs } = await supabase
        .from('injection_logs')
        .select('completed, protocol_id')
        .gte('completed_at', thirtyDaysStr);

      // Filter to this patient's protocols
      const protocolIds = protocols.map(p => p.id);
      const patientLogs = logs?.filter(l => protocolIds.includes(l.protocol_id)) || [];
      
      const total = patientLogs.length;
      const completed = patientLogs.filter(l => l.completed).length;
      const score = total > 0 ? Math.round((completed / total) * 100) : null;

      // Get last activity
      const { data: lastLog } = await supabase
        .from('daily_logs')
        .select('log_date')
        .eq('patient_id', patient.id)
        .order('log_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: lastCheckIn } = await supabase
        .from('check_ins')
        .select('check_in_date')
        .eq('patient_id', patient.id)
        .order('check_in_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastActivity = lastLog?.log_date || lastCheckIn?.check_in_date;
      const daysInactive = lastActivity
        ? Math.floor((today - new Date(lastActivity)) / 86400000)
        : 999;

      // Create alert if at-risk
      let alertType = null;
      let message = null;
      let severity = 'medium';

      if (score !== null && score < 50) {
        alertType = 'low_attendance';
        message = `Completion rate dropped to ${score}%`;
        severity = 'high';
      } else if (score !== null && score < 70) {
        alertType = 'low_attendance';
        message = `Completion rate is ${score}%`;
      } else if (daysInactive > 21) {
        alertType = 'inactive';
        message = `No activity in ${daysInactive} days`;
        severity = 'high';
      } else if (daysInactive > 14) {
        alertType = 'inactive';
        message = `No activity in ${daysInactive} days`;
      }

      // Check for score drops
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('energy_score, sleep_score, mood_score, check_in_date')
        .eq('patient_id', patient.id)
        .order('check_in_date', { ascending: false })
        .limit(3);

      if (checkIns?.length >= 2) {
        const latest = checkIns[0];
        const previous = checkIns[1];
        
        const latestAvg = (latest.energy_score + latest.sleep_score + latest.mood_score) / 3;
        const prevAvg = (previous.energy_score + previous.sleep_score + previous.mood_score) / 3;
        
        if (prevAvg - latestAvg >= 2) {
          alertType = 'score_drop';
          message = `Symptom scores dropped significantly`;
          severity = 'medium';
        }
      }

      if (alertType) {
        await supabase
          .from('alerts')
          .insert({
            patient_id: patient.id,
            alert_type: alertType,
            message,
            severity,
            trigger_data: {
              accountability_score: score,
              days_inactive: daysInactive
            }
          });
        alertsCreated++;
      }
    }

    return res.status(200).json({
      success: true,
      alerts_created: alertsCreated,
      patients_checked: patients?.length || 0
    });

  } catch (error) {
    console.error('Alert generation error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
