// /pages/api/service-log/check-packages.js
// Check if patient has active packages for a service category
// Range Medical - 2026-02-09

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map category to program_type
const CATEGORY_TO_PROGRAM_TYPE = {
  'testosterone': 'hrt',
  'weight_loss': 'weight_loss',
  'vitamin': 'vitamin',
  'peptide': 'peptide',
  'iv_therapy': 'iv_therapy',
  'hbot': 'hbot',
  'red_light': 'red_light'
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, category } = req.query;

  if (!patient_id) {
    return res.status(400).json({ success: false, error: 'Missing patient_id' });
  }

  try {
    const programType = CATEGORY_TO_PROGRAM_TYPE[category];

    // Build query - if category provided, filter by program_type
    let query = supabase
      .from('protocols')
      .select('id, program_type, program_name, total_sessions, sessions_used, status, start_date, created_at')
      .eq('patient_id', patient_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (programType) {
      query = query.eq('program_type', programType);
    }

    const { data: protocols, error } = await query;

    if (error) {
      console.error('Error checking packages:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Calculate remaining sessions for each package
    const packages = (protocols || []).map(p => {
      const totalSessions = p.total_sessions || 0;
      const sessionsUsed = p.sessions_used || 0;
      const sessionsRemaining = totalSessions > 0 ? Math.max(0, totalSessions - sessionsUsed) : null;

      return {
        id: p.id,
        program_type: p.program_type,
        program_name: p.program_name,
        name: p.program_name, // Alias for UI
        total_sessions: totalSessions,
        sessions_used: sessionsUsed,
        sessions_remaining: sessionsRemaining,
        has_sessions: sessionsRemaining === null || sessionsRemaining > 0,
        start_date: p.start_date,
        created_at: p.created_at
      };
    }).filter(p => p.has_sessions); // Only return packages with available sessions

    return res.status(200).json({
      success: true,
      packages,
      has_package: packages.length > 0
    });
  } catch (err) {
    console.error('Error in check-packages:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
