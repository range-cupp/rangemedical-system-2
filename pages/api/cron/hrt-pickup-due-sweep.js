// /pages/api/cron/hrt-pickup-due-sweep.js
// Auto-move HRT pipeline cards into/out of the "pickup_due" stage based on
// each protocol's next_expected_date.
//
// Logic:
//   - Card in `active` and protocol.next_expected_date <= today + 7 days → move to `pickup_due`
//     (includes overdue cards — anything not yet picked up shows here)
//   - Card in `pickup_due` and protocol.next_expected_date > today + 7 days → move to `active`
//     (refill happened, next pickup pushed out, no longer urgent)
//
// Stages other than `active` / `pickup_due` are left alone — staff manage labs_due,
// followup_due, at_risk, completed, started by hand. No patient comms here.
//
// Run daily via Vercel Cron. Supports ?force=true for manual testing.
// Range Medical

import { createClient } from '@supabase/supabase-js';

const PICKUP_WINDOW_DAYS = 7;

export default async function handler(req, res) {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );
  if (!isAuthorized) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + PICKUP_WINDOW_DAYS);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const movedToPickup = [];
  const movedToActive = [];
  const errors = [];

  try {
    const { data: hrtCards, error: cardsErr } = await supabase
      .from('pipeline_cards')
      .select('id, stage, protocol_id, patient_id')
      .eq('pipeline', 'hrt')
      .eq('status', 'active')
      .in('stage', ['active', 'pickup_due']);

    if (cardsErr) throw cardsErr;
    if (!hrtCards || hrtCards.length === 0) {
      return res.status(200).json({
        success: true,
        moved_to_pickup: 0,
        moved_to_active: 0,
        run_at: new Date().toISOString(),
      });
    }

    const protocolIds = [...new Set(hrtCards.map(c => c.protocol_id).filter(Boolean))];
    const protocolsById = {};
    if (protocolIds.length) {
      const { data: protos, error: protoErr } = await supabase
        .from('protocols')
        .select('id, next_expected_date')
        .in('id', protocolIds);
      if (protoErr) throw protoErr;
      for (const p of protos || []) protocolsById[p.id] = p;
    }

    const { moveCard } = await import('../../../lib/pipelines-server');

    for (const card of hrtCards) {
      const proto = card.protocol_id ? protocolsById[card.protocol_id] : null;
      const nextDate = proto?.next_expected_date || null;

      if (card.stage === 'active') {
        if (nextDate && nextDate <= cutoffStr) {
          try {
            await moveCard({
              card_id: card.id,
              to_stage: 'pickup_due',
              triggered_by: 'automation',
              automation_reason: 'pickup_window_reached',
            });
            movedToPickup.push(card.id);
          } catch (e) {
            errors.push({ card_id: card.id, error: e.message });
          }
        }
      } else if (card.stage === 'pickup_due') {
        if (!nextDate || nextDate > cutoffStr) {
          try {
            await moveCard({
              card_id: card.id,
              to_stage: 'active',
              triggered_by: 'automation',
              automation_reason: 'pickup_complete',
            });
            movedToActive.push(card.id);
          } catch (e) {
            errors.push({ card_id: card.id, error: e.message });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      moved_to_pickup: movedToPickup.length,
      moved_to_active: movedToActive.length,
      cutoff_date: cutoffStr,
      errors: errors.length > 0 ? errors : undefined,
      run_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('hrt-pickup-due-sweep error:', error);
    return res.status(500).json({ error: error.message });
  }
}
