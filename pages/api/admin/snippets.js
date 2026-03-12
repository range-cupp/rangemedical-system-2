// /pages/api/admin/snippets.js
// CRUD API for message snippets/templates
// GET: list all active snippets (public — loaded by TemplateMessages component)
// POST: create snippet
// PATCH: update snippet
// DELETE: delete snippet
// Range Medical System

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  if (req.method === 'PATCH') return handlePatch(req, res);
  if (req.method === 'DELETE') return handleDelete(req, res);

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res) {
  const { category } = req.query;

  let query = supabase
    .from('snippets')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('sort_order')
    .order('created_at');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ snippets: data || [] });
}

async function handlePost(req, res) {
  const { category, label, message, sort_order } = req.body;

  if (!category || !label) {
    return res.status(400).json({ error: 'Category and label are required' });
  }

  const { data, error } = await supabase
    .from('snippets')
    .insert({
      category: category.trim(),
      label: label.trim(),
      message: message || '',
      sort_order: sort_order || 0,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ snippet: data });
}

async function handlePatch(req, res) {
  const { id, category, label, message, sort_order, is_active } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Snippet ID is required' });
  }

  const updates = { updated_at: new Date().toISOString() };
  if (category !== undefined) updates.category = category.trim();
  if (label !== undefined) updates.label = label.trim();
  if (message !== undefined) updates.message = message;
  if (sort_order !== undefined) updates.sort_order = sort_order;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabase
    .from('snippets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ snippet: data });
}

async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Snippet ID is required' });
  }

  const { error } = await supabase
    .from('snippets')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
