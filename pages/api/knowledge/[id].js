// /pages/api/knowledge/[id].js
// PATCH  — update an entry
// DELETE — delete an entry

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' });

  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { category, title, content, tags, active, sort_order } = req.body;
    const updates = {};
    if (category !== undefined)   updates.category   = category;
    if (title !== undefined)      updates.title      = title.trim();
    if (content !== undefined)    updates.content    = content.trim();
    if (tags !== undefined)       updates.tags       = tags;
    if (active !== undefined)     updates.active     = active;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    const { data, error } = await supabase
      .from('sop_knowledge')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('sop_knowledge').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
