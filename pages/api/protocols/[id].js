// /pages/api/protocols/[id].js
// Protocol API - GET, PUT, DELETE for individual protocols
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  // GET - Get single protocol
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('protocols')
        .select('*, patients(name, email, phone)')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Protocol not found' });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // PUT - Update protocol
  if (req.method === 'PUT') {
    try {
      const {
        medication,
        selectedDose,
        frequency,
        startDate,
        endDate,
        status,
        notes,
        sessionsUsed
      } = req.body;

      const updates = {
        updated_at: new Date().toISOString()
      };

      // Only add fields that were provided
      if (medication !== undefined) updates.medication = medication;
      if (selectedDose !== undefined) updates.selected_dose = selectedDose;
      if (frequency !== undefined) updates.frequency = frequency;
      if (startDate !== undefined) updates.start_date = startDate;
      if (endDate !== undefined) updates.end_date = endDate;
      if (status !== undefined) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      if (sessionsUsed !== undefined) updates.sessions_used = parseInt(sessionsUsed) || 0;

      // If sessions_used equals total_sessions, mark as completed
      if (sessionsUsed !== undefined) {
        const { data: protocol } = await supabase
          .from('protocols')
          .select('total_sessions')
          .eq('id', id)
          .single();
        
        if (protocol?.total_sessions && parseInt(sessionsUsed) >= protocol.total_sessions) {
          updates.status = 'completed';
        }
      }

      const { data, error } = await supabase
        .from('protocols')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        return res.status(500).json({ error: 'Failed to update protocol', details: error.message });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // DELETE - Delete protocol
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('protocols')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        return res.status(500).json({ error: 'Failed to delete protocol' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
