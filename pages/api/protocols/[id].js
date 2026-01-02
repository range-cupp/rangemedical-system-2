// /pages/api/protocols/[id].js
// Protocol API - Get and Update protocol with delivery_method support
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
            email
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

      return res.status(200).json({
        protocol: {
          ...protocol,
          patient_name: protocol.patients?.name || protocol.patient_name || 'Unknown'
        },
        logs: logs || []
      });

    } catch (error) {
      console.error('Error fetching protocol:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // PUT - Update protocol
  if (req.method === 'PUT') {
    try {
      const {
        medication,
        selected_dose,
        frequency,
        delivery_method,
        start_date,
        end_date,
        status,
        notes,
        sessions_used,
        total_sessions
      } = req.body;

      const updates = {};

      // Only add fields that were provided
      if (medication !== undefined) updates.medication = medication || null;
      if (selected_dose !== undefined) updates.selected_dose = selected_dose || null;
      if (frequency !== undefined) updates.frequency = frequency || null;
      if (delivery_method !== undefined) updates.delivery_method = delivery_method || null;
      if (start_date !== undefined) updates.start_date = start_date || null;
      if (end_date !== undefined) updates.end_date = end_date || null;
      if (status !== undefined) updates.status = status;
      if (notes !== undefined) updates.notes = notes || null;
      if (sessions_used !== undefined && sessions_used !== '' && sessions_used !== null) {
        updates.sessions_used = parseInt(sessions_used) || 0;
      }
      if (total_sessions !== undefined && total_sessions !== '' && total_sessions !== null) {
        updates.total_sessions = parseInt(total_sessions) || 0;
      }

      updates.updated_at = new Date().toISOString();

      console.log('Updating protocol:', id, updates);

      const { data, error } = await supabase
        .from('protocols')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ success: true, protocol: data });

    } catch (error) {
      console.error('Error updating protocol:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
