// /pages/api/pipelines/weight-loss.js
// Weight Loss Pipeline API - Returns all WL protocols with calculated fields
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
    // Get all weight loss protocols with patient info
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_type,
        program_name,
        medication,
        selected_dose,
        delivery_method,
        start_date,
        end_date,
        status,
        total_injections,
        injections_used,
        starting_weight,
        notes,
        created_at,
        patients (
          id,
          name,
          ghl_contact_id
        )
      `)
      .eq('program_type', 'weight_loss')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch protocols' });
    }

    // Get protocol logs for last check-in dates and current weights
    const protocolIds = protocols.map(p => p.id);
    
    const { data: logs, error: logsError } = await supabase
      .from('protocol_logs')
      .select('protocol_id, log_date, weight, log_type')
      .in('protocol_id', protocolIds)
      .order('log_date', { ascending: false });

    // Create maps for last activity and current weight
    const lastCheckinMap = {};
    const lastInjectionMap = {};
    const currentWeightMap = {};
    
    if (logs) {
      logs.forEach(log => {
        // Track last check-in (patient self-report)
        if (log.log_type === 'checkin' && !lastCheckinMap[log.protocol_id]) {
          lastCheckinMap[log.protocol_id] = log.log_date;
        }
        
        // Track last injection (staff logged)
        if ((log.log_type === 'injection' || log.log_type === 'session') && !lastInjectionMap[log.protocol_id]) {
          lastInjectionMap[log.protocol_id] = log.log_date;
        }
        
        // Track current weight (most recent weight from any log)
        if (log.weight && !currentWeightMap[log.protocol_id]) {
          currentWeightMap[log.protocol_id] = log.weight;
        }
      });
    }

    // Calculate fields for each protocol
    const now = new Date();
    
    const enrichedProtocols = protocols.map(p => {
      const startDate = p.start_date ? new Date(p.start_date) : null;
      
      // Days since start
      let daysSinceStart = null;
      if (startDate) {
        const diffTime = now.getTime() - startDate.getTime();
        daysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
      
      // Days since last check-in
      let daysSinceLastCheckin = null;
      if (lastCheckinMap[p.id]) {
        const lastCheckin = new Date(lastCheckinMap[p.id]);
        const diffTime = now.getTime() - lastCheckin.getTime();
        daysSinceLastCheckin = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
      
      // Days since last injection
      let daysSinceLastInjection = null;
      if (lastInjectionMap[p.id]) {
        const lastInjection = new Date(lastInjectionMap[p.id]);
        const diffTime = now.getTime() - lastInjection.getTime();
        daysSinceLastInjection = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
      
      // Determine last activity date
      const lastCheckinDate = lastCheckinMap[p.id] ? new Date(lastCheckinMap[p.id]) : null;
      const lastInjectionDate = lastInjectionMap[p.id] ? new Date(lastInjectionMap[p.id]) : null;
      let lastActivity = null;
      
      if (lastCheckinDate && lastInjectionDate) {
        lastActivity = lastCheckinDate > lastInjectionDate ? lastCheckinMap[p.id] : lastInjectionMap[p.id];
      } else {
        lastActivity = lastCheckinMap[p.id] || lastInjectionMap[p.id];
      }
      
      // Injections
      const totalInjections = p.total_injections || 0;
      const injectionsUsed = p.injections_used || 0;
      const injectionsRemaining = totalInjections - injectionsUsed;
      
      // Completion status
      const isCompleted = p.status === 'completed' || injectionsRemaining <= 0;

      return {
        id: p.id,
        patient_id: p.patient_id,
        patient_name: p.patients?.name || 'Unknown',
        ghl_contact_id: p.patients?.ghl_contact_id || null,
        program_name: p.program_name,
        medication: p.medication,
        current_dose: p.selected_dose,
        delivery_method: p.delivery_method || 'take_home',
        start_date: p.start_date,
        end_date: p.end_date,
        days_since_start: daysSinceStart,
        days_since_last_checkin: daysSinceLastCheckin,
        days_since_last_injection: daysSinceLastInjection,
        last_activity: lastActivity,
        total_injections: totalInjections,
        injections_used: injectionsUsed,
        injections_remaining: injectionsRemaining,
        starting_weight: p.starting_weight,
        current_weight: currentWeightMap[p.id] || null,
        status: isCompleted ? 'completed' : 'active',
        notes: p.notes,
        created_at: p.created_at
      };
    });

    // Sort: active first, then by days since last activity
    enrichedProtocols.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      // For active, sort by most overdue first
      const aDays = a.delivery_method === 'in_clinic' ? a.days_since_last_injection : a.days_since_last_checkin;
      const bDays = b.delivery_method === 'in_clinic' ? b.days_since_last_injection : b.days_since_last_checkin;
      return (bDays || -1) - (aDays || -1);
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
