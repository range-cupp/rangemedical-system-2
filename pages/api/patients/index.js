// pages/api/patients/index.js
// Fetch all patients
// Deploy to: pages/api/patients/index.js

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
    const { search, limit = 100 } = req.query;

    let query = supabase
      .from('patients')
      .select('id, name, email, phone, ghl_contact_id, created_at')
      .order('name', { ascending: true })
      .limit(parseInt(limit));

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: patients, error } = await query;

    if (error) {
      console.error('Patients fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch patients', details: error.message });
    }

    return res.status(200).json({
      patients: patients || []
    });

  } catch (error) {
    console.error('Patients API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
