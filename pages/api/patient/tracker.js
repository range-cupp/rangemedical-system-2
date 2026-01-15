// /pages/api/patient/tracker.js
// Patient Tracker API - includes questionnaire data
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Get token from query OR body
  const token = req.query.token || req.body?.token;
  if (!token) return res.status(400).json({ error: 'Token required' });
  
  // Find protocol by access token
  const { data: protocol, error: protocolError } = await supabase
    .from('protocols')
    .select('*')
    .eq('access_token', token)
    .single();
    
  if (protocolError || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  // GET - Fetch protocol data, injection logs, and questionnaires
  if (req.method === 'GET') {
    try {
      // Get injection logs
      const { data: injectionLogs } = await supabase
        .from('injection_logs')
        .select('*')
        .eq('protocol_id', protocol.id)
        .order('day_number', { ascending: true });
        
      // Get intake questionnaire
      const { data: intakeQuestionnaire } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('protocol_id', protocol.id)
        .eq('questionnaire_type', 'intake')
        .single();
        
      // Get completion questionnaire
      const { data: completionQuestionnaire } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('protocol_id', protocol.id)
        .eq('questionnaire_type', 'completion')
        .single();
        
      return res.status(200).json({
        protocol,
        injectionLogs: injectionLogs || [],
        intakeQuestionnaire: intakeQuestionnaire || null,
        completionQuestionnaire: completionQuestionnaire || null
      });
    } catch (error) {
      console.error('GET error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Log or remove injection
  if (req.method === 'POST') {
    try {
      const { day, day_number, action } = req.body;
      const dayValue = day_number ?? day;
      if (dayValue === undefined && dayValue !== 0) return res.status(400).json({ error: 'Day required' });
      
      const dayNumber = parseInt(dayValue);
      
      // Handle removal
      if (action === 'remove') {
        const { error: deleteError } = await supabase
          .from('injection_logs')
          .delete()
          .eq('protocol_id', protocol.id)
          .eq('day_number', dayNumber);
          
        if (deleteError) {
          console.error('Delete error:', deleteError);
          return res.status(500).json({ error: deleteError.message });
        }
        
        // Update count
        const { data: logs } = await supabase
          .from('injection_logs')
          .select('id')
          .eq('protocol_id', protocol.id);
          
        await supabase
          .from('protocols')
          .update({ 
            injections_completed: logs?.length || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', protocol.id);
          
        return res.status(200).json({ success: true, action: 'removed' });
      }
      
      // Check if already logged
      const { data: existing } = await supabase
        .from('injection_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('day_number', dayNumber)
        .maybeSingle();
        
      if (existing) {
        return res.status(200).json({ message: 'Already logged', existing: true });
      }
      
      // Insert new log - using correct column names
      const { data: newLog, error: insertError } = await supabase
        .from('injection_logs')
        .insert({
          protocol_id: protocol.id,
          day_number: dayNumber,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: insertError.message, details: insertError });
      }
      
      // Update injections_completed count on protocol
      const { data: logs } = await supabase
        .from('injection_logs')
        .select('id')
        .eq('protocol_id', protocol.id);
        
      await supabase
        .from('protocols')
        .update({ 
          injections_completed: logs?.length || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', protocol.id);
      
      return res.status(200).json({ success: true, log: newLog });
    } catch (error) {
      console.error('POST error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Remove injection log
  if (req.method === 'DELETE') {
    try {
      const { day } = req.body;
      if (!day && day !== 0) return res.status(400).json({ error: 'Day required' });
      
      const dayNumber = parseInt(day);
      
      const { error: deleteError } = await supabase
        .from('injection_logs')
        .delete()
        .eq('protocol_id', protocol.id)
        .eq('day_number', dayNumber);
        
      if (deleteError) {
        console.error('Delete error:', deleteError);
        return res.status(500).json({ error: deleteError.message });
      }
      
      // Update injections_completed count on protocol
      const { data: logs } = await supabase
        .from('injection_logs')
        .select('id')
        .eq('protocol_id', protocol.id);
        
      await supabase
        .from('protocols')
        .update({ 
          injections_completed: logs?.length || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', protocol.id);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('DELETE error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
