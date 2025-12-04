// pages/api/patients/[id].js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      // Delete patient (CASCADE will handle related records)
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ 
        success: true, 
        message: 'Patient deleted successfully' 
      });
    } catch (error) {
      console.error('Delete patient error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
