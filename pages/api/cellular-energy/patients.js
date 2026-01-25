// pages/api/cellular-energy/patients.js
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
    // Get active Cellular Energy Reset patients with their progress
    const { data, error } = await supabase
      .from('cellular_energy_progress')
      .select('*')
      .order('last_name', { ascending: true });

    if (error) {
      // If view doesn't exist yet, fall back to direct query
      if (error.code === '42P01') {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('protocols')
          .select(`
            id,
            patient_id,
            start_date,
            end_date,
            status,
            protocol_type,
            patients (
              id,
              first_name,
              last_name,
              email,
              phone
            )
          `)
          .eq('protocol_type', 'cellular_energy_reset')
          .in('status', ['active', 'in_progress']);

        if (fallbackError) throw fallbackError;

        // Transform data
        const patients = fallbackData.map(p => ({
          patient_id: p.patients.id,
          first_name: p.patients.first_name,
          last_name: p.patients.last_name,
          email: p.patients.email,
          phone: p.patients.phone,
          protocol_id: p.id,
          start_date: p.start_date,
          end_date: p.end_date,
          protocol_status: p.status,
          current_week: Math.max(1, Math.min(6, Math.ceil((Date.now() - new Date(p.start_date)) / (7 * 24 * 60 * 60 * 1000)))),
          weeks_completed: 0,
          total_rlt_sessions: 0,
          total_hbot_sessions: 0
        }));

        return res.status(200).json({ patients });
      }
      throw error;
    }

    return res.status(200).json({ patients: data || [] });
  } catch (error) {
    console.error('Error fetching CE patients:', error);
    return res.status(500).json({ error: error.message });
  }
}
