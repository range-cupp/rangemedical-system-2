// pages/api/cellular-energy/checkin.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET: Fetch check-ins for a patient
  if (req.method === 'GET') {
    const { patient_id } = req.query;

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id required' });
    }

    try {
      const { data, error } = await supabase
        .from('cellular_energy_checkins')
        .select('*')
        .eq('patient_id', patient_id)
        .order('week_number', { ascending: true });

      if (error) throw error;

      return res.status(200).json({ checkins: data || [] });
    } catch (error) {
      console.error('Error fetching checkins:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST: Save or update a check-in
  if (req.method === 'POST') {
    const {
      patient_id,
      protocol_id,
      week_number,
      energy_level,
      sleep_quality,
      recovery,
      mental_clarity,
      rlt_sessions_completed,
      hbot_sessions_completed,
      notes,
      recorded_by
    } = req.body;

    // Validate required fields
    if (!patient_id || !week_number) {
      return res.status(400).json({ error: 'patient_id and week_number required' });
    }

    if (week_number < 1 || week_number > 6) {
      return res.status(400).json({ error: 'week_number must be 1-6' });
    }

    try {
      // Upsert (insert or update if exists)
      const { data, error } = await supabase
        .from('cellular_energy_checkins')
        .upsert({
          patient_id,
          protocol_id,
          week_number,
          energy_level,
          sleep_quality,
          recovery,
          mental_clarity,
          rlt_sessions_completed: rlt_sessions_completed || 0,
          hbot_sessions_completed: hbot_sessions_completed || 0,
          notes,
          recorded_by,
          recorded_at: new Date().toISOString()
        }, {
          onConflict: 'patient_id,week_number',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ success: true, checkin: data });
    } catch (error) {
      console.error('Error saving checkin:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
