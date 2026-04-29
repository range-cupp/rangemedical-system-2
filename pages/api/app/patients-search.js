// /pages/api/app/patients-search.js
// GET: quick patient search by name or phone, or list recently active patients
// Range Medical Employee App

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { q, recent } = req.query;

  // No search query — return recently active patients (appointments in last 30 days)
  if (!q && recent === 'true') {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: recentAppts } = await supabase
      .from('appointments')
      .select('patient_id, start_time, patients(id, first_name, last_name, phone, date_of_birth, profile_photo_url)')
      .gte('start_time', since.toISOString())
      .in('status', ['scheduled', 'confirmed', 'rescheduled', 'completed'])
      .order('start_time', { ascending: false })
      .limit(150);

    // Deduplicate by patient_id, keep most recent
    const seen = new Set();
    const patients = [];
    for (const row of recentAppts || []) {
      if (!row.patient_id || seen.has(row.patient_id)) continue;
      if (!row.patients) continue;
      seen.add(row.patient_id);
      patients.push(row.patients);
      if (patients.length >= 50) break;
    }

    return res.status(200).json({ patients });
  }

  // Search mode
  if (!q || q.trim().length < 2) {
    return res.status(200).json({ patients: [] });
  }

  const query = q.trim();
  const isPhone = /^\d/.test(query);

  let dbQuery = supabase
    .from('patients')
    .select('id, first_name, last_name, phone, email, date_of_birth, profile_photo_url')
    .limit(20);

  if (isPhone) {
    dbQuery = dbQuery.ilike('phone', `%${query.replace(/\D/g, '')}%`);
  } else {
    const parts = query.split(' ');
    if (parts.length >= 2) {
      dbQuery = dbQuery.or(
        `first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts.slice(1).join(' ')}%`
      );
    } else {
      dbQuery = dbQuery.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%`
      );
    }
  }

  const { data, error } = await dbQuery.order('last_name', { ascending: true });

  if (error) return res.status(500).json({ error: 'Search failed' });

  return res.status(200).json({ patients: data || [] });
}
