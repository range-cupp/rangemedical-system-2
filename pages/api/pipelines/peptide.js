// /pages/api/pipelines/peptide.js
// Peptide Pipeline API - Returns all peptide protocols with calculated fields
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all peptide protocols with patient info
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_type,
        program_name,
        medication,
        selected_dose,
        frequency,
        delivery_method,
        start_date,
        end_date,
        status,
        notes,
        created_at,
        patients (
          id,
          name,
          ghl_contact_id
        )
      `)
      .eq('program_type', 'peptide')
      .order('end_date', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch protocols' });
    }

    // Get last check-in for each protocol (if any)
    const protocolIds = protocols.map(p => p.id);
    
    const { data: logs, error: logsError } = await supabase
      .from('protocol_logs')
      .select('protocol_id, log_date')
      .in('protocol_id', protocolIds)
      .order('log_date', { ascending: false });

    // Create a map of last check-in by protocol
    const lastCheckinMap = {};
    if (logs) {
      logs.forEach(log => {
        if (!lastCheckinMap[log.protocol_id]) {
          lastCheckinMap[log.protocol_id] = log.log_date;
        }
      });
    }

    // Calculate fields for each protocol
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const enrichedProtocols = protocols.map(p => {
      const startDate = p.start_date ? new Date(p.start_date) : null;
      const endDate = p.end_date ? new Date(p.end_date) : null;
      
      // Calculate days remaining
      let daysRemaining = null;
      if (endDate) {
        const diffTime = endDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate days since start
      let daysSinceStart = null;
      if (startDate) {
        const diffTime = now.getTime() - startDate.getTime();
        daysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Determine if completed
      const isCompleted = p.status === 'completed' || (daysRemaining !== null && daysRemaining <= 0);

      return {
        id: p.id,
        patient_id: p.patient_id,
        patient_name: p.patients?.name || 'Unknown',
        ghl_contact_id: p.patients?.ghl_contact_id || null,
        program_name: p.program_name,
        medication: p.medication,
        selected_dose: p.selected_dose,
        frequency: p.frequency,
        delivery_method: p.delivery_method || 'take_home',
        start_date: p.start_date,
        end_date: p.end_date,
        days_remaining: daysRemaining,
        days_since_start: daysSinceStart,
        status: isCompleted ? 'completed' : 'active',
        last_checkin: lastCheckinMap[p.id] || null,
        notes: p.notes,
        created_at: p.created_at
      };
    });

    // Sort: active protocols first (by days remaining), then completed
    enrichedProtocols.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return (a.days_remaining || 999) - (b.days_remaining || 999);
    });

    return res.status(200).json({
      success: true,
      protocols: enrichedProtocols,
      total: enrichedProtocols.length,
      active: enrichedProtocols.filter(p => p.status !== 'completed').length,
      completed: enrichedProtocols.filter(p => p.status === 'completed').length
    });

  } catch (err) {
    console.error('Pipeline error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
