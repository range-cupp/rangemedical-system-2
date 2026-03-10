// /pages/api/patients.js
// Simple patients API for dropdowns and search
// Range Medical - Updated 2026-03-10

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SELECT_COLS = 'id, first_name, last_name, name, email, phone, ghl_contact_id';
const PAGE_SIZE = 1000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { search } = req.query;

    let patients;

    if (search && search.length >= 2) {
      // Search mode — filtered results, unlikely to exceed 1000
      const { data, error } = await supabase
        .from('patients')
        .select(SELECT_COLS)
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
        .limit(1000);

      if (error) throw error;
      patients = data || [];
    } else {
      // Full list mode — paginate to get ALL patients (Supabase caps at 1000/request)
      patients = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from('patients')
          .select(SELECT_COLS)
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        patients = patients.concat(data);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
    }

    console.log('Patients API returning:', patients.length, 'patients');

    return res.status(200).json({
      success: true,
      patients,
      total: patients.length
    });

  } catch (error) {
    console.error('Patients API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
