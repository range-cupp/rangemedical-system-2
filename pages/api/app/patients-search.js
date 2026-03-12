// /pages/api/app/patients-search.js
// GET: quick patient search by name or phone
// Range Medical Employee App

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(200).json({ patients: [] });
  }

  const query = q.trim();
  const isPhone = /^\d/.test(query);

  let dbQuery = supabase
    .from('patients')
    .select('id, first_name, last_name, phone, email, date_of_birth')
    .limit(15);

  if (isPhone) {
    dbQuery = dbQuery.ilike('phone', `%${query.replace(/\D/g, '')}%`);
  } else {
    // Search by name — try full name match first, then first/last separately
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

  if (error) {
    return res.status(500).json({ error: 'Search failed' });
  }

  return res.status(200).json({ patients: data || [] });
}
