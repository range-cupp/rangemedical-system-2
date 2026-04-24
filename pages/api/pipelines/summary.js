// /api/pipelines/summary
// GET  — counts per pipeline/stage for the index page
// GET ?patient_id=... — all active cards for a single patient (for profile summary block)

import { sb } from '../../../lib/pipelines-server';
import { CARD_STATUS } from '../../../lib/pipelines-config';
import { HRT_PROGRAM_TYPES, WEIGHT_LOSS_PROGRAM_TYPES } from '../../../lib/protocol-config';

const ACTIVE_TREATMENT_TYPES = [...HRT_PROGRAM_TYPES, ...WEIGHT_LOSS_PROGRAM_TYPES];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const client = sb();
  const { patient_id } = req.query;

  if (patient_id) {
    const { data, error } = await client
      .from('pipeline_cards')
      .select('*')
      .eq('patient_id', patient_id)
      .in('status', [CARD_STATUS.ACTIVE, CARD_STATUS.PAUSED])
      .order('last_activity_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  const { data, error } = await client
    .from('pipeline_cards')
    .select('pipeline, stage, patient_id')
    .eq('status', CARD_STATUS.ACTIVE);
  if (error) return res.status(500).json({ error: error.message });

  // Main Pipeline (energy_workup) excludes patients already on active HRT or
  // weight-loss treatment plans — those live on their own pipelines.
  const energyPatientIds = [...new Set(
    (data || [])
      .filter(r => r.pipeline === 'energy_workup' && r.patient_id)
      .map(r => r.patient_id)
  )];
  const excluded = new Set();
  if (energyPatientIds.length) {
    const { data: activeTx } = await client
      .from('protocols')
      .select('patient_id')
      .in('patient_id', energyPatientIds)
      .eq('status', 'active')
      .in('program_type', ACTIVE_TREATMENT_TYPES);
    for (const p of activeTx || []) excluded.add(p.patient_id);
  }

  const summary = {};
  for (const row of data || []) {
    if (row.pipeline === 'energy_workup' && row.patient_id && excluded.has(row.patient_id)) continue;
    summary[row.pipeline] ||= { total: 0, by_stage: {} };
    summary[row.pipeline].total++;
    summary[row.pipeline].by_stage[row.stage] = (summary[row.pipeline].by_stage[row.stage] || 0) + 1;
  }
  return res.status(200).json(summary);
}
