import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: momReplies, error: fetchError } = await supabase
      .from('comms_log')
      .select('id, patient_id, patient_name, recipient')
      .eq('message_type', 'mothers_day_promo_link')
      .in('status', ['sent', 'delivered', 'read'])
      .lte('created_at', twoHoursAgo)
      .gte('created_at', twentyFourHoursAgo);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!momReplies || momReplies.length === 0) {
      return res.status(200).json({ ok: true, message: 'No follow-ups needed.' });
    }

    const alreadyFollowedUp = new Set();
    const { data: existing } = await supabase
      .from('comms_log')
      .select('recipient')
      .eq('message_type', 'mothers_day_followup_nudge');

    for (const row of (existing || [])) {
      alreadyFollowedUp.add(row.recipient);
    }

    const alreadyPurchased = new Set();
    const { data: purchases } = await supabase
      .from('mothers_day_promos')
      .select('purchaser_email');

    const purchasedEmails = new Set((purchases || []).map(p => p.purchaser_email));

    const patientIds = momReplies.map(r => r.patient_id).filter(Boolean);
    if (patientIds.length > 0) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, email')
        .in('id', patientIds);

      for (const p of (patients || [])) {
        if (p.email && purchasedEmails.has(p.email.toLowerCase().trim())) {
          alreadyPurchased.add(p.id);
        }
      }
    }

    const stats = { sent: 0, skipped: 0, failed: 0 };

    for (const reply of momReplies) {
      const phone = reply.recipient;

      if (alreadyFollowedUp.has(phone)) {
        stats.skipped++;
        continue;
      }

      if (reply.patient_id && alreadyPurchased.has(reply.patient_id)) {
        stats.skipped++;
        continue;
      }

      const firstName = (reply.patient_name || '').split(' ')[0] || '';
      const greeting = firstName ? `Hey ${firstName}` : 'Hey';
      const message = `${greeting} — looks like you didn't finish grabbing your Mother's Day Wellness Credit. Still available: pay $300, get $400 in credit for any Range Medical service.\n\nhttps://www.range-medical.com/mothers-day\n\nEnds Sunday night. — Range Medical`;

      const result = await sendSMS({
        to: phone,
        message,
        log: {
          messageType: 'mothers_day_followup_nudge',
          source: 'cron/mothers-day-followup',
          patientId: reply.patient_id || null,
        }
      });

      if (result.success) {
        stats.sent++;
      } else {
        stats.failed++;
      }

      alreadyFollowedUp.add(phone);
    }

    console.log(`Mother's Day follow-up: ${stats.sent} sent, ${stats.skipped} skipped, ${stats.failed} failed`);
    return res.status(200).json({ ok: true, ...stats });

  } catch (error) {
    console.error('Mother\'s Day follow-up error:', error);
    return res.status(500).json({ error: error.message });
  }
}
