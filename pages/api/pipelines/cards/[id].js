// /api/pipelines/cards/[id]
// GET    — fetch one card with patient info
// PATCH  — update stage/status/assigned_to/notes/meta (writes events for each change)
// DELETE — hard delete (rare; prefer status=lost/completed)

import { sb, moveCard } from '../../../../lib/pipelines-server';

export default async function handler(req, res) {
  const { id } = req.query;
  const client = sb();

  if (req.method === 'GET') {
    const { data, error } = await client
      .from('pipeline_cards')
      .select(`
        *,
        patient:patients(id, first_name, last_name, name, phone, email)
      `)
      .eq('id', id)
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({
      ...data,
      patient_name: data.patient?.name
        || [data.patient?.first_name, data.patient?.last_name].filter(Boolean).join(' ')
        || null,
    });
  }

  if (req.method === 'PATCH') {
    try {
      const b = req.body || {};
      const updated = await moveCard({
        card_id: id,
        to_stage: b.stage,
        to_status: b.status,
        assigned_to: b.assigned_to,
        notes: b.notes,
        triggered_by: b.triggered_by || 'manual',
        automation_reason: b.automation_reason || null,
      });

      // Handle meta updates separately (not part of moveCard)
      if (b.meta && typeof b.meta === 'object') {
        const { data: curRow } = await client
          .from('pipeline_cards').select('meta').eq('id', id).single();
        const merged = { ...(curRow?.meta || {}), ...b.meta };
        await client.from('pipeline_cards')
          .update({ meta: merged, last_activity_at: new Date().toISOString() })
          .eq('id', id);
      }

      return res.status(200).json(updated);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    const { error } = await client.from('pipeline_cards').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PATCH, DELETE');
  return res.status(405).end();
}
