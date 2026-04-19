// /api/pipelines/[pipeline]
// GET  — list cards for a pipeline (active only by default)
// POST — create a new card on the pipeline

import { sb, createCard } from '../../../lib/pipelines-server';
import { getPipeline, CARD_STATUS } from '../../../lib/pipelines-config';

export default async function handler(req, res) {
  const { pipeline } = req.query;
  const def = getPipeline(pipeline);
  if (!def) return res.status(404).json({ error: 'Unknown pipeline' });

  if (req.method === 'GET') {
    const status = req.query.status || CARD_STATUS.ACTIVE;
    const { data, error } = await sb()
      .from('pipeline_cards')
      .select(`
        *,
        patient:patients(id, first_name, last_name, name, phone, email)
      `)
      .eq('pipeline', pipeline)
      .eq('status', status)
      .order('last_activity_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const rows = (data || []).map(r => ({
      ...r,
      patient_name: r.patient?.name
        || [r.patient?.first_name, r.patient?.last_name].filter(Boolean).join(' ')
        || null,
      patient: undefined,
    }));
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const card = await createCard({
        pipeline,
        stage: body.stage,
        patient_id: body.patient_id,
        first_name: body.first_name, last_name: body.last_name,
        email: body.email, phone: body.phone,
        assigned_to: body.assigned_to,
        protocol_id: body.protocol_id,
        source: body.source, path: body.path, urgency: body.urgency,
        scheduled_for: body.scheduled_for,
        status: body.status,
        notes: body.notes,
        meta: body.meta || {},
        triggered_by: body.triggered_by || 'manual',
      });
      return res.status(201).json(card);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
