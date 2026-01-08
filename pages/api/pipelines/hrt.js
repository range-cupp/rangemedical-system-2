// /pages/api/pipelines/hrt.js
// HRT Pipeline API - Returns all HRT protocols with calculated fields
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
    // Get all HRT protocols with patient info
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
        supply_type,
        start_date,
        end_date,
        status,
        notes,
        labs_completed,
        baseline_labs_date,
        eight_week_labs_date,
        last_labs_date,
        created_at,
        patients (
          id,
          name,
          ghl_contact_id
        )
      `)
      .or('program_type.eq.hrt,program_type.ilike.%hrt%,program_name.ilike.%hrt%')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch protocols' });
    }

    // Get protocol logs for injection history
    const protocolIds = protocols.map(p => p.id);
    
    const { data: logs, error: logsError } = await supabase
      .from('protocol_logs')
      .select('protocol_id, log_date, log_type, notes')
      .in('protocol_id', protocolIds)
      .order('log_date', { ascending: false });

    // Create maps for last injection and refill dates
    const lastInjectionMap = {};
    const lastRefillMap = {};
    const injectionCountMap = {};
    
    if (logs) {
      logs.forEach(log => {
        // Track last injection
        if ((log.log_type === 'injection' || log.log_type === 'session') && !lastInjectionMap[log.protocol_id]) {
          lastInjectionMap[log.protocol_id] = log.log_date;
        }
        
        // Track last refill
        if (log.log_type === 'refill' && !lastRefillMap[log.protocol_id]) {
          lastRefillMap[log.protocol_id] = log.log_date;
        }
        
        // Count injections
        if (log.log_type === 'injection' || log.log_type === 'session') {
          injectionCountMap[log.protocol_id] = (injectionCountMap[log.protocol_id] || 0) + 1;
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
      
      // Days since last refill
      let daysSinceLastRefill = daysSinceStart; // Default to start date
      if (lastRefillMap[p.id]) {
        const lastRefill = new Date(lastRefillMap[p.id]);
        const diffTime = now.getTime() - lastRefill.getTime();
        daysSinceLastRefill = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
      
      // Parse HRT type and supply type from program_name/medication
      let hrtType = 'male';
      let supplyType = p.supply_type || 'prefilled';
      
      const programNameLower = (p.program_name || '').toLowerCase();
      const medicationLower = (p.medication || '').toLowerCase();
      
      if (programNameLower.includes('female') || medicationLower.includes('female')) {
        hrtType = 'female';
      }
      
      // Only guess from name if not in database
      if (!p.supply_type) {
        if (programNameLower.includes('vial') || medicationLower.includes('vial')) {
          supplyType = 'vial';
        }
      }
      
      // Check if 8-week labs completed
      const labsCompleted = p.labs_completed || false;

      return {
        id: p.id,
        patient_id: p.patient_id,
        patient_name: p.patients?.name || 'Unknown',
        ghl_contact_id: p.patients?.ghl_contact_id || null,
        program_name: p.program_name,
        medication: p.medication,
        hrt_type: hrtType,
        supply_type: supplyType,
        current_dose: p.selected_dose || '0.3ml/60mg',
        delivery_method: p.delivery_method || 'take_home',
        start_date: p.start_date,
        last_refill_date: lastRefillMap[p.id] || p.start_date,
        days_since_start: daysSinceStart,
        days_since_last_refill: daysSinceLastRefill,
        total_injections: injectionCountMap[p.id] || 0,
        labs_completed: labsCompleted,
        baseline_labs_date: p.baseline_labs_date || null,
        eight_week_labs_date: p.eight_week_labs_date || null,
        last_labs_date: p.last_labs_date || null,
        status: p.status || 'active',
        notes: p.notes,
        created_at: p.created_at
      };
    });

    // Sort by urgency (labs due first, then refill needed, then new patients)
    enrichedProtocols.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      // Labs due is highest priority
      const aLabsDue = !a.labs_completed && a.days_since_start >= 42 && a.days_since_start <= 70;
      const bLabsDue = !b.labs_completed && b.days_since_start >= 42 && b.days_since_start <= 70;
      if (aLabsDue && !bLabsDue) return -1;
      if (!aLabsDue && bLabsDue) return 1;
      
      return (a.days_since_last_refill || 0) - (b.days_since_last_refill || 0);
    });

    return res.status(200).json({
      success: true,
      protocols: enrichedProtocols,
      total: enrichedProtocols.length
    });

  } catch (err) {
    console.error('Pipeline error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
