// /pages/api/patients/[id]/comms.js
// Per-patient communications API
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const limit = parseInt(req.query.limit) || 50;

  if (!id) {
    return res.status(400).json({ error: 'Patient ID required' });
  }

  try {
    const { data: comms, error } = await supabase
      .from('comms_log')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return res.status(200).json({
      comms: comms || [],
      total: comms?.length || 0
    });

  } catch (error) {
    console.error('Comms API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
