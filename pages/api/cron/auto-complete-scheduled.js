// /pages/api/cron/auto-complete-scheduled.js
// Auto-complete scheduled service_log entries whose date has passed.
// When a take-home injection is dispensed, future entries are created with
// status='scheduled'. If the patient doesn't check in by the date, we
// assume they took the injection and mark it completed.
// Run daily via Vercel Cron.

import { createClient } from '@supabase/supabase-js';
import { recountProtocolSessions } from '../../../lib/recount-protocol-sessions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];

  if (!isVercelCron && cronSecret !== process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

    const { data: scheduled, error: fetchErr } = await supabase
      .from('service_logs')
      .select('id, entry_date, patient_id, protocol_id')
      .eq('status', 'scheduled')
      .lt('entry_date', today)
      .limit(500);

    if (fetchErr) throw fetchErr;

    if (!scheduled || scheduled.length === 0) {
      return res.status(200).json({ success: true, completed: 0 });
    }

    const ids = scheduled.map(s => s.id);
    const { error: updateErr } = await supabase
      .from('service_logs')
      .update({ status: 'completed' })
      .in('id', ids);

    if (updateErr) throw updateErr;

    // Recount sessions_used for each affected protocol so the count
    // reflects newly-completed take-home injections.
    const protocolIds = [...new Set(scheduled.map(s => s.protocol_id).filter(Boolean))];
    for (const pid of protocolIds) {
      await recountProtocolSessions(supabase, pid);
    }

    console.log(`[auto-complete-scheduled] Marked ${ids.length} entries as completed, recounted ${protocolIds.length} protocols`);
    return res.status(200).json({ success: true, completed: ids.length, protocols_recounted: protocolIds.length });
  } catch (error) {
    console.error('[auto-complete-scheduled] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
