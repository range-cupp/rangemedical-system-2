// /pages/api/admin/clear-needs-response.js
// Manually clear needs_response flag for a patient
// Used when staff reviews a message and decides no reply is needed
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

  const { patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({ error: 'patientId is required' });
  }

  try {
    const { data, error } = await supabase
      .from('comms_log')
      .update({ needs_response: false })
      .eq('patient_id', patientId)
      .eq('needs_response', true)
      .select('id');

    if (error) {
      console.error('[clear-needs-response] error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, cleared: data?.length || 0 });
  } catch (err) {
    console.error('[clear-needs-response] unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}
