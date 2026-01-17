// /pages/api/patients-all.js
// Fetch ALL patients - Range Medical
// Created 2026-01-17

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
    // Fetch ALL patients - no filters, no limits
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, name, email, phone, ghl_contact_id')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching patients:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      success: true,
      patients: patients || [],
      total: patients?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Patients-all API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
