import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_SLUGS = new Set(['san-clemente-opening']);
const MAX_LABEL_LENGTH = 200;
const MAX_ITEMS_PER_SECTION = 100;

async function getOrCreate(slug) {
  const { data, error } = await supabase
    .from('public_checklists')
    .select('checked, custom_items, updated_at')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: inserted, error: insertErr } = await supabase
    .from('public_checklists')
    .insert({ slug, checked: {}, custom_items: {} })
    .select('checked, custom_items, updated_at')
    .single();
  if (insertErr) throw insertErr;
  return inserted;
}

async function writeState(slug, checked, customItems) {
  const { data, error } = await supabase
    .from('public_checklists')
    .update({ checked, custom_items: customItems, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .select('checked, custom_items, updated_at')
    .single();
  if (error) throw error;
  return data;
}

function shape(row) {
  return {
    checked: row.checked || {},
    customItems: row.custom_items || {},
    updatedAt: row.updated_at,
  };
}

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!ALLOWED_SLUGS.has(slug)) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    if (req.method === 'GET') {
      const state = await getOrCreate(slug);
      return res.status(200).json(shape(state));
    }

    if (req.method === 'POST') {
      const state = await getOrCreate(slug);
      const checked = { ...(state.checked || {}) };
      const customItems = { ...(state.custom_items || {}) };
      const { action, itemId, sectionTitle, item } = req.body || {};

      if (action === 'toggle') {
        if (typeof itemId !== 'string' || !itemId) {
          return res.status(400).json({ error: 'Invalid itemId' });
        }
        checked[itemId] = !checked[itemId];
      } else if (action === 'add') {
        if (typeof sectionTitle !== 'string' || !sectionTitle) {
          return res.status(400).json({ error: 'Invalid section' });
        }
        if (!item || typeof item.id !== 'string' || typeof item.label !== 'string') {
          return res.status(400).json({ error: 'Invalid item' });
        }
        const label = item.label.trim().slice(0, MAX_LABEL_LENGTH);
        if (!label) return res.status(400).json({ error: 'Empty label' });
        const existing = customItems[sectionTitle] || [];
        if (existing.length >= MAX_ITEMS_PER_SECTION) {
          return res.status(400).json({ error: 'Too many items in section' });
        }
        if (existing.some(i => i.id === item.id)) {
          return res.status(200).json(shape(state));
        }
        customItems[sectionTitle] = [...existing, { id: item.id, label }];
      } else if (action === 'remove') {
        if (typeof sectionTitle !== 'string' || typeof itemId !== 'string') {
          return res.status(400).json({ error: 'Invalid input' });
        }
        customItems[sectionTitle] = (customItems[sectionTitle] || []).filter(i => i.id !== itemId);
        delete checked[itemId];
      } else {
        return res.status(400).json({ error: 'Unknown action' });
      }

      const updated = await writeState(slug, checked, customItems);
      return res.status(200).json(shape(updated));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('public-checklist error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
