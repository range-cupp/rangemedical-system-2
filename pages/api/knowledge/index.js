// /pages/api/knowledge/index.js
// GET  — list all knowledge entries (admin UI)
// POST — create a new entry

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Auth
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('sop_knowledge')
      .select('*')
      .order('category')
      .order('sort_order')
      .order('created_at');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { category, title, content, tags, active, sort_order } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }
    const { data, error } = await supabase
      .from('sop_knowledge')
      .insert({ category: category || 'general', title: title.trim(), content: content.trim(), tags: tags || null, active: active !== false, sort_order: sort_order || 0 })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
