// /pages/api/protocols/[id]/logs/index.js
// Protocol Logs API - GET all logs, POST new log
// Range Medical
// UPDATED: 2026-03-17 — Consolidated to service_logs as single source of truth

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  // GET - Get all logs for a protocol (activity from service_logs + system from protocol_logs)
  if (req.method === 'GET') {
    try {
      // Activity logs from service_logs
      const { data: activityLogs, error: slError } = await supabase
        .from('service_logs')
        .select('id, protocol_id, patient_id, entry_date, entry_type, weight, medication, dosage, notes, created_at')
        .eq('protocol_id', id)
        .order('entry_date', { ascending: false });

      // System/audit logs from protocol_logs (drip_email, blood_draw, etc.)
      const { data: systemLogs, error: plError } = await supabase
        .from('protocol_logs')
        .select('*')
        .eq('protocol_id', id)
        .not('log_type', 'in', '("checkin","injection","weigh_in","session","missed","peptide_checkin","refill")')
        .order('log_date', { ascending: false });

      // Normalize and merge
      const normalizedActivity = (activityLogs || []).map(l => ({
        ...l,
        log_date: l.entry_date,
        log_type: l.entry_type,
        source: 'service_logs',
      }));

      const normalizedSystem = (systemLogs || []).map(l => ({
        ...l,
        source: 'protocol_logs',
      }));

      const allLogs = [...normalizedActivity, ...normalizedSystem]
        .sort((a, b) => new Date(b.log_date || b.entry_date) - new Date(a.log_date || a.entry_date));

      return res.status(200).json(allLogs);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // POST - Create new log entry (writes to service_logs)
  if (req.method === 'POST') {
    try {
      const { patient_id, log_date, log_type, weight, notes, logged_by } = req.body;

      if (!log_date) {
        return res.status(400).json({ error: 'Date is required' });
      }

      // Get protocol to derive category
      const { data: protocol } = await supabase
        .from('protocols')
        .select('program_type, medication, selected_dose, sessions_used, total_sessions')
        .eq('id', id)
        .single();

      const programType = (protocol?.program_type || '').toLowerCase();
      let category = 'weight_loss';
      if (programType.includes('hrt') || programType === 'hrt') category = 'testosterone';
      else if (programType === 'peptide') category = 'peptide';
      else if (programType.includes('iv')) category = 'iv_therapy';
      else if (programType.includes('hbot')) category = 'hbot';
      else if (programType.includes('red_light')) category = 'red_light';
      else if (programType.includes('weight')) category = 'weight_loss';

      // Map log_type to entry_type
      const entryType = log_type === 'weigh_in' ? 'weight_check'
        : log_type === 'session' ? 'session'
        : 'injection';

      const { data: log, error: logError } = await supabase
        .from('service_logs')
        .insert({
          protocol_id: id,
          patient_id: patient_id,
          category,
          entry_type: entryType,
          entry_date: log_date,
          medication: protocol?.medication || null,
          dosage: protocol?.selected_dose || null,
          weight: weight ? parseFloat(weight) : null,
          notes: notes || null,
          created_by: logged_by || null,
        })
        .select()
        .single();

      if (logError) {
        console.error('Error creating log:', logError);
        return res.status(500).json({ error: 'Failed to create log', details: logError.message });
      }

      // If this is an injection/session, update the protocol's sessions_used
      if (entryType === 'injection' || entryType === 'session') {
        if (protocol) {
          const newSessionsUsed = (protocol.sessions_used || 0) + 1;
          const updates = {
            sessions_used: newSessionsUsed,
            updated_at: new Date().toISOString()
          };

          if (protocol.total_sessions && newSessionsUsed >= protocol.total_sessions) {
            updates.status = 'completed';
          }

          await supabase
            .from('protocols')
            .update(updates)
            .eq('id', id);
        }
      }

      return res.status(200).json(log);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
