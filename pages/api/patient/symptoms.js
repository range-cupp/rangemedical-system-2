// /pages/api/patient/symptoms.js
// Symptom/Wellness tracking API
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
    .select('id, ghl_contact_id, start_date, duration_days')
    .eq('access_token', token)
    .single();
    
  if (protocolError || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  // GET - Fetch all symptom logs for this protocol
  if (req.method === 'GET') {
    try {
      const { data: logs, error } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('protocol_id', protocol.id)
        .order('log_date', { ascending: true });
        
      if (error) throw error;
      
      // Calculate averages and trends
      const stats = calculateStats(logs || []);
      
      return res.status(200).json({
        logs: logs || [],
        stats,
        protocol_start: protocol.start_date,
        protocol_duration: protocol.duration_days
      });
    } catch (error) {
      console.error('GET symptoms error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Log symptoms for today
  if (req.method === 'POST') {
    try {
      const { energy, pain, sleep, recovery, wellbeing, notes, date } = req.body;
      
      // Validate at least one score provided
      if (!energy && !pain && !sleep && !recovery && !wellbeing) {
        return res.status(400).json({ error: 'At least one score required' });
      }
      
      const logDate = date || new Date().toISOString().split('T')[0];
      
      // Upsert - update if exists, insert if not
      const { data: existing } = await supabase
        .from('symptom_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('log_date', logDate)
        .maybeSingle();
      
      let result;
      
      if (existing) {
        // Update existing log
        const { data, error } = await supabase
          .from('symptom_logs')
          .update({
            energy: energy || null,
            pain: pain || null,
            sleep: sleep || null,
            recovery: recovery || null,
            wellbeing: wellbeing || null,
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
          .from('symptom_logs')
          .insert({
            protocol_id: protocol.id,
            ghl_contact_id: protocol.ghl_contact_id,
            log_date: logDate,
            energy: energy || null,
            pain: pain || null,
            sleep: sleep || null,
            recovery: recovery || null,
            wellbeing: wellbeing || null,
            notes: notes || null
          })
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      return res.status(200).json({ success: true, log: result });
    } catch (error) {
      console.error('POST symptoms error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Calculate statistics from logs
function calculateStats(logs) {
  if (!logs || logs.length === 0) {
    return { 
      hasData: false,
      totalLogs: 0
    };
  }
  
  const metrics = ['energy', 'pain', 'sleep', 'recovery', 'wellbeing'];
  const stats = {
    hasData: true,
    totalLogs: logs.length,
    firstLog: logs[0],
    latestLog: logs[logs.length - 1],
    averages: {},
    changes: {},
    trends: {}
  };
  
  // Calculate averages and changes for each metric
  metrics.forEach(metric => {
    const values = logs.map(l => l[metric]).filter(v => v !== null);
    
    if (values.length > 0) {
      // Average
      stats.averages[metric] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
      
      // Change from first to last (for pain, negative is good)
      if (values.length >= 2) {
        const first = values[0];
        const last = values[values.length - 1];
        const change = last - first;
        
        stats.changes[metric] = {
          value: change,
          percent: first > 0 ? Math.round((change / first) * 100) : 0,
          improved: metric === 'pain' ? change < 0 : change > 0
        };
        
        // Trend (last 3 vs first 3)
        if (values.length >= 6) {
          const firstAvg = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
          const lastAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
          stats.trends[metric] = lastAvg > firstAvg ? 'up' : lastAvg < firstAvg ? 'down' : 'stable';
        }
      }
    }
  });
  
  return stats;
}
