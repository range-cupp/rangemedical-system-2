// pages/api/labs/reference-ranges.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { gender } = req.query;

      let query = supabase
        .from('lab_reference_ranges')
        .select('*');

      if (gender) {
        query = query.or(`gender.eq.${gender},gender.eq.Both`);
      }

      const { data: ranges, error } = await query;

      if (error) throw error;

      // Convert to object for easy lookup
      const rangesMap = {};
      ranges.forEach(range => {
        rangesMap[range.biomarker] = range;
      });

      return res.status(200).json({ 
        success: true, 
        ranges: rangesMap 
      });
    } catch (error) {
      console.error('Get reference ranges error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
