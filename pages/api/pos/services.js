// POS Services CRUD API
// GET: List services (optional ?active=true filter)
// POST: Create service
// PUT: Update service
// DELETE: Soft delete (set active=false)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'PUT':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('POS services error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleGet(req, res) {
  const { active } = req.query;

  let query = supabase
    .from('pos_services')
    .select('*')
    .order('category')
    .order('sort_order');

  if (active === 'true') {
    query = query.eq('active', true);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ services: data });
}

async function handlePost(req, res) {
  const { name, category, price, recurring, interval } = req.body;

  if (!name || !category || price == null) {
    return res.status(400).json({ error: 'name, category, and price are required' });
  }

  const { data, error } = await supabase
    .from('pos_services')
    .insert({
      name,
      category,
      price,
      recurring: recurring || false,
      interval: interval || null,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ service: data });
}

async function handlePut(req, res) {
  const { id, ...updates } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  // Only allow specific fields
  const allowed = ['name', 'category', 'price', 'recurring', 'interval', 'active', 'sort_order'];
  const cleanUpdates = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      cleanUpdates[key] = updates[key];
    }
  }
  cleanUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('pos_services')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ service: data });
}

async function handleDelete(req, res) {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  // Soft delete — set active to false
  const { data, error } = await supabase
    .from('pos_services')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ service: data });
}
