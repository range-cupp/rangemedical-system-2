// /pages/api/admin/alerts.js
// Alerts API - Manage At-Risk Patient Alerts
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const password = req.headers['x-admin-password'];
  if (password !== 'range2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - List active alerts
  if (req.method === 'GET') {
    try {
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*, patients(first_name, last_name, phone, email)')
        .eq('status', 'active')
        .order('triggered_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ alerts });
    } catch (error) {
      console.error('Alerts error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // PUT - Update alert status
  if (req.method === 'PUT') {
    try {
      const { id, status, notes } = req.body;

      if (!id || !status) {
        return res.status(400).json({ error: 'id and status required' });
      }

      const updateData = {
        status,
        ...(status === 'acknowledged' && { 
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: 'Staff'
        }),
        ...(status === 'resolved' && {
          resolved_at: new Date().toISOString(),
          resolved_by: 'Staff',
          resolution_notes: notes || null
        })
      };

      const { error } = await supabase
        .from('alerts')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Update alert error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // POST - Create new alert
  if (req.method === 'POST') {
    try {
      const { patient_id, alert_type, message, severity } = req.body;

      if (!patient_id || !alert_type || !message) {
        return res.status(400).json({ error: 'patient_id, alert_type, message required' });
      }

      const { data: alert, error } = await supabase
        .from('alerts')
        .insert({
          patient_id,
          alert_type,
          message,
          severity: severity || 'medium',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ alert });
    } catch (error) {
      console.error('Create alert error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
