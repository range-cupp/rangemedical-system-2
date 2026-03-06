// /pages/api/admin/new-patients-check.js
// Returns recently created patients (from external sources)
// Polled by AdminLayout for new patient notifications
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
    const { since } = req.query;

    // If no since timestamp, just return current latest patient timestamp
    if (!since) {
      const { data: latest } = await supabase
        .from('patients')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return res.status(200).json({
        newPatients: [],
        latestTimestamp: latest?.created_at || null,
      });
    }

    // Find patients created after the given timestamp
    const { data: newPatients, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, name, email, phone, tags, ghl_contact_id, created_at')
      .gt('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('New patients check error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Filter to only external patients (have ghl_contact_id or assessment tags)
    const externalPatients = (newPatients || []).filter(p => {
      if (p.ghl_contact_id) return true;
      const tags = Array.isArray(p.tags) ? p.tags : [];
      return tags.some(t =>
        t.includes('assessment') || t.includes('research') || t.includes('intake')
      );
    });

    const latestTimestamp = newPatients?.length > 0
      ? newPatients[0].created_at
      : since;

    res.setHeader('Cache-Control', 'private, max-age=5');

    return res.status(200).json({
      newPatients: externalPatients.map(p => ({
        id: p.id,
        name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'New Patient',
        email: p.email,
        createdAt: p.created_at,
      })),
      latestTimestamp,
    });

  } catch (error) {
    console.error('New patients check error:', error);
    return res.status(500).json({ error: error.message });
  }
}
