// /api/pipelines/summary
// GET  — counts per pipeline/stage for the index page
// GET ?patient_id=... — all active cards for a single patient (for profile summary block)

import { sb } from '../../../lib/pipelines-server';
import { CARD_STATUS } from '../../../lib/pipelines-config';

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
    .select('pipeline, stage')
    .eq('status', CARD_STATUS.ACTIVE);
  if (error) return res.status(500).json({ error: error.message });

  const summary = {};
  for (const row of data || []) {
    summary[row.pipeline] ||= { total: 0, by_stage: {} };
    summary[row.pipeline].total++;
    summary[row.pipeline].by_stage[row.stage] = (summary[row.pipeline].by_stage[row.stage] || 0) + 1;
  }
  return res.status(200).json(summary);
}
