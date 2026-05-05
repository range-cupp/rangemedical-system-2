// One-time admin endpoint to spawn take-home injection rows for every
// existing WL take-home pickup in the configured window. The spawn helper
// is idempotent (skips slots within ±3 days of existing injection/session
// rows), so re-running is safe.
//
// POST /api/admin/backfill-takehome-spawn?days=60&secret=...

import { createClient } from '@supabase/supabase-js';
import { spawnTakeHomeInjections } from '../../../lib/spawn-takehome-injections';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  if (req.query.secret !== process.env.CRON_SECRET) return res.status(403).json({ error: 'Forbidden' });

  const days = parseInt(req.query.days || '60');
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  const { data: pickups, error } = await supabase
    .from('service_logs')
    .select('id, patient_id, protocol_id, entry_date, dosage, medication, quantity, fulfillment_method, notes')
    .eq('category', 'weight_loss')
    .eq('entry_type', 'pickup')
    .gte('entry_date', sinceStr)
    .neq('fulfillment_method', 'in_clinic_injections')
    .order('entry_date');

  if (error) return res.status(500).json({ error: error.message });

  const protoIds = [...new Set(pickups.map(p => p.protocol_id).filter(Boolean))];
  const { data: protos } = await supabase
    .from('protocols')
    .select('id, frequency, injection_day, medication, selected_dose, dose, total_sessions, sessions_used')
    .in('id', protoIds);
  const byId = Object.fromEntries(protos.map(p => [p.id, p]));

  const summary = {
    pickupsScanned: pickups.length,
    pickupsSkipped: 0,
    totalSpawned: 0,
    totalSlotsSkipped: 0,
    affectedProtocols: 0,
    errored: 0,
  };
  const affected = new Set();
  const errors = [];

  for (const p of pickups) {
    const proto = byId[p.protocol_id];
    if (!proto) { summary.pickupsSkipped++; continue; }
    if (!p.quantity || p.quantity <= 0) { summary.pickupsSkipped++; continue; }
    try {
      const r = await spawnTakeHomeInjections(supabase, p, proto);
      summary.totalSpawned += r.spawned;
      summary.totalSlotsSkipped += r.skipped;
      if (r.spawned > 0) affected.add(p.protocol_id);
    } catch (err) {
      summary.errored++;
      errors.push({ pickup_id: p.id, error: err.message });
    }
  }

  // Recount sessions_used for affected protocols
  const recounts = [];
  for (const pid of affected) {
    const { count } = await supabase
      .from('service_logs')
      .select('*', { count: 'exact', head: true })
      .eq('protocol_id', pid)
      .in('entry_type', ['injection', 'session']);
    await supabase
      .from('protocols')
      .update({ sessions_used: count || 0, updated_at: new Date().toISOString() })
      .eq('id', pid);
    const proto = byId[pid];
    recounts.push({
      protocol_id: pid.substring(0, 8),
      patient_id: pickups.find(p => p.protocol_id === pid)?.patient_id?.substring(0, 8),
      before: proto.sessions_used,
      after: count || 0,
      total: proto.total_sessions,
    });
  }
  summary.affectedProtocols = affected.size;

  return res.status(200).json({ ok: true, summary, recounts, errors });
}
