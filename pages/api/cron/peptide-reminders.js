// /pages/api/cron/peptide-reminders.js
// Daily cron for peptide protocols
// Runs at 8:00 AM PST (0 16 * * * UTC) — handles:
//   1. Weekly check-ins — ONE text per patient per week (consolidated across all peptide protocols)
//   2. Protocol ending alert (internal system alert for staff follow-up)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../lib/blooio-optin';
import { isInQuietHours } from '../../../lib/quiet-hours';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

// Get today's date in Pacific Time
function getPacificDate() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
}

// Log a sent text to protocol_logs (prevents double-sends)
async function logSent(protocolId, patientId, logType, message) {
  try {
    await supabase.from('protocol_logs').insert({
      protocol_id: protocolId,
      patient_id: patientId,
      log_type: logType,
      log_date: todayPacific(),
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

  // Check quiet hours (skip if outside 8am-8pm Pacific, unless forced)
  const force = req.query?.force === 'true';
  if (!force && isInQuietHours()) {
    return res.status(200).json({ skipped: true, reason: 'Outside Pacific send window (8 AM – 8 PM)' });
  }

  const results = { sent: [], skipped: [], errors: [], alerts: [] };

  try {
    // Get all active peptide protocols with reminders enabled
    // No medication filter — if staff enabled reminders, it should get them
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
          phone,
          ghl_contact_id
        )
      `)
      .eq('status', 'active')
      .eq('program_type', 'peptide')
      .eq('peptide_reminders_enabled', true)
      .not('patients.phone', 'is', null);

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

    const allProtocols = protocols || [];
    console.log(`Found ${allProtocols.length} active peptide protocols with reminders enabled`);

    // Get all existing logs for these protocols to check for double-sends
    const protocolIds = allProtocols.map(p => p.id);
    const checkinLogTypes = [];
    for (let w = 1; w <= 20; w++) {
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

    // -------------------------------------------------------
    // Group protocols by patient_id for consolidated check-ins
    // One text per patient per week, regardless of protocol count
    // -------------------------------------------------------
    const byPatient = {};
    for (const protocol of allProtocols) {
      const pid = protocol.patient_id;
      if (!byPatient[pid]) byPatient[pid] = [];
      byPatient[pid].push(protocol);
    }

    for (const [patientId, patientProtocols] of Object.entries(byPatient)) {
      const patient = patientProtocols[0].patients;
      const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');
      const ghlContactId = patient.ghl_contact_id;

      // -------------------------------------------------------
      // 1. WEEKLY CHECK-IN: Consolidated — one text per patient
      //    Collect all protocols that are due, send ONE SMS, log each
      // -------------------------------------------------------
      const dueProtocols = []; // { protocol, weekNum, logType }

      for (const protocol of patientProtocols) {
        const days = daysSince(protocol.start_date);
        const duration = protocolDuration(protocol.start_date, protocol.end_date);
        const totalWeeks = Math.floor(duration / 7);

        if (totalWeeks < 1) continue;

        for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
          const targetDay = weekNum * 7;

          // 2-day catch-up window
          if (days >= targetDay && days <= targetDay + 2) {
            const logType = `peptide_weekly_checkin_${weekNum}`;
            const logKey = `${protocol.id}:${logType}`;

            if (!logSet.has(logKey)) {
              dueProtocols.push({ protocol, weekNum, logType, logKey, totalWeeks });
            }
            break; // Only one check-in per protocol per run
          }
        }
      }

      // If any protocols are due, send ONE text for this patient
      if (dueProtocols.length > 0) {
        const phone = normalizePhone(patient.phone);
        if (!phone) {
          for (const dp of dueProtocols) {
            results.skipped.push({ patient: patient.name, protocolId: dp.protocol.id, type: `weekly_checkin_${dp.weekNum}`, reason: 'No phone number' });
          }
          // Still process ending alerts below
        } else {
          const checkinUrl = `${BASE_URL}/peptide-checkin.html?contact_id=${ghlContactId || patientId}`;
          const message = `Hi ${firstName}! Time for your peptide check-in. Takes 30 seconds:\n\n${checkinUrl}\n\n- Range Medical`;

          // Blooio two-step: if first contact, send link-free version + queue link message
          const needsBlooioOptIn = isBlooioProvider() && !(await hasBlooioOptIn(phone));

          if (needsBlooioOptIn) {
            const optInMessage = `Hi ${firstName}! Time for your peptide check-in. Reply YES to get your check-in link. - Range Medical`;
            const optInResult = await sendSMS({ to: phone, message: optInMessage });
            if (optInResult.success) {
              await queuePendingLinkMessage({
                phone,
                message,
                messageType: 'peptide_weekly_checkin',
                patientId,
                patientName: patient.name,
              });
              // Log for each due protocol
              for (const dp of dueProtocols) {
                await logSent(dp.protocol.id, patientId, dp.logType, optInMessage);
                logSet.add(dp.logKey);
                results.sent.push({ patient: patient.name, protocolId: dp.protocol.id, type: `weekly_checkin_${dp.weekNum}_of_${dp.totalWeeks}`, twoStep: true, consolidated: dueProtocols.length > 1 });
              }
              await logComm({ channel: 'sms', messageType: 'blooio_optin_request', message: optInMessage, source: 'peptide-reminders', patientId, ghlContactId, patientName: patient.name, recipient: phone, twilioMessageSid: optInResult.messageSid });
            } else {
              for (const dp of dueProtocols) {
                results.errors.push({ patient: patient.name, protocolId: dp.protocol.id, type: `weekly_checkin_${dp.weekNum}`, error: optInResult.error });
              }
            }
          } else {
            const smsResult = await sendSMS({ to: phone, message });
            if (smsResult.success) {
              // Log for each due protocol so per-protocol dedup still works
              for (const dp of dueProtocols) {
                await logSent(dp.protocol.id, patientId, dp.logType, message);
                await logComm({ channel: 'sms', messageType: dp.logType, message, source: 'peptide-reminders', patientId, protocolId: dp.protocol.id, ghlContactId, patientName: patient.name, recipient: phone, twilioMessageSid: smsResult.messageSid });
                logSet.add(dp.logKey);
                results.sent.push({ patient: patient.name, protocolId: dp.protocol.id, type: `weekly_checkin_${dp.weekNum}_of_${dp.totalWeeks}`, consolidated: dueProtocols.length > 1 });
              }
            } else {
              for (const dp of dueProtocols) {
                await logComm({ channel: 'sms', messageType: dp.logType, message, source: 'peptide-reminders', patientId, protocolId: dp.protocol.id, ghlContactId, patientName: patient.name, recipient: phone, status: 'error', errorMessage: smsResult.error });
                results.errors.push({ patient: patient.name, protocolId: dp.protocol.id, type: `weekly_checkin_${dp.weekNum}`, error: smsResult.error });
              }
            }
          }
        }
      }

      // -------------------------------------------------------
      // 2. PROTOCOL ENDING ALERT: within 3 days of end_date
      //    Creates an internal system alert for staff follow-up
      //    (stays per-protocol — these are staff alerts, not patient texts)
      // -------------------------------------------------------
      for (const protocol of patientProtocols) {
        const remaining = daysUntilEnd(protocol.end_date);
        if (remaining >= 0 && remaining <= 3) {
          // Check if an active protocol_ending alert already exists for this protocol
          const { data: existingAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('patient_id', patientId)
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
                patient_id: patientId,
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
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalProtocols: allProtocols.length,
        uniquePatients: Object.keys(byPatient).length,
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
