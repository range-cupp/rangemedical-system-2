// GET /api/protocols/renewals
// Returns active protocols that are due or nearly due for renewal
// Optional query param: ?patient_ids=uuid1,uuid2 to filter by specific patients

import { createClient } from '@supabase/supabase-js';
import { getProtocolTracking, getRenewalStatus } from '../../../lib/protocol-tracking';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { patient_ids } = req.query;

    let query = supabase
      .from('protocols')
      .select('id, patient_id, patient_name, program_name, program_type, medication, status, start_date, end_date, total_sessions, sessions_used, last_refill_date, delivery_method, supply_type, selected_dose, dose_per_injection, injections_per_week, frequency')
      .eq('status', 'active');

    // Filter by patient IDs if provided
    if (patient_ids) {
      const ids = patient_ids.split(',').filter(Boolean);
      if (ids.length > 0) {
        query = query.in('patient_id', ids);
      }
    }

    const { data: protocols, error } = await query;

    if (error) {
      console.error('Renewals query error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Resolve missing patient names from patients table
    const missingNameIds = [...new Set(
      (protocols || []).filter(p => !p.patient_name && p.patient_id).map(p => p.patient_id)
    )];
    let patientNameMap = {};
    if (missingNameIds.length > 0) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name')
        .in('id', missingNameIds);
      if (patients) {
        patients.forEach(p => { patientNameMap[p.id] = p.name; });
      }
    }

    // Compute tracking and renewal status for each protocol
    const renewals = (protocols || [])
      .map(protocol => {
        const tracking = getProtocolTracking(protocol);
        const renewal = getRenewalStatus(protocol);

        if (renewal.renewal_status === 'none') return null;

        return {
          protocol_id: protocol.id,
          patient_id: protocol.patient_id,
          patient_name: protocol.patient_name || patientNameMap[protocol.patient_id] || 'Unknown',
          program_name: protocol.program_name,
          program_type: protocol.program_type,
          medication: protocol.medication,
          renewal_status: renewal.renewal_status,
          renewal_label: renewal.renewal_label,
          renewal_urgency_color: renewal.renewal_urgency_color,
          tracking: {
            status_text: tracking.status_text,
            sessions_used: tracking.sessions_used,
            total_sessions: tracking.total_sessions,
            sessions_remaining: tracking.sessions_remaining,
            days_remaining: tracking.days_remaining,
            tracking_type: tracking.tracking_type,
          },
        };
      })
      .filter(Boolean)
      // Sort: renewal_due first, then renewal_soon
      .sort((a, b) => {
        if (a.renewal_status === 'renewal_due' && b.renewal_status !== 'renewal_due') return -1;
        if (a.renewal_status !== 'renewal_due' && b.renewal_status === 'renewal_due') return 1;
        return 0;
      });

    return res.status(200).json({ renewals });
  } catch (error) {
    console.error('Renewals error:', error);
    return res.status(500).json({ error: error.message });
  }
}
