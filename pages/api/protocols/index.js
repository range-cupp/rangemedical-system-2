// pages/api/protocols/index.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // POST - Create new protocol
  if (req.method === 'POST') {
    try {
      const protocolData = req.body;

      // Convert empty strings to null for date fields
      const cleanedData = {
        ...protocolData,
        start_date: protocolData.start_date || null,
        next_lab_date: protocolData.next_lab_date || null,
        duration: protocolData.duration || null,
        dosing: protocolData.dosing || null,
        injection_schedule: protocolData.injection_schedule || null,
        notes: protocolData.notes || null
      };

      const { data, error } = await supabase
        .from('protocols')
        .insert([cleanedData])
        .select();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // GET - Fetch all protocols
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('protocols')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // PUT - Update existing protocol
  if (req.method === 'PUT') {
    try {
      const { id, ...protocolData } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Protocol ID is required' });
      }

      // Convert empty strings to null for date fields
      const cleanedData = {
        ...protocolData,
        start_date: protocolData.start_date || null,
        next_lab_date: protocolData.next_lab_date || null,
        duration: protocolData.duration || null,
        dosing: protocolData.dosing || null,
        injection_schedule: protocolData.injection_schedule || null,
        notes: protocolData.notes || null
      };

      const { data, error } = await supabase
        .from('protocols')
        .update(cleanedData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: error.message });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Protocol not found' });
      }

      return res.status(200).json({ success: true, data: data[0] });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Delete protocol
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Protocol ID is required' });
      }

      const { data, error } = await supabase
        .from('protocols')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: error.message });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Protocol not found' });
      }

      return res.status(200).json({ success: true, message: 'Protocol deleted successfully' });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
