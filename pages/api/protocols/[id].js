// /pages/api/protocols/[id].js
// Protocol API - Get, Update, Delete protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID is required' });
  }

  // GET - Fetch protocol details
  if (req.method === 'GET') {
    try {
      // Get protocol with patient info
      const { data: protocol, error } = await supabase
        .from('protocols')
        .select(`
          *,
          patients (
            id,
            name,
            phone,
            email,
            ghl_contact_id
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get protocol logs
      const { data: logs } = await supabase
        .from('protocol_logs')
        .select('*')
        .eq('protocol_id', id)
        .order('log_date', { ascending: false });

      // Format response with patient name
      const formattedProtocol = {
        ...protocol,
        patient_name: protocol.patients?.name || protocol.patient_name || 'Unknown Patient',
        patient_email: protocol.patients?.email || protocol.patient_email,
        patient_phone: protocol.patients?.phone || protocol.patient_phone,
        ghl_contact_id: protocol.patients?.ghl_contact_id || protocol.ghl_contact_id
      };

      return res.status(200).json({
        protocol: formattedProtocol,
        logs: logs || []
      });

    } catch (error) {
      console.error('Get protocol error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // PUT - Update protocol
  if (req.method === 'PUT') {
    try {
      const updates = req.body;
      
      // Build update object
      const updateData = {};
      
      if (updates.medication !== undefined) updateData.medication = updates.medication;
      if (updates.selected_dose !== undefined) updateData.selected_dose = updates.selected_dose;
      if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
      if (updates.delivery_method !== undefined) updateData.delivery_method = updates.delivery_method;
      if (updates.start_date !== undefined) updateData.start_date = updates.start_date;
      if (updates.end_date !== undefined) updateData.end_date = updates.end_date;
      if (updates.duration_days !== undefined) updateData.duration_days = updates.duration_days;
      if (updates.total_sessions !== undefined) updateData.total_sessions = updates.total_sessions;
      if (updates.sessions_used !== undefined) updateData.sessions_used = updates.sessions_used;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('protocols')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ protocol: data });

    } catch (error) {
      console.error('Update protocol error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Remove protocol
  if (req.method === 'DELETE') {
    try {
      // First delete any protocol logs
      await supabase
        .from('protocol_logs')
        .delete()
        .eq('protocol_id', id);

      // Then delete the protocol
      const { error } = await supabase
        .from('protocols')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error('Delete protocol error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
