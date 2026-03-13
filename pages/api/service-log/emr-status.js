// /pages/api/service-log/emr-status.js
// API for managing EMR entry status on service log entries
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET: Fetch pending EMR entries (weight loss check-ins not yet entered)
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('service_logs')
        .select('id, patient_id, protocol_id, category, entry_date, medication, dosage, weight, notes, created_at, patients(id, name, first_name, last_name)')
        .eq('category', 'weight_loss')
        .eq('emr_entered', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ pending: data || [] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH: Mark a service log entry as EMR entered
  if (req.method === 'PATCH') {
    try {
      const { id, emr_entered } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Service log ID required' });
      }

      const { data, error } = await supabase
        .from('service_logs')
        .update({ emr_entered: emr_entered !== false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
