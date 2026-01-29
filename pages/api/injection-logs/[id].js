// /pages/api/injection-logs/[id].js
// Update or delete individual injection logs
// Range Medical - 2026-01-28

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Log ID required' });
  }

  // GET - Fetch single log
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('injection_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, log: data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH - Update log
  if (req.method === 'PATCH') {
    try {
      const updates = {};
      const allowedFields = ['weight', 'dosage', 'entry_date', 'notes', 'entry_type', 'medication', 'site'];
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No valid fields to update' });
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('injection_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, log: data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE - Delete log
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('injection_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
