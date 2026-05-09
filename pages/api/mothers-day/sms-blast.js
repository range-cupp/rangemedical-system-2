// pages/api/mothers-day/sms-blast.js
// Mother's Day Wellness Credit SMS blast
// Sends promo text to all patients with phone numbers
// Protected by CRON_SECRET — trigger via: /api/mothers-day/sms-blast?secret=CRON_SECRET
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function buildMessage(firstName) {
  const name = firstName || '';
  const greeting = name ? `Hey ${name}, quick` : 'Hey, quick';
  return `${greeting} Mother's Day note from Range Medical — we're doing something simple this weekend: pay $300 and get $400 in Wellness Credit, good for any service over the next 12 months.\n\nGift it to Mom, or keep it — she raised you to make good decisions.\n\nReply 'MOM' and we'll text you the link. Ends Sunday night.`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dryRun = req.query.dry === 'true';
  const limit = parseInt(req.query.limit) || 0;

  try {
    // Only send to patients with active protocols (already in treatment)
    const { data: activePatientIds, error: protoError } = await supabase
      .from('protocols')
      .select('patient_id')
      .eq('status', 'active');

    if (protoError) {
      return res.status(500).json({ error: protoError.message });
    }

    const uniqueIds = [...new Set((activePatientIds || []).map(p => p.patient_id).filter(Boolean))];

    if (uniqueIds.length === 0) {
      return res.status(200).json({ ok: true, message: 'No active protocol patients found.' });
    }

    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('id, name, first_name, phone')
      .in('id', uniqueIds)
      .not('phone', 'is', null)
      .neq('phone', '');

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    const eligible = (patients || []).filter(p => {
      const phone = normalizePhone(p.phone);
      return phone && phone.length >= 10;
    });

    const toSend = limit > 0 ? eligible.slice(0, limit) : eligible;

    if (dryRun) {
      return res.status(200).json({
        dry_run: true,
        total_patients_with_phone: eligible.length,
        would_send: toSend.length,
        sample: toSend.slice(0, 5).map(p => ({
          name: p.name,
          phone: p.phone,
          message_preview: buildMessage(p.first_name).substring(0, 80) + '...'
        }))
      });
    }

    const stats = { sent: 0, failed: 0, errors: [] };

    for (const patient of toSend) {
      try {
        const phone = normalizePhone(patient.phone);
        const message = buildMessage(patient.first_name);

        const result = await sendSMS({
          to: phone,
          message,
          log: {
            messageType: 'mothers_day_promo_blast',
            source: 'mothers-day/sms-blast',
            patientId: patient.id,
          }
        });

        if (result.success) {
          stats.sent++;
        } else {
          stats.failed++;
          stats.errors.push({ name: patient.name, error: result.error });
        }

        // 200ms delay between sends to avoid rate limits
        await sleep(200);
      } catch (err) {
        stats.failed++;
        stats.errors.push({ name: patient.name, error: err.message });
      }
    }

    console.log(`Mother's Day SMS blast complete: ${stats.sent} sent, ${stats.failed} failed out of ${toSend.length}`);

    return res.status(200).json({
      ok: true,
      total_eligible: eligible.length,
      attempted: toSend.length,
      ...stats
    });

  } catch (error) {
    console.error('Mother\'s Day SMS blast error:', error);
    return res.status(500).json({ error: error.message });
  }
}
