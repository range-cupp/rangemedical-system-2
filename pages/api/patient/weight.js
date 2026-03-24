// /pages/api/patient/weight.js
// Weight tracking API for weight loss protocols (patient portal)
// Range Medical
// UPDATED: 2026-03-17 — Switched from weight_logs to service_logs (single source of truth)

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });

  // Find protocol by access token
  const { data: protocol, error: protocolError } = await supabase
    .from('protocols')
    .select('id, patient_id, ghl_contact_id, start_date, duration_days, program_type, medication, selected_dose')
    .eq('access_token', token)
    .single();

  if (protocolError || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  // GET - Fetch all weight entries for this protocol from service_logs
  if (req.method === 'GET') {
    try {
      const { data: logs, error } = await supabase
        .from('service_logs')
        .select('id, entry_date, weight, notes, created_at')
        .eq('protocol_id', protocol.id)
        .not('weight', 'is', null)
        .order('entry_date', { ascending: true });

      if (error) throw error;

      // Normalize field names for portal compatibility
      const normalizedLogs = (logs || []).map(l => ({
        id: l.id,
        log_date: l.entry_date,
        weight: l.weight,
        notes: l.notes,
        created_at: l.created_at,
      }));

      const stats = calculateWeightStats(normalizedLogs);

      return res.status(200).json({
        logs: normalizedLogs,
        stats,
        protocol_start: protocol.start_date,
        protocol_duration: protocol.duration_days
      });
    } catch (error) {
      console.error('GET weight error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Log weight (upsert into service_logs)
  if (req.method === 'POST') {
    try {
      const { weight, notes, date } = req.body;

      if (!weight) {
        return res.status(400).json({ error: 'Weight required' });
      }

      const logDate = date || todayPacific();

      // Check for existing weight entry on this date
      const { data: existing } = await supabase
        .from('service_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('entry_date', logDate)
        .eq('entry_type', 'weight_check')
        .maybeSingle();

      let result;

      if (existing) {
        // Update existing entry
        const { data, error } = await supabase
          .from('service_logs')
          .update({
            weight: parseFloat(weight),
            notes: notes || null
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new weight check
        const { data, error } = await supabase
          .from('service_logs')
          .insert({
            patient_id: protocol.patient_id,
            protocol_id: protocol.id,
            category: 'weight_loss',
            entry_type: 'weight_check',
            entry_date: logDate,
            medication: protocol.medication || null,
            dosage: protocol.selected_dose || null,
            weight: parseFloat(weight),
            notes: notes || null
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return res.status(200).json({ success: true, log: result });
    } catch (error) {
      console.error('POST weight error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Remove weight log
  if (req.method === 'DELETE') {
    try {
      const { logId } = req.body;

      if (!logId) {
        return res.status(400).json({ error: 'Log ID required' });
      }

      // Verify the log belongs to this protocol
      const { data: log, error: findError } = await supabase
        .from('service_logs')
        .select('id')
        .eq('id', logId)
        .eq('protocol_id', protocol.id)
        .single();

      if (findError || !log) {
        return res.status(404).json({ error: 'Weight log not found' });
      }

      const { error: deleteError } = await supabase
        .from('service_logs')
        .delete()
        .eq('id', logId);

      if (deleteError) throw deleteError;

      return res.status(200).json({ success: true, deleted: logId });
    } catch (error) {
      console.error('DELETE weight error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Calculate weight statistics
function calculateWeightStats(logs) {
  if (!logs || logs.length === 0) {
    return { hasData: false, totalLogs: 0 };
  }

  const weights = logs.map(l => parseFloat(l.weight));
  const stats = {
    hasData: true,
    totalLogs: logs.length,
    startWeight: weights[0],
    currentWeight: weights[weights.length - 1],
    lowestWeight: Math.min(...weights),
    highestWeight: Math.max(...weights),
    totalChange: weights[weights.length - 1] - weights[0],
    averageWeight: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10
  };

  if (logs.length >= 7) {
    const firstWeek = weights.slice(0, Math.min(7, Math.floor(weights.length / 2)));
    const lastWeek = weights.slice(-Math.min(7, Math.floor(weights.length / 2)));
    stats.firstWeekAvg = Math.round((firstWeek.reduce((a, b) => a + b, 0) / firstWeek.length) * 10) / 10;
    stats.lastWeekAvg = Math.round((lastWeek.reduce((a, b) => a + b, 0) / lastWeek.length) * 10) / 10;
    stats.trend = stats.lastWeekAvg < stats.firstWeekAvg ? 'down' : stats.lastWeekAvg > stats.firstWeekAvg ? 'up' : 'stable';
  }

  return stats;
}
