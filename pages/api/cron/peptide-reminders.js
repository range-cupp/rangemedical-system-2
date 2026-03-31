// /pages/api/cron/peptide-reminders.js
// Daily cron for peptide check-in texts
// Runs at 8:00 AM PST (0 16 * * * UTC)
// Simple: if a patient has any active peptide protocol, send a check-in every 7 days
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

// Generate a unique, human-feeling check-in message using Claude
async function generateCheckinMessage(firstName) {
  if (!process.env.ANTHROPIC_API_KEY) {
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
- Do NOT name any specific medication
- Do NOT mention how many weeks they've been on the protocol or how far along they are
- Do NOT reference any specific timeframe like "two weeks in" or "halfway through"
- Do NOT mention wrapping up, finishing, ending, completing, or nearing the end
- Do NOT ask if they want to continue, renew, reorder, or schedule anything
- Do NOT mention pricing, appointments, or next steps
- Do NOT use emojis, markdown, or formatting — plain SMS only
- Do NOT include links or URLs
- End with "- Range Medical"
- Make each message feel genuinely different from the last`,
      messages: [{
        role: 'user',
        content: `Generate a check-in text for ${firstName}. Just ask how they're feeling. Keep it simple and human. Use a random seed: ${Date.now()}`
      }],
    });

    return msg.content[0].text;
  } catch (err) {
    console.error('AI message generation failed, using fallback:', err);
    const fallbacks = [
      `Hey ${firstName}, just checking in — how are you feeling? Let us know if anything comes up. - Range Medical`,
      `${firstName}, hope things are going well! Just wanted to see how you're doing. - Range Medical`,
      `Checking in, ${firstName} — how's everything going? We're here if you need us. - Range Medical`,
      `${firstName}! Quick check-in from us. How are you feeling? - Range Medical`,
      `Hey ${firstName}, just touching base. How's everything going on your end? - Range Medical`,
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
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

  const results = { sent: [], skipped: [], errors: [] };
  const today = todayPacific();

  try {
    // Get all active peptide protocols with reminders enabled
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id, patient_id, medication,
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

    // Group by patient — one text per patient, regardless of how many protocols
    const byPatient = {};
    for (const protocol of allProtocols) {
      const pid = protocol.patient_id;
      if (!byPatient[pid]) byPatient[pid] = { patient: protocol.patients, protocols: [] };
      byPatient[pid].protocols.push(protocol);
    }

    // For each patient, check when their last peptide check-in was sent
    const patientIds = Object.keys(byPatient);
    if (patientIds.length === 0) {
      return res.status(200).json({ success: true, summary: { totalPatients: 0, sent: 0, skipped: 0, errors: 0 }, details: results });
    }

    // Get the most recent peptide_checkin log per patient
    const { data: recentLogs } = await supabase
      .from('protocol_logs')
      .select('patient_id, log_date')
      .in('patient_id', patientIds)
      .like('log_type', 'peptide_checkin%')
      .order('log_date', { ascending: false });

    // Build map of patient_id -> most recent check-in date
    const lastCheckinMap = {};
    for (const log of (recentLogs || [])) {
      if (!lastCheckinMap[log.patient_id]) {
        lastCheckinMap[log.patient_id] = log.log_date;
      }
    }

    for (const [patientId, { patient, protocols: patientProtocols }] of Object.entries(byPatient)) {
      const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');

      // Check if it's been at least 7 days since last check-in
      const lastCheckin = lastCheckinMap[patientId];
      if (lastCheckin) {
        const lastDate = new Date(lastCheckin + 'T12:00:00');
        const todayDate = new Date(today + 'T12:00:00');
        const daysSinceLast = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        if (daysSinceLast < 7) {
          results.skipped.push({ patient: patient.name, reason: `Last check-in ${daysSinceLast} days ago` });
          continue;
        }
      }

      const phone = normalizePhone(patient.phone);
      if (!phone) {
        results.skipped.push({ patient: patient.name, reason: 'No phone' });
        continue;
      }

      const message = await generateCheckinMessage(firstName);
      const smsResult = await sendSMS({ to: phone, message });

      if (smsResult.success) {
        // Log against the first active protocol
        const primaryProtocol = patientProtocols[0];
        await supabase.from('protocol_logs').insert({
          protocol_id: primaryProtocol.id,
          patient_id: patientId,
          log_type: 'peptide_checkin',
          log_date: today,
          notes: message
        });
        await logComm({
          channel: 'sms',
          messageType: 'peptide_checkin',
          message,
          source: 'peptide-reminders',
          patientId,
          protocolId: primaryProtocol.id,
          patientName: patient.name,
          recipient: phone,
          twilioMessageSid: smsResult.messageSid,
        });
        results.sent.push({ patient: patient.name, protocolCount: patientProtocols.length });
      } else {
        results.errors.push({ patient: patient.name, error: smsResult.error });
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalProtocols: allProtocols.length,
        totalPatients: patientIds.length,
        sent: results.sent.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      details: results
    });

  } catch (error) {
    console.error('Peptide reminders cron error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
