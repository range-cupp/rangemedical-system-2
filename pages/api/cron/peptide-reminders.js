// /pages/api/cron/peptide-reminders.js
// Daily cron to send recovery peptide SMS automations
// Runs at 8:00 AM PST (0 16 * * * UTC) — handles:
//   1. 10-day protocol day-7 follow-up
//   2. 30-day protocol weekly check-ins (day 7, 14, 21) with check-in form link
//   3. 30-day protocol re-up text (~day 25, cycle-aware)
//   4. Follow-up reminder if check-in not completed (day after check-in was due)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { isRecoveryPeptide, RECOVERY_CYCLE_MAX_DAYS } from '../../../lib/protocol-config';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

// Get today's date string in Pacific Time (YYYY-MM-DD)
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

// Get cycle days used for a patient's recovery peptide cycle
async function getCycleDaysUsed(patientId, cycleStartDate) {
  const { data: cycleProtocols } = await supabase
    .from('protocols')
    .select('id, start_date, end_date')
    .eq('patient_id', patientId)
    .eq('program_type', 'peptide')
    .eq('cycle_start_date', cycleStartDate)
    .not('status', 'in', '("cancelled","merged")');

  if (!cycleProtocols || cycleProtocols.length === 0) return 0;

  let totalDays = 0;
  for (const p of cycleProtocols) {
    const s = new Date(p.start_date + 'T12:00:00');
    const e = p.end_date ? new Date(p.end_date + 'T12:00:00') : new Date();
    totalDays += Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
  }
  return totalDays;
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

  const results = { sent: [], skipped: [], errors: [] };

  try {
    // Get all active peptide protocols with reminders enabled
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        medication,
        start_date,
        end_date,
        cycle_start_date,
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
    const protocolIds = recoveryProtocols.map(p => p.id);
    const { data: existingLogs } = protocolIds.length > 0
      ? await supabase
          .from('protocol_logs')
          .select('protocol_id, log_type')
          .in('protocol_id', protocolIds)
          .in('log_type', [
            'peptide_followup', 'peptide_reup',
            'peptide_weekly_checkin_1', 'peptide_weekly_checkin_2', 'peptide_weekly_checkin_3',
            'peptide_checkin_followup_1', 'peptide_checkin_followup_2', 'peptide_checkin_followup_3',
            'peptide_checkin'
          ])
      : { data: [] };

    // Build a lookup set: "protocolId:logType"
    const logSet = new Set((existingLogs || []).map(l => `${l.protocol_id}:${l.log_type}`));

    for (const protocol of recoveryProtocols) {
      const patient = protocol.patients;
      const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');
      const ghlContactId = patient.ghl_contact_id;
      const days = daysSince(protocol.start_date);
      const duration = protocolDuration(protocol.start_date, protocol.end_date);

      // -------------------------------------------------------
      // 1. 10-DAY FOLLOW-UP: duration 8-14 days, fires day 7-9
      // -------------------------------------------------------
      if (duration >= 8 && duration <= 14 && days >= 7 && days <= 9) {
        const logKey = `${protocol.id}:peptide_followup`;
        if (!logSet.has(logKey)) {
          const message = `Hi ${firstName}! It's been about a week on your recovery peptide protocol. How are you feeling? Most patients see the best results with 20-30 days of continued use. Let us know if you'd like to keep going — we're here to help! - Range Medical`;

          const smsResult = await sendSMS(ghlContactId, message);
          if (smsResult.success) {
            await logSent(protocol.id, patient.id, 'peptide_followup', message);
            await logComm({ channel: 'sms', messageType: 'peptide_followup', message, source: 'peptide-reminders', patientId: patient.id, protocolId: protocol.id, ghlContactId, patientName: patient.name });
            logSet.add(logKey);
            results.sent.push({ patient: patient.name, protocolId: protocol.id, type: 'followup' });
          } else {
            await logComm({ channel: 'sms', messageType: 'peptide_followup', message, source: 'peptide-reminders', patientId: patient.id, protocolId: protocol.id, ghlContactId, patientName: patient.name, status: 'error', errorMessage: smsResult.error });
            results.errors.push({ patient: patient.name, protocolId: protocol.id, type: 'followup', error: smsResult.error });
          }
          continue; // Only one text per protocol per run
        }
      }

      // -------------------------------------------------------
      // 2. 30-DAY WEEKLY CHECK-IN: duration 25-35 days, day 7/14/21
      // -------------------------------------------------------
      if (duration >= 25 && duration <= 35) {
        // Determine which week check-in to send (with 2-day window each)
        let weekNum = null;
        if (days >= 7 && days <= 9) weekNum = 1;
        else if (days >= 14 && days <= 16) weekNum = 2;
        else if (days >= 21 && days <= 23) weekNum = 3;

        if (weekNum) {
          const logType = `peptide_weekly_checkin_${weekNum}`;
          const logKey = `${protocol.id}:${logType}`;
          if (!logSet.has(logKey)) {
            const checkinUrl = `${BASE_URL}/peptide-checkin.html?contact_id=${ghlContactId}`;
            const message = `Hi ${firstName}! Week ${weekNum} check-in on your recovery peptide protocol. Takes 30 seconds:\n\n${checkinUrl}\n\n- Range Medical`;

            const smsResult = await sendSMS(ghlContactId, message);
            if (smsResult.success) {
              await logSent(protocol.id, patient.id, logType, message);
              await logComm({ channel: 'sms', messageType: logType, message, source: 'peptide-reminders', patientId: patient.id, protocolId: protocol.id, ghlContactId, patientName: patient.name });
              logSet.add(logKey);
              results.sent.push({ patient: patient.name, protocolId: protocol.id, type: `weekly_checkin_${weekNum}` });
            } else {
              await logComm({ channel: 'sms', messageType: logType, message, source: 'peptide-reminders', patientId: patient.id, protocolId: protocol.id, ghlContactId, patientName: patient.name, status: 'error', errorMessage: smsResult.error });
              results.errors.push({ patient: patient.name, protocolId: protocol.id, type: `weekly_checkin_${weekNum}`, error: smsResult.error });
            }
            continue;
          }
        }

        // -------------------------------------------------------
        // 2B. CHECK-IN FOLLOW-UP: fires day 8/15/22 if no response
        // -------------------------------------------------------
        let followupWeek = null;
        if (days >= 8 && days <= 10) followupWeek = 1;
        else if (days >= 15 && days <= 17) followupWeek = 2;
        else if (days >= 22 && days <= 24) followupWeek = 3;

        if (followupWeek) {
          const followupLogType = `peptide_checkin_followup_${followupWeek}`;
          const followupLogKey = `${protocol.id}:${followupLogType}`;
          const checkinLogKey = `${protocol.id}:peptide_checkin`;

          // Only send follow-up if: check-in reminder was sent BUT no check-in response received
          const reminderWasSent = logSet.has(`${protocol.id}:peptide_weekly_checkin_${followupWeek}`);
          const alreadyFollowedUp = logSet.has(followupLogKey);

          // Check for actual check-in response near this week's expected date
          let hasCheckinResponse = false;
          if (reminderWasSent && !alreadyFollowedUp) {
            const expectedDay = followupWeek * 7; // day 7, 14, 21
            const startParts = protocol.start_date.split('-');
            const checkStart = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
            checkStart.setDate(checkStart.getDate() + expectedDay - 3); // 3 days before
            const checkEnd = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
            checkEnd.setDate(checkEnd.getDate() + expectedDay + 3); // 3 days after

            const { data: checkinLogs } = await supabase
              .from('protocol_logs')
              .select('id')
              .eq('protocol_id', protocol.id)
              .eq('log_type', 'peptide_checkin')
              .gte('log_date', checkStart.toISOString().split('T')[0])
              .lte('log_date', checkEnd.toISOString().split('T')[0])
              .limit(1);

            hasCheckinResponse = (checkinLogs && checkinLogs.length > 0);
          }

          if (reminderWasSent && !alreadyFollowedUp && !hasCheckinResponse) {
            const checkinUrl = `${BASE_URL}/peptide-checkin.html?contact_id=${ghlContactId}`;
            const message = `Hi ${firstName}! Just a quick follow-up — we haven't received your Week ${followupWeek} check-in yet. It only takes 30 seconds:\n\n${checkinUrl}\n\nYour feedback helps us make sure your recovery is on track. - Range Medical`;

            const smsResult = await sendSMS(ghlContactId, message);
            if (smsResult.success) {
              await logSent(protocol.id, patient.id, followupLogType, message);
              await logComm({ channel: 'sms', messageType: followupLogType, message, source: 'peptide-reminders', patientId: patient.id, protocolId: protocol.id, ghlContactId, patientName: patient.name });
              logSet.add(followupLogKey);
              results.sent.push({ patient: patient.name, protocolId: protocol.id, type: `checkin_followup_${followupWeek}` });
            } else {
              results.errors.push({ patient: patient.name, protocolId: protocol.id, type: `checkin_followup_${followupWeek}`, error: smsResult.error });
            }
            continue;
          }
        }

        // -------------------------------------------------------
        // 3. 30-DAY RE-UP: fires day 25-27, cycle-aware
        // -------------------------------------------------------
        if (days >= 25 && days <= 27) {
          const logKey = `${protocol.id}:peptide_reup`;
          if (!logSet.has(logKey)) {
            let message;

            // Check cycle status to determine which re-up message
            if (protocol.cycle_start_date) {
              const cycleDaysUsed = await getCycleDaysUsed(protocol.patient_id, protocol.cycle_start_date);
              const nearCycleEnd = cycleDaysUsed >= (RECOVERY_CYCLE_MAX_DAYS - 14); // within 14 days of 90-day limit

              if (nearCycleEnd) {
                message = `Hi ${firstName}! Your current peptide supply is wrapping up, and you're nearing the end of your 90-day cycle. After this round, a 2-week rest period is recommended before starting again. Let us know if you have any questions about next steps! - Range Medical`;
              } else {
                message = `Hi ${firstName}! Your current peptide supply is almost done. Ready for another 30 days? Most patients see continued improvement with extended use. Reply or call us to get your next round started. - Range Medical`;
              }
            } else {
              // No cycle tracking — use default re-up
              message = `Hi ${firstName}! Your current peptide supply is almost done. Ready for another 30 days? Most patients see continued improvement with extended use. Reply or call us to get your next round started. - Range Medical`;
            }

            const smsResult = await sendSMS(ghlContactId, message);
            if (smsResult.success) {
              await logSent(protocol.id, patient.id, 'peptide_reup', message);
              await logComm({ channel: 'sms', messageType: 'peptide_reup', message, source: 'peptide-reminders', patientId: patient.id, protocolId: protocol.id, ghlContactId, patientName: patient.name });
              logSet.add(logKey);
              results.sent.push({ patient: patient.name, protocolId: protocol.id, type: 'reup' });
            } else {
              await logComm({ channel: 'sms', messageType: 'peptide_reup', message, source: 'peptide-reminders', patientId: patient.id, protocolId: protocol.id, ghlContactId, patientName: patient.name, status: 'error', errorMessage: smsResult.error });
              results.errors.push({ patient: patient.name, protocolId: protocol.id, type: 'reup', error: smsResult.error });
            }
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
        errors: results.errors.length
      },
      details: results
    });

  } catch (error) {
    console.error('Peptide reminders cron error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
