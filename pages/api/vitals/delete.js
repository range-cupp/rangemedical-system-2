// pages/api/vitals/delete.js
// Delete a single vitals record by id
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from('patient_vitals')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Vitals delete error:', error);
    return res.status(500).json({ error: error.message });
  }
}
