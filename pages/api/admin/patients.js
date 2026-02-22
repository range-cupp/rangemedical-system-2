// /pages/api/admin/patients.js
// Patients List API - Range Medical
// Returns all patients from the patients table

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = 1000, search } = req.query;

    // Build query
    let query = supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Add search filter if provided
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: patients, error } = await query;

    if (error) {
      console.error('Error fetching patients:', error);
      return res.status(500).json({ error: 'Failed to fetch patients' });
    }

    // Return as array for compatibility
    return res.status(200).json(patients || []);

  } catch (error) {
    console.error('Patients API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
