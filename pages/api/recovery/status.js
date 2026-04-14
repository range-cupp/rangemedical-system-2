// Recovery Enrollment Status API
// GET: ?patient_id=xxx — returns active enrollment(s) with offer details
// GET: ?enrollment_id=xxx — returns specific enrollment

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
    const { patient_id, enrollment_id, include_history } = req.query;

    if (!patient_id && !enrollment_id) {
      return res.status(400).json({ error: 'patient_id or enrollment_id is required' });
    }

    // Single enrollment lookup
    if (enrollment_id) {
      const { data, error } = await supabase
        .from('recovery_enrollments')
        .select('*, recovery_offers(*), patients(name, email, phone)')
        .eq('id', enrollment_id)
        .single();

      if (error) return res.status(404).json({ error: 'Enrollment not found' });
      return res.status(200).json({ enrollment: data });
    }

    // Patient enrollments
    let query = supabase
      .from('recovery_enrollments')
      .select('*, recovery_offers(*)')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false });

    if (!include_history) {
      query = query.in('status', ['active', 'paused']);
    }

    const { data: enrollments, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Get session logs for active enrollments
    const activeIds = (enrollments || [])
      .filter(e => e.status === 'active')
      .map(e => e.protocol_id)
      .filter(Boolean);

    let sessionLogs = [];
    if (activeIds.length > 0) {
      const { data: logs } = await supabase
        .from('service_logs')
        .select('id, entry_date, category, duration, administered_by, created_at')
        .in('protocol_id', activeIds)
        .in('category', ['hbot', 'red_light'])
        .order('entry_date', { ascending: false })
        .limit(50);
      sessionLogs = logs || [];
    }

    return res.status(200).json({
      enrollments: enrollments || [],
      session_logs: sessionLogs,
    });

  } catch (error) {
    console.error('Recovery status error:', error);
    return res.status(500).json({ error: error.message });
  }
}
