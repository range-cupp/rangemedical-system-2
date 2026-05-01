// /api/admin/daily/tips/[id]
// GET — fetch tip
// PATCH — update fields { subject?, body?, status?, scheduled_for?, topic_tags?, notes? }
// DELETE — delete tip

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_STATUS = ['draft', 'approved', 'scheduled', 'sent', 'archived'];
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  const { id } = req.query;
  if (!id || !UUID_RX.test(id)) return res.status(400).json({ error: 'Invalid id' });

  if (req.method === 'GET') return handleGet(id, res);
  if (req.method === 'PATCH') return handlePatch(id, req, res);
  if (req.method === 'DELETE') return handleDelete(id, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(id, res) {
  const { data, error } = await supabase
    .from('daily_tips')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found' });
  return res.status(200).json({ tip: data });
}

async function handlePatch(id, req, res) {
  const body = req.body || {};
  const update = {};

  if (typeof body.subject === 'string') update.subject = body.subject.trim();
  if (typeof body.body === 'string') update.body = body.body;
  if (typeof body.notes === 'string' || body.notes === null) update.notes = body.notes;
  if (Array.isArray(body.topic_tags)) update.topic_tags = body.topic_tags;

  if (body.scheduled_for === null) update.scheduled_for = null;
  else if (typeof body.scheduled_for === 'string' && body.scheduled_for) update.scheduled_for = body.scheduled_for;

  if (typeof body.status === 'string') {
    if (!ALLOWED_STATUS.includes(body.status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${ALLOWED_STATUS.join(', ')}` });
    }
    update.status = body.status;
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  // Sanity: if approving, must have scheduled_for. Pull current row to check.
  if (update.status === 'approved' && update.scheduled_for === undefined) {
    const { data: current } = await supabase
      .from('daily_tips')
      .select('scheduled_for')
      .eq('id', id)
      .maybeSingle();
    if (!current?.scheduled_for) {
      return res.status(400).json({ error: 'Cannot approve a tip without a scheduled_for date.' });
    }
  }

  const { data, error } = await supabase
    .from('daily_tips')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ tip: data });
}

async function handleDelete(id, res) {
  const { error } = await supabase
    .from('daily_tips')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
