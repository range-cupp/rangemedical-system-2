// /pages/api/injection-logs/index.js
// Fetch all injection logs with patient names, create new logs
// Range Medical - 2026-01-28

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET - Fetch logs
  if (req.method === 'GET') {
    try {
      const days = parseInt(req.query.days) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: logs, error } = await supabase
        .from('injection_logs')
        .select(`
          id,
          patient_id,
          protocol_id,
          entry_type,
          entry_date,
          category,
          medication,
          dosage,
          weight,
          notes,
          site,
          supply_type,
          created_at,
          patients (
            id,
            name,
            ghl_contact_id
          )
        `)
        .gte('entry_date', startDate.toISOString().split('T')[0])
        .order('entry_date', { ascending: false });

      if (error) throw error;

      // Format with patient names
      const formattedLogs = (logs || []).map(log => ({
        ...log,
        patient_name: log.patients?.name || 'Unknown',
        ghl_contact_id: log.patients?.ghl_contact_id
      }));

      return res.status(200).json({ success: true, logs: formattedLogs });
    } catch (err) {
      console.error('Error fetching logs:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST - Create new log
  if (req.method === 'POST') {
    try {
      const {
        patient_id,
        protocol_id,
        entry_type,
        entry_date,
        category,
        medication,
        dosage,
        weight,
        notes,
        site,
        supply_type,
        ghl_contact_id
      } = req.body;

      if (!patient_id) {
        return res.status(400).json({ success: false, error: 'Patient ID required' });
      }

      const logData = {
        patient_id,
        protocol_id: protocol_id || null,
        entry_type: entry_type || 'injection',
        entry_date: entry_date || new Date().toISOString().split('T')[0],
        category: category || null,
        medication: medication || null,
        dosage: dosage || null,
        weight: weight ? parseFloat(weight) : null,
        notes: notes || null,
        site: site || null,
        supply_type: supply_type || null
      };

      const { data, error } = await supabase
        .from('injection_logs')
        .insert([logData])
        .select()
        .single();

      if (error) throw error;

      // If this is a weight loss injection, update the protocol sessions_used
      if (protocol_id && (category === 'weight_loss' || entry_type === 'injection')) {
        await supabase.rpc('increment_sessions_used', { protocol_uuid: protocol_id });
      }

      // If this is an HRT pickup, update last_refill_date
      if (protocol_id && entry_type === 'pickup') {
        await supabase
          .from('protocols')
          .update({ 
            last_refill_date: entry_date,
            supply_type: supply_type || undefined
          })
          .eq('id', protocol_id);
      }

      return res.status(200).json({ success: true, log: data });
    } catch (err) {
      console.error('Error creating log:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
