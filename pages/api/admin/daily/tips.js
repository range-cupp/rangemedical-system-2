// /api/admin/daily/tips
// GET — list tips (?status=draft|approved|sent|all, ?from=YYYY-MM-DD, ?to=YYYY-MM-DD)
// POST — create new tip { subject, body, status?, scheduled_for?, topic_tags?, notes? }

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_STATUS = ['draft', 'approved', 'scheduled', 'sent', 'archived'];

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res, employee);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res) {
  try {
    const status = (req.query.status || 'all').toString();
    const from = (req.query.from || '').toString();
    const to = (req.query.to || '').toString();

    let q = supabase
      .from('daily_tips')
      .select('id, subject, body, status, topic_tags, scheduled_for, sent_at, created_at, created_by, notes')
      .order('scheduled_for', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (status !== 'all') q = q.eq('status', status);
    if (from) q = q.gte('scheduled_for', from);
    if (to) q = q.lte('scheduled_for', to);

    const { data, error } = await q;
    if (error) throw error;

    return res.status(200).json({ tips: data || [] });
  } catch (err) {
    console.error('[admin/daily/tips GET] error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function handlePost(req, res, employee) {
  try {
    const { subject, body, status, scheduled_for, topic_tags, notes } = req.body || {};

    if (!subject || !subject.trim()) return res.status(400).json({ error: 'Subject required' });
    if (!body || !body.trim()) return res.status(400).json({ error: 'Body required' });

    const finalStatus = status && ALLOWED_STATUS.includes(status) ? status : 'draft';
    if (finalStatus === 'approved' && !scheduled_for) {
      return res.status(400).json({ error: 'Approved tips need a scheduled_for date.' });
    }

    const { data, error } = await supabase
      .from('daily_tips')
      .insert({
        subject: subject.trim(),
        body: body,
        status: finalStatus,
        scheduled_for: scheduled_for || null,
        topic_tags: Array.isArray(topic_tags) ? topic_tags : [],
        notes: notes || null,
        created_by: employee.email || employee.name || 'admin',
      })
      .select('*')
      .single();

    if (error) throw error;

    return res.status(200).json({ tip: data });
  } catch (err) {
    console.error('[admin/daily/tips POST] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
