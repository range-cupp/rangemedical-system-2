// /pages/api/patient/weight.js
// Weight tracking API for weight loss protocols
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });
  
  // Find protocol by access token
  const { data: protocol, error: protocolError } = await supabase
    .from('protocols')
    .select('id, ghl_contact_id, start_date, duration_days, program_type')
    .eq('access_token', token)
    .single();
    
  if (protocolError || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  // GET - Fetch all weight logs for this protocol
  if (req.method === 'GET') {
    try {
      const { data: logs, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('protocol_id', protocol.id)
        .order('log_date', { ascending: true });
        
      if (error) throw error;
      
      // Calculate stats
      const stats = calculateWeightStats(logs || []);
      
      return res.status(200).json({
        logs: logs || [],
        stats,
        protocol_start: protocol.start_date,
        protocol_duration: protocol.duration_days
      });
    } catch (error) {
      console.error('GET weight error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Log weight
  if (req.method === 'POST') {
    try {
      const { weight, notes, date } = req.body;
      
      if (!weight) {
        return res.status(400).json({ error: 'Weight required' });
      }
      
      const logDate = date || new Date().toISOString().split('T')[0];
      
      // Upsert - update if exists, insert if not
      const { data: existing } = await supabase
        .from('weight_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('log_date', logDate)
        .maybeSingle();
      
      let result;
      
      if (existing) {
        // Update existing log
        const { data, error } = await supabase
          .from('weight_logs')
          .update({
            weight: parseFloat(weight),
            notes: notes || null
          })
          .eq('id', existing.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Insert new log
        const { data, error } = await supabase
          .from('weight_logs')
          .insert({
            protocol_id: protocol.id,
            ghl_contact_id: protocol.ghl_contact_id,
            log_date: logDate,
            weight: parseFloat(weight),
            notes: notes || null
          })
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      return res.status(200).json({ success: true, log: result });
    } catch (error) {
      console.error('POST weight error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Calculate weight statistics
function calculateWeightStats(logs) {
  if (!logs || logs.length === 0) {
    return { hasData: false, totalLogs: 0 };
  }
  
  const weights = logs.map(l => parseFloat(l.weight));
  const stats = {
    hasData: true,
    totalLogs: logs.length,
    startWeight: weights[0],
    currentWeight: weights[weights.length - 1],
    lowestWeight: Math.min(...weights),
    highestWeight: Math.max(...weights),
    totalChange: weights[weights.length - 1] - weights[0],
    averageWeight: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10
  };
  
  // Calculate weekly averages for trend
  if (logs.length >= 7) {
    const firstWeek = weights.slice(0, Math.min(7, Math.floor(weights.length / 2)));
    const lastWeek = weights.slice(-Math.min(7, Math.floor(weights.length / 2)));
    stats.firstWeekAvg = Math.round((firstWeek.reduce((a, b) => a + b, 0) / firstWeek.length) * 10) / 10;
    stats.lastWeekAvg = Math.round((lastWeek.reduce((a, b) => a + b, 0) / lastWeek.length) * 10) / 10;
    stats.trend = stats.lastWeekAvg < stats.firstWeekAvg ? 'down' : stats.lastWeekAvg > stats.firstWeekAvg ? 'up' : 'stable';
  }
  
  return stats;
}
