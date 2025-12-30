// /pages/api/patients/index.js
// Patients List API - Search and list patients

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { search, limit = 50, offset = 0 } = req.query;

  try {
    let query = supabase
      .from('patients')
      .select(`
        id,
        ghl_contact_id,
        first_name,
        last_name,
        email,
        phone,
        created_at
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: patients, error, count } = await query;

    if (error) throw error;

    // Get pending notification counts for each patient
    const patientIds = patients.map(p => p.id);
    const { data: notifications } = await supabase
      .from('purchase_notifications')
      .select('patient_id')
      .in('patient_id', patientIds)
      .eq('status', 'pending');

    // Count notifications per patient
    const notificationCounts = {};
    notifications?.forEach(n => {
      notificationCounts[n.patient_id] = (notificationCounts[n.patient_id] || 0) + 1;
    });

    // Get active protocol counts
    const { data: protocols } = await supabase
      .from('patient_protocols')
      .select('patient_id')
      .in('patient_id', patientIds)
      .eq('status', 'active');

    const protocolCounts = {};
    protocols?.forEach(p => {
      protocolCounts[p.patient_id] = (protocolCounts[p.patient_id] || 0) + 1;
    });

    // Enrich patients with counts
    const enrichedPatients = patients.map(p => ({
      ...p,
      pendingNotifications: notificationCounts[p.id] || 0,
      activeProtocols: protocolCounts[p.id] || 0
    }));

    return res.status(200).json({
      patients: enrichedPatients,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ error: error.message });
  }
}
