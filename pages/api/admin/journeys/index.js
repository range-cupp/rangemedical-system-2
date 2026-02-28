// /pages/api/admin/journeys/index.js
// Journey Template CRUD + listing
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // List all journey templates, optionally filtered by protocol_type
    const { protocol_type } = req.query;

    let query = supabase
      .from('journey_templates')
      .select('*')
      .order('protocol_type')
      .order('is_default', { ascending: false });

    if (protocol_type) {
      query = query.eq('protocol_type', protocol_type);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ templates: data });
  }

  if (req.method === 'POST') {
    // Create a new journey template
    const { protocol_type, name, stages, is_default } = req.body;

    if (!protocol_type || !name || !stages || !Array.isArray(stages)) {
      return res.status(400).json({ error: 'protocol_type, name, and stages[] are required' });
    }

    // If marking as default, unset existing default first
    if (is_default) {
      await supabase
        .from('journey_templates')
        .update({ is_default: false })
        .eq('protocol_type', protocol_type)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('journey_templates')
      .insert({
        protocol_type,
        name,
        stages,
        is_default: is_default || false
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ template: data });
  }

  if (req.method === 'PUT') {
    // Update an existing journey template
    const { id, name, stages, is_default } = req.body;

    if (!id) return res.status(400).json({ error: 'id is required' });

    // If marking as default, unset existing default first
    if (is_default) {
      const { data: existing } = await supabase
        .from('journey_templates')
        .select('protocol_type')
        .eq('id', id)
        .single();

      if (existing) {
        await supabase
          .from('journey_templates')
          .update({ is_default: false })
          .eq('protocol_type', existing.protocol_type)
          .eq('is_default', true)
          .neq('id', id);
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (stages !== undefined) updates.stages = stages;
    if (is_default !== undefined) updates.is_default = is_default;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('journey_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ template: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
