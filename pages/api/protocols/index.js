import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('protocols')
        .select('*, patients(name, email)')
        .order('start_date', { ascending: false });

      if (error) throw error;

      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching protocols:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const protocolData = req.body;

      const { data, error } = await supabase
        .from('protocols')
        .insert([protocolData])
        .select();

      if (error) throw error;

      res.status(201).json(data[0]);
    } catch (error) {
      console.error('Error creating protocol:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body;

      const { data, error } = await supabase
        .from('protocols')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;

      res.status(200).json(data[0]);
    } catch (error) {
      console.error('Error updating protocol:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
