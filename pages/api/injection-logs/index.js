// /pages/api/injection-logs/index.js
// Fetch all injection logs with patient names, create new logs
// Range Medical - 2026-01-28 - Fixed version

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
        quantity
      } = req.body;

      if (!patient_id) {
        return res.status(400).json({ success: false, error: 'Patient ID required' });
      }

      // Build log data - only include fields that exist in the table
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
        site: site || null
      };

      // Create the log entry
      const { data: logEntry, error: logError } = await supabase
        .from('injection_logs')
        .insert([logData])
        .select()
        .single();

      if (logError) {
        console.error('Log insert error:', logError);
        throw logError;
      }

      // If this is an HRT pickup, update the protocol
      if (protocol_id && entry_type === 'pickup') {
        const protocolUpdate = {
          last_refill_date: entry_date || new Date().toISOString().split('T')[0]
        };
        
        // Only add supply_type if provided
        if (supply_type) {
          protocolUpdate.supply_type = supply_type;
        }

        const { error: protocolError } = await supabase
          .from('protocols')
          .update(protocolUpdate)
          .eq('id', protocol_id);

        if (protocolError) {
          console.error('Protocol update error (non-fatal):', protocolError);
          // Don't throw - log was created successfully
        }
      }

      // If this is a weight loss or in-clinic injection, increment sessions_used
      if (protocol_id && entry_type === 'injection' && (category === 'weight_loss' || category === 'hrt')) {
        // Direct increment instead of RPC
        const { data: protocol } = await supabase
          .from('protocols')
          .select('sessions_used')
          .eq('id', protocol_id)
          .single();

        if (protocol) {
          const newSessionsUsed = (protocol.sessions_used || 0) + 1;
          await supabase
            .from('protocols')
            .update({ sessions_used: newSessionsUsed })
            .eq('id', protocol_id);
        }
      }

      return res.status(200).json({ success: true, log: logEntry });
    } catch (err) {
      console.error('Error creating log:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
