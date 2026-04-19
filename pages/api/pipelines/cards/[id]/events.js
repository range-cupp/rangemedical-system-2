// /api/pipelines/cards/[id]/events
// GET — list all events for a card (newest first)

import { sb } from '../../../../../lib/pipelines-server';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const { id } = req.query;
  const { data, error } = await sb()
    .from('pipeline_events')
    .select('*')
    .eq('card_id', id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}
