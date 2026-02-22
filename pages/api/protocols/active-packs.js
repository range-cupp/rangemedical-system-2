// /pages/api/protocols/active-packs.js
// Get active session-based packs for a patient

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, ghl_contact_id } = req.query;

  if (!patient_id && !ghl_contact_id) {
    return res.status(400).json({ error: 'Patient ID or GHL Contact ID required' });
  }

  try {
    let patientIds = [];

    // Find patient ID from ghl_contact_id if needed
    if (ghl_contact_id && !patient_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', ghl_contact_id)
        .single();
      
      if (patient) {
        patientIds.push(patient.id);
      }
    }

    if (patient_id) {
      patientIds.push(patient_id);
    }

    if (patientIds.length === 0) {
      return res.status(200).json({ packs: [] });
    }

    // Get active packs (session-based protocols with remaining sessions OR take-home with time remaining)
    const { data: packs, error } = await supabase
      .from('protocols')
      .select('*')
      .in('patient_id', patientIds)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching packs:', error);
      return res.status(500).json({ error: 'Failed to fetch packs' });
    }

    // Filter to packs that can have sessions/time added
    const availablePacks = (packs || []).filter(pack => {
      // Session-based: has remaining sessions
      if (pack.total_sessions) {
        const used = pack.sessions_used || 0;
        const total = pack.total_sessions || 0;
        return used < total;
      }
      // Take-home: still active (has time remaining)
      if (pack.delivery_method === 'take_home' && pack.end_date) {
        return new Date(pack.end_date) > new Date();
      }
      return false;
    });

    return res.status(200).json({ packs: availablePacks });

  } catch (error) {
    console.error('Active packs error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
