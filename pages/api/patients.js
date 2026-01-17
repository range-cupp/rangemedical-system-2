// /pages/api/patients.js
// Simple patients API for dropdowns and search
// Range Medical

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
    const { search, limit = 500 } = req.query;

    let query = supabase
      .from('patients')
      .select('id, first_name, last_name, email, phone, ghl_contact_id')
      .order('first_name', { ascending: true })
      .limit(parseInt(limit));

    // If search term provided, filter
    if (search && search.length >= 2) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: patients, error } = await query;

    if (error) {
      console.error('Error fetching patients:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      success: true,
      patients: patients || [],
      total: patients?.length || 0
    });

  } catch (error) {
    console.error('Patients API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
