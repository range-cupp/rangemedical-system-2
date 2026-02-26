// /pages/api/admin/protocols/[id]/index.js
// Single Protocol API - GET, PUT, DELETE
// Range Medical

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

  // GET - Fetch protocol with sessions
  if (req.method === 'GET') {
    try {
      // Try old protocols table first (most data is here)
      let protocol = null;
      let sessions = [];

      const { data: oldProtocol, error: oldError } = await supabase
        .from('protocols')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (oldProtocol) {
        protocol = oldProtocol;

        // Get injection logs as sessions
        const { data: logs } = await supabase
          .from('injection_logs')
          .select('*')
          .eq('protocol_id', id)
          .order('day_number', { ascending: true });

        // Convert logs to session format
        const totalDays = protocol.total_sessions || protocol.duration_days || protocol.total_days || 10;
        const startDate = protocol.start_date ? new Date(protocol.start_date) : new Date();

        for (let i = 1; i <= totalDays; i++) {
          const log = logs?.find(l => l.day_number === i);
          const sessionDate = new Date(startDate);
          sessionDate.setDate(startDate.getDate() + i - 1);

          sessions.push({
            id: log?.id || `day-${i}`,
            protocol_id: id,
            session_number: i,
            day_number: i,
            scheduled_date: sessionDate.toISOString().split('T')[0],
            status: log?.completed ? 'completed' : 'scheduled',
            completed: log?.completed || false,
            completed_at: log?.completed_at
          });
        }
      }

      if (!protocol) {
        return res.status(404).json({ error: 'Protocol not found' });
      }

      return res.status(200).json({
        protocol,
        sessions
      });

    } catch (error) {
      console.error('Protocol fetch error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // PUT - Update protocol
  if (req.method === 'PUT') {
    const {
      patient_name,
      patient_phone,
      patient_email,
      program_name,
      program_type,
      primary_peptide,
      secondary_peptide,
      dose_amount,
      dose_frequency,
      injection_location,
      start_date,
      end_date,
      duration_days,
      total_sessions,
      status,
      special_instructions,
      notes,
      reminders_enabled
    } = req.body;

    try {
      // Build update object
      const updateData = {};
      
      if (patient_name !== undefined) updateData.patient_name = patient_name;
      if (patient_phone !== undefined) updateData.patient_phone = patient_phone;
      if (patient_email !== undefined) updateData.patient_email = patient_email;
      if (program_name !== undefined) updateData.program_name = program_name;
      if (program_type !== undefined) updateData.program_type = program_type;
      if (primary_peptide !== undefined) updateData.primary_peptide = primary_peptide;
      if (secondary_peptide !== undefined) updateData.secondary_peptide = secondary_peptide;
      if (dose_amount !== undefined) updateData.dose_amount = dose_amount;
      if (dose_frequency !== undefined) updateData.dose_frequency = dose_frequency;
      if (injection_location !== undefined) updateData.injection_location = injection_location;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (end_date !== undefined) updateData.end_date = end_date;
      if (duration_days !== undefined) {
        updateData.duration_days = duration_days;
        updateData.total_days = duration_days; // Keep both in sync
      }
      if (total_sessions !== undefined) updateData.total_sessions = total_sessions;
      if (status !== undefined) updateData.status = status;
      if (special_instructions !== undefined) updateData.special_instructions = special_instructions;
      if (notes !== undefined) updateData.notes = notes;
      if (reminders_enabled !== undefined) updateData.reminders_enabled = reminders_enabled;
      
      updateData.updated_at = new Date().toISOString();

      // Try old table first
      const { data: oldUpdate, error: oldError } = await supabase
        .from('protocols')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (oldUpdate) {
        return res.status(200).json(oldUpdate);
      }

      return res.status(404).json({ error: 'Protocol not found' });

    } catch (error) {
      console.error('Protocol update error:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  // DELETE - Delete protocol
  if (req.method === 'DELETE') {
    try {
      // Unlink purchases
      await supabase
        .from('purchases')
        .update({ protocol_id: null })
        .eq('protocol_id', id);

      // Delete injection logs
      await supabase
        .from('injection_logs')
        .delete()
        .eq('protocol_id', id);

      // Delete from protocols table
      const { error: oldError } = await supabase
        .from('protocols')
        .delete()
        .eq('id', id);

      await supabase
        .from('protocol_sessions')
        .delete()
        .eq('protocol_id', id);

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error('Protocol delete error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
