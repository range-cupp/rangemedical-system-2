// /pages/api/patients.js
// Simple patients API for dropdowns and search
// Range Medical - Updated 2026-01-17

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
    const { search } = req.query;

    // Fetch ALL patients — no GHL filter so every patient in the system is searchable
    let query = supabase
      .from('patients')
      .select('id, first_name, last_name, name, email, phone, ghl_contact_id')
      .order('created_at', { ascending: false })
      .limit(5000);

    // If search term provided, add server-side filter for faster results
    if (search && search.length >= 2) {
      query = supabase
        .from('patients')
        .select('id, first_name, last_name, name, email, phone, ghl_contact_id')
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
        .limit(5000);
    }

    const { data: patients, error } = await query;

    if (error) {
      console.error('Error fetching patients:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Patients API returning:', patients?.length || 0, 'patients');

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
