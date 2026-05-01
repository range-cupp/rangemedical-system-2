// POST /api/daily/subscribe
// Public endpoint: landing page email capture form posts here.
// Inserts subscriber, sends welcome email 1 immediately.

import { createClient } from '@supabase/supabase-js';
import { sendWelcomeStep } from '../../../lib/daily-emails';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawEmail = (req.body?.email || '').toString().trim().toLowerCase();
    if (!rawEmail || !EMAIL_RX.test(rawEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email.' });
    }

    // Defensive: don't re-add anyone on the permanent suppression list.
    const { data: suppressed } = await supabase
      .from('daily_unsubscribes')
      .select('id')
      .eq('email', rawEmail)
      .maybeSingle();

    if (suppressed) {
      // Don't reveal status — just say "you're in" so we don't leak suppression info,
      // and don't actually send anything.
      return res.status(200).json({ success: true });
    }

    const utm = {
      utm_source: req.body?.utm_source || null,
      utm_medium: req.body?.utm_medium || null,
      utm_campaign: req.body?.utm_campaign || null,
      ip: req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || null,
      user_agent: req.headers['user-agent'] || null,
    };

    // Upsert subscriber. If they already exist + unsubscribed, reactivate.
    const { data: existing } = await supabase
      .from('daily_subscribers')
      .select('id, status, welcome_sequence_started_at')
      .eq('email', rawEmail)
      .maybeSingle();

    let subscriber;

    if (existing) {
      const { data: updated, error: updErr } = await supabase
        .from('daily_subscribers')
        .update({
          status: 'active',
          unsubscribed_at: null,
          // Re-fire welcome only if it never started before.
          welcome_sequence_started_at: existing.welcome_sequence_started_at || new Date().toISOString(),
          metadata: { ...utm, source: 'landing_page' },
        })
        .eq('id', existing.id)
        .select('id, welcome_sequence_started_at')
        .single();
      if (updErr) throw updErr;
      subscriber = updated;
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('daily_subscribers')
        .insert({
          email: rawEmail,
          source: 'landing_page',
          status: 'active',
          welcome_sequence_started_at: new Date().toISOString(),
          metadata: utm,
        })
        .select('id, welcome_sequence_started_at')
        .single();
      if (insErr) throw insErr;
      subscriber = inserted;
    }

    // Has welcome step 1 already been sent to this subscriber?
    const { data: alreadySent } = await supabase
      .from('daily_sends')
      .select('id')
      .eq('subscriber_id', subscriber.id)
      .eq('welcome_sequence_step', 1)
      .maybeSingle();

    if (!alreadySent) {
      try {
        const { messageId } = await sendWelcomeStep({
          subscriberId: subscriber.id,
          email: rawEmail,
          step: 1,
        });
        await supabase.from('daily_sends').insert({
          subscriber_id: subscriber.id,
          welcome_sequence_step: 1,
          resend_message_id: messageId,
        });
        await supabase
          .from('daily_subscribers')
          .update({ last_sent_at: new Date().toISOString() })
          .eq('id', subscriber.id);
      } catch (sendErr) {
        // Don't fail the signup if email send hiccups — log and move on.
        console.error('[daily/subscribe] welcome 1 send failed:', sendErr.message);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[daily/subscribe] error:', err);
    return res.status(500).json({ error: 'Something went wrong. Try again in a sec.' });
  }
}
