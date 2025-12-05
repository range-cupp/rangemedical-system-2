// pages/api/labs/index.js
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

      // Get all labs for patient
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
      const labData = req.body;

      if (!labData.patient_id || !labData.test_date || !labData.panel_type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data: lab, error } = await supabase
        .from('labs')
        .insert([labData])
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ 
        success: true, 
        lab,
        message: 'Lab results saved successfully' 
      });
    } catch (error) {
      console.error('Create lab error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, ...labData } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Lab ID required' });
      }

      const { data: lab, error } = await supabase
        .from('labs')
        .update({ ...labData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ 
        success: true, 
        lab,
        message: 'Lab results updated successfully' 
      });
    } catch (error) {
      console.error('Update lab error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Lab ID required' });
      }

      const { error } = await supabase
        .from('labs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ 
        success: true,
        message: 'Lab results deleted successfully' 
      });
    } catch (error) {
      console.error('Delete lab error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
