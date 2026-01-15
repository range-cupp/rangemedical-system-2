// /pages/api/protocols/index.js
// Get protocols - supports filtering by patient_id, status, category
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Support both GET (for querying) and POST (for creating - redirect to assign)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET to query protocols.' });
  }

  try {
    const { patient_id, status, category, program_type } = req.query;

    let query = supabase.from('protocols').select('*');

    // Apply filters
    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Category/program_type filter - check both since naming varies
    if (category || program_type) {
      const typeFilter = category || program_type;
      query = query.or(`program_type.ilike.%${typeFilter}%,program_name.ilike.%${typeFilter}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json(data || []);

  } catch (error) {
    console.error('Error fetching protocols:', error);
    return res.status(500).json({ error: error.message });
  }
}
