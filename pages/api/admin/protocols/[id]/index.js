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
    const b = req.body;

    try {
      // Build update object — map to actual DB columns only
      const updateData = {};

      if (b.patient_name !== undefined) updateData.patient_name = b.patient_name;
      if (b.patient_phone !== undefined) updateData.patient_phone = b.patient_phone;
      if (b.patient_email !== undefined) updateData.patient_email = b.patient_email;
      if (b.program_name !== undefined) updateData.program_name = b.program_name;
      if (b.program_type !== undefined) updateData.program_type = b.program_type;
      if (b.start_date !== undefined) updateData.start_date = b.start_date;
      if (b.end_date !== undefined) updateData.end_date = b.end_date;
      if (b.total_sessions !== undefined) updateData.total_sessions = b.total_sessions;
      if (b.status !== undefined) updateData.status = b.status;
      if (b.notes !== undefined) updateData.notes = b.notes;
      if (b.checkin_reminder_enabled !== undefined) updateData.checkin_reminder_enabled = b.checkin_reminder_enabled;
      if (b.injection_day !== undefined) updateData.injection_day = b.injection_day;
      if (b.last_payment_date !== undefined) updateData.last_payment_date = b.last_payment_date;
      if (b.hrt_reminders_enabled !== undefined) updateData.hrt_reminders_enabled = b.hrt_reminders_enabled;
      if (b.hrt_reminder_schedule !== undefined) updateData.hrt_reminder_schedule = b.hrt_reminder_schedule;

      // Map old field names → actual DB columns (accept either)
      const med = b.medication ?? b.primary_peptide;
      if (med !== undefined) updateData.medication = med;

      const secMeds = b.secondary_medications ?? b.secondary_medication ?? b.secondary_peptide;
      if (secMeds !== undefined) updateData.secondary_medications = typeof secMeds === 'string' ? secMeds : JSON.stringify(secMeds);

      const dose = b.selected_dose ?? b.dose_amount;
      if (dose !== undefined) updateData.selected_dose = dose;

      const freq = b.frequency ?? b.dose_frequency;
      if (freq !== undefined) updateData.frequency = freq;

      const delivery = b.delivery_method ?? b.injection_location;
      if (delivery !== undefined) updateData.delivery_method = delivery;

      // HRT-specific fields
      if (b.injection_method !== undefined) updateData.injection_method = b.injection_method;
      if (b.supply_type !== undefined) updateData.supply_type = b.supply_type;
      if (b.scheduled_days !== undefined) updateData.scheduled_days = b.scheduled_days;
      if (b.dose_per_injection !== undefined) updateData.dose_per_injection = b.dose_per_injection;
      if (b.injections_per_week !== undefined) updateData.injections_per_week = b.injections_per_week;
      if (b.vial_size !== undefined) updateData.vial_size = b.vial_size;
      if (b.first_followup_weeks !== undefined) updateData.first_followup_weeks = b.first_followup_weeks;

      // Weight loss specific
      if (b.goal_weight !== undefined) updateData.goal_weight = b.goal_weight;

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
