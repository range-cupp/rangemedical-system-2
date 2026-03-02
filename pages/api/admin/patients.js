// /pages/api/admin/patients.js
// Patients List API - Range Medical
// Returns all patients from the patients table
// Uses pagination to bypass Supabase's 1000-row limit

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PAGE_SIZE = 1000; // Supabase max per query

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { search, id } = req.query;

    // Direct lookup by ID
    if (id) {
      const { data: patient, error: idError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (idError) {
        return res.status(500).json({ error: 'Failed to fetch patient' });
      }
      return res.status(200).json(patient ? [patient] : []);
    }

    // If searching, a single query is fine (results will be < 1000)
    if (search) {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,ghl_contact_id.eq.${search}`)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        console.error('Error fetching patients:', error);
        return res.status(500).json({ error: 'Failed to fetch patients' });
      }
      return res.status(200).json(patients || []);
    }

    // No search — fetch ALL patients using pagination to bypass 1000-row cap
    let allPatients = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error('Error fetching patients batch:', error);
        return res.status(500).json({ error: 'Failed to fetch patients' });
      }

      if (batch && batch.length > 0) {
        allPatients = allPatients.concat(batch);
        from += PAGE_SIZE;
        // If we got fewer than PAGE_SIZE, we've reached the end
        hasMore = batch.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    return res.status(200).json(allPatients);

  } catch (error) {
    console.error('Patients API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
