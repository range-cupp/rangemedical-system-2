// /pages/api/patients/search.js
// Patient Search API for Staff Forms
// Range Medical
// CREATED: 2026-01-04

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Enable CORS for the staff form
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    // Search by name (case insensitive)
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, name, email, phone, ghl_contact_id, address, city, state, zip')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(20);

    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }

    return res.status(200).json({ patients: patients || [] });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
