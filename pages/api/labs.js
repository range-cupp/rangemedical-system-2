// pages/api/labs.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { patient_id } = req.query;

      if (!patient_id) {
        return res.status(400).json({ error: 'patient_id required' });
      }

      const { data: labs, error } = await supabase
        .from('labs')
        .select('*')
        .eq('patient_id', patient_id)
        .order('test_date', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ 
        success: true, 
        labs: labs || [] 
      });
    } catch (error) {
      console.error('Get labs error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { patient_id, lab_provider, test_type, test_date, lab_url, notes } = req.body;

      if (!patient_id || !lab_provider || !test_type || !test_date || !lab_url) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data: lab, error } = await supabase
        .from('labs')
        .insert([{
          patient_id,
          lab_provider,
          test_type,
          test_date,
          lab_url,
          notes: notes || null,
          uploaded_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ 
        success: true, 
        lab,
        message: 'Lab uploaded successfully' 
      });
    } catch (error) {
      console.error('Upload lab error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
