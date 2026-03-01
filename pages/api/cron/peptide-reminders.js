// /pages/api/cron/peptide-reminders.js
// Daily cron for recovery peptide protocols
// Runs at 8:00 AM PST (0 16 * * * UTC) — handles:
//   1. Context-aware weekly check-ins (Week N of Total) with check-in form link
//   2. Protocol ending alert (internal system alert for staff follow-up)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { isRecoveryPeptide } from '../../../lib/protocol-config';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

// Get today's date in Pacific Time
function getPacificDate() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
}

// Send SMS via GHL
async function sendSMS(contactId, message) {
  if (!GHL_API_KEY || !contactId) {
    console.log('Missing GHL_API_KEY or contactId');
    return { success: false, error: 'Missing API key or contact ID' };
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
        contactId: contactId,
        message: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('GHL SMS error:', data);
      return { success: false, error: data.message || 'SMS failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, error: error.message };
  }
}

// Log a sent text to protocol_logs (prevents double-sends)
async function logSent(protocolId, patientId, logType, message) {
  try {
    await supabase.from('protocol_logs').insert({
      protocol_id: protocolId,
      patient_id: patientId,
      log_type: logType,
      log_date: new Date().toISOString().split('T')[0],
      notes: message
    });
  } catch (err) {
    console.error('Failed to log:', err);
  }
}

// Calculate days since protocol start
function daysSince(startDate) {
  const now = getPacificDate();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate + 'T12:00:00');
  start.setHours(0, 0, 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

// Calculate protocol duration in days
function protocolDuration(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

// Calculate days until protocol ends
function daysUntilEnd(endDate) {
  if (!endDate) return 999;
  const now = getPacificDate();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate + 'T12:00:00');
  end.setHours(0, 0, 0, 0);
  return Math.floor((end - now) / (1000 * 60 * 60 * 24));
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

  const results = { sent: [], skipped: [], errors: [], alerts: [] };

  try {
    // Get all active recovery peptide protocols with reminders enabled
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        medication,
        start_date,
        end_date,
        peptide_reminders_enabled,
        patients!inner (
          id,
          name,
          first_name,
          ghl_contact_id
        )
      `)
      .eq('status', 'active')
      .eq('program_type', 'peptide')
      .eq('peptide_reminders_enabled', true)
      .not('patients.ghl_contact_id', 'is', null);

    if (protocolsError) {
      if (protocolsError.message.includes('column')) {
        return res.status(200).json({
          success: false,
          error: 'Database columns not yet created. Please run the SQL migration.',
          details: protocolsError.message
        });
      }
      throw new Error('Protocols query error: ' + protocolsError.message);
    }

    // Filter to only recovery peptides
    const recoveryProtocols = (protocols || []).filter(p => isRecoveryPeptide(p.medication));
    console.log(`Found ${recoveryProtocols.length} active recovery peptide protocols with reminders enabled`);

    // Get all existing logs for these protocols to check for double-sends
    // Build log_type list dynamically — we need peptide_weekly_checkin_1 through _N
    const protocolIds = recoveryProtocols.map(p => p.id);
    const checkinLogTypes = [];
    for (let w = 1; w <= 12; w++) {
      checkinLogTypes.push(`peptide_weekly_checkin_${w}`);
    }

    const { data: existingLogs } = protocolIds.length > 0
      ? await supabase
          .from('protocol_logs')
          .select('protocol_id, log_type')
          .in('protocol_id', protocolIds)
          .in('log_type', checkinLogTypes)
      : { data: [] };

    // Build a lookup set: "protocolId:logType"
    const logSet = new Set((existingLogs || []).map(l => `${l.protocol_id}:${l.log_type}`));

    for (const protocol of recoveryProtocols) {
      const patient = protocol.patients;
      const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');
      const ghlContactId = patient.ghl_contact_id;
      const days = daysSince(protocol.start_date);
      const duration = protocolDuration(protocol.start_date, protocol.end_date);
      const totalWeeks = Math.floor(duration / 7);

      // -------------------------------------------------------
      // 1. WEEKLY CHECK-IN: fires every 7 days (with 2-day catch-up window)
      //    Context-aware: "Week N of Total"
      // -------------------------------------------------------
      if (totalWeeks >= 1) {
        let sentThisRun = false;

        for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
          const targetDay = weekNum * 7;

          // 2-day catch-up window: fire on targetDay, targetDay+1, or targetDay+2
          if (days >= targetDay && days <= targetDay + 2) {
            const logType = `peptide_weekly_checkin_${weekNum}`;
            const logKey = `${protocol.id}:${logType}`;

            if (!logSet.has(logKey)) {
              const checkinUrl = `${BASE_URL}/peptide-checkin.html?contact_id=${ghlContactId}`;
              const message = `Hi ${firstName}! Week ${weekNum} of ${totalWeeks} check-in on your recovery peptide protocol. Takes 30 seconds:\n\n${checkinUrl}\n\n- Range Medical`;

              const smsResult = await sendSMS(ghlContactId, message);
              if (smsResult.success) {
                await logSent(protocol.id, patient.id, logType, message);
                await logComm({ channel: 'sms', messageType: logType, message, source: 'peptide-reminders', patientId: patient.id, protocolId: protocol.id, ghlContactId, patientName: patient.name });
                logSet.add(logKey);
                results.sent.push({ patient: patient.name, protocolId: protocol.id, type: `weekly_checkin_${weekNum}_of_${totalWeeks}` });
              } else {
                await logComm({ channel: 'sms', messageType: logType, message, source: 'peptide-reminders', patientId: patient.id, protocolId: protocol.id, ghlContactId, patientName: patient.name, status: 'error', errorMessage: smsResult.error });
                results.errors.push({ patient: patient.name, protocolId: protocol.id, type: `weekly_checkin_${weekNum}`, error: smsResult.error });
              }
              sentThisRun = true;
              break; // Only one text per protocol per run
            }
          }
        }

        if (sentThisRun) continue;
      }

      // -------------------------------------------------------
      // 2. PROTOCOL ENDING ALERT: within 3 days of end_date
      //    Creates an internal system alert for staff follow-up
      // -------------------------------------------------------
      const remaining = daysUntilEnd(protocol.end_date);
      if (remaining >= 0 && remaining <= 3) {
        // Check if an active protocol_ending alert already exists for this protocol
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('patient_id', patient.id)
          .eq('alert_type', 'protocol_ending')
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (!existingAlert) {
          const endDateFormatted = new Date(protocol.end_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const alertMessage = `${patient.name} — ${protocol.medication} protocol ends ${endDateFormatted}`;

          const { error: alertError } = await supabase
            .from('alerts')
            .insert({
              patient_id: patient.id,
              alert_type: 'protocol_ending',
              message: alertMessage,
              severity: 'medium',
              status: 'active',
              trigger_data: {
                protocol_id: protocol.id,
                medication: protocol.medication,
                end_date: protocol.end_date,
                days_remaining: remaining
              }
            });

          if (!alertError) {
            results.alerts.push({ patient: patient.name, protocolId: protocol.id, daysRemaining: remaining });
            console.log(`Alert created: ${alertMessage}`);
          } else {
            console.error('Failed to create protocol ending alert:', alertError);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalProtocols: recoveryProtocols.length,
        sent: results.sent.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
        alerts: results.alerts.length
      },
      details: results
    });

  } catch (error) {
    console.error('Peptide reminders cron error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
