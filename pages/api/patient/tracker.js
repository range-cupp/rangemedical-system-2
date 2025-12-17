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

  const { token } = req.query;
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

  // POST - Log injection
  if (req.method === 'POST') {
    try {
      const { day } = req.body;
      if (!day) return res.status(400).json({ error: 'Day required' });

      // Check if already logged
      const { data: existing } = await supabase
        .from('injection_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('day_number', day)
        .single();

      if (existing) {
        return res.status(200).json({ message: 'Already logged' });
      }

      const { error: insertError } = await supabase
        .from('injection_logs')
        .insert({
          protocol_id: protocol.id,
          ghl_contact_id: protocol.ghl_contact_id,
          day_number: day,
          logged_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('POST error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Remove injection log
  if (req.method === 'DELETE') {
    try {
      const { day } = req.body;
      if (!day) return res.status(400).json({ error: 'Day required' });

      await supabase
        .from('injection_logs')
        .delete()
        .eq('protocol_id', protocol.id)
        .eq('day_number', day);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('DELETE error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
