// /pages/api/protocols/[id].js
// Get, Update, or Delete a protocol

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

  // GET - Fetch single protocol
  if (req.method === 'GET') {
    try {
      const { data: protocol, error } = await supabase
        .from('protocols')
        .select(`
          *,
          patients (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single();

      if (error || !protocol) {
        return res.status(404).json({ error: 'Protocol not found' });
      }

      return res.status(200).json({ protocol });
    } catch (error) {
      console.error('Get protocol error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // PUT - Update protocol
  if (req.method === 'PUT') {
    try {
      const {
        selectedDose,
        frequency,
        startDate,
        endDate,
        status,
        notes,
        medication,
        sessionsUsed
      } = req.body;

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (selectedDose !== undefined) updateData.selected_dose = selectedDose;
      if (frequency !== undefined) updateData.frequency = frequency;
      if (startDate !== undefined) updateData.start_date = startDate;
      if (endDate !== undefined) updateData.end_date = endDate;
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (medication !== undefined) updateData.medication = medication;
      if (sessionsUsed !== undefined) updateData.sessions_used = sessionsUsed;

      const { data: protocol, error } = await supabase
        .from('protocols')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update protocol error:', error);
        return res.status(500).json({ error: 'Failed to update protocol', details: error.message });
      }

      return res.status(200).json({ success: true, protocol });
    } catch (error) {
      console.error('Update protocol error:', error);
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
        console.error('Delete protocol error:', error);
        return res.status(500).json({ error: 'Failed to delete protocol' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete protocol error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
