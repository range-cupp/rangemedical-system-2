// /pages/api/intakes/[id].js
// Individual intake operations - GET, PUT, DELETE
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Intake ID required' });
  }

  // GET - Fetch single intake
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('intakes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Intake not found' });

      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // PUT - Update intake
  if (req.method === 'PUT') {
    try {
      const updates = req.body;
      
      const { data, error } = await supabase
        .from('intakes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ success: true, intake: data });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Delete intake
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('intakes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true, deleted: id });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
