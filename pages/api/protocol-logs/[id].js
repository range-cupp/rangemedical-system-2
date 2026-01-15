// /pages/api/protocol-logs/[id].js
// Update or delete a protocol log
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Log ID required' });
  }

  // GET - fetch single log
  if (req.method === 'GET') {
    try {
      const { data: log, error } = await supabase
        .from('protocol_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !log) {
        return res.status(404).json({ error: 'Log not found' });
      }

      return res.status(200).json({ success: true, log });
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // PUT - update log
  if (req.method === 'PUT') {
    try {
      const { log_date, weight, notes } = req.body;

      const updateData = {};
      if (log_date !== undefined) updateData.log_date = log_date;
      if (weight !== undefined) updateData.weight = weight;
      if (notes !== undefined) updateData.notes = notes;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const { data: updated, error } = await supabase
        .from('protocol_logs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update log error:', error);
        return res.status(500).json({ error: 'Failed to update log' });
      }

      console.log(`✓ Log ${id} updated`);

      return res.status(200).json({
        success: true,
        message: 'Log updated',
        log: updated
      });

    } catch (err) {
      console.error('Update error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // DELETE - delete log and decrement sessions_used
  if (req.method === 'DELETE') {
    try {
      // First, get the log to find the protocol_id
      const { data: log, error: fetchError } = await supabase
        .from('protocol_logs')
        .select('*, protocols(*)')
        .eq('id', id)
        .single();

      if (fetchError || !log) {
        return res.status(404).json({ error: 'Log not found' });
      }

      // Delete the log
      const { error: deleteError } = await supabase
        .from('protocol_logs')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete log error:', deleteError);
        return res.status(500).json({ error: 'Failed to delete log' });
      }

      // Decrement sessions_used on the protocol (but not below 0)
      const currentSessionsUsed = log.protocols?.sessions_used || 0;
      const newSessionsUsed = Math.max(0, currentSessionsUsed - 1);

      const { error: updateError } = await supabase
        .from('protocols')
        .update({ 
          sessions_used: newSessionsUsed,
          updated_at: new Date().toISOString()
        })
        .eq('id', log.protocol_id);

      if (updateError) {
        console.error('Update protocol error:', updateError);
        // Log was still deleted, so we return success
      }

      console.log(`✓ Log ${id} deleted, sessions_used decremented to ${newSessionsUsed}`);

      return res.status(200).json({
        success: true,
        message: 'Log deleted',
        new_sessions_used: newSessionsUsed
      });

    } catch (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
