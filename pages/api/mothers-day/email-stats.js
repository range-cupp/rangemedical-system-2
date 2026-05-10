import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: emails } = await supabase
      .from('comms_log')
      .select('id, patient_name, recipient, status, created_at, twilio_message_sid')
      .eq('message_type', 'mothers_day_promo_blast')
      .eq('channel', 'email')
      .order('created_at');

    const total = emails?.length || 0;

    let opened = 0;
    let delivered = 0;
    let bounced = 0;
    let complained = 0;
    const openedList = [];
    const bouncedList = [];

    for (const email of (emails || [])) {
      const resendId = email.twilio_message_sid;
      if (!resendId) {
        delivered++;
        continue;
      }

      try {
        const resp = await fetch(`https://api.resend.com/emails/${resendId}`, {
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` },
        });
        if (!resp.ok) {
          delivered++;
          continue;
        }
        const data = await resp.json();
        const lastEvent = data.last_event;

        if (lastEvent === 'opened' || lastEvent === 'clicked') {
          opened++;
          delivered++;
          openedList.push({ name: email.patient_name, email: email.recipient });
        } else if (lastEvent === 'bounced') {
          bounced++;
          bouncedList.push({ name: email.patient_name, email: email.recipient });
        } else if (lastEvent === 'complained') {
          complained++;
        } else {
          delivered++;
        }
      } catch {
        delivered++;
      }
    }

    return res.status(200).json({
      total,
      delivered,
      opened,
      bounced,
      complained,
      open_rate: total > 0 ? `${((opened / total) * 100).toFixed(1)}%` : '0%',
      opened_sample: openedList.slice(0, 20),
      bounced_list: bouncedList,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
