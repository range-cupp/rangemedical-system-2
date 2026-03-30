// /pages/api/cron/peptide-reminders.js
// Daily cron for peptide check-in texts
// Runs at 8:00 AM PST (0 16 * * * UTC)
// Sends ONE human-feeling check-in text per patient every 7 days
// Uses Claude AI to generate varied messages so they never feel automated
// Range Medical

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { isInQuietHours } from '../../../lib/quiet-hours';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getPacificDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
}

function daysSince(startDate) {
  const now = getPacificDate();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate + 'T12:00:00');
  start.setHours(0, 0, 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function protocolDuration(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function daysUntilEnd(endDate) {
  if (!endDate) return 999;
  const now = getPacificDate();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate + 'T12:00:00');
  end.setHours(0, 0, 0, 0);
  return Math.floor((end - now) / (1000 * 60 * 60 * 24));
}

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

// Generate a unique, human-feeling check-in message using Claude
async function generateCheckinMessage(firstName, medication, weekNum, totalWeeks) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback if no API key
    return `Hey ${firstName}, just checking in — how are you feeling? Let us know if you need anything. - Range Medical`;
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: `You write short, warm text messages for Range Medical, a regenerative medicine clinic. You are checking in on a patient who is on a peptide protocol.

Rules:
- Address them by first name
- Keep it to 1-2 casual sentences max
- Sound like a real person who cares — not a bot or a template
- Vary your opener every time (don't always start with "Hey" or "Hi")
- Ask how they're feeling or how things are going
- You can reference their peptide protocol casually but don't name the specific medication
- Do NOT ask if they want to continue, renew, reorder, or schedule anything
- Do NOT mention pricing, appointments, or next steps
- Do NOT use emojis, markdown, or formatting — plain SMS only
- Do NOT include links or URLs
- End with "- Range Medical"
- Make each message feel genuinely different from the last`,
      messages: [{
        role: 'user',
        content: `Generate a check-in text for ${firstName}. They are on week ${weekNum} of ${totalWeeks} of their peptide protocol (${medication}). This is check-in number ${weekNum} so make it feel fresh and different from previous ones. Vary the tone — sometimes warmer, sometimes more casual, sometimes brief.`
      }],
    });

    return msg.content[0].text;
  } catch (err) {
    console.error('AI message generation failed, using fallback:', err);
    // Rotate through fallback messages
    const fallbacks = [
      `Hey ${firstName}, just checking in — how are you feeling so far? Let us know if anything comes up. - Range Medical`,
      `${firstName}, hope things are going well! Just wanted to see how you're doing. - Range Medical`,
      `Checking in, ${firstName} — how's everything going? We're here if you need us. - Range Medical`,
      `${firstName}! Quick check-in from us. How are you feeling? - Range Medical`,
      `Hey ${firstName}, just touching base. How's everything going on your end? - Range Medical`,
    ];
    return fallbacks[weekNum % fallbacks.length];
  }
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

  // Check quiet hours
  const force = req.query?.force === 'true';
  if (!force && isInQuietHours()) {
    return res.status(200).json({ skipped: true, reason: 'Outside Pacific send window (8 AM – 8 PM)' });
  }

  const results = { sent: [], skipped: [], errors: [], alerts: [] };

  try {
    // Get all active peptide protocols with reminders enabled
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id, patient_id, medication, start_date, end_date,
        peptide_reminders_enabled,
        patients!inner (
          id, name, first_name, phone
        )
      `)
      .eq('status', 'active')
      .in('program_type', ['peptide', 'gh_peptide', 'peptide_vial'])
      .eq('peptide_reminders_enabled', true)
      .not('patients.phone', 'is', null);

    if (protocolsError) {
      if (protocolsError.message.includes('column')) {
        return res.status(200).json({
          success: false,
          error: 'Database columns not yet created. Run the SQL migration.',
          details: protocolsError.message
        });
      }
      throw new Error('Protocols query error: ' + protocolsError.message);
    }

    const allProtocols = protocols || [];
    console.log(`Found ${allProtocols.length} active peptide protocols with reminders enabled`);

    // Get existing check-in logs to prevent double-sends
    const protocolIds = allProtocols.map(p => p.id);
    const checkinLogTypes = [];
    for (let w = 1; w <= 20; w++) {
      checkinLogTypes.push(`peptide_checkin_week_${w}`);
    }

    const { data: existingLogs } = protocolIds.length > 0
      ? await supabase
          .from('protocol_logs')
          .select('protocol_id, log_type')
          .in('protocol_id', protocolIds)
          .in('log_type', checkinLogTypes)
      : { data: [] };

    const logSet = new Set((existingLogs || []).map(l => `${l.protocol_id}:${l.log_type}`));

    // Group protocols by patient — one text per patient per week
    const byPatient = {};
    for (const protocol of allProtocols) {
      const pid = protocol.patient_id;
      if (!byPatient[pid]) byPatient[pid] = [];
      byPatient[pid].push(protocol);
    }

    for (const [patientId, patientProtocols] of Object.entries(byPatient)) {
      const patient = patientProtocols[0].patients;
      const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');

      // Find protocols due for a check-in this week
      const dueProtocols = [];

      for (const protocol of patientProtocols) {
        const days = daysSince(protocol.start_date);
        const duration = protocolDuration(protocol.start_date, protocol.end_date);
        const totalWeeks = Math.max(1, Math.floor(duration / 7));

        if (totalWeeks < 1) continue;

        for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
          const targetDay = weekNum * 7;

          // 2-day catch-up window
          if (days >= targetDay && days <= targetDay + 2) {
            const logType = `peptide_checkin_week_${weekNum}`;
            const logKey = `${protocol.id}:${logType}`;

            if (!logSet.has(logKey)) {
              dueProtocols.push({ protocol, weekNum, logType, logKey, totalWeeks });
            }
            break;
          }
        }
      }

      if (dueProtocols.length === 0) continue;

      const phone = normalizePhone(patient.phone);
      if (!phone) {
        for (const dp of dueProtocols) {
          results.skipped.push({ patient: patient.name, protocolId: dp.protocol.id, type: `checkin_week_${dp.weekNum}`, reason: 'No phone' });
        }
        continue;
      }

      // Use the first due protocol for message context
      const primary = dueProtocols[0];
      const message = await generateCheckinMessage(
        firstName,
        primary.protocol.medication,
        primary.weekNum,
        primary.totalWeeks
      );

      const smsResult = await sendSMS({ to: phone, message });

      if (smsResult.success) {
        for (const dp of dueProtocols) {
          await logSent(dp.protocol.id, patientId, dp.logType, message);
          await logComm({
            channel: 'sms',
            messageType: dp.logType,
            message,
            source: 'peptide-reminders',
            patientId,
            protocolId: dp.protocol.id,
            patientName: patient.name,
            recipient: phone,
            twilioMessageSid: smsResult.messageSid,
          });
          logSet.add(dp.logKey);
          results.sent.push({
            patient: patient.name,
            protocolId: dp.protocol.id,
            type: `checkin_week_${dp.weekNum}_of_${dp.totalWeeks}`,
            consolidated: dueProtocols.length > 1,
          });
        }
      } else {
        for (const dp of dueProtocols) {
          results.errors.push({ patient: patient.name, protocolId: dp.protocol.id, type: `checkin_week_${dp.weekNum}`, error: smsResult.error });
        }
      }

      // Protocol ending alert (within 3 days of end_date)
      for (const protocol of patientProtocols) {
        const remaining = daysUntilEnd(protocol.end_date);
        if (remaining >= 0 && remaining <= 3) {
          const { data: existingAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('patient_id', patientId)
            .eq('alert_type', 'protocol_ending')
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();

          if (!existingAlert) {
            const endFormatted = new Date(protocol.end_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const alertMessage = `${patient.name} — ${protocol.medication} protocol ends ${endFormatted}`;

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
