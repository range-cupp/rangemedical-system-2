import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { data, error } = await supabase
        .from('labs')
        .insert([req.body])
        .select();

      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
