// /pages/api/patient/preferences.js
// Patient Preferences API (reminder time, etc.)
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });
  
  // Find protocol by access token
  const { data: protocol, error: protocolError } = await supabase
    .from('protocols')
    .select('id, reminders_enabled, preferred_reminder_time')
    .eq('access_token', token)
    .single();
    
  if (protocolError || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  // GET - Get current preferences
  if (req.method === 'GET') {
    return res.status(200).json({
      reminders_enabled: protocol.reminders_enabled,
      preferred_reminder_time: protocol.preferred_reminder_time || '18:30'
    });
  }

  // PUT - Update preferences
  if (req.method === 'PUT') {
    try {
      const { reminders_enabled, preferred_reminder_time } = req.body;
      
      const updates = {};
      
      if (typeof reminders_enabled === 'boolean') {
        updates.reminders_enabled = reminders_enabled;
      }
      
      if (preferred_reminder_time) {
        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(preferred_reminder_time)) {
          return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
        }
        updates.preferred_reminder_time = preferred_reminder_time;
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid updates provided' });
      }
      
      const { data, error } = await supabase
        .from('protocols')
        .update(updates)
        .eq('id', protocol.id)
        .select('reminders_enabled, preferred_reminder_time')
        .single();
        
      if (error) throw error;
      
      return res.status(200).json({ 
        success: true, 
        reminders_enabled: data.reminders_enabled,
        preferred_reminder_time: data.preferred_reminder_time
      });
    } catch (error) {
      console.error('PUT preferences error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
